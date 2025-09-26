'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Button } from '@nextui-org/react'

type Characteristic = {
    key: string
    value: string
    file?: File | null
    imageName?: string | null
    previewUrl?: string | null
}

type Props = {
    characteristics: Characteristic[]
    onChange: (c: Characteristic[]) => void
}

export function CharacteristicManager({ characteristics = [], onChange }: Props) {
    
    const [items, setItems] = useState<Characteristic[]>([])
    // store object URLs created here so we can revoke them later
    const createdObjectUrls = useRef<Set<string>>(new Set())
    // keep a ref to previous items to try to preserve blob previews across prop updates
    const itemsRef = useRef<Characteristic[]>([])

    // keep itemsRef in sync with local items
    useEffect(() => {
        itemsRef.current = items
    }, [items])

    // When props change, sync them into local state, but preserve any blob preview & file when possible
    useEffect(() => {
        const prev = itemsRef.current ?? []

        // Normalize incoming props and attempt to preserve preview/file from prev
        const normalizedIncoming: Characteristic[] = (characteristics || []).map((c) => {
            return {
                key: c?.key ?? '',
                value: c?.value ?? '',
                file: c?.file instanceof File ? c.file : null,
                imageName: c?.imageName ?? null,
                previewUrl: c?.previewUrl ?? null
            }
        })

        const preservedBlobUrls = new Set<string>()

        const newItems = normalizedIncoming.map((inc, idx) => {
            // 1) preserve by index if prev had a File and blob preview
            const prevByIndex = prev[idx]
            if (prevByIndex && prevByIndex.file instanceof File && prevByIndex.previewUrl && prevByIndex.previewUrl.startsWith('blob:')) {
                preservedBlobUrls.add(prevByIndex.previewUrl)
                return {
                    ...inc,
                    file: prevByIndex.file,
                    previewUrl: prevByIndex.previewUrl
                }
            }

            // 2) preserve by imageName: find previous item with same imageName that had a blob preview
            if (inc.imageName) {
                const found = prev.find(p => p.imageName === inc.imageName && p.previewUrl && p.previewUrl.startsWith('blob:'))
                if (found) {
                    preservedBlobUrls.add(found.previewUrl!)
                    return {
                        ...inc,
                        file: found.file ?? null,
                        previewUrl: found.previewUrl
                    }
                }
            }

            // 3) otherwise keep incoming previewUrl (likely server path) or undefined
            return inc
        })

        // revoke previous blob urls that were not preserved
        for (const p of prev) {
            if (p.previewUrl && p.previewUrl.startsWith('blob:') && !preservedBlobUrls.has(p.previewUrl)) {
                try { URL.revokeObjectURL(p.previewUrl) } catch { /* ignore */ }
                createdObjectUrls.current.delete(p.previewUrl)
            }
        }

        // set items but DO NOT call onChange (so parent won't be triggered by this sync)
        setItems(newItems)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [characteristics])

    // cleanup all created object URLs on unmount
    useEffect(() => {
        return () => {
            createdObjectUrls.current.forEach(url => {
                try { URL.revokeObjectURL(url) } catch { /* ignore */ }
            })
            createdObjectUrls.current.clear()
        }
    }, [])

    const emit = (newItems: Characteristic[]) => {
        setItems(newItems)
        onChange(newItems)
    }

    const addEmpty = () => {
        emit([...items, { key: '', value: '', file: null, imageName: null, previewUrl: null }])
    }

    const removeAt = (idx: number) => {
        const copy = [...items]
        const removed = copy.splice(idx, 1)[0]
        // revoke blob url if it was created here
        if (removed?.previewUrl && removed.previewUrl.startsWith('blob:')) {
            try { URL.revokeObjectURL(removed.previewUrl) } catch { /* ignore */ }
            createdObjectUrls.current.delete(removed.previewUrl)
        }
        emit(copy)
    }

    const updateCharacteristic = (idx: number, updates: Partial<Characteristic>) => {
        const copy = [...items]
        copy[idx] = { ...copy[idx], ...updates }
        emit(copy)
    }

    const handleFileSelect = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0) return
        const file = files[0]

        // If there was a previous blob preview for this item (created here), revoke it
        const prevPreview = items[idx]?.previewUrl
        if (prevPreview && prevPreview.startsWith('blob:')) {
            try { URL.revokeObjectURL(prevPreview) } catch { /* ignore */ }
            createdObjectUrls.current.delete(prevPreview)
        }

        const previewUrl = URL.createObjectURL(file)
        createdObjectUrls.current.add(previewUrl)

        updateCharacteristic(idx, {
            file,
            imageName: file.name,
            previewUrl
        })
    }

    const removeFile = (idx: number) => {
        const prevPreview = items[idx]?.previewUrl
        if (prevPreview && prevPreview.startsWith('blob:')) {
            try { URL.revokeObjectURL(prevPreview) } catch { /* ignore */ }
            createdObjectUrls.current.delete(prevPreview)
        }

        updateCharacteristic(idx, {
            file: null,
            imageName: null,
            previewUrl: null
        })
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <Button size="sm" onPress={addEmpty} className="text-white bg-orange-500">
                    Adicionar característica
                </Button>
            </div>

            {items.length === 0 && (
                <div className="text-sm text-gray-500">Nenhuma característica adicionada.</div>
            )}

            <div className="space-y-3">
                {items.map((item, idx) => (
                    <div key={idx} className="border rounded p-3 grid grid-cols-12 gap-3 items-center">
                        <div className="col-span-4">
                            <label className="block text-sm font-medium">Chave/Nome</label>
                            <input
                                className="w-full mt-1 p-2 border rounded text-black"
                                value={item.key}
                                onChange={(e) => updateCharacteristic(idx, { key: e.target.value })}
                                placeholder="ex: Cor"
                            />
                        </div>

                        <div className="col-span-4">
                            <label className="block text-sm font-medium">Valor</label>
                            <input
                                className="w-full mt-1 p-2 border rounded text-black"
                                value={item.value}
                                onChange={(e) => updateCharacteristic(idx, { value: e.target.value })}
                                placeholder="ex: Azul"
                            />
                        </div>

                        <div className="col-span-3">
                            <label className="block text-sm font-medium">Imagem (opcional)</label>
                            <input
                                type="file"
                                accept="image/*"
                                className="mt-1 w-full"
                                onChange={(e) => handleFileSelect(idx, e)}
                            />

                            {item.previewUrl && (
                                <div className="mt-2 flex items-center gap-2">
                                    <img
                                        src={item.previewUrl}
                                        alt={item.imageName || 'Preview'}
                                        className="w-20 h-20 object-cover rounded border"
                                    />
                                    <div className="text-sm text-gray-600">
                                        <div>{item.imageName}</div>
                                        <button
                                            type="button"
                                            className="mt-1 text-xs text-red-600"
                                            onClick={() => removeFile(idx)}
                                        >
                                            Remover imagem
                                        </button>
                                    </div>
                                </div>
                            )}

                            {!item.previewUrl && item.imageName && (
                                <div className="mt-2 text-sm text-gray-600">
                                    {item.imageName}
                                    <button
                                        type="button"
                                        className="ml-2 text-xs text-white bg-red-500"
                                        onClick={() => removeFile(idx)}
                                    >
                                        Remover
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="col-span-1 flex justify-end">
                            <Button size="sm" color="danger" className='text-white bg-red-500' onPress={() => removeAt(idx)}>
                                Remover
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}