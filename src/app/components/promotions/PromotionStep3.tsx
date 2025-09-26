'use client'

import React, { useEffect, useRef, useState } from 'react'
import { setupAPIClientEcommerce } from '@/app/services/apiEcommerce'
import { ActionInput, ActionType, PromotionWizardDto } from 'Types/types'
import { Tooltip } from '@nextui-org/react'
import { toast } from 'react-toastify'

type MultiSelectOption = { value: string; label: string }

function MultiSelect({
    label,
    options,
    selected,
    onChange,
    disabled
}: {
    label: string
    options: MultiSelectOption[]
    selected: string[]
    onChange: (arr: string[]) => void
    disabled?: boolean
}) {
    const [open, setOpen] = useState(false)

    const toggle = (val: string) =>
        selected.includes(val) ? onChange(selected.filter(x => x !== val)) : onChange([...selected, val])

    return (
        <div className="relative">
            <span className="block mb-1 font-medium text-black">{label}</span>
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className="w-full text-left border p-2 rounded flex justify-between items-center bg-white"
                disabled={disabled}
            >
                <span className="truncate text-black">
                    {selected.length > 0 ? `${selected.length} selecionado${selected.length > 1 ? 's' : ''}` : 'Nenhum selecionado'}
                </span>
                <svg className={`w-4 h-4 transform transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 20 20">
                    <path d="M5.5 8l4.5 4.5L14.5 8h-9z" fill="currentColor" />
                </svg>
            </button>

            {open && (
                <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow-lg max-h-60 overflow-auto">
                    {options.map(opt => (
                        <label key={opt.value} className="flex items-center px-3 py-2 hover:bg-gray-100 text-black">
                            <input
                                type="checkbox"
                                checked={selected.includes(opt.value)}
                                onChange={() => toggle(opt.value)}
                                className="mr-2"
                                disabled={disabled}
                            />
                            <span className="truncate">{opt.label}</span>
                        </label>
                    ))}
                </div>
            )}

            {selected.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                    {options
                        .filter(o => selected.includes(o.value))
                        .map(o => (
                            <span key={o.value} className="flex items-center bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
                                {o.label}
                                <button
                                    type="button"
                                    onClick={() => toggle(o.value)}
                                    className="ml-1 text-green-600 hover:text-green-900"
                                    disabled={disabled}
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                </div>
            )}
        </div>
    )
}

const actionOptions: { value: ActionType; label: string }[] = [
    { value: ActionType.FIXED_VARIANT_DISCOUNT, label: 'Ganhe X R$ de desconto na unidade de cada produto variante Y' },
    { value: ActionType.FIXED_PRODUCT_DISCOUNT, label: 'Ganhe X R$ de desconto na unidade de cada produto Y' },
    { value: ActionType.FREE_VARIANT_ITEM, label: 'Ganhe X unidades do produto variante Y de brinde' },
    { value: ActionType.FREE_PRODUCT_ITEM, label: 'Ganhe X unidades do produto Y de brinde' },
    { value: ActionType.PERCENT_CATEGORY, label: 'Ganhe X% de desconto nos produtos da categoria Y' },
    { value: ActionType.PERCENT_VARIANT, label: 'Ganhe X% de desconto nos produtos variantes Y' },
    { value: ActionType.PERCENT_PRODUCT, label: 'Ganhe X% de desconto nos produtos Y' },
    { value: ActionType.PERCENT_BRAND_ITEMS, label: 'Percentual de desconto de acordo com marca/fabricante' },
    { value: ActionType.PERCENT_ITEM_COUNT, label: 'Percentual de desconto em X unidades de produtos Y' },
    { value: ActionType.PERCENT_EXTREME_ITEM, label: 'Percentual de desconto em X unidades do produto de menor ou maior valor' },
    { value: ActionType.PERCENT_SHIPPING, label: 'Percentual de desconto no valor do frete' },
    { value: ActionType.PERCENT_SUBTOTAL, label: 'Percentual de desconto no valor subtotal (soma dos produtos)' },
    { value: ActionType.PERCENT_TOTAL_NO_SHIPPING, label: 'Percentual de desconto no valor total (sem considerar o frete)' },
    { value: ActionType.PERCENT_TOTAL_PER_PRODUCT, label: 'Percentual de desconto no valor total (aplicado por produto)' },
    { value: ActionType.FIXED_BRAND_ITEMS, label: 'Valor de desconto em X produtos de acordo com marca/fabricante' },
    { value: ActionType.FIXED_SHIPPING, label: 'Valor de desconto no valor do frete' },
    { value: ActionType.FIXED_SUBTOTAL, label: 'Valor de desconto no valor subtotal (soma dos produtos)' },
    { value: ActionType.FIXED_TOTAL_NO_SHIPPING, label: 'Valor de desconto no valor total (sem considerar o frete)' },
    { value: ActionType.FIXED_TOTAL_PER_PRODUCT, label: 'Valor de desconto no valor total (aplicado por produto)' },
    { value: ActionType.MAX_SHIPPING_DISCOUNT, label: 'Valor máximo de frete' }
]

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const percent = (v: number) => `${v.toLocaleString('pt-BR')}%`

export default function PromotionStep3({
    data,
    setData,
    onBack,
    onNext,
    isSaving = false
}: {
    data: PromotionWizardDto
    setData: React.Dispatch<React.SetStateAction<PromotionWizardDto>>
    onBack: () => void
    onNext: () => void
    isSaving?: boolean
}) {
    // API client estável
    const apiRef = useRef<any | null>(null)
    if (!apiRef.current) apiRef.current = setupAPIClientEcommerce()

    const [type, setType] = useState<ActionType>(ActionType.FIXED_VARIANT_DISCOUNT)
    const [params, setParams] = useState<any>({})

    const [products, setProducts] = useState<{ id: string; name: string; brand?: string }[]>([])
    const [variants, setVariants] = useState<{ id: string; sku: string }[]>([])
    const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
    const [brands, setBrands] = useState<string[]>([])

    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let alive = true
        async function loadAll() {
            try {
                setLoading(true)
                const api = apiRef.current
                const [pRes, vRes, cRes] = await Promise.all([
                    api.get('/get/products'),
                    api.get('/variant/get'),
                    api.get('/category/cms')
                ])
                if (!alive) return
                const prods = (pRes?.data?.allow_products || []) as any[]
                setProducts(prods.map(p => ({ id: p.id, name: p.name, brand: p.brand })))
                setVariants((vRes?.data || []).map((v: any) => ({ id: v.id, sku: v.sku })))
                setCategories((cRes?.data?.all_categories_disponivel || []).map((c: any) => ({ id: c.id, name: c.name })))
                const uniqueBrands = Array.from(new Set(prods.map(p => (p.brand as string) || '').filter(Boolean)))
                setBrands(uniqueBrands)
            } catch (err) {
                console.error('Erro ao carregar dados de ação', err)
                toast.error('Erro ao carregar dados de ação')
            } finally {
                if (alive) setLoading(false)
            }
        }
        loadAll()
        return () => { alive = false }
    }, []) // executa apenas uma vez

    useEffect(() => {
        // limpa params ao trocar de tipo
        setParams({})
    }, [type])

    function saveAction() {
        const action: ActionInput = { type, params }
        setData(d => ({ ...d, actions: [...(d.actions || []), action] }))
        setType(ActionType.FIXED_VARIANT_DISCOUNT)
        setParams({})
    }

    function removeAction(i: number) {
        setData(d => ({ ...d, actions: d.actions!.filter((_: any, idx: number) => idx !== i) }))
    }

    const productOptions: MultiSelectOption[] = products.map(p => ({ value: p.id, label: p.name }))
    const variantOptions: MultiSelectOption[] = variants.map(v => ({ value: v.id, label: v.sku }))
    const categoryOptions: MultiSelectOption[] = categories.map(c => ({ value: c.id, label: c.name }))
    const brandOptions: MultiSelectOption[] = brands.map(b => ({ value: b, label: b }))

    function renderFields() {
        if (loading) {
            return (
                <div className="space-y-3 animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-full" />
                    <div className="h-8 bg-gray-200 rounded w-3/4" />
                    <div className="h-24 bg-gray-200 rounded w-full" />
                </div>
            )
        }

        const disabled = Boolean(isSaving)

        switch (type) {
            case ActionType.FIXED_VARIANT_DISCOUNT:
                return (
                    <>
                        <MultiSelect label="Variantes" options={variantOptions} selected={params.variantIds || []} onChange={(arr) => setParams((p: any) => ({ ...p, variantIds: arr }))} disabled={disabled} />
                        <div className="mt-4">
                            <label>Valor do desconto (R$)*</label>
                            <input type="number" value={params.amount ?? ''} onChange={e => setParams({ ...params, amount: Number(e.target.value) })} className="w-full border p-2 rounded text-black" disabled={disabled} />
                        </div>
                    </>
                )

            case ActionType.FIXED_PRODUCT_DISCOUNT:
                return (
                    <>
                        <MultiSelect label="Produtos" options={productOptions} selected={params.productIds || []} onChange={(arr) => setParams((p: any) => ({ ...p, productIds: arr }))} disabled={disabled} />
                        <div className="mt-4">
                            <label>Valor do desconto (R$)*</label>
                            <input type="number" value={params.amount ?? ''} onChange={e => setParams({ ...params, amount: Number(e.target.value) })} className="w-full border p-2 rounded text-black" disabled={disabled} />
                        </div>
                    </>
                )

            case ActionType.FREE_VARIANT_ITEM:
                return (
                    <>
                        <MultiSelect label="Variantes" options={variantOptions} selected={params.variantIds || []} onChange={(arr) => setParams((p: any) => ({ ...p, variantIds: arr }))} disabled={disabled} />
                        <div className="mt-4">
                            <label>Unidades de brinde*</label>
                            <input type="number" value={params.qty ?? ''} onChange={e => setParams({ ...params, qty: Number(e.target.value) })} className="w-full border p-2 rounded text-black" disabled={disabled} />
                        </div>
                    </>
                )

            case ActionType.FREE_PRODUCT_ITEM:
                return (
                    <>
                        <MultiSelect label="Produtos" options={productOptions} selected={params.productIds || []} onChange={(arr) => setParams((p: any) => ({ ...p, productIds: arr }))} disabled={disabled} />
                        <div className="mt-4">
                            <label>Unidades de brinde*</label>
                            <input type="number" value={params.qty ?? ''} onChange={e => setParams({ ...params, qty: Number(e.target.value) })} className="w-full border p-2 rounded text-black" disabled={disabled} />
                        </div>
                    </>
                )

            case ActionType.PERCENT_CATEGORY:
                return (
                    <>
                        <MultiSelect label="Categorias" options={categoryOptions} selected={params.categoryIds || []} onChange={(arr) => setParams((p: any) => ({ ...p, categoryIds: arr }))} disabled={disabled} />
                        <div className="mt-4">
                            <label>Percentual (%)*</label>
                            <input type="number" value={params.percent ?? ''} onChange={e => setParams({ ...params, percent: Number(e.target.value) })} className="w-full border p-2 rounded text-black" disabled={disabled} />
                        </div>
                    </>
                )

            case ActionType.PERCENT_VARIANT:
                return (
                    <>
                        <MultiSelect label="Variantes" options={variantOptions} selected={params.variantIds || []} onChange={(arr) => setParams((p: any) => ({ ...p, variantIds: arr }))} disabled={disabled} />
                        <div className="mt-4">
                            <label>Percentual (%)*</label>
                            <input type="number" value={params.percent ?? ''} onChange={e => setParams({ ...params, percent: Number(e.target.value) })} className="w-full border p-2 rounded text-black" disabled={disabled} />
                        </div>
                    </>
                )

            case ActionType.PERCENT_PRODUCT:
                return (
                    <>
                        <MultiSelect label="Produtos" options={productOptions} selected={params.productIds || []} onChange={(arr) => setParams((p: any) => ({ ...p, productIds: arr }))} disabled={disabled} />
                        <div className="mt-4">
                            <label>Percentual (%)*</label>
                            <input type="number" value={params.percent ?? ''} onChange={e => setParams({ ...params, percent: Number(e.target.value) })} className="w-full border p-2 rounded text-black" disabled={disabled} />
                        </div>
                    </>
                )

            case ActionType.PERCENT_ITEM_COUNT:
                return (
                    <>
                        <MultiSelect label="Produtos" options={productOptions} selected={params.productIds || []} onChange={(arr) => setParams((p: any) => ({ ...p, productIds: arr }))} disabled={disabled} />
                        <div className="mt-4 grid grid-cols-2 gap-2">
                            <label>
                                Percentual (%)
                                <input type="number" value={params.percent ?? ''} onChange={e => setParams({ ...params, percent: Number(e.target.value) })} className="w-full border p-2 rounded text-black" disabled={disabled} />
                            </label>
                            <label>
                                Número de unidades
                                <input type="number" value={params.qty ?? ''} onChange={e => setParams({ ...params, qty: Number(e.target.value) })} className="w-full border p-2 rounded text-black" disabled={disabled} />
                            </label>
                        </div>
                    </>
                )

            case ActionType.PERCENT_EXTREME_ITEM:
                return (
                    <>
                        <MultiSelect label="Variantes" options={variantOptions} selected={params.variantIds || []} onChange={(arr) => setParams((p: any) => ({ ...p, variantIds: arr }))} disabled={disabled} />
                        <div className="mt-4">
                            <label>Percentual (%)*</label>
                            <input type="number" value={params.percent ?? ''} onChange={e => setParams({ ...params, percent: Number(e.target.value) })} className="w-full border p-2 rounded text-black" disabled={disabled} />
                        </div>
                        <fieldset className="mt-3">
                            <legend className="font-medium">Aplicar desconto em:</legend>
                            <label className="block">
                                <input type="checkbox" checked={params.lowest || false} onChange={() => setParams((p: any) => ({ ...p, lowest: !p.lowest }))} disabled={disabled} /> De menor valor
                            </label>
                            <label className="block">
                                <input type="checkbox" checked={params.highest || false} onChange={() => setParams((p: any) => ({ ...p, highest: !p.highest }))} disabled={disabled} /> De maior valor
                            </label>
                        </fieldset>
                    </>
                )

            case ActionType.PERCENT_BRAND_ITEMS:
                return (
                    <>
                        <div className="mt-2">
                            <label>Percentual (%)</label>
                            <input type="number" value={params.percent ?? ''} onChange={e => setParams({ ...params, percent: Number(e.target.value) })} className="w-full border p-2 rounded text-black" disabled={disabled} />
                        </div>
                        <fieldset className="mt-3">
                            <legend className="font-medium">Marcas</legend>
                            {brandOptions.map(b => (
                                <label key={b.value} className="block">
                                    <input type="checkbox" checked={params.brandNames?.includes(b.value) || false} onChange={e => {
                                        const sel = new Set<string>(params.brandNames || [])
                                        e.target.checked ? sel.add(b.value) : sel.delete(b.value)
                                        setParams({ ...params, brandNames: Array.from(sel) })
                                    }} disabled={disabled} /> {b.label}
                                </label>
                            ))}
                        </fieldset>
                    </>
                )

            case ActionType.FIXED_BRAND_ITEMS:
                return (
                    <>
                        <div className="mt-2">
                            <label>Valor (R$)</label>
                            <input type="number" value={params.amount ?? ''} onChange={e => setParams({ ...params, amount: Number(e.target.value) })} className="w-full border p-2 rounded text-black" disabled={disabled} />
                        </div>
                        <fieldset className="mt-3">
                            <legend className="font-medium">Marcas</legend>
                            {brandOptions.map(b => (
                                <label key={b.value} className="block">
                                    <input type="checkbox" checked={params.brandNames?.includes(b.value) || false} onChange={e => {
                                        const sel = new Set<string>(params.brandNames || [])
                                        e.target.checked ? sel.add(b.value) : sel.delete(b.value)
                                        setParams({ ...params, brandNames: Array.from(sel) })
                                    }} disabled={disabled} /> {b.label}
                                </label>
                            ))}
                        </fieldset>
                    </>
                )

            case ActionType.PERCENT_SHIPPING:
            case ActionType.PERCENT_SUBTOTAL:
            case ActionType.PERCENT_TOTAL_NO_SHIPPING:
            case ActionType.PERCENT_TOTAL_PER_PRODUCT:
                return (
                    <>
                        <div className="mt-2">
                            <label>Percentual (%)</label>
                            <input type="number" value={params.amount ?? ''} onChange={e => setParams({ ...params, amount: Number(e.target.value) })} className="w-full border p-2 rounded text-black" disabled={disabled} />
                        </div>
                        <div className="mt-2">
                            <label className="block mb-1">Excluir do desconto (opcional)</label>
                            <MultiSelect label="Produtos a excluir" options={productOptions} selected={params.excludeProductIds || []} onChange={(arr) => setParams((p: any) => ({ ...p, excludeProductIds: arr }))} disabled={disabled} />
                        </div>
                    </>
                )

            case ActionType.FIXED_SHIPPING:
            case ActionType.FIXED_SUBTOTAL:
            case ActionType.FIXED_TOTAL_NO_SHIPPING:
            case ActionType.FIXED_TOTAL_PER_PRODUCT:
            case ActionType.MAX_SHIPPING_DISCOUNT:
                return (
                    <div>
                        <label>Valor (R$)</label>
                        <input type="number" value={params.amount ?? ''} onChange={e => setParams({ ...params, amount: Number(e.target.value) })} className="w-full border p-2 rounded text-black" disabled={disabled} />
                    </div>
                )

            default:
                return null
        }
    }

    function formatDetails(a: ActionInput) {
        const p = a.params || {}
        switch (a.type) {
            case ActionType.FIXED_VARIANT_DISCOUNT:
                return `Variantes: ${variants.filter(v => p.variantIds?.includes(v.id)).map(v => v.sku).join(', ')} | Valor: ${currency.format(p.amount ?? 0)}`
            case ActionType.FIXED_PRODUCT_DISCOUNT:
                return `Produtos: ${products.filter(pd => p.productIds?.includes(pd.id)).map(pd => pd.name).join(', ')} | Valor: ${currency.format(p.amount ?? 0)}`
            case ActionType.FREE_VARIANT_ITEM:
                return `Brinde variantes: ${variants.filter(v => p.variantIds?.includes(v.id)).map(v => v.sku).join(', ')} | Qtd: ${p.qty ?? 0}`
            case ActionType.FREE_PRODUCT_ITEM:
                return `Brinde produtos: ${products.filter(pd => p.productIds?.includes(pd.id)).map(pd => pd.name).join(', ')} | Qtd: ${p.qty ?? 0}`
            case ActionType.PERCENT_CATEGORY:
                return `Categorias: ${categories.filter(c => p.categoryIds?.includes(c.id)).map(c => c.name).join(', ')} | Desconto: ${percent(p.percent ?? 0)}`
            case ActionType.PERCENT_VARIANT:
                return `Variantes: ${variants.filter(v => p.variantIds?.includes(v.id)).map(v => v.sku).join(', ')} | Desconto: ${percent(p.percent ?? 0)}`
            case ActionType.PERCENT_PRODUCT:
                return `Produtos: ${products.filter(pd => p.productIds?.includes(pd.id)).map(pd => pd.name).join(', ')} | Desconto: ${percent(p.percent ?? 0)}`
            case ActionType.PERCENT_ITEM_COUNT:
                return `Produtos: ${products.filter(pd => p.productIds?.includes(pd.id)).map(pd => pd.name).join(', ')} | ${percent(p.percent ?? 0)} em ${p.qty ?? 0} unidades`
            case ActionType.PERCENT_EXTREME_ITEM:
                return `Variantes: ${variants.filter(v => p.variantIds?.includes(v.id)).map(v => v.sku).join(', ')} | ${percent(p.percent ?? 0)} | ${p.lowest ? 'menor' : ''}${p.highest ? (p.lowest ? ' / maior' : 'maior') : ''}`
            case ActionType.PERCENT_BRAND_ITEMS:
            case ActionType.FIXED_BRAND_ITEMS:
                return `Marcas: ${(p.brandNames || []).join(', ')} | ${a.type === ActionType.PERCENT_BRAND_ITEMS ? percent(p.percent ?? 0) : currency.format(p.amount ?? 0)}`
            case ActionType.PERCENT_SHIPPING:
            case ActionType.PERCENT_SUBTOTAL:
            case ActionType.PERCENT_TOTAL_NO_SHIPPING:
            case ActionType.PERCENT_TOTAL_PER_PRODUCT:
                return `Desconto: ${percent(p.amount ?? 0)}`
            case ActionType.FIXED_SHIPPING:
            case ActionType.FIXED_SUBTOTAL:
            case ActionType.FIXED_TOTAL_NO_SHIPPING:
            case ActionType.FIXED_TOTAL_PER_PRODUCT:
            case ActionType.MAX_SHIPPING_DISCOUNT:
                return `Valor: ${currency.format(p.amount ?? 0)}`
            default:
                return JSON.stringify(p)
        }
    }

    const disabled = Boolean(isSaving)

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold">Passo 3: Defina as Ações</h2>

            <table className="w-full border-collapse">
                <thead>
                    <tr className="border-b bg-gray-100 text-black">
                        <th className="p-2 text-left">Ação</th>
                        <th className="p-2 text-left">Detalhes</th>
                        <th className="p-2"></th>
                    </tr>
                </thead>
                <tbody>
                    {data.actions?.map((a, i) => {
                        const label = actionOptions.find(o => o.value === a.type)?.label || String(a.type)
                        const details = formatDetails(a)
                        return (
                            <tr key={i} className="border-b text-black">
                                <td className="p-2 text-foreground">{label}</td>
                                <td className="p-2 text-foreground">{details}</td>
                                <td className="p-2">
                                    <button type="button" onClick={() => removeAction(i)} className="text-red-600 hover:underline" disabled={disabled}>
                                        Remover
                                    </button>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>

            <div>
                <label className="block mb-1">Ação*</label>
                <Tooltip content="Selecione a ação para a aplicar à Promoção. (Preenchimento Obrigatório)" placement="top-start" className="bg-white text-red-500 border border-gray-200 p-2">
                    <select value={type} onChange={e => setType(e.target.value as ActionType)} className="w-full border p-2 rounded text-black" disabled={loading || disabled}>
                        {actionOptions.map(o => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </select>
                </Tooltip>
            </div>

            <div className="space-y-4">{renderFields()}</div>

            <div className="flex justify-between mt-6">
                <button type="button" onClick={onBack} className="px-4 py-2 rounded bg-gray-200 text-black hover:bg-gray-300" disabled={disabled}>
                    Voltar
                </button>

                <div className="flex gap-2">
                    <button type="button" onClick={saveAction} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700" disabled={disabled || loading}>
                        Adicionar Ação
                    </button>

                    <button type="button" onClick={onNext} className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600" disabled={disabled}>
                        Próximo
                    </button>
                </div>
            </div>
        </div>
    )
}