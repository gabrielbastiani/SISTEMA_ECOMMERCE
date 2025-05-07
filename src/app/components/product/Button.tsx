import React, { ButtonHTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'solid' | 'outline';
  loading?: boolean;
}
export function Button({ children, variant = 'solid', loading = false, className, disabled, ...rest }: ButtonProps) {
  return (
    <button
      className={clsx(
        'px-4 py-2 rounded-lg font-semibold focus:outline-none transition',
        variant === 'solid' ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'border border-indigo-600 text-indigo-600 hover:bg-indigo-50',
        (disabled || loading) && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? 'Carregando...' : children}
    </button>
  );
}