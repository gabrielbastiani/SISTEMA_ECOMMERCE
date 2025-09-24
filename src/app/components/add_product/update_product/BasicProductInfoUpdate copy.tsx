'use client'

import { Input, Select, SelectItem, SharedSelection, Tooltip } from '@nextui-org/react'
import { CurrencyInput } from '@/app/components/add_product/CurrencyInput'
import { ProductFormData, PromotionOption, StatusProduct, ImageRecord } from 'Types/types'
import { ChangeEvent } from 'react'
import { MediaUpdateComponent } from './MediaUpdateComponent'

export interface BuyTogetherOption { id: string; name: string }

interface BasicProductInfoUpdateProps {
    formData: ProductFormData
    onFormDataChange: (data: ProductFormData) => void
    promotions: PromotionOption[]
    buyTogetherOptions: BuyTogetherOption[]
    onBuyTogetherChange: (id: string | null) => void
    existingImages: ImageRecord[]
    newImages: File[]
    primaryImageId: string
    onSetPrimaryImageId: (id: string) => void
    onAddNewImage: (files: File[]) => void
    onRemoveExistingImage: (id: string) => void
    onRemoveNewImage: (index: number) => void
}

const dimensionFields: { label: string; field: keyof ProductFormData; tooltip: string }[] = [
    { label: 'Peso (kg)', field: 'weight', tooltip: 'Peso total' },
    { label: 'Comprimento (cm)', field: 'length', tooltip: 'Frente para trás' },
    { label: 'Largura (cm)', field: 'width', tooltip: 'Lado a lado' },
    { label: 'Altura (cm)', field: 'height', tooltip: 'Base ao topo' }
]

export const BasicProductInfoUpdate = ({
    formData,
    onFormDataChange,
    promotions,
    buyTogetherOptions,
    onBuyTogetherChange,
    existingImages,
    newImages,
    primaryImageId,
    onSetPrimaryImageId,
    onAddNewImage,
    onRemoveExistingImage,
    onRemoveNewImage
}: BasicProductInfoUpdateProps) => {
    // manipula campos básicos
    const handleChange = (field: keyof ProductFormData, value: any) => {
        onFormDataChange({ ...formData, [field]: value })
    }

    const promoItems = [{ id: '', name: 'Nenhuma promoção' }, ...promotions]

    const buyTogetherItems = [{ id: '', name: 'Nenhum grupo' }, ...buyTogetherOptions]

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
                {dimensionFields.map(({ label, field, tooltip }) => (
                    <Tooltip key={field} content={tooltip} placement="top-start" className="bg-white text-red-500 border border-gray-200 p-2">
                        <div>
                            <label className="block mb-1 text-sm font-medium text-foreground">{label}</label>
                            <Input
                                type="number"
                                value={(formData[field]?.toString()) || ''}
                                onChange={e => handleChange(field, Number(e.target.value))}
                                className="bg-white border border-gray-200"
                                classNames={{ input: 'text-black' }}
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
                        selectedKeys={formData.status ? new Set([formData.status]) : new Set()}
                        onSelectionChange={(keys) => {
                            const key = Array.from(keys)[0] as StatusProduct
                            handleChange('status', key)
                        }}
                        className="bg-white border border-gray-200 rounded-md text-black"
                        classNames={{ trigger: 'text-black border-gray-200' }}
                    >
                        <SelectItem className='bg-white text-black' key="DISPONIVEL" value="DISPONIVEL">Disponível</SelectItem>
                        <SelectItem className='bg-white text-black' key="INDISPONIVEL" value="INDISPONIVEL">Indisponível</SelectItem>
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
                    {(item: PromotionOption) => <SelectItem className='bg-white text-black' key={item.id} value={item.id}>{item.name}</SelectItem>}
                </Select>
            </Tooltip>

            <Tooltip
                content="Vincule este produto a um grupo ‘Compre Junto’"
                placement="top-start"
                className="bg-white text-red-500 border border-gray-200 p-2"
            >
                <Select
                    placeholder="Compre Junto"
                    items={buyTogetherItems}
                    selectedKeys={
                        formData.buyTogether_id
                            ? new Set([formData.buyTogether_id])
                            : new Set<string>()
                    }
                    onSelectionChange={(keys: SharedSelection) => {
                        const raw = typeof keys === 'string'
                            ? keys
                            : Array.from(keys)[0]
                        const key = raw != null ? String(raw) : ''
                        onBuyTogetherChange(key || null)
                    }}
                    className="bg-white border border-gray-200 rounded-md text-black"
                    classNames={{ trigger: 'text-black border-gray-200' }}
                >
                    {item => (
                        <SelectItem key={item.id} value={item.id} className="bg-white text-black">
                            {item.name}
                        </SelectItem>
                    )}
                </Select>
            </Tooltip>

            {/* Upload Imagens (Produto) */}
            <MediaUpdateComponent
                label="Imagens Principais"
                existingFiles={existingImages}
                newFiles={newImages}
                primaryId={primaryImageId}
                onSetPrimary={(id) => onSetPrimaryImageId(id)}
                onAddNew={(filesList) => onAddNewImage(filesList)}
                onRemoveExisting={(id) => onRemoveExistingImage(id)}
                onRemoveNew={(index) => onRemoveNewImage(index)}
            />
        </div>
    )
}