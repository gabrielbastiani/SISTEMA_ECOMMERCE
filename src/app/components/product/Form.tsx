import React, { FormEvent, ReactNode } from 'react';

interface FormProps {
  onSubmit: (e: FormEvent) => void;
  loading?: boolean;
  children: ReactNode;
}
export function Form({ onSubmit, loading = false, children }: FormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">  
      {children}
    </form>
  );
}