'use client'

import { Input, Select, SelectItem, SharedSelection, Tooltip } from '@nextui-org/react'
import { CurrencyInput } from '@/app/components/add_product/CurrencyInput'
import { MediaUploadComponent } from '@/app/components/add_product/MediaUploadComponent'
import { ProductFormData, PromotionOption, StatusProduct } from 'Types/types'
import { ChangeEvent } from 'react'

interface BasicProductInfoProps {
    formData: ProductFormData
    onFormDataChange: (data: ProductFormData) => void
    promotions: PromotionOption[]
}

export const BasicProductInfoUpdate = ({
    formData,
    onFormDataChange,
    promotions
}: BasicProductInfoProps) => {
    // manipula campos básicos
    const handleChange = (field: keyof ProductFormData, value: any) => {
        onFormDataChange({ ...formData, [field]: value })
    }

    // Remove imagem existente
    const handleRemoveExisting = (id: string) => {
        const filtered = formData.existingImages?.filter(img => img.id !== id) || []
        onFormDataChange({ ...formData, existingImages: filtered })
    }

    // Adiciona novas imagens
    const handleAddNew = (files: File[]) => {
        onFormDataChange({ ...formData, newImages: files })
    }

    const promoItems = [{ id: '', name: 'Nenhuma promoção' }, ...promotions]

    return (
        <div className="space-y-6 max-w-3xl">
            {/* Nome */}
            <div className="grid grid-cols-1 gap-4">
                <Tooltip content="Nome completo do produto para exibição" placement="top-start" className="bg-white text-red-500 border border-gray-200 p-2">
                    <Input
                        placeholder="Nome do Produto"
                        value={formData.name}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange('name', e.target.value)}
                        isRequired
                        className="bg-white border border-gray-200 rounded-md"
                        classNames={{ input: "text-black" }}
                    />
                </Tooltip>
            </div>

            {/* Marca, EAN, SKU */}
            <div className="grid grid-cols-3 gap-4">
                <Tooltip content="Marca/fabricante" placement="top-start" className="bg-white text-red-500 border border-gray-200 p-2">
                    <Input
                        placeholder="Marca"
                        value={formData.brand}
                        onChange={e => handleChange('brand', e.target.value)}
                        className="bg-white border border-gray-200 rounded-md"
                        classNames={{ input: "text-black" }}
                    />
                </Tooltip>

                <Tooltip content="Código de barras EAN/GTIN" placement="top-start" className="bg-white text-red-500 border border-gray-200 p-2">
                    <Input
                        placeholder="EAN"
                        value={formData.ean}
                        onChange={e => handleChange('ean', e.target.value)}
                        className="bg-white border border-gray-200 rounded-md"
                        classNames={{ input: "text-black" }}
                    />
                </Tooltip>

                <Tooltip content="SKU principal" placement="top-start" className="bg-white text-red-500 border border-gray-200 p-2">
                    <Input
                        placeholder="SKU Master"
                        value={formData.skuMaster}
                        onChange={e => handleChange('skuMaster', e.target.value)}
                        className="bg-white border border-gray-200 rounded-md"
                        classNames={{ input: "text-black" }}
                    />
                </Tooltip>
            </div>

            {/* Preços */}
            <div className="grid grid-cols-2 gap-4">
                <Tooltip content="Preço original" placement="top-start" className="bg-white text-red-500 border border-gray-200 p-2">
                    <CurrencyInput
                        placeholder="Preço De"
                        value={formData.price_of || 0}
                        onChange={v => handleChange('price_of', Number(v))}
                    />
                </Tooltip>
                <Tooltip content="Preço de venda" placement="top-start" className="bg-white text-red-500 border border-gray-200 p-2">
                    <CurrencyInput
                        placeholder="Preço Por"
                        value={formData.price_per || 0}
                        onChange={v => handleChange('price_per', Number(v))}
                    />
                </Tooltip>
            </div>

            {/* Dimensões */}
            <div className="grid grid-cols-4 gap-4">
                {[
                    { label: "Peso (kg)", field: 'weight', tooltip: "Peso total" },
                    { label: "Comprimento (cm)", field: 'length', tooltip: "Frente para trás" },
                    { label: "Largura (cm)", field: 'width', tooltip: "Lado a lado" },
                    { label: "Altura (cm)", field: 'height', tooltip: "Base ao topo" }
                ].map(({ label, field, tooltip }) => (
                    <Tooltip key={field} content={tooltip} placement="top-start" className="bg-white text-red-500 border border-gray-200 p-2">
                        <div>
                            <label className="block mb-1 text-sm font-medium text-foreground">{label}</label>
                            <Input
                                type="number"
                                value={formData[field]?.toString() || ''}
                                onChange={e => handleChange(field as keyof ProductFormData, Number(e.target.value))}
                                className="bg-white border border-gray-200"
                                classNames={{ input: "text-black" }}
                            />
                        </div>
                    </Tooltip>
                ))}
            </div>

            {/* Estoque e Status */}
            <div className="grid grid-cols-2 gap-4">
                <Tooltip content="Quantidade em estoque" placement="top-start" className="bg-white text-red-500 border border-gray-200 p-2">
                    <Input
                        placeholder="Estoque"
                        type="number"
                        value={formData.stock?.toString() || ''}
                        onChange={e => handleChange('stock', Number(e.target.value))}
                        className="bg-white border border-gray-200 rounded-md"
                        classNames={{ input: "text-black" }}
                    />
                </Tooltip>
                <Tooltip content="Disponibilidade" placement="top-start" className="bg-white text-red-500 border border-gray-200 p-2">
                    <Select
                        placeholder="Status"
                        selectedKeys={formData.status ? [formData.status] : []}
                        onChange={e => handleChange('status', e as StatusProduct)}
                        className="bg-white border border-gray-200 rounded-md text-black"
                        classNames={{ trigger: "text-black border-gray-200" }}
                    >
                        <SelectItem key="DISPONIVEL" value="DISPONIVEL">Disponível</SelectItem>
                        <SelectItem key="INDISPONIVEL" value="INDISPONIVEL">Indisponível</SelectItem>
                    </Select>
                </Tooltip>
            </div>

            {/* Promoção */}
            <Tooltip content="Promoção principal" placement="top-start" className="bg-white text-red-500 border border-gray-200 p-2">
                <Select
                    placeholder="Promoção"
                    items={promoItems}
                    selectedKeys={formData.mainPromotion_id ? new Set([formData.mainPromotion_id]) : new Set()}
                    onSelectionChange={(keys: SharedSelection) => {
                        const key = typeof keys === 'string' ? keys : Array.from(keys)[0] || ''
                        handleChange('mainPromotion_id', key || null)
                    }}
                    className="bg-white border border-gray-200 rounded-md text-black"
                    classNames={{ trigger: 'text-black border-gray-200' }}
                >
                    {(item: PromotionOption) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>}
                </Select>
            </Tooltip>

            {/* Upload Imagens */}
            <MediaUploadComponent
                label="Imagens Principais"
                existingFiles={formData.existingImages as ImageRecord[]}
                newFiles={formData.newImages}
                onAddNew={handleAddNew}
                onRemoveExisting={handleRemoveExisting}
            />
        </div>
    )
}
