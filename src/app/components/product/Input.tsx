import clsx from "clsx";
import { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
  }
  export function Input({ label, className, ...rest }: InputProps) {
    return (
      <div className={clsx('flex flex-col', className)}>
        {label && <label className="mb-1 font-medium text-gray-700">{label}</label>}
        <input
          className="border border-gray-300 rounded-lg px-3 py-2 focus:ring focus:ring-indigo-200 focus:border-indigo-600"
          {...rest}
        />
      </div>
    );
  }