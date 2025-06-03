'use client'

import { useState } from 'react'
import { Accordion, AccordionItem, Button, Input, Select, SelectItem, SharedSelection, Tooltip } from '@nextui-org/react'
import { Editor } from '@tinymce/tinymce-react'
import { TrashIcon, PlusIcon } from '@heroicons/react/24/outline'
import { ProductDescription, StatusDescription } from 'Types/types'

const TOKEN_TINY = process.env.NEXT_PUBLIC_TINYMCE_API_KEY

export interface ProductDescriptionWithId extends ProductDescription {
    id?: string
}

interface ProductDescriptionEditorUpdateProps {
    descriptions: ProductDescriptionWithId[]
    onDescriptionsChange: (descriptions: ProductDescriptionWithId[]) => void
}

export const ProductDescriptionEditorUpdate = ({
    descriptions,
    onDescriptionsChange
}: ProductDescriptionEditorUpdateProps) => {
    const [activeIndex, setActiveIndex] = useState<number | null>(null)

    const addDescription = () => {
        const newDesc: ProductDescriptionWithId = {
            title: '',
            description: '',
            status: 'DISPONIVEL'
        }
        onDescriptionsChange([...descriptions, newDesc])
        setActiveIndex(descriptions.length)
    }

    const updateDescription = (
        index: number,
        field: keyof ProductDescription,
        value: string
    ) => {
        const list = [...descriptions]
        list[index] = { ...list[index], [field]: value }
        onDescriptionsChange(list)
    }

    const removeDescription = (index: number) => {
        const list = descriptions.filter((_, i) => i !== index)
        onDescriptionsChange(list)
        setActiveIndex(null)
    }

    return (
        <div className="space-y-4">
            <Accordion
                selectionMode="multiple"
                selectedKeys={activeIndex !== null ? [activeIndex.toString()] : []}
                onSelectionChange={(keys) => {
                    const arr = Array.from(keys) as string[]
                    setActiveIndex(arr.length > 0 ? parseInt(arr[0]) : null)
                }}
            >
                {descriptions.map((desc, idx) => (
                    <AccordionItem
                        key={idx}
                        title={desc.title || `Descrição ${idx + 1}`}
                        subtitle={desc.status}
                        startContent={
                            <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                className="text-danger"
                                onPress={() => removeDescription(idx)}
                            >
                                <TrashIcon color="red" className="h-4 w-4" />
                            </Button>
                        }
                    >
                        <div className="space-y-4 p-2">
                            {/* Campo Título */}
                            <Tooltip
                                content="Título da seção de descrição"
                                placement="top-start"
                                className="bg-white text-red-500 border border-gray-200 p-2"
                            >
                                <Input
                                    placeholder="Título"
                                    value={desc.title}
                                    onChange={(e) => updateDescription(idx, 'title', e.target.value)}
                                    isRequired
                                    className="bg-white border border-gray-200 rounded-md"
                                    classNames={{ input: 'text-black' }}
                                />
                            </Tooltip>

                            {/* Editor Rich Text */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Conteúdo</label>
                                <Editor
                                    apiKey={TOKEN_TINY}
                                    value={desc.description}
                                    onEditorChange={(content) =>
                                        updateDescription(idx, 'description', content)
                                    }
                                    init={{
                                        height: 300,
                                        menubar: true,
                                        plugins: [
                                            'advlist autolink lists link image charmap print preview anchor',
                                            'searchreplace visualblocks code fullscreen',
                                            'insertdatetime media table paste code help wordcount'
                                        ],
                                        toolbar:
                                            'undo redo | formatselect | bold italic backcolor | ' +
                                            'alignleft aligncenter alignright alignjustify | ' +
                                            'bullist numlist outdent indent | removeformat | help',
                                        content_style:
                                            'body { font-family: Arial, sans-serif; font-size: 14px }'
                                    }}
                                />
                            </div>

                            {/* Select de Status */}
                            <Tooltip
                                content="Mostrar esta descrição no produto?"
                                placement="top-start"
                                className="bg-white text-red-500 border border-gray-200 p-2"
                            >
                                <Select
                                    placeholder="Status"
                                    selectedKeys={new Set([desc.status ?? 'DISPONIVEL'])}
                                    onSelectionChange={(keys: SharedSelection) => {
                                        const key = typeof keys === 'string'
                                            ? keys
                                            : (Array.from(keys)[0] as StatusDescription)
                                        updateDescription(idx, 'status', key)
                                    }}
                                    className="bg-white border border-gray-200 rounded-md text-black"
                                    classNames={{ trigger: 'text-black border-gray-200' }}
                                >
                                    <SelectItem key="DISPONIVEL" value="DISPONIVEL">
                                        Disponível
                                    </SelectItem>
                                    <SelectItem key="INDISPONIVEL" value="INDISPONIVEL">
                                        Indisponível
                                    </SelectItem>
                                </Select>

                            </Tooltip>
                        </div>
                    </AccordionItem>
                ))}
            </Accordion>

            {/* Botão adicionar nova descrição */}
            <Button
                className="bg-orange-500 text-white"
                color="primary"
                variant="bordered"
                startContent={<PlusIcon className="h-4 w-4" />}
                onPress={addDescription}
            >
                Adicionar Descrição
            </Button>
        </div>
    )
}