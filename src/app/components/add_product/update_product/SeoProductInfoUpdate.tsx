'use client'

import React, { useState } from 'react'
import { Input, Textarea, Button, Tooltip } from '@nextui-org/react'
import { PlusIcon, TrashIcon, InformationCircleIcon } from '@heroicons/react/24/outline'
import { ProductFormData } from 'Types/types'

interface SeoProductInfoUpdateProps {
    formData: ProductFormData
    onFormDataChange: (data: ProductFormData) => void
}

export const SeoProductInfoUpdate: React.FC<SeoProductInfoUpdateProps> = ({
    formData,
    onFormDataChange
}) => {
    const [newKeyword, setNewKeyword] = useState('')

    const handleChange = (field: keyof ProductFormData, value: any) => {
        onFormDataChange({ ...formData, [field]: value })
    }

    const currentKeywords = formData.keywords ?? []

    const addKeyword = () => {
        const kw = newKeyword.trim()
        if (kw && !currentKeywords.includes(kw)) {
            handleChange('keywords', [...currentKeywords, kw])
            setNewKeyword('')
        }
    }

    const removeKeyword = (kw: string) => {
        handleChange(
            'keywords',
            currentKeywords.filter((k) => k !== kw)
        )
    }

    return (
        <div className="space-y-6 max-w-3xl">

            {/* Meta Title */}
            <div>
                <label className="mb-1 text-sm font-medium text-foreground flex items-center gap-1">
                    Meta Titlo
                    <Tooltip
                        content="Título exibido nos resultados de busca"
                        placement="top-start"
                        className="bg-white text-red-500 border border-gray-200 p-2"
                    >
                        <InformationCircleIcon className="h-4 w-4 text-gray-400" />
                    </Tooltip>
                </label>
                <Input
                    placeholder="Meta Titlo"
                    value={formData.metaTitle || ''}
                    onChange={(e) => handleChange('metaTitle', e.target.value)}
                    className="bg-white border border-gray-200 rounded-md"
                    classNames={{ input: 'text-black' }}
                />
            </div>

            {/* Meta Description */}
            <div>
                <label className="mb-1 text-sm font-medium text-foreground flex items-center gap-1">
                    Meta Descrição
                    <Tooltip
                        content="Descrição exibida nos resultados de busca"
                        placement="top-start"
                        className="bg-white text-red-500 border border-gray-200 p-2"
                    >
                        <InformationCircleIcon className="h-4 w-4 text-gray-400" />
                    </Tooltip>
                </label>
                <Textarea
                    placeholder="Meta Descrição"
                    value={formData.metaDescription || ''}
                    onChange={(e) => handleChange('metaDescription', e.target.value)}
                    classNames={{
                        base: 'bg-white border border-gray-200 rounded-md h-24',
                        input: 'text-black'
                    }}
                />
            </div>

            {/* Keywords */}
            <div>
                <label className="mb-1 text-sm font-medium text-foreground flex items-center gap-1">
                    Palavras-chave
                    <Tooltip
                        content="Use palavras que ajudem no SEO deste produto"
                        placement="top-start"
                        className="bg-white text-red-500 border border-gray-200 p-2"
                    >
                        <InformationCircleIcon className="h-4 w-4 text-gray-400" />
                    </Tooltip>
                </label>

                <div className="flex gap-2 mb-2">
                    <Input
                        placeholder="Adicionar Palavra-chave"
                        value={newKeyword}
                        onChange={(e) => setNewKeyword(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault()
                                addKeyword()
                            }
                        }}
                        className="flex-1 bg-white border border-gray-200 rounded-md"
                        classNames={{ input: 'text-black' }}
                    />
                    <Button className='text-red-500' size="sm" onPress={addKeyword}>
                        <PlusIcon className="text-red-500 h-4 w-4 mr-1" />
                        Adicionar
                    </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                    {currentKeywords.map((kw) => (
                        <div
                            key={kw}
                            className="flex items-center bg-gray-100 px-3 py-1 rounded-full space-x-1"
                        >
                            <span className="text-sm text-gray-800">{kw}</span>
                            <TrashIcon
                                className="h-4 w-4 cursor-pointer text-red-500"
                                onClick={() => removeKeyword(kw)}
                            />
                        </div>
                    ))}

                    {currentKeywords.length === 0 && (
                        <div className="text-gray-500 italic">Nenhuma keyword adicionada</div>
                    )}
                </div>
            </div>
        </div>
    )
}