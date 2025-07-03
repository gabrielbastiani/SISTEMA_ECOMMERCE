"use client"

import { Suspense } from 'react';
import { useState } from "react";
import DataTable from "../../components/dataTable";
import { Section } from "../../components/section";
import { SidebarAndHeader } from "../../components/sidebarAndHeader";
import { TitlePage } from '@/app/components/section/titlePage';
import { setupAPIClientEcommerce } from '@/app/services/apiEcommerce';
import moment from "moment";
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

interface FiltersProps {
    id: string;
    name: string;
    fieldName: string;
    type: string;
    dataType: any;
    displayStyle: string;
    isActive: boolean;
    order: number;
    autoPopulate: boolean;
    minValue: number;
    maxValue: number;
    group: any;
    options: any;
    directCategories: any;
    category: any;
    created_at: string | number | Date;
    edit: string;
}

const statusOptions = [
    { label: "Ativado", value: true },
    { label: "Desativado", value: false },
];

export default function Filters() {

    const router = useRouter();

    const [filters, setFilters] = useState<FiltersProps[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const [editingFilter, setEditingFilter] = useState<{ id: string, field: string } | null>(null);
    const [editedValue, setEditedValue] = useState<boolean>(false);

    const apiClient = setupAPIClientEcommerce();

    const handleEdit = (id: string, field: string, currentValue: boolean) => {
        setEditingFilter({ id, field });
        setEditedValue(currentValue);
    };

    const handleSave = async (id: string, field: keyof FiltersProps) => {
        try {
            const data = {
                filter_id: id,
                isActive: editedValue,
            };
            await apiClient.put(`/filter/status`, data);

            // atualiza localmente
            setFilters((prev) =>
                prev.map((fil) =>
                    fil.id === id ? { ...fil, isActive: editedValue } : fil
                )
            );

            toast.success("Status atualizado com sucesso");

        } catch (error) {
            console.error("Erro ao atualizar status:", error);
            toast.error("Erro ao atualizar status");
        } finally {
            setEditingFilter(null);
        }
    };

    async function fetchFilters({ page, limit, search, orderBy, orderDirection, startDate, endDate }: any) {
        try {
            const response = await apiClient.get(`/filters/cms`, {
                params: { page, limit, search, orderBy, orderDirection, startDate, endDate }
            });
            setFilters(response.data.filters);
            setTotalPages(response.data.totalPages);
        } catch (error) {
            console.log(error);
        }
    }

    // ---- COLUNAS PARA EXPORTAÇÂO DE DADOS ---- //

    const availableColumns = [
        "name",
        "fieldName",
        "type",
        "dataType",
        "displayStyle",
        "isActive",
        "order",
        "autoPopulate",
        "minValue",
        "maxValue",
        "group",
        "options",
        "directCategories",
        "category",
        "created_at"
    ];

    const customNames: any = {
        name: "Nome do filtro",
        fieldName: "Nome do campo ou identificador associado",
        type: "Tipo de filtro",
        dataType: "Tipo de dado",
        displayStyle: "Componente visual",
        isActive: "Ativo",
        order: "Ordem de exibição",
        autoPopulate: "Baseado nos produtos",
        minValue: "Preço mínimo",
        maxValue: "Preço máximo",
        group: "Grupo de filtro",
        options: "Relacionamento com opções",
        directCategories: "Relação direta nomeada",
        category: "Relação via tabela de junção",
        created_at: "Data de criação"
    };

    // ---- SELECT PARA ORDENAÇÂO DOS ---- //

    const columnsOrder: any = [
        { key: "name", label: "Nome do filtro" },
        { key: "created_at", label: "Data de Criação" },
    ];

    const availableColumnsOrder: any = ["name", "created_at"];

    const customNamesOrder: any = {
        name: "Nome do filtro",
        created_at: "Data de Registro"
    };

    return (
        <SidebarAndHeader children={
            <Section>

                <TitlePage title="FILTROS" />

                <Suspense fallback={<div>Carregando...</div>}>
                    <DataTable
                        timeFilterButton={true}
                        checkbox_delete={true}
                        active_buttons_searchInput_comments={false}
                        name_file_export="Filtros"
                        modal_delete_bulk={false}
                        active_buttons_searchInput_notification={false}
                        active_export_data={true}
                        customNamesOrder={customNamesOrder}
                        availableColumnsOrder={availableColumnsOrder}
                        columnsOrder={columnsOrder}
                        table_data="filter"
                        url_delete_data="/filterData/delete"
                        data={filters}
                        totalPages={totalPages}
                        onFetchData={fetchFilters}
                        availableColumns={availableColumns}
                        customNames={customNames}
                        generate_excel_delete={""}
                        delete_bulk_data={""}
                        columns={[
                            { key: "name", label: "Nome do filtro" },
                            { key: "order", label: "Ordem" },
                            {
                                key: "isActive",
                                label: "Ativado?",
                                render: (item: FiltersProps) => (
                                    <span>
                                        {editingFilter?.id === item.id && editingFilter.field === "isActive" ? (
                                            <select
                                                value={editedValue.toString()}
                                                onChange={(e) => setEditedValue(e.target.value === "true")}
                                                onBlur={() => handleSave(item.id, "isActive")}
                                                className="border-gray-300 rounded-md p-1 text-black"
                                                autoFocus
                                            >
                                                {statusOptions.map((opt) => (
                                                    <option key={opt.value.toString()} value={opt.value.toString()}>
                                                        {opt.label}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <span
                                                onClick={() => handleEdit(item.id, "isActive", !!item.isActive)}
                                                className="cursor-pointer hover:underline"
                                            >
                                                {item.isActive ? "Ativado" : "Desativado"}
                                            </span>
                                        )}
                                    </span>
                                ),
                            },
                            {
                                key: "created_at",
                                label: "Data de Criação",
                                render: (item) => (
                                    <span>{moment(item.created_at).format('DD/MM/YYYY HH:mm')}</span>
                                ),
                            },
                            {
                                key: 'edit',
                                label: 'Editar',
                                render: (item) => (
                                    <button
                                        className='m-5 p-1 bg-red-500 text-[#FFFFFF] text-xs rounded hover:bg-red-600 transition duration-300'
                                        onClick={() => router.push(`/filters/${item.id}`)}
                                    >
                                        Editar
                                    </button>
                                ),
                            },
                        ]}
                    />
                </Suspense>
            </Section>
        } />
    );
}