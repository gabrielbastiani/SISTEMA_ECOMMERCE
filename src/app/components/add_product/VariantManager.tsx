'use client'

import React, { useState } from 'react'
import { Button, Input, Select, SelectItem, Tooltip } from '@nextui-org/react'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { MediaUploadComponent } from './MediaUploadComponent'
import { CurrencyInput } from './CurrencyInput'
import { PromotionOption, VariantFormData } from 'Types/types'
import { CollapsibleInfo } from './helpers_componentes/CollapsibleInfo'
import { VideoLinksManager } from './VideoLinksManager'

interface VideoLink {
    url: string
    thumbnail?: string
}

interface VariantManagerProps {
    variants: VariantFormData[]
    onVariantsChange: (variants: VariantFormData[]) => void
    promotions: PromotionOption[]
    variantFiles: Record<string, File[]>
    setVariantFiles: React.Dispatch<React.SetStateAction<Record<string, File[]>>>
    attributeFiles: Record<string, Record<number, File[]>>
    setAttributeFiles: React.Dispatch<React.SetStateAction<Record<string, Record<number, File[]>>>>
}

export const VariantManager: React.FC<VariantManagerProps> = ({
    variants,
    onVariantsChange,
    promotions,
    variantFiles,
    setVariantFiles,
    attributeFiles,
    setAttributeFiles
}) => {
    // Gerencia links de vídeo por SKU
    const [variantVideoLinks, setVariantVideoLinks] = useState<Record<string, VideoLink[]>>({})

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
                images: []
            }
        ])
    }

    const removeVariant = (index: number) => {
        const sku = variants[index].sku
        const newVariants = variants.filter((_, i) => i !== index)
        onVariantsChange(newVariants)
        // Limpa links de vídeo associados
        setVariantVideoLinks(prev => {
            const copy = { ...prev }
            delete copy[sku]
            return copy
        })
    }

    const updateVariant = (index: number, field: keyof VariantFormData, value: any) => {
        const newVariants = [...variants]
        newVariants[index] = { ...newVariants[index], [field]: value }
        onVariantsChange(newVariants)
    }

    const addAttribute = (variantIndex: number) => {
        const newVariants = [...variants]
        newVariants[variantIndex].attributes.push({ key: '', value: '' })
        onVariantsChange(newVariants)
    }

    return (
        <div className="space-y-6">
            <CollapsibleInfo />
            {variants.map((variant, idx) => {
                const sku = variant.sku || `new-${idx}`
                const filesForVariant = variantFiles[sku] || []
                const videoLinks = variantVideoLinks[sku] || []
                return (
                    <div key={idx} className="border rounded-lg p-4 space-y-4">
                        <div className="flex justify-between items-center">
                            <h4 className="font-medium">Variante: {variant.sku || `#${idx + 1}`}</h4>
                            <Button isIconOnly size="sm" color="danger" variant="light" onPress={() => removeVariant(idx)}>
                                <TrashIcon className="h-5 w-5 text-red-600" />
                            </Button>
                        </div>
                        {/* Campos básicos */}
                        <div className="grid grid-cols-2 gap-4">
                            <Input placeholder="SKU" value={variant.sku} onChange={e => updateVariant(idx, 'sku', e.target.value)} />
                            <Input placeholder="EAN" value={variant.ean} onChange={e => updateVariant(idx, 'ean', e.target.value)} />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <CurrencyInput placeholder="Preço De" value={variant.price_of || 0} onChange={v => updateVariant(idx, 'price_of', v)} />
                            <CurrencyInput placeholder="Preço Por" value={variant.price_per || 0} onChange={v => updateVariant(idx, 'price_per', v)} />
                            <Input type="number" placeholder="Ordem" value={String(variant.sortOrder)} onChange={e => updateVariant(idx, 'sortOrder', Number(e.target.value))} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Input type="number" placeholder="Estoque" value={String(variant.stock)} onChange={e => updateVariant(idx, 'stock', Number(e.target.value))} />
                            <Select placeholder="Promoção" selectedKeys={variant.mainPromotion_id ? new Set([variant.mainPromotion_id]) : new Set()} onSelectionChange={keys => updateVariant(idx, 'mainPromotion_id', Array.from(keys)[0] as string)}>
                                {promotions.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                            </Select>
                        </div>
                        {/* Vídeos da Variante */}
                        <VideoLinksManager
                            label="Vídeos da Variante"
                            links={videoLinks}
                            onLinksChange={links => setVariantVideoLinks(prev => ({ ...prev, [sku]: links }))}
                        />
                        {/* Imagens da Variante */}
                        <MediaUploadComponent
                            label="Imagens da Variante"
                            files={filesForVariant}
                            onUpload={files => setVariantFiles(prev => ({ ...prev, [sku]: [...(prev[sku] || []), ...files] }))}
                            onRemove={i => setVariantFiles(prev => ({ ...prev, [sku]: (prev[sku] || []).filter((_, j) => j !== i) }))}
                        />
                        {/* Atributos */}
                        <div className="space-y-4">
                            {variant.attributes.map((attr, ai) => (
                                <div key={ai} className="border p-3 rounded-lg">
                                    <div className="flex gap-4 mb-2">
                                        <Input placeholder="Nome Atributo" value={attr.key} onChange={e => { const nv = [...variants]; nv[idx].attributes[ai].key = e.target.value; onVariantsChange(nv); }} />
                                        <Input placeholder="Valor Atributo" value={attr.value} onChange={e => { const nv = [...variants]; nv[idx].attributes[ai].value = e.target.value; onVariantsChange(nv); }} />
                                    </div>
                                    <MediaUploadComponent
                                        label="Imagens do Atributo"
                                        files={attributeFiles[sku]?.[ai] || []}
                                        onUpload={files => setAttributeFiles(prev => ({ ...prev, [sku]: { ...(prev[sku] || {}), [ai]: [...(prev[sku]?.[ai] || []), ...files] } }))}
                                        onRemove={i => setAttributeFiles(prev => ({ ...prev, [sku]: { ...(prev[sku] || {}), [ai]: (prev[sku]?.[ai] || []).filter((_, j) => j !== i) } }))}
                                    />
                                </div>
                            ))}
                            <Button size="sm" variant="bordered" startContent={<PlusIcon />} onPress={() => addAttribute(idx)}>
                                Adicionar Atributo
                            </Button>
                        </div>
                    </div>
                )
            })}
            <Button size="sm" variant="bordered" startContent={<PlusIcon />} onPress={addVariant}>
                Adicionar Variante
            </Button>
        </div>
    )
}