import React, { ReactNode } from 'react';
export function Section({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">{children}</div>
  );
}