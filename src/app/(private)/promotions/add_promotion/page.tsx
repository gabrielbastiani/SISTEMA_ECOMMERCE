'use client'

import { useState } from 'react'
import { SidebarAndHeader } from '@/app/components/sidebarAndHeader'
import { Section } from '@/app/components/section'
import { TitlePage } from '@/app/components/section/titlePage'
import { setupAPIClientEcommerce } from '@/app/services/apiEcommerce'
import {
    Input,
    Textarea,
    Checkbox,
    Button,
    Tooltip
} from '@nextui-org/react'
import { InformationCircleIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-toastify'

type DiscountType = 'PERCENTAGE' | 'FIXED' | 'BOGO' | 'FREE_SHIPPING'
type PromotionStatus = 'SCHEDULED' | 'ACTIVE' | 'EXPIRED' | 'ARCHIVED'

interface PromotionForm {
    code?: string
    name: string
    description?: string
    discountType: DiscountType
    discountValue: number
    maxDiscountAmount?: number
    // agora armazenamos o valor vindo de datetime-local: e.g. "2025-05-09T14:30"
    startDate: string
    endDate: string
    usageLimit?: number
    userUsageLimit: number
    minOrderAmount?: number
    status: PromotionStatus
    stackable: boolean
}

const initialForm: PromotionForm = {
    code: '',
    name: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: 0,
    maxDiscountAmount: undefined,
    startDate: '',
    endDate: '',
    usageLimit: undefined,
    userUsageLimit: 1,
    minOrderAmount: undefined,
    status: 'SCHEDULED',
    stackable: false
}

export default function AddPromotion() {
    const [form, setForm] = useState<PromotionForm>(initialForm)
    const [loading, setLoading] = useState(false)
    const api = setupAPIClientEcommerce()

    const handleChange = <K extends keyof PromotionForm>(key: K, value: PromotionForm[K]) => {
        setForm(prev => ({ ...prev, [key]: value }))
    }

    // Converte "YYYY-MM-DDThh:mm" + fuso local para "YYYY-MM-DD hh:mm:00±HH"
    function toOffsetDate(dtLocal: string) {
        const [date, time] = dtLocal.split('T')
        const offsetMin = new Date().getTimezoneOffset()
        const offsetH = -offsetMin / 60
        const sign = offsetH >= 0 ? '-' : '+'
        const hh = String(Math.abs(offsetH)).padStart(2, '0')
        return `${date} ${time}:00${sign}${hh}`
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.name || !form.startDate || !form.endDate) {
            toast.error('Preencha nome, data/hora de início e fim.')
            return
        }
        setLoading(true)
        try {
            const payload = {
                ...form,
                startDate: new Date(form.startDate).toISOString(),
                endDate: new Date(form.endDate).toISOString(),
            };
            await api.post('/promotions', payload)
            toast.success('Promoção cadastrada!')
            setForm(initialForm)
        } catch (err) {
            console.error(err)
            toast.error('Falha ao cadastrar promoção.')
        } finally {
            setLoading(false)
        }
    }

    const inputClass = "w-full border rounded p-2 bg-white text-black"

    return (
        <SidebarAndHeader>
            <Section>
                <TitlePage title="CADASTRAR PROMOÇÃO" />

                <form onSubmit={handleSubmit} className="space-y-8 p-6 rounded-lg shadow">

                    {/* IDENTIFICAÇÃO */}
                    <div>
                        <h2 className="text-xl font-semibold mb-4">Identificação</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <div className="flex items-center mb-1">
                                    <label className="text-sm font-medium mr-1">Código<br />(opcional)</label>
                                    <Tooltip content={
                                        <div className="text-sm text-red-500 bg-white p-4">
                                            Código único para ativar no checkout.<br />
                                            Se vazio, é gerado automaticamente.
                                        </div>
                                    }>
                                        <InformationCircleIcon className="w-4 h-4 text-blue-400" />
                                    </Tooltip>
                                </div>
                                <Input
                                    className="bg-white text-black"
                                    placeholder="EX: BLACKFRIDAY"
                                    value={form.code}
                                    onValueChange={v => handleChange('code', v)}
                                />
                            </div>
                            <div>
                                <div className="flex items-center mb-1">
                                    <label className="text-sm font-medium mr-1">Nome<br />da Promoção</label>
                                    <Tooltip content={
                                        <div className="text-sm text-red-500 bg-white p-4">
                                            Título exibido em banners e lista de promoções.<br />
                                            Ex: Black Friday 2025.
                                        </div>
                                    }>
                                        <InformationCircleIcon className="w-4 h-4 text-blue-400" />
                                    </Tooltip>
                                </div>
                                <Input
                                    className="bg-white text-black"
                                    required
                                    placeholder="ex: Black Friday 2025"
                                    value={form.name}
                                    onValueChange={v => handleChange('name', v)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* DESCRIÇÃO */}
                    <div>
                        <h2 className="text-xl font-semibold mb-2">Descrição (opcional)</h2>
                        <Tooltip content={
                            <div className="text-sm text-red-500 bg-white p-4">
                                Texto que descreve detalhes e regras.<br />
                                Destaque benefícios.
                            </div>
                        }>
                            <InformationCircleIcon className="w-4 h-4 text-blue-400 mb-1" />
                        </Tooltip>
                        <Textarea
                            className="bg-white text-black h-36"
                            placeholder="Descreva brevemente"
                            value={form.description}
                            onValueChange={v => handleChange('description', v)}
                        />
                    </div>

                    {/* DETALHES DO DESCONTO */}
                    <div>
                        <h2 className="text-xl font-semibold mb-4">Detalhes do Desconto</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                            {/* Tipo */}
                            <div>
                                <div className="flex items-center mb-1">
                                    <label className="text-sm font-medium mr-1">Tipo de Desconto</label>
                                    <Tooltip content={
                                        <div className="text-sm text-red-500 bg-white p-4">
                                            <ul className="list-disc list-inside">
                                                <li><b>PERCENTAGE</b>: percentual (%)</li>
                                                <li><b>FIXED</b>: valor fixo (R$)</li>
                                                <li><b>BOGO</b>: “Compre 1 e ganhe 1”</li>
                                                <li><b>FREE_SHIPPING</b>: frete grátis</li>
                                            </ul>
                                        </div>
                                    }>
                                        <InformationCircleIcon className="w-4 h-4 text-blue-400" />
                                    </Tooltip>
                                </div>
                                <select
                                    className={inputClass}
                                    value={form.discountType}
                                    onChange={e => handleChange('discountType', e.target.value as DiscountType)}
                                >
                                    <option value="PERCENTAGE">Percentual (%)</option>
                                    <option value="FIXED">Valor Fixo (R$)</option>
                                    <option value="BOGO">Compre 1 e ganhe 1</option>
                                    <option value="FREE_SHIPPING">Frete grátis</option>
                                </select>
                            </div>

                            {/* Valor e Máximo */}
                            <div className="space-y-4">
                                <div>
                                    <div className="flex items-center mb-1">
                                        <label className="text-sm font-medium mr-1">Valor do Desconto</label>
                                        <Tooltip content={
                                            <div className="text-sm text-red-500 bg-white p-4">
                                                Quanto será descontado:<br />
                                                – % ou R$ conforme tipo.
                                            </div>
                                        }>
                                            <InformationCircleIcon className="w-4 h-4 text-blue-400" />
                                        </Tooltip>
                                    </div>
                                    <Input
                                        className="bg-white text-black"
                                        required
                                        type="number"
                                        placeholder="ex: 10"
                                        value={form.discountValue.toString()}
                                        onChange={e => handleChange('discountValue', Number(e.target.value))}
                                    />
                                </div>
                                <div>
                                    <div className="flex items-center mb-1">
                                        <label className="text-sm font-medium mr-1">Máx. Desconto</label>
                                        <Tooltip content={
                                            <div className="text-sm text-red-500 bg-white p-4">
                                                Valor máximo a ser descontado.<br />
                                                Útil para % altos.
                                            </div>
                                        }>
                                            <InformationCircleIcon className="w-4 h-4 text-blue-400" />
                                        </Tooltip>
                                    </div>
                                    <Input
                                        className="bg-white text-black"
                                        type="number"
                                        placeholder="ex: 200"
                                        value={form.maxDiscountAmount !== undefined ? form.maxDiscountAmount.toString() : ''}
                                        onChange={e =>
                                            handleChange(
                                                'maxDiscountAmount',
                                                e.target.value ? Number(e.target.value) : undefined
                                            )
                                        }
                                    />
                                </div>
                            </div>

                            {/* Período completo */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <div className="flex items-center mb-1">
                                        <label className="text-sm font-medium mr-1">Início</label>
                                        <Tooltip content={
                                            <div className="text-sm text-red-500 bg-white p-4">
                                                Data e hora de início da promoção.
                                            </div>
                                        }>
                                            <InformationCircleIcon className="w-4 h-4 text-blue-400" />
                                        </Tooltip>
                                    </div>
                                    <input
                                        required
                                        type="datetime-local"
                                        className={inputClass}
                                        value={form.startDate}
                                        onChange={e => handleChange('startDate', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <div className="flex items-center mb-1">
                                        <label className="text-sm font-medium mr-1">Fim</label>
                                        <Tooltip content={
                                            <div className="text-sm text-red-500 bg-white p-4">
                                                Data e hora de término da promoção.
                                            </div>
                                        }>
                                            <InformationCircleIcon className="w-4 h-4 text-blue-400" />
                                        </Tooltip>
                                    </div>
                                    <input
                                        required
                                        type="datetime-local"
                                        className={inputClass}
                                        value={form.endDate}
                                        onChange={e => handleChange('endDate', e.target.value)}
                                    />
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* LIMITES E REGRAS */}
                    <div>
                        <h2 className="text-xl font-semibold mb-4">Limites e Regras</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <div className="flex items-center mb-1">
                                    <label className="text-sm font-medium mr-1">Limite Total</label>
                                    <Tooltip content={
                                        <div className="text-sm text-red-500 bg-white p-4">
                                            Máximo de usos desta promoção no total.
                                        </div>
                                    }>
                                        <InformationCircleIcon className="w-4 h-4 text-blue-400" />
                                    </Tooltip>
                                </div>
                                <Input
                                    className="bg-white text-black"
                                    type="number"
                                    placeholder="ex: 100"
                                    value={form.usageLimit !== undefined ? form.usageLimit.toString() : ''}
                                    onChange={e =>
                                        handleChange(
                                            'usageLimit',
                                            e.target.value ? Number(e.target.value) : undefined
                                        )
                                    }
                                />
                            </div>
                            <div>
                                <div className="flex items-center mb-1">
                                    <label className="text-sm font-medium mr-1">Limite por Usuário</label>
                                    <Tooltip content={
                                        <div className="text-sm text-red-500 bg-white p-4">
                                            Quantas vezes cada cliente pode usar.
                                        </div>
                                    }>
                                        <InformationCircleIcon className="w-4 h-4 text-blue-400" />
                                    </Tooltip>
                                </div>
                                <Input
                                    className="bg-white text-black"
                                    required
                                    type="number"
                                    placeholder="ex: 1"
                                    value={form.userUsageLimit.toString()}
                                    onChange={e => handleChange('userUsageLimit', Number(e.target.value))}
                                />
                            </div>
                            <div>
                                <div className="flex items-center mb-1">
                                    <label className="text-sm font-medium mr-1">Min. Compra</label>
                                    <Tooltip content={
                                        <div className="text-sm text-red-500 bg-white p-4">
                                            Valor mínimo para aplicar desconto.
                                        </div>
                                    }>
                                        <InformationCircleIcon className="w-4 h-4 text-blue-400" />
                                    </Tooltip>
                                </div>
                                <Input
                                    className="bg-white text-black"
                                    type="number"
                                    placeholder="ex: 50"
                                    value={form.minOrderAmount !== undefined ? form.minOrderAmount.toString() : ''}
                                    onChange={e =>
                                        handleChange(
                                            'minOrderAmount',
                                            e.target.value ? Number(e.target.value) : undefined
                                        )
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    {/* STATUS & ACUMULÁVEL */}
                    <div className="flex flex-wrap items-center justify-between gap-6">
                        <div className="w-1/3">
                            <div className="flex items-center mb-1">
                                <label className="text-sm font-medium mr-1">Status</label>
                                <Tooltip content={
                                    <div className="text-sm text-red-500 bg-white p-4">
                                        Estado atual da promoção.
                                    </div>
                                }>
                                    <InformationCircleIcon className="w-4 h-4 text-blue-400" />
                                </Tooltip>
                            </div>
                            <select
                                className={inputClass}
                                value={form.status}
                                onChange={e => handleChange('status', e.target.value as PromotionStatus)}
                            >
                                <option value="SCHEDULED">Agendada</option>
                                <option value="ACTIVE">Ativa</option>
                                <option value="EXPIRED">Expirada</option>
                                <option value="ARCHIVED">Arquivada</option>
                            </select>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                isSelected={form.stackable}
                                onChange={e => handleChange('stackable', e.target.checked)}
                            />
                            <label className="text-sm">Acumulável</label>
                            <Tooltip content={
                                <div className="text-sm text-red-500 bg-white p-4">
                                    Permite combinar com outras promoções.
                                </div>
                            }>
                                <InformationCircleIcon className="w-4 h-4 text-blue-400" />
                            </Tooltip>
                        </div>
                    </div>

                    {/* SUBMIT */}
                    <div className="text-right">
                        <Button
                            type="submit"
                            isLoading={loading}
                            className="bg-green-600 text-white"
                        >
                            Cadastrar Promoção
                        </Button>
                    </div>

                </form>
            </Section>
        </SidebarAndHeader>
    )
}