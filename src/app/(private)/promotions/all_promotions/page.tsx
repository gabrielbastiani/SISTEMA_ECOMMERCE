"use client"

import { Suspense } from 'react';
import { useState } from "react";
import { TitlePage } from '@/app/components/section/titlePage';
import { setupAPIClientEcommerce } from '@/app/services/apiEcommerce';
import moment from "moment";
import { SidebarAndHeader } from '@/app/components/sidebarAndHeader';
import { Section } from '@/app/components/section';
import DataTable from '@/app/components/dataTable';

interface PromotionRequest {
    id?: string;
    code?: string;
    name?: string;
    description?: string;
    discountValue?: number;
    maxDiscountAmount?: number;
    startDate?: string | number | Date;
    endDate?: string | number | Date;
    usageLimit?: number;
    userUsageLimit?: number;
    minOrderAmount?: number;
    status?: string;
    stackable?: boolean;
    created_at: string | number | Date;
}

export default function All_promotions() {

    const [promotions, setPromotions] = useState<PromotionRequest[]>([]);
    const [totalPages, setTotalPages] = useState(1);

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

    // ---- COLUNAS PARA EXPORTAÇÂO DE DADOS ---- //

    const availableColumns = ["name", "created_at"];

    const customNames: any = {
        name: "Email do contato",
        created_at: "Data de envio"
    };

    // ---- SELECT PARA ORDENAÇÂO DOS ---- //

    const columnsOrder: any = [
        { key: "name", label: "Email" },
        { key: "created_at", label: "Data de Criação" },
    ];

    const availableColumnsOrder: any = ["created_at", "name"];

    const customNamesOrder: any = {
        created_at: "Data de Registro",
        name: "Nome"
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
                        name_file_export="newslatter"
                        modal_delete_bulk={false}
                        active_buttons_searchInput_notification={false}
                        active_export_data={true}
                        customNamesOrder={customNamesOrder}
                        availableColumnsOrder={availableColumnsOrder}
                        columnsOrder={columnsOrder}
                        table_data="newsletter"
                        url_delete_data="/newsletter/delete_newsletter"
                        data={promotions}
                        columns={[
                            { key: "name", label: "Nome" },
                            {
                                key: "created_at",
                                label: "Data de Criação",
                                render: (item) => (
                                    <span>{moment(item.created_at).format('DD/MM/YYYY HH:mm')}</span>
                                ),
                            },
                        ]}
                        totalPages={totalPages}
                        onFetchData={fetchPromotions}
                        availableColumns={availableColumns}
                        customNames={customNames}
                        generate_excel_delete={""}
                        delete_bulk_data={""}
                    />
                </Suspense>
            </Section>
        } />
    );
}