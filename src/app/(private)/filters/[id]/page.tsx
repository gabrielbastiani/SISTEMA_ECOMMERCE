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
interface Category { id: string; name: string; slug?: string }
interface CategoryFilter { id: string; category_id: string }

// Opções com labels amigáveis
const FIELD_NAME_OPTIONS = [
    { value: 'price_of', label: 'Preço Original' },
    { value: 'price_per', label: 'Preço Promocional' },
    { value: 'variantAttribute', label: 'Atributo da Variante' },
    { value: 'variant.sku', label: 'SKU da Variante' }, // usar variant.sku por compatibilidade
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

    // estados
    const [name, setName] = useState('');
    const [fieldName, setFieldName] = useState('');
    const [attributeKeys, setAttributeKeys] = useState<string[]>([]); // novo
    const [detectedKeys, setDetectedKeys] = useState<Record<string, string[]>>({});

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
    const [origCatFilters, setOrigCatFilters] = useState<CategoryFilter[]>([]);

    const [groups, setGroups] = useState<FilterGroup[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);

    const [showGroupModal, setShowGroupModal] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupOrder, setNewGroupOrder] = useState(0);
    const [groupSubmitting, setGroupSubmitting] = useState(false);

    const [submitting, setSubmitting] = useState(false);
    const [detecting, setDetecting] = useState(false);

    // Carrega dados iniciais (corrigido: busca filter + groups + categories em paralelo e garante que o grupo atual exista em `groups`)
    useEffect(() => {
        async function load() {
            try {
                // Buscas em paralelo:
                const filterPromise = api.get<any>(`/filters/get/${id}`);
                const groupsPromise = api.get<FilterGroup[]>('/filterGroups/getAll');
                const categoriesPromise = api.get<{ all_categories_disponivel: Category[] }>('/category/cms');
                const catFiltersPromise = api.get<CategoryFilter[]>(`/filter/categories?filter_id=${id}`).catch(() => ({ data: [] }));

                const [fRes, gRes, cRes, cfRes] = await Promise.all([filterPromise, groupsPromise, categoriesPromise, catFiltersPromise]);

                const d = fRes.data;

                // FIELDNAME / attributeKeys
                if (d.fieldName && d.fieldName.startsWith('variantAttribute:')) {
                    const parts = d.fieldName.split(':');
                    setFieldName('variantAttribute');
                    // join from index 1 to handle possible colons in key
                    setAttributeKeys([parts.slice(1).join(':')]);
                } else {
                    setFieldName(d.fieldName ?? '');
                    if (Array.isArray(d.attributeKeys) && d.attributeKeys.length > 0) {
                        setAttributeKeys(d.attributeKeys);
                    }
                }

                setName(d.name);
                setType(d.type);
                setDataType(d.dataType);
                setDisplayStyle(d.displayStyle);
                setIsActive(d.isActive);
                setOrder(d.order);
                setAutoPopulate(d.autoPopulate);
                setMinValue(d.minValue ?? '');
                setMaxValue(d.maxValue ?? '');
                // se backend devolveu o grupo do filtro, armazena o id
                const currentGroupId = d.group?.id ?? '';
                setGroupId(currentGroupId);

                // grupos: inclui o grupo atual no topo caso não esteja na lista retornada
                const fetchedGroups = Array.isArray(gRes.data) ? gRes.data : [];
                let mergedGroups = fetchedGroups;
                if (d.group && !fetchedGroups.some(g => g.id === d.group.id)) {
                    mergedGroups = [d.group, ...fetchedGroups];
                }
                setGroups(mergedGroups);

                // categorias
                setCategories((cRes.data && cRes.data.all_categories_disponivel) ? cRes.data.all_categories_disponivel : []);

                // category-filters
                const cfData = (cfRes && (cfRes as any).data) ? (cfRes as any).data : [];
                setOrigCatFilters(cfData ?? []);
                setSelectedCatIds((cfData ?? []).map((x: CategoryFilter) => x.category_id));
            } catch (err) {
                console.error(err);
                toast.error('Erro ao carregar filtro');
            }
        }
        load();
    }, [id]);

    // categorias
    const toggleCategory = (catId: string) =>
        setSelectedCatIds(s => s.includes(catId) ? s.filter(x => x !== catId) : [...s, catId]);

    // modal grupos
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
            await api.delete(`/filterGroups/deleteGroup/${grpId}`);
            setGroups(g => g.filter(x => x.id !== grpId));
            if (groupId === grpId) setGroupId(groups[0]?.id ?? '');
            toast.success('Grupo excluído');
        } catch {
            toast.error('Erro ao excluir grupo');
        }
    };

    // DETECT attribute keys (mesma lógica do Add page)
    async function detectAttributeKeysForSelectedCategories() {
        const toDetectCatIds = selectedCatIds.length ? selectedCatIds : (origCatFilters.map(x => x.category_id) ?? []);
        if (toDetectCatIds.length === 0) { toast.info('Selecione/associe ao menos 1 categoria para detectar atributos'); return; }
        setDetecting(true);
        try {// @ts-ignore
            // caso o backend espere params, pode ser necessário ajustar para: api.get('/filters/detectAttributeKeys', { params: { categoryIds: toDetectCatIds } })
            const r = await api.get('/filters/detectAttributeKeys', { categoryIds: toDetectCatIds });
            if (r?.data?.keys) {
                const map: Record<string, string[]> = {};
                for (const k of r.data.keys) {
                    if (typeof k === 'string') map[k] = [];
                    else if (k.key) map[k.key] = k.samples ?? [];
                }
                setDetectedKeys(map);
                toast.success('Chaves detectadas (backend)');
                setDetecting(false);
                return;
            }
        } catch (err) {
            console.warn('detectAttributeKeys failed (update page):', err);
        }

        // fallback: informa ao admin que endpoint não existe
        toast.info('Endpoint de detecção não disponível no backend. Implemente /filters/detectAttributeKeys ou use a detecção por produtos (manual).');
        setDetecting(false);
    }

    function toggleAttributeKey(key: string) {
        setAttributeKeys(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])
    }

    // submit
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            // compõe fieldName final (se variantAttribute e atributo informado)
            let finalFieldName = fieldName;
            if (fieldName === 'variantAttribute' && attributeKeys.length === 1) {
                finalFieldName = `variantAttribute:${attributeKeys[0]}`;
            }

            const payload = {
                name, fieldName: finalFieldName, type, dataType, displayStyle,
                isActive, order, autoPopulate,
                minValue: minValue === '' ? null : minValue,
                maxValue: maxValue === '' ? null : maxValue,
                groupId: groupId || null,
                attributeKeys
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

    // Render (UI similar à versão anterior + seção de atributo detectado)
    return (
        <SidebarAndHeader>
            <Section>
                <TitlePage title="ATUALIZAR FILTRO" />

                <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        <div className="md:col-span-2">
                            <Tooltip className="bg-white text-red-500 border border-gray-200 p-2" content="Selecione uma ou mais categorias, caso esse filtro precise aparecer em pagina(s) dessas categorias." placement="top-start">
                                <label className="block text-sm mb-1">Página de categorias</label>
                            </Tooltip>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-40 overflow-auto p-2 border rounded">
                                {categories.map(cat => (
                                    <label key={cat.id} className="flex items-center space-x-2">
                                        <input type="checkbox" checked={selectedCatIds.includes(cat.id)} onChange={() => toggleCategory(cat.id)} className="h-4 w-4" />
                                        <span className="text-sm">{cat.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Nome */}
                        <div>
                            <Tooltip className="bg-white text-red-500 border border-gray-200 p-2" content="Nome a ser exibido no front (ex.: Preço, Cor)" placement="top-start">
                                <input type="text" required value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full rounded border-gray-300 shadow-sm text-black p-2" placeholder="Nome do filtro" />
                            </Tooltip>
                        </div>

                        {/* Identificador */}
                        <div>
                            <Tooltip className="bg-white text-red-500 border border-gray-200 p-2" content="Nome do campo ou identificador associado (ex.: price_per ou variantAttribute)" placement="top-start">
                                <select required value={fieldName} onChange={e => setFieldName(e.target.value)} className="mt-1 block w-full rounded border-gray-300 shadow-sm text-black p-2">
                                    <option value="">Selecione um campo</option>
                                    {FIELD_NAME_OPTIONS.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </Tooltip>
                        </div>

                        {/* Se variantAttribute: painel para attributeKeys */}
                        {fieldName === 'variantAttribute' && (
                            <div className="md:col-span-2 p-2 border rounded">
                                <div className="flex items-center justify-between mb-2">
                                    <div>
                                        <strong>Chaves de atributo do filtro</strong>
                                        <div className="text-xs text-gray-500">Escolha as chaves de atributo que o filtro deve considerar (ex.: cor, tamanho).</div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button type="button" onClick={detectAttributeKeysForSelectedCategories} disabled={detecting || selectedCatIds.length === 0}
                                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                                            {detecting ? 'Detectando...' : 'Detectar chaves'}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    {Object.keys(detectedKeys).length === 0 && <div className="text-sm text-gray-500">Nenhuma chave detectada. Use "Detectar chaves" ou adicione manualmente.</div>}
                                    {Object.entries(detectedKeys).map(([k, samples]) => {
                                        const checked = attributeKeys.includes(k)
                                        return (
                                            <div key={k} className="flex items-start justify-between bg-gray-50 p-2 rounded text-black">
                                                <div>
                                                    <label className="flex items-center gap-2">
                                                        <input type="checkbox" checked={checked} onChange={() => toggleAttributeKey(k)} />
                                                        <span className="font-medium">{k}</span>
                                                    </label>
                                                    <div className="text-xs text-gray-500 mt-1">Ex.: {samples.slice(0, 6).join(', ') || '—'}</div>
                                                </div>
                                                <div className="text-xs text-gray-500">Valores ≈ {samples.length}</div>
                                            </div>
                                        )
                                    })}

                                    <div className="mt-2">
                                        <label className="block text-sm">Chaves manualmente</label>
                                        <input type="text" placeholder="Ex.: cor" onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault()
                                                const val = (e.target as HTMLInputElement).value.trim()// @ts-ignore
                                                if (val && !attributeKeys.includes(val)) setAttributeKeys(prev => [...prev, val])
                                                    (e.target as HTMLInputElement).value = ''
                                            }
                                        }} className="mt-1 block w-full rounded border-gray-300 text-black p-2" />
                                        {attributeKeys.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-2 text-black">
                                                {attributeKeys.map(k => (
                                                    <div key={k} className="px-2 py-1 bg-gray-200 rounded flex items-center gap-2">
                                                        <span className="text-sm">{k}</span>
                                                        <button type="button" onClick={() => setAttributeKeys(prev => prev.filter(x => x !== k))} className="text-xs px-1">x</button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* restante do formulário (sem alterações significativas) */}
                        <div>
                            <Tooltip className="bg-white text-red-500 border border-gray-200 p-2" content="Tipo de filtro: RANGE, SELECT, MULTI_SELECT" placement="top-start">
                                <select value={type} onChange={e => setType(e.target.value as FilterType)} className="mt-1 block w-full rounded border-gray-300 shadow-sm text-black p-2">
                                    <option value="SELECT">SELECT</option>
                                    <option value="MULTI_SELECT">MULTI_SELECT</option>
                                    <option value="RANGE">RANGE</option>
                                </select>
                            </Tooltip>
                        </div>

                        <div>
                            <Tooltip className="bg-white text-red-500 border border-gray-200 p-2" content="Tipo de dado subjacente (NUMBER, STRING, etc.)" placement="top-start">
                                <select value={dataType} onChange={e => setDataType(e.target.value as FilterDataType)} className="mt-1 block w-full rounded border-gray-300 shadow-sm text-black p-2">
                                    <option value="STRING">STRING</option>
                                    <option value="NUMBER">NUMBER</option>
                                </select>
                            </Tooltip>
                        </div>

                        <div>
                            <Tooltip className="bg-white text-red-500 border border-gray-200 p-2" content="Define o componente visual a ser usado" placement="top-start">
                                <select value={displayStyle} onChange={e => setDisplayStyle(e.target.value as FilterDisplayStyle)} className="mt-1 block w-full rounded border-gray-300 shadow-sm text-black p-2">
                                    <option value="DROPDOWN">DROPDOWN</option>
                                    <option value="CHECKBOX">CHECKBOX</option>
                                    <option value="SLIDER">SLIDER</option>
                                </select>
                            </Tooltip>
                        </div>

                        <div className="flex items-center space-x-2">
                            <input id="active" type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="h-4 w-4" />
                            <Tooltip className="bg-white text-red-500 border border-gray-200 p-2" content="Ativar/desativar este filtro" placement="top-start">
                                <label htmlFor="active" className="text-sm">Ativo</label>
                            </Tooltip>
                        </div>

                        <div>
                            <Tooltip className="bg-white text-red-500 border border-gray-200 p-2" content="Define a ordem de exibição entre os filtros" placement="top-start">
                                <input type="number" value={order} onChange={e => setOrder(Number(e.target.value))} className="mt-1 block w-full rounded border-gray-300 shadow-sm text-black p-2" />
                            </Tooltip>
                        </div>

                        <div className="flex items-center space-x-2">
                            <input id="auto" type="checkbox" checked={autoPopulate} onChange={e => setAutoPopulate(e.target.checked)} className="h-4 w-4" />
                            <Tooltip className="bg-white text-red-500 border border-gray-200 p-2" content="Se verdadeiro, o sistema pode preencher opções baseado nos produtos cadastrados." placement="top-start">
                                <label htmlFor="auto" className="text-sm">Auto Popular</label>
                            </Tooltip>
                        </div>

                        {type === 'RANGE' && (
                            <>
                                <div>
                                    <Tooltip className="bg-white text-red-500 border border-gray-200 p-2" content="Ex.: preço mínimo pré-configurado (opcional)" placement="top-start">
                                        <input type="number" value={minValue} onChange={e => setMinValue(e.target.value === '' ? '' : Number(e.target.value))} className="mt-1 block w-full rounded border-gray-300 shadow-sm text-black p-2" />
                                    </Tooltip>
                                </div>
                                <div>
                                    <Tooltip className="bg-white text-red-500 border border-gray-200 p-2" content="Ex.: preço máximo pré-configurado (opcional)" placement="top-start">
                                        <input type="number" value={maxValue} onChange={e => setMaxValue(e.target.value === '' ? '' : Number(e.target.value))} className="mt-1 block w-full rounded border-gray-300 shadow-sm text-black p-2" />
                                    </Tooltip>
                                </div>
                            </>
                        )}

                        <div className="md:col-span-2 flex items-end space-x-2">
                            <div className="flex-1">
                                <Tooltip className="bg-white text-red-500 border border-gray-200 p-2" content="O grupo representa por exemplo: Caracteristicas, Preços etc..." placement="top-start">
                                    <select value={groupId} onChange={e => setGroupId(e.target.value)} className="mt-1 block w-full rounded border-gray-300 shadow-sm text-black p-2">
                                        <option value="">— Nenhum —</option>
                                        {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                    </select>
                                </Tooltip>
                            </div>
                            <button type="button" onClick={() => setShowGroupModal(true)} className="mb-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700">+ Grupo</button>
                        </div>
                    </div>

                    <div className="pt-4 border-t flex justify-end">
                        <button type="submit" disabled={submitting} className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50">
                            {submitting ? 'Atualizando...' : 'Atualizar Filtro'}
                        </button>
                    </div>
                </form>
            </Section>

            {showGroupModal && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded shadow-lg w-full max-w-lg">
                        <h2 className="text-xl font-medium mb-4 text-black">Gerenciar Grupos</h2>
                        <ul className="max-h-60 overflow-auto space-y-2 mb-4">
                            {groups.map(g => (
                                <li key={g.id} className="flex justify-between p-2 border rounded">
                                    <span className='text-black'>{g.name} ({g.order})</span>
                                    <button onClick={() => handleDeleteGroup(g.id)} className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700">Excluir</button>
                                </li>
                            ))}
                        </ul>
                        <div className="space-y-3 mb-4">
                            <div>
                                <Tooltip className="bg-white text-red-500 border border-gray-200 p-2" content="Nome do grupo (ex.: Características, Preço)" placement="top-start">
                                    <input type="text" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} className="mt-1 block w-full rounded border-black border-2 shadow-sm text-black p-2" placeholder="Nome do grupo" />
                                </Tooltip>
                            </div>
                            <div>
                                <Tooltip className="bg-white text-red-500 border border-gray-200 p-2" content="Ordem de exibição do grupo na interface de usuário" placement="top-start">
                                    <input type="number" value={newGroupOrder} onChange={e => setNewGroupOrder(Number(e.target.value))} className="mt-1 block w-full rounded border-black border-2 shadow-sm text-black p-2" placeholder="Ordem" />
                                </Tooltip>
                            </div>
                        </div>
                        <div className="flex justify-end space-x-2">
                            <button onClick={() => setShowGroupModal(false)} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 text-black">Cancelar</button>
                            <button onClick={handleCreateGroup} disabled={groupSubmitting} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50">
                                {groupSubmitting ? 'Criando...' : 'Novo Grupo'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </SidebarAndHeader>
    );
}