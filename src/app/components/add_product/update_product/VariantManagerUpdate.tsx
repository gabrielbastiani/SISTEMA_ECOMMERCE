'use client'

import { v4 as uuidv4 } from 'uuid'
import React from 'react'
import {
    Button,
    Input,
    Select,
    SelectItem,
    SharedSelection,
    Tooltip
} from '@nextui-org/react'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { MediaUpdateComponent } from './MediaUpdateComponent'
import { CurrencyInput } from '../CurrencyInput'
import { VideoLinksManagerUpdate } from './VideoLinksManagerUpdate'
import { PromotionOption, ProductFormData, VideoInput, ImageRecord } from 'Types/types'

interface VariantManagerUpdateProps {
    formData: ProductFormData
    onFormDataChange: (data: ProductFormData) => void
    promotions: PromotionOption[]
}

export const VariantManagerUpdate: React.FC<VariantManagerUpdateProps> = ({
    formData,
    onFormDataChange,
    promotions
}) => {

    const variants = formData.variants ?? [];

    if (!variants) {
        return null
    }

    const updateVariants = (newVariants: typeof variants) =>
        onFormDataChange({ ...formData, variants: newVariants })

    const addVariant = () => {
        updateVariants([
            ...variants,
            {
                id: uuidv4(),
                sku: '',
                price_of: 0,
                price_per: 0,
                stock: 0,
                sortOrder: 0,
                ean: '',
                mainPromotion_id: '',
                allowBackorders: false,
                existingImages: [],
                newImages: [],
                videoLinks: [],
                newVideos: [],
                attributes: [],
                images: [],
                variantAttributes: []
            }
        ])
    }

    const removeVariant = (index: number) => {
        const newList = variants.filter((_, i) => i !== index)
        updateVariants(newList)
    }

    const updateVariantField = (idx: number, field: string, value: any) => {
    const copy = [...formData.variants!]
    copy[idx] = { ...copy[idx], [field]: value }
    onFormDataChange({ ...formData, variants: copy })
}

    const promoItems = [{ id: '', name: 'Nenhuma promoção' }, ...promotions]

    return (
        <div className="space-y-6">
            {variants.map((variant, idx) => {

                const vidLinks = variant.videoLinks || [];

                return (
                    <div
                        key={variant.id}
                        className="border rounded-lg p-4 space-y-4 bg-white shadow"
                    >
                        <div className="flex justify-between items-center">
                            <h4 className="font-medium text-gray-700">
                                Variante: {variant.sku || `#${idx + 1}`}
                            </h4>
                            <Button
                                isIconOnly
                                size="sm"
                                color="danger"
                                variant="light"
                                onPress={() => removeVariant(idx)}
                            >
                                <TrashIcon className="h-5 w-5 text-red-600" />
                            </Button>
                        </div>

                        {/* SKU / EAN */}
                        <div className="grid grid-cols-2 gap-4">
                            <Tooltip content="SKU da variante" placement="top-start">
                                <Input
                                    placeholder="SKU"
                                    value={variant.sku}
                                    onChange={(e) =>
                                        updateVariantField(idx, 'sku', e.target.value)
                                    }
                                    className="text-black"
                                />
                            </Tooltip>
                            <Tooltip content="EAN da variante" placement="top-start">
                                <Input
                                    placeholder="EAN"
                                    value={variant.ean}
                                    onChange={(e) =>
                                        updateVariantField(idx, 'ean', e.target.value)
                                    }
                                    className="text-black"
                                />
                            </Tooltip>
                        </div>

                        {/* Preço e ordem */}
                        <div className="grid grid-cols-3 gap-4">
                            <Tooltip content="Preço De" placement="top-start">
                                <CurrencyInput
                                    placeholder="Preço De"
                                    value={variant.price_of || 0}
                                    onChange={(v) =>
                                        updateVariantField(idx, 'price_of', Number(v))
                                    }
                                />
                            </Tooltip>
                            <Tooltip content="Preço Por" placement="top-start">
                                <CurrencyInput
                                    placeholder="Preço Por"
                                    value={variant.price_per || 0}
                                    onChange={(v) =>
                                        updateVariantField(idx, 'price_per', Number(v))
                                    }
                                />
                            </Tooltip>
                            <Tooltip content="Ordem de exibição" placement="top-start">
                                <Input
                                    type="number"
                                    placeholder="Ordem"
                                    value={String(variant.sortOrder || 0)}
                                    onChange={(e) =>
                                        updateVariantField(
                                            idx,
                                            'sortOrder',
                                            Number(e.target.value)
                                        )
                                    }
                                    className="text-black"
                                />
                            </Tooltip>
                        </div>

                        {/* Estoque / Promoção */}
                        <div className="grid grid-cols-2 gap-4">
                            <Tooltip content="Estoque" placement="top-start">
                                <Input
                                    type="number"
                                    placeholder="Estoque"
                                    value={String(variant.stock || 0)}
                                    onChange={(e) =>
                                        updateVariantField(idx, 'stock', Number(e.target.value))
                                    }
                                    className="text-black"
                                />
                            </Tooltip>
                            <Tooltip content="Promoção" placement="top-start">
                                <Select
                                    placeholder="Promoção"
                                    items={promoItems}
                                    selectedKeys={
                                        variant.mainPromotion_id
                                            ? new Set([variant.mainPromotion_id])
                                            : new Set<string>()
                                    }
                                    onSelectionChange={(keys: SharedSelection) => {
                                        const key =
                                            typeof keys === 'string'
                                                ? keys
                                                : (Array.from(keys)[0] as string)
                                        updateVariantField(
                                            idx,
                                            'mainPromotion_id',
                                            key || null
                                        )
                                    }}
                                >
                                    {(item: PromotionOption) => (
                                        <SelectItem key={item.id} value={item.id}>
                                            {item.name}
                                        </SelectItem>
                                    )}
                                </Select>
                            </Tooltip>
                        </div>

                        {/* Vídeos da variante */}
                        <VideoLinksManagerUpdate
                            links={vidLinks}
                            onLinksChange={newLinks =>
                                updateVariantField(idx, 'videoLinks', newLinks)
                            }
                        />

                        {/* Imagens da variante */}
                        <MediaUpdateComponent
                            label="Imagens da Variante"
                            existingFiles={variant.existingImages || []}
                            newFiles={variant.newImages || []}
                            onAddNew={(files) =>
                                updateVariantField(idx, 'newImages', files)
                            }
                            onRemoveExisting={(id: string) => {
                                const keep = (variant.existingImages || []).filter(
                                    (img) => img.id !== id
                                )
                                updateVariantField(idx, 'existingImages', keep)
                            }}
                            onRemoveNew={(i: number) => {
                                const keep = (variant.newImages || []).filter(
                                    (_f, j) => j !== i
                                )
                                updateVariantField(idx, 'newImages', keep)
                            }}
                        />

                        {/* Atributos */}
                        <div className="space-y-4">
                            {variant.attributes.map((attr, ai) => (
                                <div
                                    key={ai}
                                    className="border p-3 rounded-lg bg-gray-50 relative"
                                >
                                    <Button
                                        isIconOnly
                                        size="sm"
                                        variant="light"
                                        className="absolute top-2 right-2"
                                        onPress={() => {
                                            const copy = [...variants]
                                            copy[idx].attributes.splice(ai, 1)
                                            updateVariants(copy)
                                        }}
                                    >
                                        <TrashIcon className="h-5 w-5 text-red-600" />
                                    </Button>

                                    <div className="flex gap-4 mb-2">
                                        <Tooltip content="Nome do atributo" placement="top-start">
                                            <Input
                                                placeholder="Nome Atributo"
                                                value={attr.key}
                                                onChange={(e) => {
                                                    const copy = [...variants]
                                                    copy[idx].attributes[ai].key = e.target.value
                                                    updateVariants(copy)
                                                }}
                                                className="text-black"
                                            />
                                        </Tooltip>
                                        <Tooltip content="Valor do atributo" placement="top-start">
                                            <Input
                                                placeholder="Valor Atributo"
                                                value={attr.value}
                                                onChange={(e) => {
                                                    const copy = [...variants]
                                                    copy[idx].attributes[ai].value = e.target.value
                                                    updateVariants(copy)
                                                }}
                                                className="text-black"
                                            />
                                        </Tooltip>
                                    </div>

                                    {/* Imagens de atributo */}
                                    <MediaUpdateComponent
                                        label="Imagens do Atributo"
                                        existingFiles={attr.existingImages || []}
                                        newFiles={attr.newImages || []}
                                        onAddNew={(files) => {
                                            const copy = [...variants]
                                            copy[idx].attributes[ai].newImages = files
                                            updateVariants(copy)
                                        }}
                                        onRemoveExisting={(id: string) => {
                                            const keep = (attr.existingImages || []).filter(
                                                (img) => img.id !== id
                                            )
                                            const copy = [...variants]
                                            copy[idx].attributes[ai].existingImages = keep
                                            updateVariants(copy)
                                        }}
                                        onRemoveNew={(i: number) => {
                                            const keep = (attr.newImages || []).filter(
                                                (_f, j) => j !== i
                                            )
                                            const copy = [...variants]
                                            copy[idx].attributes[ai].newImages = keep
                                            updateVariants(copy)
                                        }}
                                    />
                                </div>
                            ))}

                            <Button
                                size="sm"
                                variant="bordered"
                                startContent={<PlusIcon />}
                                onPress={() => {
                                    const copy = [...variants]
                                    copy[idx].attributes.push({
                                        key: '',
                                        value: '',
                                        existingImages: [],
                                        newImages: []
                                    })
                                    updateVariants(copy)
                                }}
                            >
                                Adicionar Atributo
                            </Button>
                        </div>
                    </div>
                )
            })}

            <Button
                size="sm"
                variant="bordered"
                startContent={<PlusIcon />}
                onPress={addVariant}
            >
                Adicionar Variante
            </Button>
        </div>
    )
}