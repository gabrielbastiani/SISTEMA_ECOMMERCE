'use client'

import { v4 as uuidv4 } from 'uuid'
import React, { useState } from 'react'
import {
    Button,
    Input,
    Select,
    SelectItem,
    SharedSelection,
    Tooltip,
} from '@nextui-org/react'
import {
    PlusIcon,
    TrashIcon,
    ChevronDownIcon,
    ChevronUpIcon,
} from '@heroicons/react/24/outline'
import { MediaUploadComponent } from './MediaUploadComponent'
import { CurrencyInput } from './CurrencyInput'
import {
    PromotionOption,
    VariantFormData,
    VideoInput,
} from 'Types/types'
import { CollapsibleInfo } from './helpers_componentes/CollapsibleInfo'
import { VideoLinksManager } from './VideoLinksManager'

interface VariantManagerProps {
    variants: VariantFormData[]
    onVariantsChange: (variants: VariantFormData[]) => void
    promotions: PromotionOption[]

    variantFiles: Record<string, File[]>
    setVariantFiles: React.Dispatch<React.SetStateAction<Record<string, File[]>>>

    attributeFiles: Record<string, Record<number, File[]>>
    setAttributeFiles: React.Dispatch<
        React.SetStateAction<Record<string, Record<number, File[]>>>
    >

    variantVideoLinks: Record<string, VideoInput[]>
    onVariantVideoLinksChange: (variantId: string, links: VideoInput[]) => void

    // Novos props para controlar “primárias”
    primaryVariantIndexById: Record<string, number>
    setPrimaryVariantIndexById: React.Dispatch<
        React.SetStateAction<Record<string, number>>
    >

    primaryAttributeIndexById: Record<string, Record<number, number>>
    setPrimaryAttributeIndexById: React.Dispatch<
        React.SetStateAction<Record<string, Record<number, number>>>
    >
}

export const VariantManager: React.FC<VariantManagerProps> = ({
    variants,
    onVariantsChange,
    promotions,
    variantFiles,
    setVariantFiles,
    attributeFiles,
    setAttributeFiles,
    variantVideoLinks,
    onVariantVideoLinksChange,
    primaryVariantIndexById,
    setPrimaryVariantIndexById,
    primaryAttributeIndexById,
    setPrimaryAttributeIndexById,
}) => {
    const [expandedVariants, setExpandedVariants] = useState<Record<string, boolean>>({})
    const [expandedAttributes, setExpandedAttributes] = useState<
        Record<string, Record<number, boolean>>
    >({})

    const toggleVariant = (variantId: string) => {
        setExpandedVariants((prev) => ({
            ...prev,
            [variantId]: !prev[variantId],
        }))
    }

    const toggleAttribute = (variantId: string, attrIndex: number) => {
        setExpandedAttributes((prev) => ({
            ...prev,
            [variantId]: {
                ...(prev[variantId] || {}),
                [attrIndex]: !(prev[variantId]?.[attrIndex] || false),
            },
        }))
    }

    const addVariant = () => {
        const newVariantId = uuidv4()
        setExpandedVariants((prev) => ({ ...prev, [newVariantId]: true }))
        onVariantsChange([
            ...variants,
            {
                id: newVariantId,
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
                variantAttributes: [],
            },
        ])
    }

    const removeVariant = (index: number) => {
        const variantId = variants[index].id
        const newVariants = variants.filter((_, i) => i !== index)
        onVariantsChange(newVariants)

        // Limpa videos, arquivos e índices primários
        onVariantVideoLinksChange(variantId, [])
        setVariantFiles((prev) => {
            const copy = { ...prev }
            delete copy[variantId]
            return copy
        })
        setPrimaryVariantIndexById((prev) => {
            const copy = { ...prev }
            delete copy[variantId]
            return copy
        })
        setAttributeFiles((prev) => {
            const copy = { ...prev }
            delete copy[variantId]
            return copy
        })
        setPrimaryAttributeIndexById((prev) => {
            const copy = { ...prev }
            delete copy[variantId]
            return copy
        })

        // Limpar estados de expansão
        setExpandedVariants((prev) => {
            const copy = { ...prev }
            delete copy[variantId]
            return copy
        })
        setExpandedAttributes((prev) => {
            const copy = { ...prev }
            delete copy[variantId]
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

    const removeAttribute = (variantIndex: number, attrIndex: number) => {
        const variantId = variants[variantIndex].id
        const newVariants = [...variants]
        newVariants[variantIndex].attributes = newVariants[variantIndex].attributes.filter(
            (_, i) => i !== attrIndex
        )
        onVariantsChange(newVariants)

        // Limpa arquivos e índice primário desse atributo
        setAttributeFiles((prev) => {
            const copy = { ...prev }
            const attrs = copy[variantId] || {}
            const newAttrs: Record<number, File[]> = {}
            Object.entries(attrs).forEach(([key, files]) => {
                const i = Number(key)
                if (i === attrIndex) return
                const newIndex = i > attrIndex ? i - 1 : i
                newAttrs[newIndex] = files
            })
            if (Object.keys(newAttrs).length) {
                copy[variantId] = newAttrs
            } else {
                delete copy[variantId]
            }
            return copy
        })

        setPrimaryAttributeIndexById((prev) => {
            const copy = { ...prev }
            const attrs = copy[variantId] || {}
            const newAttrs: Record<number, number> = {}
            Object.entries(attrs).forEach(([key, val]) => {
                const i = Number(key)
                if (i === attrIndex) return
                const newIndex = i > attrIndex ? i - 1 : i
                newAttrs[newIndex] = val
            })
            if (Object.keys(newAttrs).length) {
                copy[variantId] = newAttrs
            } else {
                delete copy[variantId]
            }
            return copy
        })

        // Limpar estado de expansão do atributo
        setExpandedAttributes((prev) => {
            const copy = { ...prev }
            if (copy[variantId]) {
                const attrs = { ...copy[variantId] }
                delete attrs[attrIndex]
                // Reindexar os flags restantes
                const reindexed: Record<number, boolean> = {}
                Object.entries(attrs).forEach(([key, value]) => {
                    const i = Number(key)
                    const newIndex = i > attrIndex ? i - 1 : i
                    reindexed[newIndex] = value
                })
                copy[variantId] = reindexed
            }
            return copy
        })
    }

    const promoItems = [{ id: '', name: 'Nenhuma promoção' }, ...promotions]

    return (
        <div className="space-y-6">
            {variants.map((variant, idx) => {
                const variantId = variant.id
                const filesForVariant = variantFiles[variantId] || []
                const links = variantVideoLinks[variant.id] || []

                // Índice que determina qual imagem desta variante está marcada como primary
                const primaryIdxForVariant = primaryVariantIndexById[variantId] ?? -1

                return (
                    <div key={variantId} className="border rounded-lg p-4">
                        {/* Header da Variante */}
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-medium text-lg">
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

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Coluna 1: Dados Básicos */}
                            <div className="space-y-4 lg:col-span-2">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Tooltip
                                        content="SKU único da variante"
                                        placement="top-start"
                                        className="bg-white text-red-500 border border-gray-200 p-2"
                                    >
                                        <Input
                                            placeholder="SKU"
                                            value={variant.sku}
                                            onChange={(e) => updateVariant(idx, 'sku', e.target.value)}
                                            className="bg-white border border-gray-200 rounded-md"
                                            classNames={{
                                                input: 'text-black',
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
                                            onChange={(e) => updateVariant(idx, 'ean', e.target.value)}
                                            className="bg-white border border-gray-200 rounded-md"
                                            classNames={{
                                                input: 'text-black',
                                            }}
                                        />
                                    </Tooltip>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Tooltip
                                        content="Preço original de venda sem desconto"
                                        placement="top-start"
                                        className="bg-white text-red-500 border border-gray-200 p-2"
                                    >
                                        <CurrencyInput
                                            placeholder="Preço De"
                                            value={variant.price_of || 0}
                                            onChange={(v) => updateVariant(idx, 'price_of', v)}
                                        />
                                    </Tooltip>

                                    <Tooltip
                                        content="Preço atual de venda"
                                        placement="top-start"
                                        className="bg-white text-red-500 border border-gray-200 p-2"
                                    >
                                        <CurrencyInput
                                            placeholder="Preço Por"
                                            value={variant.price_per || 0}
                                            onChange={(v) => updateVariant(idx, 'price_per', v)}
                                        />
                                    </Tooltip>

                                    <Tooltip
                                        content="Ordem de exibição"
                                        placement="top-start"
                                        className="bg-white text-red-500 border border-gray-200 p-2"
                                    >
                                        <Input
                                            type="number"
                                            placeholder="Ordem"
                                            value={String(variant.sortOrder)}
                                            onChange={(e) =>
                                                updateVariant(idx, 'sortOrder', Number(e.target.value))
                                            }
                                            className="bg-white border border-gray-200 rounded-md"
                                            classNames={{
                                                input: 'text-black',
                                            }}
                                        />
                                    </Tooltip>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Tooltip
                                        content="Estoque desse produto/variante"
                                        placement="top-start"
                                        className="bg-white text-red-500 border border-gray-200 p-2"
                                    >
                                        <Input
                                            type="number"
                                            placeholder="Estoque"
                                            value={String(variant.stock)}
                                            onChange={(e) =>
                                                updateVariant(idx, 'stock', Number(e.target.value))
                                            }
                                            className="bg-white border border-gray-200 rounded-md"
                                            classNames={{
                                                input: 'text-black',
                                            }}
                                        />
                                    </Tooltip>

                                    <Tooltip
                                        content="Promoção aplicada"
                                        placement="top-start"
                                        className="bg-white text-red-500 border border-gray-200 p-2"
                                    >
                                        <Select
                                            placeholder="Promoção"
                                            items={promoItems}
                                            selectedKeys={
                                                variant.mainPromotion_id
                                                    ? new Set([variant.mainPromotion_id])
                                                    : new Set<string>()
                                            }
                                            onSelectionChange={(keys: SharedSelection) => {
                                                const key = Array.from(keys)[0] ?? ''
                                                updateVariant(idx, 'mainPromotion_id', key || null)
                                            }}
                                            className="text-foreground border border-gray-200 rounded-md bg-white"
                                            classNames={{ trigger: 'text-black border-gray-200' }}
                                        >
                                            {(item: { id: string; name: string }) => (
                                                <SelectItem key={item.id} value={item.id}>
                                                    {item.name}
                                                </SelectItem>
                                            )}
                                        </Select>
                                    </Tooltip>
                                </div>

                                {/* Vídeos */}
                                <VideoLinksManager
                                    key={variantId}
                                    links={links}
                                    onLinksChange={(newLinks) =>
                                        onVariantVideoLinksChange(variant.id, newLinks)
                                    }
                                    label="Vídeos da Variante"
                                />
                            </div>

                            {/* Coluna 2: Imagens da Variante */}
                            <div className="lg:col-span-1">
                                <MediaUploadComponent
                                    label="Imagens da Variante"
                                    files={filesForVariant}
                                    onUpload={(files) =>
                                        setVariantFiles((prev) => ({
                                            ...prev,
                                            [variantId]: [...(prev[variantId] || []), ...files],
                                        }))
                                    }
                                    onRemove={(i) =>
                                        setVariantFiles((prev) => ({
                                            ...prev,
                                            [variantId]: (prev[variantId] || []).filter((_, j) => j !== i),
                                        }))
                                    }
                                    primaryIndex={primaryIdxForVariant}
                                    onSetPrimary={(i) =>
                                        setPrimaryVariantIndexById((prev) => ({
                                            ...prev,
                                            [variantId]: i,
                                        }))
                                    }
                                />
                            </div>
                        </div>

                        {/* Atributos */}
                        <div className="mt-6 pt-4 border-t">
                            <div className="flex justify-between items-center mb-4">
                                <h5 className="font-medium">Atributos da Variante</h5>
                                <Button
                                    size="sm"
                                    variant="bordered"
                                    startContent={<PlusIcon className="h-4 w-4" />}
                                    onPress={() => addAttribute(idx)}
                                    className="text-violet-500"
                                >
                                    Adicionar Atributo
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {variant.attributes.map((attr, ai) => {
                                    const variantId = variant.id
                                    const filesForAttr = attributeFiles[variantId]?.[ai] || []
                                    // Índice que determina qual imagem deste atributo está marcada como principal
                                    const primaryIdxForAttr =
                                        primaryAttributeIndexById[variantId]?.[ai] ?? -1

                                    return (
                                        <div key={ai} className="border rounded-lg p-3 relative">
                                            <Button
                                                isIconOnly
                                                size="sm"
                                                variant="light"
                                                className="absolute top-2 right-2"
                                                onPress={() => removeAttribute(idx, ai)}
                                            >
                                                <TrashIcon color='red' className="h-5 w-5 text-red-600" />
                                            </Button>

                                            <div className="grid grid-cols-2 gap-3 mb-3 mt-10">
                                                <Input
                                                    placeholder="Nome (ex: Cor)"
                                                    value={attr.key}
                                                    onChange={(e) => {
                                                        const nv = [...variants]
                                                        nv[idx].attributes[ai].key = e.target.value
                                                        onVariantsChange(nv)
                                                    }}
                                                    className="bg-white border border-gray-200 rounded-md"
                                                    classNames={{
                                                        input: 'text-black',
                                                    }}
                                                />

                                                <Input
                                                    placeholder="Valor (ex: Azul)"
                                                    value={attr.value}
                                                    onChange={(e) => {
                                                        const nv = [...variants]
                                                        nv[idx].attributes[ai].value = e.target.value
                                                        onVariantsChange(nv)
                                                    }}
                                                    className="bg-white border border-gray-200 rounded-md"
                                                    classNames={{
                                                        input: 'text-black',
                                                    }}
                                                />
                                            </div>

                                            <MediaUploadComponent
                                                label="Imagens do Atributo"
                                                files={filesForAttr}
                                                onUpload={(files) =>
                                                    setAttributeFiles((prev) => ({
                                                        ...prev,
                                                        [variantId]: {
                                                            ...(prev[variantId] || {}),
                                                            [ai]: [...(prev[variantId]?.[ai] || []), ...files],
                                                        },
                                                    }))
                                                }
                                                onRemove={(i) =>
                                                    setAttributeFiles((prev) => ({
                                                        ...prev,
                                                        [variantId]: {
                                                            ...(prev[variantId] || {}),
                                                            [ai]: (prev[variantId]?.[ai] || []).filter(
                                                                (_, j) => j !== i
                                                            ),
                                                        },
                                                    }))
                                                }
                                                primaryIndex={primaryIdxForAttr}
                                                onSetPrimary={(i) =>
                                                    setPrimaryAttributeIndexById((prev) => ({
                                                        ...prev,
                                                        [variantId]: {
                                                            ...(prev[variantId] || {}),
                                                            [ai]: i,
                                                        },
                                                    }))
                                                }
                                            />
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                )
            })}

            <Button
                className="mt-4 text-orange-600"
                variant="bordered"
                startContent={<PlusIcon className="h-5 w-5" />}
                onPress={addVariant}
            >
                Adicionar Variante
            </Button>
        </div>
    )
}