'use client'

import { useState, useEffect, FormEvent, JSX } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { Section } from '@/app/components/section'
import { TitlePage } from '@/app/components/section/titlePage'
import { SidebarAndHeader } from '@/app/components/sidebarAndHeader'
import { setupAPIClientEcommerce } from '@/app/services/apiEcommerce'
import { toast } from 'react-toastify'
import { Tooltip } from '@nextui-org/react'
import { FaRegTrashAlt } from 'react-icons/fa'

type Category = { id: string; name: string; slug: string }
type Product = { id: string; name: string; slug: string }

type MenuItemType =
    | 'INTERNAL_LINK'
    | 'EXTERNAL_LINK'
    | 'CATEGORY'
    | 'PRODUCT'
    | 'CUSTOM_PAGE'

type Menu = {
    id: string
    name: string
    order: number
    isActive: boolean
    icon?: string
    identifier?: string
    position: string
}

type MenuItem = {
    id: string
    label: string
    type: MenuItemType
    url?: string
    category_id?: string
    product_id?: string
    customPageSlug?: string
    order: number
    isActive: boolean
    icon?: string
    parentId?: string | null
}

type TreeNode = MenuItem & { children: TreeNode[] }

export default function EditMenuPage() {

    const { id } = useParams() as { id: string }

    const api = setupAPIClientEcommerce()
    const base = api.defaults.baseURL

    console.log(base)

    // — Menu state —
    const [menu, setMenu] = useState<Menu | null>(null)
    const [name, setName] = useState('')
    const [identifier, setIdentifier] = useState('')
    const [position, setPosition] = useState<string>('');
    const [order, setOrder] = useState(0)
    const [isActive, setIsActive] = useState(true)
    const [currentIcon, setCurrentIcon] = useState<string | null>(null)
    const [iconFile, setIconFile] = useState<File | null>(null)
    const [iconPreview, setIconPreview] = useState<string | null>(null)
    const [menuError, setMenuError] = useState<string | null>(null)
    const [menuLoading, setMenuLoading] = useState(true)
    const [menuSaving, setMenuSaving] = useState(false)

    // — Items state —
    const [items, setItems] = useState<MenuItem[]>([])
    const [itemsLoading, setItemsLoading] = useState(true)
    const [itemsError, setItemsError] = useState<string | null>(null)

    // — Tree & expand —
    const [tree, setTree] = useState<TreeNode[]>([])
    const [expanded, setExpanded] = useState<Set<string>>(new Set())

    // — Modal for items —
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null)

    // — Item form fields —
    const [label, setLabel] = useState('')
    const [type, setType] = useState<MenuItemType>('INTERNAL_LINK')
    const [url, setUrl] = useState('')
    const [category_id, setCategoryId] = useState('')
    const [product_id, setProductId] = useState('')
    const [customPageSlug, setCustomPageSlug] = useState('')
    const [itemOrder, setItemOrder] = useState(0)
    const [itemActive, setItemActive] = useState(true)
    const [itemIconFile, setItemIconFile] = useState<File | null>(null)
    const [itemIconPreview, setItemIconPreview] = useState<string | null>(null)
    const [parentId, setParentId] = useState<string | null>(null)
    const [itemError, setItemError] = useState<string | null>(null)
    const [itemSaving, setItemSaving] = useState(false)

    // — Categories & Products for selects —
    const [categories, setCategories] = useState<Category[]>([])
    const [products, setProducts] = useState<Product[]>([])

    // fetch categories & products once
    useEffect(() => {
        async function loadMeta() {
            try {
                const [{ data: catPayload }, { data: prodPayload }] = await Promise.all([
                    api.get<{
                        rootCategories: Category[]
                        all_categories_disponivel: Category[]
                    }>('/category/cms'),
                    api.get<{ allow_products: Product[] }>('/get/products')
                ])
                setCategories(catPayload.all_categories_disponivel)
                setProducts(prodPayload.allow_products)
            } catch (err) {
                console.error('Erro ao carregar categorias/produtos', err)
            }
        }
        loadMeta()
    }, [])

    // build tree helper
    function buildTree(list: MenuItem[]): TreeNode[] {
        const map = new Map<string, TreeNode>()
        list.forEach(i => map.set(i.id, { ...i, children: [] }))
        const roots: TreeNode[] = []
        map.forEach(node => {
            if (node.parentId && map.has(node.parentId)) {
                map.get(node.parentId)!.children.push(node)
            } else {
                roots.push(node)
            }
        })
            ; (function sortRec(nodes: TreeNode[]) {
                nodes.sort((a, b) => a.order - b.order)
                nodes.forEach(n => sortRec(n.children))
            })(roots)
        return roots
    }

    // previews
    useEffect(() => {
        if (iconFile) {
            const u = URL.createObjectURL(iconFile)
            setIconPreview(u)
            return () => URL.revokeObjectURL(u)
        }
        if (currentIcon) setIconPreview(`${base}/files/menu/${currentIcon}`)
    }, [iconFile, currentIcon, base])

    useEffect(() => {
        if (itemIconFile) {
            const u = URL.createObjectURL(itemIconFile)
            setItemIconPreview(u)
            return () => URL.revokeObjectURL(u)
        }
        if (editingItem?.icon) setItemIconPreview(`${base}/files/menu/${editingItem.icon}`)
        else setItemIconPreview(null)
    }, [itemIconFile, editingItem, base])

    // rebuild tree
    useEffect(() => { setTree(buildTree(items)) }, [items])

    // load menu & items
    useEffect(() => {
        (async () => {
            try {
                const [{ data: m }, { data: its }] = await Promise.all([
                    api.get<Menu>(`/menus/get/data?id=${id}`),
                    api.get<MenuItem[]>('/menuItem/get', { params: { menu_id: id } })
                ])
                setMenu(m)
                setName(m.name)
                setIdentifier(m.identifier || "")
                setPosition(m.position || "topo_header_menu")
                setOrder(m.order)
                setIsActive(m.isActive)
                setCurrentIcon(m.icon || null)
                setItems(its)
            } catch {
                setMenuError('Erro ao carregar menu')
                setItemsError('Erro ao carregar itens')
            } finally {
                setMenuLoading(false)
                setItemsLoading(false)
            }
        })()
    }, [id])

    // save menu
    async function handleSaveMenu(e: FormEvent) {
        e.preventDefault()
        if (!name.trim()) return setMenuError('Nome obrigatório')
        if (order < 0) return setMenuError('Ordem deve ser ≥ 0')
        setMenuError(null); setMenuSaving(true)
        try {
            const form = new FormData()
            form.append('name', name)
            form.append('order', String(order))
            form.append('isActive', String(isActive))
            form.append('identifier', identifier)
            form.append('position', position);
            if (iconFile) form.append('file', iconFile)
            else if (currentIcon) form.append('file', currentIcon)

            const { data: updated } = await api.put<Menu>(`/menu/getUnique/${id}`, form, { transformRequest: d => d })
            setMenu(updated)
            setCurrentIcon(updated.icon || null)
            setIconFile(null)
            setIconPreview(`${base}/files/${updated.icon}`)
            toast.success('Menu atualizado')
        } catch {
            setMenuError('Falha ao salvar menu')
            toast.error('Falha ao salvar menu')
        } finally { setMenuSaving(false) }
    }

    // item modal handlers
    function openNewItemModal() {
        setEditingItem(null)
        setLabel(''); setType('INTERNAL_LINK'); setUrl('')
        setCategoryId(''); setProductId(''); setCustomPageSlug('')
        setItemOrder(0); setItemActive(true)
        setItemIconFile(null); setParentId(null)
        setItemError(null); setIsModalOpen(true)
    }
    function openEditItemModal(item: MenuItem) {
        setEditingItem(item)
        setLabel(item.label); setType(item.type)
        setUrl(item.url || '')
        setCategoryId(item.category_id || '')
        setProductId(item.product_id || '')
        setCustomPageSlug(item.customPageSlug || '')
        setItemOrder(item.order); setItemActive(item.isActive)
        setItemIconFile(null); setParentId(item.parentId || null)
        setItemError(null); setIsModalOpen(true)
    }

    // save or update item
    async function handleSaveItem(e: FormEvent) {
        e.preventDefault()
        if (!label.trim()) return setItemError('Label obrigatório')
        setItemError(null); setItemSaving(true)
        try {
            const form = new FormData()
            form.append('label', label)
            form.append('type', type)
            form.append('order', String(itemOrder))
            form.append('isActive', String(itemActive))
            form.append('menu_id', id)

            if (type === 'INTERNAL_LINK' || type === 'EXTERNAL_LINK') {
                form.append('url', url)
            } else if (type === 'CATEGORY') {
                form.append('category_id', category_id)
            } else if (type === 'PRODUCT') {
                form.append('product_id', product_id)
            } else if (type === 'CUSTOM_PAGE') {
                form.append('customPageSlug', customPageSlug)
            }

            if (itemIconFile) form.append('file', itemIconFile)
            else if (editingItem?.icon) form.append('file', editingItem.icon)

            if (parentId) form.append('parentId', parentId)

            const res = editingItem
                ? await api.put<MenuItem>(`/menuItem/getUnique/${editingItem.id}`, form, { transformRequest: d => d })
                : await api.post<MenuItem>('/menuItem/create', form, { transformRequest: d => d })

            const saved = res.data
            setItems(prev => editingItem
                ? prev.map(i => i.id === saved.id ? saved : i)
                : [...prev, saved]
            )
            toast.success('Item salvo')
            setIsModalOpen(false)
        } catch {
            setItemError('Falha ao salvar item')
            toast.error('Falha ao salvar item')
        } finally { setItemSaving(false) }
    }

    // delete item
    async function handleDeleteItem(item: MenuItem) {
        try {
            await api.delete(`/menuItem/get/delete/${item.id}`)
            setItems(prev => prev.filter(i => i.id !== item.id))
            toast.success('Item excluído')
        } catch {
            toast.error('Erro ao excluir item')
        }
    }

    // expand nodes
    function toggleExpand(id: string) {
        setExpanded(prev => {
            const c = new Set(prev)
            c.has(id) ? c.delete(id) : c.add(id)
            return c
        })
    }

    // render rows with Destino column
    function renderRows(nodes: TreeNode[], depth = 0): JSX.Element[] {
        return nodes.flatMap(node => {
            const isExpanded = expanded.has(node.id)
            const hasChildren = node.children.length > 0
            const indent = depth * 16
            const iconUrl = node.icon ? `${base}/files/menu/${node.icon}` : null

            // calcula "Destino"
            let destino = '-'
            if (node.type === 'INTERNAL_LINK' || node.type === 'EXTERNAL_LINK') {
                destino = node.url || '-'
            } else if (node.type === 'CATEGORY') {
                const cat = categories.find(c => c.id === node.category_id)
                destino = cat ? cat.name : node.category_id || '-'
            } else if (node.type === 'PRODUCT') {
                const pr = products.find(p => p.id === node.product_id)
                destino = pr ? pr.name : node.product_id || '-'
            } else if (node.type === 'CUSTOM_PAGE') {
                destino = node.customPageSlug || '-'
            }

            const row = (
                <tr key={node.id}>
                    <td className="border px-2 py-1">
                        <div className="flex items-center" style={{ marginLeft: indent }}>
                            {hasChildren
                                ? <button onClick={() => toggleExpand(node.id)} className="mr-1">{isExpanded ? '▾' : '▸'}</button>
                                : <span className="mr-1 w-4 block" />}
                            {node.label}
                        </div>
                    </td>
                    <td className="border px-2 py-1">{node.type}</td>
                    <td className="border px-2 py-1">{node.order}</td>
                    <td className="border px-2 py-1">{node.isActive ? 'Sim' : 'Não'}</td>
                    <td className="border px-2 py-1">{destino}</td>
                    <td className="border px-2 py-1">
                        {iconUrl
                            ? <Image src={iconUrl} alt="ícone" width={24} height={24} className="rounded" />
                            : '-'}
                    </td>
                    <td className="border px-2 py-1 space-x-2">
                        <button onClick={() => openEditItemModal(node)} className="text-orange-600">Editar</button>
                        <button onClick={() => handleDeleteItem(node)} className="text-red-600">Excluir</button>
                    </td>
                </tr>
            )

            return hasChildren && isExpanded
                ? [row, ...renderRows(node.children, depth + 1)]
                : [row]
        })
    }

    async function deleteImageMenuItem(id: string) {
        try {
            const res = await api.delete(`/menuItem/icon/delete?menuItem_id=${id}`)
            const saved = res.data
            setItems(prev => editingItem
                ? prev.map(i => i.id === saved.id ? saved : i)
                : [...prev, saved]
            )
            toast.success('Imagem excluída')
            setItemIconPreview(null)
        } catch {
            toast.error('Erro ao excluir imagem')
        }
    }

    async function deleteMenuImageItem(id: string) {
        try {
            await api.delete(`/menu/icon/delete?menu_id=${id}`)
            toast.success('Imagem excluída')
            setIconPreview(null)
        } catch {
            toast.error('Erro ao excluir imagem')
        }
    }

    if (menuLoading) return <p>Carregando menu…</p>

    return (
        <SidebarAndHeader>
            <Section>
                <TitlePage title="EDITAR MENU" />

                <form onSubmit={handleSaveMenu} className="mt-4 space-y-4 max-w-lg">
                    <div>
                        <label className="block text-sm font-medium">Nome</label>
                        <input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            disabled={menuSaving}
                            className="mt-1 w-full border rounded px-2 py-1 text-black"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Posição</label>
                        <select
                            value={position}
                            onChange={e => setPosition(e.target.value)}
                            disabled={menuSaving}
                            className="mt-1 w-full border rounded px-2 py-1 text-black"
                        >
                            <option value="topo_header_menu">Topo Header Menu</option>
                            <option value="lateral_esquerda">Lateral Esquerda</option>
                            <option value="footer_rodape">Footer Rodapé</option>
                        </select>
                    </div>

                    {(position === "topo_header_menu" || position === "footer_rodape")
                        ? null
                        : (
                            <div>
                                <label className="block text-sm font-medium">Identificação</label>
                                <input
                                    value={identifier}
                                    onChange={e => setIdentifier(e.target.value)}
                                    disabled={menuSaving}
                                    className="mt-1 w-full border rounded px-2 py-1 text-black"
                                />
                            </div>
                        )
                    }

                    <div>
                        <label className="block text-sm font-medium">Ordem</label>
                        <input
                            type="number" min={0}
                            value={order}
                            onChange={e => setOrder(+e.target.value)}
                            disabled={menuSaving}
                            className="mt-1 w-24 border rounded px-2 py-1 text-black"
                        />
                    </div>
                    <div className="flex items-center">
                        <input
                            id="active"
                            type="checkbox"
                            checked={isActive}
                            onChange={e => setIsActive(e.target.checked)}
                            disabled={menuSaving}
                            className="h-4 w-4"
                        />
                        <label htmlFor="active" className="ml-2">Ativo</label>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Ícone do Menu</label>
                        <input
                            type="file" accept="image/*"
                            onChange={e => setIconFile(e.target.files?.[0] || null)}
                            disabled={menuSaving}
                            className="mt-1 block w-full"
                        />
                        {iconPreview && (
                            <div>
                                <FaRegTrashAlt
                                    color='red'
                                    size={20}
                                    style={{ cursor: 'pointer', margin: '10px' }}
                                    onClick={() => deleteMenuImageItem(menu?.id || '')}
                                />
                                <img src={iconPreview} alt="Preview" className="mt-2 h-20 w-20 rounded border object-cover" />
                            </div>
                        )}
                    </div>
                    {menuError && <p className="text-red-600">{menuError}</p>}
                    <button
                        type="submit"
                        disabled={menuSaving}
                        className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
                    >
                        {menuSaving ? 'Atualizando…' : 'Atualizar Menu'}
                    </button>
                </form>

                <div className="mt-8">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold">Itens de Menu</h2>
                        <button onClick={openNewItemModal} className="bg-violet-600 text-white px-3 py-1 rounded">
                            + Adicionar Item
                        </button>
                    </div>
                    {itemsLoading
                        ? <p>Carregando itens…</p>
                        : itemsError
                            ? <p className="text-red-600">{itemsError}</p>
                            : (
                                <table className="w-full mt-4 table-auto border-collapse">
                                    <thead>
                                        <tr className="bg-gray-100 text-black">
                                            <th className="border px-2 py-1">Label</th>
                                            <th className="border px-2 py-1">Tipo</th>
                                            <th className="border px-2 py-1">Ordem</th>
                                            <th className="border px-2 py-1">Ativo</th>
                                            <th className="border px-2 py-1">Destino</th>
                                            <th className="border px-2 py-1">Ícone</th>
                                            <th className="border px-2 py-1">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {renderRows(tree)}
                                    </tbody>
                                </table>
                            )
                    }
                </div>

                {isModalOpen && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="bg-white rounded-lg p-6 w-96">
                            <h3 className="text-lg font-semibold mb-4 text-black">
                                {editingItem ? 'Editar Item' : 'Novo Item'}
                            </h3>
                            <form onSubmit={handleSaveItem} className="space-y-3">
                                <div>
                                    <Tooltip
                                        content="Texto exibido no front (ex.: Copos, Copo fundo de vidro, etc...)"
                                        placement="top-start"
                                        className="bg-white text-red-500 border border-gray-200 p-2"
                                    >
                                        <input
                                            value={label}
                                            onChange={e => setLabel(e.target.value)}
                                            disabled={itemSaving}
                                            className="mt-1 w-full border rounded px-2 py-1 text-black"
                                            placeholder='Digite aqui...'
                                        />
                                    </Tooltip>

                                </div>
                                <div>
                                    <Tooltip
                                        content="Tipo de link (Link Interno, Link Externo, Categoria, etc.)"
                                        placement="top-start"
                                        className="bg-white text-red-500 border border-gray-200 p-2"
                                    >
                                        <select
                                            value={type}
                                            onChange={e => {
                                                setType(e.target.value as MenuItemType)
                                                setUrl('')
                                                setParentId(null)
                                            }}
                                            disabled={itemSaving}
                                            className="mt-1 w-full border rounded px-2 py-1 text-black"
                                        >
                                            <option value="INTERNAL_LINK">Link Interno</option>
                                            <option value="EXTERNAL_LINK">Link Externo</option>
                                            <option value="CATEGORY">Categoria</option>
                                            <option value="PRODUCT">Produto</option>
                                            <option value="CUSTOM_PAGE">Página Customizada</option>
                                        </select>
                                    </Tooltip>
                                </div>
                                <div>
                                    {/* Se for link */}
                                    {(type === 'INTERNAL_LINK' || type === 'EXTERNAL_LINK') && (
                                        <div>
                                            <label className="block text-sm text-black">URL</label>
                                            <input
                                                type="text"
                                                value={url}
                                                onChange={e => setUrl(e.target.value)}
                                                disabled={itemSaving}
                                                className="mt-1 w-full border rounded px-2 py-1 text-black"
                                            />
                                        </div>
                                    )}

                                    {/* Se for categoria */}
                                    {type === 'CATEGORY' && (
                                        <div>
                                            <label className="block text-sm text-black">Categoria</label>
                                            <select
                                                value={category_id || ''}
                                                onChange={e => setCategoryId(e.target.value)}
                                                disabled={itemSaving}
                                                className="mt-1 w-full border rounded px-2 py-1 text-black"
                                            >
                                                <option value="">Selecione...</option>
                                                {categories.map(cat => (
                                                    <option key={cat.id} value={cat.id}>
                                                        {cat.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {/* Se for produto */}
                                    {type === 'PRODUCT' && (
                                        <div>
                                            <label className="block text-sm text-black">Produto</label>
                                            <select
                                                value={product_id || ''}
                                                onChange={e => setProductId(e.target.value)}
                                                disabled={itemSaving}
                                                className="mt-1 w-full border rounded px-2 py-1 text-black"
                                            >
                                                <option value="">Selecione...</option>
                                                {products.map(p => (
                                                    <option key={p.id} value={p.id}>
                                                        {p.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {/* Se for página customizada */}
                                    {type === 'CUSTOM_PAGE' && (
                                        <div>
                                            <label className="block text-sm text-black">Slug da Página</label>
                                            <input
                                                type="text"
                                                value={customPageSlug}
                                                onChange={e => setCustomPageSlug(e.target.value)}
                                                disabled={itemSaving}
                                                className="mt-1 w-full border rounded px-2 py-1 text-black"
                                            />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <Tooltip
                                        content="Define a ordem do item dentro do menu ou subitem"
                                        placement="top-start"
                                        className="bg-white text-red-500 border border-gray-200 p-2"
                                    >
                                        <input
                                            type="number"
                                            min={0}
                                            value={itemOrder}
                                            onChange={e => setItemOrder(+e.target.value)}
                                            disabled={itemSaving}
                                            className="mt-1 w-24 border rounded px-2 py-1 text-black"
                                            placeholder='0'
                                        />
                                    </Tooltip>

                                </div>
                                <div className="flex items-center">
                                    <input
                                        id="itemActive"
                                        type="checkbox"
                                        checked={itemActive}
                                        onChange={e => setItemActive(e.target.checked)}
                                        disabled={itemSaving}
                                        className="h-4 w-4"
                                    />
                                    <label htmlFor="itemActive" className="ml-2 text-black">Ativo</label>
                                </div>
                                <div>
                                    <label className="block text-sm text-black">Sub‑Item de</label>
                                    <select
                                        value={parentId || ''}
                                        onChange={e => setParentId(e.target.value || null)}
                                        disabled={itemSaving}
                                        className="mt-1 w-full border rounded px-2 py-1 text-black"
                                    >
                                        <option value="" className='text-black'>Nenhum (item raiz)</option>
                                        {/* gera opções recursivas */}
                                        {tree.map(node => (
                                            <ItemOption key={node.id} node={node} depth={0} />
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-black">Ícone do Item</label>
                                    <input
                                        type="file" accept="image/*"
                                        onChange={e => setItemIconFile(e.target.files?.[0] || null)}
                                        disabled={itemSaving}
                                        className="mt-1 block w-full text-black"
                                    />
                                    {itemIconPreview && (
                                        <div>
                                            <FaRegTrashAlt
                                                color='red'
                                                size={20}
                                                style={{ cursor: 'pointer', margin: '10px' }}
                                                onClick={() => deleteImageMenuItem(editingItem?.id || '')}
                                            />
                                            <Image
                                                src={itemIconPreview}
                                                alt="Preview Item"
                                                className="mt-2 rounded border object-cover"
                                                height={100}
                                                width={100}
                                            />
                                        </div>
                                    )}
                                </div>
                                <div className="flex justify-end space-x-2 mt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        disabled={itemSaving}
                                        className="px-3 py-1 border rounded bg-gray-300 text-black"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={itemSaving}
                                        className="bg-orange-600 text-white px-3 py-1 rounded disabled:opacity-50"
                                    >
                                        {itemSaving ? 'Salvando…' : 'Salvar'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </Section>
        </SidebarAndHeader>
    )
}

// componente para renderizar opções no select de parentId
function ItemOption({
    node,
    depth
}: {
    node: TreeNode
    depth: number
}) {
    return (
        <>
            <option value={node.id}>
                {Array(depth).fill('—').join('')}{node.label}
            </option>
            {node.children.map(child => (
                <ItemOption key={child.id} node={child} depth={depth + 1} />
            ))}
        </>
    )
}