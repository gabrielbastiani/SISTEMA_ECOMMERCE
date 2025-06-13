'use client'

import { useState, useEffect } from 'react'
import { setupAPIClientEcommerce } from '@/app/services/apiEcommerce'
import { ActionInput, ActionType, CreatePromotionDto, PromotionWizardDto } from 'Types/types'

// Opções de ação
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
    { value: ActionType.MAX_SHIPPING_DISCOUNT, label: 'Valor máximo de frete' },
]

// Formatadores para moeda e percentual
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const percent = (v: number) => `${v.toLocaleString('pt-BR')}%`

export default function PromotionStep3({
    data,
    setData,
    onBack,
    onNext
}: {
    data: PromotionWizardDto
    setData: React.Dispatch<React.SetStateAction<PromotionWizardDto>>
    onBack: () => void
    onNext: () => void
}) {
    const api = setupAPIClientEcommerce()

    const [type, setType] = useState<ActionType>(ActionType.FIXED_VARIANT_DISCOUNT)
    const [params, setParams] = useState<any>({})

    const [products, setProducts] = useState<{ id: string; name: string; brand: string }[]>([])
    const [variants, setVariants] = useState<{ id: string; sku: string }[]>([])
    const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
    const [brands, setBrands] = useState<string[]>([])

    // Carregar dados de produtos, variantes, categorias e extrair marcas
    useEffect(() => {
        async function loadAll() {
            try {
                const [pRes, vRes, cRes] = await Promise.all([
                    api.get('/get/products'),
                    api.get('/variant/get'),
                    api.get('/category/cms')
                ])
                const prods = pRes.data.allow_products as any[]
                setProducts(prods.map(p => ({ id: p.id, name: p.name, brand: p.brand })))
                setVariants(vRes.data.map((v: any) => ({ id: v.id, sku: v.sku })))
                setCategories(cRes.data.all_categories_disponivel.map((c: any) => ({ id: c.id, name: c.name })))
                const uniqueBrands = Array.from(new Set(prods.map(p => p.brand as string).filter(Boolean)))
                setBrands(uniqueBrands)
            } catch {
                console.error('Erro ao carregar dados de ação')
            }
        }
        loadAll()
    }, [api])

    // Salvar ação no estado global
    function saveAction() {
        const action: ActionInput = { type, params }
        setData(d => ({ ...d, actions: [...(d.actions || []), action] }))
        setType(ActionType.FIXED_VARIANT_DISCOUNT)
        setParams({})
    }

    // Remover ação existente
    function removeAction(i: number) {
        setData(d => ({ ...d, actions: d.actions!.filter((_: any, idx: number) => idx !== i) }))
    }

    // Renderiza os campos dinâmicos de acordo com o tipo selecionado
    function renderFields() {
        switch (type) {
            case ActionType.FIXED_VARIANT_DISCOUNT:
                return (
                    <>
                        <fieldset>
                            <legend>Produto Variante*</legend>
                            {variants.map(v => (
                                <label key={v.id} className="block">
                                    <input
                                        type="checkbox"
                                        checked={params.variantIds?.includes(v.id) || false}
                                        onChange={e => {
                                            const sel = new Set<string>(params.variantIds || [])
                                            e.target.checked ? sel.add(v.id) : sel.delete(v.id)
                                            setParams({ ...params, variantIds: Array.from(sel) })
                                        }}
                                    />{' '}
                                    {v.sku}
                                </label>
                            ))}
                        </fieldset>
                        <label>
                            Valor do desconto (R$)*{' '}
                            <input
                                type="number"
                                value={params.amount || ''}
                                onChange={e => setParams({ ...params, amount: Number(e.target.value) })}
                            />
                        </label>
                    </>
                )

            case ActionType.FIXED_PRODUCT_DISCOUNT:
                return (
                    <>
                        <fieldset>
                            <legend>Produto*</legend>
                            {products.map(p => (
                                <label key={p.id} className="block">
                                    <input
                                        type="checkbox"
                                        checked={params.productIds?.includes(p.id) || false}
                                        onChange={e => {
                                            const sel = new Set<string>(params.productIds || [])
                                            e.target.checked ? sel.add(p.id) : sel.delete(p.id)
                                            setParams({ ...params, productIds: Array.from(sel) })
                                        }}
                                    />{' '}
                                    {p.name}
                                </label>
                            ))}
                        </fieldset>
                        <label>
                            Valor do desconto (R$)*{' '}
                            <input
                                type="number"
                                value={params.amount || ''}
                                onChange={e => setParams({ ...params, amount: Number(e.target.value) })}
                            />
                        </label>
                    </>
                )

            case ActionType.FREE_VARIANT_ITEM:
                return (
                    <>
                        <fieldset>
                            <legend>Produto Variante*</legend>
                            {variants.map(v => (
                                <label key={v.id} className="block">
                                    <input
                                        type="checkbox"
                                        checked={params.variantIds?.includes(v.id) || false}
                                        onChange={e => {
                                            const sel = new Set<string>(params.variantIds || [])
                                            e.target.checked ? sel.add(v.id) : sel.delete(v.id)
                                            setParams({ ...params, variantIds: Array.from(sel) })
                                        }}
                                    />{' '}
                                    {v.sku}
                                </label>
                            ))}
                        </fieldset>
                        <label>
                            Unidades de brinde*{' '}
                            <input
                                type="number"
                                value={params.qty || ''}
                                onChange={e => setParams({ ...params, qty: Number(e.target.value) })}
                            />
                        </label>
                    </>
                )

            case ActionType.FREE_PRODUCT_ITEM:
                return (
                    <>
                        <fieldset>
                            <legend>Produto*</legend>
                            {products.map(p => (
                                <label key={p.id} className="block">
                                    <input
                                        type="checkbox"
                                        checked={params.productIds?.includes(p.id) || false}
                                        onChange={e => {
                                            const sel = new Set<string>(params.productIds || [])
                                            e.target.checked ? sel.add(p.id) : sel.delete(p.id)
                                            setParams({ ...params, productIds: Array.from(sel) })
                                        }}
                                    />{' '}
                                    {p.name}
                                </label>
                            ))}
                        </fieldset>
                        <label>
                            Unidades de brinde*{' '}
                            <input
                                type="number"
                                value={params.qty || ''}
                                onChange={e => setParams({ ...params, qty: Number(e.target.value) })}
                            />
                        </label>
                    </>
                )

            case ActionType.PERCENT_CATEGORY:
                return (
                    <>
                        <fieldset>
                            <legend>Categoria*</legend>
                            {categories.map(c => (
                                <label key={c.id} className="block">
                                    <input
                                        type="checkbox"
                                        checked={params.categoryIds?.includes(c.id) || false}
                                        onChange={e => {
                                            const sel = new Set<string>(params.categoryIds || [])
                                            e.target.checked ? sel.add(c.id) : sel.delete(c.id)
                                            setParams({ ...params, categoryIds: Array.from(sel) })
                                        }}
                                    />{' '}
                                    {c.name}
                                </label>
                            ))}
                        </fieldset>
                        <label>
                            Percentual (%)*{' '}
                            <input
                                type="number"
                                value={params.percent || ''}
                                onChange={e => setParams({ ...params, percent: Number(e.target.value) })}
                            />
                        </label>
                    </>
                )

            case ActionType.PERCENT_VARIANT:
            case ActionType.PERCENT_PRODUCT:
                {
                    const list = type === ActionType.PERCENT_VARIANT ? variants : products
                    const key = type === ActionType.PERCENT_VARIANT ? 'variantIds' : 'productIds'
                    const labelList = type === ActionType.PERCENT_VARIANT ? 'sku' : 'name'

                    return (
                        <>
                            <fieldset>
                                <legend>{type === ActionType.PERCENT_VARIANT ? 'Variantes*' : 'Produtos*'}</legend>
                                {list.map(item => (
                                    <label key={item.id} className="block">
                                        <input
                                            type="checkbox"
                                            // @ts-ignore
                                            checked={params[key]?.includes(item.id) || false}
                                            onChange={e => {
                                                const sel = new Set<string>(params[key] || [])
                                                e.target.checked ? sel.add(item.id) : sel.delete(item.id)
                                                setParams({ ...params, [key]: Array.from(sel) })
                                            }}
                                        />{' '}
                                        {/* @ts-ignore */}
                                        {item[labelList]}
                                    </label>
                                ))}
                            </fieldset>
                            <label>
                                Percentual (%)*{' '}
                                <input
                                    type="number"
                                    value={params.percent || ''}
                                    onChange={e => setParams({ ...params, percent: Number(e.target.value) })}
                                />
                            </label>
                        </>
                    )
                }

            case ActionType.PERCENT_ITEM_COUNT:
                return (
                    <>
                        <fieldset>
                            <legend>Produto(s)*</legend>
                            {products.map(p => (
                                <label key={p.id} className="block">
                                    <input
                                        type="checkbox"
                                        checked={params.productIds?.includes(p.id) || false}
                                        onChange={e => {
                                            const sel = new Set<string>(params.productIds || [])
                                            e.target.checked ? sel.add(p.id) : sel.delete(p.id)
                                            setParams({ ...params, productIds: Array.from(sel) })
                                        }}
                                    />{' '}
                                    {p.name}
                                </label>
                            ))}
                        </fieldset>
                        <label>
                            Percentual (%)*{' '}
                            <input
                                type="number"
                                value={params.percent || ''}
                                onChange={e => setParams({ ...params, percent: Number(e.target.value) })}
                            />
                        </label>
                        <label>
                            Número de unidades*{' '}
                            <input
                                type="number"
                                value={params.qty || ''}
                                onChange={e => setParams({ ...params, qty: Number(e.target.value) })}
                            />
                        </label>
                    </>
                )

            case ActionType.PERCENT_EXTREME_ITEM:
                return (
                    <>
                        <fieldset>
                            <legend>Produto Variante*</legend>
                            {variants.map(v => (
                                <label key={v.id} className="block">
                                    <input
                                        type="checkbox"
                                        checked={params.variantIds?.includes(v.id) || false}
                                        onChange={e => {
                                            const sel = new Set<string>(params.variantIds || [])
                                            e.target.checked ? sel.add(v.id) : sel.delete(v.id)
                                            setParams({ ...params, variantIds: Array.from(sel) })
                                        }}
                                    />{' '}
                                    {v.sku}
                                </label>
                            ))}
                        </fieldset>
                        <label>
                            Percentual (%)*{' '}
                            <input
                                type="number"
                                value={params.percent || ''}
                                onChange={e => setParams({ ...params, percent: Number(e.target.value) })}
                            />
                        </label>
                        <fieldset>
                            <legend>Aplicar desconto em:</legend>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={params.lowest || false}
                                    onChange={() => setParams({ ...params, lowest: !params.lowest })}
                                />{' '}
                                De menor valor
                            </label>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={params.highest || false}
                                    onChange={() => setParams({ ...params, highest: !params.highest })}
                                />{' '}
                                De maior valor
                            </label>
                        </fieldset>
                    </>
                )

            case ActionType.PERCENT_BRAND_ITEMS:
            case ActionType.FIXED_BRAND_ITEMS:
                {
                    const isPercent = type === ActionType.PERCENT_BRAND_ITEMS
                    return (
                        <>
                            <label>
                                {isPercent ? 'Percentual (%)' : 'Valor (R$)'}*{' '}
                                <input
                                    type="number"
                                    value={params[isPercent ? 'percent' : 'amount'] || ''}
                                    onChange={e =>
                                        setParams({
                                            ...params,
                                            [isPercent ? 'percent' : 'amount']: Number(e.target.value)
                                        })
                                    }
                                />
                            </label>
                            <fieldset>
                                <legend>Marca(s)*</legend>
                                {brands.map(b => (
                                    <label key={b} className="block">
                                        <input
                                            type="checkbox"
                                            checked={params.brandNames?.includes(b) || false}
                                            onChange={e => {
                                                const sel = new Set<string>(params.brandNames || [])
                                                e.target.checked ? sel.add(b) : sel.delete(b)
                                                setParams({ ...params, brandNames: Array.from(sel) })
                                            }}
                                        />{' '}
                                        {b}
                                    </label>
                                ))}
                            </fieldset>
                        </>
                    )
                }

            case ActionType.PERCENT_SHIPPING:
            case ActionType.PERCENT_SUBTOTAL:
            case ActionType.PERCENT_TOTAL_NO_SHIPPING:
            case ActionType.PERCENT_TOTAL_PER_PRODUCT:
                return (
                    <label>
                        Percentual (%)*{' '}
                        <input
                            type="number"
                            value={params.amount || ''}
                            onChange={e => setParams({ ...params, amount: Number(e.target.value) })}
                        />
                    </label>
                )

            case ActionType.FIXED_SHIPPING:
            case ActionType.FIXED_SUBTOTAL:
            case ActionType.FIXED_TOTAL_NO_SHIPPING:
            case ActionType.FIXED_TOTAL_PER_PRODUCT:
            case ActionType.MAX_SHIPPING_DISCOUNT:
                return (
                    <label>
                        Valor (R$)*{' '}
                        <input
                            type="number"
                            value={params.amount || ''}
                            onChange={e => setParams({ ...params, amount: Number(e.target.value) })}
                        />
                    </label>
                )

            default:
                return null
        }
    }

    // Formata detalhes para exibição
    function formatDetails(a: ActionInput) {
        const p = a.params
        switch (a.type) {
            case ActionType.FIXED_VARIANT_DISCOUNT:
                return `Variantes: ${variants
                    .filter(v => p.variantIds?.includes(v.id))
                    .map(v => v.sku)
                    .join(', ')} | Valor: ${currency.format(p.amount)}`

            case ActionType.FIXED_PRODUCT_DISCOUNT:
                return `Produtos: ${products
                    .filter(pdt => p.variantIds?.includes(pdt.id))
                    .map(pdt => pdt.name)
                    .join(', ')} | Valor: ${currency.format(p.amount)}`

            case ActionType.FREE_VARIANT_ITEM:
                return `Brinde variantes: ${variants
                    .filter(v => p.variantIds?.includes(v.id))
                    .map(v => v.sku)
                    .join(', ')} | Qtd: ${p.qty}`

            case ActionType.FREE_PRODUCT_ITEM:
                return `Brinde produtos: ${products
                    .filter(pdt => pdt.id && p.productIds?.includes(pdt.id))
                    .map(pdt => pdt.name)
                    .join(', ')} | Qtd: ${p.qty}`

            case ActionType.PERCENT_CATEGORY:
                return `Categorias: ${categories
                    .filter(c => p.categoryIds?.includes(c.id))
                    .map(c => c.name)
                    .join(', ')} | Desconto: ${percent(p.percent)}`

            case ActionType.PERCENT_VARIANT:
            case ActionType.PERCENT_PRODUCT:
                {
                    const list = a.type === ActionType.PERCENT_VARIANT ? variants : products
                    const names = list
                        .filter(item => {
                            const key = a.type === ActionType.PERCENT_VARIANT ? 'variantIds' : 'productIds'
                            // @ts-ignore
                            return p[key]?.includes(item.id)
                        })
                        .map(item => 'sku' in item ? item.sku : (item as any).name)
                    return `${a.type === ActionType.PERCENT_VARIANT ? 'Variantes' : 'Produtos'}: ${names.join(', ')} | Desconto: ${percent(p.percent)}`
                }

            case ActionType.PERCENT_ITEM_COUNT:
                return `Produtos: ${products
                    .filter(pdt => p.productIds?.includes(pdt.id))
                    .map(pdt => pdt.name)
                    .join(', ')} | ${percent(p.percent)} em ${p.qty} unidades`

            case ActionType.PERCENT_EXTREME_ITEM:
                {
                    const skus = variants
                        .filter(v => p.variantIds?.includes(v.id))
                        .map(v => v.sku)
                    const modes = [
                        p.lowest ? 'menor valor' : null,
                        p.highest ? 'maior valor' : null
                    ].filter(Boolean).join(', ')
                    return `Variantes: ${skus.join(', ')} | ${percent(p.percent)} | ${modes}`
                }

            case ActionType.PERCENT_BRAND_ITEMS:
            case ActionType.FIXED_BRAND_ITEMS:
                {
                    const valLabel = a.type === ActionType.PERCENT_BRAND_ITEMS
                        ? percent(p.percent)
                        : currency.format(p.amount)
                    return `Marcas: ${p.brandNames?.join(', ')} | Valor: ${valLabel}`
                }

            case ActionType.PERCENT_SHIPPING:
            case ActionType.PERCENT_SUBTOTAL:
            case ActionType.PERCENT_TOTAL_NO_SHIPPING:
            case ActionType.PERCENT_TOTAL_PER_PRODUCT:
                return `Desconto: ${percent(p.amount)}`

            case ActionType.FIXED_SHIPPING:
            case ActionType.FIXED_SUBTOTAL:
            case ActionType.FIXED_TOTAL_NO_SHIPPING:
            case ActionType.FIXED_TOTAL_PER_PRODUCT:
            case ActionType.MAX_SHIPPING_DISCOUNT:
                return `Valor: ${currency.format(p.amount)}`

            default:
                return JSON.stringify(p)
        }
    }

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold">Passo 3: Defina as Ações</h2>

            <div>
                <label className="block mb-1">Ação*</label>
                <select
                    value={type}
                    onChange={e => setType(e.target.value as ActionType)}
                    className="w-full border p-1 rounded"
                >
                    {actionOptions.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                </select>
            </div>

            <div className="space-y-4">{renderFields()}</div>

            <button
                type="button"
                onClick={saveAction}
                className="px-4 py-2 bg-blue-600 text-white rounded"
            >
                Adicionar Ação
            </button>

            <h3 className="mt-6 font-medium">Ações Cadastradas</h3>
            <table className="w-full border-collapse">
                <thead>
                    <tr className="border-b bg-gray-100">
                        <th className="p-2 text-left">Ação</th>
                        <th className="p-2 text-left">Detalhes</th>
                        <th className="p-2"></th>
                    </tr>
                </thead>
                <tbody>
                    {data.actions?.map((a, i) => {
                        const label = actionOptions.find(o => o.value === a.type)?.label
                        const details = formatDetails(a)
                        return (
                            <tr key={i} className="border-b hover:bg-gray-50">
                                <td className="p-2">{label}</td>
                                <td className="p-2">{details}</td>
                                <td className="p-2">
                                    <button
                                        type="button"
                                        onClick={() => removeAction(i)}
                                        className="text-red-600 hover:underline"
                                    >
                                        Remover
                                    </button>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>

            <div className="flex justify-between mt-6">
                <button
                    type="button"
                    onClick={onBack}
                    className="px-4 py-2 border rounded"
                >
                    Voltar
                </button>
                <button
                    type="button"
                    onClick={onNext}
                    className="px-4 py-2 bg-green-600 text-white rounded"
                >
                    Próximo
                </button>
            </div>
        </div>
    )
}