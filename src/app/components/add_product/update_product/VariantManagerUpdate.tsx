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

    // ─── NOVOS PROPS ────────────────────────────────────────────────────────────────

    // Para cada variante (variantId), qual ID de imagem está marcada como principal
    primaryVariantImageIdByVariantId: Record<string, string>
    onSetPrimaryVariantImageId: (variantId: string, imageId: string) => void

    // Para cada variante e cada attrIndex, qual ID de imagem de atributo está marcada como principal
    primaryAttributeImageIdByVariantAndAttrIdx: Record<string, Record<number, string>>
    onSetPrimaryAttributeImageId: (
        variantId: string,
        attrIndex: number,
        imageId: string
    ) => void
}

export const VariantManagerUpdate: React.FC<VariantManagerUpdateProps> = ({
    formData,
    onFormDataChange,
    promotions,
    variantFiles,
    setVariantFiles,
    attributeFiles,
    setAttributeFiles,

    primaryVariantImageIdByVariantId,
    onSetPrimaryVariantImageId,

    primaryAttributeImageIdByVariantAndAttrIdx,
    onSetPrimaryAttributeImageId
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
        setAttributeFiles((prev) => ({ ...prev, [novoId]: {} }))

        // Inicializar “primárias” vazias para a nova variante
        onSetPrimaryVariantImageId(novoId, '')
        onSetPrimaryAttributeImageId(novoId, 0, '') // mesmo que não haja atributos ainda
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

        // Remove do mapa de primárias
        onSetPrimaryVariantImageId(variantId, '')
        // Remover todas as chaves de atributos desse variantId
        if (primaryAttributeImageIdByVariantAndAttrIdx[variantId]) {
            Object.keys(primaryAttributeImageIdByVariantAndAttrIdx[variantId]).forEach((aiStr) => {
                onSetPrimaryAttributeImageId(variantId, Number(aiStr), '')
            })
        }
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
                const variantId = variant.id
                const arquivosNovosDaVariante: File[] = variantFiles[variantId] || []
                const vidLinks: VideoInput[] = variant.videos || []

                return (
                    <div key={variantId} className="border rounded-lg p-4 bg-white shadow">
                        {/* Header da Variante */}
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-medium text-lg text-gray-700">
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
                                        content="SKU código dessa variante do produto em questão"
                                        placement="top-start"
                                        className="bg-white text-red-500 border border-gray-200 p-2"
                                    >
                                        <Input
                                            placeholder="SKU"
                                            value={variant.sku}
                                            onChange={(e) => updateVariantField(idx, 'sku', e.target.value)}
                                            className="bg-white border border-gray-200 rounded-md"
                                            classNames={{ input: "text-black" }}
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
                                            onChange={(e) => updateVariantField(idx, 'ean', e.target.value)}
                                            className="bg-white border border-gray-200 rounded-md"
                                            classNames={{ input: "text-black" }}
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
                                            onChange={(v) => updateVariantField(idx, 'price_of', Number(v))}
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
                                            onChange={(v) => updateVariantField(idx, 'price_per', Number(v))}
                                        />
                                    </Tooltip>

                                    <Tooltip
                                        content="Número correspondente à ordem de exibição desta variante"
                                        placement="top-start"
                                        className="bg-white text-red-500 border border-gray-200 p-2"
                                    >
                                        <Input
                                            type="number"
                                            placeholder="Ordem"
                                            value={String(variant.sortOrder || 0)}
                                            onChange={(e) =>
                                                updateVariantField(idx, 'sortOrder', Number(e.target.value))
                                            }
                                            className="bg-white border border-gray-200 rounded-md"
                                            classNames={{ input: "text-black" }}
                                        />
                                    </Tooltip>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Tooltip
                                        content="Estoque dessa variante"
                                        placement="top-start"
                                        className="bg-white text-red-500 border border-gray-200 p-2"
                                    >
                                        <Input
                                            type="number"
                                            placeholder="Estoque"
                                            value={String(variant.stock || 0)}
                                            onChange={(e) =>
                                                updateVariantField(idx, 'stock', Number(e.target.value))
                                            }
                                            className="bg-white border border-gray-200 rounded-md"
                                            classNames={{ input: "text-black" }}
                                        />
                                    </Tooltip>

                                    <Tooltip
                                        content="Promoção aplicada à variante"
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
                                                updateVariantField(idx, 'mainPromotion_id', key || '')
                                            }}
                                            className="text-foreground border border-gray-200 rounded-md bg-white"
                                            classNames={{ trigger: 'text-black border-gray-200' }}
                                        >
                                            {(item: PromotionOption) => (
                                                <SelectItem key={item.id} value={item.id}>
                                                    {item.name}
                                                </SelectItem>
                                            )}
                                        </Select>
                                    </Tooltip>
                                </div>

                                {/* Vídeos da Variante */}
                                <VideoLinksManagerUpdate
                                    links={vidLinks}
                                    onLinksChange={(newLinks) => {
                                        const copia = [...variants]
                                        copia[idx].videos = newLinks
                                        updateVariants(copia)
                                    }}
                                />
                            </div>

                            {/* Coluna 2: Imagens da Variante */}
                            <div className="lg:col-span-1">
                                <MediaUpdateComponent
                                    label="Imagens da Variante"
                                    existingFiles={variant.existingImages || []}
                                    newFiles={arquivosNovosDaVariante}
                                    // ─── NOVOS PROPS PARA MARCAR “IS PRIMARY” ─────────
                                    primaryId={primaryVariantImageIdByVariantId[variantId] || ''}
                                    onSetPrimary={(imgId: string) =>
                                        onSetPrimaryVariantImageId(variantId, imgId)
                                    }
                                    onAddNew={(filesList) => {
                                        setVariantFiles((prev) => {
                                            const copia = { ...prev }
                                            const already = copia[variantId] || []
                                            const filtered = filesList.filter(
                                                (f) =>
                                                    !already.some(
                                                        (e) => e.name === f.name && e.lastModified === f.lastModified
                                                    )
                                            )
                                            copia[variantId] = [...already, ...filtered]
                                            return copia
                                        })
                                    }}
                                    onRemoveExisting={(id) => {
                                        const copia = [...variants];
                                        copia[idx].existingImages =
                                            copia[idx].existingImages?.filter((img) => img.id !== id) || [];
                                        updateVariants(copia);
       // Se tirou a imagem que era principal, reseta o estado de primary
       if (primaryVariantImageIdByVariantId[variantId] === id) {
         onSetPrimaryVariantImageId(variantId, '');
       }
     }}
                                    onRemoveNew={(i) => {
                                        setVariantFiles((prev) => {
                                            const copy = { ...prev }
                                            if (copy[variantId]) {
                                                copy[variantId] = copy[variantId].filter((_, j) => j !== i)
                                            }
                                            return copy
                                        })
                                    }}
                                />
                            </div>
                        </div>

                        {/* Atributos */}
                        <div className="mt-6 pt-4 border-t">
                            <div className="flex justify-between items-center mb-4">
                                <h5 className="font-medium text-gray-700">Atributos da Variante</h5>
                                <Button
                                    size="sm"
                                    variant="bordered"
                                    startContent={<PlusIcon className="h-4 w-4" />}
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

                                        // Inicializa chave vazia no attributeFiles e nas primárias
                                        setAttributeFiles((prev) => {
                                            const copy = { ...prev }
                                            if (!copy[variantId]) copy[variantId] = {}
                                            const novoIdx = copia[idx].attributes.length - 1
                                            copy[variantId][novoIdx] = []
                                            return copy
                                        })
                                        onSetPrimaryAttributeImageId(variantId, copia[idx].attributes.length - 1, '')
                                    }}
                                    className="text-violet-500"
                                >
                                    Adicionar Atributo
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {(variant.attributes || []).map((attr, ai) => {
                                    const arquivosNovosDoAtributo = attributeFiles[variantId]?.[ai] || []
                                    const primaryAttrId =
                                        primaryAttributeImageIdByVariantAndAttrIdx[variantId]?.[ai] || ''

                                    return (
                                        <div
                                            key={ai}
                                            className="border rounded-lg p-3 relative bg-gray-100"
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
                                                        if (copy[variantId]) {
                                                            delete copy[variantId][ai]
                                                            const shifted: Record<number, File[]> = {}
                                                            Object.entries(copy[variantId]).forEach(([key, filesArr]) => {
                                                                const k = Number(key)
                                                                const newKey = k > ai ? k - 1 : k
                                                                shifted[newKey] = filesArr
                                                            })
                                                            if (Object.keys(shifted).length) {
                                                                copy[variantId] = shifted
                                                            } else {
                                                                delete copy[variantId]
                                                            }
                                                        }
                                                        return copy
                                                    })

                                                    // Reseta primary para esse atributo, se estava marcado
                                                    if (
                                                        primaryAttributeImageIdByVariantAndAttrIdx[variantId]?.[ai]
                                                    ) {
                                                        onSetPrimaryAttributeImageId(variantId, ai, '')
                                                    }
                                                }}
                                            >
                                                <TrashIcon className="h-5 w-5 text-red-600" />
                                            </Button>

                                            <div className="grid grid-cols-2 gap-3 mb-3 mt-8">
                                                <Tooltip
                                                    content="Nome do atributo"
                                                    placement="top-start"
                                                    className="bg-white text-red-500 border border-gray-200 p-2"
                                                >
                                                    <Input
                                                        placeholder="Nome (ex: Cor)"
                                                        value={attr.key}
                                                        onChange={(e) => {
                                                            const copia = [...variants]
                                                            copia[idx].attributes[ai].key = e.target.value
                                                            updateVariants(copia)
                                                        }}
                                                        className="bg-white border border-gray-200 rounded-md"
                                                        classNames={{ input: "text-black" }}
                                                    />
                                                </Tooltip>

                                                <Tooltip
                                                    content="Valor do atributo"
                                                    placement="top-start"
                                                    className="bg-white text-red-500 border border-gray-200 p-2"
                                                >
                                                    <Input
                                                        placeholder="Valor (ex: Azul)"
                                                        value={attr.value}
                                                        onChange={(e) => {
                                                            const copia = [...variants]
                                                            copia[idx].attributes[ai].value = e.target.value
                                                            updateVariants(copia)
                                                        }}
                                                        className="bg-white border border-gray-200 rounded-md"
                                                        classNames={{ input: "text-black" }}
                                                    />
                                                </Tooltip>
                                            </div>

                                            {/* Imagens do Atributo */}
                                            <MediaUpdateComponent
                                                label="Imagens do Atributo"
                                                existingFiles={attr.existingImages || []}
                                                newFiles={arquivosNovosDoAtributo}
                                                // ─── NOVOS PROPS PARA MARCAR “IS PRIMARY” NO ATRIBUTO ─────
                                                primaryId={primaryAttrId}
                                                onSetPrimary={(imgId: string) =>
                                                    onSetPrimaryAttributeImageId(variantId, ai, imgId)
                                                }
                                                onAddNew={(filesList) => {
                                                    setAttributeFiles((prev) => {
                                                        const copy = { ...prev }
                                                        if (!copy[variantId]) copy[variantId] = {}
                                                        const already = copy[variantId][ai] || []
                                                        const filtered = filesList.filter(
                                                            (f) =>
                                                                !already.some(
                                                                    (e) => e.name === f.name && e.lastModified === f.lastModified
                                                                )
                                                        )
                                                        copy[variantId][ai] = [...already, ...filtered]
                                                        return copy
                                                    })
                                                }}
                                                onRemoveExisting={(id) => {
                                                    const copia = [...variants]
                                                    copia[idx].attributes[ai].existingImages =
                                                        copia[idx].attributes[ai].existingImages?.filter(
                                                            (img) => img.id !== id
                                                        ) || []
                                                    updateVariants(copia)

                                                    if (primaryAttrId === id) {
                                                        onSetPrimaryAttributeImageId(variantId, ai, '')
                                                    }
                                                }}
                                                onRemoveNew={(i) => {
                                                    setAttributeFiles((prev) => {
                                                        const copy = { ...prev }
                                                        if (copy[variantId] && copy[variantId][ai]) {
                                                            copy[variantId][ai] = copy[variantId][ai].filter(
                                                                (_, j) => j !== i
                                                            )
                                                        }
                                                        return copy
                                                    })
                                                }}
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