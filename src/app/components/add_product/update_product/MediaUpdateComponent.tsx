'use client'

import { useDropzone } from 'react-dropzone'
import { Button } from '@nextui-org/react'
import { ArrowUpTrayIcon, TrashIcon } from '@heroicons/react/24/outline'
import Image from 'next/image'
import { ImageRecord } from 'Types/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type MediaUpdateProps = {
    label: string
    maxFiles?: number
    acceptedTypes?: Record<string, string[]>
    existingFiles: ImageRecord[]
    newFiles: File[]
    onAddNew: (files: File[]) => void
    onRemoveExisting: (id: string) => void
    onRemoveNew: (index: number) => void
}

export const MediaUpdateComponent = ({
    label,
    maxFiles = 20,
    acceptedTypes = { 'image/*': ['.jpeg', '.jpg', '.png'] },
    existingFiles,
    newFiles,
    onAddNew,
    onRemoveExisting,
    onRemoveNew
}: MediaUpdateProps) => {
    const { getRootProps, getInputProps } = useDropzone({
        accept: acceptedTypes,
        maxFiles,
        onDrop: acceptedFiles => onAddNew(acceptedFiles)
    })

    return (
        <div className="space-y-4">
            <label className="block text-sm font-medium text-foreground">{label}</label>

            {/* Upload area */}
            <div
                {...getRootProps()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
            >
                <input {...getInputProps()} />
                <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                    Arraste ou clique para adicionar imagens
                </p>
            </div>

            {/* Existing + New previews */}
            {(existingFiles.length > 0 || newFiles.length > 0) && (
                <div className="grid grid-cols-3 gap-4 mt-4">
                    {/* Existing */}
                    {existingFiles.map(file => (
                        <div key={file.id} className="relative group">
                            <Image
                                src={`${API_URL}/files/${file.url}`}
                                alt={file.altText}
                                width={200}
                                height={180}
                                className="h-40 w-full object-cover rounded-lg"
                            />
                            <Button
                                isIconOnly
                                size="sm"
                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                onPress={() => onRemoveExisting(file.id)}
                            >
                                <TrashIcon className="h-4 w-4 text-red-500" />
                            </Button>
                        </div>
                    ))}
                    {/* New */}
                    {newFiles.map((file, idx) => (
                        <div key={idx} className="relative group">
                            <Image
                                src={URL.createObjectURL(file)}
                                alt={file.name}
                                width={200}
                                height={180}
                                className="h-40 w-full object-cover rounded-lg"
                            />
                            <Button
                                isIconOnly
                                size="sm"
                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                onPress={() => onRemoveNew(idx)}
                            >
                                <TrashIcon className="h-4 w-4 text-red-500" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}