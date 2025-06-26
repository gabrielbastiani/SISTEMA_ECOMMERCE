"use client"

import { Suspense, useContext } from 'react';
import { useState } from "react";
import { TitlePage } from '@/app/components/section/titlePage';
import { setupAPIClientEcommerce } from '@/app/services/apiEcommerce';
import moment from "moment";
import { SidebarAndHeader } from '@/app/components/sidebarAndHeader';
import { Section } from '@/app/components/section';
import DataTable from '@/app/components/dataTable';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { AuthContext } from '@/app/contexts/AuthContext';

interface PromotionRequest {
    id: string;
    name?: string;
    description?: string;
    startDate?: string | number | Date;
    endDate?: string | number | Date;
    hasCoupon?: boolean;
    multipleCoupons?: boolean;
    reuseSameCoupon?: boolean;
    perUserCouponLimit?: number;
    totalCouponCount?: number;
    active?: boolean;
    cumulative?: boolean;
    priority?: number;
    coupons?: Array<{
        code: string;
    }>;
    conditions?: any;
    actions?: any;
    displays?: any;
    badges?: any;
    products?: any;
    variantPromotions?: any;
    featuredProducts?: any;
    categories?: any;
    orders?: any;
    mainVariants?: any;
    promotionUsage?: any;
    created_at: string | number | Date;
    edit?: string;
}

const statusOptions = [
    { label: "Ativado", value: true },
    { label: "Desativado", value: false },
];

export default function All_promotions() {

    const router = useRouter();
    const { user } = useContext(AuthContext);

    const [promotions, setPromotions] = useState<PromotionRequest[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const [editingPromotion, setEditingPromotion] = useState<{ id: string, field: string } | null>(null);
    const [editedValue, setEditedValue] = useState<boolean>(false);

    const apiClient = setupAPIClientEcommerce();

    async function fetchPromotions({ page, limit, search, orderBy, orderDirection, startDate, endDate }: any) {
        try {
            const response = await apiClient.get(`/promotions/get`, {
                params: { page, limit, search, orderBy, orderDirection, startDate, endDate }
            });
            setPromotions(response.data.promotions);
            setTotalPages(response.data.totalPages);
        } catch (error) {
            console.log(error);
        }
    }

    const handleEdit = (id: string, field: string, currentValue: boolean) => {
        setEditingPromotion({ id, field });
        setEditedValue(currentValue);
    };

    const handleSave = async (id: string, field: keyof PromotionRequest) => {
        try {
            const data = {
                promotion_id: id,
                active: editedValue,
            };
            await apiClient.put(`/promotion/active`, data);

            // atualiza localmente
            setPromotions((prev) =>
                prev.map((promo) =>
                    promo.id === id ? { ...promo, active: editedValue } : promo
                )
            );

            toast.success("Status atualizado com sucesso");

        } catch (error) {
            console.error("Erro ao atualizar status:", error);
            toast.error("Erro ao atualizar status");
        } finally {
            setEditingPromotion(null);
        }
    };

    // ---- COLUNAS PARA EXPORTAÇÂO DE DADOS ---- //

    const availableColumns = [
        "name",
        "description",
        "startDate",
        "endDate",
        "active",
        "coupons",
        "conditions",
        "actions",
        "created_at"
    ];

    const customNames: any = {
        name: "Nome da promoção",
        description: "Descrição da promoção",
        startDate: "Data de inicio",
        endDate: "Data de termino",
        active: "Ativado?",
        coupons: "Codigos de cupons",
        conditions: "Condições da promoção",
        actions: "Ações da promoção",
        created_at: "Data de criação"
    };

    // ---- SELECT PARA ORDENAÇÂO DOS ---- //

    const columnsOrder: any = [
        { key: "name", label: "Nome" },
        { key: "startDate", label: "Data de inicio" },
        { key: "endDate", label: "Data de termino" },
        { key: "created_at", label: "Data de Criação" },
    ];

    const availableColumnsOrder: any = ["name", "startDate", "endDate", "created_at"];

    const customNamesOrder: any = {
        name: "Nome",
        startDate: "Data de inicio",
        endDate: "Data de termino",
        created_at: "Data de criação"
    };

    return (
        <SidebarAndHeader children={

            <Section>

                <TitlePage title="PROMOÇÕES" />

                <Suspense fallback={<div>Carregando...</div>}>
                    <DataTable
                        timeFilterButton={true}
                        checkbox_delete={true}
                        active_buttons_searchInput_comments={false}
                        name_file_export="promoções"
                        modal_delete_bulk={false}
                        active_buttons_searchInput_notification={false}
                        active_export_data={true}
                        customNamesOrder={customNamesOrder}
                        availableColumnsOrder={availableColumnsOrder}
                        columnsOrder={columnsOrder}
                        table_data="promotion"
                        url_delete_data="/promotions/delete"
                        data={promotions}
                        totalPages={totalPages}
                        onFetchData={fetchPromotions}
                        availableColumns={availableColumns}
                        customNames={customNames}
                        generate_excel_delete={""}
                        delete_bulk_data={""}
                        columns={[
                            { key: "name", label: "Nome" },
                            {
                                key: "startDate",
                                label: "Data de inicio",
                                render: (item: PromotionRequest) => (
                                    <span>{moment(item.startDate).format('DD/MM/YYYY HH:mm')}</span>
                                )
                            },
                            {
                                key: "endDate",
                                label: "Data de término",
                                render: (item: PromotionRequest) => (
                                    <span>{moment(item.endDate).format('DD/MM/YYYY HH:mm')}</span>
                                )
                            },
                            {
                                key: "coupons",
                                label: "Cupons",
                                render: (item: PromotionRequest) => (
                                    <>
                                        {item.coupons?.length === 0 ? (
                                            <span className="text-gray-500">
                                                Sem cupom
                                            </span>
                                        ) : (
                                            <span className="flex flex-wrap space-x-2 max-w-xs">
                                                {item.coupons?.map((cod, index) => (
                                                    <span
                                                        key={index}
                                                        className="p-1 bg-gray-200 rounded-full text-xs whitespace-nowrap text-black"
                                                    >
                                                        {cod.code}
                                                    </span>
                                                ))}
                                            </span>
                                        )}
                                    </>
                                ),
                            },
                            {
                                key: "priority",
                                label: "Prioridade",
                                render: (item: PromotionRequest) => (
                                    <>
                                        <span className='m-9'>{item.priority}</span>
                                    </>
                                )
                            },
                            {
                                key: "active",
                                label: "Ativado?",
                                render: (item: PromotionRequest) => (
                                    <span>
                                        {editingPromotion?.id === item.id && editingPromotion.field === "active" ? (
                                            <select
                                                value={editedValue.toString()}
                                                onChange={(e) => setEditedValue(e.target.value === "true")}
                                                onBlur={() => handleSave(item.id, "active")}
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
                                                onClick={() =>
                                                    user?.role !== "EMPLOYEE" &&
                                                    handleEdit(item.id, "active", !!item.active)
                                                }
                                                className="cursor-pointer hover:underline"
                                            >
                                                {item.active ? "Ativado" : "Desativado"}
                                            </span>
                                        )}
                                    </span>
                                ),
                            },
                            {
                                key: "created_at",
                                label: "Data de Criação",
                                render: (item: PromotionRequest) => (
                                    <span>{moment(item.created_at).format('DD/MM/YYYY HH:mm')}</span>
                                ),
                            },
                            {
                                key: 'edit',
                                label: 'Editar',
                                render: (item: PromotionRequest) => (
                                    <button
                                        className='m-5 p-1 bg-red-500 text-[#FFFFFF] text-xs rounded hover:bg-red-600 transition duration-300'
                                        onClick={() => router.push(`/promotions/${item.id}`)}
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