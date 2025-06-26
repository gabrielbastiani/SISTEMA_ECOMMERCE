"use client"

import { Suspense } from 'react';
import { useState } from "react";
import { TitlePage } from '@/app/components/section/titlePage';
import { setupAPIClientEcommerce } from '@/app/services/apiEcommerce';
import { SidebarAndHeader } from '@/app/components/sidebarAndHeader';
import { Section } from '@/app/components/section';
import DataTable from '@/app/components/dataTable';
import { useRouter } from 'next/navigation';

interface BuyTogetherProps {

}

export default function Buy_together() {

    const router = useRouter();

    const [buyTogether, setBuyTogether] = useState<BuyTogetherProps[]>([]);
    const [totalPages, setTotalPages] = useState(1);

    const apiClient = setupAPIClientEcommerce();

    async function fetchBuyTogether({ page, limit, search, orderBy, orderDirection, startDate, endDate }: any) {
        try {
            const response = await apiClient.get(`/buy_together/get`, {
                params: { page, limit, search, orderBy, orderDirection, startDate, endDate }
            });
            setBuyTogether(response.data.buyTogethers);
            setTotalPages(response.data.totalPages);
        } catch (error) {
            console.log(error);
        }
    }

    // ---- COLUNAS PARA EXPORTAÇÂO DE DADOS ---- //

    const availableColumns = ["email_user", "created_at"];

    const customNames: any = {
        email_user: "Email do contato",
        created_at: "Data de envio"
    };

    // ---- SELECT PARA ORDENAÇÂO DOS ---- //

    const columnsOrder: any = [
        { key: "email_user", label: "Email" },
        { key: "created_at", label: "Data de Criação" },
    ];

    const availableColumnsOrder: any = ["created_at", "email_user"];

    const customNamesOrder: any = {
        created_at: "Data de Registro",
        email_user: "Email"
    };

    return (
        <SidebarAndHeader>
            <Section>

                <TitlePage title="COMPRE JUNTO" />

                <button
                    className='bg-green-600 p-3 rounded-md text-white mb-4'
                    onClick={() => router.push(`/products/buy_together/add_buyTogether`)}
                >
                    Adicionar compre junto
                </button>

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
                        data={buyTogether}
                        columns={[
                            { key: "email_user", label: "Email" },
                            
                        ]}
                        totalPages={totalPages}
                        onFetchData={fetchBuyTogether}
                        availableColumns={availableColumns}
                        customNames={customNames}
                        generate_excel_delete={""}
                        delete_bulk_data={""}
                    />
                </Suspense>
            </Section>
        </SidebarAndHeader>
    );
}