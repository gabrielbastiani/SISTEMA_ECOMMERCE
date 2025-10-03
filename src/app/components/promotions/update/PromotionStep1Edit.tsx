'use client'

import { Tooltip } from '@nextui-org/react'
import React, { FormEvent, useState } from 'react'
import { toast } from 'react-toastify'

export interface Step1Values {
    name: string
    description: string
    startDate?: Date
    endDate?: Date
    hasCoupon: boolean
    multipleCoupons: boolean
    reuseSameCoupon: boolean
    coupons: string[]
    perUserCouponLimit?: number
    totalCouponCount?: number
    status: 'Disponivel' | 'Indisponivel' | 'Programado' | ''
    cumulative: boolean
    priority: number
}

interface Props {
    initial: Step1Values
    onSave: (values: Step1Values) => Promise<void>
    onNext: () => void
}

export default function PromotionStep1Edit({ initial, onSave, onNext }: Props) {

    const [local, setLocal] = useState<Step1Values>({ ...initial })
    const [newCoupon, setNewCoupon] = useState('')

    const toInputValue = (d?: Date) => {
        if (!d) return ''
        // compensa o offset: cria um Date deslocado para UTC
        const tzOffsetMs = d.getTimezoneOffset() * 60000
        const localISO = new Date(d.getTime() - tzOffsetMs).toISOString()
        return localISO.slice(0, 16)
    }

    const addCoupon = () => {
        const c = newCoupon.trim()
        if (!c) {
            setNewCoupon('')
            return
        }
        if (local.coupons.includes(c)) {
            setNewCoupon('')
            toast.info('Código já adicionado.')
            return
        }
        if (!local.multipleCoupons && local.coupons.length >= 1) {
            toast.warn('Ative "Múltiplos cupons" para adicionar mais de um código.')
            setNewCoupon('')
            return
        }
        setLocal(l => ({ ...l, coupons: [...l.coupons, c] }))
        setNewCoupon('')
    }

    const removeCoupon = (c: string) => {
        setLocal(l => ({ ...l, coupons: l.coupons.filter(x => x !== c) }))
    }

    // validação específica: se usar cupom, deve existir pelo menos 1
    function validateStep1(): boolean {
        if (local.hasCoupon) {
            if (!Array.isArray(local.coupons) || local.coupons.length === 0) {
                toast.error('Quando "Usar cupom?" estiver selecionado como SIM, é obrigatório adicionar pelo menos 1 código de cupom.')
                return false
            }
        }
        // regra extra de consistência: se múltiplos cupons desativado, garante no máximo 1 (corrige automaticamente)
        if (!local.multipleCoupons && local.coupons.length > 1) {
            // reduz para o primeiro e informa o usuário
            setLocal(l => ({ ...l, coupons: l.coupons.slice(0, 1) }))
            toast.info('A opção "Múltiplos cupons" está desativada — mantendo apenas o primeiro cupom.')
        }
        return true
    }

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault()
        // valida antes de prosseguir para o próximo passo
        if (!validateStep1()) return
        onNext()
    }

    const handleSave = async () => {
        // valida antes de salvar
        if (!validateStep1()) return
        try {
            await onSave(local)
        } catch (err: any) {
            console.error('Erro ao salvar passo 1:', err)
            toast.error('Falha ao salvar Passo 1.')
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-xl font-semibold">Passo 1: Defina a Promoção</h2>

            {/* Nome */}
            <div>
                <Tooltip content="De um nome coerente para sua promoção." placement="top-start" className="bg-white text-red-500 border border-gray-200 p-2">
                    <input
                        placeholder="Nome da promoção"
                        type="text"
                        required
                        value={local.name}
                        onChange={e => setLocal(l => ({ ...l, name: e.target.value }))}
                        className="w-full border p-2 rounded text-black"
                    />
                </Tooltip>
            </div>

            {/* Descrição */}
            <div>
                <Tooltip content="Faça uma descrição para que o cliente da loja, possa entender do que se trata a promoção, como regras da promoção etc..." placement="top-start" className="bg-white text-red-500 border border-gray-200 p-2">
                    <textarea
                        required
                        value={local.description}
                        onChange={e => setLocal(l => ({ ...l, description: e.target.value }))}
                        className="w-full border p-2 rounded h-24 text-black"
                    />
                </Tooltip>
            </div>

            {/* Datas */}
            <div className="grid md:grid-cols-2 gap-4">
                <div>
                    <label className="block mb-1">Data/Hora Início</label>
                    <Tooltip
                        content="Digite a data e horario de inicio para essa promoção"
                        placement="top-start"
                        className="bg-white text-red-500 border border-gray-200 p-2"
                    >
                        <input
                            type="datetime-local"
                            required
                            value={toInputValue(local.startDate)}
                            onChange={e => setLocal(l => ({ ...l, startDate: new Date(e.target.value) }))}
                            className="w-full border p-2 rounded text-black"
                        />
                    </Tooltip>
                </div>
                <div>
                    <label className="block mb-1">Data/Hora Término</label>
                    <Tooltip
                        content="Digite a data e horario de término para essa promoção"
                        placement="top-start"
                        className="bg-white text-red-500 border border-gray-200 p-2"
                    >
                        <input
                            type="datetime-local"
                            required
                            value={toInputValue(local.endDate)}
                            onChange={e => setLocal(l => ({ ...l, endDate: new Date(e.target.value) }))}
                            className="w-full border p-2 rounded text-black"
                        />
                    </Tooltip>
                </div>
            </div>

            {/* Cupom */}
            <div>
                <span className="block mb-1">Usar cupom?</span>
                <label className="inline-flex items-center mr-4">
                    <input
                        type="radio"
                        name="hasCoupon"
                        checked={local.hasCoupon}
                        onChange={() => setLocal(l => ({ ...l, hasCoupon: true }))}
                        className="mr-1"
                    />
                    Sim
                </label>
                <label className="inline-flex items-center">
                    <input
                        type="radio"
                        name="hasCoupon"
                        checked={!local.hasCoupon}
                        onChange={() =>
                            setLocal(l => ({
                                ...l,
                                hasCoupon: false,
                                multipleCoupons: false,
                                reuseSameCoupon: false,
                                coupons: [],
                                perUserCouponLimit: undefined,
                                totalCouponCount: undefined
                            }))
                        }
                        className="mr-1"
                    />
                    Não
                </label>

                {/* Texto de ajuda / estado quando o usuário marcou "Sim" e não há cupons */}
                {local.hasCoupon && (!Array.isArray(local.coupons) || local.coupons.length === 0) && (
                    <div className="mt-2 text-sm text-red-600">
                        Quando "Usar cupom?" estiver marcado como <strong>Sim</strong>, é obrigatório adicionar ao menos <strong>1 código de cupom</strong>.
                    </div>
                )}
            </div>

            {local.hasCoupon && (
                <>
                    <div className="flex gap-6 mb-4">
                        <Tooltip
                            content="Selecione essa opção, caso sua promoção poderá usar diversos codigos diferentes de cupons."
                            placement="top-start"
                            className="bg-white text-red-500 border border-gray-200 p-2"
                        >
                            <label className="inline-flex items-center">
                                <input
                                    type="checkbox"
                                    checked={local.multipleCoupons}
                                    onChange={() => setLocal(l => {
                                        const newMultiple = !l.multipleCoupons
                                        if (!newMultiple && l.coupons.length > 1) {
                                            toast.info('Múltiplos cupons desativado — mantendo apenas o primeiro cupom.')
                                            return { ...l, multipleCoupons: false, coupons: l.coupons.slice(0, 1) }
                                        }
                                        return { ...l, multipleCoupons: newMultiple }
                                    })}
                                    className="mr-1"
                                />
                                Múltiplos cupons
                            </label>
                        </Tooltip>
                        {/* Comentado: reuseSameCoupon por enquanto se manteve comentado no original */}
                    </div>

                    <div className="flex gap-2 mb-4">
                        <input
                            type="text"
                            placeholder="Novo cupom"
                            value={newCoupon}
                            onChange={e => setNewCoupon(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter') {
                                    e.preventDefault()
                                    addCoupon()
                                }
                            }}
                            className="flex-1 border p-2 rounded text-black"
                        />
                        <button
                            type="button"
                            onClick={addCoupon}
                            disabled={!newCoupon.trim()}
                            className="px-4 py-2 bg-violet-600 text-white rounded disabled:opacity-50"
                        >
                            Adicionar
                        </button>
                    </div>

                    {local.coupons.length > 0 ? (
                        <div className="flex flex-wrap gap-2 mb-4">
                            {local.coupons.map(c => (
                                <div key={c} className="flex items-center bg-gray-200 px-3 py-1 rounded-full">
                                    <span className="mr-2 text-black">{c}</span>
                                    <button type="button" onClick={() => removeCoupon(c)} className="text-red-600 font-bold">
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 mb-4">Nenhum cupom adicionado.</p>
                    )}

                    <div className="grid md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <Tooltip
                                content="Informe a quantidade vezes que um cupom poderá ser utlizado por de cliente. (Preenchimento Opcional)"
                                placement="top-start"
                                className="bg-white text-red-500 border border-gray-200 p-2"
                            >
                                <input
                                    type="number"
                                    value={local.perUserCouponLimit ?? ''}
                                    onChange={e =>
                                        setLocal(l => ({
                                            ...l,
                                            perUserCouponLimit: e.target.value === '' ? undefined : Number(e.target.value)
                                        }))
                                    }
                                    className="w-full border p-2 rounded text-black"
                                />
                            </Tooltip>
                        </div>
                        <div>
                            <Tooltip
                                content="Informe a quantidade total de cupons que serão usados na Promoção. (Preenchimento Opcional)"
                                placement="top-start"
                                className="bg-white text-red-500 border border-gray-200 p-2"
                            >
                                <input
                                    type="number"
                                    value={local.totalCouponCount ?? ''}
                                    onChange={e =>
                                        setLocal(l => ({
                                            ...l,
                                            totalCouponCount: e.target.value === '' ? undefined : Number(e.target.value)
                                        }))
                                    }
                                    className="w-full border p-2 rounded text-black"
                                />
                            </Tooltip>
                        </div>
                    </div>
                </>
            )}

            {/* Status / Acumulativa / Prioridade */}
            <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div>
                    <label className="block mb-1">Status Promoção</label>
                    <select
                        className="w-full border p-2 rounded text-black"
                        value={local.status}
                        onChange={e => setLocal(l => ({ ...l, status: e.target.value as Step1Values['status'] }))}
                        required
                    >
                        <option value="">Selecione o status</option>
                        <option value="Disponivel">Disponível</option>
                        <option value="Indisponivel">Indisponível</option>
                        <option value="Programado">Programado</option>
                    </select>
                </div>
                <div>
                    <label className="block mb-1">Acumulativa?</label>
                    <select
                        className="w-full border p-2 rounded text-black"
                        value={local.cumulative ? 'yes' : 'no'}
                        onChange={e => setLocal(l => ({ ...l, cumulative: e.target.value === 'yes' }))}
                    >
                        <option value="yes">Sim</option>
                        <option value="no">Não</option>
                    </select>
                </div>
                <div>
                    <label className="block mb-1">Ordem de aparecimento</label>
                    <Tooltip
                        content="Defina uma ordem de prioridade para a promoção; 1 sendo a maior prioridade."
                        placement="top-start"
                        className="bg-white text-red-500 border border-gray-200 p-2"
                    >
                        <input
                            type="number"
                            value={local.priority}
                            onChange={e => setLocal(l => ({ ...l, priority: Number(e.target.value) }))}
                            className="w-full border p-2 rounded text-black"
                        />
                    </Tooltip>
                </div>
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-2">
                <button type="button" onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded">
                    Salvar Passo 1
                </button>
                <button type="submit" className="px-4 py-2 bg-orange-600 text-white rounded">
                    Próximo
                </button>
            </div>
        </form>
    )
}