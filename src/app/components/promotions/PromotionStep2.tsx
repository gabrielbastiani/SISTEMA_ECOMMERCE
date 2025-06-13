'use client'

import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { setupAPIClientEcommerce } from '@/app/services/apiEcommerce'
import { ConditionInput, CreatePromotionDto, PromotionWizardDto } from 'Types/types'

// Opções de condição
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

// Lógicas disponíveis
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

// Rótulos da lógica
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

// Siglas de estados
const brazilStates = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
  'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
  'SP', 'SE', 'TO'
]

// Formatadores
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const percent = (v: number) => `${v.toLocaleString('pt-BR')}%`

type ConditionKey = typeof conditionOptions[number]['value']
type LogicKey = string

interface Props {
  data: PromotionWizardDto
  setData: React.Dispatch<React.SetStateAction<PromotionWizardDto>>
  onBack: () => void
  onNext: () => void
}

export default function PromotionStep2({ data, setData, onBack, onNext }: Props) {
  const api = setupAPIClientEcommerce()

  const [type, setType] = useState<ConditionKey>('FIRST_ORDER')
  const [operator, setOperator] = useState<LogicKey>('EQUAL')
  const [payload, setPayload] = useState<any>({})
  const [logicOptions, setLogicOptions] = useState<string[]>(logicMap['FIRST_ORDER'])

  const [products, setProducts] = useState<{ id: string; name: string }[]>([])
  const [variants, setVariants] = useState<{ id: string; sku: string }[]>([])
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [users, setUsers] = useState<{ id: string; email: string }[]>([])
  const [brands, setBrands] = useState<string[]>([])

  // Atualiza lógicas
  useEffect(() => {
    const opts = logicMap[type] || []
    setLogicOptions(opts)
    setOperator(opts[0] || '')
    setPayload({})
  }, [type])

  // Carrega opções
  useEffect(() => {
    async function load() {
      try {
        const [pRes, vRes, cRes, uRes] = await Promise.all([
          api.get('/get/products'),
          api.get('/variant/get'),
          api.get('/category/cms'),
          api.get('/user/customer/all_users_customer')
        ])
        const prods = pRes.data.allow_products as any[]
        setProducts(prods.map(p => ({ id: p.id, name: p.name })))
        setVariants(vRes.data.map((v: any) => ({ id: v.id, sku: v.sku })))
        setCategories(cRes.data.all_categories_disponivel.map((c: any) => ({ id: c.id, name: c.name })))
        setUsers(uRes.data.all_customers)
        // extrai marcas únicas
        setBrands([...new Set(prods.map(p => p.brand).filter(Boolean))])
      } catch {
        toast.error('Falha ao carregar opções.')
      }
    }
    load()
  }, [])

  function saveCondition() {
    const cond: ConditionInput = { type, operator, value: payload }
    setData((d: any) => ({ ...d, conditions: [...(d.conditions || []), cond] }))
    setType('FIRST_ORDER')
  }
  function removeCondition(i: number) {
    setData((d: any) => ({ ...d, conditions: d.conditions!.filter((_: any, idx: number) => idx !== i) }))
  }

  // Campos dinâmicos
  function renderExtraFields() {
    switch (type) {
      case 'FIRST_ORDER':
        return <label><input
          type="checkbox"
          checked={payload.firstOrder || false}
          onChange={() => setPayload((p: any) => ({ ...p, firstOrder: !p.firstOrder }))}
        /> Primeira compra?</label>

      case 'CART_ITEM_COUNT':
        return <input type="number" placeholder="Qtd"
          value={payload.qty || ''}
          onChange={e => setPayload((p: any) => ({ ...p, qty: Number(e.target.value) }))}
          className="border p-1 rounded w-full" />

      case 'UNIQUE_VARIANT_COUNT':
        return <>
          <button type="button" className="underline" onClick={() => {
            // opcional: modal ou dropdown
          }}>Adicionar Produto(s) Variante(s)</button>
          <div className="text-sm text-gray-600 mb-2">
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
            className="border p-1 rounded w-full mt-2" />
        </>

      case 'ZIP_CODE':
        return <div className="flex gap-2">
          <input type="text" placeholder="CEP Inicial"
            value={payload.zipFrom || ''}
            onChange={e => setPayload((p: any) => ({ ...p, zipFrom: e.target.value }))}
            className="border p-1 rounded flex-1" />
          <input type="text" placeholder="CEP Final"
            value={payload.zipTo || ''}
            onChange={e => setPayload((p: any) => ({ ...p, zipTo: e.target.value }))}
            className="border p-1 rounded flex-1" />
        </div>

      case 'PRODUCT_CODE':
        return <select multiple className="border p-1 rounded w-full h-24"
          value={payload.productIds || []}
          onChange={e => setPayload((p: any) => ({ ...p, productIds: Array.from(e.target.selectedOptions, o => o.value) }))}
        >{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>

      case 'VARIANT_CODE':
        return <select multiple className="border p-1 rounded w-full h-24"
          value={payload.variantIds || []}
          onChange={e => setPayload((p: any) => ({ ...p, variantIds: Array.from(e.target.selectedOptions, o => o.value) }))}
        >{variants.map(v => <option key={v.id} value={v.id}>{v.sku}</option>)}</select>

      case 'STATE':
        return <select multiple className="border p-1 rounded w-full h-24"
          value={payload.states || []}
          onChange={e => setPayload((p: any) => ({ ...p, states: Array.from(e.target.selectedOptions, o => o.value) }))}
        >{brazilStates.map(s => <option key={s} value={s}>{s}</option>)}</select>

      case 'CATEGORY':
        return <select multiple className="border p-1 rounded w-full h-24"
          value={payload.categoryIds || []}
          onChange={e => setPayload((p: any) => ({ ...p, categoryIds: Array.from(e.target.selectedOptions, o => o.value) }))}
        >{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>

      case 'CATEGORY_ITEM_COUNT':
        return <>
          <select multiple className="border p-1 rounded w-full h-24"
            value={payload.categoryIds || []}
            onChange={e => setPayload((p: any) => ({ ...p, categoryIds: Array.from(e.target.selectedOptions, o => o.value) }))}
          >{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          <input type="number" placeholder="Qtd"
            value={payload.qty || ''}
            onChange={e => setPayload((p: any) => ({ ...p, qty: Number(e.target.value) }))}
            className="border p-1 rounded w-full mt-2" />
        </>

      case 'CATEGORY_VALUE':
        return <>
          <select multiple className="border p-1 rounded w-full h-24"
            value={payload.categoryIds || []}
            onChange={e => setPayload((p: any) => ({ ...p, categoryIds: Array.from(e.target.selectedOptions, o => o.value) }))}
          >{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          <input type="number" placeholder="Valor"
            value={payload.qtyOrValue || ''}
            onChange={e => setPayload((p: any) => ({ ...p, qtyOrValue: Number(e.target.value) }))}
            className="border p-1 rounded w-full mt-2" />
        </>

      case 'BRAND_VALUE':
        return <>
          <button type="button" className="underline">Adicionar Marca(s)</button>
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
            className="border p-1 rounded w-full mt-2" />
        </>

      case 'VARIANT_ITEM_COUNT':
        return <>
          <select multiple className="border p-1 rounded w-full h-24"
            value={payload.variantIds || []}
            onChange={e => setPayload((p: any) => ({ ...p, variantIds: Array.from(e.target.selectedOptions, o => o.value) }))}
          >{variants.map(v => <option key={v.id} value={v.id}>{v.sku}</option>)}</select>
          <input type="number" placeholder="Qtd"
            value={payload.qty || ''}
            onChange={e => setPayload((p: any) => ({ ...p, qty: Number(e.target.value) }))}
            className="border p-1 rounded w-full mt-2" />
        </>

      case 'PRODUCT_ITEM_COUNT':
        return <>
          <select multiple className="border p-1 rounded w-full h-24"
            value={payload.productIds || []}
            onChange={e => setPayload((p: any) => ({ ...p, productIds: Array.from(e.target.selectedOptions, o => o.value) }))}
          >{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
          <input type="number" placeholder="Qtd"
            value={payload.qty || ''}
            onChange={e => setPayload((p: any) => ({ ...p, qty: Number(e.target.value) }))}
            className="border p-1 rounded w-full mt-2" />
        </>

      case 'PERSON_TYPE':
        return (
          <select className="border p-1 rounded w-full"
            value={payload.personType || ''}
            onChange={e => setPayload((p: any) => ({ ...p, personType: e.target.value }))}
          >
            <option value="">Selecione...</option>
            <option value="FISICA">Física</option>
            <option value="JURIDICA">Jurídica</option>
          </select>
        )

      case 'USER':
        return (
          <select multiple className="border p-1 rounded w-full h-24"
            value={payload.userIds || []}
            onChange={e => setPayload((p: any) => ({ ...p, userIds: Array.from(e.target.selectedOptions, o => o.value) }))}
          >
            {users.map(u => <option key={u.id} value={u.id}>{u.email}</option>)}
          </select>
        )

      case 'SUBTOTAL_VALUE':
      case 'TOTAL_VALUE':
        return (
          <input type="number" placeholder="Valor"
            value={payload.amount || ''}
            onChange={e => setPayload((p: any) => ({ ...p, amount: Number(e.target.value) }))}
            className="border p-1 rounded w-full" />
        )

      default:
        return null
    }
  }

  // Formata para exibição
  function formatCondition(c: ConditionInput) {
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
        return JSON.stringify(c.value)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Passo 2: Defina as Condições</h2>

      {/* condições cadastradas */}
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100 border-b">
            <th className="p-2 text-left">Condição</th>
            <th className="p-2 text-left">Lógica</th>
            <th className="p-2 text-left">Detalhes</th>
            <th className="p-2"></th>
          </tr>
        </thead>
        <tbody>
          {data.conditions?.map((c: any, i: any) => (
            <tr key={i} className="border-b hover:bg-gray-50">
              <td className="p-2">{conditionOptions.find(o => o.value === c.type)?.label}</td>
              <td className="p-2">{logicLabels[c.operator]}</td>
              <td className="p-2">{formatCondition(c)}</td>
              <td className="p-2">
                <button onClick={() => removeCondition(i)} className="text-red-600 hover:underline">
                  Remover
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* formulário */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block mb-1">Condição*</label>
          <select value={type} onChange={e => setType(e.target.value as ConditionKey)}
            className="w-full border p-1 rounded"
          >{conditionOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
        </div>
        <div>
          <label className="block mb-1">Lógica*</label>
          <select value={operator} onChange={e => setOperator(e.target.value)}
            className="w-full border p-1 rounded"
          >{logicOptions.map(lo => <option key={lo} value={lo}>{logicLabels[lo]}</option>)}</select>
        </div>
        <div>{renderExtraFields()}</div>
      </div>

      <div className="flex justify-between">
        <button onClick={onBack} className="px-4 py-2 border rounded">Voltar</button>
        <button onClick={saveCondition} className="px-4 py-2 bg-blue-600 text-white rounded">Salvar Condição</button>
        <button onClick={onNext} className="px-4 py-2 bg-green-600 text-white rounded">Próximo</button>
      </div>
    </div>
  )
}