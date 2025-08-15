'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { SidebarAndHeader } from '@/app/components/sidebarAndHeader';
import { Section } from '@/app/components/section';
import { TitlePage } from '@/app/components/section/titlePage';
import { setupAPIClientEcommerce } from '@/app/services/apiEcommerce';
import { toast } from 'react-toastify';
import { Tooltip } from '@nextui-org/react';

type FilterType = 'RANGE' | 'SELECT' | 'MULTI_SELECT';
type FilterDataType = 'NUMBER' | 'STRING' | 'DATE' | 'BOOLEAN';
type FilterDisplayStyle = 'SLIDER' | 'DROPDOWN' | 'CHECKBOX' | 'RADIO' | 'COLOR_PICKER';

interface FilterGroup { id: string; name: string; order: number }
interface Category { id: string; name: string }
interface OptionItem {
    id: string;
    label: string;
    value: string;
    order: number;
    iconUrl: string;
    colorCode: string;
    isDefault: boolean;
}
interface CategoryFilter { id: string; category_id: string }

// Opções com labels amigáveis
const FIELD_NAME_OPTIONS = [
    { value: 'price_of', label: 'Preço Original' },
    { value: 'price_per', label: 'Preço Promocional' },
    { value: 'variantAttribute', label: 'Atributo da Variante' },
    { value: 'sku', label: 'SKU da Variante' },
    { value: 'skuMaster', label: 'SKU Mestre' },
    { value: 'brand', label: 'Marca' },
    { value: 'weight', label: 'Peso' },
    { value: 'length', label: 'Comprimento' },
    { value: 'width', label: 'Largura' },
    { value: 'height', label: 'Altura' },
    { value: 'view', label: 'Visualizações' },
    { value: 'rating', label: 'Avaliação' },
    { value: 'category', label: 'Categoria' }
];

export default function FilterUpdate() {
    const { id } = useParams<{ id: string }>();
    const api = setupAPIClientEcommerce();
    const router = useRouter();

    // ── Estados do filtro ───────────────────────────────────────────────────
    const [name, setName] = useState('');
    const [fieldName, setFieldName] = useState('');
    const [type, setType] = useState<FilterType>('SELECT');
    const [dataType, setDataType] = useState<FilterDataType>('STRING');
    const [displayStyle, setDisplayStyle] = useState<FilterDisplayStyle>('DROPDOWN');
    const [isActive, setIsActive] = useState(true);
    const [order, setOrder] = useState(0);
    const [autoPopulate, setAutoPopulate] = useState(false);
    const [minValue, setMinValue] = useState<number | ''>('');
    const [maxValue, setMaxValue] = useState<number | ''>('');
    const [groupId, setGroupId] = useState<string>('');
    const [options, setOptions] = useState<OptionItem[]>([]);
    const [selectedCatIds, setSelectedCatIds] = useState<string[]>([]);
    const [origCatFilters, setOrigCatFilters] = useState<CategoryFilter[]>([]);

    // ── Listas ───────────────────────────────────────────────────────────────
    const [groups, setGroups] = useState<FilterGroup[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);

    // ── Modal de Grupos ─────────────────────────────────────────────────────
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupOrder, setNewGroupOrder] = useState(0);
    const [groupSubmitting, setGroupSubmitting] = useState(false);

    // ── UI ─────────────────────────────────────────────────────────────────
    const [tab, setTab] = useState<0 | 1>(0);
    const [submitting, setSubmitting] = useState(false);

    // ── Carrega dados iniciais ─────────────────────────────────────────────
    useEffect(() => {
        async function load() {
            try {
                // 1) dados do filtro
                const f = await api.get<{
                    id: string;
                    name: string;
                    fieldName: string;
                    type: FilterType;
                    dataType: FilterDataType;
                    displayStyle: FilterDisplayStyle;
                    isActive: boolean;
                    order: number;
                    autoPopulate: boolean;
                    minValue: number | null;
                    maxValue: number | null;
                    group: { id: string } | null;
                    options: OptionItem[];
                }>(`/filters/get/${id}`);
                const d = f.data;
                setName(d.name);
                setFieldName(d.fieldName);
                setType(d.type);
                setDataType(d.dataType);
                setDisplayStyle(d.displayStyle);
                setIsActive(d.isActive);
                setOrder(d.order);
                setAutoPopulate(d.autoPopulate);
                setMinValue(d.minValue ?? '');
                setMaxValue(d.maxValue ?? '');
                setGroupId(d.group?.id ?? '');
                setOptions(d.options.map(o => ({
                    ...o,
                    iconUrl: o.iconUrl ?? '',
                    colorCode: o.colorCode ?? ''
                })));
                // 2) relações de categoria
                const filter_id = id;
                const cf = await api.get<CategoryFilter[]>(`/filter/categories?filter_id=${filter_id}`);
                setOrigCatFilters(cf.data);
                setSelectedCatIds(cf.data.map(x => x.category_id));
            } catch (err) {
                console.error(err);
                toast.error('Erro ao carregar filtro');
            }
            // 3) listas auxiliares
            api.get<FilterGroup[]>('/filterGroups/getAll').then(r => setGroups(r.data));
            api.get<{ all_categories_disponivel: Category[] }>('/category/cms')
                .then(r => setCategories(r.data.all_categories_disponivel));
        }
        load();
    }, [id]);

    // ── Handlers de opções ─────────────────────────────────────────────────
    const addOption = () =>
        setOptions(o => [...o, {
            id: Date.now().toString(),
            label: '', value: '', order: o.length,
            iconUrl: '', colorCode: '', isDefault: false
        }]);
    const removeOption = (optId: string) =>
        setOptions(o => o.filter(x => x.id !== optId));
    const updateOption = (optId: string, key: keyof OptionItem, val: any) =>
        setOptions(o => o.map(x => x.id === optId ? { ...x, [key]: val } : x));

    // ── Handler de categorias ──────────────────────────────────────────────
    const toggleCategory = (catId: string) =>
        setSelectedCatIds(s => s.includes(catId) ? s.filter(x => x !== catId) : [...s, catId]);

    // ── Modal Grupos ────────────────────────────────────────────────────────
    const handleCreateGroup = async () => {
        setGroupSubmitting(true);
        try {
            const r = await api.post<FilterGroup>('/filterGroups/create', {
                name: newGroupName, order: newGroupOrder
            });
            setGroups(g => [...g, r.data]);
            setGroupId(r.data.id);
            setNewGroupName(''); setNewGroupOrder(0);
            toast.success('Grupo criado');
        } catch {
            toast.error('Erro ao criar grupo');
        }
        setGroupSubmitting(false);
    };
    const handleDeleteGroup = async (grpId: string) => {
        try {
            await api.delete(`/filterGroups/deleteGroup/${id}`);
            setGroups(g => g.filter(x => x.id !== grpId));
            if (groupId === grpId) setGroupId(groups[0]?.id ?? '');
            toast.success('Grupo excluído');
        } catch {
            toast.error('Erro ao excluir grupo');
        }
    };

    // ── Submit de atualização ──────────────────────────────────────────────
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

            const payload = {
                name, fieldName, type, dataType, displayStyle,
                isActive, order, autoPopulate,
                minValue: minValue === '' ? null : minValue,
                maxValue: maxValue === '' ? null : maxValue,
                groupId: groupId || null,
                options: options.map(o => {
                    const base: any = {
                        label: o.label,
                        value: o.value,
                        order: o.order,
                        iconUrl: o.iconUrl || null,
                        colorCode: o.colorCode || null,
                        isDefault: o.isDefault,
                    };
                    if (uuidRegex.test(o.id)) {
                        base.id = o.id;   // só inclua o id se for UUID válido (ou seja, entrado pelo backend)
                    }
                    return base;
                })
            };

            // 1) PUT filter + nested options
            await api.put(`/filter/update/${id}`, payload);

            // 2) sincroniza category-filters
            const toRemove = origCatFilters.filter(cf => !selectedCatIds.includes(cf.category_id));
            const toAdd = selectedCatIds.filter(cid => !origCatFilters.some(cf => cf.category_id === cid));
            await Promise.all([
                ...toRemove.map(cf => api.delete(`/categoryFilters/delete/${cf.id}`)),
                ...toAdd.map(cid => api.post(`/categoryFilters/create`, { category_id: cid, filter_id: id }))
            ]);

            toast.success('Filtro atualizado com sucesso');
            router.push('/filters');
        } catch (err) {
            console.error(err);
            toast.error('Erro ao atualizar filtro');
        }
        setSubmitting(false);
    };

    return (
        <SidebarAndHeader>
            <Section>
                <TitlePage title="ATUALIZAR FILTRO" />

                <div className="mt-6 border-b">
                    <nav className="-mb-px flex space-x-4">
                        {['Geral', 'Opções'].map((lbl, i) => (
                            <button
                                key={i}
                                className={`px-4 py-2 ${tab === i
                                    ? 'border-b-2 border-orange-600 text-orange-600'
                                    : 'text-gray-600 hover:text-gray-800'
                                    }`}
                                onClick={() => setTab(i as 0 | 1)}
                            >
                                {lbl}
                            </button>
                        ))}
                    </nav>
                </div>

                <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                    {tab === 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Nome */}
                            <div>
                                <Tooltip
                                    content="Nome a ser exibido no front (ex.: Preço, Cor)"
                                    placement="top-start"
                                    className="bg-white text-red-500 border border-gray-200 p-2"
                                >
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className="mt-1 block w-full rounded border-gray-300 shadow-sm text-black p-2"
                                        placeholder="Nome do filtro"
                                    />
                                </Tooltip>
                            </div>

                            {/* Identificador */}
                            <div>
                                <Tooltip
                                    content="Nome do campo ou identificador associado (ex.: price_per ou variantAttribute)"
                                    placement="top-start"
                                    className="bg-white text-red-500 border border-gray-200 p-2"
                                >
                                    <select
                                        required
                                        value={fieldName}
                                        onChange={e => setFieldName(e.target.value)}
                                        className="mt-1 block w-full rounded border-gray-300 shadow-sm text-black p-2"
                                    >
                                        <option value="">Selecione um campo</option>
                                        {FIELD_NAME_OPTIONS.map(option => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </Tooltip>
                            </div>

                            {/* Tipo */}
                            <div>
                                <Tooltip
                                    content="Tipo de filtro: RANGE, SELECT, MULTI_SELECT"
                                    placement="top-start"
                                    className="bg-white text-red-500 border border-gray-200 p-2"
                                >
                                    <select
                                        value={type}
                                        onChange={e => setType(e.target.value as FilterType)}
                                        className="mt-1 block w-full rounded border-gray-300 shadow-sm text-black p-2"
                                    >
                                        <option value="SELECT">SELECT</option>
                                        <option value="MULTI_SELECT">MULTI_SELECT</option>
                                        <option value="RANGE">RANGE</option>
                                    </select>
                                </Tooltip>
                            </div>

                            {/* Tipo de Dado */}
                            <div>
                                <Tooltip
                                    content="Tipo de dado subjacente (NUMBER, STRING, etc.)"
                                    placement="top-start"
                                    className="bg-white text-red-500 border border-gray-200 p-2"
                                >
                                    <select
                                        value={dataType}
                                        onChange={e => setDataType(e.target.value as FilterDataType)}
                                        className="mt-1 block w-full rounded border-gray-300 shadow-sm text-black p-2"
                                    >
                                        <option value="STRING">STRING</option>
                                        <option value="NUMBER">NUMBER</option>
                                        <option value="DATE">DATE</option>
                                        <option value="BOOLEAN">BOOLEAN</option>
                                    </select>
                                </Tooltip>
                            </div>

                            {/* Estilo */}
                            <div>
                                <Tooltip
                                    content="Define o componente visual a ser usado"
                                    placement="top-start"
                                    className="bg-white text-red-500 border border-gray-200 p-2"
                                >
                                    <select
                                        value={displayStyle}
                                        onChange={e => setDisplayStyle(e.target.value as FilterDisplayStyle)}
                                        className="mt-1 block w-full rounded border-gray-300 shadow-sm text-black p-2"
                                    >
                                        <option value="DROPDOWN">DROPDOWN</option>
                                        <option value="CHECKBOX">CHECKBOX</option>
                                        <option value="RADIO">RADIO</option>
                                        <option value="SLIDER">SLIDER</option>
                                        <option value="COLOR_PICKER">COLOR_PICKER</option>
                                    </select>
                                </Tooltip>
                            </div>

                            {/* Ativo */}
                            <div className="flex items-center space-x-2">
                                <input
                                    id="active"
                                    type="checkbox"
                                    checked={isActive}
                                    onChange={e => setIsActive(e.target.checked)}
                                    className="h-4 w-4"
                                />
                                <Tooltip
                                    content="Ativar/desativar este filtro"
                                    placement="top-start"
                                    className="bg-white text-red-500 border border-gray-200 p-2"
                                >
                                    <label htmlFor="active" className="text-sm">Ativo</label>
                                </Tooltip>
                            </div>

                            {/* Ordem */}
                            <div>
                                <Tooltip
                                    content="Define a ordem de exibição entre os filtros"
                                    placement="top-start"
                                    className="bg-white text-red-500 border border-gray-200 p-2"
                                >
                                    <input
                                        type="number"
                                        value={order}
                                        onChange={e => setOrder(Number(e.target.value))}
                                        className="mt-1 block w-full rounded border-gray-300 shadow-sm text-black p-2"
                                    />
                                </Tooltip>
                            </div>

                            {/* AutoPopulate */}
                            <div className="flex items-center space-x-2">
                                <input
                                    id="auto"
                                    type="checkbox"
                                    checked={autoPopulate}
                                    onChange={e => setAutoPopulate(e.target.checked)}
                                    className="h-4 w-4"
                                />
                                <Tooltip
                                    content="Se verdadeiro, o sistema pode preencher opções baseado nos produtos cadastrados."
                                    placement="top-start"
                                    className="bg-white text-red-500 border border-gray-200 p-2"
                                >
                                    <label htmlFor="auto" className="text-sm">Auto Popular</label>
                                </Tooltip>
                            </div>

                            {/* Min/Max (RANGE) */}
                            {type === 'RANGE' && (
                                <>
                                    <div>
                                        <Tooltip
                                            content="Ex.: preço mínimo pré-configurado (opcional)"
                                            placement="top-start"
                                            className="bg-white text-red-500 border border-gray-200 p-2"
                                        >
                                            <input
                                                type="number"
                                                value={minValue}
                                                onChange={e => setMinValue(e.target.value === '' ? '' : Number(e.target.value))}
                                                className="mt-1 block w-full rounded border-gray-300 shadow-sm text-black p-2"
                                            />
                                        </Tooltip>
                                    </div>
                                    <div>
                                        <Tooltip
                                            content="Ex.: preço máximo pré-configurado (opcional)"
                                            placement="top-start"
                                            className="bg-white text-red-500 border border-gray-200 p-2"
                                        >
                                            <input
                                                type="number"
                                                value={maxValue}
                                                onChange={e => setMaxValue(e.target.value === '' ? '' : Number(e.target.value))}
                                                className="mt-1 block w-full rounded border-gray-300 shadow-sm text-black p-2"
                                            />
                                        </Tooltip>
                                    </div>
                                </>
                            )}

                            {/* Grupo + botão */}
                            <div className="md:col-span-2 flex items-end space-x-2">
                                <div className="flex-1">
                                    <Tooltip
                                        content="O grupo representa por exemplo: Caracteristicas, Preços etc..."
                                        placement="top-start"
                                        className="bg-white text-red-500 border border-gray-200 p-2"
                                    >
                                        <select
                                            value={groupId}
                                            onChange={e => setGroupId(e.target.value)}
                                            className="mt-1 block w-full rounded border-gray-300 shadow-sm text-black p-2"
                                        >
                                            <option value="">— Nenhum —</option>
                                            {groups.map(g => (
                                                <option key={g.id} value={g.id}>{g.name}</option>
                                            ))}
                                        </select>
                                    </Tooltip>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowGroupModal(true)}
                                    className="mb-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                                >
                                    + Grupo
                                </button>
                            </div>

                            {/* Categorias */}
                            <div className="md:col-span-2">
                                <Tooltip
                                    content="Selecione uma ou mais categorias, caso esse filtro precise aparecer em pagina(s) dessas categorias."
                                    placement="top-start"
                                    className="bg-white text-red-500 border border-gray-200 p-2"
                                >
                                    <label className="block text-sm mb-1">Categorias</label>
                                </Tooltip>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-40 overflow-auto p-2 border rounded">
                                    {categories.map(cat => (
                                        <label key={cat.id} className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                checked={selectedCatIds.includes(cat.id)}
                                                onChange={() => toggleCategory(cat.id)}
                                                className="h-4 w-4"
                                            />
                                            <span className="text-sm">{cat.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {tab === 1 && (
                        <div className="space-y-4">
                            <button
                                type="button"
                                onClick={addOption}
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                                + Nova Opção
                            </button>
                            {options.map(opt => (
                                <div
                                    key={opt.id}
                                    className="flex flex-col md:flex-row md:items-end md:space-x-4 p-4 border rounded"
                                >
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Label */}
                                        <div>
                                            <Tooltip
                                                content="Texto exibido (ex.: Azul, Médio, 2023)"
                                                placement="top-start"
                                                className="bg-white text-red-500 border border-gray-200 p-2"
                                            >
                                                <input
                                                    type="text"
                                                    value={opt.label}
                                                    onChange={e => updateOption(opt.id, 'label', e.target.value)}
                                                    className="mt-1 block w-full rounded border-gray-300 shadow-sm text-black p-2"
                                                    placeholder="Texto exibido"
                                                />
                                            </Tooltip>
                                        </div>
                                        {/* Value */}
                                        <div>
                                            <Tooltip
                                                content="Valor utilizado para a query"
                                                placement="top-start"
                                                className="bg-white text-red-500 border border-gray-200 p-2"
                                            >
                                                <input
                                                    type="text"
                                                    value={opt.value}
                                                    onChange={e => updateOption(opt.id, 'value', e.target.value)}
                                                    className="mt-1 block w-full rounded border-gray-300 shadow-sm text-black p-2"
                                                    placeholder="Valor da query"
                                                />
                                            </Tooltip>
                                        </div>
                                        {/* Order */}
                                        <div>
                                            <Tooltip
                                                content="Ordem de exibição"
                                                placement="top-start"
                                                className="bg-white text-red-500 border border-gray-200 p-2"
                                            >
                                                <input
                                                    type="number"
                                                    value={opt.order}
                                                    onChange={e => updateOption(opt.id, 'order', Number(e.target.value))}
                                                    className="mt-1 block w-full rounded border-gray-300 shadow-sm text-black p-2"
                                                    placeholder="Ordem"
                                                />
                                            </Tooltip>
                                        </div>
                                        {/* IconUrl */}
                                        <div>
                                            <Tooltip
                                                content="URL para ícone (útil para filtros de cor ou ícones específicos)"
                                                placement="top-start"
                                                className="bg-white text-red-500 border border-gray-200 p-2"
                                            >
                                                <input
                                                    type="text"
                                                    value={opt.iconUrl}
                                                    onChange={e => updateOption(opt.id, 'iconUrl', e.target.value)}
                                                    className="mt-1 block w-full rounded border-gray-300 shadow-sm text-black p-2"
                                                    placeholder="URL do ícone"
                                                />
                                            </Tooltip>
                                        </div>
                                        {/* ColorCode */}
                                        <div>
                                            <Tooltip
                                                content="Código de cor (ex.: #FF0000), se aplicável"
                                                placement="top-start"
                                                className="bg-white text-red-500 border border-gray-200 p-2"
                                            >
                                                <input
                                                    type="text"
                                                    value={opt.colorCode}
                                                    onChange={e => updateOption(opt.id, 'colorCode', e.target.value)}
                                                    className="mt-1 block w-full rounded border-gray-300 shadow-sm text-black p-2"
                                                    placeholder="Código da cor"
                                                />
                                            </Tooltip>
                                        </div>
                                        {/* IsDefault */}
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                checked={opt.isDefault}
                                                onChange={e => updateOption(opt.id, 'isDefault', e.target.checked)}
                                                className="h-4 w-4"
                                            />
                                            <Tooltip
                                                content="Marcar como opção padrão"
                                                placement="top-start"
                                                className="bg-white text-red-500 border border-gray-200 p-2"
                                            >
                                                <label className="text-sm">Padrão</label>
                                            </Tooltip>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeOption(opt.id)}
                                        className="mt-2 md:mt-0 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                                    >
                                        Remover
                                    </button>
                                </div>
                            ))}
                            {options.length === 0 && <p className="text-gray-500">Nenhuma opção adicionada.</p>}
                        </div>
                    )}

                    <div className="pt-4 border-t flex justify-end">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                        >
                            {submitting ? 'Atualizando...' : 'Atualizar Filtro'}
                        </button>
                    </div>
                </form>
            </Section>

            {/* Modal de Grupos */}
            {showGroupModal && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded shadow-lg w-full max-w-lg">
                        <h2 className="text-xl font-medium mb-4 text-black">Gerenciar Grupos</h2>
                        <ul className="max-h-60 overflow-auto space-y-2 mb-4">
                            {groups.map(g => (
                                <li key={g.id} className="flex justify-between p-2 border rounded">
                                    <span className='text-black'>{g.name} ({g.order})</span>
                                    <button
                                        onClick={() => handleDeleteGroup(g.id)}
                                        className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                                    >
                                        Excluir
                                    </button>
                                </li>
                            ))}
                        </ul>
                        <div className="space-y-3 mb-4">
                            <div>
                                <Tooltip
                                    content="Nome do grupo (ex.: Características, Preço)"
                                    placement="top-start"
                                    className="bg-white text-red-500 border border-gray-200 p-2"
                                >
                                    <input
                                        type="text"
                                        value={newGroupName}
                                        onChange={e => setNewGroupName(e.target.value)}
                                        className="mt-1 block w-full rounded border-gray-300 shadow-sm text-black p-2"
                                        placeholder="Nome do grupo"
                                    />
                                </Tooltip>
                            </div>
                            <div>
                                <Tooltip
                                    content="Ordem de exibição do grupo na interface de usuário"
                                    placement="top-start"
                                    className="bg-white text-red-500 border border-gray-200 p-2"
                                >
                                    <input
                                        type="number"
                                        value={newGroupOrder}
                                        onChange={e => setNewGroupOrder(Number(e.target.value))}
                                        className="mt-1 block w-full rounded border-gray-300 shadow-sm text-black p-2"
                                        placeholder="Ordem"
                                    />
                                </Tooltip>
                            </div>
                        </div>
                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={() => setShowGroupModal(false)}
                                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 text-black"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCreateGroup}
                                disabled={groupSubmitting}
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                            >
                                {groupSubmitting ? 'Criando...' : 'Novo Grupo'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </SidebarAndHeader>
    );
}