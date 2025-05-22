'use client'

import { useDropzone } from 'react-dropzone'
import { Button } from '@nextui-org/react'
import { ArrowUpTrayIcon, TrashIcon } from '@heroicons/react/24/outline'
import Image from 'next/image'

interface MediaUploadProps {
    label: string
    maxFiles?: number
    acceptedTypes?: Record<string, string[]>
    onUpload: (files: File[]) => void
    onRemove: (index: number) => void
    files: File[]
}

export const MediaUploadComponent = ({
    label,
    maxFiles = 20,
    acceptedTypes = { 'image/*': ['.jpeg', '.jpg', '.png'] },
    onUpload,
    onRemove,
    files
}: MediaUploadProps) => {
    const { getRootProps, getInputProps } = useDropzone({
        accept: acceptedTypes,
        maxFiles,
        onDrop: acceptedFiles => onUpload([...files, ...acceptedFiles])
    })

    return (
        <div className="space-y-4">
            <label className="block text-sm font-medium text-foreground">{label}</label>
            <div
                {...getRootProps()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
            >
                <input {...getInputProps()} />
                <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                    Arraste arquivos ou clique para fazer upload
                </p>
            </div>

            {files?.length > 0 && (
                <div className="grid grid-cols-3 gap-4 mt-4">
                    {files.map((file, index) => (
                        <div key={index} className="relative group">
                            <Image
                                src={URL.createObjectURL(file)}
                                alt={file.name}
                                width={200}
                                height={180}
                                className="h-40 object-fill rounded-lg"
                            />
                            <Button
                                isIconOnly
                                size="sm"
                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                onPress={() => onRemove(index)}
                            >
                                <TrashIcon color='red' className="h-4 w-4 text-danger" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}