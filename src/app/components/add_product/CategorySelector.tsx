'use client'

import { Checkbox, Button, Tooltip, Spinner } from '@nextui-org/react'
import { ChevronDownIcon, FolderIcon, FolderOpenIcon, InformationCircleIcon } from '@heroicons/react/24/outline'
import { useEffect, useMemo, useState } from 'react'

export interface Category {
    id: string
    name: string
    parentId: string | null
    children: Category[]
    selected?: boolean
    indeterminate?: boolean
}

interface CategorySelectorProps {
    categories: Category[]
    selectedCategories: string[]
    onSelectionChange: (selectedIds: string[]) => void
}

const cleanCategoryTree = (categories: Category[]): Category[] => {
    return categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        parentId: cat.parentId,
        children: cleanCategoryTree(cat.children || []),
        selected: false,
        indeterminate: false
    }))
}

export const CategorySelector = ({
    categories: initialCategories,
    selectedCategories,
    onSelectionChange
}: CategorySelectorProps) => {
    const [searchTerm, setSearchTerm] = useState('')
    const [categories, setCategories] = useState<Category[]>([])
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

    const filteredCategories = useMemo(() => {
        if (!searchTerm) return categories

        const searchLower = searchTerm.toLowerCase()

        const filter = (items: Category[]): Category[] => {
            return items.filter(item => {
                const matches = item.name.toLowerCase().includes(searchLower)
                const childrenMatches = filter(item.children)
                return matches || childrenMatches.length > 0
            }).map(item => ({
                ...item,
                children: filter(item.children)
            }))
        }

        return filter(categories)
    }, [categories, searchTerm])

    useEffect(() => {
        const processedCategories = cleanCategoryTree(initialCategories)

        const updateSelection = (cats: Category[]): Category[] => {
            return cats.map(cat => {
                const children = updateSelection(cat.children)
                const selected = selectedCategories.includes(cat.id)
                const indeterminate = !selected && children.some(c => c.selected || c.indeterminate)

                return {
                    ...cat,
                    selected,
                    indeterminate: selected ? false : indeterminate,
                    children
                }
            })
        }

        setCategories(updateSelection(processedCategories))
    }, [initialCategories, selectedCategories])

    const toggleCategory = (categoryId: string) => {
        const newSelection = new Set(selectedCategories)
        newSelection.has(categoryId) ? newSelection.delete(categoryId) : newSelection.add(categoryId)
        onSelectionChange(Array.from(newSelection))
    }

    const toggleExpand = (categoryId: string) => {
        setExpandedCategories(prev => {
            const newSet = new Set(prev)
            newSet.has(categoryId) ? newSet.delete(categoryId) : newSet.add(categoryId)
            return newSet
        })
    }

    const renderCategory = (category: Category, level: number = 0) => {
        const hasChildren = category.children.length > 0
        const isExpanded = expandedCategories.has(category.id)

        return (
            <div key={category.id} className="space-y-2">
                <div className="flex items-center gap-2" style={{ marginLeft: `${level * 20}px` }}>
                    <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        className="text-gray-600"
                        onPress={() => toggleExpand(category.id)}
                        isDisabled={!hasChildren}
                    >
                        {hasChildren && (
                            <ChevronDownIcon className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        )}
                    </Button>

                    <Checkbox
                        isSelected={category.selected}
                        isIndeterminate={category.indeterminate}
                        onValueChange={() => toggleCategory(category.id)}
                        classNames={{
                            base: 'flex-grow',
                            label: 'flex items-center gap-2'
                        }}
                    >
                        <span className="flex items-center gap-2">
                            {hasChildren ? (
                                isExpanded ? (
                                    <FolderOpenIcon className="h-5 w-5 text-primary" />
                                ) : (
                                    <FolderIcon className="h-5 w-5 text-default" />
                                )
                            ) : (
                                <FolderIcon className="h-5 w-5 text-default opacity-50" />
                            )}
                            {category.name}
                        </span>
                    </Checkbox>
                </div>

                {hasChildren && isExpanded && (
                    <div className="space-y-2">
                        {category.children.map(child => renderCategory(child, level + 1))}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="border rounded-lg p-4 bg-white">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    Seletor de Categorias
                    <Tooltip
                        content="Selecione as categorias principais e subcategorias para este produto"
                        className="bg-white text-black border border-gray-200 p-3 max-w-[300px]"
                    >
                        <InformationCircleIcon className="h-5 w-5 text-gray-500" />
                    </Tooltip>
                </h3>
                <Button
                    size="sm"
                    variant="light"
                    onPress={() => setExpandedCategories(new Set(categories.map(c => c.id)))}
                >
                    Expandir Todas
                </Button>
            </div>

            <input
                type="text"
                placeholder="Pesquisar categorias..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 mb-4 border rounded-lg"
            />

            <div className="space-y-3 max-h-[500px] overflow-y-auto p-2">
                {filteredCategories.map(category => renderCategory(category))}
            </div>

            <div className="mt-4 text-sm text-gray-500">
                {selectedCategories.length > 0 ? (
                    <span>{selectedCategories.length} categorias selecionadas</span>
                ) : (
                    <span>Nenhuma categoria selecionada</span>
                )}
            </div>
        </div>
    )
}