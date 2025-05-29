'use client'

import { Button, Tooltip as NextTooltip } from '@nextui-org/react'
import { XMarkIcon, PlusIcon, InformationCircleIcon } from '@heroicons/react/24/outline'
import { useState, useMemo } from 'react'
import { Category } from 'Types/types'
import { CategorySelector } from '@/app/components/add_product/CategorySelector'

interface CategoryManagerUpdateProps {
    categories: Category[]
    selectedCategories: string[]
    onSelectionChange: (selectedIds: string[]) => void
}

export const CategoryManagerUpdate = ({
    categories,
    selectedCategories,
    onSelectionChange
}: CategoryManagerUpdateProps) => {
    const [showSelector, setShowSelector] = useState(false)

    // Cria um mapa para lookup rápido
    const categoryMap = useMemo(() => {
        const m: Record<string, Category> = {}
        categories.forEach(c => (m[c.id] = c))
        return m
    }, [categories])

    // Monta o caminho completo "A > B > C"
    const buildPath = (id: string): string => {
        const names: string[] = []
        let curr: Category | undefined = categoryMap[id]

        while (curr) {
            names.unshift(curr.name)
            curr = curr.parentId ? categoryMap[curr.parentId] : undefined
        }

        return names.join(' › ')
    }

    // Lista de objetos {id, path}
    const items = useMemo(
        () =>
            selectedCategories.map(id => ({
                id,
                path: buildPath(id)
            })),
        [selectedCategories, buildPath]
    )

    const handleRemove = (id: string) =>
        onSelectionChange(selectedCategories.filter(c => c !== id))

    const handleConfirm = (ids: string[]) => {
        onSelectionChange(ids)
        setShowSelector(false)
    }

    return (
        <div className="space-y-4">
            {/* Lista vertical de badges */}
            <div className="flex flex-col gap-2">
                {items.length > 0 ? (
                    items.map(({ id, path }) => (
                        <div
                            key={id}
                            className="flex items-center bg-indigo-50 text-orange-900 px-3 py-2 rounded-md shadow-sm hover:bg-orange-100 transition-colors"
                        >
                            <span className="flex-1 text-sm">{path}</span>
                            <XMarkIcon
                                className="h-5 w-5 cursor-pointer text-orange-500 hover:text-red-500 ml-2"
                                onClick={() => handleRemove(id)}
                            />
                        </div>
                    ))
                ) : (
                    <div className="text-gray-500 italic">Nenhuma categoria atribuída</div>
                )}
            </div>

            {/* Botão abrir/fechar selector */}
            <div>
                {showSelector ? (
                    <div className="p-4 border border-gray-200 rounded-md bg-white shadow-inner">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="text-lg font-medium text-gray-700">Editar Categorias</h4>
                            <Button className='text-red-600' size="sm" variant="light" onPress={() => setShowSelector(false)}>
                                Cancelar
                            </Button>
                        </div>

                        <CategorySelector
                            categories={categories}
                            selectedCategories={selectedCategories}
                            onSelectionChange={handleConfirm}
                        />

                        <div className="mt-4 flex justify-end">
                            <Button size="sm" onPress={() => handleConfirm(selectedCategories)}>
                                <PlusIcon className="h-4 w-4 mr-1" /> Confirmar
                            </Button>
                        </div>
                    </div>
                ) : (
                    <Button
                        size="sm"
                        className="flex items-center gap-1 bg-indigo-600 text-white hover:bg-indigo-700"
                        startContent={<PlusIcon className="h-4 w-4" />}
                        onPress={() => setShowSelector(true)}
                    >
                        Adicionar / Editar Categorias
                    </Button>
                )}
            </div>

            <NextTooltip
                content="Clique em Adicionar para alterar as categorias atribuídas"
                placement="top-start"
                className="bg-white text-red-500 border border-gray-200 p-2"
            >
                <InformationCircleIcon className="h-5 w-5 text-gray-400" />
            </NextTooltip>
        </div>
    )
}