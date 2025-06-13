'use client'
import { FormEvent, Dispatch, SetStateAction } from 'react'
import { Button, Checkbox, Input, Textarea } from '@nextui-org/react'
import { CreatePromotionDto, PromotionWizardDto } from 'Types/types'

interface Props {
    data: PromotionWizardDto
    setData: Dispatch<SetStateAction<PromotionWizardDto>>
    onNext: () => void
}

export default function PromotionStep1({ data, setData, onNext }: Props) {
    const handleSubmit = (e: FormEvent) => {
        e.preventDefault()
        onNext()
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-xl font-semibold">Passo 1: Defina a Promoção</h2>

            {/* Nome */}
            <div>
                <label className="block font-medium">Nome*</label>
                <Input
                    required
                    value={data.name}
                    onChange={e => setData(d => ({ ...d, name: e.target.value }))}
                />
            </div>

            {/* Descrição */}
            <div>
                <label className="block font-medium">Descrição</label>
                <Textarea
                    minRows={3}
                    value={data.description}
                    onChange={e => setData(d => ({ ...d, description: e.target.value }))}
                />
            </div>

            {/* Datas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block font-medium">Data/Hora Início*</label>
                    <input
                        required
                        type="datetime-local"
                        className="w-full border p-2 rounded"
                        value={data.startDate.toISOString().slice(0, 16)}
                        onChange={e =>
                            setData(d => ({
                                ...d,
                                startDate: new Date(e.target.value)
                            }))
                        }
                    />
                </div>
                <div>
                    <label className="block font-medium">Data/Hora Término*</label>
                    <input
                        required
                        type="datetime-local"
                        className="w-full border p-2 rounded"
                        value={data.endDate.toISOString().slice(0, 16)}
                        onChange={e =>
                            setData(d => ({ ...d, endDate: new Date(e.target.value) }))
                        }
                    />
                </div>
            </div>

            {/* Cupom */}
            <fieldset className="border p-4 rounded space-y-2">
                <legend className="font-medium">Cupom</legend>
                <Checkbox
                    isSelected={!data.hasCoupon}
                    onChange={() =>
                        setData(d => ({ ...d, hasCoupon: !d.hasCoupon }))
                    }
                >
                    Sem cupom
                </Checkbox>
                <Checkbox
                    isSelected={data.multipleCoupons}
                    onChange={() =>
                        setData(d => ({ ...d, multipleCoupons: !d.multipleCoupons }))
                    }
                    isDisabled={!data.hasCoupon}
                >
                    Múltiplos cupons
                </Checkbox>
                <Checkbox
                    isSelected={data.reuseSameCoupon}
                    onChange={() =>
                        setData(d => ({ ...d, reuseSameCoupon: !d.reuseSameCoupon }))
                    }
                    isDisabled={!data.hasCoupon}
                >
                    Reutilizar mesmo cupom
                </Checkbox>

                {data.hasCoupon && (
                    <>
                        <label className="block font-medium">
                            Lista de Cupons (uma linha por cupom)
                        </label>
                        <Textarea
                            minRows={3}
                            value={(data.coupons || []).join(',')}
                            onChange={e =>
                                setData(d => ({
                                    ...d,
                                    coupons: e.target.value
                                        .split(',')
                                        .map(s => s.trim())
                                        .filter(Boolean)
                                }))
                            }
                            placeholder='cupom\cupom1\...'
                        />
                    </>
                )}
            </fieldset>

            {/* Qtd de cupons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block font-medium">Qtd por Cliente</label>
                    <Input
                        type="number"
                        value={data.perUserCouponLimit?.toString() ?? ''}
                        onChange={e =>
                            setData(d => ({
                                ...d,
                                perUserCouponLimit: e.target.value
                                    ? Number(e.target.value)
                                    : undefined
                            }))
                        }
                    />
                </div>
                <div>
                    <label className="block font-medium">
                        Qtd Total de Cupons
                    </label>
                    <Input
                        type="number"
                        value={data.totalCouponCount?.toString() ?? ''}
                        onChange={e =>
                            setData(d => ({
                                ...d,
                                totalCouponCount: e.target.value
                                    ? Number(e.target.value)
                                    : undefined
                            }))
                        }
                    />
                </div>
            </div>

            {/* Ativar / Acumular / Prioridade */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block font-medium">Ativar Promoção?</label>
                    <select
                        className="w-full border p-2 rounded"
                        value={data.active ? 'yes' : 'no'}
                        onChange={e =>
                            setData(d => ({ ...d, active: e.target.value === 'yes' }))
                        }
                    >
                        <option value="yes">Sim</option>
                        <option value="no">Não</option>
                    </select>
                </div>
                <div>
                    <label className="block font-medium">
                        Promoção Acumulativa?
                    </label>
                    <select
                        className="w-full border p-2 rounded"
                        value={data.cumulative ? 'yes' : 'no'}
                        onChange={e =>
                            setData(d => ({ ...d, cumulative: e.target.value === 'yes' }))
                        }
                    >
                        <option value="yes">Sim</option>
                        <option value="no">Não</option>
                    </select>
                </div>
                <div>
                    <label className="block font-medium">Ordem de Prioridade</label>
                    <Input
                        type="number"
                        value={data.priority.toString()}
                        onChange={e =>
                            setData(d => ({ ...d, priority: Number(e.target.value) }))
                        }
                    />
                </div>
            </div>

            <div className="text-right">
                <Button type="submit">Próximo</Button>
            </div>
        </form>
    )
}