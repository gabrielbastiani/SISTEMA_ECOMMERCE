import React, { ReactNode, useState } from 'react';

interface AccordionProps {
  title: string;
  children: ReactNode;
}
export function Accordion({ title, children }: AccordionProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-lg">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full text-left px-4 py-2 bg-gray-50 flex justify-between items-center"
      >
        <span className="font-medium">{title}</span>
        <span>{open ? '-' : '+'}</span>
      </button>
      {open && <div className="p-4">{children}</div>}
    </div>
  );
}