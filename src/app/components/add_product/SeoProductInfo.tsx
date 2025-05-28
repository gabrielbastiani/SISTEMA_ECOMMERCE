'use client'

import React, { useState } from 'react'
import { Input, Textarea, Button, Tooltip } from '@nextui-org/react'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { ProductFormData } from 'Types/types'

interface SeoProductInfoProps {
    formData: ProductFormData
    onFormDataChange: (data: ProductFormData) => void
}

export const SeoProductInfo: React.FC<SeoProductInfoProps> = ({
    formData,
    onFormDataChange
}) => {

    const [newKeyword, setNewKeyword] = useState('');
    const currentKeywords = formData.keywords ?? [];

    // Atualiza qualquer campo do formData
    const handleChange = (field: keyof ProductFormData, value: any) => {
        onFormDataChange({ ...formData, [field]: value })
    }

    // Adiciona keyword, evitando duplicatas e entradas vazias
    const addKeyword = () => {
        const kw = newKeyword.trim()
        // só adiciona se não for vazio e ainda não existir
        if (kw && !currentKeywords.includes(kw)) {
            handleChange('keywords', [...currentKeywords, kw])
            setNewKeyword('')
        }
    }

    // Remove uma keyword existente
    const removeKeyword = (kw: string) => {
        // de novo, parte sempre de um array
        const kws = formData.keywords ?? []
        handleChange('keywords', kws.filter(k => k !== kw))
    }

    return (
        <div className="space-y-6 max-w-3xl">
            {/* Meta Title */}
            <Tooltip content="Título que aparecerá nos resultados de busca" placement="top-start" className="bg-white text-red-500 border border-gray-200 p-2">
                <Input
                    placeholder="Meta Titulo"
                    value={formData.metaTitle || ''}
                    onChange={e => handleChange('metaTitle', e.target.value)}
                    className="bg-white border border-gray-200 rounded-md"
                    classNames={{ input: 'text-black' }}
                />
            </Tooltip>

            {/* Meta Description */}
            <Tooltip content="Descrição que aparecerá nos resultados de busca" placement="top-start" className="bg-white text-red-500 border border-gray-200 p-2">
                <Textarea
                    placeholder="Meta Descrição"
                    value={formData.metaDescription || ''}
                    onChange={e => handleChange('metaDescription', e.target.value)}
                    classNames={{
                        base: 'bg-white border border-gray-200 rounded-md h-20',
                        input: 'text-black'
                    }}
                />
            </Tooltip>

            {/* Keywords */}
            <div>
                <label className="block mb-1 text-sm font-medium">Palavras chaves</label>
                <div className="flex gap-2 mb-2">
                    <Tooltip content="Insira palavras importantes refernete a esse produto, essas palavras ajudam no rankeamento junto aos motores de busca" placement="top-start" className="bg-white text-red-500 border border-gray-200 p-2">
                        <Input
                            placeholder="Adicionar keyword"
                            value={newKeyword}
                            onChange={e => setNewKeyword(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter') {
                                    e.preventDefault()
                                    addKeyword()
                                }
                            }}
                            className="bg-white border border-gray-200 rounded-md"
                            classNames={{ input: 'text-black' }}
                        />
                    </Tooltip>

                    <Button
                        size="sm"
                        variant="bordered"
                        startContent={<PlusIcon color='red' className="h-10 w-10" />}
                        onPress={addKeyword}
                    >
                        Adicionar
                    </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                    {(formData.keywords ?? []).map(kw => (
                        <div
                            key={kw}
                            className="flex items-center bg-gray-200 px-2 py-1 rounded-full space-x-1"
                        >
                            <span className="text-sm text-black">{kw}</span>
                            <Button
                                isIconOnly
                                size="lg"
                                variant="light"
                                onPress={() => removeKeyword(kw)}
                            >
                                <TrashIcon className="h-4 w-4 text-red-600" />
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}