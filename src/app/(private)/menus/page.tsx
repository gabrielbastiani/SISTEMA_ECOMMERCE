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

interface MenusProps {
    id: string;
    name: string;
    isActive: boolean;
    order: number;
    created_at: string | number | Date;
    edit: string;
    items: {
        id: string;
        label: string;
        type: string;
        url: string;
        category_id: string;
        product_id: string;
        customPageSlug: string;
        icon: string;
        isActive: boolean;
        order: number;
        parent: any;
        children: any;
    }[]
}

const statusOptions = [
    { label: "Ativado", value: true },
    { label: "Desativado", value: false },
];

export default function Menus() {

    const router = useRouter();

    const [menus, setMenus] = useState<MenusProps[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const [editingMenus, setEditingMenus] = useState<{ id: string, field: string } | null>(null);
    const [editedValue, setEditedValue] = useState<boolean>(false);

    const apiClient = setupAPIClientEcommerce();

    const handleEdit = (id: string, field: string, currentValue: boolean) => {
        setEditingMenus({ id, field });
        setEditedValue(currentValue);
    };

    const handleSave = async (id: string, field: keyof MenusProps) => {
        try {
            const data = {
                menu_id: id,
                isActive: editedValue,
            };
            await apiClient.put(`/menu/status`, data);

            // atualiza localmente
            setMenus((prev) =>
                prev.map((men) =>
                    men.id === id ? { ...men, isActive: editedValue } : men
                )
            );

            toast.success("Status atualizado com sucesso");

        } catch (error) {
            console.error("Erro ao atualizar status:", error);
            toast.error("Erro ao atualizar status");
        } finally {
            setEditingMenus(null);
        }
    };

    async function fetchMenus({ page, limit, search, orderBy, orderDirection, startDate, endDate }: any) {
        try {
            const response = await apiClient.get(`/menu/cms`, {
                params: { page, limit, search, orderBy, orderDirection, startDate, endDate }
            });
            setMenus(response.data.menus);
            setTotalPages(response.data.totalPages);
        } catch (error) {
            console.log(error);
        }
    }

    console.log(menus)

    // ---- COLUNAS PARA EXPORTAÇÂO DE DADOS ---- //

    const availableColumns = [
        "id",
        "name",
        "isActive",
        "order",
        "items",
        "created_at"
    ];

    const customNames: any = {
        name: "Nome do menu",
        fieldName: "Nome do campo ou identificador associado",
        isActive: "Ativo",
        order: "Ordem de exibição",
        items: "Itens do menu",
        created_at: "Data de criação"
    };

    // ---- SELECT PARA ORDENAÇÂO DOS ---- //

    const columnsOrder: any = [
        { key: "name", label: "Nome do menu" },
        { key: "created_at", label: "Data de Criação" },
    ];

    const availableColumnsOrder: any = ["name", "created_at"];

    const customNamesOrder: any = {
        name: "Nome do menu",
        created_at: "Data de Registro"
    };

    return (
        <SidebarAndHeader children={
            <Section>

                <TitlePage title="MENUS" />

                <Suspense fallback={<div>Carregando...</div>}>
                    <DataTable
                        timeFilterButton={true}
                        checkbox_delete={true}
                        active_buttons_searchInput_comments={false}
                        name_file_export="Menus"
                        modal_delete_bulk={false}
                        active_buttons_searchInput_notification={false}
                        active_export_data={true}
                        customNamesOrder={customNamesOrder}
                        availableColumnsOrder={availableColumnsOrder}
                        columnsOrder={columnsOrder}
                        table_data="menu"
                        url_delete_data="/menu/delete"
                        data={menus}
                        totalPages={totalPages}
                        onFetchData={fetchMenus}
                        availableColumns={availableColumns}
                        customNames={customNames}
                        generate_excel_delete={""}
                        delete_bulk_data={""}
                        columns={[
                            { key: "name", label: "Nome do menu" },
                            { key: "order", label: "Ordem" },
                            {
                                key: 'items',
                                label: 'Itens do menu',
                                render: (item: MenusProps) => (
                                    <>
                                        {item.items?.length === 0 ? (
                                            <span className="text-gray-500">
                                                Sem itens
                                            </span>
                                        ) : (
                                            <span className="flex flex-wrap space-x-2 max-w-xs">
                                                {item.items?.map((child, index) => (
                                                    <span
                                                        key={index}
                                                        className="p-1 bg-gray-200 rounded-full text-xs whitespace-nowrap text-black"
                                                    >
                                                        {child.label}
                                                    </span>
                                                ))}
                                            </span>
                                        )}
                                    </>
                                ),
                            },
                            {
                                key: "isActive",
                                label: "Ativado?",
                                render: (item: MenusProps) => (
                                    <span>
                                        {editingMenus?.id === item.id && editingMenus.field === "isActive" ? (
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
                                        onClick={() => router.push(`/menus/${item.id}`)}
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