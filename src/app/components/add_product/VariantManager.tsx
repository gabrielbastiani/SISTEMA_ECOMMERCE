'use client'

import { Button, Input, Select, SelectItem, Tooltip } from '@nextui-org/react'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { MediaUploadComponent } from './MediaUploadComponent'
import { CurrencyInput } from './CurrencyInput'
import { ProductVariant, PromotionOption, VariantFormData } from 'Types/types'
import { CollapsibleInfo } from './helpers_componentes/CollapsibleInfo'

interface VariantManagerProps {
    variants: VariantFormData[]
    onVariantsChange: (variants: VariantFormData[]) => void
    promotions: PromotionOption[]
}

export const VariantManager = ({ variants, onVariantsChange, promotions }: VariantManagerProps) => {

    const addVariant = () => {
        onVariantsChange([
            ...variants,
            {
                sku: '',
                price_of: 0,
                price_per: 0,
                stock: 0,
                sortOrder: 0,
                ean: '',
                mainPromotion_id: '',
                allowBackorders: false,
                attributes: [],
                images: [],
                id: '',
                product_id: '',
                created_at: ''
            }
        ])
    }

    const removeVariant = (index: number) => {
        const newVariants = variants.filter((_, i) => i !== index)
        onVariantsChange(newVariants)
    }

    const updateVariant = (index: number, field: keyof ProductVariant, value: any) => {
        const newVariants = [...variants]
        newVariants[index] = { ...newVariants[index], [field]: value }
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
            <CollapsibleInfo />
            {variants.map((variant, index) => (
                <div key={index} className="border rounded-lg p-4 relative">
                    <Button
                        isIconOnly
                        size="sm"
                        color="danger"
                        variant="light"
                        className="absolute top-3 right-3"
                        onPress={() => removeVariant(index)}
                    >
                        <TrashIcon color='red' className="h-6 w-5 z-10" />
                    </Button>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <Tooltip
                            content="Codigo da variante correspondente ao produto principal"
                            placement="top-start"
                            className="bg-white text-red-500 border border-gray-200 p-2"
                        >
                            <Input
                                placeholder="SKU"
                                value={variant.sku}
                                onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                                className="bg-white border border-gray-200 rounded-md"
                                classNames={{
                                    input: "text-black",
                                }}
                            />
                        </Tooltip>

                        <Tooltip
                            content="Código de barras EAN/GTIN"
                            placement="top-start"
                            className="bg-white text-red-500 border border-gray-200 p-2"
                        >
                            <Input
                                placeholder="EAN"
                                value={variant.ean}
                                onChange={(e) => updateVariant(index, 'ean', e.target.value)}
                                className="bg-white border border-gray-200 rounded-md w-96"
                                classNames={{
                                    input: "text-black",
                                }}
                            />
                        </Tooltip>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                        <Tooltip
                            content="Preço original sem desconto"
                            placement="top-start"
                            className="bg-white text-red-500 border border-gray-200 p-2"
                        >
                            <div>
                                <CurrencyInput
                                    placeholder="Preço De"
                                    value={variant.price_of || 0}
                                    onChange={(value) => updateVariant(index, 'price_of', value)}
                                />
                            </div>
                        </Tooltip>

                        <Tooltip
                            content="Preço original de venda"
                            placement="top-start"
                            className="bg-white text-red-500 border border-gray-200 p-2"
                        >
                            <div>
                                <CurrencyInput
                                    placeholder="Preço Por"
                                    value={variant.price_per || 0}
                                    onChange={(value) => updateVariant(index, 'price_per', value)}
                                />
                            </div>
                        </Tooltip>

                        <Tooltip
                            content="Ordenação da variante perante ao produto principal"
                            placement="top-start"
                            className="bg-white text-red-500 border border-gray-200 p-2"
                        >
                            <Input
                                type="number"
                                placeholder="Ordem"
                                value={variant.sortOrder?.toString() || '0'}
                                onChange={(e) => updateVariant(index, 'sortOrder', parseInt(e.target.value) || 0)}
                                className="bg-white border border-gray-200 rounded-md"
                                classNames={{
                                    input: "text-black",
                                }}
                            />
                        </Tooltip>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <Tooltip
                            content="Quantidade disponível em estoque da variante"
                            placement="top-start"
                            className="bg-white text-red-500 border border-gray-200 p-2"
                        >
                            <Input
                                placeholder="Estoque"
                                type="number"
                                min="0"
                                value={variant.stock.toString()}
                                onChange={(e) => updateVariant(index, 'stock', parseInt(e.target.value) || 0)}
                                className="bg-white border border-gray-200 rounded-md"
                                classNames={{
                                    input: "text-black",
                                }}
                            />
                        </Tooltip>

                        <Tooltip
                            content="Promoção principal ativa para esta variante"
                            placement="top-start"
                            className="bg-white text-red-500 border border-gray-200 p-2"
                        >
                            <Select
                                placeholder='Promoção principal'
                                selectedKeys={variant.mainPromotion_id ? [variant.mainPromotion_id] : []}
                                onChange={(e) => updateVariant(index, 'mainPromotion_id', e.target.value)}
                                className="bg-white border border-gray-200 rounded-md text-black"
                                classNames={{
                                    trigger: "text-black border-gray-200",
                                }}
                            >
                                {promotions.map(promotion => (
                                    <SelectItem
                                        key={promotion.id}
                                        value={promotion.id}
                                        className="text-black bg-white"
                                    >
                                        {promotion.name}
                                    </SelectItem>
                                ))}
                            </Select>
                        </Tooltip>
                    </div>

                    <div className="space-y-4">
                        {variant.attributes.map((attr: any, attrIndex: number) => (
                            <div key={attrIndex} className="border p-3 rounded-lg">
                                <div className="flex gap-4 mb-2">
                                    <Tooltip
                                        content="Chave do atributo. EX: Cor"
                                        placement="top-start"
                                        className="bg-white text-red-500 border border-gray-200 p-2"
                                    >
                                        <Input
                                            placeholder="Nome"
                                            value={attr.key}
                                            onChange={(e) => {
                                                const newVariants = [...variants]
                                                newVariants[index].attributes[attrIndex].key = e.target.value
                                                onVariantsChange(newVariants)
                                            }}
                                            className="bg-white border border-gray-200 rounded-md"
                                            classNames={{
                                                input: "text-black",
                                            }}
                                        />
                                    </Tooltip>

                                    <Tooltip
                                        content="Valor do atributo. EX: Azul"
                                        placement="top-start"
                                        className="bg-white text-red-500 border border-gray-200 p-2"
                                    >
                                        <Input
                                            placeholder="Valor"
                                            value={attr.value}
                                            onChange={(e) => {
                                                const newVariants = [...variants]
                                                newVariants[index].attributes[attrIndex].value = e.target.value
                                                onVariantsChange(newVariants)
                                            }}
                                            className="bg-white border border-gray-200 rounded-md"
                                            classNames={{
                                                input: "text-black",
                                            }}
                                        />
                                    </Tooltip>
                                </div>
                                <MediaUploadComponent
                                    label="Imagens do Atributo"
                                    onUpload={(files) => {
                                        const newVariants = [...variants]
                                        if (!newVariants[index].attributes) {
                                            newVariants[index].attributes = []
                                        }
                                        if (!newVariants[index].attributes[attrIndex]) {
                                            newVariants[index].attributes[attrIndex] = {
                                                key: '',
                                                value: '',
                                                images: []
                                            }
                                        }
                                        newVariants[index].attributes[attrIndex].images = [
                                            ...(newVariants[index].attributes[attrIndex].images || []),
                                            ...files
                                        ]

                                        onVariantsChange(newVariants)
                                    }}
                                    onRemove={(fileIndex) => {
                                        const newVariants = [...variants]
                                        if (newVariants[index].attributes?.[attrIndex]?.images) {
                                            newVariants[index].attributes[attrIndex].images.splice(fileIndex, 1)
                                            onVariantsChange(newVariants)
                                        }
                                    }}
                                    files={attr.images || []}
                                />
                            </div>
                        ))}
                        <Button
                            className='text-violet-500'
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
                className='bg-orange-500 text-white'
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