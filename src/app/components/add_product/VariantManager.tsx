'use client'

import { useState } from 'react'
import { Button, Input, Chip, Checkbox } from '@nextui-org/react'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { MediaUploadComponent } from './MediaUploadComponent'

interface VariantManagerProps {
    variants: any[]
    onVariantsChange: (variants: any[]) => void
}

export const VariantManager = ({ variants, onVariantsChange }: VariantManagerProps) => {
    const addVariant = () => {
        onVariantsChange([
            ...variants,
            {
                sku: '',
                price_per: 0,
                stock: 0,
                attributes: [],
                images: []
            }
        ])
    }

    const updateVariant = (index: number, field: string, value: any) => {
        const newVariants = [...variants]
        newVariants[index][field] = value
        onVariantsChange(newVariants)
    }

    const addAttribute = (variantIndex: number) => {
        const newVariants = [...variants]
        newVariants[variantIndex].attributes.push({
            key: '',
            value: '',
            images: []
        })
        onVariantsChange(newVariants)
    }

    return (
        <div className="space-y-6">
            {variants.map((variant, index) => (
                <div key={index} className="border rounded-lg p-4">
                    <div className="flex gap-4 mb-4">
                        <Input
                            label="SKU"
                            value={variant.sku}
                            onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                            className="flex-1"
                        />
                        <Input
                            label="Preço"
                            type="number"
                            value={variant.price_per}
                            onChange={(e) => updateVariant(index, 'price_per', parseFloat(e.target.value))}
                            startContent="$"
                        />
                        <Input
                            label="Estoque"
                            type="number"
                            value={variant.stock}
                            onChange={(e) => updateVariant(index, 'stock', parseInt(e.target.value))}
                        />
                    </div>

                    <div className="space-y-4">
                        {variant.attributes.map((attr: any, attrIndex: number) => (
                            <div key={attrIndex} className="border p-3 rounded-lg">
                                <div className="flex gap-4 mb-2">
                                    <Input
                                        label="Atributo"
                                        placeholder="Ex: Cor"
                                        value={attr.key}
                                        onChange={(e) => {
                                            const newVariants = [...variants]
                                            newVariants[index].attributes[attrIndex].key = e.target.value
                                            onVariantsChange(newVariants)
                                        }}
                                    />
                                    <Input
                                        label="Valor"
                                        placeholder="Ex: Vermelho"
                                        value={attr.value}
                                        onChange={(e) => {
                                            const newVariants = [...variants]
                                            newVariants[index].attributes[attrIndex].value = e.target.value
                                            onVariantsChange(newVariants)
                                        }}
                                    />
                                </div>
                                <MediaUploadComponent
                                    label="Imagens do Atributo"
                                    onUpload={(files) => {
                                        const newVariants = [...variants]
                                        newVariants[index].attributes[attrIndex].images = [
                                            ...(attr.images || []),
                                            ...files
                                        ]
                                        onVariantsChange(newVariants)
                                    }}
                                    onRemove={(fileIndex) => {
                                        const newVariants = [...variants]
                                        newVariants[index].attributes[attrIndex].images.splice(fileIndex, 1)
                                        onVariantsChange(newVariants)
                                    }}
                                    files={attr.images || []}
                                />
                            </div>
                        ))}
                        <Button
                            size="sm"
                            startContent={<PlusIcon className="h-4 w-4" />}
                            onPress={() => addAttribute(index)}
                        >
                            Adicionar Atributo
                        </Button>
                    </div>
                </div>
            ))}

            <Button
                color="primary"
                variant="bordered"
                startContent={<PlusIcon className="h-4 w-4" />}
                onPress={addVariant}
            >
                Adicionar Variante
            </Button>
        </div>
    )
}