import { Checkbox, Button, Tooltip } from '@nextui-org/react'
import { ChevronDownIcon, FolderIcon, FolderOpenIcon, InformationCircleIcon } from '@heroicons/react/24/outline'
import { useEffect, useMemo, useState } from 'react'
import { Category } from 'Types/types'

interface CategorySelectorProps {
    categories: Category[]
    selectedCategories: string[]
    onSelectionChange: (selectedIds: string[]) => void
}

export const CategorySelector = ({
    categories: flatCategories,
    selectedCategories,
    onSelectionChange,
}: CategorySelectorProps) => {

    const [tree, setTree] = useState<Category[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    useEffect(() => {
        const map: Record<string, Category> = {}
        const roots: Category[] = []

        flatCategories.forEach(cat => {
            map[cat.id] = { ...cat, children: [], selected: selectedCategories.includes(cat.id), indeterminate: false }
        })

        Object.values(map).forEach(cat => {
            if (cat.parentId) {
                const parent = map[cat.parentId]
                if (parent) parent.children!.push(cat)
            } else {
                roots.push(cat)
            }
        })

        setTree(roots)
        setExpanded(new Set(roots.map(r => r.id)))
    }, [flatCategories, selectedCategories])

    const filtered = useMemo(() => {
        if (!searchTerm) return tree
        const filter = (items: Category[]): Category[] => {
            return items
                .map(item => ({ ...item, children: filter(item.children!) }))
                .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.children!.length > 0)
        }
        return filter(tree)
    }, [searchTerm, tree])

    const toggleExpand = (id: string) => {
        const next = new Set(expanded)
        next.has(id) ? next.delete(id) : next.add(id)
        setExpanded(next)
    }

    const toggleSelect = (id: string) => {
        const setIds = new Set(selectedCategories)
        setIds.has(id) ? setIds.delete(id) : setIds.add(id)
        onSelectionChange(Array.from(setIds))
    }

    const renderNode = (node: Category, level = 0) => {
        const hasChildren = node.children && node.children.length > 0
        const isExpanded = expanded.has(node.id)

        return (
            <div key={node.id}>
                <div className="flex items-center mb-1 text-black" style={{ marginLeft: level * 16 }}>
                    <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        className='text-black'
                        isDisabled={!hasChildren}
                        onPress={() => toggleExpand(node.id)}
                    >
                        {hasChildren && <ChevronDownIcon color='black' className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />}
                    </Button>

                    <Checkbox
                        isSelected={selectedCategories.includes(node.id)}
                        isIndeterminate={node.indeterminate}
                        onValueChange={() => toggleSelect(node.id)}
                        classNames={{ base: 'flex-grow text-black', label: 'flex items-center gap-2 text-black' }}
                    >
                        <div className="flex items-center gap-2">
                            {isExpanded ? <FolderOpenIcon className="h-5 w-5" /> : <FolderIcon className="h-5 w-5" />}
                            {node.name}
                        </div>
                    </Checkbox>
                </div>

                {hasChildren && isExpanded && (
                    <div>
                        {node.children!.map(child => renderNode(child, level + 1))}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="border rounded-lg p-4 bg-white">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-black">
                    Seletor de Categorias
                    <Tooltip
                        content="Selecione categorias e subcategorias hierarquicamente para o produto que você esta cadastrando"
                        className='bg-white text-red-500 p-3'
                    >
                        <InformationCircleIcon className="h-5 w-5 text-gray-500" />
                    </Tooltip>
                </h3>
                <Button className='text-black' size="sm" variant="light" onPress={() => setExpanded(new Set(filtered.flatMap(c => [c.id])))}>
                    Expandir Todos
                </Button>
            </div>

            <input
                type="text"
                placeholder="Pesquisar categorias..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full p-2 mb-4 border rounded text-black"
            />

            <div className="max-h-80 overflow-y-auto space-y-2 text-black">
                {filtered.map(node => renderNode(node))}
            </div>

            <div className="mt-4 text-sm text-gray-500">
                {selectedCategories.length > 0 ? `${selectedCategories.length} categorias selecionadas` : 'Nenhuma categoria selecionada'}
            </div>
        </div>
    )
}