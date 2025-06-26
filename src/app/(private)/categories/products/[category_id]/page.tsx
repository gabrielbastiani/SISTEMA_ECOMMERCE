"use client";

import { JSXElementConstructor, ReactElement, ReactNode, ReactPortal, Suspense, useContext, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "react-toastify";
import { MdNotInterested } from "react-icons/md";
import { setupAPIClientEcommerce } from "@/app/services/apiEcommerce";
import { AuthContext } from "@/app/contexts/AuthContext";
import { SidebarAndHeader } from "@/app/components/sidebarAndHeader";
import { Section } from "@/app/components/section";
import { TitlePage } from "@/app/components/section/titlePage";
import DataTable from "@/app/components/dataTable";
import noImage from '../../../../../../public/no-image.png';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const schema = z.object({});
type FormData = z.infer<typeof schema>;

interface Category {
    name: string;
}

export default function ProductsCategoryPage() {

    const { category_id } = useParams<{ category_id: string }>();

    const router = useRouter();
    const { user } = useContext(AuthContext);

    const apiClient = setupAPIClientEcommerce();

    const [products, setProducts] = useState<any[]>([]);
    const [categoryName, setCategoryName] = useState<Category>();
    const [totalPages, setTotalPages] = useState(1);
    const [modalImage, setModalImage] = useState<string | null>(null);

    useForm<FormData>({
        resolver: zodResolver(schema),
        mode: "onChange",
    });

    const fetchProducts = async ({
        page = 1,
        limit = 5,
        search = "",
        orderBy = "created_at",
        orderDirection = "desc",
        startDate,
        endDate,
    }: any) => {
        try {
            const { data } = await apiClient.get("/category/products", {
                params: { category_id, page, limit, search, orderBy, orderDirection, startDate, endDate },
            });
            setProducts(data.products);
            setTotalPages(data.totalPages);
            setCategoryName(data.category);
        } catch (err) {
            console.error(err);
            toast.error("Erro ao carregar produtos");
        }
    };

    const handleImageClick = (imageUrl: string) => {
        setModalImage(imageUrl);
    };

    const handleCloseModal = () => {
        setModalImage(null);
    };

    const columns: any = [
        {
            key: 'images',
            label: 'Imagem',
            render: (item: any) => (
                <>
                    {item.images?.length ? (
                        <Image
                            src={`${API_URL}/files/${item.images[0].url}`}
                            alt={item.images[0].altText || 'Imagem do produto'}
                            width={150}
                            height={150}
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
            render: (item: { name: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; }): React.ReactNode => <span>{item.name}</span>,
        },
        {
            key: "brand",
            label: "Marca",
            render: (item: { brand: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; }): React.ReactNode => <span>{item.brand}</span>,
        },
        {
            key: "categories",
            label: "Categorias",
            render: (item: { categories: any[]; }): React.ReactNode =>
                item.categories.length ? (
                    <div className="flex flex-wrap gap-1">
                        {item.categories.map((c: any) => (
                            <span
                                key={c.category.id}
                                className="px-2 py-1 bg-gray-200 rounded-full text-xs text-black cursor-pointer"
                                onClick={() => router.push(`/categories/products/${c.category.id}`)}
                            >
                                {c.category.name}
                            </span>
                        ))}
                    </div>
                ) : (
                    <span className="text-gray-500">Sem categoria</span>
                ),
        },
        {
            key: "stock",
            label: "Estoque",
            render: (item: any): React.ReactNode => <span className="p-3">{item.stock}</span>,
        },
        {
            key: "price_of",
            label: "Preço",
            render: (item: any): React.ReactNode =>
                <span>
                    {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                    }).format(item.price_of)}
                </span>,
        },
        {
            key: "variants",
            label: "Variantes",
            render: (item: { variants: string | any[]; }): React.ReactNode => <span className="p-3">{item.variants.length}</span>,
        },
        {
            key: "parentRelations",
            label: "Produtos Pais",
            render: (item: { parentRelations: string | any[]; }): React.ReactNode => <span className="p-3">{item.parentRelations.length}</span>,
        },
        {
            key: "view",
            label: "Visualizações",
            render: (item: any): React.ReactNode => <span className="p-3">{item.view}</span>,
        },
        {
            key: "edit",
            label: "Editar",
            render: (item: any): React.ReactNode => (
                <button
                    className="px-2 py-1 bg-green-500 text-white rounded"
                    onClick={() => router.push(`/products/${item.id}`)}
                >
                    Editar
                </button>
            ),
        },
    ];

    return (
        <SidebarAndHeader>
            <Section>
                <TitlePage title={`Produtos da Categoria: ${categoryName?.name}`} />
                <Suspense fallback={<div>Carregando...</div>}>
                    <DataTable
                        timeFilterButton
                        availableColumns={columns.map((c: { key: any; }) => c.key)}
                        customNames={columns.reduce((acc: any, c: { key: any; label: any; }) => ({ ...acc, [c.key]: c.label }), {})}
                        columnsOrder={[
                            { key: "name", label: "Nome" },
                            { key: "created_at", label: "Data de Criação" },
                        ]}
                        data={products}
                        totalPages={totalPages}
                        onFetchData={fetchProducts}
                        columns={columns}
                        generate_excel_delete={""}
                        delete_bulk_data={""}
                        modal_delete_bulk={false}
                        active_buttons_searchInput_notification={false}
                        active_buttons_searchInput_comments={false}
                        checkbox_delete={false}
                        active_export_data={false}
                        customNamesOrder={{
                            name: "Nome",
                            created_at: "Data de Registro"
                        }}
                        availableColumnsOrder={["name", "created_at"]}
                        table_data="product"
                        url_delete_data={""}
                    />
                </Suspense>
            </Section>
        </SidebarAndHeader>
    );
}