"use client"

import { Suspense } from 'react';
import DataTable from "@/app/components/dataTable";
import Image from "next/image";
import { Section } from "@/app/components/section";
import { SidebarAndHeader } from "@/app/components/sidebarAndHeader";
import { TitlePage } from '@/app/components/section/titlePage';
import { setupAPIClientEcommerce } from '@/app/services/apiEcommerce';
import { zodResolver } from "@hookform/resolvers/zod";
import moment from "moment";
import { useContext, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { z } from "zod";
import { MdNotInterested } from "react-icons/md";
import noImage from '../../../../../public/no-image.png';
import { AuthContext } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface ProductProps {
    id: string;
    name?: string;
    price_per: number;
    price_of?: number;
    brand?: string;
    skuMaster?: string;
    stock?: number;
    mainPromotion_id?: string;
    status?: string;
    view?: number;
    created_at: string | number | Date;
    edit?: string;
    categories?: Array<{
        category: {
            name: string;
        };
    }>;
    images?: Array<{
        id?: string;
        url?: string;
        altText?: string;
    }>;
    variants?: Array<{
        sku: string;
    }>;
    childProduct?: Array<{
        name: string;
    }>;
    parentRelations?: Array<{
        parentProduct: {
            id: string;
            name: string;
        };
    }>;
}

const statusOptions = ["DISPONIVEL", "INDISPONIVEL"];

const schema = z.object({
    order: z.number().min(1, "A ordem deve ser um número positivo."),
});

type FormData = z.infer<typeof schema>;

export default function All_products() {

    const router = useRouter();

    const { user } = useContext(AuthContext);
    const apiClient = setupAPIClientEcommerce();

    const [allproducts, setAllproducts] = useState<ProductProps[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const [editingProduct, setEditingProduct] = useState<{ id: string, field: string } | null>(null);
    const [editedValue, setEditedValue] = useState<string>("");
    const [modalImage, setModalImage] = useState<string | null>(null);

    const { formState: { errors }, reset } = useForm<FormData>({
        resolver: zodResolver(schema),
        mode: "onChange",
    });

    async function fetchProducts({ page, limit, search, orderBy, orderDirection, startDate, endDate }: any) {
        try {
            const response = await apiClient.get(`/get/products`, {
                params: { page, limit, search, orderBy, orderDirection, startDate, endDate }
            });
            setAllproducts(response.data.products);
            setTotalPages(response.data.totalPages);
        } catch (error) {
            console.log(error);
        }
    }

    const handleSave = async (id: string, field: keyof ProductProps) => {
        try {
            let updatedField: Partial<ProductProps> = {};

            if (field === "status") {
                updatedField = { status: editedValue };
            }

            const data = { ...updatedField, id: id };

            console.log(data)

            await apiClient.put(`/product/status`, data);

            setAllproducts((prevProduct) =>
                prevProduct.map((product) => (product.id === id ? { ...product, ...updatedField } : product))
            );

            setEditingProduct(null);
            toast.success("Dado atualizado com sucesso");
        } catch (error) {
            console.log("Erro ao atualizar o produto:", error);
            toast.error("Erro ao atualizar o dado!!!");
        }
    };

    const handleEdit = (id: string, field: string, currentValue: string) => {
        setEditingProduct({ id, field });
        setEditedValue(currentValue);
    };

    const handleImageClick = (imageUrl: string) => {
        setModalImage(imageUrl);
    };

    const handleCloseModal = () => {
        setModalImage(null);
    };

    return (
        <SidebarAndHeader children={
            <Section>
                <TitlePage title="TODAS OS PRODUTOS" />

                <Suspense fallback={<div>Carregando...</div>}>
                    <DataTable
                        timeFilterButton={true}
                        active_buttons_searchInput_comments={false}
                        checkbox_delete={true}
                        generate_excel_delete=""
                        delete_bulk_data=""
                        modal_delete_bulk={false}
                        active_buttons_searchInput_notification={false}
                        active_export_data={true}
                        name_file_export="Produtos"
                        availableColumns={[
                            "id",
                            "name",
                            "brand",
                            "status",
                            "skuMaster",
                            "price_per",
                            "price_of",
                            "images",
                            "created_at"
                        ]}
                        customNames={{
                            id: "ID do produto",
                            name: "Nome do produto",
                            skuMaster: "Código do produto",
                            status: "Status",
                            categories: "Categorias",
                            parentRelations: "Qtd. Pais",
                            created_at: "Data de cadastro"
                        }}
                        customNamesOrder={{
                            name: "Nome",
                            created_at: "Data de Registro"
                        }}
                        availableColumnsOrder={["name", "created_at"]}
                        columnsOrder={[
                            { key: "name", label: "Nome" },
                            { key: "created_at", label: "Data de Criação" }
                        ]}
                        table_data="product"
                        url_delete_data="/products/delete"
                        data={allproducts}
                        totalPages={totalPages}
                        onFetchData={fetchProducts}
                        columns={[
                            {
                                key: 'images',
                                label: 'Imagem',
                                render: (item) => (
                                    <>
                                        {item.images?.length ? (
                                            <Image
                                                src={`${API_URL}/files/${item.images[0].url}`}
                                                alt={item.images[0].altText || 'Imagem do produto'}
                                                width={100}
                                                height={100}
                                                className="w-8 h-8 rounded-full object-cover cursor-pointer"
                                                onClick={() =>
                                                    user?.role !== "EMPLOYEE" &&
                                                    item.images?.[0]?.url &&
                                                    handleImageClick(`${API_URL}/files/${item.images[0].url}`)
                                                }
                                            />
                                        ) : (
                                            <div className="mr-3 w-[50px] h-[50px] rounded-full bg-gray-300 flex items-center justify-center md:w-[40px] md:h-[40px]">
                                                <MdNotInterested
                                                    className="cursor-pointer"
                                                    color="black"
                                                    size={25}
                                                />
                                            </div>
                                        )}
                                        {modalImage && (
                                            <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
                                                <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full relative">
                                                    <button
                                                        onClick={handleCloseModal}
                                                        className="absolute top-2 right-2 text-black hover:text-red-600 text-lg"
                                                    >
                                                        X
                                                    </button>
                                                    <div className="flex justify-center mb-4 w-96 h-96">
                                                        <Image
                                                            src={modalImage || noImage}
                                                            alt="Imagem do produto"
                                                            width={400}
                                                            height={400}
                                                            className="object-cover rounded-md"
                                                            style={{ maxWidth: '100%', maxHeight: '100%' }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ),
                            },
                            {
                                key: "name",
                                label: "Nome",
                            },
                            {
                                key: "brand",
                                label: "Marca"
                            },
                            {
                                key: 'categories',
                                label: 'Categorias',
                                render: (item: ProductProps) => (
                                    <>
                                        {item.categories?.length === 0 ? (
                                            <span className="text-gray-500">
                                                Sem categoria
                                            </span>
                                        ) : (
                                            <span className="flex flex-wrap space-x-2 max-w-xs">
                                                {item.categories?.map((child, index) => (
                                                    <span
                                                        key={index}
                                                        className="p-1 bg-gray-200 rounded-full text-xs whitespace-nowrap text-black"
                                                    >
                                                        {child.category.name}
                                                    </span>
                                                ))}
                                            </span>
                                        )}
                                    </>
                                ),
                            },
                            {
                                key: "stock",
                                label: "Estoque"
                            },
                            {
                                key: "price_of",
                                label: "Preço",
                                render: (item) => (
                                    <span>
                                        {new Intl.NumberFormat('pt-BR', {
                                            style: 'currency',
                                            currency: 'BRL'
                                        }).format(item.price_of || 0)}
                                    </span>
                                ),
                            },
                            {
                                key: "variants",
                                label: "Variantes",
                                render: (item: ProductProps) => (
                                    <>
                                        <span className='m-9'>{item.variants?.length}</span>
                                    </>
                                )
                            },
                            {
                                key: 'parentRelations',
                                label: 'Produtos Pais',
                                render: (item) => (
                                    <span className='m-9'>
                                        {item.parentRelations?.length || 0}
                                    </span>
                                ),
                            },
                            {
                                key: 'childProduct',
                                label: 'Produtos Filhos',
                                render: (item) => (
                                    <span className='m-9'>
                                        {item.childProduct?.length || 0}
                                    </span>
                                ),
                            },
                            {
                                key: "view",
                                label: "Visualizaçãoes"
                            },
                            {
                                key: 'status',
                                label: 'Permitir Venda?',
                                render: (item) => (
                                    <span>
                                        {editingProduct?.id === item.id && editingProduct?.field === "status" ? (
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
                                                onClick={() => user?.role !== "EMPLOYEE" &&
                                                    handleEdit(item.id, "status", item.status || '')
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
                                label: "Data de Cadastro",
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
                                        onClick={() => router.push(`/products/${item.id}`)}
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