import clsx from 'clsx';
import React, { TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}
export function Textarea({ label, className, ...rest }: TextareaProps) {
  return (
    <div className={clsx('flex flex-col', className)}>
      {label && <label className="mb-1 font-medium text-gray-700">{label}</label>}
      <textarea
        className="border border-gray-300 rounded-lg px-3 py-2 focus:ring focus:ring-indigo-200 focus:border-indigo-600"
        {...rest}
      />
    </div>
  );
}