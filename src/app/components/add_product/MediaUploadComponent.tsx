'use client'

import { useDropzone } from 'react-dropzone'
import { Button } from '@nextui-org/react'
import { ArrowUpTrayIcon, TrashIcon } from '@heroicons/react/24/outline'
import Image from 'next/image'

interface MediaUploadProps {
    label: string
    maxFiles?: number
    acceptedTypes?: Record<string, string[]>
    files: File[]
    onUpload: (files: File[]) => void
    onRemove: (index: number) => void

    // Novos props para marcar “isPrimary”
    primaryIndex?: number
    onSetPrimary?: (index: number) => void
}

export const MediaUploadComponent = ({
    label,
    maxFiles = 20,
    acceptedTypes = { 'image/*': ['.jpeg', '.jpg', '.png'] },
    files,
    onUpload,
    onRemove,
    primaryIndex = -1,
    onSetPrimary,
}: MediaUploadProps) => {
    const { getRootProps, getInputProps } = useDropzone({
        accept: acceptedTypes,
        maxFiles,
        onDrop: (acceptedFiles) => onUpload(acceptedFiles),
    })

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">{label}</label>

            {/* Dropzone */}
            <div
                {...getRootProps()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center cursor-pointer hover:border-primary transition-colors"
            >
                <input {...getInputProps()} />
                <div className="flex items-center justify-center gap-2">
                    <ArrowUpTrayIcon className="h-5 w-5 text-gray-400" />
                    <p className="text-sm text-gray-600">Arraste ou clique para adicionar</p>
                </div>
            </div>

            {/* Grid de miniaturas com scroll horizontal */}
            {files.length > 0 && (
                <div className="relative">
                    <div className="flex gap-2 mt-2 overflow-x-auto pb-3 scrollbar-hide">
                        {files.map((file, index) => {
                            const isPrimary = index === primaryIndex
                            return (
                                <div key={index} className="relative shrink-0 group">
                                    <Image
                                        src={URL.createObjectURL(file)}
                                        alt={file.name}
                                        width={80}
                                        height={80}
                                        className={`h-20 w-20 object-cover rounded-lg border ${isPrimary ? 'ring-2 ring-primary' : ''
                                            }`}
                                    />

                                    {/* Botão de remover (ícone de lixeira) */}
                                    <Button
                                        isIconOnly
                                        size="sm"
                                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80"
                                        onPress={() => onRemove(index)}
                                    >
                                        <TrashIcon className="h-4 w-4 text-red-500" />
                                    </Button>

                                    {/* Círculo de “marcar como principal” */}
                                    {onSetPrimary && (
                                        <button
                                            type="button"
                                            onClick={() => onSetPrimary(index)}
                                            className={`
                        absolute bottom-1 left-1 h-4 w-4 rounded-full border-2 
                        flex items-center justify-center transition-colors 
                        ${isPrimary ? 'bg-primary border-primary' : 'bg-white border-gray-300'}
                      `}
                                        >
                                            {/* Se for primary, deixamos o círculo preenchido */}
                                            {isPrimary && <div className="h-2 w-2 rounded-full bg-white" />}
                                        </button>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}