'use client'

import React, { FormEvent, Dispatch, SetStateAction, useState } from 'react'
import { Input, Checkbox, Button, Tooltip } from '@nextui-org/react'
import { PromotionWizardDto } from 'Types/types'

interface Props {
    data: PromotionWizardDto
    setData: Dispatch<SetStateAction<PromotionWizardDto>>
    onNext: () => void
}

export default function PromotionStep1({ data, setData, onNext }: Props) {

    const [newCoupon, setNewCoupon] = useState('')

    const couponsArray = data.coupons ?? []

    const addCoupon = () => {
        const code = newCoupon.trim()
        if (!code) return
        if (couponsArray.includes(code)) {
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

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-xl font-semibold">Passo 1: Defina a Promoção</h2>

            {/* Nome */}
            <div>
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
                        classNames={{
                            input: "text-black",
                        }}
                    />
                </Tooltip>
            </div>

            {/* Descrição */}
            <div>
                <Tooltip
                    content="Faça uma descrição para que o cliente da loja, possa entender do que se trata a promoção, como regras da promoção etc..."
                    placement="top-start"
                    className="bg-white text-red-500 border border-gray-200 p-2"
                >
                    <textarea
                        value={data.description}
                        onChange={e =>
                            setData(d => ({ ...d, description: e.target.value }))
                        }
                        className="bg-white rounded-md h-32 w-full text-black p-3 border-2"
                        placeholder='Digite a descrição aqui...'
                    />
                </Tooltip>
            </div>

            {/* Datas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block font-medium mb-1">Data/Hora Início*</label>
                    <Tooltip
                        content="Digite a data e horario de inicio para essa promoção"
                        placement="top-start"
                        className="bg-white text-red-500 border border-gray-200 p-2"
                    >
                        <input
                            required
                            type="datetime-local"
                            className="w-full border p-2 rounded text-black"
                            value={data.startDate.toISOString().slice(0, 16)}
                            onChange={e =>
                                setData(d => ({
                                    ...d,
                                    startDate: new Date(e.target.value)
                                }))
                            }
                        />
                    </Tooltip>
                </div>
                <div>
                    <label className="block font-medium mb-1">Data/Hora Término*</label>
                    <Tooltip
                        content="Digite a data e horario de término para essa promoção"
                        placement="top-start"
                        className="bg-white text-red-500 border border-gray-200 p-2"
                    >
                        <input
                            required
                            type="datetime-local"
                            className="w-full border p-2 rounded text-black"
                            value={data.endDate.toISOString().slice(0, 16)}
                            onChange={e =>
                                setData(d => ({ ...d, endDate: new Date(e.target.value) }))
                            }
                        />
                    </Tooltip>
                </div>
            </div>

            {/* Cupons */}
            <fieldset className="border p-4 rounded space-y-4">
                <legend className="font-medium px-1">Cupons</legend>

                <div className="flex flex-wrap items-center gap-4">
                    <Tooltip
                        content="Selecione essa opção, caso sua promoção não necessite de codigos de cupons para aplicar a promoção que irá cadastrar."
                        placement="top-start"
                        className="bg-white text-red-500 border border-gray-200 p-2"
                    >
                        <Checkbox
                            isSelected={!data.hasCoupon}
                            onChange={() =>
                                setData(d => ({ ...d, hasCoupon: !d.hasCoupon }))
                            }
                        >
                            Criar uma promoção sem utilizar cupom?
                        </Checkbox>
                    </Tooltip>

                    <Tooltip
                        content="Selecione essa opção, caso sua promoção poderá usar diversos codigos diferentes de cupons."
                        placement="top-start"
                        className="bg-white text-red-500 border border-gray-200 p-2"
                    >
                        <Checkbox
                            isSelected={data.multipleCoupons}
                            onChange={() =>
                                setData(d => ({ ...d, multipleCoupons: !d.multipleCoupons }))
                            }
                            isDisabled={!data.hasCoupon}
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
                            onChange={() =>
                                setData(d => ({ ...d, reuseSameCoupon: !d.reuseSameCoupon }))
                            }
                            isDisabled={!data.hasCoupon}
                        >
                            Reutilizar mesmo cupom
                        </Checkbox>
                    </Tooltip>

                </div>

                {data.hasCoupon && (
                    <>
                        {/* campo e botão */}
                        <div className="flex gap-2">
                            <Input
                                aria-label="Novo cupom"
                                placeholder="Código do cupom"
                                value={newCoupon}
                                onChange={e => setNewCoupon(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="flex-1"
                            />
                            <Button className='text-violet-500' onClick={addCoupon} disabled={!newCoupon.trim()}>
                                Adicionar
                            </Button>
                        </div>

                        {/* lista de pílulas */}
                        {couponsArray.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {couponsArray.map(code => (
                                    <div
                                        key={code}
                                        className="flex items-center bg-gray-200 text-gray-800 px-3 py-1 rounded-full"
                                    >
                                        <span className="mr-2">{code}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeCoupon(code)}
                                            className="text-gray-600 hover:text-red-600"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">
                                Nenhum cupom adicionado.
                            </p>
                        )}
                    </>
                )}
            </fieldset>

            {/* Qtd por cliente e total */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
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
                                    perUserCouponLimit: e.target.value
                                        ? Number(e.target.value)
                                        : undefined
                                }))
                            }
                            className="bg-white border border-gray-200 rounded-md"
                            classNames={{
                                input: "text-black",
                            }}
                            placeholder='Quantidade por cliente'
                        />
                    </Tooltip>
                </div>
                <div>
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
                                    totalCouponCount: e.target.value
                                        ? Number(e.target.value)
                                        : undefined
                                }))
                            }
                            className="bg-white border border-gray-200 rounded-md"
                            classNames={{
                                input: "text-black",
                            }}
                            placeholder='Quantidade Total de Cupons'
                        />
                    </Tooltip>
                </div>
            </div>

            {/* Ativar / Acumular / Prioridade */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block font-medium mb-1">Ativar Promoção?</label>
                    <select
                        className="w-full border p-2 rounded text-black"
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
                    <label className="block font-medium mb-1">Promoção Acumulativa?</label>
                    <select
                        className="w-full border p-2 rounded text-black"
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
                    <label className="block font-medium mb-1">Ordem de aparecimento</label>
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
                            className="bg-white border border-gray-200 rounded-md"
                            classNames={{
                                input: "text-black",
                            }}
                            placeholder='Ordem de Prioridade'
                        />
                    </Tooltip>
                </div>
            </div>

            <div className="text-right">
                <Button className='px-4 py-2 bg-orange-500 text-white rounded' type="submit">Próximo</Button>
            </div>
        </form>
    )
}