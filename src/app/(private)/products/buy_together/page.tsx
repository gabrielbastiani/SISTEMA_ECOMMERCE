'use client'

import { Suspense } from 'react'
import { useState } from "react"
import { TitlePage } from '@/app/components/section/titlePage'
import { setupAPIClientEcommerce } from '@/app/services/apiEcommerce'
import { SidebarAndHeader } from '@/app/components/sidebarAndHeader'
import { Section } from '@/app/components/section'
import DataTable from '@/app/components/dataTable'
import { useRouter } from 'next/navigation'
import moment from 'moment'
import Image from 'next/image'
import { toast } from 'react-toastify'

const API_URL = process.env.NEXT_PUBLIC_API_URL!

interface BuyTogetherProps {
    id: string
    name: string
    status?: string
    edit?: string;
    products?: any;
    created_at: string | number | Date
    product: {
        name: string
        images: { url: string }[]
    }[]
}

const statusOptions = ["SIM", "NAO"];

export default function Buy_together() {

    const router = useRouter();

    const [buyTogether, setBuyTogether] = useState<BuyTogetherProps[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const [editingBuyTogether, setEditingBuyTogether] = useState<{ id: string, field: string } | null>(null);
    const [editedValue, setEditedValue] = useState<string>("");
    const apiClient = setupAPIClientEcommerce();

    console.log(buyTogether)

    async function fetchBuyTogether({
        page,
        limit,
        search,
        orderBy,
        orderDirection,
        startDate,
        endDate
    }: any) {
        try {
            const response = await apiClient.get(`/buy_together/get`, {
                params: { page, limit, search, orderBy, orderDirection, startDate, endDate }
            })

            // Mapeia o payload para a shape correta
            const data: BuyTogetherProps[] = response.data.buyTogethers.map((bt: any) => ({
                id: bt.id,
                name: bt.name || '',
                status: bt.status,
                created_at: bt.created_at,
                product: bt.product.map((p: any) => ({
                    name: p.name,
                    images: p.images
                }))
            }))

            setBuyTogether(data)
            setTotalPages(response.data.totalPages)
        } catch (error) {
            console.error("Erro ao buscar grupos Compre Junto:", error)
        }
    }

    const handleSave = async (id: string, field: keyof BuyTogetherProps) => {
        try {
            let updatedField: Partial<BuyTogetherProps> = {};

            if (field === "status") {
                updatedField = { status: editedValue };
            }

            const data = { ...updatedField, id: id };

            await apiClient.put(`/buyTogether/status`, data);

            setBuyTogether((prevBuyTogether) =>
                prevBuyTogether.map((buy) => (buy.id === id ? { ...buy, ...updatedField } : buy))
            );

            setEditingBuyTogether(null);
            toast.success("Dado atualizado com sucesso");

        } catch (error) {
            console.log("Erro ao atualizar o status do grupo:", error);
            toast.error("Erro ao atualizar o dado!!!");
        }
    };

    const handleEdit = (id: string, field: string, currentValue: string) => {
        setEditingBuyTogether({ id, field });
        setEditedValue(currentValue);
    };

    // Colunas permitidas para exportação/pesquisa
    const availableColumns = ["name", "created_at", "product", "status"]

    const customNames: Record<string, string> = {
        name: "Nome do Grupo",
        created_at: "Data de Criação",
        product: "Produtos do grupo",
        status: "Status"
    }

    // Configuração de ordenação
    const columnsOrder = [
        { key: "name", label: "Nome do Grupo" },
        { key: "created_at", label: "Data de Criação" }
    ]

    const availableColumnsOrder = ["created_at", "name"]

    const customNamesOrder = {
        created_at: "Data de Registro",
        name: "Nome do Grupo"
    }

    return (
        <SidebarAndHeader>
            <Section>
                <TitlePage title="COMPRE JUNTO" />

                <button
                    className='bg-green-600 p-3 rounded-md text-white mb-4'
                    onClick={() => router.push(`/products/buy_together/add_buyTogether`)}
                >
                    Adicionar Compre Junto
                </button>

                <Suspense fallback={<div>Carregando...</div>}>
                    <DataTable
                        timeFilterButton={true}
                        checkbox_delete={true}
                        active_buttons_searchInput_comments={false}
                        name_file_export="Compre_junto"
                        modal_delete_bulk={false}
                        active_buttons_searchInput_notification={false}
                        active_export_data={true}
                        customNamesOrder={customNamesOrder}
                        availableColumnsOrder={availableColumnsOrder}
                        columnsOrder={columnsOrder}
                        table_data="buyTogether"
                        url_delete_data="/buyTogether/delete"
                        data={buyTogether}
                        totalPages={totalPages}
                        onFetchData={fetchBuyTogether}
                        availableColumns={availableColumns}
                        customNames={customNames}
                        generate_excel_delete=""
                        delete_bulk_data=""
                        columns={[
                            {
                                key: "name",
                                label: "Nome do Grupo"
                            },
                            {
                                key: "product",
                                label: "Produtos",
                                render: (item: BuyTogetherProps) => {
                                    const isSingle = item.product.length <= 1;
                                    return (
                                        <div
                                            className={`${isSingle ? "flex items-center" : "flex flex-col space-y-1"
                                                } overflow-hidden`}
                                        >
                                            {item.product.map((p, idx) => (
                                                <div
                                                    key={idx}
                                                    className={`flex items-center space-x-2 flex-shrink-0 ${!isSingle ? "py-1" : ""
                                                        }`}
                                                >
                                                    <Image
                                                        src={`${API_URL}/files/${p.images[0]?.url}`}
                                                        alt={p.name}
                                                        width={32}
                                                        height={32}
                                                        className="rounded-full object-cover border border-gray-200"
                                                    />
                                                    <span
                                                        className="truncate max-w-[420px]"
                                                        title={p.name}
                                                    >
                                                        {p.name}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                }
                            },
                            {
                                key: 'status',
                                label: 'Ativado?',
                                render: (item) => (
                                    <span>
                                        {editingBuyTogether?.id === item.id && editingBuyTogether?.field === "status" ? (
                                            <select
                                                value={editedValue || item.status || ''}
                                                onChange={(e) => setEditedValue(e.target.value)}
                                                onBlur={() => handleSave(item.id, "status")}
                                                className="appearance-auto text-black border-gray-300 rounded-md p-1"
                                            >
                                                {statusOptions.map((status) => (
                                                    <option key={status} value={status}>
                                                        {status}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <span
                                                onClick={() => handleEdit(item.id, "status", item.status || '')
                                                }
                                                className="cursor-pointer text-red-500 hover:underline"
                                            >
                                                {item.status}
                                            </span>
                                        )}
                                    </span>
                                ),
                            },
                            {
                                key: "created_at",
                                label: "Data de Criação",
                                render: (item: BuyTogetherProps) => (
                                    <span>
                                        {moment(item.created_at).format('DD/MM/YYYY HH:mm')}
                                    </span>
                                )
                            },
                            {
                                key: 'edit',
                                label: 'Editar',
                                render: (item) => (
                                    <button
                                        className='m-5 p-1 bg-red-500 text-[#FFFFFF] text-xs rounded hover:bg-red-600 transition duration-300'
                                        onClick={() => router.push(`/products/buy_together/${item.id}`)}
                                    >
                                        Editar
                                    </button>
                                ),
                            },
                        ]}
                    />
                </Suspense>
            </Section>
        </SidebarAndHeader>
    )
}