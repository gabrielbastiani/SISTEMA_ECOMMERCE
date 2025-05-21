'use client'

import { useDropzone } from 'react-dropzone'
import { Button } from '@nextui-org/react'
import { ArrowUpTrayIcon, TrashIcon } from '@heroicons/react/24/outline' // Corrigido o nome do ícone

interface MediaUploadProps {
    label: string
    maxFiles?: number
    acceptedTypes?: Record<string, string[]> // Tipo correto para accept
    onUpload: (files: File[]) => void
    onRemove: (index: number) => void
    files: File[]
}

export const MediaUploadComponent = ({
    label,
    maxFiles = 5,
    acceptedTypes = { 'image/*': ['.jpeg', '.jpg', '.png'] }, // Formato correto
    onUpload,
    onRemove,
    files
}: MediaUploadProps) => {
    const { getRootProps, getInputProps } = useDropzone({
        accept: acceptedTypes, // Tipo corrigido
        maxFiles,
        onDrop: acceptedFiles => onUpload([...files, ...acceptedFiles])
    })

    return (
        <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">{label}</label>
            <div
                {...getRootProps()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
            >
                <input {...getInputProps()} />
                <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400" /> {/* Ícone corrigido */}
                <p className="mt-2 text-sm text-gray-600">
                    Arraste arquivos ou clique para fazer upload
                </p>
            </div>

            {files.length > 0 && (
                <div className="grid grid-cols-3 gap-4 mt-4">
                    {files.map((file, index) => (
                        <div key={index} className="relative group">
                            <img
                                src={URL.createObjectURL(file)}
                                alt={file.name}
                                className="h-32 w-full object-cover rounded-lg"
                            />
                            <Button
                                isIconOnly
                                size="sm"
                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                onPress={() => onRemove(index)}
                            >
                                <TrashIcon className="h-4 w-4 text-danger" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}