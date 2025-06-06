'use client'

import { useState } from 'react'
import {
    Accordion,
    AccordionItem,
    Button,
    Input,
    Select,
    SelectItem,
    Tooltip
} from '@nextui-org/react'
import { Editor } from '@tinymce/tinymce-react'
import { TrashIcon, PlusIcon } from '@heroicons/react/24/outline'
import { ProductDescription, StatusDescription } from 'Types/types'

const TOKEN_TINY = process.env.NEXT_PUBLIC_TINYMCE_API_KEY

interface ProductDescriptionEditorProps {
    descriptions: ProductDescription[]
    onDescriptionsChange: (descriptions: ProductDescription[]) => void
}

export const ProductDescriptionEditor = ({
    descriptions,
    onDescriptionsChange
}: ProductDescriptionEditorProps) => {
    const [activeIndex, setActiveIndex] = useState<number | null>(null)

    const addDescription = () => {
        const newDescription: ProductDescription = {
            title: '',
            description: '',
            status: 'DISPONIVEL'
        }
        onDescriptionsChange([...descriptions, newDescription])
        setActiveIndex(descriptions.length)
    }

    const updateDescription = (
        index: number,
        field: keyof ProductDescription,
        value: string
    ) => {
        const newDescriptions = [...descriptions]
        newDescriptions[index] = { ...newDescriptions[index], [field]: value }
        onDescriptionsChange(newDescriptions)
    }

    const removeDescription = (index: number) => {
        const newDescriptions = descriptions.filter((_, i) => i !== index)
        onDescriptionsChange(newDescriptions)
        setActiveIndex(null)
    }

    return (
        <div className="space-y-4">
            <Accordion
                selectionMode="multiple"
                selectedKeys={activeIndex !== null ? [activeIndex.toString()] : []}
                onSelectionChange={(keys) => {
                    const keyArray = Array.from(keys) as string[]
                    setActiveIndex(keyArray.length > 0 ? parseInt(keyArray[0]) : null)
                }}
            >
                {descriptions.map((desc, index) => (
                    <AccordionItem
                        key={index}
                        title={desc.title || `Descrição ${index + 1}`}
                        subtitle={desc.status}
                        startContent={
                            <Button
                                as="div"
                                size="sm"
                                variant="light"
                                className="text-danger p-1"
                                onPress={() => removeDescription(index)}
                                aria-label="Remover descrição"
                            >
                                <TrashIcon color='red' className="h-4 w-4" />
                            </Button>
                        }
                    >
                        <div className="space-y-4 p-2">
                            <Tooltip
                                content="Título para a descrição EX: Informações do produto"
                                placement="top-start"
                                className="bg-white text-red-500 border border-gray-200 p-2"
                            >
                                <Input
                                    placeholder="Título"
                                    value={desc.title}
                                    onChange={(e) =>
                                        updateDescription(index, 'title', e.target.value)
                                    }
                                    isRequired
                                    className="bg-white border border-gray-200 rounded-md"
                                    classNames={{
                                        input: 'text-black'
                                    }}
                                />
                            </Tooltip>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Conteúdo</label>
                                <Editor
                                    apiKey={TOKEN_TINY}
                                    /* 1) Carrega o core do TinyMCE direto do CDN: */
                                    tinymceScriptSrc={`https://cdn.tiny.cloud/1/${TOKEN_TINY}/tinymce/6/tinymce.min.js`}
                                    init={{
                                        base_url: `https://cdn.tiny.cloud/1/${TOKEN_TINY}/tinymce/6`,
                                        suffix: '.min',
                                        height: 500,
                                        menubar: true,
                                        /* lista de plugins como string única (todos irão vir do CDN) */
                                        plugins:
                                            'advlist autolink lists link image charmap preview anchor ' +
                                            'searchreplace visualblocks code fullscreen ' +
                                            'insertdatetime media table help wordcount',
                                        toolbar:
                                            'undo redo | formatselect | bold italic backcolor | ' +
                                            'alignleft aligncenter alignright alignjustify | ' +
                                            'bullist numlist outdent indent | removeformat | help',
                                        content_style:
                                            'body { font-family: Arial, sans-serif; font-size: 14px }'
                                    }}
                                    value={desc.description}
                                    onEditorChange={(content) =>
                                        updateDescription(index, 'description', content)
                                    }
                                />
                            </div>

                            <Tooltip
                                content="Status de disponibilidade dessa descrição, para ser mostrada ou não na página do produto"
                                placement="top-start"
                                className="bg-white text-red-500 border border-gray-200 p-2"
                            >
                                <Select
                                    placeholder="Status"
                                    selectedKeys={[desc.status || 'DISPONIVEL']}
                                    onChange={(e) =>
                                        updateDescription(
                                            index,
                                            'status',
                                            e.target.value as StatusDescription
                                        )
                                    }
                                    className="bg-white border border-gray-200 rounded-md text-black"
                                    classNames={{
                                        trigger: 'text-black border-gray-200'
                                    }}
                                >
                                    <SelectItem
                                        key="DISPONIVEL"
                                        value="DISPONIVEL"
                                        className="text-black bg-white"
                                    >
                                        Disponível
                                    </SelectItem>
                                    <SelectItem
                                        key="INDISPONIVEL"
                                        value="INDISPONIVEL"
                                        className="text-black bg-white"
                                    >
                                        Indisponível
                                    </SelectItem>
                                </Select>
                            </Tooltip>
                        </div>
                    </AccordionItem>
                ))}
            </Accordion>

            <button
                type="button"
                className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600"
                onClick={addDescription}
            >
                <PlusIcon className="h-4 w-4" />
                <span>Adicionar Descrição</span>
            </button>
        </div>
    )
}