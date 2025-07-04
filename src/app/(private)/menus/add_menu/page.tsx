'use client'

import { FormEvent, useState } from 'react'
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

    // estado de feedback
    const [isSubmitting, setIsSubmitting] = useState(false)

    async function handleSubmit(e: FormEvent) {
        e.preventDefault()

        // validações simples
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
            await api.post('/menu/create', { name, order, isActive })
            toast.success('Menu cadastrado com sucesso.')
            router.push('/menus')
        } catch (err: any) {
            console.error(err)
            toast.error('Erro ao criar o menu.')
            console.log(err?.response?.data?.message || 'Erro ao criar o menu.');
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
                            content="Nome do menu (ex.: Header Menu, Footer Menu)"
                            placement="top-start"
                            className="bg-white text-red-500 border border-gray-200 p-2"
                        >
                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="mt-1 block w-full rounded border-gray-300 shadow-sm text-black p-2"
                                placeholder="Ex.: Header Menu"
                                disabled={isSubmitting}
                            />
                        </Tooltip>
                    </div>

                    {/* Ordem */}
                    <div>
                        <Tooltip
                            content="Caso queira ter vários menus e precise de ordenação"
                            placement="top-start"
                            className="bg-white text-red-500 border border-gray-200 p-2"
                        >
                            <input
                                id="order"
                                type="number"
                                min={0}
                                value={order}
                                onChange={e => setOrder(Number(e.target.value))}
                                className="mt-1 block w-full rounded border-gray-300 shadow-sm text-black p-2"
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
                            className="h-4 w-4 rounded border-gray-300 focus:ring-orange-500"
                            disabled={isSubmitting}
                        />
                        <label htmlFor="isActive" className="ml-2 block text-sm">
                            Ativo
                        </label>
                    </div>

                    {/* Botões */}
                    <div className="flex space-x-4">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex justify-center rounded-md border border-transparent
                         bg-green-600 py-2 px-4 text-sm font-medium text-white shadow-sm
                         hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500
                         focus:ring-offset-2 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Salvando...' : 'Salvar'}
                        </button>
                    </div>
                </form>
            </Section>
        </SidebarAndHeader>
    )
}