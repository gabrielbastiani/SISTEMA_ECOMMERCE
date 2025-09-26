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

// Opções com labels amigáveis (adicionado productCharacteristic)
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
    { value: 'category', label: 'Categoria' },
    { value: 'productCharacteristic', label: 'Característica do Produto (ex: material)' }
];

export default function FilterUpdate() {

    const { id } = useParams<{ id: string }>();
    const api = setupAPIClientEcommerce();
    const router = useRouter();

    // estados
    const [isLoading, setIsLoading] = useState(true);
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

    // Carrega dados iniciais (busca filter + groups + categories em paralelo)
    useEffect(() => {
        async function load() {
            setIsLoading(true);
            try {
                const filterPromise = api.get<any>(`/filters/get/${id}`);
                const groupsPromise = api.get<FilterGroup[]>('/filterGroups/getAll');
                const categoriesPromise = api.get<{ all_categories_disponivel: Category[] }>('/category/cms');
                const catFiltersPromise = api.get<CategoryFilter[]>(`/filter/categories?filter_id=${id}`).catch(() => ({ data: [] }));

                const [fRes, gRes, cRes, cfRes] = await Promise.all([filterPromise, groupsPromise, categoriesPromise, catFiltersPromise]);

                const d = fRes.data;

                // FIELDNAME / attributeKeys: trata variantAttribute:xxx e productCharacteristic:xxx
                if (d.fieldName && typeof d.fieldName === 'string' && d.fieldName.startsWith('variantAttribute:')) {
                    const parts = d.fieldName.split(':');
                    setFieldName('variantAttribute');
                    setAttributeKeys([parts.slice(1).join(':')]);
                } else if (d.fieldName && typeof d.fieldName === 'string' && d.fieldName.startsWith('productCharacteristic:')) {
                    const parts = d.fieldName.split(':');
                    setFieldName('productCharacteristic');
                    setAttributeKeys([parts.slice(1).join(':')]);
                } else {
                    setFieldName(d.fieldName ?? '');
                    if (Array.isArray(d.attributeKeys) && d.attributeKeys.length > 0) {
                        setAttributeKeys(d.attributeKeys);
                    }
                }

                setName(d.name ?? '');
                setType(d.type ?? 'SELECT');
                setDataType(d.dataType ?? 'STRING');
                setDisplayStyle(d.displayStyle ?? 'DROPDOWN');
                setIsActive(Boolean(d.isActive));
                setOrder(Number(d.order ?? 0));
                setAutoPopulate(Boolean(d.autoPopulate));
                setMinValue(d.minValue ?? '');
                setMaxValue(d.maxValue ?? '');
                const currentGroupId = d.group?.id ?? '';
                setGroupId(currentGroupId);

                const fetchedGroups = Array.isArray(gRes.data) ? gRes.data : [];
                let mergedGroups = fetchedGroups;
                if (d.group && !fetchedGroups.some(g => g.id === d.group.id)) {
                    mergedGroups = [d.group, ...fetchedGroups];
                }
                setGroups(mergedGroups);

                setCategories((cRes.data && cRes.data.all_categories_disponivel) ? cRes.data.all_categories_disponivel : []);

                const cfData = (cfRes && (cfRes as any).data) ? (cfRes as any).data : [];
                setOrigCatFilters(cfData ?? []);
                setSelectedCatIds((cfData ?? []).map((x: CategoryFilter) => x.category_id));
            } catch (err) {
                console.error(err);
                toast.error('Erro ao carregar filtro');
            } finally {
                setIsLoading(false);
            }
        }
        load();
    }, [id]);

    // categorias
    const toggleCategory = (catId: string) =>
        setSelectedCatIds(s => s.includes(catId) ? s.filter(x => x !== catId) : [...s, catId]);

    // modal grupos
    const handleCreateGroup = async () => {
        if (!newGroupName.trim()) { toast.error('Nome do grupo obrigatório'); return; }
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

    // DETECT attribute keys (agora suporta productCharacteristic e variantAttribute corretamente)
    async function detectAttributeKeysForSelectedCategories() {
        const toDetectCatIds = selectedCatIds.length ? selectedCatIds : (origCatFilters.map(x => x.category_id) ?? []);
        if (toDetectCatIds.length === 0) { toast.info('Selecione/associe ao menos 1 categoria para detectar atributos'); return; }
        setDetecting(true);

        // decide source com base no fieldName
        const source = fieldName === 'variantAttribute' ? 'variant' : (fieldName === 'productCharacteristic' ? 'productCharacteristic' : 'both');

        try {
            // usar endpoint dedicado via POST e passar source
            const r = await api.post('/filters/detectAttributeKeys', { categoryIds: toDetectCatIds, source });
            // backend pode retornar keys como array de strings ou array de { key, samples }
            if (r?.data?.keys) {
                const map: Record<string, string[]> = {};
                for (const k of r.data.keys) {
                    if (typeof k === 'string') map[k] = [];
                    else if (k && (k.key || k.samples)) {
                        const keyName = String(k.key ?? k.name ?? '');
                        map[keyName] = Array.isArray(k.samples) ? k.samples.map(String) : [];
                    }
                }
                setDetectedKeys(map);
                toast.success('Chaves detectadas (backend)');
                setDetecting(false);
                return;
            }

            // se backend retornar details.variantKeys/details.productCharacteristicKeys (compat layer)
            if (r?.data?.details) {
                const map: Record<string, string[]> = {};
                if (r.data.details.variantKeys && (source === 'variant' || source === 'both')) {
                    for (const k of r.data.details.variantKeys) map[String(k)] = [];
                }
                if (r.data.details.productCharacteristicKeys && (source === 'productCharacteristic' || source === 'both')) {
                    for (const k of r.data.details.productCharacteristicKeys) map[String(k)] = [];
                }
                if (Object.keys(map).length > 0) {
                    setDetectedKeys(map);
                    toast.success('Chaves detectadas (backend details)');
                    setDetecting(false);
                    return;
                }
            }
        } catch (err) {
            console.warn('detectAttributeKeys failed (update page):', err);
        }

        // FALLBACK local: buscar produtos das categorias e inferir apenas a origem desejada
        try {
            const mapSamples: Record<string, Set<string>> = {};
            const catsWithSlugs = categories.filter(c => toDetectCatIds.includes(c.id) && c.slug).map(c => c.slug as string);

            if (catsWithSlugs.length === 0) {
                toast.error('Não foi possível detectar chaves automaticamente (faltam slugs nas categorias). Implemente /filters/detectAttributeKeys no backend ou adicione slugs às categorias.');
                setDetecting(false);
                return;
            }

            for (const slug of catsWithSlugs) {
                const resp = await api.get(`/categories/${encodeURIComponent(slug)}/products`, { params: { perPage: 200, page: 1 } });
                const products = resp.data?.products ?? [];
                for (const p of products) {
                    // variant attributes (se necessário)
                    if (source === 'variant' || source === 'both') {
                        if (Array.isArray(p.variants)) {
                            for (const v of p.variants) {
                                if (Array.isArray(v.attributes)) {
                                    for (const a of v.attributes) {
                                        const k = a.key;
                                        const val = a.value;
                                        if (!k) continue;
                                        if (!mapSamples[k]) mapSamples[k] = new Set();
                                        if (val !== undefined && val !== null) mapSamples[k].add(String(val));
                                    }
                                } else if (Array.isArray(v.variantAttribute)) {
                                    for (const a of v.variantAttribute) {
                                        const k = a.key;
                                        const val = a.value;
                                        if (!k) continue;
                                        if (!mapSamples[k]) mapSamples[k] = new Set();
                                        if (val !== undefined && val !== null) mapSamples[k].add(String(val));
                                    }
                                }
                            }
                        }
                    }

                    // productCharacteristics (se necessário) - não misturar com variant attributes
                    if (source === 'productCharacteristic' || source === 'both') {
                        if (Array.isArray(p.productCharacteristics)) {
                            for (const pc of p.productCharacteristics) {
                                const k = pc.key;
                                const val = pc.value;
                                if (!k) continue;
                                if (!mapSamples[k]) mapSamples[k] = new Set();
                                if (val !== undefined && val !== null) mapSamples[k].add(String(val));
                            }
                        }
                    }
                }
            }

            const mapObj: Record<string, string[]> = {};
            for (const k of Object.keys(mapSamples)) mapObj[k] = Array.from(mapSamples[k]).slice(0, 10);
            setDetectedKeys(mapObj);
            toast.success('Chaves detectadas (fallback por produtos)');
        } catch (err) {
            console.error('detectAttributeKeys fallback error', err);
            toast.error('Erro ao detectar chaves de atributos');
        } finally {
            setDetecting(false);
        }
    }

    function toggleAttributeKey(key: string) {
        setAttributeKeys(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])
    }

    // submit
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            let finalFieldName = fieldName;
            // compõe fieldName final para variantAttribute ou productCharacteristic quando exatamente 1 key escolhida
            if (fieldName === 'variantAttribute' && attributeKeys.length === 1) {
                finalFieldName = `variantAttribute:${attributeKeys[0]}`;
            }
            if (fieldName === 'productCharacteristic' && attributeKeys.length === 1) {
                finalFieldName = `productCharacteristic:${attributeKeys[0]}`;
            }

            const payload = {
                name, fieldName: finalFieldName, type, dataType, displayStyle,
                isActive, order, autoPopulate,
                minValue: minValue === '' ? null : minValue,
                maxValue: maxValue === '' ? null : maxValue,
                groupId: groupId || null,
                attributeKeys
            };

            // 1) PUT filter
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

    // Skeleton helper components (simple inline functions)
    const SkeletonLine = ({ width = 'w-full', height = 'h-4' }: { width?: string, height?: string }) => (
        <div className={`bg-gray-200 rounded ${height} ${width} animate-pulse`} />
    );

    const SkeletonBox = ({ w = 'w-full', h = 'h-8' }: { w?: string, h?: string }) => (
        <div className={`${w} ${h} bg-gray-200 rounded animate-pulse`} />
    );

    // Render (UI)
    return (
        <SidebarAndHeader>
            <Section>
                {/* Title stays visible but we show skeleton content until loaded */}
                <TitlePage title="ATUALIZAR FILTRO" />

                {isLoading ? (
                    // SKELETON LAYOUT
                    <div className="mt-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <div className="mb-2">
                                    <SkeletonLine width="w-1/4" height="h-6" />
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-2 border rounded">
                                    {/* 8 small boxes */}
                                    {Array.from({ length: 8 }).map((_, i) => (
                                        <div key={i} className="h-8 bg-gray-200 rounded animate-pulse" />
                                    ))}
                                </div>
                            </div>

                            <div>
                                <SkeletonLine width="w-full" height="h-10" />
                            </div>

                            <div>
                                <SkeletonBox w="w-full" h="h10" />
                            </div>

                            <div className="md:col-span-2 p-2 border rounded space-y-2">
                                <SkeletonLine width="w-1/3" height="h-5" />
                                <div className="grid grid-cols-2 gap-2">
                                    <SkeletonLine width="w-full" height="h-8" />
                                    <SkeletonLine width="w-full" height="h-8" />
                                </div>
                                <SkeletonLine width="w-2/3" height="h-4" />
                            </div>

                            <div>
                                <SkeletonLine width="w-full" height="h-10" />
                            </div>

                            <div>
                                <SkeletonLine width="w-full" height="h-10" />
                            </div>

                            <div>
                                <SkeletonLine width="w-full" height="h-10" />
                            </div>

                            <div>
                                <SkeletonLine width="w-full" height="h-10" />
                            </div>

                            <div className="md:col-span-2 flex items-end justify-end">
                                <div className="w-40 h-10 bg-gray-200 rounded animate-pulse" />
                            </div>
                        </div>
                    </div>
                ) : (
                    // REAL FORM (entire form as before)
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
                                <Tooltip className="bg-white text-red-500 border border-gray-200 p-2" content="Nome do campo ou identificador associado (ex.: price_per ou variantAttribute ou productCharacteristic)" placement="top-start">
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

                            {/* Se variantAttribute ou productCharacteristic: painel para attributeKeys */}
                            {(fieldName === 'variantAttribute' || fieldName === 'productCharacteristic') && (
                                <div className="md:col-span-2 p-2 border rounded">
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <strong>{fieldName === 'variantAttribute' ? 'Chaves de atributo do filtro' : 'Chaves de característica do produto'}</strong>
                                            <div className="text-xs text-gray-500">Escolha as chaves que o filtro deve considerar. Use detectar para buscar amostras.</div>
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
                )}
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