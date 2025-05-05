"use client"

import { Suspense } from 'react';
import { useState } from "react";
import DataTable from '@/app/components/dataTable';
import { Section } from '@/app/components/section';
import { SidebarAndHeader } from '@/app/components/sidebarAndHeader';
import { TitlePage } from '@/app/components/section/titlePage';
import { setupAPIClientEcommerce } from '@/app/services/apiEcommerce';
import moment from "moment";
import { useRouter } from 'next/navigation';

interface NewslattersProps {
    id: string;
    title: string;
    isActive: boolean;
    created_at: string | number | Date;
    edit: any;
}

export default function Templates_email() {

    const router = useRouter();

    const [newslatters, setNewslatters] = useState<NewslattersProps[]>([]);
    const [totalPages, setTotalPages] = useState(1);

    const apiClient = setupAPIClientEcommerce();

    async function fetchNewslatters({ page, limit, search, orderBy, orderDirection, startDate, endDate }: any) {
        try {
            const response = await apiClient.get(`/all_templates/email-templates`, {
                params: { page, limit, search, orderBy, orderDirection, startDate, endDate }
            });
            setNewslatters(response.data.templates_emails);
            setTotalPages(response.data.totalPages);
        } catch (error) {
            console.log(error);
        }
    }

    // ---- COLUNAS PARA EXPORTAÇÂO DE DADOS ---- //

    const availableColumns = ["", ""];

    const customNames: any = {
        none: "",
        none1: ""
    };

    // ---- SELECT PARA ORDENAÇÂO DOS ---- //

    const columnsOrder: any = [
        { key: "title", label: "Titulo" },
        { key: "created_at", label: "Data de Criação" },
    ];

    const availableColumnsOrder: any = ["created_at", "title"];

    const customNamesOrder: any = {
        created_at: "Data de Registro",
        title: "Titulo"
    };

    return (
        <SidebarAndHeader children={
            <Section>

                <TitlePage title="TEMPLATES DE EMAIL" />

                <Suspense fallback={<div>Carregando...</div>}>

                    <button
                        className="bg-green-500 text-[#FFFFFF] p-5 rounded-md mb-7"
                        onClick={() => router.push(`/configurations/templates_email/add_templates_email`)}
                    >
                        Adicionar template de email
                    </button>

                    <DataTable
                        timeFilterButton={false}
                        checkbox_delete={false}
                        active_buttons_searchInput_comments={false}
                        name_file_export="emailTemplates"
                        modal_delete_bulk={false}
                        active_buttons_searchInput_notification={false}
                        active_export_data={false}
                        customNamesOrder={customNamesOrder}
                        availableColumnsOrder={availableColumnsOrder}
                        columnsOrder={columnsOrder}
                        table_data="emailTemplates"
                        url_delete_data=""
                        data={newslatters}
                        columns={[
                            { key: "title", label: "Titulo" },
                            {
                                key: "isActive",
                                label: "Ativo?",
                                render: (item) => (
                                    <span>{item?.isActive == true ? "Sim" : "Não"}</span>
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
                                        className='m-1 p-2 bg-red-500 text-[#FFFFFF] text-xs rounded hover:bg-red-600 transition duration-300'
                                        onClick={() => router.push(`/configurations/templates_email/${item.id}`)}
                                    >
                                        Editar
                                    </button>
                                ),
                            },
                        ]}
                        totalPages={totalPages}
                        onFetchData={fetchNewslatters}
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