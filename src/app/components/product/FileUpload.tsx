import React, { ChangeEvent } from 'react';

interface FileUploadProps {
  multiple?: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}
export function FileUpload({ multiple = false, onChange }: FileUploadProps) {
  return (
    <input
      type="file"
      multiple={multiple}
      onChange={onChange}
      className="block w-full text-gray-700"
    />
  );
}