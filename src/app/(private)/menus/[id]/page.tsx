'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Section } from '@/app/components/section'
import { TitlePage } from '@/app/components/section/titlePage'
import { SidebarAndHeader } from '@/app/components/sidebarAndHeader'
import { setupAPIClientEcommerce } from '@/app/services/apiEcommerce'
import { toast } from 'react-toastify'

type Menu = {
    id: string
    name: string
    order: number
    isActive: boolean
}

type MenuItem = {
    id: string
    label: string
    type: string
    url?: string
    order: number
    isActive: boolean
    icon?: string
}

export default function EditMenuPage() {
    
    const router = useRouter()
    const { id } = useParams() as { id: string }
    const api = setupAPIClientEcommerce()

    // ——— Estado do Menu ———
    const [menu, setMenu] = useState<Menu | null>(null)
    const [name, setName] = useState('')
    const [order, setOrder] = useState(0)
    const [isActive, setIsActive] = useState(true)
    const [menuError, setMenuError] = useState<string | null>(null)
    const [menuLoading, setMenuLoading] = useState(true)
    const [menuSaving, setMenuSaving] = useState(false)

    // ——— Estado dos Itens ———
    const [items, setItems] = useState<MenuItem[]>([])
    const [itemsLoading, setItemsLoading] = useState(true)
    const [itemsError, setItemsError] = useState<string | null>(null)

    // ——— Modal de Item ———
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null)

    // campos do formulário de item
    const [label, setLabel] = useState('')
    const [type, setType] = useState('INTERNAL_LINK')
    const [url, setUrl] = useState('')
    const [itemOrder, setItemOrder] = useState(0)
    const [itemActive, setItemActive] = useState(true)
    const [iconFile, setIconFile] = useState<File | null>(null)
    const [itemError, setItemError] = useState<string | null>(null)
    const [itemSaving, setItemSaving] = useState(false)

    // ——— Fetch Menu e Itens ———
    useEffect(() => {
        async function load() {
            try {
                const [{ data: m }, { data: its }] = await Promise.all([
                    api.get(`/menus/get/data?id=${id}`),
                    api.get('/menuItem/get', { params: { menu_id: id } })
                ])
                setMenu(m)
                setName(m.name)
                setOrder(m.order)
                setIsActive(m.isActive)
                setItems(its)
            } catch (err: any) {
                setMenuError('Erro ao carregar o menu.')
                setItemsError('Erro ao carregar itens.')
            } finally {
                setMenuLoading(false)
                setItemsLoading(false)
            }
        }
        load()
    }, [id]);

    // ——— Handlers Menu ———
    async function handleSaveMenu(e: FormEvent) {
        e.preventDefault()
        setMenuError(null)
        if (!name.trim()) return setMenuError('Nome obrigatório')
        if (order < 0) return setMenuError('Ordem deve ser ≥ 0')

        setMenuSaving(true)
        try {
            await api.put(`/menu/getUnique/${id}`, { name, order, isActive })
            setMenu(prev => prev && { ...prev, name, order, isActive })
            toast.success('Menu atualizado.')
        } catch(error) {
            console.log(error)
            toast.error('Falha ao salvar menu.')
            setMenuError('Falha ao salvar menu.')
        } finally {
            setMenuSaving(false)
        }
    }

    // ——— Handlers Itens ———
    function openNewItemModal() {
        setEditingItem(null)
        setLabel(''); setType('INTERNAL_LINK'); setUrl('')
        setItemOrder(0); setItemActive(true); setIconFile(null)
        setItemError(null)
        setIsModalOpen(true)
    }

    function openEditItemModal(item: MenuItem) {
        setEditingItem(item)
        setLabel(item.label); setType(item.type)
        setUrl(item.url || ''); setItemOrder(item.order)
        setItemActive(item.isActive); setIconFile(null)
        setItemError(null)
        setIsModalOpen(true)
    }

    async function handleSaveItem(e: FormEvent) {
        e.preventDefault()
        setItemError(null)
        if (!label.trim()) return setItemError('Label obrigatório')

        setItemSaving(true)
        try {
            const form = new FormData()
            form.append('label', label)
            form.append('type', type)
            form.append('url', url)
            form.append('order', String(itemOrder))
            form.append('isActive', String(itemActive))
            form.append('menu_id', id)
            if (iconFile) form.append('icon', iconFile)
            const res = editingItem
                ? await api.put(`/menuItem/getUnique/${editingItem.id}`, form, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                })
                : await api.post('/menuItem/create', form, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                })
            // atualiza a lista no front
            setItems(prev => {
                if (editingItem) {
                    return prev.map(it => it.id === editingItem.id ? res.data : it)
                }
                return [...prev, res.data]
            })
            toast.success("Item salvo.")
            setIsModalOpen(false)
        } catch (error) {
            console.log(error);
            toast.error('Erro nos itens.')
            setItemError('Falha ao salvar item.')
        } finally {
            setItemSaving(false)
        }
    }

    async function handleDeleteItem(item: MenuItem) {
        if (!confirm(`Excluir item “${item.label}”?`)) return
        try {
            await api.delete(`/menuItem/get/delete/${item.id}`)
            setItems(prev => prev.filter(it => it.id !== item.id))
            toast.success('Item excluido com sucesso.');
        } catch (error) {
            console.log('Erro ao deletar o item');
            toast.error('Erro ao deletar o item.');
        }
    }

    // ——— Render ———
    if (menuLoading) return <p>Carregando menu…</p>

    return (
        <SidebarAndHeader>
            <Section>
                <TitlePage title="EDITAR MENU" />

                {/* — Formulário do Menu — */}
                <form onSubmit={handleSaveMenu} className="mt-4 space-y-4 max-w-lg">
                    <div>
                        <label className="block text-sm font-medium">Nome</label>
                        <input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            disabled={menuSaving}
                            className="mt-1 w-full border rounded px-2 py-1"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Ordem</label>
                        <input
                            type="number" min={0}
                            value={order}
                            onChange={e => setOrder(+e.target.value)}
                            disabled={menuSaving}
                            className="mt-1 w-24 border rounded px-2 py-1"
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
                    {menuError && <p className="text-red-600">{menuError}</p>}
                    <button
                        type="submit"
                        disabled={menuSaving}
                        className="bg-indigo-600 text-white px-4 py-2 rounded disabled:opacity-50"
                    >
                        {menuSaving ? 'Salvando…' : 'Salvar Menu'}
                    </button>
                </form>

                {/* — Itens de Menu — */}
                <div className="mt-8">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold">Itens de Menu</h2>
                        <button
                            onClick={openNewItemModal}
                            className="bg-green-600 text-white px-3 py-1 rounded"
                        >
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
                                        <tr className="bg-gray-100">
                                            <th className="border px-2 py-1">Label</th>
                                            <th className="border px-2 py-1">Tipo</th>
                                            <th className="border px-2 py-1">Ordem</th>
                                            <th className="border px-2 py-1">Ativo</th>
                                            <th className="border px-2 py-1">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map(it => (
                                            <tr key={it.id}>
                                                <td className="border px-2 py-1">{it.label}</td>
                                                <td className="border px-2 py-1">{it.type}</td>
                                                <td className="border px-2 py-1">{it.order}</td>
                                                <td className="border px-2 py-1">
                                                    {it.isActive ? 'Sim' : 'Não'}
                                                </td>
                                                <td className="border px-2 py-1 space-x-2">
                                                    <button
                                                        onClick={() => openEditItemModal(it)}
                                                        className="text-blue-600 hover:underline"
                                                    >
                                                        Editar
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteItem(it)}
                                                        className="text-red-600 hover:underline"
                                                    >
                                                        Excluir
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )
                    }
                </div>

                {/* — Modal de Criar/Editar Item — */}
                {isModalOpen && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="bg-white rounded-lg p-6 w-96">
                            <h3 className="text-lg font-semibold mb-4">
                                {editingItem ? 'Editar Item' : 'Novo Item'}
                            </h3>
                            <form onSubmit={handleSaveItem} className="space-y-3">
                                <div>
                                    <label className="block text-sm">Label</label>
                                    <input
                                        value={label}
                                        onChange={e => setLabel(e.target.value)}
                                        disabled={itemSaving}
                                        className="mt-1 w-full border rounded px-2 py-1"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm">Tipo</label>
                                    <select
                                        value={type}
                                        onChange={e => setType(e.target.value)}
                                        disabled={itemSaving}
                                        className="mt-1 w-full border rounded px-2 py-1"
                                    >
                                        <option value="INTERNAL_LINK">Link Interno</option>
                                        <option value="EXTERNAL_LINK">Link Externo</option>
                                        <option value="CATEGORY">Categoria</option>
                                        <option value="PRODUCT">Produto</option>
                                        <option value="CUSTOM_PAGE">Página Customizada</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm">URL</label>
                                    <input
                                        type="text"
                                        value={url}
                                        onChange={e => setUrl(e.target.value)}
                                        disabled={itemSaving}
                                        className="mt-1 w-full border rounded px-2 py-1"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm">Ordem</label>
                                    <input
                                        type="number" min={0}
                                        value={itemOrder}
                                        onChange={e => setItemOrder(+e.target.value)}
                                        disabled={itemSaving}
                                        className="mt-1 w-24 border rounded px-2 py-1"
                                    />
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
                                    <label htmlFor="itemActive" className="ml-2">Ativo</label>
                                </div>
                                <div>
                                    <label className="block text-sm">Ícone</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={e => setIconFile(e.target.files?.[0] || null)}
                                        disabled={itemSaving}
                                        className="mt-1"
                                    />
                                </div>
                                {itemError && <p className="text-red-600">{itemError}</p>}
                                <div className="flex justify-end space-x-2 mt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        disabled={itemSaving}
                                        className="px-3 py-1 border rounded"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={itemSaving}
                                        className="bg-indigo-600 text-white px-3 py-1 rounded disabled:opacity-50"
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