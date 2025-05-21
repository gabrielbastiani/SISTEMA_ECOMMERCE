'use client'

import { Autocomplete, AutocompleteItem, Button, Checkbox, Select, SelectItem } from '@nextui-org/react'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'

interface ProductRelationsProps {
    relations: any[]
    products: any[]
    onRelationsChange: (relations: any[]) => void
}

export const ProductRelations = ({ relations, products, onRelationsChange }: ProductRelationsProps) => {
    const addRelation = () => {
        onRelationsChange([
            ...relations,
            {
                childProductId: '',
                relationType: 'VARIANT',
                sortOrder: 0,
                isRequired: false
            }
        ])
    }

    return (
        <div className="space-y-4">
            {relations.map((relation, index) => (
                <div key={index} className="flex gap-4 items-end">
                    <Autocomplete
                        label="Produto Relacionado"
                        defaultItems={products}
                        selectedKey={relation.childProductId}
                        onSelectionChange={(key) => {
                            const newRelations = [...relations]
                            newRelations[index].childProductId = key
                            onRelationsChange(newRelations)
                        }}
                        className="flex-1"
                    >
                        {(product) => (
                            <AutocompleteItem key={product.id}>
                                {product.name}
                            </AutocompleteItem>
                        )}
                    </Autocomplete>

                    <Select
                        label="Tipo de Relação"
                        selectedKeys={[relation.relationType]}
                        onChange={(e) => {
                            const newRelations = [...relations]
                            newRelations[index].relationType = e.target.value
                            onRelationsChange(newRelations)
                        }}
                        className="w-40"
                    >
                        <SelectItem key="VARIANT">Variação</SelectItem>
                        <SelectItem key="SIMPLE">Simples</SelectItem>
                    </Select>

                    <Checkbox
                        isSelected={relation.isRequired}
                        onChange={(checked) => {
                            const newRelations = [...relations]
                            newRelations[index].isRequired = checked
                            onRelationsChange(newRelations)
                        }}
                    >
                        Obrigatório
                    </Checkbox>

                    <Button
                        isIconOnly
                        variant="light"
                        onPress={() => {
                            const newRelations = [...relations]
                            newRelations.splice(index, 1)
                            onRelationsChange(newRelations)
                        }}
                    >
                        <TrashIcon className="h-4 w-4 text-danger" />
                    </Button>
                </div>
            ))}

            <Button
                color="primary"
                variant="bordered"
                startContent={<PlusIcon className="h-4 w-4" />}
                onPress={addRelation}
            >
                Adicionar Relação
            </Button>
        </div>
    )
}