"use client"

import { Suspense } from 'react';
import { Section } from "@/app/components/section";
import { SidebarAndHeader } from "@/app/components/sidebarAndHeader";
import { TitlePage } from '@/app/components/section/titlePage'; 
import { setupAPIClientEcommerce } from '@/app/services/apiEcommerce'; 
import { useState } from "react";
import DataTable from "@/app/components/dataTable";
import moment from "moment";

interface ContactsProps {
    id: string;
    name_user: string;
    email_user: string;
    created_at: string | number | Date;
}

export default function All_contacts() {

    const [contacts, setContacts] = useState<ContactsProps[]>([]);
    const [totalPages, setTotalPages] = useState(1);

    const apiClient = setupAPIClientEcommerce();

    async function fetchContacts({ page, limit, search, orderBy, orderDirection, startDate, endDate }: any) {
        try {
            const response = await apiClient.get(`/contacts_form/all_contacts`, {
                params: { page, limit, search, orderBy, orderDirection, startDate, endDate }
            });
            setContacts(response.data.contacts);
            setTotalPages(response.data.totalPages);
        } catch (error) {
            console.log(error);
        }
    }

    // ---- COLUNAS PARA EXPORTAÇÂO DE DADOS ---- //

    const availableColumns = ["id", "name_user", "email_user", "subject", "menssage", "created_at"];

    const customNames: any = {
        id: "ID do formulario",
        name_user: "Nome do contato",
        email_user: "Email do contato",
        subject: "Assunto",
        menssage: "Mensagem",
        created_at: "Data de envio"
    };

    // ---- SELECT PARA ORDENAÇÂO DOS ---- //

    const columnsOrder: any = [
        { key: "name_user", label: "Nome" },
        { key: "email_user", label: "Email" },
        { key: "created_at", label: "Data de Criação" },
    ];

    const availableColumnsOrder: any = ["name_user", "created_at", "email_user"];

    const customNamesOrder: any = {
        name_user: "Nome Completo",
        created_at: "Data de Registro",
        email_user: "Email"
    };


    return (
        <SidebarAndHeader>
            <Section>
                <TitlePage title="TODOS OS CONTATOS" />

                <Suspense fallback={<div>Carregando...</div>}>
                    <DataTable
                        timeFilterButton={true}
                        data={contacts}
                        columns={[
                            { key: "name_user", label: "Nome" },
                            { key: "email_user", label: "Email" },
                            {
                                key: "created_at",
                                label: "Data de Criação",
                                render: (item) => (
                                    <span>{moment(item.created_at).format('DD/MM/YYYY HH:mm')}</span>
                                ),
                            },
                        ]}
                        totalPages={totalPages}
                        onFetchData={fetchContacts}
                        url_item_router="/contacts_form/all_contacts"
                        url_delete_data="/form_contact/delete_form_contatct"
                        table_data="formContact"
                        name_file_export="Contatos"
                        availableColumns={availableColumns}
                        customNames={customNames}
                        customNamesOrder={customNamesOrder}
                        availableColumnsOrder={availableColumnsOrder}
                        columnsOrder={columnsOrder}
                        active_export_data={true}
                        active_buttons_searchInput_notification={false}
                        modal_delete_bulk={false}
                        generate_excel_delete={""}
                        delete_bulk_data={""}
                        checkbox_delete={true}
                        active_buttons_searchInput_comments={false}
                    />
                </Suspense>
            </Section>
        </SidebarAndHeader>
    );
}