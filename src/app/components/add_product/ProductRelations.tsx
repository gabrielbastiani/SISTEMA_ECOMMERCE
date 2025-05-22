'use client'

import { Autocomplete, AutocompleteItem, Button, Checkbox, Select, SelectItem, Tooltip, RadioGroup, Radio, Input } from '@nextui-org/react'
import { PlusIcon, TrashIcon, InformationCircleIcon } from '@heroicons/react/24/outline'
import { ChangeEvent } from 'react'
import { CollapsibleInfo } from './helpers_componentes/CollapsibleInfo'

type RelationDirection = 'parent' | 'child'
type RelationType = 'VARIANT' | 'SIMPLE'

interface ProductRelation {
    relationDirection: RelationDirection
    relatedProductId: string
    relationType: RelationType
    sortOrder: number
    isRequired: boolean
}

interface ProductRelationsProps {
    relations: ProductRelation[]
    products: Array<{ id: string; name: string }>
    onRelationsChange: (relations: ProductRelation[]) => void
}

export const ProductRelations = ({ relations, products, onRelationsChange }: ProductRelationsProps) => {
    const addRelation = () => {
        onRelationsChange([
            ...relations,
            {
                relationDirection: 'child',
                relatedProductId: '',
                relationType: 'VARIANT',
                sortOrder: 0,
                isRequired: false
            }
        ])
    }

    const handleCheckboxChange = (index: number, checked: boolean) => {
        const newRelations = [...relations]
        newRelations[index].isRequired = checked
        onRelationsChange(newRelations)
    }

    return (
        <div className="space-y-6 p-4 border rounded-lg bg-gray-50">
            <CollapsibleInfo />
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-black">
                Relacionamentos de Produtos
                <Tooltip
                    content="Gerencie como este produto se relaciona com outros em seu catálogo"
                    className="bg-white text-red-400 border border-gray-200 p-3 max-w-[300px]"
                >
                    <InformationCircleIcon className="h-5 w-5 text-gray-500" />
                </Tooltip>
            </h3>

            {relations.map((relation, index) => (
                <div key={index} className="space-y-4 p-4 bg-white rounded-lg border border-gray-200">
                    <div className="flex gap-4 items-center">
                        <Tooltip
                            content="Defina a direção do relacionamento: Pai (produto principal) ou Filho (produto relacionado)"
                            className="bg-white text-red-400 border border-gray-200 p-3 max-w-[300px]"
                        >
                            <RadioGroup
                                label="Direção do Relacionamento"
                                className='text-black'
                                orientation="horizontal"
                                value={relation.relationDirection}
                                onValueChange={(value) => {
                                    const newRelations = [...relations]
                                    newRelations[index].relationDirection = value as RelationDirection
                                    newRelations[index].relatedProductId = ''
                                    onRelationsChange(newRelations)
                                }}
                            >
                                <Radio className='text-black' value="child">
                                    <span className='text-black'>Este produto é Pai</span>
                                </Radio>
                                <Radio className='text-black' value="parent">
                                    <span className='text-black'>Este produto é Filho</span>
                                </Radio>
                            </RadioGroup>
                        </Tooltip>

                        <Button
                            isIconOnly
                            variant="light"
                            onPress={() => {
                                const newRelations = [...relations]
                                newRelations.splice(index, 1)
                                onRelationsChange(newRelations)
                            }}
                            className='text-black'
                        >
                            <TrashIcon className="h-5 w-5 text-red-600" />
                        </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Tooltip
                            content={relation.relationDirection === 'child'
                                ? "Selecione o produto Filho que pertence a este produto Pai"
                                : "Selecione o produto Pai ao qual este produto Filho pertence"}
                            className="bg-white text-red-400 border border-gray-200 p-3 max-w-[300px]"
                        >
                            <Autocomplete
                                placeholder={relation.relationDirection === 'child'
                                    ? "Selecionar Produto Filho"
                                    : "Selecionar Produto Pai"}
                                defaultItems={products}
                                selectedKey={relation.relatedProductId}
                                onSelectionChange={(key) => {
                                    const newRelations = [...relations]
                                    newRelations[index].relatedProductId = key as string
                                    onRelationsChange(newRelations)
                                }}
                                className="flex-1 text-black"
                            >
                                {(product) => (
                                    <AutocompleteItem
                                        key={product.id}
                                        className="hover:bg-gray-100 bg-white text-black"
                                        textValue={product.name}
                                    >
                                        {product.name}
                                    </AutocompleteItem>
                                )}
                            </Autocomplete>
                        </Tooltip>

                        <Tooltip
                            content="Determine o tipo de relação entre os produtos"
                            className="bg-white text-red-400 border border-gray-200 p-3 max-w-[300px]"
                        >
                            <Select
                                placeholder="Tipo de Relação"
                                selectedKeys={[relation.relationType]}
                                onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                                    const newRelations = [...relations]
                                    newRelations[index].relationType = e.target.value as RelationType
                                    onRelationsChange(newRelations)
                                }}
                                className='text-black'
                            >
                                <SelectItem
                                    className='text-black bg-white'
                                    key="VARIANT"
                                    description="Para variações do mesmo produto (ex: cores, tamanhos)"
                                >
                                    Variação
                                </SelectItem>
                                <SelectItem
                                    className='text-black bg-white'
                                    key="SIMPLE"
                                    description="Para produtos complementares (ex: acessórios)"
                                >
                                    Simples
                                </SelectItem>
                            </Select>
                        </Tooltip>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Tooltip
                            content="Ordem de exibição do produto relacionado (menor número aparece primeiro)"
                            className="bg-white text-red-400 border border-gray-200 p-3 max-w-[300px]"
                        >
                            <Input
                                className='text-black'
                                type="number"
                                placeholder="Ordem de Exibição"
                                value={relation.sortOrder.toString()}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                    const newRelations = [...relations]
                                    newRelations[index].sortOrder = Number(e.target.value)
                                    onRelationsChange(newRelations)
                                }}
                            />
                        </Tooltip>

                        <Tooltip
                            content="Se a relação é obrigatória para a venda"
                            className="bg-white text-red-400 border border-gray-200 p-3 max-w-[300px]"
                        >
                            <Checkbox
                                isSelected={relation.isRequired}
                                onValueChange={(checked: boolean) => handleCheckboxChange(index, checked)}
                                className="mt-6 text-black"
                            >
                                <span className="text-black">Obrigatório para Compra</span>
                            </Checkbox>
                        </Tooltip>
                    </div>
                </div>
            ))}

            <Button
                color="primary"
                className="bg-orange-600 text-white hover:bg-orange-700"
                startContent={<PlusIcon className="h-5 w-5" />}
                onPress={addRelation}
            >
                Adicionar Novo Relacionamento
            </Button>
        </div>
    )
}