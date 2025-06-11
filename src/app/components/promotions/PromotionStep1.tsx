'use client'

import { useState } from 'react'
import { Button, Checkbox, Input, Textarea, Select } from '@nextui-org/react'
import { toast } from 'react-toastify'
import { setupAPIClientEcommerce } from '@/app/services/apiEcommerce'

export default function PromotionStep1({ onNext }: { onNext: () => void }) {
    
    const api = setupAPIClientEcommerce()

    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')

    const [hasCoupon, setHasCoupon] = useState(true)
    const [multipleCoupons, setMultipleCoupons] = useState(false)
    const [reuseSameCoupon, setReuseSameCoupon] = useState(false)
    const [couponTextarea, setCouponTextarea] = useState('')

    const [perUserLimit, setPerUserLimit] = useState<number>()
    const [totalCouponCount, setTotalCouponCount] = useState<number>()

    const [active, setActive] = useState(false)
    const [cumulative, setCumulative] = useState(false)
    const [priority, setPriority] = useState(0)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name || !startDate || !endDate) {
            toast.error('Nome, início e fim são obrigatórios')
            return
        }
        try {
            const couponCodes = couponTextarea
                .split('\n')
                .map(s => s.trim())
                .filter(Boolean)

            await api.post('/api/promotions/step1', {
                name,
                description,
                startDate: new Date(startDate).toISOString(),
                endDate: new Date(endDate).toISOString(),

                hasCoupon,
                multipleCoupons,
                reuseSameCoupon,
                couponCodes,
                perUserCouponLimit: perUserLimit,
                totalCouponCount,

                active,
                cumulative,
                priority,
            })

            toast.success('Passo 1 salvo com sucesso!')
            onNext()
        } catch (err) {
            console.error(err)
            toast.error('Erro ao salvar Passo 1.')
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nome */}
            <div>
                <label className="block font-medium">Nome<span className="text-red-500">*</span></label>
                <Input
                    required
                    placeholder="Nome da promoção"
                    value={name}
                    onChange={e => setName(e.target.value)}
                />
            </div>

            {/* Descrição */}
            <div>
                <label className="block font-medium">Descrição</label>
                <Textarea
                    placeholder="Detalhes sobre a promoção"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                />
            </div>

            {/* Datas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block font-medium">Data/Hora Início<span className="text-red-500">*</span></label>
                    <input
                        required
                        type="datetime-local"
                        className="w-full border p-2 rounded"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block font-medium">Data/Hora Término<span className="text-red-500">*</span></label>
                    <input
                        required
                        type="datetime-local"
                        className="w-full border p-2 rounded"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                    />
                </div>
            </div>

            {/* Cupom */}
            <fieldset className="border p-4 rounded space-y-2">
                <legend className="font-medium">Cupom</legend>
                <Checkbox
                    isSelected={!hasCoupon}
                    onChange={(_, v) => setHasCoupon(!v)}
                >Criar sem cupom</Checkbox>
                <Checkbox
                    isSelected={multipleCoupons}
                    onChange={(_, v) => setMultipleCoupons(v)}
                    isDisabled={!hasCoupon}
                >Múltiplos cupons</Checkbox>
                <Checkbox
                    isSelected={reuseSameCoupon}
                    onChange={(_, v) => setReuseSameCoupon(v)}
                    isDisabled={!hasCoupon}
                >Permite reutilizar o mesmo cupom</Checkbox>

                {hasCoupon && (
                    <>
                        <label className="font-medium">Lista de Cupons (uma linha por cupom)</label>
                        <Textarea
                            minRows={3}
                            placeholder="CUPOM1\nCUPOM2\n..."
                            value={couponTextarea}
                            onChange={e => setCouponTextarea(e.target.value)}
                        />
                    </>
                )}
            </fieldset>

            {/* Quantidades de Cupom */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block font-medium">Quantidade por Cliente</label>
                    <Input
                        type="number"
                        placeholder="Ex: 1"
                        value={perUserLimit ?? ''}
                        onChange={e => setPerUserLimit(Number(e.target.value) || undefined)}
                    />
                </div>
                <div>
                    <label className="block font-medium">Quantidade Total de Cupons</label>
                    <Input
                        type="number"
                        placeholder="Ex: 100"
                        value={totalCouponCount ?? ''}
                        onChange={e => setTotalCouponCount(Number(e.target.value) || undefined)}
                    />
                </div>
            </div>

            {/* Ativar e Acumular */}
            <div className="flex flex-wrap gap-6">
                <div>
                    <label className="block font-medium">Ativar Promoção?</label>
                    <Select
                        selectedKeys={new Set([active ? 'yes' : 'no'])}
                        onSelectionChange={sel => setActive(sel.has('yes'))}
                    >
                        <Select.Item key="yes">Sim</Select.Item>
                        <Select.Item key="no">Não</Select.Item>
                    </Select>
                </div>
                <div>
                    <label className="block font-medium">Promoção Acumulativa?</label>
                    <Select
                        selectedKeys={new Set([cumulative ? 'yes' : 'no'])}
                        onSelectionChange={sel => setCumulative(sel.has('yes'))}
                    >
                        <Select.Item key="yes">Sim</Select.Item>
                        <Select.Item key="no">Não</Select.Item>
                    </Select>
                </div>
                <div>
                    <label className="block font-medium">Ordem de Prioridade</label>
                    <Input
                        type="number"
                        placeholder="1 = maior prioridade"
                        value={priority}
                        onChange={e => setPriority(Number(e.target.value))}
                    />
                </div>
            </div>

            {/* Botão Próximo */}
            <div className="text-right">
                <Button type="submit">Próximo</Button>
            </div>
        </form>
    )
}