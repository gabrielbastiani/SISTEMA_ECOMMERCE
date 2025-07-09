'use client'

import { FormEvent, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Section } from '@/app/components/section'
import { TitlePage } from '@/app/components/section/titlePage'
import { SidebarAndHeader } from '@/app/components/sidebarAndHeader'
import { setupAPIClientEcommerce } from '@/app/services/apiEcommerce'
import { toast } from 'react-toastify'
import { Tooltip } from '@nextui-org/react'

export default function AddMenuPage() {

    const router = useRouter()
    const api = setupAPIClientEcommerce()

    // estado do formulário
    const [name, setName] = useState('')
    const [order, setOrder] = useState(0)
    const [isActive, setIsActive] = useState(true)
    // ícone
    const [iconFile, setIconFile] = useState<File | null>(null)
    const [iconPreview, setIconPreview] = useState<string | null>(null)

    // estado de envio
    const [isSubmitting, setIsSubmitting] = useState(false)

    // gerar preview sempre que trocar o arquivo
    useEffect(() => {
        if (!iconFile) {
            setIconPreview(null)
            return
        }
        const url = URL.createObjectURL(iconFile)
        setIconPreview(url)
        return () => URL.revokeObjectURL(url)
    }, [iconFile])

    async function handleSubmit(e: FormEvent) {
        e.preventDefault()

        // validações
        if (!name.trim()) {
            toast.error('O nome do menu é obrigatório.')
            return
        }
        if (order < 0) {
            toast.error('A ordem deve ser um número maior ou igual a zero.')
            return
        }

        setIsSubmitting(true)
        try {
            const form = new FormData()
            form.append('name', name)
            form.append('order', String(order))
            form.append('isActive', String(isActive))
            form.append('file', iconFile || "")

            await api.post('/menu/create', form)

            toast.success('Menu cadastrado com sucesso.')
            router.push('/menus')

        } catch (err: any) {
            console.error(err)
            toast.error('Erro ao criar o menu.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <SidebarAndHeader>
            <Section>
                <TitlePage title="ADICIONAR MENU" />

                <form onSubmit={handleSubmit} className="mt-6 max-w-lg space-y-6">
                    {/* Nome */}
                    <div>
                        <Tooltip
                            content="Ex.: Header Menu, Footer Menu"
                            placement="top-start"
                            className="bg-white text-red-500 border border-gray-200 p-2"
                        >
                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="block w-full rounded border-gray-300 shadow-sm p-2 text-black"
                                placeholder="Ex.: Header Menu"
                                disabled={isSubmitting}
                            />
                        </Tooltip>
                    </div>

                    {/* Ordem */}
                    <div>
                        <Tooltip
                            content="Define a posição deste menu"
                            placement="top-start"
                            className="bg-white text-red-500 border border-gray-200 p-2"
                        >
                            <input
                                id="order"
                                type="number"
                                min={0}
                                value={order}
                                onChange={e => setOrder(Number(e.target.value))}
                                className="block w-full rounded border-gray-300 shadow-sm p-2 text-black"
                                disabled={isSubmitting}
                            />
                        </Tooltip>
                    </div>

                    {/* Ativo */}
                    <div className="flex items-center">
                        <input
                            id="isActive"
                            type="checkbox"
                            checked={isActive}
                            onChange={e => setIsActive(e.target.checked)}
                            disabled={isSubmitting}
                            className="h-4 w-4 rounded border-gray-300 focus:ring-orange-500"
                        />
                        <label htmlFor="isActive" className="ml-2 text-sm">
                            Ativo
                        </label>
                    </div>

                    {/* Ícone */}
                    <div>
                        <label htmlFor="icon" className="block text-sm font-medium">
                            Ícone do Menu
                        </label>
                        <input
                            id="icon"
                            type="file"
                            accept="image/*"
                            onChange={e => setIconFile(e.target.files?.[0] || null)}
                            disabled={isSubmitting}
                            className="mt-1 block w-full text-sm text-gray-600"
                        />
                        {iconPreview && (
                            <div className="mt-2">
                                <p className="text-xs text-gray-500">Preview:</p>
                                <img
                                    src={iconPreview}
                                    alt="Preview do ícone"
                                    className="h-20 w-20 object-cover rounded border"
                                />
                            </div>
                        )}
                    </div>

                    {/* Botões */}
                    <div className="flex space-x-4">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex items-center justify-center rounded bg-green-600
                         py-2 px-4 text-sm font-medium text-white shadow hover:bg-green-700
                         focus:outline-none focus:ring-2 focus:ring-green-500
                         disabled:opacity-50"
                        >
                            {isSubmitting ? 'Salvando...' : 'Salvar'}
                        </button>
                        <button
                            type="button"
                            onClick={() => router.push('/menus')}
                            disabled={isSubmitting}
                            className="inline-flex items-center justify-center rounded border border-gray-300
                         bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow
                         hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500
                         disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            </Section>
        </SidebarAndHeader>
    )
}