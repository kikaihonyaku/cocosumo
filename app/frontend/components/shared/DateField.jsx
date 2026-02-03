import React from 'react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

export default function DateField({ label, value, onChange, size = 'small', variant = 'outlined', fullWidth = false, disabled = false, minDate, ...props }) {
  const dayjsValue = value ? dayjs(value) : null;
  const dayjsMinDate = minDate ? dayjs(minDate) : undefined;

  const handleChange = (newValue) => {
    if (onChange) {
      const formatted = newValue && newValue.isValid() ? newValue.format('YYYY-MM-DD') : '';
      onChange(formatted);
    }
  };

  return (
    <DatePicker
      label={label}
      value={dayjsValue}
      onChange={handleChange}
      format="YYYY/MM/DD"
      disabled={disabled}
      minDate={dayjsMinDate}
      slotProps={{
        textField: {
          size,
          variant,
          fullWidth,
          ...props,
        },
      }}
    />
  );
}
