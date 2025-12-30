/**
 * Form Validation Utilities
 * Schema-based validation without external dependencies
 */

// Validation error class
export class ValidationError extends Error {
  constructor(field, message, value) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
  }
}

// Common validation patterns
const PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[\d\-+().\s]{10,}$/,
  phoneJapan: /^0\d{1,4}-?\d{1,4}-?\d{4}$/,
  postalCode: /^\d{3}-?\d{4}$/,
  url: /^https?:\/\/.+/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  numeric: /^\d+$/,
  katakana: /^[\u30A0-\u30FF\s]+$/,
  hiragana: /^[\u3040-\u309F\s]+$/
};

// Common error messages
const MESSAGES = {
  required: '{field}は必須です',
  email: '有効なメールアドレスを入力してください',
  phone: '有効な電話番号を入力してください',
  minLength: '{field}は{min}文字以上で入力してください',
  maxLength: '{field}は{max}文字以内で入力してください',
  min: '{field}は{min}以上の値を入力してください',
  max: '{field}は{max}以下の値を入力してください',
  pattern: '{field}の形式が正しくありません',
  match: '{field}が一致しません',
  postalCode: '有効な郵便番号を入力してください（例: 123-4567）',
  url: '有効なURLを入力してください',
  custom: '{field}が無効です'
};

/**
 * Create a validator schema
 */
export function createSchema(fields) {
  return {
    fields,
    validate: (data) => validateSchema({ fields }, data),
    validateField: (fieldName, value, allData) => validateSingleField(fields[fieldName], fieldName, value, allData)
  };
}

/**
 * Field validator builder
 */
export const v = {
  // String validators
  string: (fieldLabel) => new StringValidator(fieldLabel),

  // Number validators
  number: (fieldLabel) => new NumberValidator(fieldLabel),

  // Boolean validators
  boolean: (fieldLabel) => new BooleanValidator(fieldLabel),

  // Array validators
  array: (fieldLabel) => new ArrayValidator(fieldLabel),

  // Custom validator
  custom: (fieldLabel, validator) => new CustomValidator(fieldLabel, validator)
};

/**
 * Base Validator Class
 */
class BaseValidator {
  constructor(fieldLabel) {
    this.fieldLabel = fieldLabel || 'このフィールド';
    this.rules = [];
    this.isOptional = false;
  }

  optional() {
    this.isOptional = true;
    return this;
  }

  required(message) {
    this.rules.push({
      type: 'required',
      message: message || MESSAGES.required.replace('{field}', this.fieldLabel)
    });
    return this;
  }

  custom(validator, message) {
    this.rules.push({
      type: 'custom',
      validator,
      message: message || MESSAGES.custom.replace('{field}', this.fieldLabel)
    });
    return this;
  }

  validate(value, allData = {}) {
    // Handle optional fields
    if (this.isOptional && (value === undefined || value === null || value === '')) {
      return { valid: true, errors: [] };
    }

    const errors = [];

    for (const rule of this.rules) {
      const error = this.checkRule(rule, value, allData);
      if (error) {
        errors.push(error);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  checkRule(rule, value, allData) {
    switch (rule.type) {
      case 'required':
        if (value === undefined || value === null || value === '') {
          return rule.message;
        }
        break;
      case 'custom':
        if (!rule.validator(value, allData)) {
          return rule.message;
        }
        break;
      default:
        return this.checkTypeSpecificRule(rule, value, allData);
    }
    return null;
  }

  checkTypeSpecificRule() {
    return null;
  }
}

/**
 * String Validator
 */
class StringValidator extends BaseValidator {
  minLength(min, message) {
    this.rules.push({
      type: 'minLength',
      min,
      message: message || MESSAGES.minLength.replace('{field}', this.fieldLabel).replace('{min}', min)
    });
    return this;
  }

  maxLength(max, message) {
    this.rules.push({
      type: 'maxLength',
      max,
      message: message || MESSAGES.maxLength.replace('{field}', this.fieldLabel).replace('{max}', max)
    });
    return this;
  }

  email(message) {
    this.rules.push({
      type: 'pattern',
      pattern: PATTERNS.email,
      message: message || MESSAGES.email
    });
    return this;
  }

  phone(message) {
    this.rules.push({
      type: 'pattern',
      pattern: PATTERNS.phone,
      message: message || MESSAGES.phone
    });
    return this;
  }

  phoneJapan(message) {
    this.rules.push({
      type: 'pattern',
      pattern: PATTERNS.phoneJapan,
      message: message || MESSAGES.phone
    });
    return this;
  }

  postalCode(message) {
    this.rules.push({
      type: 'pattern',
      pattern: PATTERNS.postalCode,
      message: message || MESSAGES.postalCode
    });
    return this;
  }

  url(message) {
    this.rules.push({
      type: 'pattern',
      pattern: PATTERNS.url,
      message: message || MESSAGES.url
    });
    return this;
  }

  pattern(regex, message) {
    this.rules.push({
      type: 'pattern',
      pattern: regex,
      message: message || MESSAGES.pattern.replace('{field}', this.fieldLabel)
    });
    return this;
  }

  matches(fieldName, message) {
    this.rules.push({
      type: 'matches',
      fieldName,
      message: message || MESSAGES.match.replace('{field}', this.fieldLabel)
    });
    return this;
  }

  checkTypeSpecificRule(rule, value, allData) {
    const strValue = String(value || '');

    switch (rule.type) {
      case 'minLength':
        if (strValue.length < rule.min) {
          return rule.message;
        }
        break;
      case 'maxLength':
        if (strValue.length > rule.max) {
          return rule.message;
        }
        break;
      case 'pattern':
        if (!rule.pattern.test(strValue)) {
          return rule.message;
        }
        break;
      case 'matches':
        if (strValue !== allData[rule.fieldName]) {
          return rule.message;
        }
        break;
    }
    return null;
  }
}

/**
 * Number Validator
 */
class NumberValidator extends BaseValidator {
  min(min, message) {
    this.rules.push({
      type: 'min',
      min,
      message: message || MESSAGES.min.replace('{field}', this.fieldLabel).replace('{min}', min)
    });
    return this;
  }

  max(max, message) {
    this.rules.push({
      type: 'max',
      max,
      message: message || MESSAGES.max.replace('{field}', this.fieldLabel).replace('{max}', max)
    });
    return this;
  }

  integer(message) {
    this.rules.push({
      type: 'integer',
      message: message || `${this.fieldLabel}は整数で入力してください`
    });
    return this;
  }

  positive(message) {
    this.rules.push({
      type: 'positive',
      message: message || `${this.fieldLabel}は正の数で入力してください`
    });
    return this;
  }

  checkTypeSpecificRule(rule, value) {
    const numValue = Number(value);

    if (isNaN(numValue)) {
      return `${this.fieldLabel}は数値で入力してください`;
    }

    switch (rule.type) {
      case 'min':
        if (numValue < rule.min) {
          return rule.message;
        }
        break;
      case 'max':
        if (numValue > rule.max) {
          return rule.message;
        }
        break;
      case 'integer':
        if (!Number.isInteger(numValue)) {
          return rule.message;
        }
        break;
      case 'positive':
        if (numValue <= 0) {
          return rule.message;
        }
        break;
    }
    return null;
  }
}

/**
 * Boolean Validator
 */
class BooleanValidator extends BaseValidator {
  isTrue(message) {
    this.rules.push({
      type: 'isTrue',
      message: message || `${this.fieldLabel}に同意してください`
    });
    return this;
  }

  checkTypeSpecificRule(rule, value) {
    switch (rule.type) {
      case 'isTrue':
        if (value !== true) {
          return rule.message;
        }
        break;
    }
    return null;
  }
}

/**
 * Array Validator
 */
class ArrayValidator extends BaseValidator {
  minItems(min, message) {
    this.rules.push({
      type: 'minItems',
      min,
      message: message || `${this.fieldLabel}は${min}件以上選択してください`
    });
    return this;
  }

  maxItems(max, message) {
    this.rules.push({
      type: 'maxItems',
      max,
      message: message || `${this.fieldLabel}は${max}件以内で選択してください`
    });
    return this;
  }

  checkTypeSpecificRule(rule, value) {
    const arrValue = Array.isArray(value) ? value : [];

    switch (rule.type) {
      case 'minItems':
        if (arrValue.length < rule.min) {
          return rule.message;
        }
        break;
      case 'maxItems':
        if (arrValue.length > rule.max) {
          return rule.message;
        }
        break;
    }
    return null;
  }
}

/**
 * Custom Validator
 */
class CustomValidator extends BaseValidator {
  constructor(fieldLabel, validator) {
    super(fieldLabel);
    if (validator) {
      this.custom(validator);
    }
  }
}

/**
 * Validate entire schema
 */
function validateSchema(schema, data) {
  const errors = {};
  let isValid = true;

  for (const [fieldName, validator] of Object.entries(schema.fields)) {
    const result = validator.validate(data[fieldName], data);
    if (!result.valid) {
      errors[fieldName] = result.errors[0]; // First error only
      isValid = false;
    }
  }

  return { valid: isValid, errors };
}

/**
 * Validate single field
 */
function validateSingleField(validator, fieldName, value, allData = {}) {
  if (!validator) {
    return { valid: true, error: null };
  }

  const result = validator.validate(value, allData);
  return {
    valid: result.valid,
    error: result.errors[0] || null
  };
}

/**
 * Common validation schemas
 */
export const commonSchemas = {
  // Contact/Inquiry form
  inquiry: createSchema({
    name: v.string('お名前').required().minLength(2).maxLength(50),
    email: v.string('メールアドレス').required().email(),
    phone: v.string('電話番号').optional().phone(),
    message: v.string('お問い合わせ内容').required().minLength(10).maxLength(2000)
  }),

  // Login form
  login: createSchema({
    email: v.string('メールアドレス').required().email(),
    password: v.string('パスワード').required().minLength(8)
  }),

  // Registration form
  registration: createSchema({
    name: v.string('お名前').required().minLength(2).maxLength(50),
    email: v.string('メールアドレス').required().email(),
    password: v.string('パスワード').required().minLength(8),
    passwordConfirm: v.string('パスワード確認').required().matches('password', 'パスワードが一致しません')
  })
};

export default {
  createSchema,
  v,
  ValidationError,
  commonSchemas
};
