import React from 'react';

interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  value?: string | number;
  placeholder?: string;
  min?: string | number;
  step?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  hint?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  type = 'text',
  required = false,
  value,
  placeholder,
  min,
  step,
  onChange,
  hint
}) => {
  const id = `f-${name}`;
  return (
    <div>
      <label htmlFor={id}>
        {label}
        {required && ' *'}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        value={value}
        placeholder={placeholder}
        min={min}
        step={step}
        onChange={onChange}
      />
      {hint && <small>{hint}</small>}
    </div>
  );
};
