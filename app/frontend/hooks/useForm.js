/**
 * useForm Hook
 * Form state management with validation support
 */

import { useState, useCallback, useRef, useMemo } from 'react';

/**
 * Form state management hook
 * @param {object} options - Form options
 * @returns {object} Form state and handlers
 */
export function useForm(options = {}) {
  const {
    initialValues = {},
    schema = null,
    onSubmit = null,
    validateOnChange = true,
    validateOnBlur = true,
    resetOnSubmit = false
  } = options;

  // Form state
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);
  const [isSubmitSuccessful, setIsSubmitSuccessful] = useState(false);

  // Refs for tracking
  const initialValuesRef = useRef(initialValues);

  // Check if form is dirty (shallow comparison for better performance)
  const isDirty = useMemo(() => {
    const initial = initialValuesRef.current;
    const keys = new Set([...Object.keys(values), ...Object.keys(initial)]);
    for (const key of keys) {
      if (values[key] !== initial[key]) return true;
    }
    return false;
  }, [values]);

  // Check if form is valid
  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0;
  }, [errors]);

  // Validate single field
  const validateField = useCallback((name, value) => {
    if (!schema) return null;

    const result = schema.validateField(name, value, values);
    return result.error;
  }, [schema, values]);

  // Validate all fields
  const validateAllFields = useCallback(() => {
    if (!schema) return { valid: true, errors: {} };

    const result = schema.validate(values);
    setErrors(result.errors);
    return result;
  }, [schema, values]);

  // Set field value
  const setValue = useCallback((name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));

    // Validate on change
    if (validateOnChange && schema) {
      const error = validateField(name, value);
      setErrors((prev) => {
        if (error) {
          return { ...prev, [name]: error };
        } else {
          const { [name]: _, ...rest } = prev;
          return rest;
        }
      });
    }
  }, [validateOnChange, schema, validateField]);

  // Handle input change
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    setValue(name, fieldValue);
  }, [setValue]);

  // Handle blur
  const handleBlur = useCallback((e) => {
    const { name, value } = e.target;

    // Mark as touched
    setTouched((prev) => ({ ...prev, [name]: true }));

    // Validate on blur
    if (validateOnBlur && schema) {
      const error = validateField(name, value);
      setErrors((prev) => {
        if (error) {
          return { ...prev, [name]: error };
        } else {
          const { [name]: _, ...rest } = prev;
          return rest;
        }
      });
    }
  }, [validateOnBlur, schema, validateField]);

  // Set error for field
  const setFieldError = useCallback((name, error) => {
    setErrors((prev) => {
      if (error) {
        return { ...prev, [name]: error };
      } else {
        const { [name]: _, ...rest } = prev;
        return rest;
      }
    });
  }, []);

  // Clear all errors
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  // Reset form
  const reset = useCallback((newValues = initialValuesRef.current) => {
    setValues(newValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
    setIsSubmitSuccessful(false);
  }, []);

  // Handle form submit
  const handleSubmit = useCallback((e) => {
    if (e) {
      e.preventDefault();
    }

    // Mark all fields as touched
    const allTouched = Object.keys(values).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setTouched(allTouched);

    // Validate all fields
    const validation = validateAllFields();

    if (!validation.valid) {
      setSubmitCount((c) => c + 1);
      return Promise.resolve({ success: false, errors: validation.errors });
    }

    // Call onSubmit if provided
    if (onSubmit) {
      setIsSubmitting(true);
      setSubmitCount((c) => c + 1);

      return Promise.resolve(onSubmit(values))
        .then((result) => {
          setIsSubmitting(false);
          setIsSubmitSuccessful(true);

          if (resetOnSubmit) {
            reset();
          }

          return { success: true, data: result };
        })
        .catch((error) => {
          setIsSubmitting(false);
          setIsSubmitSuccessful(false);

          // Handle field-level errors from server
          if (error.fieldErrors) {
            setErrors((prev) => ({ ...prev, ...error.fieldErrors }));
          }

          return { success: false, error };
        });
    }

    return Promise.resolve({ success: true, values });
  }, [values, validateAllFields, onSubmit, resetOnSubmit, reset]);

  // Get field props helper
  const getFieldProps = useCallback((name, opts = {}) => {
    return {
      name,
      value: values[name] ?? '',
      onChange: handleChange,
      onBlur: handleBlur,
      error: touched[name] && !!errors[name],
      helperText: touched[name] ? errors[name] : '',
      ...opts
    };
  }, [values, handleChange, handleBlur, touched, errors]);

  // Get checkbox props helper
  const getCheckboxProps = useCallback((name) => {
    return {
      name,
      checked: !!values[name],
      onChange: handleChange
    };
  }, [values, handleChange]);

  // Register field (for custom inputs)
  const register = useCallback((name, options = {}) => {
    return {
      name,
      value: values[name] ?? options.defaultValue ?? '',
      onChange: (e) => {
        const value = options.transform
          ? options.transform(e.target.value)
          : e.target.value;
        setValue(name, value);
      },
      onBlur: handleBlur,
      ref: options.ref
    };
  }, [values, setValue, handleBlur]);

  // Watch specific fields
  const watch = useCallback((name) => {
    if (Array.isArray(name)) {
      return name.reduce((acc, n) => {
        acc[n] = values[n];
        return acc;
      }, {});
    }
    return name ? values[name] : values;
  }, [values]);

  // Set multiple values at once
  const setValues_ = useCallback((newValues) => {
    setValues((prev) => ({ ...prev, ...newValues }));
  }, []);

  return {
    // State
    values,
    errors,
    touched,
    isSubmitting,
    submitCount,
    isSubmitSuccessful,
    isDirty,
    isValid,

    // Handlers
    handleChange,
    handleBlur,
    handleSubmit,

    // Setters
    setValue,
    setValues: setValues_,
    setFieldError,
    clearErrors,
    setTouched,

    // Utilities
    reset,
    validateField,
    validateAllFields,
    getFieldProps,
    getCheckboxProps,
    register,
    watch
  };
}

export default useForm;
