'use client'

import React, {
    FormEvent,
    useState,
    Dispatch,
    SetStateAction
} from 'react'
import { Input, Checkbox, Button, Tooltip } from '@nextui-org/react'
import { PromotionWizardDto } from 'Types/types'

export interface Step1Values {
    name: string
    description: string
    startDate: string    // ISO sem fuso
    endDate: string
    hasCoupon: boolean
    multipleCoupons: boolean
    reuseSameCoupon: boolean
    perUserCouponLimit?: number
    totalCouponCount?: number
    coupons: string[]
    active: boolean
    cumulative: boolean
    priority: number
}

interface Props {
    onNext: () => void
    onSaveStep1: (values: Step1Values) => Promise<void>
    initialValues: Step1Values
}

export default function PromotionStep1Edit({
    onNext,
    onSaveStep1,
    initialValues
}: Props) {
    // Estado local inicializado de initialValues
    const [name, setName] = useState(initialValues.name)
    const [description, setDescription] = useState(initialValues.description)
    const [startDate, setStartDate] = useState(initialValues.startDate)
    const [endDate, setEndDate] = useState(initialValues.endDate)
    const [hasCoupon, setHasCoupon] = useState(initialValues.hasCoupon)
    const [multipleCoupons, setMultipleCoupons] = useState(initialValues.multipleCoupons)
    const [reuseSameCoupon, setReuseSameCoupon] = useState(initialValues.reuseSameCoupon)
    const [perUserCouponLimit, setPerUserCouponLimit] = useState<string>(
        initialValues.perUserCouponLimit != null ? String(initialValues.perUserCouponLimit) : ''
    )
    const [totalCouponCount, setTotalCouponCount] = useState<string>(
        initialValues.totalCouponCount != null ? String(initialValues.totalCouponCount) : ''
    )
    const [priority, setPriority] = useState<string>(String(initialValues.priority))
    const [couponsArray, setCouponsArray] = useState<string[]>(initialValues.coupons)
    const [newCoupon, setNewCoupon] = useState('')

    const addCoupon = () => {
        const code = newCoupon.trim()
        if (!code || couponsArray.includes(code)) {
            setNewCoupon('')
            return
        }
        setCouponsArray(prev => [...prev, code])
        setNewCoupon('')
    }
    const removeCoupon = (code: string) =>
        setCouponsArray(prev => prev.filter(c => c !== code))
    const handleCouponKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            addCoupon()
        }
    }

    const handleSave = async () => {
        const vals: Step1Values = {
            name,
            description,
            startDate,
            endDate,
            hasCoupon,
            multipleCoupons,
            reuseSameCoupon,
            perUserCouponLimit: perUserCouponLimit ? Number(perUserCouponLimit) : undefined,
            totalCouponCount: totalCouponCount ? Number(totalCouponCount) : undefined,
            coupons: couponsArray,
            active: initialValues.active,
            cumulative: initialValues.cumulative,
            priority: Number(priority)
        }
        await onSaveStep1(vals)
    }

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault()
        onNext()
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-xl font-semibold">Passo 1: Defina a Promoção</h2>

            {/* Nome */}
            <Tooltip content="Nome da promoção" placement="top-start">
                <Input
                    placeholder="Nome da promoção"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    classNames={{ input: 'text-black bg-white border rounded-md' }}
                />
            </Tooltip>

            {/* Descrição */}
            <Tooltip content="Descrição da promoção" placement="top-start">
                <textarea
                    placeholder="Descrição..."
                    required
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full p-3 border-2 rounded-md h-32 text-black bg-white"
                />
            </Tooltip>

            {/* Datas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block mb-1">Data/Hora Início*</label>
                    <Tooltip content="Data de início" placement="top-start">
                        <input
                            required
                            type="datetime-local"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            className="w-full p-2 border rounded text-black bg-white"
                        />
                    </Tooltip>
                </div>
                <div>
                    <label className="block mb-1">Data/Hora Término*</label>
                    <Tooltip content="Data de término" placement="top-start">
                        <input
                            required
                            type="datetime-local"
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                            className="w-full p-2 border rounded text-black bg-white"
                        />
                    </Tooltip>
                </div>
            </div>

            {/* Cupons */}
            <fieldset className="border p-4 rounded space-y-4">
                <legend className="px-1 font-medium">Cupons</legend>
                <div className="flex flex-wrap gap-4">
                    <Checkbox isSelected={!hasCoupon} onChange={() => setHasCoupon(v => !v)}>
                        Promoção sem cupom
                    </Checkbox>
                    <Checkbox
                        isSelected={multipleCoupons}
                        onChange={() => setMultipleCoupons(v => !v)}
                        isDisabled={!hasCoupon}
                    >
                        Múltiplos cupons
                    </Checkbox>
                    <Checkbox
                        isSelected={reuseSameCoupon}
                        onChange={() => setReuseSameCoupon(v => !v)}
                        isDisabled={!hasCoupon}
                    >
                        Reutilizar cupom
                    </Checkbox>
                </div>

                {hasCoupon && (
                    <>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Código do cupom"
                                value={newCoupon}
                                onChange={e => setNewCoupon(e.target.value)}
                                onKeyDown={handleCouponKey}
                                classNames={{ input: 'text-black' }}
                            />
                            <Button onPress={addCoupon} disabled={!newCoupon.trim()}>
                                Adicionar
                            </Button>
                        </div>
                        {couponsArray.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {couponsArray.map(code => (
                                    <div
                                        key={code}
                                        className="flex items-center px-3 py-1 bg-gray-200 rounded-full"
                                    >
                                        <span className="mr-2 text-gray-800">{code}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeCoupon(code)}
                                            className="text-red-600"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">Nenhum cupom adicionado.</p>
                        )}
                    </>
                )}
            </fieldset>

            {/* Limites */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                    type="number"
                    placeholder="Qtd por usuário"
                    value={perUserCouponLimit}
                    onChange={e => setPerUserCouponLimit(e.target.value)}
                />
                <Input
                    type="number"
                    placeholder="Qtd total"
                    value={totalCouponCount}
                    onChange={e => setTotalCouponCount(e.target.value)}
                />
            </div>

            {/* Atributos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label>Ativa?</label>
                    <select
                        value={hasCoupon ? 'yes' : 'no'}
                        onChange={e => setHasCoupon(e.target.value === 'yes')}
                        className="w-full p-2 border rounded bg-white text-black"
                    >
                        <option value="yes">Sim</option>
                        <option value="no">Não</option>
                    </select>
                </div>
                <div>
                    <label>Acumulativa?</label>
                    <select
                        value={multipleCoupons ? 'yes' : 'no'}
                        onChange={e => setMultipleCoupons(e.target.value === 'yes')}
                        className="w-full p-2 border rounded bg-white text-black"
                    >
                        <option value="yes">Sim</option>
                        <option value="no">Não</option>
                    </select>
                </div>
                <Input
                    type="number"
                    placeholder="Prioridade"
                    value={priority}
                    onChange={e => setPriority(e.target.value)}
                />
            </div>

            <div className="text-right space-x-2">
                <Button onPress={handleSave} color="success">
                    Salvar Passo 1
                </Button>
                <Button type="submit">Próximo</Button>
            </div>
        </form>
    )
}
