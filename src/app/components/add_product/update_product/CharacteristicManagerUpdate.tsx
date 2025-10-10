'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Button } from '@nextui-org/react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

export type CharacteristicItem = {
    image?: string | null | undefined
    id?: string | null
    key: string
    value: string
    file?: File | null
    imageName?: string | null
    previewUrl?: string | null
}

type Props = {
    characteristics: CharacteristicItem[]
    onChange: (items: CharacteristicItem[]) => void
}

export function CharacteristicManagerUpdate({ characteristics = [], onChange }: Props) {
    const [items, setItems] = useState<CharacteristicItem[]>([])
    const createdObjectUrls = useRef<Set<string>>(new Set())
    const itemsRef = useRef<CharacteristicItem[]>([])

    // keep itemsRef in sync whenever items state changes
    useEffect(() => {
        itemsRef.current = items
    }, [items])

    // Helper to resolve a preview src safely (don't prefix blob/data/http URLs)
    const resolvePreviewSrc = (previewUrl?: string | null) => {
        if (!previewUrl) return undefined
        const trimmed = previewUrl.trim()
        if (trimmed.startsWith('blob:') || trimmed.startsWith('data:') || /^https?:\/\//i.test(trimmed)) {
            return trimmed
        }
        if (trimmed.startsWith('/')) {
            if (API_URL) return `${API_URL.replace(/\/$/, '')}${trimmed}`
            return trimmed
        }
        if (API_URL) {
            return `${API_URL.replace(/\/$/, '')}/${trimmed}`
        }
        return trimmed
    }

    // Sync incoming props -> local items, but preserve any in-memory blob URLs when possible.
    useEffect(() => {
        const prev = itemsRef.current ?? []

        // Build normalized incoming items (from props) without file/preview (unless provided)
        const normalizedIncoming = (characteristics || []).map((c) => {
            const imageName = c?.imageName ?? c?.image ?? null
            let previewUrl = c?.previewUrl ?? null
            if (!previewUrl && imageName) {
                previewUrl = `/files/characteristicProduct/${imageName}`
            }
            return {
                id: c?.id ?? null,
                key: c?.key ?? '',
                value: c?.value ?? '',
                file: c?.file instanceof File ? c.file : null,
                imageName,
                previewUrl
            } as CharacteristicItem
        })

        // We'll decide per-item whether to preserve previous file/previewUrl (blob URL)
        const preservedBlobUrls = new Set<string>()
        const newItems: CharacteristicItem[] = normalizedIncoming.map((inc, idx) => {
            // 1) Prefer preserving by index if previous item had a File (user just selected)
            const prevByIndex = prev[idx]
            if (prevByIndex && prevByIndex.file instanceof File && prevByIndex.previewUrl) {
                preservedBlobUrls.add(prevByIndex.previewUrl)
                return {
                    ...inc,
                    file: prevByIndex.file,
                    previewUrl: prevByIndex.previewUrl
                }
            }

            // 2) Otherwise try to find a previous entry with same imageName and a blob preview
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

            // 3) otherwise use incoming previewUrl (server path or undefined)
            return inc
        })

        // Revoke previous blob URLs that are not preserved anymore
        for (const p of prev) {
            if (p.previewUrl && p.previewUrl.startsWith('blob:') && !preservedBlobUrls.has(p.previewUrl)) {
                try {
                    URL.revokeObjectURL(p.previewUrl)
                } catch { }
                createdObjectUrls.current.delete(p.previewUrl)
            }
        }

        // Update state without emitting onChange (to avoid feedback loop)
        setItems(newItems)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [characteristics])

    // cleanup on unmount: revoke any object URLs we created
    useEffect(() => {
        return () => {
            createdObjectUrls.current.forEach(url => {
                try { URL.revokeObjectURL(url) } catch { }
            })
            createdObjectUrls.current.clear()
        }
    }, [])

    const updateAndEmit = (newItems: CharacteristicItem[]) => {
        setItems(newItems)
        onChange(newItems)
    }

    const addEmpty = () => {
        updateAndEmit([...items, { key: '', value: '', file: null, imageName: null, previewUrl: null }])
    }

    const removeAt = (idx: number) => {
        const newItems = [...items]
        const removed = newItems.splice(idx, 1)[0]
        if (removed?.previewUrl && removed?.previewUrl.startsWith('blob:')) {
            try { URL.revokeObjectURL(removed.previewUrl) } catch { }
            createdObjectUrls.current.delete(removed.previewUrl)
        }
        updateAndEmit(newItems)
    }

    const updateCharacteristic = (idx: number, updates: Partial<CharacteristicItem>) => {
        const newItems = [...items]
        newItems[idx] = { ...newItems[idx], ...updates }
        updateAndEmit(newItems)
    }

    const handleFileSelect = (idx: number, event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files
        if (!files || files.length === 0) return
        const file = files[0]

        // Revoke previous preview if it was a blob created here and it's not preserved
        const prev = items[idx]?.previewUrl
        if (prev && items[idx]?.file instanceof File && prev.startsWith('blob:')) {
            try { URL.revokeObjectURL(prev) } catch { }
            createdObjectUrls.current.delete(prev)
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
        const prev = items[idx]?.previewUrl
        if (prev && items[idx]?.file instanceof File && prev.startsWith('blob:')) {
            try { URL.revokeObjectURL(prev) } catch { }
            createdObjectUrls.current.delete(prev)
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
                {items.map((item, idx) => {
                    const resolvedSrc = resolvePreviewSrc(item.previewUrl ?? undefined)
                    return (
                        <div key={idx} className="border rounded p-3 grid grid-cols-12 gap-3 items-start">
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
                                <input type="file" accept="image/*" className="mt-1 w-full" onChange={(e) => handleFileSelect(idx, e)} />

                                {resolvedSrc ? (
                                    <div className="mt-2 flex items-center gap-2">
                                        <img src={resolvedSrc} alt={item.imageName || 'Preview'} className="w-20 h-20 object-cover rounded border" />
                                        <div className="text-sm text-gray-600">
                                            <div>{item.imageName}</div>
                                            <button type="button" className="mt-1 text-xs text-white bg-red-500 px-2 py-1 rounded" onClick={() => removeFile(idx)}>Remover imagem</button>
                                        </div>
                                    </div>
                                ) : null}

                                {!resolvedSrc && item.imageName && (
                                    <div className="mt-2 text-sm text-gray-600">
                                        {item.imageName}
                                        <div>
                                            <button type="button" className="mt-1 text-xs text-red-600" onClick={() => updateCharacteristic(idx, { imageName: null })}>Remover imagem</button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="col-span-1 flex justify-end">
                                <Button size="sm" color="danger" onPress={() => removeAt(idx)} className="text-white bg-red-500">
                                    Remover
                                </Button>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}