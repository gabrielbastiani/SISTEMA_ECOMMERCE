'use client'

import Image from 'next/image'
import React, { useState, ChangeEvent, useEffect } from 'react'

export type BadgeWithFile = {
    title: string
    imageUrl: string
    previewUrl: string
    file?: File
}

interface Props {
    initialBadges: BadgeWithFile[]
    onSave: (badges: BadgeWithFile[]) => Promise<void>
    onBack: () => void
    onFinish: () => void
}

export default function PromotionStep5Edit({
    initialBadges,
    onSave,
    onBack,
    onFinish
}: Props) {
    const [badges, setBadges] = useState<BadgeWithFile[]>(() =>
        initialBadges.map(b => ({ ...b, file: undefined }))
    )
    const [title, setTitle] = useState('')
    const [file, setFile] = useState<File | undefined>()
    const [preview, setPreview] = useState('')
    const [editingIdx, setEditingIdx] = useState<number>(-1)

    useEffect(() => { clearForm() }, [])

    function onFileChange(e: ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0]
        if (!f) return
        setFile(f)
        setPreview(URL.createObjectURL(f))
    }

    function handleSelect(idx: number) {
        if (editingIdx === idx) return clearForm()
        const b = badges[idx]
        setTitle(b.title)
        setPreview(b.previewUrl)
        setFile(undefined)
        setEditingIdx(idx)
    }

    function handleAddOrUpdate() {
        if (!title.trim() || !preview) return

        const newItem: BadgeWithFile = {
            title: title.trim(),
            imageUrl: editingIdx >= 0
                ? badges[editingIdx].imageUrl
                : (file?.name || ''),
            previewUrl: preview,
            file
        }

        setBadges(list => {
            if (editingIdx >= 0) {
                const copy = [...list]
                copy[editingIdx] = newItem
                return copy
            }
            return [...list, newItem]
        })

        clearForm()
    }

    function clearForm() {
        setTitle('')
        setFile(undefined)
        setPreview('')
        setEditingIdx(-1)
    }

    function handleRemove(idx: number, e: React.MouseEvent) {
        e.stopPropagation()
        setBadges(list => list.filter((_, i) => i !== idx))
        if (editingIdx === idx) clearForm()
    }

    async function handleSaveStep() {
        if (editingIdx >= 0) handleAddOrUpdate()
        await onSave(badges)
    }

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold">Passo 5: Selos</h2>

            <table className="w-full border-collapse">
                <thead>
                    <tr className="bg-gray-100 text-black">
                        <th className="p-2 text-left">Título</th>
                        <th className="p-2 text-left">Imagem</th>
                        <th className="p-2"></th>
                    </tr>
                </thead>
                <tbody>
                    {badges.map((b, i) => (
                        <tr
                            key={i}
                            className={`border-b cursor-pointer ${editingIdx === i ? 'bg-red-100 text-black' : ''}`}
                            onClick={() => handleSelect(i)}
                        >
                            <td className="p-2">{b.title}</td>
                            <td className="p-2">
                                <Image
                                    src={b.previewUrl}
                                    alt={b.title}
                                    width={80}
                                    height={80}
                                    className="object-contain"
                                />
                            </td>
                            <td className="p-2">
                                <button onClick={e => handleRemove(i, e)} className="text-red-600 hover:underline">
                                    Remover
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="space-y-4">
                <div>
                    <label className="block mb-1">Título*</label>
                    <input
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className="w-full border p-2 rounded text-black"
                        placeholder="Título do selo"
                    />
                </div>
                <div>
                    <label className="block mb-1">Imagem*</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={onFileChange}
                        className="border p-1 rounded"
                    />
                </div>
                {preview && (
                    <div>
                        <span className="block mb-1">Preview:</span>
                        <Image
                            src={preview}
                            alt="preview"
                            width={120}
                            height={120}
                            className="object-contain border"
                        />
                    </div>
                )}
            </div>

            <div className="flex justify-between">
                <button onClick={onBack} className="px-4 py-2 bg-gray-200 rounded text-black hover:bg-gray-300">
                    Voltar
                </button>
                <div className="space-x-2">
                    <button onClick={handleAddOrUpdate} className="px-4 py-2 bg-violet-600 rounded hover:bg-violet-700 text-white">
                        {editingIdx >= 0 ? 'Salvar Alteração' : 'Adicionar Selo'}
                    </button>
                    <button onClick={handleSaveStep} className="px-4 py-2 bg-green-600 rounded hover:bg-green-700 text-white">
                        Salvar Passo 5
                    </button>
                    <button onClick={onFinish} className="px-4 py-2 bg-orange-500 rounded hover:bg-orange-600 text-white">
                        Concluir Promoção
                    </button>
                </div>
            </div>
        </div>
    )
}