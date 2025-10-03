'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Section } from '@/app/components/section';
import { TitlePage } from '@/app/components/section/titlePage';
import { SidebarAndHeader } from '@/app/components/sidebarAndHeader';
import { setupAPIClientEcommerce } from '@/app/services/apiEcommerce';
import { toast } from 'react-toastify';

interface Filter {
  id: string;
  name: string;
  fieldName: string | null;
  type: string;
  isActive: boolean;
  forSearch: boolean;
  group: { name: string } | null;
  categoryFilter: Array<{
    category: {
      id: string;
      name: string;
    }
  }>;
}

export default function SearchFiltersPage() {
  const api = setupAPIClientEcommerce();
  const router = useRouter();
  
  const [filters, setFilters] = useState<Filter[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    loadFilters();
  }, []);

  // CORREÇÃO: Usa a rota correta
  const loadFilters = async () => {
    try {
      const response = await api.get('/filters/forSearch/cms'); // Rota corrigida
      setFilters(response.data);
    } catch (error) {
      console.error('Error loading filters:', error);
      toast.error('Erro ao carregar filtros');
    } finally {
      setLoading(false);
    }
  };

  const toggleForSearch = async (filterId: string, currentValue: boolean) => {
    setUpdating(filterId);
    try {
      await api.patch(`/filters/${filterId}/forSearch`, { 
        forSearch: !currentValue 
      });
      
      setFilters(prev => prev.map(filter => 
        filter.id === filterId 
          ? { ...filter, forSearch: !currentValue }
          : filter
      ));
      
      toast.success('Filtro atualizado para busca');
    } catch (error) {
      console.error('Error updating filter:', error);
      toast.error('Erro ao atualizar filtro');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <SidebarAndHeader>
        <Section>
          <TitlePage title="FILTROS PARA BUSCA" />
          <div className="mt-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </Section>
      </SidebarAndHeader>
    );
  }

  return (
    <SidebarAndHeader>
      <Section>
        <TitlePage title="FILTROS PARA BUSCA" />
        
        <div className="mt-6 bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-black">
              Gerenciar Filtros para Página de Busca
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Ative/desative os filtros que devem aparecer na página de busca da loja virtual
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Um filtro pode estar disponível para categorias específicas E para busca ao mesmo tempo
            </p>
          </div>

          <div className="p-4">
            <div className="space-y-4">
              {filters.map(filter => (
                <div key={filter.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium text-black">{filter.name}</h3>
                    <div className="text-sm text-gray-600 mt-1">
                      <span>Campo: {filter.fieldName || '—'}</span>
                      <span className="mx-2">•</span>
                      <span>Tipo: {filter.type}</span>
                      <span className="mx-2">•</span>
                      <span>Grupo: {filter.group?.name || '—'}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                        filter.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {filter.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                      {filter.categoryFilter.length > 0 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                          {filter.categoryFilter.length} categoria(s)
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <span className={`text-sm ${filter.forSearch ? 'text-green-600 font-medium' : 'text-gray-600'}`}>
                      {filter.forSearch ? '✅ Ativo na busca' : '❌ Inativo na busca'}
                    </span>
                    
                    <button
                      onClick={() => toggleForSearch(filter.id, filter.forSearch)}
                      disabled={updating === filter.id || !filter.isActive}
                      className={`px-4 py-2 rounded text-sm font-medium ${
                        filter.forSearch
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      } disabled:opacity-50`}
                    >
                      {updating === filter.id 
                        ? '...' 
                        : filter.forSearch 
                          ? 'Desativar' 
                          : 'Ativar'
                      }
                    </button>
                  </div>
                </div>
              ))}
              
              {filters.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Nenhum filtro encontrado. 
                  <button 
                    onClick={() => router.push('/filters/add')}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    Crie o primeiro filtro
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-between items-center">
          <button
            onClick={() => router.push('/filters')}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Voltar para Filtros
          </button>
          
          <button
            onClick={() => router.push('/filters/add')}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Adicionar Novo Filtro
          </button>
        </div>
      </Section>
    </SidebarAndHeader>
  );
}