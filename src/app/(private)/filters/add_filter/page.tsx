'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Section } from '@/app/components/section';
import { TitlePage } from '@/app/components/section/titlePage';
import { SidebarAndHeader } from '@/app/components/sidebarAndHeader';
import { setupAPIClientEcommerce } from '@/app/services/apiEcommerce';
import { toast } from 'react-toastify';

type FilterType = 'RANGE' | 'SELECT' | 'MULTI_SELECT';
type FilterDataType = 'NUMBER' | 'STRING' | 'DATE' | 'BOOLEAN';
type FilterDisplayStyle = 'SLIDER' | 'DROPDOWN' | 'CHECKBOX' | 'RADIO' | 'COLOR_PICKER';

interface FilterGroup { id: string; name: string; order: number }
interface Category { id: string; name: string; }
interface CategoryCmsResponse { all_categories_disponivel: Category[]; }
interface OptionItem { id: number; label: string; value: string; order: number; iconUrl: string; colorCode: string; isDefault: boolean }

export default function AddFilterPage() {

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
    const [selectedCatIds, setSelectedCatIds] = useState<string[]>([]);

    // ── Listas externas ────────────────────────────────────────────────────
    const [groups, setGroups] = useState<FilterGroup[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);

    // ── Modal de Grupos ────────────────────────────────────────────────────
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupOrder, setNewGroupOrder] = useState(0);
    const [groupSubmitting, setGroupSubmitting] = useState(false);

    // ── Aba e opções ──────────────────────────────────────────────────────
    const [tab, setTab] = useState<0 | 1>(0);
    const [options, setOptions] = useState<OptionItem[]>([]);

    // ── Submit geral ──────────────────────────────────────────────────────
    const [submitting, setSubmitting] = useState(false);

    // ── Fetch inicial de grupos & categorias ───────────────────────────────
    useEffect(() => {
        api.get<FilterGroup[]>('/filters/getAll').then(r => setGroups(r.data)).catch(() => toast.error('Não carregou grupos'));
        api.get<CategoryCmsResponse>('/category/cms').then(r => setCategories(r.data?.all_categories_disponivel)).catch(() => toast.error('Não carregou categorias'));
    }, []);

    // ── Handlers de Modal de Grupo ────────────────────────────────────────
    const handleCreateGroup = async () => {
        setGroupSubmitting(true);
        try {
            const r = await api.post<FilterGroup>('/filter-groups/create', { name: newGroupName, order: newGroupOrder });
            setGroups(g => [...g, r.data]);
            setGroupId(r.data.id);
            setNewGroupName(''); setNewGroupOrder(0);
            toast.success('Grupo criado');
        } catch {
            toast.error('Erro ao criar grupo');
        } finally {
            setGroupSubmitting(false);
        }
    };
    const handleDeleteGroup = async (id: string) => {
        if (!confirm('Excluir grupo?')) return;
        try {
            await api.delete(`/filter-groups/deleteGroup/${id}`);
            setGroups(g => g.filter(x => x.id !== id));
            toast.info('Grupo excluído');
            if (groupId === id) setGroupId(groups[0]?.id || '');
        } catch {
            toast.error('Erro ao excluir grupo');
        }
    };

    // ── Handlers de Opções ────────────────────────────────────────────────
    const addOption = () =>
        setOptions(o => [...o, { id: Date.now(), label: '', value: '', order: o.length, iconUrl: '', colorCode: '', isDefault: false }]);
    const removeOption = (id: number) =>
        setOptions(o => o.filter(x => x.id !== id));
    const updateOption = (id: number, k: keyof OptionItem, v: any) =>
        setOptions(o => o.map(x => x.id === id ? { ...x, [k]: v } : x));

    // ── Handler de Categorias (checkbox) ─────────────────────────────────
    const toggleCategory = (id: string) =>
        setSelectedCatIds(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

    // ── Submit final ──────────────────────────────────────────────────────
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            // 1) Cria o filter + options + group
            const r = await api.post<{ id: string }>('/filters/create', {
                name, fieldName, type, dataType, displayStyle,
                isActive, order, autoPopulate,
                minValue: minValue === '' ? null : minValue,
                maxValue: maxValue === '' ? null : maxValue,
                groupId: groupId || null,
                options: options.map(o => ({
                    label: o.label, value: o.value, order: o.order,
                    iconUrl: o.iconUrl || null, colorCode: o.colorCode || null, isDefault: o.isDefault
                }))
            });
            const filterId = r.data.id;

            // 2) Associação de categorias via CategoryFilter
            await Promise.all(
                selectedCatIds.map(catId =>
                    api.post('/category-filters/create', { category_id: catId, filter_id: filterId })
                )
            );

            toast.success('Filtro cadastrado!');
            router.push('/filters/all_filters');
        } catch (err) {
            console.error(err);
            toast.error('Erro ao cadastrar filtro');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <SidebarAndHeader>
            <Section>

                <TitlePage title="ADICIONAR FILTRO" />

                {/* Abas */}
                <div className="mt-6 border-b">
                    <nav className="-mb-px flex space-x-4">
                        {['Geral', 'Opções'].map((l, i) =>
                            <button key={i}
                                className={`px-4 py-2 ${tab === i ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
                                onClick={() => setTab(i as 0 | 1)}
                            >{l}</button>
                        )}
                    </nav>
                </div>

                <form onSubmit={handleSubmit} className="mt-6 space-y-6">

                    {tab === 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Nome */}
                            <div>
                                <label className="block text-sm font-medium">Nome</label>
                                <input required value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="mt-1 block w-full rounded border-gray-300 shadow-sm" />
                            </div>

                            {/* FieldName */}
                            <div>
                                <label className="block text-sm font-medium">Identificador</label>
                                <input required value={fieldName}
                                    onChange={e => setFieldName(e.target.value)}
                                    className="mt-1 block w-full rounded border-gray-300 shadow-sm" />
                            </div>

                            {/* Type */}
                            <div>
                                <label className="block text-sm font-medium">Tipo</label>
                                <select value={type}
                                    onChange={e => setType(e.target.value as any)}
                                    className="mt-1 block w-full rounded border-gray-300 shadow-sm">
                                    <option>SELECT</option><option>MULTI_SELECT</option><option>RANGE</option>
                                </select>
                            </div>

                            {/* DataType */}
                            <div>
                                <label className="block text-sm font-medium">Tipo de Dado</label>
                                <select value={dataType}
                                    onChange={e => setDataType(e.target.value as any)}
                                    className="mt-1 block w-full rounded border-gray-300 shadow-sm">
                                    <option>STRING</option><option>NUMBER</option><option>DATE</option><option>BOOLEAN</option>
                                </select>
                            </div>

                            {/* DisplayStyle */}
                            <div>
                                <label className="block text-sm font-medium">Estilo</label>
                                <select value={displayStyle}
                                    onChange={e => setDisplayStyle(e.target.value as any)}
                                    className="mt-1 block w-full rounded border-gray-300 shadow-sm">
                                    <option>DROPDOWN</option><option>CHECKBOX</option><option>RADIO</option>
                                    <option>SLIDER</option><option>COLOR_PICKER</option>
                                </select>
                            </div>

                            {/* isActive */}
                            <div className="flex items-center space-x-2">
                                <input id="active" type="checkbox" checked={isActive}
                                    onChange={e => setIsActive(e.target.checked)} className="h-4 w-4" />
                                <label htmlFor="active" className="text-sm">Ativo</label>
                            </div>

                            {/* Order */}
                            <div>
                                <label className="block text-sm font-medium">Ordem</label>
                                <input type="number" value={order}
                                    onChange={e => setOrder(Number(e.target.value))}
                                    className="mt-1 block w-full rounded border-gray-300 shadow-sm" />
                            </div>

                            {/* AutoPopulate */}
                            <div className="flex items-center space-x-2">
                                <input id="auto" type="checkbox" checked={autoPopulate}
                                    onChange={e => setAutoPopulate(e.target.checked)} className="h-4 w-4" />
                                <label htmlFor="auto" className="text-sm">Auto Popular</label>
                            </div>

                            {/* Min/Max */}
                            {type === 'RANGE' && <>
                                <div>
                                    <label className="block text-sm font-medium">Min</label>
                                    <input type="number" value={minValue}
                                        onChange={e => setMinValue(e.target.value === '' ? '' : Number(e.target.value))}
                                        className="mt-1 block w-full rounded border-gray-300 shadow-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">Max</label>
                                    <input type="number" value={maxValue}
                                        onChange={e => setMaxValue(e.target.value === '' ? '' : Number(e.target.value))}
                                        className="mt-1 block w-full rounded border-gray-300 shadow-sm" />
                                </div>
                            </>}

                            {/* Grupo + Modal */}
                            <div className="md:col-span-2 flex items-end space-x-2">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium">Grupo</label>
                                    <select value={groupId}
                                        onChange={e => setGroupId(e.target.value)}
                                        className="mt-1 block w-full rounded border-gray-300 shadow-sm">
                                        <option value="">— Nenhum —</option>
                                        {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                    </select>
                                </div>
                                <button type="button"
                                    onClick={() => setShowGroupModal(true)}
                                    className="mb-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                                    + Grupo
                                </button>
                            </div>

                            {/* Categorias */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-1">Categorias</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-40 overflow-auto p-2 border rounded">
                                    {categories.map(cat => (
                                        <label key={cat.id} className="flex items-center space-x-2">
                                            <input type="checkbox"
                                                checked={selectedCatIds.includes(cat.id)}
                                                onChange={() => toggleCategory(cat.id)}
                                                className="h-4 w-4" />
                                            <span className="text-sm">{cat.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {tab === 1 && (
                        <div className="space-y-4">
                            <button type="button" onClick={addOption}
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                                + Nova Opção
                            </button>
                            {options.map(opt => (
                                <div key={opt.id} className="flex flex-col md:flex-row md:items-end md:space-x-4 p-4 border rounded">
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {(['label', 'value', 'order', 'iconUrl', 'colorCode'] as const).map((k, i) =>
                                            <div key={i}>
                                                <label className="block text-sm">{k}</label>
                                                <input type={k === 'order' ? 'number' : 'text'}
                                                    value={(opt as any)[k]}
                                                    onChange={e => updateOption(opt.id, k,
                                                        k === 'order' ? Number(e.target.value) : e.target.value
                                                    )}
                                                    className="mt-1 block w-full rounded border-gray-300 shadow-sm" />
                                            </div>
                                        )}
                                        <div className="flex items-center space-x-2">
                                            <input type="checkbox" checked={opt.isDefault}
                                                onChange={e => updateOption(opt.id, 'isDefault', e.target.checked)}
                                                className="h-4 w-4" />
                                            <label className="text-sm">Padrão</label>
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => removeOption(opt.id)}
                                        className="mt-2 md:mt-0 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700">
                                        Remover
                                    </button>
                                </div>
                            ))}
                            {options.length === 0 && <p className="text-gray-500">Nenhuma opção.</p>}
                        </div>
                    )}

                    <div className="pt-4 border-t flex justify-end">
                        <button type="submit" disabled={submitting}
                            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                            {submitting ? 'Salvando...' : 'Salvar Filtro'}
                        </button>
                    </div>
                </form>
            </Section>

            {/* Modal de Grupos */}
            {showGroupModal && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded shadow-lg w-full max-w-lg">
                        <h2 className="text-xl font-medium mb-4">Gerenciar Grupos</h2>

                        <ul className="max-h-60 overflow-auto space-y-2 mb-4">
                            {groups.map(g => (
                                <li key={g.id} className="flex items-center justify-between p-2 border rounded">
                                    <span>{g.name} <small className="text-gray-500">({g.order})</small></span>
                                    <button onClick={() => handleDeleteGroup(g.id)}
                                        className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700">
                                        Excluir
                                    </button>
                                </li>
                            ))}
                            {groups.length === 0 && <p className="text-gray-500">Nenhum grupo.</p>}
                        </ul>

                        <div className="space-y-3 mb-4">
                            <div>
                                <label className="block text-sm">Nome do grupo</label>
                                <input value={newGroupName}
                                    onChange={e => setNewGroupName(e.target.value)}
                                    className="mt-1 block w-full rounded border-gray-300 shadow-sm" />
                            </div>
                            <div>
                                <label className="block text-sm">Ordem</label>
                                <input type="number" value={newGroupOrder}
                                    onChange={e => setNewGroupOrder(Number(e.target.value))}
                                    className="mt-1 block w-full rounded border-gray-300 shadow-sm" />
                            </div>
                        </div>

                        <div className="flex justify-end space-x-2">
                            <button onClick={() => setShowGroupModal(false)}
                                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">
                                Fechar
                            </button>
                            <button onClick={handleCreateGroup} disabled={groupSubmitting}
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50">
                                {groupSubmitting ? 'Criando...' : 'Novo Grupo'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </SidebarAndHeader>
    );
}