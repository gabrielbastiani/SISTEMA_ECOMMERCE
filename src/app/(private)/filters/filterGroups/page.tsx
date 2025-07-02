'use client';

import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { SidebarAndHeader } from '@/app/components/sidebarAndHeader';
import { Section } from '@/app/components/section';
import { TitlePage } from '@/app/components/section/titlePage';
import { setupAPIClientEcommerce } from '@/app/services/apiEcommerce';
import { toast } from 'react-toastify';
import { Tooltip } from '@nextui-org/react';

interface FilterGroup {
    id: string;
    name: string;
    order: number;
}

export default function FilterGroupsPage() {
    const api = setupAPIClientEcommerce();

    // --- estados do formulário ---
    const [name, setName] = useState('');
    const [order, setOrder] = useState(0);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // --- lista de grupos ---
    const [groups, setGroups] = useState<FilterGroup[]>([]);
    const [loading, setLoading] = useState(true);

    // --- busca todos os grupos ---
    const fetchGroups = async () => {
        try {
            const resp = await api.get<FilterGroup[]>('/filter-groups/getAll');
            setGroups(resp.data);
        } catch (err) {
            console.error('Erro ao buscar grupos:', err);
            toast.error('Não foi possível carregar grupos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGroups();
    }, []);

    // --- submit de criação ou edição ---
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            if (editingId) {
                // edição
                await api.put(`/filter-groups/update/${editingId}`, { name, order });
                toast.success('Grupo atualizado com sucesso');
            } else {
                // criação
                await api.post('/filter-groups/create', { name, order });
                toast.success('Grupo criado com sucesso');
            }
            // reset form
            setName('');
            setOrder(0);
            setEditingId(null);
            // recarrega lista
            await fetchGroups();
        } catch (err: any) {
            console.error('Erro ao salvar grupo:', err);
            toast.error(err?.response?.data?.message || 'Erro ao salvar');
        } finally {
            setSubmitting(false);
        }
    };

    // --- iniciar edição ao clicar no item ---
    const handleEditClick = (group: FilterGroup) => {
        setEditingId(group.id);
        setName(group.name);
        setOrder(group.order);
    };

    // --- cancelar edição ---
    const handleCancel = () => {
        setEditingId(null);
        setName('');
        setOrder(0);
    };

    // --- exclusão ---
    const handleDelete = async (id: string) => {
        if (!confirm('Confirma exclusão deste grupo?')) return;
        try {
            await api.delete(`/filter-groups/deleteGroup/${id}`);
            toast.success('Grupo excluído');
            setGroups(gs => gs.filter(g => g.id !== id));
            // se estava editando este, cancela
            if (editingId === id) handleCancel();
        } catch (err) {
            console.error('Erro ao excluir grupo:', err);
            toast.error('Não foi possível excluir');
        }
    };

    return (
        <SidebarAndHeader>
            <Section>
                <TitlePage title="GRUPOS DE FILTRO" />

                {/* Formulário de criação/edição */}
                <form onSubmit={handleSubmit} className="mt-6 space-y-4 p-4 border rounded bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Nome */}
                        <div>
                            <Tooltip
                                content="Nome do grupo (ex.: Características, Preço, etc...)"
                                placement="top-start"
                                className="bg-white text-red-500 border border-gray-200 p-2"
                            >
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                                    required
                                    className="mt-1 block w-full rounded border-gray-300 shadow-sm text-black p-2"
                                    placeholder='Nome do grupo'
                                />
                            </Tooltip>
                        </div>

                        {/* Ordem */}
                        <div>
                            <Tooltip
                                content="Ordem de exibição do grupo na interface de usuário"
                                placement="top-start"
                                className="bg-white text-red-500 border border-gray-200 p-2"
                            >
                                <input
                                    type="number"
                                    value={order}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setOrder(Number(e.target.value))}
                                    className="mt-1 block w-full rounded border-gray-300 shadow-sm text-black p-2"
                                />
                            </Tooltip>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                        >
                            {submitting
                                ? editingId ? 'Atualizando...' : 'Salvando...'
                                : editingId ? 'Atualizar Grupo' : 'Salvar Grupo'}
                        </button>
                        {editingId && (
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                            >
                                Cancelar
                            </button>
                        )}
                    </div>
                </form>

                {/* Lista de grupos */}
                <div className="mt-8">
                    {loading ? (
                        <p>Carregando grupos...</p>
                    ) : groups.length === 0 ? (
                        <p className="text-gray-500">Nenhum grupo cadastrado.</p>
                    ) : (
                        <ul className="space-y-2">
                            {groups.map(gp => (
                                <li
                                    key={gp.id}
                                    className={`flex items-center justify-between p-4 border rounded bg-white
                    ${editingId === gp.id ? 'border-orange-500' : ''}`}
                                >
                                    <div
                                        className="flex-1 cursor-pointer"
                                        onClick={() => handleEditClick(gp)}
                                    >
                                        <p className="font-medium text-black">{gp.name}</p>
                                        <p className="text-sm text-gray-500">Ordem: {gp.order}</p>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(gp.id)}
                                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                                    >
                                        Excluir
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </Section>
        </SidebarAndHeader>
    );
}