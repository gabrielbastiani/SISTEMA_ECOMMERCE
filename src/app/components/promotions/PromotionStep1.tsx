'use client'

import React, { FormEvent, Dispatch, SetStateAction, useState } from 'react'
import { Input, Checkbox, Button, Tooltip } from '@nextui-org/react'
import { PromotionWizardDto } from 'Types/types'

interface Props {
    data: PromotionWizardDto
    setData: Dispatch<SetStateAction<PromotionWizardDto>>
    onNext: () => void
    isSaving?: boolean
}

export default function PromotionStep1({ data, setData, onNext, isSaving = false }: Props) {

    const [newCoupon, setNewCoupon] = useState('')

    const addCoupon = () => {
        const code = newCoupon.trim()
        if (!code) return
        if ((data.coupons ?? []).includes(code)) {
            setNewCoupon('')
            return
        }
        setData(d => ({
            ...d,
            coupons: [...(d.coupons ?? []), code]
        }))
        setNewCoupon('')
    }

    const removeCoupon = (code: string) => {
        setData(d => ({
            ...d,
            coupons: (d.coupons ?? []).filter(c => c !== code)
        }))
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            addCoupon()
        }
    }

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault()
        onNext()
    }

    // compensação UTC–3 → string "YYYY-MM-DDThh:mm"
    const toInputValue = (dt: Date) => {
        const tzOffsetMs = dt.getTimezoneOffset() * 60000
        return new Date(dt.getTime() - tzOffsetMs)
            .toISOString()
            .slice(0, 16)
    }

    // Se estiver salvando, desabilita inputs para evitar mudanças durante o POST
    const disabled = Boolean(isSaving)

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-xl font-semibold">Passo 1: Defina a Promoção</h2>

            {/* Nome */}
            <Tooltip
                content="De um nome coerente para sua promoção."
                placement="top-start"
                className="bg-white text-red-500 border border-gray-200 p-2"
            >
                <Input
                    placeholder="Nome da promoção"
                    required
                    value={data.name}
                    onChange={e => setData(d => ({ ...d, name: e.target.value }))}
                    className="bg-white border border-gray-200 rounded-md"
                    classNames={{ input: "text-black" }}
                    disabled={disabled}
                />
            </Tooltip>

            {/* Descrição */}
            <Tooltip
                content="Descreva regras e detalhes da promoção."
                placement="top-start"
                className="bg-white text-red-500 border border-gray-200 p-2"
            >
                <textarea
                    required
                    value={data.description}
                    onChange={e => setData(d => ({ ...d, description: e.target.value }))}
                    className="w-full h-32 p-3 border-2 rounded-md text-black"
                    placeholder="Digite a descrição aqui..."
                    disabled={disabled as any}
                />
            </Tooltip>

            {/* Datas */}
            <div className="grid md:grid-cols-2 gap-4">
                <div>
                    <label className="block mb-1 font-medium">Data/Hora Início*</label>
                    <input
                        type="datetime-local"
                        required
                        className="w-full border p-2 rounded text-black"
                        value={toInputValue(data.startDate!)}
                        onChange={e =>
                            setData(d => ({ ...d, startDate: new Date(e.target.value) }))
                        }
                        disabled={disabled}
                    />
                </div>
                <div>
                    <label className="block mb-1 font-medium">Data/Hora Término*</label>
                    <input
                        type="datetime-local"
                        required
                        className="w-full border p-2 rounded text-black"
                        value={toInputValue(data.endDate!)}
                        onChange={e =>
                            setData(d => ({ ...d, endDate: new Date(e.target.value) }))
                        }
                        disabled={disabled}
                    />
                </div>
            </div>

            {/* Cupons */}
            <fieldset className="border p-4 rounded space-y-4">
                <legend className="font-medium px-1">Cupons</legend>

                <div className="flex flex-wrap gap-4">
                    <Tooltip
                        content="Selecione essa opção, caso sua promoção não necessite de codigos de cupons para aplicar a promoção que irá cadastrar."
                        placement="top-start"
                        className="bg-white text-red-500 border border-gray-200 p-2"
                    >
                        <Checkbox
                            isSelected={!data.hasCoupon}
                            onChange={() => setData(d => ({ ...d, hasCoupon: !d.hasCoupon }))}
                            isDisabled={disabled}
                        >
                            Sem cupom
                        </Checkbox>
                    </Tooltip>
                    <Tooltip
                        content="Selecione essa opção, caso sua promoção poderá usar diversos codigos diferentes de cupons."
                        placement="top-start"
                        className="bg-white text-red-500 border border-gray-200 p-2"
                    >
                        <Checkbox
                            isSelected={data.multipleCoupons}
                            onChange={() => setData(d => ({ ...d, multipleCoupons: !d.multipleCoupons }))}
                            isDisabled={!data.hasCoupon || disabled}
                        >
                            Múltiplos cupons
                        </Checkbox>
                    </Tooltip>
                    <Tooltip
                        content="Quando ativada essa opção, um mesmo numero de cupom da listagem poderá ser utilizado mais de uma vez na loja, incluisive pelo mesmo usurio."
                        placement="top-start"
                        className="bg-white text-red-500 border border-gray-200 p-2"
                    >
                        <Checkbox
                            isSelected={data.reuseSameCoupon}
                            onChange={() => setData(d => ({ ...d, reuseSameCoupon: !d.reuseSameCoupon }))}
                            isDisabled={!data.hasCoupon || disabled}
                        >
                            Reutilizar mesmo cupom
                        </Checkbox>
                    </Tooltip>
                </div>

                {data.hasCoupon && (
                    <>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Código do cupom"
                                value={newCoupon}
                                onChange={e => setNewCoupon(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="flex-1"
                                disabled={disabled}
                            />
                            <Button className='text-violet-500' onClick={addCoupon} disabled={!newCoupon.trim() || disabled}>
                                Adicionar
                            </Button>
                        </div>
                        {(data.coupons?.length ?? 0) > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {data.coupons!.map(code => (
                                    <div key={code} className="flex items-center bg-gray-200 px-3 py-1 rounded-full text-gray-800">
                                        <span className="mr-2">{code}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeCoupon(code)}
                                            className="text-red-600 font-bold"
                                            disabled={disabled}
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

            {/* Limites de cupom */}
            <div className="grid md:grid-cols-2 gap-4">
                <Tooltip
                    content="Informe a quantidade vezes que um cupom poderá ser utlizado por de cliente. (Preenchimento Opcional)"
                    placement="top-start"
                    className="bg-white text-red-500 border border-gray-200 p-2"
                >
                    <Input
                        type="number"
                        value={data.perUserCouponLimit?.toString() ?? ''}
                        onChange={e =>
                            setData(d => ({
                                ...d,
                                perUserCouponLimit: e.target.value ? Number(e.target.value) : undefined
                            }))
                        }
                        placeholder="Qtd por cliente"
                        className="bg-white text-black"
                        disabled={disabled}
                    />
                </Tooltip>
                <Tooltip
                    content="Informe a quantidade total de cupons que serão usados na Promoção. (Preenchimento Opcional)"
                    placement="top-start"
                    className="bg-white text-red-500 border border-gray-200 p-2"
                >
                    <Input
                        type="number"
                        value={data.totalCouponCount?.toString() ?? ''}
                        onChange={e =>
                            setData(d => ({
                                ...d,
                                totalCouponCount: e.target.value ? Number(e.target.value) : undefined
                            }))
                        }
                        placeholder="Qtd total de cupons"
                        className="bg-white text-black"
                        disabled={disabled}
                    />
                </Tooltip>
            </div>

            {/* Status / Acumulativa / Prioridade */}
            <div className="grid md:grid-cols-3 gap-4">
                <div>
                    <label className="block mb-1 font-medium">Status Promoção*</label>
                    <select
                        className="w-full border p-2 rounded text-black"
                        value={data.status}
                        onChange={e =>
                            setData(d => ({ ...d, status: e.target.value as PromotionWizardDto['status'] }))
                        }
                        required
                        disabled={disabled}
                    >
                        <option value="">Selecione o status</option>
                        <option value="Disponivel">Disponível</option>
                        <option value="Indisponivel">Indisponível</option>
                        <option value="Programado">Programado</option>
                    </select>
                </div>
                <div>
                    <label className="block mb-1 font-medium">Promoção Acumulativa?</label>
                    <select
                        className="w-full border p-2 rounded text-black"
                        value={data.cumulative ? 'yes' : 'no'}
                        onChange={e =>
                            setData(d => ({ ...d, cumulative: e.target.value === 'yes' }))
                        }
                        disabled={disabled}
                    >
                        <option value="yes">Sim</option>
                        <option value="no">Não</option>
                    </select>
                </div>
                <div>
                    <label className="block mb-1 font-medium">Ordem de aparecimento</label>
                    <Tooltip
                        content="Defina uma ordem de prioridade para a promoção; 1 sendo a maior prioridade."
                        placement="top-start"
                        className="bg-white text-red-500 border border-gray-200 p-2"
                    >
                        <Input
                            type="number"
                            value={data.priority.toString()}
                            onChange={e =>
                                setData(d => ({ ...d, priority: Number(e.target.value) }))
                            }
                            placeholder="Prioridade"
                            className="bg-white rounded-md text-black"
                            disabled={disabled}
                        />
                    </Tooltip>
                </div>
            </div>

            <div className="text-right">
                <Button className='px-4 py-2 bg-orange-500 text-white rounded' type="submit" disabled={disabled}>Próximo</Button>
            </div>
        </form>
    )
}