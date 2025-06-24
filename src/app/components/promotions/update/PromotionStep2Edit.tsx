'use client'
import React, { useState, useEffect } from 'react'
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
    CATEGORY_ITEM_COUNT: ['EQUAL', 'GREATER', 'GREATER_EQUAL', 'LESS', 'LESS_EQUAL'], // permite várias lógicas
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
}

interface MultiSelectOption {
    value: string
    label: string
}

interface MultiSelectProps {
    label: string
    options: MultiSelectOption[]
    selected: string[]
    onChange: (newSelected: string[]) => void
}

function MultiSelect({
    label,
    options,
    selected,
    onChange
}: MultiSelectProps) {
    const [open, setOpen] = useState(false)

    const toggle = (val: string) =>
        selected.includes(val)
            ? onChange(selected.filter(x => x !== val))
            : onChange([...selected, val])

    return (
        <div className="relative">
            <span className="block mb-1 font-medium text-black">{label}</span>
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className="w-full text-left border p-2 rounded flex justify-between items-center bg-white"
            >
                <span className="truncate text-black">
                    {selected.length > 0
                        ? `${selected.length} selecionado${selected.length > 1 ? 's' : ''}`
                        : 'Nenhum selecionado'}
                </span>
                <svg
                    className={`w-4 h-4 transform transition-transform ${open ? 'rotate-180' : ''
                        }`}
                    viewBox="0 0 20 20"
                >
                    <path d="M5.5 8l4.5 4.5L14.5 8h-9z" fill="currentColor" />
                </svg>
            </button>

            {open && (
                <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow-lg max-h-60 overflow-auto">
                    {options.map(opt => (
                        <label
                            key={opt.value}
                            className="flex items-center px-3 py-2 hover:bg-gray-100 text-black"
                        >
                            <input
                                type="checkbox"
                                checked={selected.includes(opt.value)}
                                onChange={() => toggle(opt.value)}
                                className="mr-2"
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
                            <span
                                key={o.value}
                                className="flex items-center bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm"
                            >
                                {o.label}
                                <button
                                    type="button"
                                    onClick={() => toggle(o.value)}
                                    className="ml-1 text-green-600 hover:text-green-900"
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

export default function PromotionStep2Edit({
    initialConditions,
    onSave,
    onBack,
    onNext
}: Props) {
    const api = setupAPIClientEcommerce()

    // **local state para toda a lista de condições**
    const [conds, setConds] = useState<ConditionInput[]>([...initialConditions])

    // estado para criar nova condição
    const [type, setType] = useState<ConditionKey>(conditionOptions[0].value)
    const [operator, setOperator] = useState<string>(logicMap[type][0])
    const [payload, setPayload] = useState<any>({})
    const [logicOptions, setLogicOptions] = useState<string[]>(logicMap[type])

    // dados auxiliares (produtos, categorias, etc)
    const [products, setProducts] = useState<{ id: string; name: string }[]>([])
    const [variants, setVariants] = useState<{ id: string; sku: string }[]>([])
    const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
    const [users, setUsers] = useState<{ id: string; email: string }[]>([])
    const [brands, setBrands] = useState<string[]>([])

    // ao trocar type, reseta operador e payload
    useEffect(() => {
        const opts = logicMap[type] || []
        setLogicOptions(opts)
        setOperator(opts[0] || '')
        setPayload({})
    }, [type])

    // carrega seleções externas só no mount
    useEffect(() => {
        api.get('/get/products')
    .then(r => {
      // supondo que r.data.allow_products seja um array de { id, name, brand, ... }
      const prods = r.data.allow_products as Array<{
          brand: any; id: string; name: string 
}>
      setProducts(prods)
      // preencher brands também, como antes
      const rawBrands: any[] = prods.map(p => p.brand)
      const onlyStrings = rawBrands.filter((b): b is string => typeof b === 'string')
      setBrands(Array.from(new Set(onlyStrings)))
    })
    .catch(() => toast.error('Erro ao carregar produtos'))
        api.get('/variant/get').then(r =>
            setVariants(r.data.map((v: any) => ({ id: v.id, sku: v.sku })))
        )
        api.get('/category/cms').then(r =>
            setCategories(r.data.all_categories_disponivel.map((c: any) => ({ id: c.id, name: c.name })))
        )
        api.get('/user/customer/all_users_customer').then(r =>
            setUsers(r.data.all_customers)
        )
    }, [])

    const productOptions: MultiSelectOption[] = products.map(p => ({
        value: p.id,
        label: p.name
    }))
    const variantOptions: MultiSelectOption[] = variants.map(v => ({
        value: v.id,
        label: v.sku
    }))
    const categoryOptions: MultiSelectOption[] = categories.map(c => ({
        value: c.id,
        label: c.name
    }))
    const userOptions: MultiSelectOption[] = users.map(u => ({
        value: u.id,
        label: u.email
    }))
    const brandOptions: MultiSelectOption[] = brands.map(b => ({
        value: b,
        label: b
    }))

    const stateOptions: MultiSelectOption[] = brazilStates.map(s => ({
        value: s,
        label: s
    }))

    function saveSingle() {
        const c: ConditionInput = { type, operator, value: payload }
        setConds(cs => [...cs, c])
        // reset para próxima
        setType(conditionOptions[0].value)
    }

    function removeAt(idx: number) {
        setConds(cs => cs.filter((_, i) => i !== idx))
    }

    // renderização dos campos extras (mantenha o switch/case do seu código)
    function renderExtra() {
        switch (type) {
            case 'FIRST_ORDER':
                return <label><input
                    type="checkbox"
                    checked={payload.firstOrder || false}
                    onChange={() => setPayload((p: any) => ({ ...p, firstOrder: !p.firstOrder }))}
                    className='text-black'
                /> Primeira compra?</label>

            case 'CART_ITEM_COUNT':
                return <input type="number" placeholder="Qtd"
                    value={payload.qty || ''}
                    onChange={e => setPayload((p: any) => ({ ...p, qty: Number(e.target.value) }))}
                    className="border p-1 rounded w-full text-black" />

            case 'UNIQUE_VARIANT_COUNT':
                return <>
                    <button type="button" className="underline text-foreground" onClick={() => {
                    }}>Adicionar Produto(s) Variante(s)</button>
                    <div className="text-sm text-foreground mb-2">
                        Se vazio, considera todas as variantes.
                    </div>
                    {variants.map(v => (
                        <label key={v.id} className="block">
                            <input type="checkbox"
                                checked={payload.variantIds?.includes(v.id) || false}
                                onChange={e => {
                                    const sel = new Set<string>(payload.variantIds || [])
                                    e.target.checked ? sel.add(v.id) : sel.delete(v.id)
                                    setPayload((p: any) => ({ ...p, variantIds: [...sel] }))
                                }}
                            /> {v.sku}
                        </label>
                    ))}
                    <input type="number" placeholder="Qtd mín."
                        value={payload.qty || ''}
                        onChange={e => setPayload((p: any) => ({ ...p, qty: Number(e.target.value) }))}
                        className="border p-1 rounded w-full mt-2 text-black" />
                </>

            case 'ZIP_CODE':
                return <div className="flex gap-2">
                    <input type="text" placeholder="CEP Inicial"
                        value={payload.zipFrom || ''}
                        onChange={e => setPayload((p: any) => ({ ...p, zipFrom: e.target.value }))}
                        className="border p-1 rounded flex-1 text-black" />
                    <input type="text" placeholder="CEP Final"
                        value={payload.zipTo || ''}
                        onChange={e => setPayload((p: any) => ({ ...p, zipTo: e.target.value }))}
                        className="border p-1 rounded flex-1 text-black" />
                </div>

            case 'PRODUCT_CODE':
                return <MultiSelect
                    label="Selecione Produtos"
                    options={productOptions}
                    selected={payload.productIds || []}
                    onChange={arr =>
                        setPayload((p: any) => ({ ...p, productIds: arr }))
                    }
                />

            case 'VARIANT_CODE':
                return <MultiSelect
                    label="Selecione Variantes"
                    options={variantOptions}
                    selected={payload.variantIds || []}
                    onChange={arr =>
                        setPayload((p: any) => ({ ...p, variantIds: arr }))
                    }
                />

            case 'STATE':
                return <MultiSelect
                    label="Selecione Estados"
                    options={stateOptions}
                    selected={payload.states || []}
                    onChange={arr =>
                        setPayload((p: any) => ({ ...p, states: arr }))
                    }
                />

            case 'CATEGORY':
                return <MultiSelect
                    label="Selecione Categorias"
                    options={categoryOptions}
                    selected={payload.categoryIds || []}
                    onChange={arr =>
                        setPayload((p: any) => ({ ...p, categoryIds: arr }))
                    }
                />

            case 'CATEGORY_ITEM_COUNT':
                return <>
                    <MultiSelect
                        label="Selecione Categorias"
                        options={categoryOptions}
                        selected={payload.categoryIds || []}
                        onChange={arr =>
                            setPayload((p: any) => ({ ...p, categoryIds: arr }))
                        }
                    />
                    <input type="number" placeholder="Qtd"
                        value={payload.qty || ''}
                        onChange={e => setPayload((p: any) => ({ ...p, qty: Number(e.target.value) }))}
                        className="border p-1 rounded w-full mt-2 text-black" />
                </>

            case 'CATEGORY_VALUE':
                return <>
                    <MultiSelect
                        label="Selecione Categorias"
                        options={categoryOptions}
                        selected={payload.categoryIds || []}
                        onChange={arr =>
                            setPayload((p: any) => ({ ...p, categoryIds: arr }))
                        }
                    />
                    <input type="number" placeholder="Valor"
                        value={payload.qtyOrValue || ''}
                        onChange={e => setPayload((p: any) => ({ ...p, qtyOrValue: Number(e.target.value) }))}
                        className="border p-1 rounded w-full mt-2 text-black" />
                </>

            case 'BRAND_VALUE':
                return <>
                    <button type="button" className="underline text-black">Adicionar Marca(s)</button>
                    {brands.map(b => (
                        <label key={b} className="block">
                            <input type="checkbox"
                                checked={payload.brandNames?.includes(b) || false}
                                onChange={e => {
                                    const sel = new Set<string>(payload.brandNames || [])
                                    e.target.checked ? sel.add(b) : sel.delete(b)
                                    setPayload((p: any) => ({ ...p, brandNames: [...sel] }))
                                }}
                            /> {b}
                        </label>
                    ))}
                    <input type="number" placeholder="Valor"
                        value={payload.brandValue || ''}
                        onChange={e => setPayload((p: any) => ({ ...p, brandValue: Number(e.target.value) }))}
                        className="border p-1 rounded w-full mt-2 text-black" />
                </>

            case 'VARIANT_ITEM_COUNT':
                return <>
                    <MultiSelect
                        label="Selecione Variantes"
                        options={variantOptions}
                        selected={payload.variantIds || []}
                        onChange={arr =>
                            setPayload((p: any) => ({ ...p, variantIds: arr }))
                        }
                    />
                    <input type="number" placeholder="Qtd"
                        value={payload.qty || ''}
                        onChange={e => setPayload((p: any) => ({ ...p, qty: Number(e.target.value) }))}
                        className="border p-1 rounded w-full mt-2 text-black" />
                </>

            case 'PRODUCT_ITEM_COUNT':
                return <>
                    <MultiSelect
                        label="Selecione Produtos"
                        options={productOptions}
                        selected={payload.productIds || []}
                        onChange={arr =>
                            setPayload((p: any) => ({ ...p, productIds: arr }))
                        }
                    />
                    <input type="number" placeholder="Qtd"
                        value={payload.qty || ''}
                        onChange={e => setPayload((p: any) => ({ ...p, qty: Number(e.target.value) }))}
                        className="border p-1 rounded w-full mt-2 text-black" />
                </>

            case 'PERSON_TYPE':
                return (
                    <select className="border p-1 rounded w-full text-black"
                        value={payload.personType || ''}
                        onChange={e => setPayload((p: any) => ({ ...p, personType: e.target.value }))}
                    >
                        <option className='text-black' value="">Selecione...</option>
                        <option className='text-black' value="FISICA">Física</option>
                        <option className='text-black' value="JURIDICA">Jurídica</option>
                    </select>
                )

            case 'USER':
                return (
                    <MultiSelect
                        label="Selecione Usuários"
                        options={userOptions}
                        selected={payload.userIds || []}
                        onChange={arr =>
                            setPayload((p: any) => ({ ...p, userIds: arr }))
                        }
                    />
                )

            case 'SUBTOTAL_VALUE':
            case 'TOTAL_VALUE':
                return (
                    <input type="number" placeholder="Valor"
                        value={payload.amount || ''}
                        onChange={e => setPayload((p: any) => ({ ...p, amount: Number(e.target.value) }))}
                        className="border p-1 rounded w-full text-black" />
                )

            default:
                return null
        }
    }

    // função para formatar pra exibição no preview da tabela
    function fmt(c: ConditionInput): string {
        const v = c.value as any
        switch (c.type) {
            case 'FIRST_ORDER':
                return `Primeira compra: ${v.firstOrder ? 'Sim' : 'Não'}`
            case 'CART_ITEM_COUNT':
                return `Qtd itens no carrinho ${logicLabels[c.operator]} ${v.qty}`
            case 'UNIQUE_VARIANT_COUNT':
                const skus = variants.filter(vt => v.variantIds?.includes(vt.id)).map(vt => vt.sku)
                return `Qtd variantes ${logicLabels[c.operator]} ${v.qty} em ${skus.join(', ')}`
            case 'ZIP_CODE':
                return `CEP ${logicLabels[c.operator]} ${v.zipFrom}–${v.zipTo}`
            case 'PRODUCT_CODE':
                const pnames = products.filter(p => v.productIds?.includes(p.id)).map(p => p.name)
                return `Produtos ${logicLabels[c.operator]} ${pnames.join(', ')}`
            case 'VARIANT_CODE':
                const vsks = variants.filter(vt => v.variantIds?.includes(vt.id)).map(vt => vt.sku)
                return `Variantes ${logicLabels[c.operator]} ${vsks.join(', ')}`
            case 'STATE':
                return `Estados ${logicLabels[c.operator]} ${v.states.join(', ')}`
            case 'CATEGORY':
                const cnames = categories.filter(cat => v.categoryIds?.includes(cat.id)).map(cat => cat.name)
                return `Categorias ${logicLabels[c.operator]} ${cnames.join(', ')}`
            case 'CATEGORY_ITEM_COUNT':
                const cn = categories.filter(cat => v.categoryIds?.includes(cat.id)).map(cat => cat.name)
                return `Qtd produtos em ${cn.join(', ')} ${logicLabels[c.operator]} ${v.qty}`
            case 'CATEGORY_VALUE':
                const cn2 = categories.filter(cat => v.categoryIds?.includes(cat.id)).map(cat => cat.name)
                return `Valor em ${cn2.join(', ')} ${logicLabels[c.operator]} ${currency.format(v.qtyOrValue)}`
            case 'BRAND_VALUE':
                return `Valor marca(s) ${logicLabels[c.operator]} ${currency.format(v.brandValue)} em ${v.brandNames?.join(', ')}`
            case 'VARIANT_ITEM_COUNT':
                const vs2 = variants.filter(vt => v.variantIds?.includes(vt.id)).map(vt => vt.sku)
                return `Qtd variante(s) em ${vs2.join(', ')} a cada ${v.qty}`
            case 'PRODUCT_ITEM_COUNT':
                const pn = products.filter(p => v.productIds?.includes(p.id)).map(p => p.name)
                return `Qtd produto(s) em ${pn.join(', ')} ${logicLabels[c.operator]} ${v.qty}`
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

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold">Passo 2: Condições</h2>

            {/* Tabela de preview */}
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
                                <button
                                    onClick={() => removeAt(i)}
                                    className="text-red-600 hover:underline"
                                >Remover</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Form de nova condição */}
            <div className="grid md:grid-cols-3 gap-4">
                <div>
                    <label className="block mb-1">Condição</label>
                    <select
                        value={type}
                        onChange={e => setType(e.target.value as ConditionKey)}
                        className="w-full border p-2 rounded text-black"
                    >
                        {conditionOptions.map(o =>
                            <option key={o.value} value={o.value}>{o.label}</option>
                        )}
                    </select>
                </div>
                <div>
                    <label className="block mb-1">Lógica</label>
                    <select
                        value={operator}
                        onChange={e => setOperator(e.target.value)}
                        className="w-full border p-2 rounded text-black"
                    >
                        {logicOptions.map(lo =>
                            <option key={lo} value={lo}>{logicLabels[lo]}</option>
                        )}
                    </select>
                </div>
                <div>
                    {renderExtra()}
                </div>
            </div>

            {/* Botões de ação */}
            <div className="flex justify-between">
                <button
                    onClick={onBack}
                    className="px-4 py-2 bg-gray-200 rounded text-black"
                >Voltar</button>

                <button
                    onClick={saveSingle}
                    className="px-4 py-2 bg-violet-600 text-white rounded"
                >Adicionar Condição</button>

                <button
                    onClick={async () => {
                        await onSave(conds)
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded"
                >Salvar Condições</button>

                <button
                    onClick={onNext}
                    className="px-4 py-2 bg-orange-500 text-white rounded"
                >Próximo</button>
            </div>
        </div>
    )
}