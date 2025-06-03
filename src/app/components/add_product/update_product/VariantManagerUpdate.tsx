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
import {
    PromotionOption,
    ProductFormData,
    VideoInput,
    ImageRecord,
    VariantAttribute,
    StatusProduct,
    VariantFormData
} from 'Types/types'
import { VideoLinksManagerUpdate } from './VideoLinksManagerUpdate'

interface VariantManagerUpdateProps {
    formData: ProductFormData
    onFormDataChange: (data: ProductFormData) => void
    promotions: PromotionOption[]

    // Estado externo: TODOS os “novos” arquivos para cada variante
    variantFiles: Record<string, File[]>
    setVariantFiles: React.Dispatch<React.SetStateAction<Record<string, File[]>>>

    // Estado externo: TODOS os “novos” arquivos para cada atributo de cada variante
    attributeFiles: Record<string, Record<number, File[]>>
    setAttributeFiles: React.Dispatch<
        React.SetStateAction<Record<string, Record<number, File[]>>>
    >
}

export const VariantManagerUpdate: React.FC<VariantManagerUpdateProps> = ({
    formData,
    onFormDataChange,
    promotions,
    variantFiles,
    setVariantFiles,
    attributeFiles,
    setAttributeFiles
}) => {
    const variants = formData.variants || []

    // Helper para atualizar a lista de variantes no formData
    const updateVariants = (newVariants: VariantFormData[]) =>
        onFormDataChange({ ...formData, variants: newVariants })

    // Adiciona uma nova variante
    const addVariant = () => {
        const novoId = uuidv4()
        const novaVariante: VariantFormData = {
            id: novoId,
            sku: '',
            price_of: 0,
            price_per: 0,
            stock: 0,
            sortOrder: 0,
            ean: '',
            mainPromotion_id: '',
            allowBackorders: false,

            existingImages: [] as ImageRecord[],
            newImages: [] as File[],

            videos: [] as VideoInput[],
            // não temos “newVideos” em VariantFormData; se o tipo do seu projeto usa “videos[]” só (não “newVideos”), siga assim

            attributes: [] as VariantAttribute[],

            images: [] as File[],
            productVariantImage: [] as ImageRecord[],
            productVariantVideo: [] as VideoInput[],

            created_at: undefined,
            product_id: formData.id ?? '',

            variantAttributes: [] as any[]
        }

        updateVariants([...variants, novaVariante])
        setVariantFiles((prev) => ({ ...prev, [novoId]: [] }))
    }

    // Remove uma variante e limpa seus arquivos
    const removeVariant = (index: number) => {
        const variantId = variants[index].id
        const novaLista = variants.filter((_, i) => i !== index)
        updateVariants(novaLista)

        setVariantFiles((prev) => {
            const copy = { ...prev }
            delete copy[variantId]
            return copy
        })
        setAttributeFiles((prev) => {
            const copy = { ...prev }
            delete copy[variantId]
            return copy
        })
    }

    // Atualiza campo simples dentro de uma variante
    const updateVariantField = (
        idx: number,
        field:
            | 'sku'
            | 'price_of'
            | 'price_per'
            | 'stock'
            | 'sortOrder'
            | 'ean'
            | 'mainPromotion_id'
            | 'allowBackorders',
        value: any
    ) => {
        const copia = [...variants]
        copia[idx] = { ...copia[idx], [field]: value }
        updateVariants(copia)
    }

    const promoItems = [{ id: '', name: 'Nenhuma promoção' }, ...promotions]

    return (
        <div className="space-y-6">
            {variants.map((variant, idx) => {
                const arquivosNovosDaVariante: File[] = variantFiles[variant.id] || []
                const vidLinks: VideoInput[] = variant.videos || []

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

                        {/* Campos de texto / número da variante */}
                        <div className="grid grid-cols-2 gap-4">
                            <Tooltip content="SKU da variante" placement="top-start">
                                <Input
                                    placeholder="SKU"
                                    value={variant.sku}
                                    onChange={(e) => updateVariantField(idx, 'sku', e.target.value)}
                                    className="text-black"
                                />
                            </Tooltip>
                            <Tooltip content="EAN da variante" placement="top-start">
                                <Input
                                    placeholder="EAN"
                                    value={variant.ean}
                                    onChange={(e) => updateVariantField(idx, 'ean', e.target.value)}
                                    className="text-black"
                                />
                            </Tooltip>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <Tooltip content="Preço De" placement="top-start">
                                <CurrencyInput
                                    placeholder="Preço De"
                                    value={variant.price_of || 0}
                                    onChange={(v) => updateVariantField(idx, 'price_of', Number(v))}
                                />
                            </Tooltip>
                            <Tooltip content="Preço Por" placement="top-start">
                                <CurrencyInput
                                    placeholder="Preço Por"
                                    value={variant.price_per || 0}
                                    onChange={(v) => updateVariantField(idx, 'price_per', Number(v))}
                                />
                            </Tooltip>
                            <Tooltip content="Ordem de exibição" placement="top-start">
                                <Input
                                    type="number"
                                    placeholder="Ordem"
                                    value={String(variant.sortOrder || 0)}
                                    onChange={(e) =>
                                        updateVariantField(idx, 'sortOrder', Number(e.target.value))
                                    }
                                    className="text-black"
                                />
                            </Tooltip>
                        </div>

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
                                        updateVariantField(idx, 'mainPromotion_id', key || '')
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

                        <VideoLinksManagerUpdate
                            links={vidLinks}
                            onLinksChange={(newLinks) => {
                                const copia = [...variants]
                                copia[idx].videos = newLinks
                                updateVariants(copia)
                            }}
                        />

                        {/* =================================
                  IMAGENS DA VARIANTE
               ================================= */}
                        <MediaUpdateComponent
                            label="Imagens da Variante"
                            existingFiles={variant.existingImages || []}
                            newFiles={arquivosNovosDaVariante}
                            onAddNew={(filesList) => {
                                // Filtrar duplicados (por nome + lastModified)
                                setVariantFiles((prev) => {
                                    const copia = { ...prev }
                                    const already = copia[variant.id] || []
                                    // Só adiciona aqueles que não existirem ainda (comparando name + lastModified)
                                    const filtered = filesList.filter(
                                        (f) =>
                                            !already.some(
                                                (e) => e.name === f.name && e.lastModified === f.lastModified
                                            )
                                    )
                                    copia[variant.id] = [...already, ...filtered]
                                    return copia
                                })
                            }}
                            onRemoveExisting={(id) => {
                                const copia = [...variants]
                                copia[idx].existingImages =
                                    copia[idx].existingImages?.filter((img) => img.id !== id) || []
                                updateVariants(copia)
                            }}
                            onRemoveNew={(i) => {
                                setVariantFiles((prev) => {
                                    const copy = { ...prev }
                                    if (copy[variant.id]) {
                                        copy[variant.id] = copy[variant.id].filter((_, j) => j !== i)
                                    }
                                    return copy
                                })
                            }}
                        />

                        {/* =================================
                  ATRIBUTOS DA VARIANTE
               ================================= */}
                        <div className="space-y-4">
                            {(variant.attributes || []).map((attr, ai) => {
                                // Fonte de verdade dos novos arquivos deste atributo
                                const arquivosNovosDoAtributo = attributeFiles[variant.id]?.[ai] || []

                                return (
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
                                                const copia = [...variants]
                                                copia[idx].attributes.splice(ai, 1)
                                                updateVariants(copia)

                                                setAttributeFiles((prev) => {
                                                    const copy = { ...prev }
                                                    if (copy[variant.id]) {
                                                        delete copy[variant.id][ai]
                                                        const shifted: Record<number, File[]> = {}
                                                        Object.entries(copy[variant.id]).forEach(([key, filesArr]) => {
                                                            const k = Number(key)
                                                            const newKey = k > ai ? k - 1 : k
                                                            shifted[newKey] = filesArr
                                                        })
                                                        if (Object.keys(shifted).length) {
                                                            copy[variant.id] = shifted
                                                        } else {
                                                            delete copy[variant.id]
                                                        }
                                                    }
                                                    return copy
                                                })
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
                                                        const copia = [...variants]
                                                        copia[idx].attributes[ai].key = e.target.value
                                                        updateVariants(copia)
                                                    }}
                                                    className="text-black"
                                                />
                                            </Tooltip>
                                            <Tooltip content="Valor do atributo" placement="top-start">
                                                <Input
                                                    placeholder="Valor Atributo"
                                                    value={attr.value}
                                                    onChange={(e) => {
                                                        const copia = [...variants]
                                                        copia[idx].attributes[ai].value = e.target.value
                                                        updateVariants(copia)
                                                    }}
                                                    className="text-black"
                                                />
                                            </Tooltip>
                                        </div>

                                        {/* =================================
                          IMAGENS DO ATRIBUTO
                       ================================= */}
                                        <MediaUpdateComponent
                                            label="Imagens do Atributo"
                                            existingFiles={attr.existingImages || []}
                                            newFiles={arquivosNovosDoAtributo}
                                            onAddNew={(filesList) => {
                                                setAttributeFiles((prev) => {
                                                    const copy = { ...prev }
                                                    if (!copy[variant.id]) copy[variant.id] = {}
                                                    const already = copy[variant.id][ai] || []
                                                    // Filtrar duplicados
                                                    const filtered = filesList.filter(
                                                        (f) =>
                                                            !already.some(
                                                                (e) => e.name === f.name && e.lastModified === f.lastModified
                                                            )
                                                    )
                                                    copy[variant.id][ai] = [...already, ...filtered]
                                                    return copy
                                                })
                                            }}
                                            onRemoveExisting={(id) => {
                                                const copia = [...variants]
                                                copia[idx].attributes[ai].existingImages =
                                                    copia[idx].attributes[ai].existingImages?.filter((img) => img.id !== id) ||
                                                    []
                                                updateVariants(copia)
                                            }}
                                            onRemoveNew={(i) => {
                                                setAttributeFiles((prev) => {
                                                    const copy = { ...prev }
                                                    if (copy[variant.id] && copy[variant.id][ai]) {
                                                        copy[variant.id][ai] = copy[variant.id][ai].filter((_, j) => j !== i)
                                                    }
                                                    return copy
                                                })
                                            }}
                                        />
                                    </div>
                                )
                            })}

                            <Button
                                size="sm"
                                variant="bordered"
                                startContent={<PlusIcon />}
                                onPress={() => {
                                    const copia = [...variants]
                                    const novoAtributo: VariantAttribute = {
                                        id: undefined,
                                        key: '',
                                        value: '',
                                        status: undefined as StatusProduct | undefined,
                                        existingImages: [] as ImageRecord[],
                                        newImages: [] as File[]
                                    }
                                    copia[idx].attributes.push(novoAtributo)
                                    updateVariants(copia)

                                    // Inicializa chave vazia no attributeFiles
                                    setAttributeFiles((prev) => {
                                        const copy = { ...prev }
                                        if (!copy[variant.id]) copy[variant.id] = {}
                                        const novoIdx = copia[idx].attributes.length - 1
                                        copy[variant.id][novoIdx] = []
                                        return copy
                                    })
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