import React from 'react';

interface DropdownProps {
  label?: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}
export function Dropdown({ label, options, value, onChange }: DropdownProps) {
  return (
    <div className="flex flex-col">
      {label && <label className="mb-1 font-medium text-gray-700">{label}</label>}
      <select
        className="border border-gray-300 rounded-lg px-3 py-2 focus:ring focus:ring-indigo-200 focus:border-indigo-600"
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );
}