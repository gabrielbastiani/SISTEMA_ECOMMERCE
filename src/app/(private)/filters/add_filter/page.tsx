'use client'

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Section } from '@/app/components/section';
import { TitlePage } from '@/app/components/section/titlePage';
import { SidebarAndHeader } from '@/app/components/sidebarAndHeader';
import { setupAPIClientEcommerce } from '@/app/services/apiEcommerce';
import { toast } from 'react-toastify';
import { Tooltip } from '@nextui-org/react';

type FilterType = 'RANGE' | 'SELECT' | 'MULTI_SELECT';
type FilterDataType = 'NUMBER' | 'STRING' | 'DATE' | 'BOOLEAN';
type FilterDisplayStyle = 'SLIDER' | 'DROPDOWN' | 'CHECKBOX' | 'RADIO' | 'COLOR_PICKER';

interface FilterGroup { id: string; name: string; order: number }
interface Category { id: string; name: string; slug?: string }
interface CategoryCmsResponse { all_categories_disponivel: Category[]; }

const FIELD_NAME_OPTIONS = [
  { value: 'price_of', label: 'Preço Original' },
  { value: 'price_per', label: 'Preço Promocional' },
  { value: 'variantAttribute', label: 'Atributo da Variante (ex: cor, tamanho)' },
  { value: 'variant.sku', label: 'SKU da Variante' },
  { value: 'skuMaster', label: 'SKU Mestre' },
  { value: 'brand', label: 'Marca' },
  { value: 'weight', label: 'Peso' },
  { value: 'length', label: 'Comprimento' },
  { value: 'width', label: 'Largura' },
  { value: 'height', label: 'Altura' },
  { value: 'view', label: 'Visualizações' },
  { value: 'rating', label: 'Avaliação (reviews)' },
  { value: 'category', label: 'Categoria' },
  { value: 'productCharacteristic', label: 'Característica do Produto (ex: material, cor manual)' }
];

export default function AddFilterPage() {

  // NOTA: não tornamos `api` dependência do useEffect para evitar re-runs infinitos,
  // pois setupAPIClientEcommerce() pode retornar um objeto novo a cada render.
  const api = setupAPIClientEcommerce();
  const router = useRouter();

  // estados
  const [isLoading, setIsLoading] = useState(true);
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

  // novo: controla se o filtro aparece na página de busca
  const [forSearch, setForSearch] = useState<boolean>(false);

  // attribute keys
  const [attributeKeys, setAttributeKeys] = useState<string[]>([]);
  const [detectedKeys, setDetectedKeys] = useState<Record<string, string[]>>({});

  const [groups, setGroups] = useState<FilterGroup[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [showGroupModal, setShowGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupOrder, setNewGroupOrder] = useState(0);
  const [groupSubmitting, setGroupSubmitting] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [detecting, setDetecting] = useState(false);

  // load groups + categories (apenas uma vez)
  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        // indica loading só enquanto fetch está ativo
        if (mounted) setIsLoading(true);

        const [gRes, cRes] = await Promise.all([
          api.get<FilterGroup[]>('/filterGroups/getAll').catch(() => ({ data: [] })),
          api.get<CategoryCmsResponse>('/category/cms').catch(() => ({ data: { all_categories_disponivel: [] } }))
        ]);

        if (!mounted) return;

        setGroups(Array.isArray((gRes as any).data) ? (gRes as any).data : []);
        setCategories((cRes as any).data?.all_categories_disponivel ?? []);
      } catch (err) {
        console.error('load groups/categories error', err);
        toast.error('Erro ao carregar dados iniciais');
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    load();

    return () => { mounted = false; };
    // <-- Intencionalmente sem dependências para evitar re-execução infinita
  }, []); // NÃO incluir `api` aqui

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) { toast.error('Nome do grupo obrigatório'); return; }
    setGroupSubmitting(true);
    try {
      const r = await api.post<FilterGroup>('/filterGroups/create', { name: newGroupName, order: newGroupOrder });
      setGroups(prev => [...prev, r.data]);
      setGroupId(r.data.id);
      setNewGroupName(''); setNewGroupOrder(0);
      toast.success('Grupo criado');
      setShowGroupModal(false);
    } catch (err) {
      console.error('create group error', err);
      toast.error('Erro ao criar grupo');
    } finally {
      setGroupSubmitting(false);
    }
  };

  const handleDeleteGroup = async (id: string) => {
    try {
      await api.delete(`/filterGroups/deleteGroup/${id}`);
      setGroups(prev => prev.filter(x => x.id !== id));
      toast.success('Grupo excluído');
      setGroupId(prev => (prev === id ? (groups[0]?.id || '') : prev));
    } catch (err) {
      console.error('delete group error', err);
      toast.error('Erro ao excluir grupo');
    }
  };

  const toggleCategory = (id: string) =>
    setSelectedCatIds(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  async function detectAttributeKeysForSelectedCategories() {
    if (selectedCatIds.length === 0) { toast.info('Selecione ao menos 1 categoria para detectar atributos'); return; }
    setDetecting(true);
    try {
      const source = fieldName === 'variantAttribute' ? 'variant' : (fieldName === 'productCharacteristic' ? 'productCharacteristic' : 'both');
      const r = await api.post('/filters/detectAttributeKeys', { categoryIds: selectedCatIds, source });
      if (r?.data?.keys || (r?.data?.keysWithCounts)) {
        const keysRaw = r.data.keys ?? Object.keys(r.data.keysWithCounts ?? {}).map(k => k);
        const map: Record<string, string[]> = {};
        for (const k of keysRaw) map[k] = [];
        if (r.data.details) {
          if (r.data.details.variantKeys) {
            for (const k of r.data.details.variantKeys) if (k) map[k] = map[k] ?? [];
          }
        }
        setDetectedKeys(map);
        toast.success('Chaves detectadas');
        setDetecting(false);
        return;
      }
    } catch (err) {
      console.warn('detectAttributeKeys: endpoint dedicated failed:', err);
    }

    // fallback
    try {
      const mapSamples: Record<string, Set<string>> = {};
      const catsWithSlugs = categories.filter(c => selectedCatIds.includes(c.id) && c.slug).map(c => c.slug as string);
      if (catsWithSlugs.length === 0) {
        toast.error('Não foi possível detectar chaves automaticamente (faltam slugs nas categorias).');
        setDetecting(false);
        return;
      }

      for (const slug of catsWithSlugs) {
        const resp = await api.get(`/categories/${encodeURIComponent(slug)}/products`, { params: { perPage: 200, page: 1 } });
        const products = resp.data?.products ?? [];
        for (const p of products) {
          if (Array.isArray(p.variants)) {
            for (const v of p.variants) {
              if (Array.isArray(v.attributes)) {
                for (const a of v.attributes) {
                  const k = a.key; const val = a.value;
                  if (!k) continue;
                  if (!mapSamples[k]) mapSamples[k] = new Set();
                  if (val !== undefined && val !== null) mapSamples[k].add(String(val));
                }
              } else if (Array.isArray(v.variantAttribute)) {
                for (const a of v.variantAttribute) {
                  const k = a.key; const val = a.value;
                  if (!k) continue;
                  if (!mapSamples[k]) mapSamples[k] = new Set();
                  if (val !== undefined && val !== null) mapSamples[k].add(String(val));
                }
              }
            }
          }
          if (Array.isArray(p.productCharacteristics)) {
            for (const pc of p.productCharacteristics) {
              const k = pc.key; const val = pc.value;
              if (!k) continue;
              if (!mapSamples[k]) mapSamples[k] = new Set();
              if (val !== undefined && val !== null) mapSamples[k].add(String(val));
            }
          }
        }
      }

      const mapObj: Record<string, string[]> = {}
      for (const k of Object.keys(mapSamples)) mapObj[k] = Array.from(mapSamples[k]).slice(0, 10)
      setDetectedKeys(mapObj)
      toast.success('Chaves detectadas (fallback por produtos)');
    } catch (err) {
      console.error('detectAttributeKeys fallback error', err)
      toast.error('Erro ao detectar chaves de atributos');
    } finally {
      setDetecting(false);
    }
  }

  function toggleAttributeKey(key: string) {
    setAttributeKeys(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name,
        fieldName,
        type,
        dataType,
        displayStyle,
        isActive,
        order,
        autoPopulate,
        minValue: minValue === '' ? null : minValue,
        maxValue: maxValue === '' ? null : maxValue,
        groupId: groupId || null,
        attributeKeys,
        forSearch
      };

      const r = await api.post<{ id: string }>('/filters/create', payload);
      const filterId = r.data.id;

      if (selectedCatIds.length > 0) {
        await Promise.all(selectedCatIds.map(catId => api.post('/categoryFilters/create', { category_id: catId, filter_id: filterId })));
      }

      toast.success('Filtro cadastrado!');
      router.push('/filters');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao cadastrar filtro');
    } finally {
      setSubmitting(false);
    }
  };

  // Skeleton components
  const SkeletonLine = ({ width = 'w-full', height = 'h-4' }: { width?: string, height?: string }) => (
    <div className={`bg-gray-200 rounded ${height} ${width} animate-pulse`} />
  );

  if (isLoading) {
    return (
      <SidebarAndHeader>
        <Section>
          <TitlePage title="ADICIONAR FILTRO" />
          <div className="mt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <SkeletonLine width="w-1/4" height="h-6" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-40 overflow-auto p-2 border rounded mt-2">
                  {Array.from({ length: 8 }).map((_, i) => (<div key={i} className="h-8 bg-gray-200 rounded animate-pulse" />))}
                </div>
              </div>
              <div><SkeletonLine width="w-full" height="h-10" /></div>
              <div><SkeletonLine width="w-full" height="h-10" /></div>
              <div className="md:col-span-2 p-2 border rounded space-y-2">
                <SkeletonLine width="w-1/3" height="h-5" />
                <div className="grid grid-cols-2 gap-2">
                  <SkeletonLine width="w-full" height="h-8" />
                  <SkeletonLine width="w-full" height="h-8" />
                </div>
                <SkeletonLine width="w-2/3" height="h-4" />
              </div>
            </div>
          </div>
        </Section>
      </SidebarAndHeader>
    );
  }

  return (
    <SidebarAndHeader>
      <Section>
        <TitlePage title="ADICIONAR FILTRO" />

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <Tooltip className="bg-white text-red-500 border border-gray-200 p-2" content="Selecione uma ou mais categorias para exibir esse filtro." placement="top-start">
                <label className="block text-sm font-medium mb-1">Página de categorias</label>
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

            <div>
              <Tooltip content="Nome a ser exibido no front (ex.: Preço, Cor)">
                <input required value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full rounded border-gray-300 shadow-sm text-black p-2" />
              </Tooltip>
            </div>

            <div>
              <Tooltip content="Nome do campo ou identificador (ex.: price_per, variantAttribute)">
                <select required value={fieldName} onChange={e => setFieldName(e.target.value)} className="mt-1 block w-full rounded border-gray-300 shadow-sm text-black p-2">
                  <option value="">Selecione um campo</option>
                  {FIELD_NAME_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </Tooltip>
            </div>

            {(fieldName === 'variantAttribute' || fieldName === 'productCharacteristic') && (
              <div className="md:col-span-2 p-2 border rounded">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <strong>{fieldName === 'variantAttribute' ? 'Chaves de atributo (variant attributes)' : 'Chaves de característica (product characteristics)'}</strong>
                    <div className="text-xs text-gray-500">Selecione as chaves que este filtro deve considerar ao popular opções automaticamente.</div>
                  </div>
                  <div>
                    <button type="button" onClick={detectAttributeKeysForSelectedCategories} disabled={detecting || selectedCatIds.length === 0} className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                      {detecting ? 'Detectando...' : 'Detectar chaves'}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {Object.keys(detectedKeys).length === 0 && <div className="text-sm text-gray-500">Nenhuma chave detectada ainda. Clique em "Detectar chaves" ou adicione manualmente.</div>}
                  {Object.entries(detectedKeys).map(([k, samples]) => {
                    const checked = attributeKeys.includes(k);
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
                    );
                  })}

                  <div className="mt-2">
                    <label className="block text-sm">Adicionar chave manual</label>
                    <input type="text" placeholder="Ex.: cor" onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = (e.target as HTMLInputElement).value.trim();
                        if (val && !attributeKeys.includes(val)) setAttributeKeys(prev => [...prev, val]);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }} className="mt-1 block w-full rounded border-gray-300 text-black p-2" />
                    <div className="text-xs text-gray-500 mt-1">Pressione Enter para adicionar</div>

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

            <div>
              <Tooltip content="Tipo de filtro: RANGE, SELECT, MULTI_SELECT">
                <select value={type} onChange={e => setType(e.target.value as any)} className="mt-1 block w-full rounded border-gray-300 shadow-sm text-black p-2">
                  <option>SELECT</option><option>MULTI_SELECT</option><option>RANGE</option>
                </select>
              </Tooltip>
            </div>

            <div>
              <Tooltip content="Tipo de dado subjacente (NUMBER, STRING)">
                <select value={dataType} onChange={e => setDataType(e.target.value as any)} className="mt-1 block w-full rounded border-gray-300 shadow-sm text-black p-2">
                  <option>STRING</option><option>NUMBER</option>
                </select>
              </Tooltip>
            </div>

            <div>
              <Tooltip content="Componente visual">
                <select value={displayStyle} onChange={e => setDisplayStyle(e.target.value as any)} className="mt-1 block w-full rounded border-gray-300 shadow-sm text-black p-2">
                  <option>DROPDOWN</option><option>CHECKBOX</option><option>SLIDER</option>
                </select>
              </Tooltip>
            </div>

            <div className="flex items-center space-x-2">
              <input id="active" type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="h-4 w-4" />
              <label htmlFor="active" className="text-sm">Ativo</label>
            </div>

            {/* Novo: flag forSearch */}
            <div className="flex items-center space-x-2">
              <input id="forSearch" type="checkbox" checked={forSearch} onChange={e => setForSearch(e.target.checked)} className="h-4 w-4" />
              <Tooltip content="Se marcado, este filtro será exibido na página de resultados de busca (busca por termo).">
                <label htmlFor="forSearch" className="text-sm">Exibir na página de busca</label>
              </Tooltip>
            </div>

            <div>
              <Tooltip content="Ordem de exibição">
                <input type="number" value={order} onChange={e => setOrder(Number(e.target.value))} className="mt-1 block w-full rounded border-gray-300 shadow-sm text-black p-2" />
              </Tooltip>
            </div>

            <div className="flex items-center space-x-2">
              <input id="auto" type="checkbox" checked={autoPopulate} onChange={e => setAutoPopulate(e.target.checked)} className="h-4 w-4" />
              <Tooltip content="Se verdadeiro, o sistema pode preencher opções baseado nos produtos cadastrados.">
                <label htmlFor="auto" className="text-sm">Auto Popular</label>
              </Tooltip>
            </div>

            {type === 'RANGE' && <>
              <div>
                <Tooltip content="Valor mínimo pré-configurado (opcional)">
                  <input type="number" value={minValue} onChange={e => setMinValue(e.target.value === '' ? '' : Number(e.target.value))} className="mt-1 block w-full rounded border-gray-300 shadow-sm text-black p-2" />
                </Tooltip>
              </div>
              <div>
                <Tooltip content="Valor máximo pré-configurado (opcional)">
                  <input type="number" value={maxValue} onChange={e => setMaxValue(e.target.value === '' ? '' : Number(e.target.value))} className="mt-1 block w-full rounded border-gray-300 shadow-sm text-black p-2" />
                </Tooltip>
              </div>
            </>}

            <div className="md:col-span-2 flex items-end space-x-2">
              <div className="flex-1">
                <Tooltip content="Grupo (ex.: Características, Preço)">
                  <select value={groupId} onChange={e => setGroupId(e.target.value)} className="mt-1 block w-full rounded border-gray-300 shadow-sm text-black p-2">
                    <option value="">— Nenhum —</option>
                    {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </Tooltip>
              </div>
              <button type="button" onClick={() => setShowGroupModal(true)} disabled={groupSubmitting} className="mb-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50">+ Grupo</button>
            </div>
          </div>

          <div className="pt-4 border-t flex justify-end">
            <button type="submit" disabled={submitting} className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50">{submitting ? 'Salvando...' : 'Salvar Filtro'}</button>
          </div>
        </form>
      </Section>

      {showGroupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-lg">
            <h2 className="text-xl font-medium mb-4 text-black">Gerenciar Grupos</h2>
            <ul className="max-h-60 overflow-auto space-y-2 mb-4">
              {groups.map(g => (
                <li key={g.id} className="flex items-center justify-between p-2 border rounded">
                  <span className="text-black">{g.name} <small className="text-gray-500">({g.order})</small></span>
                  <button onClick={() => handleDeleteGroup(g.id)} className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700">Excluir</button>
                </li>
              ))}
              {groups.length === 0 && <p className="text-gray-500">Nenhum grupo.</p>}
            </ul>

            <div className="space-y-3 mb-4">
              <div>
                <Tooltip content="Nome do grupo">
                  <input value={newGroupName} onChange={e => setNewGroupName(e.target.value)} className="mt-1 block w-full rounded border-black border-2 shadow-sm text-black p-2" />
                </Tooltip>
              </div>
              <div>
                <Tooltip content="Ordem de exibição do grupo">
                  <input type="number" value={newGroupOrder} onChange={e => setNewGroupOrder(Number(e.target.value))} className="mt-1 block w-full rounded border-black border-2 shadow-sm text-black p-2" />
                </Tooltip>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <button onClick={() => setShowGroupModal(false)} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 text-black">Fechar</button>
              <button onClick={handleCreateGroup} disabled={groupSubmitting} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50">{groupSubmitting ? 'Criando...' : 'Novo Grupo'}</button>
            </div>
          </div>
        </div>
      )}
    </SidebarAndHeader>
  );
}