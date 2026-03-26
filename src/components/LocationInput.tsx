import React from 'react';
import CreatableSelect from 'react-select/creatable';

interface LocationInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder: string;
  required?: boolean;
}

export const LocationInput: React.FC<LocationInputProps> = ({ label, value, onChange, suggestions, placeholder, required }) => {
  const options = suggestions.map(s => ({ label: s, value: s }));
  const selectedOption = options.find(o => o.value === value) || (value ? { label: value, value: value } : null);

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <CreatableSelect
        value={selectedOption}
        onChange={(option) => onChange(option ? option.value : '')}
        options={options}
        placeholder={placeholder}
        isClearable
        menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
        className="text-sm"
        styles={{
          control: (provided) => ({
            ...provided,
            borderRadius: '0.5rem',
            borderColor: '#cbd5e1',
            padding: '2px',
            '&:hover': { borderColor: '#14b8a6' },
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
