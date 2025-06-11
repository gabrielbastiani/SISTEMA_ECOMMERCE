'use client'

import { useState, useEffect } from 'react'
import { SidebarAndHeader } from '@/app/components/sidebarAndHeader'
import { Section } from '@/app/components/section'
import { TitlePage } from '@/app/components/section/titlePage'
import { setupAPIClientEcommerce } from '@/app/services/apiEcommerce'
import {
    Input,
    Textarea,
    Checkbox,
    Button,
    Tooltip
} from '@nextui-org/react'
import { InformationCircleIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-toastify'

type DiscountType = 'PERCENTAGE' | 'FIXED' | 'BOGO' | 'FREE_SHIPPING'
type PromotionStatus = 'SCHEDULED' | 'ACTIVE' | 'EXPIRED' | 'ARCHIVED'
type PromotionScope = 'PRODUCT' | 'VARIANT' | 'CATEGORY'
type ApplyTo = 'cheapest' | 'most_expensive' | 'all'

interface PromotionRuleInput {
    scope: PromotionScope
    targetIds: string[]
    quantity?: number
    applyTo?: ApplyTo
}

interface PromotionForm {
    code?: string
    name: string
    description?: string
    discountType: DiscountType
    discountValue: number
    maxDiscountAmount?: number
    startDate: string
    endDate: string
    usageLimit?: number
    userUsageLimit: number
    minOrderAmount?: number
    status: PromotionStatus
    stackable: boolean

    productIds: string[]
    variantIds: string[]
    featuredProductIds: string[]
    categoryIds: string[]
    ruleInputs: PromotionRuleInput[]
}

const initialForm: PromotionForm = {
    code: '',
    name: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: 0,
    maxDiscountAmount: undefined,
    startDate: '',
    endDate: '',
    usageLimit: undefined,
    userUsageLimit: 1,
    minOrderAmount: undefined,
    status: 'SCHEDULED',
    stackable: false,

    productIds: [],
    variantIds: [],
    featuredProductIds: [],
    categoryIds: [],
    ruleInputs: []
}

export default function AddPromotion() {
    
    const [form, setForm] = useState<PromotionForm>(initialForm)
    const [loading, setLoading] = useState(false)
    const [products, setProducts] = useState<{ id: string; name: string }[]>([])
    const [variants, setVariants] = useState<{ id: string; sku: string }[]>([])
    const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
    const [newRule, setNewRule] = useState<PromotionRuleInput>({
        scope: 'PRODUCT',
        targetIds: [],
        quantity: undefined,
        applyTo: undefined
    })
    const api = setupAPIClientEcommerce()

    // Flatten sem duplicar, prevenindo ciclos
    function flattenCategories(
        items: any[],
        prefix = '',
        visited = new Set<string>()
    ): { id: string; name: string }[] {
        let result: { id: string; name: string }[] = []
        for (const cat of items) {
            if (visited.has(cat.id)) continue
            visited.add(cat.id)
            result.push({ id: cat.id, name: prefix + cat.name })
            if (Array.isArray(cat.children) && cat.children.length > 0) {
                result.push(...flattenCategories(cat.children, prefix + cat.name + ' > ', visited))
            }
        }
        return result
    }

    useEffect(() => {
        async function loadOptions() {
            try {
                const [resP, resV, resC] = await Promise.all([
                    api.get('/get/products'),
                    api.get('/variant/get'),
                    api.get('/category/cms')
                ])
                setProducts(
                    resP.data.allow_products.map((p: any) => ({
                        id: p.id,
                        name: p.name
                    }))
                )
                setVariants(
                    resV.data.map((v: any) => ({
                        id: v.id,
                        sku: v.sku
                    }))
                )
                setCategories(
                    flattenCategories(resC.data.all_categories_disponivel)
                )
            } catch (err) {
                console.error(err)
                toast.error('Falha ao carregar opções de produtos/variantes/categorias.')
            }
        }
        loadOptions()
    }, [])

    const handleChange = <K extends keyof PromotionForm>(
        key: K,
        value: PromotionForm[K]
    ) => {
        setForm(prev => ({ ...prev, [key]: value }))
    }

    const handleNewRuleChange = <K extends keyof PromotionRuleInput>(
        key: K,
        value: PromotionRuleInput[K]
    ) => {
        setNewRule(prev => ({ ...prev, [key]: value }))
    }

    const addRule = () => {
        if (!newRule.scope || newRule.targetIds.length === 0) {
            toast.error('Defina escopo e ao menos um alvo para a regra.')
            return
        }
        setForm(prev => ({
            ...prev,
            ruleInputs: [...prev.ruleInputs, newRule]
        }))
        setNewRule({ scope: 'PRODUCT', targetIds: [], quantity: undefined, applyTo: undefined })
    }

    const removeRule = (index: number) => {
        setForm(prev => ({
            ...prev,
            ruleInputs: prev.ruleInputs.filter((_, i) => i !== index)
        }))
    }

    const toISOStringOffset = (local: string) => new Date(local).toISOString()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.name || !form.startDate || !form.endDate) {
            toast.error('Preencha nome, início e fim da promoção.')
            return
        }
        setLoading(true)
        try {
            const payload = {
                ...form,
                startDate: toISOStringOffset(form.startDate),
                endDate: toISOStringOffset(form.endDate)
            }
            await api.post('/promotions', payload)
            toast.success('Promoção cadastrada!')
            setForm(initialForm)
        } catch (err) {
            console.error(err)
            toast.error('Erro ao cadastrar promoção.')
        } finally {
            setLoading(false)
        }
    }

    const inputClass = 'w-full border rounded p-2 bg-white text-black'

    return (
        <SidebarAndHeader>
            <Section>
                <TitlePage title="CADASTRAR PROMOÇÃO" />

                <form onSubmit={handleSubmit} className="space-y-8 p-6 rounded-lg shadow">

                    {/* IDENTIFICAÇÃO */}
                    <fieldset className="border p-4 rounded">
                        <legend className="text-lg font-semibold">Identificação</legend>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium">Código (opcional)</label>
                                <Input
                                    placeholder="EX: BLACKFRIDAY"
                                    className="bg-white text-black"
                                    value={form.code}
                                    onValueChange={v => handleChange('code', v)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Nome da Promoção</label>
                                <Input
                                    required
                                    placeholder="Ex: Black Friday 2025"
                                    className="bg-white text-black"
                                    value={form.name}
                                    onValueChange={v => handleChange('name', v)}
                                />
                            </div>
                        </div>
                    </fieldset>

                    {/* DESCRIÇÃO */}
                    <fieldset className="border p-4 rounded">
                        <legend className="text-lg font-semibold">Descrição</legend>
                        <Textarea
                            placeholder="Descreva detalhes e benefícios"
                            className="bg-white text-black h-24"
                            value={form.description}
                            onValueChange={v => handleChange('description', v)}
                        />
                    </fieldset>

                    {/* DESCONTO */}
                    <fieldset className="border p-4 rounded">
                        <legend className="text-lg font-semibold">Detalhes do Desconto</legend>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium">Tipo</label>
                                <select
                                    className={inputClass}
                                    value={form.discountType}
                                    onChange={e => handleChange('discountType', e.target.value as DiscountType)}
                                >
                                    <option value="PERCENTAGE">Percentual (%)</option>
                                    <option value="FIXED">Valor Fixo (R$)</option>
                                    <option value="BOGO">Compre 1 e ganhe 1</option>
                                    <option value="FREE_SHIPPING">Frete grátis</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Valor</label>
                                <Input
                                    required
                                    type="number"
                                    placeholder="Ex: 10"
                                    className="bg-white text-black"
                                    value={form.discountValue.toString()}
                                    onChange={e => handleChange('discountValue', Number(e.target.value))}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Máx. Desconto (opcional)</label>
                                <Input
                                    type="number"
                                    placeholder="Ex: 200"
                                    className="bg-white text-black"
                                    value={form.maxDiscountAmount?.toString() || ''}
                                    onChange={e =>
                                        handleChange(
                                            'maxDiscountAmount',
                                            e.target.value ? Number(e.target.value) : undefined
                                        )
                                    }
                                />
                            </div>
                        </div>
                    </fieldset>

                    {/* PERÍODO */}
                    <fieldset className="border p-4 rounded">
                        <legend className="text-lg font-semibold">Período</legend>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium">Início</label>
                                <input
                                    required
                                    type="datetime-local"
                                    className={inputClass}
                                    value={form.startDate}
                                    onChange={e => handleChange('startDate', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Fim</label>
                                <input
                                    required
                                    type="datetime-local"
                                    className={inputClass}
                                    value={form.endDate}
                                    onChange={e => handleChange('endDate', e.target.value)}
                                />
                            </div>
                        </div>
                    </fieldset>

                    {/* LIMITES */}
                    <fieldset className="border p-4 rounded">
                        <legend className="text-lg font-semibold">Limites</legend>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium">Total de Usos (opcional)</label>
                                <Input
                                    type="number"
                                    placeholder="Ex: 100"
                                    className="bg-white text-black"
                                    value={form.usageLimit?.toString() || ''}
                                    onChange={e =>
                                        handleChange(
                                            'usageLimit',
                                            e.target.value ? Number(e.target.value) : undefined
                                        )
                                    }
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Uso por Usuário</label>
                                <Input
                                    required
                                    type="number"
                                    placeholder="Ex: 1"
                                    className="bg-white text-black"
                                    value={form.userUsageLimit.toString()}
                                    onChange={e => handleChange('userUsageLimit', Number(e.target.value))}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Min. Valor do Pedido (opcional)</label>
                                <Input
                                    type="number"
                                    placeholder="Ex: 50"
                                    className="bg-white text-black"
                                    value={form.minOrderAmount?.toString() || ''}
                                    onChange={e =>
                                        handleChange(
                                            'minOrderAmount',
                                            e.target.value ? Number(e.target.value) : undefined
                                        )
                                    }
                                />
                            </div>
                        </div>
                    </fieldset>

                    {/* STATUS E ACUMULÁVEL */}
                    <fieldset className="border p-4 rounded">
                        <legend className="text-lg font-semibold">Status & Acumulável</legend>
                        <div className="flex flex-wrap items-center gap-6">
                            <div className="w-1/3">
                                <label className="block text-sm font-medium">Status</label>
                                <select
                                    className={inputClass}
                                    value={form.status}
                                    onChange={e => handleChange('status', e.target.value as PromotionStatus)}
                                >
                                    <option value="SCHEDULED">Agendada</option>
                                    <option value="ACTIVE">Ativa</option>
                                    <option value="EXPIRED">Expirada</option>
                                    <option value="ARCHIVED">Arquivada</option>
                                </select>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    isSelected={form.stackable}
                                    onChange={e => handleChange('stackable', e.target.checked)}
                                />
                                <label className="text-sm">Acumulável</label>
                                <Tooltip content="Permite usar junto com outras promoções">
                                    <InformationCircleIcon className="w-4 h-4 text-orange-400" />
                                </Tooltip>
                            </div>
                        </div>
                    </fieldset>

                    {/* ASSOCIAÇÕES */}
                    <fieldset className="border p-4 rounded">
                        <legend className="text-lg font-semibold">Associações</legend>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium">Produtos</label>
                                <select
                                    multiple
                                    className={inputClass + ' h-32'}
                                    value={form.productIds}
                                    onChange={e =>
                                        handleChange(
                                            'productIds',
                                            Array.from(e.target.selectedOptions).map(o => o.value)
                                        )
                                    }
                                >
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Variantes</label>
                                <select
                                    multiple
                                    className={inputClass + ' h-32'}
                                    value={form.variantIds}
                                    onChange={e =>
                                        handleChange(
                                            'variantIds',
                                            Array.from(e.target.selectedOptions).map(o => o.value)
                                        )
                                    }
                                >
                                    {variants.map(v => (
                                        <option key={v.id} value={v.id}>{v.sku}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <div className="flex items-center mb-1">
                                    <label className="text-sm font-medium mr-1">Produtos em Destaque</label>
                                    <Tooltip content={
                                        <div className="text-sm bg-white p-2 text-red-500">
                                            <p><b>Produtos em Destaque</b> são aqueles que, na página do produto,
                                                exibirão este banner/promoção em posição de destaque.</p>
                                            <p>Use para forçar que certos SKUs promovidos apareçam no topo de listas ou banners.</p>
                                        </div>
                                    }>
                                        <InformationCircleIcon className="w-4 h-4 text-orange-400" />
                                    </Tooltip>
                                </div>
                                <select
                                    multiple
                                    className={inputClass + ' h-32'}
                                    value={form.featuredProductIds}
                                    onChange={e =>
                                        handleChange(
                                            'featuredProductIds',
                                            Array.from(e.target.selectedOptions).map(o => o.value)
                                        )
                                    }
                                >
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Categorias</label>
                                <select
                                    multiple
                                    className={inputClass + ' h-32'}
                                    value={form.categoryIds}
                                    onChange={e =>
                                        handleChange(
                                            'categoryIds',
                                            Array.from(e.target.selectedOptions).map(o => o.value)
                                        )
                                    }
                                >
                                    {categories.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </fieldset>

                    {/* REGRAS */}
                    <fieldset className="border p-4 rounded">
                        <legend className="text-lg font-semibold">Regras de Promoção</legend>
                        <div className="space-y-4 mb-4">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-sm">Escopo</label>
                                    <select
                                        className={inputClass}
                                        value={newRule.scope}
                                        onChange={e => handleNewRuleChange('scope', e.target.value as PromotionScope)}
                                    >
                                        <option value="PRODUCT">Produto</option>
                                        <option value="VARIANT">Variante</option>
                                        <option value="CATEGORY">Categoria</option>
                                    </select>
                                </div>
                                <div>
                                    <div className="flex items-center mb-1">
                                        <label className="text-sm font-medium mr-1">Alvos (IDs)</label>
                                        <Tooltip content={
                                            <div className="text-sm bg-white p-2 text-red-500">
                                                <p>Liste os <b>IDs</b> dos produtos, variantes ou categorias a que a
                                                    regra se aplica.</p>
                                                <p>Exemplo: para regra de “Buy 2 get 1”, insira IDs dos produtos
                                                    que participam dessa oferta.</p>
                                            </div>
                                        }>
                                            <InformationCircleIcon className="w-4 h-4 text-orange-400" />
                                        </Tooltip>
                                    </div>
                                    <Input
                                        placeholder="id1,id2,..."
                                        className="bg-white text-black"
                                        value={newRule.targetIds.join(',')}
                                        onChange={e =>
                                            handleNewRuleChange(
                                                'targetIds',
                                                e.target.value.split(',').map(s => s.trim())
                                            )
                                        }
                                    />
                                </div>
                                <div>
                                    <div className="flex items-center mb-1">
                                        <label className="text-sm font-medium mr-1">Quantidade (opcional)</label>
                                        <Tooltip content={
                                            <div className="text-sm bg-white p-2 text-red-500">
                                                <p>Define quantas unidades do item devem ser compradas para
                                                    acionar a regra.</p>
                                                <p>Ex: para “Compre 2 e ganhe 1”, coloque <b>2</b> aqui.</p>
                                            </div>
                                        }>
                                            <InformationCircleIcon className="w-4 h-4 text-orange-400" />
                                        </Tooltip>
                                    </div>
                                    <Input
                                        type="number"
                                        placeholder="Ex: 2"
                                        className="bg-white text-black"
                                        value={newRule.quantity?.toString() || ''}
                                        onChange={e =>
                                            handleNewRuleChange(
                                                'quantity',
                                                e.target.value ? Number(e.target.value) : undefined
                                            )
                                        }
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm">Aplicar em (opcional)</label>
                                    <select
                                        className={inputClass}
                                        value={newRule.applyTo || ''}
                                        onChange={e =>
                                            handleNewRuleChange('applyTo', e.target.value as ApplyTo)
                                        }
                                    >
                                        <option value="">—</option>
                                        <option value="cheapest">Mais barato</option>
                                        <option value="most_expensive">Mais caro</option>
                                        <option value="all">Todos</option>
                                    </select>
                                </div>
                            </div>
                            <div className="text-right">
                                <Button className='text-violet-500' size="sm" onClick={addRule}>Adicionar Regra</Button>
                            </div>
                        </div>

                        {form.ruleInputs.length > 0 && (
                            <ul className="space-y-2">
                                {form.ruleInputs.map((r, i) => (
                                    <li
                                        key={i}
                                        className="flex items-center justify-between p-2 border rounded"
                                    >
                                        <div className="text-sm">
                                            <b>{r.scope}</b> → [{r.targetIds.join(', ')}]
                                            {r.quantity && ` ×${r.quantity}`}
                                            {r.applyTo && ` • aplica em: ${r.applyTo}`}
                                        </div>
                                        <Button size="lg" color="danger" onClick={() => removeRule(i)}>
                                            Remover
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </fieldset>

                    <div className="text-right">
                        <Button
                            type="submit"
                            isLoading={loading}
                            className="bg-green-600 text-white"
                        >
                            Cadastrar Promoção
                        </Button>
                    </div>
                </form>
            </Section>
        </SidebarAndHeader>
    )
}