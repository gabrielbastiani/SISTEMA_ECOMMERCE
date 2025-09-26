'use client'

import React, { useEffect, useRef, useState } from 'react'
import { toast } from 'react-toastify'
import { setupAPIClientEcommerce } from '@/app/services/apiEcommerce'
import { ConditionInput } from 'Types/types'

const conditionOptions = [
    { value: 'FIRST_ORDER', label: 'Se 1ª compra' },
    { value: 'CART_ITEM_COUNT', label: 'Se a quantidade de produtos no carrinho for' },
    { value: 'UNIQUE_VARIANT_COUNT', label: 'Se a quantidade de variantes únicas for' },
    { value: 'ZIP_CODE', label: 'Se CEP' },
    { value: 'PRODUCT_CODE', label: 'Se código do produto' },
    { value: 'VARIANT_CODE', label: 'Se código do produto variante' },
    { value: 'STATE', label: 'Se o estado no país for' },
    { value: 'CATEGORY', label: 'Se a categoria' },
    { value: 'CATEGORY_ITEM_COUNT', label: 'Se na categoria X a quantidade de produtos for X' },
    { value: 'CATEGORY_VALUE', label: 'Se para a categoria X o valor for' },
    { value: 'BRAND_VALUE', label: 'Se para a marca X o valor for' },
    { value: 'VARIANT_ITEM_COUNT', label: 'Se para o produto variante X a quantidade for' },
    { value: 'PRODUCT_ITEM_COUNT', label: 'Se para o produto X a quantidade for' },
    { value: 'PERSON_TYPE', label: 'Se tipo de cadastro (pessoa)' },
    { value: 'USER', label: 'Se o usuário for' },
    { value: 'SUBTOTAL_VALUE', label: 'Se valor subtotal' },
    { value: 'TOTAL_VALUE', label: 'Se valor total' }
] as const
type ConditionKey = typeof conditionOptions[number]['value']

const logicMap: Record<string, string[]> = {
    FIRST_ORDER: ['EQUAL'],
    CART_ITEM_COUNT: ['EQUAL', 'GREATER', 'GREATER_EQUAL', 'LESS', 'LESS_EQUAL'],
    UNIQUE_VARIANT_COUNT: ['NOT_EQUAL', 'EQUAL', 'GREATER', 'GREATER_EQUAL', 'LESS', 'LESS_EQUAL'],
    ZIP_CODE: ['CONTAINS', 'NOT_CONTAINS'],
    PRODUCT_CODE: ['NOT_EQUAL', 'CONTAINS', 'EQUAL', 'GREATER', 'GREATER_EQUAL', 'LESS', 'LESS_EQUAL', 'NOT_CONTAINS'],
    VARIANT_CODE: ['NOT_EQUAL', 'CONTAINS', 'EQUAL', 'GREATER', 'GREATER_EQUAL', 'LESS', 'LESS_EQUAL', 'NOT_CONTAINS'],
    STATE: ['NOT_EQUAL', 'CONTAINS', 'EQUAL', 'NOT_CONTAINS'],
    CATEGORY: ['EVERY', 'NOT_EQUAL', 'CONTAINS', 'EQUAL', 'GREATER', 'GREATER_EQUAL', 'LESS', 'LESS_EQUAL', 'NOT_CONTAINS'],
    CATEGORY_ITEM_COUNT: ['EQUAL', 'GREATER', 'GREATER_EQUAL', 'LESS', 'LESS_EQUAL'],
    CATEGORY_VALUE: ['EQUAL', 'GREATER', 'GREATER_EQUAL', 'LESS', 'LESS_EQUAL'],
    BRAND_VALUE: ['EQUAL', 'GREATER', 'GREATER_EQUAL', 'LESS', 'LESS_EQUAL'],
    VARIANT_ITEM_COUNT: ['EVERY'],
    PRODUCT_ITEM_COUNT: ['EQUAL', 'GREATER', 'GREATER_EQUAL', 'LESS', 'LESS_EQUAL'],
    PERSON_TYPE: ['EQUAL'],
    USER: ['CONTAINS', 'EQUAL', 'NOT_CONTAINS'],
    SUBTOTAL_VALUE: ['EQUAL', 'GREATER', 'GREATER_EQUAL', 'LESS', 'LESS_EQUAL'],
    TOTAL_VALUE: ['EQUAL', 'GREATER', 'GREATER_EQUAL', 'LESS', 'LESS_EQUAL', 'CONTAINS', 'NOT_CONTAINS']
}

const logicLabels: Record<string, string> = {
    EQUAL: 'Igual',
    NOT_EQUAL: 'Diferente',
    GREATER: 'Maior',
    GREATER_EQUAL: 'Maior ou igual',
    LESS: 'Menor',
    LESS_EQUAL: 'Menor ou igual',
    CONTAINS: 'Está contido',
    NOT_CONTAINS: 'Não está contido',
    EVERY: 'A cada'
}

const brazilStates = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
    'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
    'SP', 'SE', 'TO'
]

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

interface Props {
    initialConditions: ConditionInput[]
    onSave: (conds: ConditionInput[]) => Promise<void>
    onBack: () => void
    onNext: () => void
    isSaving?: boolean
}

interface MultiSelectOption {
    value: string
    label: string
}

function MultiSelect({
    label,
    options,
    selected,
    onChange,
    disabled = false
}: {
    label: string
    options: MultiSelectOption[]
    selected: string[]
    onChange: (newSelected: string[]) => void
    disabled?: boolean
}) {
    const [open, setOpen] = useState(false)

    const toggle = (val: string) =>
        selected.includes(val) ? onChange(selected.filter(x => x !== val)) : onChange([...selected, val])

    return (
        <div className="relative">
            <span className="block mb-1 font-medium text-black">{label}</span>
            <button type="button" onClick={() => setOpen(o => !o)} className="w-full text-left border p-2 rounded flex justify-between items-center bg-white" disabled={disabled}>
                <span className="truncate text-black">{selected.length > 0 ? `${selected.length} selecionado${selected.length > 1 ? 's' : ''}` : 'Nenhum selecionado'}</span>
                <svg className={`w-4 h-4 transform transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 20 20"><path d="M5.5 8l4.5 4.5L14.5 8h-9z" fill="currentColor" /></svg>
            </button>

            {open && (
                <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow-lg max-h-60 overflow-auto">
                    {options.map(opt => (
                        <label key={opt.value} className="flex items-center px-3 py-2 hover:bg-gray-100 text-black">
                            <input type="checkbox" checked={selected.includes(opt.value)} onChange={() => toggle(opt.value)} className="mr-2" disabled={disabled} />
                            <span className="truncate">{opt.label}</span>
                        </label>
                    ))}
                </div>
            )}

            {selected.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                    {options.filter(o => selected.includes(o.value)).map(o => (
                        <span key={o.value} className="flex items-center bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
                            {o.label}
                            <button type="button" onClick={() => toggle(o.value)} className="ml-1 text-green-600 hover:text-green-900" disabled={disabled}>×</button>
                        </span>
                    ))}
                </div>
            )}
        </div>
    )
}

export default function PromotionStep2Edit({ initialConditions, onSave, onBack, onNext, isSaving = false }: Props) {
    // apiRef estável
    const apiRef = useRef<any | null>(null)
    if (!apiRef.current) apiRef.current = setupAPIClientEcommerce()

    const [conds, setConds] = useState<ConditionInput[]>([...initialConditions])
    const [type, setType] = useState<ConditionKey>(conditionOptions[0].value)
    const [operator, setOperator] = useState<string>(logicMap[type][0])
    const [payload, setPayload] = useState<any>({})
    const [logicOptions, setLogicOptions] = useState<string[]>(logicMap[type])

    const [products, setProducts] = useState<{ id: string; name: string }[]>([])
    const [variants, setVariants] = useState<{ id: string; sku: string }[]>([])
    const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
    const [users, setUsers] = useState<{ id: string; email: string }[]>([])
    const [brands, setBrands] = useState<string[]>([])

    const [loadingOptions, setLoadingOptions] = useState(true)

    useEffect(() => {
        const opts = logicMap[type] || []
        setLogicOptions(opts)
        setOperator(opts[0] || '')
        setPayload({})
    }, [type])

    useEffect(() => {
        let mounted = true
        async function loadAll() {
            try {
                setLoadingOptions(true)
                const api = apiRef.current
                const [pRes, vRes, cRes, uRes] = await Promise.all([
                    api.get('/get/products'),
                    api.get('/variant/get'),
                    api.get('/category/cms'),
                    api.get('/user/customer/all_users_customer')
                ])

                if (!mounted) return

                const prods = (pRes?.data?.allow_products || []) as any[]
                setProducts(prods.map(p => ({ id: p.id, name: p.name })))

                setVariants((vRes?.data || []).map((v: any) => ({ id: v.id, sku: v.sku })))

                const cats = (cRes?.data?.all_categories_disponivel || [])
                setCategories(cats.map((c: any) => ({ id: c.id, name: c.name })))

                setUsers(uRes?.data?.all_customers || [])

                const uniqueBrands = Array.from(new Set(prods.map(p => p.brand).filter(Boolean)))
                setBrands(uniqueBrands)
            } catch (err) {
                console.error('Erro ao carregar opções PromotionStep2Edit', err)
                toast.error('Falha ao carregar opções.')
            } finally {
                if (mounted) setLoadingOptions(false)
            }
        }
        loadAll()
        return () => { mounted = false }
    }, [])

    const productOptions: MultiSelectOption[] = products.map(p => ({ value: p.id, label: p.name }))
    const variantOptions: MultiSelectOption[] = variants.map(v => ({ value: v.id, label: v.sku }))
    const categoryOptions: MultiSelectOption[] = categories.map(c => ({ value: c.id, label: c.name }))
    const userOptions: MultiSelectOption[] = users.map(u => ({ value: u.id, label: u.email }))
    const stateOptions: MultiSelectOption[] = brazilStates.map(s => ({ value: s, label: s }))

    function saveSingle() {
        const c: ConditionInput = { type, operator, value: payload }
        setConds(cs => [...cs, c])
        setType(conditionOptions[0].value)
    }

    function removeAt(idx: number) {
        setConds(cs => cs.filter((_, i) => i !== idx))
    }

    function renderExtra() {
        if (loadingOptions) {
            return (
                <div className="space-y-2 animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-full" />
                    <div className="h-8 bg-gray-200 rounded w-3/4" />
                    <div className="h-8 bg-gray-200 rounded w-1/2" />
                </div>
            )
        }

        switch (type) {
            case 'FIRST_ORDER':
                return <label><input type="checkbox" checked={payload.firstOrder || false} onChange={() => setPayload((p: any) => ({ ...p, firstOrder: !p.firstOrder }))} className='text-black' disabled={isSaving} /> Primeira compra?</label>

            case 'CART_ITEM_COUNT':
                return <input type="number" placeholder="Qtd" value={payload.qty || ''} onChange={e => setPayload((p: any) => ({ ...p, qty: Number(e.target.value) }))} className="border p-1 rounded w-full text-black" disabled={isSaving} />

            case 'UNIQUE_VARIANT_COUNT':
                return <>
                    <div className="text-sm text-foreground mb-2">Se vazio, considera todas as variantes.</div>
                    {variantOptions.map(v => (
                        <label key={v.value} className="block">
                            <input type="checkbox" checked={payload.variantIds?.includes(v.value) || false} onChange={e => {
                                const sel = new Set<string>(payload.variantIds || [])
                                e.target.checked ? sel.add(v.value) : sel.delete(v.value)
                                setPayload((p: any) => ({ ...p, variantIds: [...sel] }))
                            }} disabled={isSaving} /> {v.label}
                        </label>
                    ))}
                    <input type="number" placeholder="Qtd mín." value={payload.qty || ''} onChange={e => setPayload((p: any) => ({ ...p, qty: Number(e.target.value) }))} className="border p-1 rounded w-full mt-2 text-black" disabled={isSaving} />
                </>

            case 'ZIP_CODE':
                return <div className="flex gap-2">
                    <input type="text" placeholder="CEP Inicial" value={payload.zipFrom || ''} onChange={e => setPayload((p: any) => ({ ...p, zipFrom: e.target.value }))} className="border p-1 rounded flex-1 text-black" disabled={isSaving} />
                    <input type="text" placeholder="CEP Final" value={payload.zipTo || ''} onChange={e => setPayload((p: any) => ({ ...p, zipTo: e.target.value }))} className="border p-1 rounded flex-1 text-black" disabled={isSaving} />
                </div>

            case 'PRODUCT_CODE':
                return <MultiSelect label="Selecione Produtos" options={productOptions} selected={payload.productIds || []} onChange={arr => setPayload((p: any) => ({ ...p, productIds: arr }))} disabled={isSaving} />

            case 'VARIANT_CODE':
                return <MultiSelect label="Selecione Variantes" options={variantOptions} selected={payload.variantIds || []} onChange={arr => setPayload((p: any) => ({ ...p, variantIds: arr }))} disabled={isSaving} />

            case 'STATE':
                return <MultiSelect label="Selecione Estados" options={stateOptions} selected={payload.states || []} onChange={arr => setPayload((p: any) => ({ ...p, states: arr }))} disabled={isSaving} />

            case 'CATEGORY':
                return <MultiSelect label="Selecione Categorias" options={categoryOptions} selected={payload.categoryIds || []} onChange={arr => setPayload((p: any) => ({ ...p, categoryIds: arr }))} disabled={isSaving} />

            case 'CATEGORY_ITEM_COUNT':
                return <>
                    <MultiSelect label="Selecione Categorias" options={categoryOptions} selected={payload.categoryIds || []} onChange={arr => setPayload((p: any) => ({ ...p, categoryIds: arr }))} disabled={isSaving} />
                    <input type="number" placeholder="Qtd" value={payload.qty || ''} onChange={e => setPayload((p: any) => ({ ...p, qty: Number(e.target.value) }))} className="border p-1 rounded w-full mt-2 text-black" disabled={isSaving} />
                </>

            case 'CATEGORY_VALUE':
                return <>
                    <MultiSelect label="Selecione Categorias" options={categoryOptions} selected={payload.categoryIds || []} onChange={arr => setPayload((p: any) => ({ ...p, categoryIds: arr }))} disabled={isSaving} />
                    <input type="number" placeholder="Valor" value={payload.qtyOrValue || ''} onChange={e => setPayload((p: any) => ({ ...p, qtyOrValue: Number(e.target.value) }))} className="border p-1 rounded w-full mt-2 text-black" disabled={isSaving} />
                </>

            case 'BRAND_VALUE':
                return <>
                    {brands.map(b => (
                        <label key={b} className="block">
                            <input type="checkbox" checked={payload.brandNames?.includes(b) || false} onChange={e => {
                                const sel = new Set<string>(payload.brandNames || [])
                                e.target.checked ? sel.add(b) : sel.delete(b)
                                setPayload((p: any) => ({ ...p, brandNames: [...sel] }))
                            }} disabled={isSaving} /> {b}
                        </label>
                    ))}
                    <input type="number" placeholder="Valor" value={payload.brandValue || ''} onChange={e => setPayload((p: any) => ({ ...p, brandValue: Number(e.target.value) }))} className="border p-1 rounded w-full mt-2 text-black" disabled={isSaving} />
                </>

            case 'VARIANT_ITEM_COUNT':
                return <>
                    <MultiSelect label="Selecione Variantes" options={variantOptions} selected={payload.variantIds || []} onChange={arr => setPayload((p: any) => ({ ...p, variantIds: arr }))} disabled={isSaving} />
                    <input type="number" placeholder="Qtd" value={payload.qty || ''} onChange={e => setPayload((p: any) => ({ ...p, qty: Number(e.target.value) }))} className="border p-1 rounded w-full mt-2 text-black" disabled={isSaving} />
                </>

            case 'PRODUCT_ITEM_COUNT':
                return <>
                    <MultiSelect label="Selecione Produtos" options={productOptions} selected={payload.productIds || []} onChange={arr => setPayload((p: any) => ({ ...p, productIds: arr }))} disabled={isSaving} />
                    <input type="number" placeholder="Qtd" value={payload.qty || ''} onChange={e => setPayload((p: any) => ({ ...p, qty: Number(e.target.value) }))} className="border p-1 rounded w-full mt-2 text-black" disabled={isSaving} />
                </>

            case 'PERSON_TYPE':
                return (
                    <select className="border p-1 rounded w-full text-black" value={payload.personType || ''} onChange={e => setPayload((p: any) => ({ ...p, personType: e.target.value }))} disabled={isSaving}>
                        <option className='text-black' value="">Selecione...</option>
                        <option className='text-black' value="FISICA">Física</option>
                        <option className='text-black' value="JURIDICA">Jurídica</option>
                    </select>
                )

            case 'USER':
                return <MultiSelect label="Selecione Usuários" options={userOptions} selected={payload.userIds || []} onChange={arr => setPayload((p: any) => ({ ...p, userIds: arr }))} disabled={isSaving} />

            case 'SUBTOTAL_VALUE':
            case 'TOTAL_VALUE':
                return <input type="number" placeholder="Valor" value={payload.amount || ''} onChange={e => setPayload((p: any) => ({ ...p, amount: Number(e.target.value) }))} className="border p-1 rounded w-full text-black" disabled={isSaving} />

            default:
                return null
        }
    }

    function fmt(c: ConditionInput): string {
        const v = c.value as any
        switch (c.type) {
            case 'FIRST_ORDER':
                return `Primeira compra: ${v.firstOrder ? 'Sim' : 'Não'}`
            case 'CART_ITEM_COUNT':
                return `Qtd itens no carrinho ${logicLabels[c.operator]} ${v.qty}`
            case 'UNIQUE_VARIANT_COUNT':
                return `Qtd variantes ${logicLabels[c.operator]} ${v.qty} em ${variants.filter(vt => v.variantIds?.includes(vt.id)).map(vt => vt.sku).join(', ')}`
            case 'ZIP_CODE':
                return `CEP ${logicLabels[c.operator]} ${v.zipFrom}–${v.zipTo}`
            case 'PRODUCT_CODE':
                return `Produtos ${logicLabels[c.operator]} ${products.filter(p => v.productIds?.includes(p.id)).map(p => p.name).join(', ')}`
            case 'VARIANT_CODE':
                return `Variantes ${logicLabels[c.operator]} ${variants.filter(vt => v.variantIds?.includes(vt.id)).map(vt => vt.sku).join(', ')}`
            case 'STATE':
                return `Estados ${logicLabels[c.operator]} ${v.states.join(', ')}`
            case 'CATEGORY':
                return `Categorias ${logicLabels[c.operator]} ${categories.filter(cat => v.categoryIds?.includes(cat.id)).map(cat => cat.name).join(', ')}`
            case 'CATEGORY_ITEM_COUNT':
                return `Qtd produtos em ${categories.filter(cat => v.categoryIds?.includes(cat.id)).map(cat => cat.name).join(', ')} ${logicLabels[c.operator]} ${v.qty}`
            case 'CATEGORY_VALUE':
                return `Valor em ${categories.filter(cat => v.categoryIds?.includes(cat.id)).map(cat => cat.name).join(', ')} ${logicLabels[c.operator]} ${currency.format(v.qtyOrValue)}`
            case 'BRAND_VALUE':
                return `Valor marca(s) ${logicLabels[c.operator]} ${currency.format(v.brandValue)} em ${v.brandNames?.join(', ')}`
            case 'VARIANT_ITEM_COUNT':
                return `Qtd variante(s) em ${variants.filter(vt => v.variantIds?.includes(vt.id)).map(vt => vt.sku).join(', ')} a cada ${v.qty}`
            case 'PRODUCT_ITEM_COUNT':
                return `Qtd produto(s) em ${products.filter(p => v.productIds?.includes(p.id)).map(p => p.name).join(', ')} ${logicLabels[c.operator]} ${v.qty}`
            case 'PERSON_TYPE':
                return `Tipo pessoa = ${v.personType}`
            case 'USER':
                return `Usuários ${logicLabels[c.operator]} ${v.userIds.join(', ')}`
            case 'SUBTOTAL_VALUE':
                return `Subtotal ${logicLabels[c.operator]} ${currency.format(v.amount)}`
            case 'TOTAL_VALUE':
                return `Total ${logicLabels[c.operator]} ${currency.format(v.amount)}`
            default:
                return `${c.type} ${c.operator} ${JSON.stringify(c.value)}`
        }
    }

    const disabled = Boolean(isSaving)

    return (
        <div className="space-y-6 relative">
            {isSaving && (
                <div className="absolute inset-0 z-40 flex items-center justify-center bg-white/70">
                    <div className="animate-pulse w-full max-w-md p-6">
                        <div className="h-4 bg-gray-200 rounded mb-3" />
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-6" />
                        <div className="h-20 bg-gray-200 rounded" />
                        <div className="text-center mt-4 text-gray-700 font-medium">Salvando condições...</div>
                    </div>
                </div>
            )}

            <h2 className="text-xl font-semibold">Passo 2: Condições</h2>

            <table className="w-full border-collapse">
                <thead><tr className="bg-gray-100">
                    <th className="p-2 text-black">Condição</th>
                    <th className="p-2 text-black">Lógica</th>
                    <th className="p-2 text-black">Detalhes</th>
                    <th className="p-2 text-black"></th>
                </tr></thead>
                <tbody>
                    {conds.map((c, i) => (
                        <tr key={i} className="border-b">
                            <td className="p-2">{conditionOptions.find(o => o.value === c.type)?.label}</td>
                            <td className="p-2">{logicLabels[c.operator]}</td>
                            <td className="p-2">{fmt(c)}</td>
                            <td className="p-2">
                                <button onClick={() => removeAt(i)} className="text-red-600 hover:underline" disabled={disabled}>Remover</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="grid md:grid-cols-3 gap-4">
                <div>
                    <label className="block mb-1">Condição</label>
                    <select value={type} onChange={e => setType(e.target.value as ConditionKey)} className="w-full border p-2 rounded text-black" disabled={loadingOptions || disabled}>
                        {conditionOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block mb-1">Lógica</label>
                    <select value={operator} onChange={e => setOperator(e.target.value)} className="w-full border p-2 rounded text-black" disabled={loadingOptions || disabled}>
                        {logicOptions.map(lo => <option key={lo} value={lo}>{logicLabels[lo]}</option>)}
                    </select>
                </div>
                <div>
                    {renderExtra()}
                </div>
            </div>

            <div className="flex justify-between">
                <button onClick={onBack} className="px-4 py-2 bg-gray-200 rounded text-black" disabled={disabled}>Voltar</button>

                <div className="flex gap-2">
                    <button onClick={saveSingle} className="px-4 py-2 bg-violet-600 text-white rounded" disabled={disabled || loadingOptions}>Adicionar Condição</button>
                    <button onClick={async () => { await onSave(conds) }} className="px-4 py-2 bg-green-600 text-white rounded" disabled={disabled || loadingOptions}>Salvar Condições</button>
                    <button onClick={onNext} className="px-4 py-2 bg-orange-500 text-white rounded" disabled={disabled}>Próximo</button>
                </div>
            </div>
        </div>
    )
}
