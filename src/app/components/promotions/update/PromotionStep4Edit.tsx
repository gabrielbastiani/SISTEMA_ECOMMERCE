'use client'

import React, { useState } from 'react'
import { Editor } from '@tinymce/tinymce-react'
import { DisplayInput, DisplayType } from 'Types/types'

const TOKEN_TINY = process.env.NEXT_PUBLIC_TINYMCE_API_KEY || ''

interface Props {
    initialDisplays: DisplayInput[]
    onSave: (displays: DisplayInput[]) => Promise<void>
    onBack: () => void
    onNext: () => void
    onSelectDisplay?: (idx: number) => void
    isSaving?: boolean
}

export default function PromotionStep4Edit({
    initialDisplays,
    onSave,
    onBack,
    onNext,
    onSelectDisplay,
    isSaving = false
}: Props) {
    const [list, setList] = useState<DisplayInput[]>([...initialDisplays])
    const [title, setTitle] = useState('')
    const [type, setType] = useState<DisplayType>(DisplayType.SPOT)
    const [content, setContent] = useState('')
    const [editingIdx, setEditingIdx] = useState<number>(-1)

    function handleSelectEdit(idx: number) {
        if (isSaving) return
        if (editingIdx === idx) {
            setEditingIdx(-1)
            setTitle('')
            setContent('')
            onSelectDisplay?.(-1)
            return
        }

        const d = list[idx]
        setTitle(d.title)
        setType(d.type as DisplayType)
        setContent(d.content)
        setEditingIdx(idx)
        onSelectDisplay?.(idx)
    }

    function handleAddOrUpdate() {
        if (isSaving) return
        if (!title.trim() || !content.trim()) return

        const newItem: DisplayInput = { title: title.trim(), type: type, content }
        setList(l => {
            const copy = [...l]
            if (editingIdx >= 0) {
                copy[editingIdx] = newItem
            } else {
                copy.push(newItem)
            }
            return copy
        })

        setTitle('')
        setContent('')
        setEditingIdx(-1)
        onSelectDisplay?.(-1)
    }

    function handleRemove(idx: number) {
        if (isSaving) return
        setList(l => l.filter((_, i) => i !== idx))
        if (idx === editingIdx) {
            setTitle('')
            setContent('')
            setEditingIdx(-1)
            onSelectDisplay?.(-1)
        }
    }

    async function handleSaveStep4() {
        if (isSaving) return
        await onSave(list)
    }

    return (
        <div className="space-y-6 relative">
            {isSaving && (
                <div className="absolute inset-0 z-40 flex items-center justify-center bg-white/70">
                    <div className="animate-pulse w-full max-w-2xl p-6 bg-white rounded shadow">
                        <div className="h-4 bg-gray-200 rounded mb-3" />
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-6" />
                        <div className="h-32 bg-gray-200 rounded" />
                        <div className="text-center mt-4 text-gray-700 font-medium">Salvando divulgações...</div>
                    </div>
                </div>
            )}

            <h2 className="text-xl font-semibold">Passo 4: Divulgações</h2>

            <table className="w-full border-collapse">
                <thead>
                    <tr className="border-b bg-gray-100 text-black">
                        <th className="p-2">Título</th>
                        <th className="p-2">Tipo</th>
                        <th className="p-2">Conteúdo</th>
                        <th className="p-2"></th>
                    </tr>
                </thead>
                <tbody>
                    {list.map((d, i) => (
                        <tr
                            key={i}
                            className={`border-b cursor-pointer ${i === editingIdx ? 'bg-red-100 text-black' : ''}`}
                            onClick={() => handleSelectEdit(i)}
                        >
                            <td className="p-2">{d.title}</td>
                            <td className="p-2">{d.type === DisplayType.SPOT ? 'Spot' : 'Página do produto'}</td>
                            <td className="p-2 overflow-hidden whitespace-nowrap text-ellipsis max-w-xs">
                                <div dangerouslySetInnerHTML={{ __html: d.content }} />
                            </td>
                            <td className="p-2">
                                <button type="button" onClick={e => { e.stopPropagation(); handleRemove(i) }} className="text-red-600 hover:underline" disabled={isSaving}>
                                    Remover
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="space-y-4">
                <div>
                    <label className="block mb-1 font-medium">{editingIdx >= 0 ? 'Editar Título' : 'Novo Título'}*</label>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full border p-2 rounded bg-white text-black" placeholder="Digite o título" disabled={isSaving} />
                </div>

                <div>
                    <label className="block mb-1 font-medium">Tipo*</label>
                    <select value={type} onChange={e => setType(e.target.value as DisplayType)} className="w-full border p-2 rounded bg-white text-black" disabled={isSaving}>
                        <option value={DisplayType.SPOT}>Spot</option>
                        <option value={DisplayType.PRODUCT_PAGE}>Página do produto</option>
                    </select>
                </div>

                <div>
                    <label className="block mb-1 font-medium">{editingIdx >= 0 ? 'Editar Conteúdo' : 'Novo Conteúdo'}*</label>
                    <Editor
                        apiKey={TOKEN_TINY}
                        init={{ height: 200, menubar: false, plugins: ['link', 'lists', 'code'],
                        toolbar: 'undo redo | bold italic | bullist numlist | code',
                        // @ts-ignore
                        readonly: isSaving ? 1 : 0 }}
                        value={content}
                        onEditorChange={c => setContent(c)}
                    />
                </div>
            </div>

            <div className="flex justify-between">
                <button type="button" onClick={onBack} className="px-4 py-2 rounded bg-gray-200 text-black hover:bg-gray-300" disabled={isSaving}>
                    Voltar
                </button>
                <div className="space-x-2">
                    <button type="button" onClick={handleAddOrUpdate} className="px-4 py-2 bg-violet-600 text-white rounded hover:bg-violet-700" disabled={isSaving}>
                        {editingIdx >= 0 ? 'Salvar Alteração' : 'Adicionar Divulgação'}
                    </button>
                    <button type="button" onClick={handleSaveStep4} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700" disabled={isSaving}>
                        Salvar Passo 4
                    </button>
                    <button type="button" onClick={onNext} className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600" disabled={isSaving}>
                        Próximo
                    </button>
                </div>
            </div>
        </div>
    )
}