import React from 'react';
import CreatableSelect from 'react-select/creatable';
import { MultiValue, SingleValue } from 'react-select';

interface LocationInputProps {
  label: string;
  value: string | string[];
  onChange: (value: any) => void;
  suggestions: string[];
  placeholder: string;
  required?: boolean;
  error?: boolean;
  id?: string;
  isMulti?: boolean;
}

export const LocationInput: React.FC<LocationInputProps> = ({ label, value, onChange, suggestions, placeholder, required, error, id, isMulti }) => {
  const options = suggestions.map(s => ({ label: s, value: s }));
  
  let selectedOption: any;
  if (isMulti) {
    selectedOption = Array.isArray(value) ? options.filter(o => value.includes(o.value)).concat(value.filter(v => !suggestions.includes(v)).map(v => ({ label: v, value: v }))) : [];
  } else {
    selectedOption = options.find(o => o.value === value) || (value && typeof value === 'string' ? { label: value, value: value } : null);
  }

  const handleChange = (option: MultiValue<{label: string, value: string}> | SingleValue<{label: string, value: string}>) => {
    if (isMulti) {
      onChange((option as MultiValue<{label: string, value: string}>).map(o => o.value));
    } else {
      onChange(option ? (option as {label: string, value: string}).value : '');
    }
  };

  return (
    <div id={id}>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <CreatableSelect
        inputId={id}
        value={selectedOption}
        onChange={handleChange}
        options={options}
        placeholder={placeholder}
        isClearable={!isMulti}
        isMulti={isMulti}
        menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
        className="text-sm"
        styles={{
          control: (provided) => ({
            ...provided,
            borderRadius: '0.5rem',
            borderColor: error ? '#ef4444' : '#cbd5e1',
            padding: '2px',
            '&:hover': { borderColor: error ? '#ef4444' : '#14b8a6' },
            boxShadow: 'none',
          }),
          menuPortal: (provided) => ({
            ...provided,
            zIndex: 9999,
          }),
        }}
      />
    </div>
  );
};
