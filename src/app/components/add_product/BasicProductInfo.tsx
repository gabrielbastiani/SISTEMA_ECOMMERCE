'use client'

import { Input, Button, Select, SelectItem, Textarea, Tooltip } from '@nextui-org/react'
import { CurrencyInput } from '@/app/components/add_product/CurrencyInput'
import { MediaUploadComponent } from './MediaUploadComponent'
import { ProductFormData, PromotionOption, StatusProduct } from 'Types/types'
import { InformationCircleIcon } from '@heroicons/react/24/outline'

interface ProductBasicInfoProps {
    formData: ProductFormData
    onFormDataChange: (data: ProductFormData) => void
    promotions: PromotionOption[]
    mainImages: File[]
    onMainImagesChange: (files: File[]) => void
}

export const BasicProductInfo = ({
    formData,
    onFormDataChange,
    promotions,
    mainImages,
    onMainImagesChange
}: ProductBasicInfoProps) => {
    const handleChange = (field: keyof ProductFormData, value: any) => {
        onFormDataChange({ ...formData, [field]: value })
    }

    const handleRemoveImage = (index: number) => {
        const newImages = mainImages.filter((_, i) => i !== index)
        onMainImagesChange(newImages)
    }

    return (
        <div className="space-y-6 max-w-3xl">
            <div className="grid grid-cols-2 gap-4">
                <Tooltip
                    content="Nome completo do produto para exibição no site"
                    placement="top-start"
                    className="bg-white text-red-500 border border-gray-200 p-2"
                >
                    <Input
                        placeholder="Nome do Produto"
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        isRequired
                        className="bg-white border border-gray-200 rounded-md"
                        classNames={{
                            input: "text-black",
                        }}
                    />
                </Tooltip>

                <div className="flex gap-2 items-end">
                    <Tooltip
                        content="URL amigável gerada automaticamente"
                        placement="top-start"
                        className="bg-white text-red-500 border border-gray-200 p-2"
                    >
                        <Input
                            placeholder="Slug"
                            value={formData.slug}
                            onChange={(e) => handleChange('slug', e.target.value)}
                            className="bg-white border border-gray-200 rounded-md"
                            classNames={{
                                input: "text-black",
                            }}
                            endContent={
                                <InformationCircleIcon className="h-5 w-5 text-gray-400" />
                            }
                        />
                    </Tooltip>
                    <Button
                        size="sm"
                        className="h-[38px] bg-white border border-gray-200 text-black hover:bg-gray-50"
                        onPress={() => {
                            const generatedSlug = formData.name
                                .toLowerCase()
                                .replace(/[^a-z0-9]+/g, '-')
                                .replace(/^-+|-+$/g, '')
                            handleChange('slug', generatedSlug)
                        }}
                    >
                        Gerar
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <Tooltip
                    content="Marca/fabricante do produto"
                    placement="top-start"
                    className="bg-white text-red-500 border border-gray-200 p-2"
                >
                    <Input
                        placeholder="Marca"
                        value={formData.brand}
                        onChange={(e) => handleChange('brand', e.target.value)}
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
                        value={formData.ean}
                        onChange={(e) => handleChange('ean', e.target.value)}
                        className="bg-white border border-gray-200 rounded-md"
                        classNames={{
                            input: "text-black",
                        }}
                    />
                </Tooltip>

                <Tooltip
                    content="SKU principal do produto"
                    placement="top-start"
                    className="bg-white text-red-500 border border-gray-200 p-2"
                >
                    <Input
                        placeholder="SKU Master"
                        value={formData.skuMaster}
                        onChange={(e) => handleChange('skuMaster', e.target.value)}
                        className="bg-white border border-gray-200 rounded-md"
                        classNames={{
                            input: "text-black",
                        }}
                    />
                </Tooltip>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Tooltip
                    content="Preço original sem desconto"
                    placement="top-start"
                    className="bg-white text-red-500 border border-gray-200 p-2"
                >
                    <div>
                        <CurrencyInput
                            placeholder="Preço De"
                            value={formData.price_of || 0}
                            onChange={(value) => handleChange('price_of', Number(value))}
                        />
                    </div>
                </Tooltip>

                <Tooltip
                    content="Preço atual de venda"
                    placement="top-start"
                    className="bg-white text-red-500 border border-gray-200 p-2"
                >
                    <div>
                        <CurrencyInput
                            placeholder="Preço Por"
                            value={formData.price_per || 0}
                            onChange={(value) => handleChange('price_per', Number(value))}
                        />
                    </div>
                </Tooltip>
            </div>

            <div className="grid grid-cols-4 gap-4">
                {[
                    { label: "Peso (kg)", field: 'weight', tooltip: "Peso total do produto com embalagem" },
                    { label: "Comprimento (cm)", field: 'length', tooltip: "Medida da frente para trás" },
                    { label: "Largura (cm)", field: 'width', tooltip: "Medida de um lado ao outro" },
                    { label: "Altura (cm)", field: 'height', tooltip: "Medida da base ao topo" }
                ].map(({ label, field, tooltip }) => {
                    const formField = field as keyof ProductFormData

                    return (
                        <Tooltip
                            key={field}
                            content={tooltip}
                            placement="top-start"
                            className="bg-white text-red-500 border border-gray-200 p-2"
                        >
                            <Input
                                label={label}
                                type="number"
                                value={formData[formField]?.toString() || ''}
                                onChange={(e) => handleChange(formField, Number(e.target.value))}
                                className="bg-white border border-gray-200"
                                classNames={{
                                    input: "text-black",
                                    label: "text-gray-600"
                                }}
                                startContent={
                                    <span className="text-gray-400 text-small">
                                        {label.includes('Peso') ? 'kg' : 'cm'}
                                    </span>
                                }
                            />
                        </Tooltip>
                    )
                })}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Tooltip
                    content="Quantidade disponível em estoque"
                    placement="top-start"
                    className="bg-white text-red-500 border border-gray-200 p-2"
                >
                    <Input
                        placeholder="Estoque"
                        type="number"
                        min="0"
                        value={formData.stock?.toString() || ''}
                        onChange={(e) => handleChange('stock', Number(e.target.value))}
                        className="bg-white border border-gray-200 rounded-md"
                        classNames={{
                            input: "text-black",
                        }}
                    />
                </Tooltip>

                <Tooltip
                    content="Status de disponibilidade do produto"
                    placement="top-start"
                    className="bg-white text-red-500 border border-gray-200 p-2"
                >
                    <Select
                        placeholder="Status"
                        selectedKeys={formData.status ? [formData.status] : []}
                        onChange={(e) => handleChange('status', e.target.value as StatusProduct)}
                        className="bg-white border border-gray-200 rounded-md text-black"
                        classNames={{
                            trigger: "text-black border-gray-200",
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

            <Tooltip
                content="Promoção principal ativa para este produto"
                placement="top-start"
                className="bg-white text-red-500 border border-gray-200 p-2"
            >
                <Select
                    placeholder='Promoção principal'
                    selectedKeys={formData.mainPromotion_id ? [formData.mainPromotion_id] : []}
                    onChange={(e) => handleChange('mainPromotion_id', e.target.value)}
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

            <MediaUploadComponent
                label="Imagens Principais"
                files={mainImages}
                onUpload={onMainImagesChange}
                onRemove={handleRemoveImage}
            />
        </div>
    )
}