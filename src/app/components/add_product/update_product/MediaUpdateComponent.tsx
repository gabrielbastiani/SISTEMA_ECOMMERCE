'use client'

import { useDropzone } from 'react-dropzone'
import { Button } from '@nextui-org/react'
import { ArrowUpTrayIcon, TrashIcon } from '@heroicons/react/24/outline'
import Image from 'next/image'
import { useEffect } from 'react'
import { ImageRecord } from 'Types/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL

type MediaUpdateProps = {
    label: string
    maxFiles?: number
    acceptedTypes?: Record<string, string[]>
    existingFiles: ImageRecord[]
    newFiles: File[]
    primaryId: string
    primaryName?: string
    onSetPrimary: (imageIdOrName: string, isNew?: boolean) => void
    onAddNew: (files: File[]) => void
    onRemoveExisting: (id: string) => void
    onRemoveNew: (index: number) => void
}

export const MediaUpdateComponent: React.FC<MediaUpdateProps> = ({
    label,
    maxFiles = 20,
    acceptedTypes = { 'image/*': ['.jpeg', '.jpg', '.png'] },
    existingFiles,
    newFiles,
    primaryId,
    primaryName = "",
    onSetPrimary,
    onAddNew,
    onRemoveExisting,
    onRemoveNew
}) => {
    const { getRootProps, getInputProps } = useDropzone({ accept: acceptedTypes, maxFiles, onDrop: (acceptedFiles) => onAddNew(acceptedFiles) })

    // revogar objectURLs quando o componente desmontar
    useEffect(() => {
        return () => {
            newFiles.forEach((f) => {
                try { URL.revokeObjectURL((f as any).__previewUrl) } catch { }
            })
        }
    }, [newFiles])

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-black">{label}</label>

            <div {...getRootProps()} className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center cursor-pointer hover:border-primary transition-colors">
                <input {...getInputProps()} />
                <div className="flex items-center justify-center gap-2">
                    <ArrowUpTrayIcon className="h-5 w-5 text-gray-400" />
                    <p className="text-sm text-gray-600">Arraste ou clique para adicionar</p>
                </div>
            </div>

            {(existingFiles.length > 0 || newFiles.length > 0) && (
                <div className="relative">
                    <div className="flex gap-2 mt-2 overflow-x-auto pb-3 scrollbar-hide">
                        {existingFiles.map((file) => {
                            const isPrimary = file.id === primaryId
                            return (
                                <div key={file.id} className="relative shrink-0 group">
                                    <Image src={`${API_URL}/files/product/${file.url}`} alt={file.altText} width={80} height={80} className={`h-20 w-20 object-cover rounded-lg border ${isPrimary ? 'ring-2 ring-primary' : ''}`} />

                                    <Button isIconOnly size="sm" className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80" onPress={() => onRemoveExisting(file.id)}>
                                        <TrashIcon className="h-4 w-4 text-red-500" />
                                    </Button>

                                    <button type="button" onClick={() => onSetPrimary(file.id, false)} className={`absolute bottom-1 left-1 h-4 w-4 rounded-full border-2 flex items-center justify-center transition-colors ${isPrimary ? 'bg-orange-500 border-orange-500' : 'bg-white border-gray-300'}`} aria-label={isPrimary ? 'Imagem primária' : 'Marcar como imagem primária'}>
                                        {isPrimary && <div className="h-2 w-2 rounded-full bg-white" />}
                                    </button>
                                </div>
                            )
                        })}

                        {newFiles.map((file, index) => {
                            if (!(file as any).__previewUrl) { (file as any).__previewUrl = URL.createObjectURL(file) }
                            const isPrimaryNew = file.name === primaryName
                            return (
                                <div key={`${file.name}_${index}`} className="relative shrink-0 group">
                                    <Image src={(file as any).__previewUrl} alt={file.name} width={80} height={80} className={`h-20 w-20 object-cover rounded-lg border ${isPrimaryNew ? 'ring-2 ring-primary' : ''}`} />
                                    <Button isIconOnly size="sm" className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80" onPress={() => onRemoveNew(index)}>
                                        <TrashIcon className="h-4 w-4 text-red-500" />
                                    </Button>

                                    <button type="button" onClick={() => onSetPrimary(file.name, true)} className={`absolute bottom-1 left-1 h-4 w-4 rounded-full border-2 flex items-center justify-center transition-colors ${isPrimaryNew ? 'bg-orange-500 border-orange-500' : 'bg-white border-gray-300'}`} aria-label={isPrimaryNew ? 'Imagem primária (nova)' : 'Marcar nova como primária'}>
                                        {isPrimaryNew && <div className="h-2 w-2 rounded-full bg-white" />}
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}