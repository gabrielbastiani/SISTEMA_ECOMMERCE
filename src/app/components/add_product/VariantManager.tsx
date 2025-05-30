'use client'

import { v4 as uuidv4 } from 'uuid';
import React from 'react';
import { Button, Input, Select, SelectItem, SharedSelection, Tooltip } from '@nextui-org/react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { MediaUploadComponent } from './MediaUploadComponent';
import { CurrencyInput } from './CurrencyInput';
import { PromotionOption, VariantFormData, VideoInput } from 'Types/types';
import { CollapsibleInfo } from './helpers_componentes/CollapsibleInfo';
import { VideoLinksManager } from './VideoLinksManager';

interface VariantManagerProps {
    variants: VariantFormData[];
    onVariantsChange: (variants: VariantFormData[]) => void;
    promotions: PromotionOption[];
    variantFiles: Record<string, File[]>;
    setVariantFiles: React.Dispatch<React.SetStateAction<Record<string, File[]>>>;
    attributeFiles: Record<string, Record<number, File[]>>;
    setAttributeFiles: React.Dispatch<React.SetStateAction<Record<string, Record<number, File[]>>>>;
    variantVideoLinks: Record<string, VideoInput[]>;
    onVariantVideoLinksChange: (variantId: string, links: VideoInput[]) => void;
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
}) => {
    const addVariant = () => {
        onVariantsChange([
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
                attributes: [],
                images: [],
                variantAttributes: []
            },
        ]);
    };

    const removeVariant = (index: number) => {
        const variantId = variants[index].id;
        const newVariants = variants.filter((_, i) => i !== index);
        onVariantsChange(newVariants);
        onVariantVideoLinksChange(variantId, []);
        setVariantFiles(prev => {
            const copy = { ...prev };
            delete copy[variantId];
            return copy;
        });
        setAttributeFiles(prev => {
            const copy = { ...prev };
            delete copy[variantId];
            return copy;
        });
    };

    const updateVariant = (index: number, field: keyof VariantFormData, value: any) => {
        const newVariants = [...variants];
        newVariants[index] = { ...newVariants[index], [field]: value };
        onVariantsChange(newVariants);
    };

    const addAttribute = (variantIndex: number) => {
        const newVariants = [...variants];
        newVariants[variantIndex].attributes.push({ key: '', value: '' });
        onVariantsChange(newVariants);
    };

    const removeAttribute = (variantIndex: number, attrIndex: number) => {
        const variantId = variants[variantIndex].id;
        // Remove da lista de atributos
        const newVariants = [...variants];
        newVariants[variantIndex].attributes = newVariants[variantIndex].attributes.filter((_, i) => i !== attrIndex);
        onVariantsChange(newVariants);
        // Remove arquivos de imagens do atributo removido
        setAttributeFiles(prev => {
            const copy = { ...prev };
            const attrs = copy[variantId] || {};
            const newAttrs: Record<number, File[]> = {};
            Object.entries(attrs).forEach(([key, files]) => {
                const i = Number(key);
                if (i === attrIndex) return; // pula removido
                const newIndex = i > attrIndex ? i - 1 : i;
                newAttrs[newIndex] = files;
            });
            if (Object.keys(newAttrs).length) {
                copy[variantId] = newAttrs;
            } else {
                delete copy[variantId];
            }
            return copy;
        });
    };

    const promoItems = [{ id: '', name: 'Nenhuma promoção' }, ...promotions];

    return (
        <div className="space-y-6">
            <CollapsibleInfo />
            {variants.map((variant, idx) => {
                const variantId = variant.id;
                const filesForVariant = variantFiles[variantId] || [];
                const links = variantVideoLinks[variant.id] || [];

                return (
                    <div key={variantId} className="border rounded-lg p-4 space-y-4">
                        <div className="flex justify-between items-center">
                            <h4 className="font-medium">Variante: {variant.sku || `#${idx + 1}`}</h4>
                            <Button isIconOnly size="sm" color="danger" variant="light" onPress={() => removeVariant(idx)}>
                                <TrashIcon className="h-5 w-5 text-red-600" />
                            </Button>
                        </div>

                        {/* Campos básicos */}
                        <div className="grid grid-cols-2 gap-4">
                            <Tooltip
                                content="SKU código dessa variante do produto em questão"
                                placement="top-start"
                                className="bg-white text-red-500 border border-gray-200 p-2"
                            >
                                <Input
                                    placeholder="SKU"
                                    value={variant.sku}
                                    onChange={e => updateVariant(idx, 'sku', e.target.value)}
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
                                    onChange={e => updateVariant(idx, 'ean', e.target.value)}
                                    className="bg-white border border-gray-200 rounded-md"
                                    classNames={{
                                        input: "text-black",
                                    }}
                                />
                            </Tooltip>

                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <Tooltip
                                content="Preço original de venda sem desconto"
                                placement="top-start"
                                className="bg-white text-red-500 border border-gray-200 p-2"
                            >
                                <CurrencyInput
                                    placeholder="Preço De"
                                    value={variant.price_of || 0}
                                    onChange={v => updateVariant(idx, 'price_of', v)}
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
                                    onChange={v => updateVariant(idx, 'price_per', v)}
                                />
                            </Tooltip>

                            <Tooltip
                                content="Número correspondente a ordem que aparecerá essa variante junto ao produto"
                                placement="top-start"
                                className="bg-white text-red-500 border border-gray-200 p-2"
                            >
                                <Input
                                    type="number"
                                    placeholder="Ordem"
                                    value={String(variant.sortOrder)}
                                    onChange={e => updateVariant(idx, 'sortOrder', Number(e.target.value))}
                                    className="bg-white border border-gray-200 rounded-md"
                                    classNames={{
                                        input: "text-black",
                                    }}
                                />
                            </Tooltip>

                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Tooltip
                                content="Estoque desse produto/variante"
                                placement="top-start"
                                className="bg-white text-red-500 border border-gray-200 p-2"
                            >
                                <Input
                                    type="number"
                                    placeholder="Estoque"
                                    value={String(variant.stock)}
                                    onChange={e => updateVariant(idx, 'stock', Number(e.target.value))}
                                    className="bg-white border border-gray-200 rounded-md"
                                    classNames={{
                                        input: "text-black",
                                    }}
                                />
                            </Tooltip>

                            <Tooltip
                                content="Você pode vincular uma promoção principal para essa variante"
                                placement="top-start"
                                className="bg-white text-red-500 border border-gray-200 p-2"
                            >
                                <Select
                                    placeholder="Promoção"
                                    items={promoItems}
                                    selectedKeys={
                                        variant.mainPromotion_id != null
                                            ? new Set([variant.mainPromotion_id])
                                            : new Set<string>()
                                    }
                                    onSelectionChange={(keys: SharedSelection) => {
                                        const key = typeof keys === 'string'
                                            ? keys
                                            : Array.from(keys)[0] ?? '';
                                        updateVariant(idx, 'mainPromotion_id', key || null);
                                    }}
                                    className="text-foreground border border-gray-200 rounded-md bg-white"
                                    classNames={{ trigger: 'text-black border-gray-200' }}
                                >
                                    {(item: { id: string; name: string }) => (
                                        <SelectItem key={item.id} value={item.id} className="bg-white text-black">
                                            {item.name}
                                        </SelectItem>
                                    )}
                                </Select>
                            </Tooltip>

                            {/* Vídeos */}
                            <VideoLinksManager
                                key={variantId}
                                label="Vídeos da Variante"
                                links={links}
                                onLinksChange={newLinks => onVariantVideoLinksChange(variant.id, newLinks)}
                            />

                        </div>

                        {/* Imagens */}
                        <MediaUploadComponent
                            label="Imagens da Variante"
                            files={filesForVariant}
                            onUpload={files =>
                                setVariantFiles(prev => ({
                                    ...prev,
                                    [variantId]: [...(prev[variantId] || []), ...files],
                                }))
                            }
                            onRemove={i =>
                                setVariantFiles(prev => ({
                                    ...prev,
                                    [variantId]: (prev[variantId] || []).filter((_, j) => j !== i),
                                }))
                            }
                        />

                        {/* Atributos */}
                        <div className="space-y-4">
                            {variant.attributes.map((attr, ai) => (
                                <div key={ai} className="border p-3 rounded-lg relative">
                                    <Button
                                        isIconOnly
                                        size="sm"
                                        variant="light"
                                        className="absolute top-2 right-2 z-10"
                                        onPress={() => removeAttribute(idx, ai)}
                                    >
                                        <TrashIcon color='red' className="h-5 w-5 text-red-600" />
                                    </Button>
                                    <div className="flex gap-4 mb-2 mt-11">
                                        <Tooltip
                                            content="Exemplo: Cor"
                                            placement="top-start"
                                            className="bg-white text-red-500 border border-gray-200 p-2"
                                        >
                                            <Input
                                                placeholder="Nome Atributo"
                                                value={attr.key}
                                                onChange={e => {
                                                    const nv = [...variants];
                                                    nv[idx].attributes[ai].key = e.target.value;
                                                    onVariantsChange(nv);
                                                }}
                                                className="bg-white border border-gray-200 rounded-md"
                                                classNames={{
                                                    input: "text-black",
                                                }}
                                            />
                                        </Tooltip>

                                        <Tooltip
                                            content="Exemplo: Azul"
                                            placement="top-start"
                                            className="bg-white text-red-500 border border-gray-200 p-2"
                                        >
                                            <Input
                                                placeholder="Valor Atributo"
                                                value={attr.value}
                                                onChange={e => {
                                                    const nv = [...variants];
                                                    nv[idx].attributes[ai].value = e.target.value;
                                                    onVariantsChange(nv);
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
                                        files={attributeFiles[variantId]?.[ai] || []}
                                        onUpload={files =>
                                            setAttributeFiles(prev => ({
                                                ...prev,
                                                [variantId]: {
                                                    ...(prev[variantId] || {}),
                                                    [ai]: [...(prev[variantId]?.[ai] || []), ...files],
                                                },
                                            }))
                                        }
                                        onRemove={i =>
                                            setAttributeFiles(prev => ({
                                                ...prev,
                                                [variantId]: {
                                                    ...(prev[variantId] || {}),
                                                    [ai]: (prev[variantId]?.[ai] || []).filter((_, j) => j !== i),
                                                },
                                            }))
                                        }
                                    />
                                </div>
                            ))}
                            <Button className='text-violet-500' size="sm" variant="bordered" startContent={<PlusIcon />} onPress={() => addAttribute(idx)}>
                                Adicionar Atributo
                            </Button>
                        </div>
                    </div>
                );
            })}
            <Button className='text-orange-600' size="sm" variant="bordered" startContent={<PlusIcon />} onPress={addVariant}>
                Adicionar Variante
            </Button>
        </div>
    );
};