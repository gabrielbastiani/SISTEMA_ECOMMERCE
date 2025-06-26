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
import { Key, useContext, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { z } from "zod";
import { MdNotInterested } from "react-icons/md";
import noImage from '../../../../../public/no-image.png';
import { AuthContext } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface CategoryProps {
    name: string;
    id: string;
    slug: string;
    image: string | null;
    status: string;
    description: string;
    order: number;
    parentId: string;
    children: {
        map: any;
        name: string;
        length: number;
    }
    products: {
        map: any;
        length: number;
    }[]
    created_at: string | number | Date;
}

const statusOptions = ["DISPONIVEL", "INDISPONIVEL"];

const schema = z.object({
    order: z.number().min(1, "A ordem deve ser um número positivo."),
});

type FormData = z.infer<typeof schema>;

export default function All_categories() {

    const router = useRouter();

    const { user } = useContext(AuthContext);
    const apiClient = setupAPIClientEcommerce();

    const [allCategories, setAllCategories] = useState<CategoryProps[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const [editingCategory, setEditingCategory] = useState<{ id: string, field: string } | null>(null);
    const [editedValue, setEditedValue] = useState<string>("");
    const [modalImage, setModalImage] = useState<string | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [showDescriptionPopup, setShowDescriptionPopup] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [currentCategoryId, setCurrentCategoryId] = useState("");

    console.log(allCategories)

    const { formState: { errors }, reset } = useForm<FormData>({
        resolver: zodResolver(schema),
        mode: "onChange",
    });

    async function fetchCategories({ page, limit, search, orderBy, orderDirection, startDate, endDate }: any) {
        try {
            const response = await apiClient.get(`/category/cms/all_categories`, {
                params: { page, limit, search, orderBy, orderDirection, startDate, endDate }
            });
            setAllCategories(response.data.categories);
            setTotalPages(response.data.totalPages);
        } catch (error) {
            console.log(error);
        }
    }

    const handleSave = async (id: string, field: keyof CategoryProps) => {
        try {
            let updatedField: Partial<CategoryProps> = {};

            if (field === "name") {
                updatedField = { name: editedValue };
            } else if (field === "description") {
                updatedField = { description: editedValue };
            } else if (field === "status") {
                updatedField = { status: editedValue };
            } else if (field === "order") {
                updatedField = { order: Number(editedValue) };
            }

            const data = { ...updatedField, category_id: id };

            await apiClient.put(`/category/update`, data);

            setAllCategories((prevCateg) =>
                prevCateg.map((categ) => (categ.id === id ? { ...categ, ...updatedField } : categ))
            );

            setEditingCategory(null);
            setShowDescriptionPopup(null);
            toast.success("Dado atualizado com sucesso");
        } catch (error) {
            console.log("Erro ao atualizar a categoria:", error);
            toast.error("Erro ao atualizar o dado!!!");
        }
    };

    const handleEdit = (id: string, field: string, currentValue: string) => {
        setEditingCategory({ id, field });
        setEditedValue(currentValue);
    };

    const handleImageClick = (imageUrl: string, id: string) => {
        setModalImage(imageUrl);
        setCurrentCategoryId(id);
    };

    const handleCloseModal = () => {
        setModalImage(null);
        setImagePreview(null);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleDescriptionClick = (id: string, description: string) => {
        setShowDescriptionPopup(id);
        setEditedValue(description || "");
    };

    const handleDeleteImage = async () => {
        try {
            await apiClient.put(`/category/delete_image?category_id=${currentCategoryId}`);
            setAllCategories((prevCateg) =>
                prevCateg.map((categ) => (categ.id === currentCategoryId ? { ...categ, image: null } : categ))
            );
            toast.success("Imagem excluída com sucesso");
            handleCloseModal();
        } catch (error) {
            console.error("Erro ao excluir a imagem:", error);
            toast.error("Erro ao excluir a imagem");
        }
    };

    const handleUpdateImage = async () => {
        if (fileInputRef.current && fileInputRef.current.files) {
            const formData = new FormData();
            formData.append("category_id", currentCategoryId);
            formData.append("file", fileInputRef.current.files[0]);

            try {
                const response = await apiClient.put(`/category/update`, formData);
                const updatedCategory = response.data;

                setAllCategories((prevCateg) =>
                    prevCateg.map((categ) => (categ.id === currentCategoryId ? { ...categ, image: updatedCategory.image } : categ))
                );

                toast.success("Imagem atualizada com sucesso");
                handleCloseModal();
            } catch (error) {
                console.error("Erro ao atualizar a imagem:", error);
                toast.error("Erro ao atualizar a imagem");
            }
        }
    };


    return (
        <SidebarAndHeader children={
            <Section>
                <TitlePage title="TODAS AS CATEGORIAS" />

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
                        name_file_export="Categorias"
                        availableColumns={["id", "name", "description", "status", "children", "created_at"]}
                        customNames={{
                            id: "ID da categoria",
                            name: "Nome da categoria",
                            description: "Descrição",
                            status: "Status",
                            children: "Subcategorias",
                            created_at: "Data de cadastro"
                        }}
                        customNamesOrder={{
                            name: "Nome Completo",
                            created_at: "Data de Registro"
                        }}
                        availableColumnsOrder={["name", "created_at"]}
                        columnsOrder={[
                            { key: "name", label: "Nome" },
                            { key: "created_at", label: "Data de Criação" }
                        ]}
                        table_data="category"
                        url_delete_data="/category/delete_category"
                        data={allCategories}
                        totalPages={totalPages}
                        onFetchData={fetchCategories}
                        columns={[
                            {
                                key: 'image',
                                label: 'Imagem',
                                render: (item) => (
                                    <>
                                        {item.image ? (
                                            <Image
                                                src={`${API_URL}/files/${item.image}`}
                                                alt={item.name}
                                                width={100}
                                                height={100}
                                                className="w-8 h-8 rounded-full object-cover cursor-pointer"
                                                onClick={() => user?.role === "EMPLOYEE" ? "" : handleImageClick(`${API_URL}/files/${item.image}`, item.id)} />
                                        ) : (
                                            <div className="mr-3 w-[50px] h-[50px] rounded-full bg-gray-300 flex items-center justify-center md:w-[40px] md:h-[40px]">
                                                <MdNotInterested
                                                    className="cursor-pointer"
                                                    color="black"
                                                    size={25}
                                                    onClick={() => user?.role === "EMPLOYEE" ? "" : handleImageClick(`${API_URL}/files/${item.image}`, item.id)} />
                                            </div>
                                        )}
                                        {modalImage && (
                                            <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
                                                <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full relative">
                                                    <button onClick={handleCloseModal} className="absolute top-2 right-2 text-black hover:text-red-600 text-lg">
                                                        X
                                                    </button>
                                                    <div className="flex justify-center mb-4 w-96 h-96">
                                                        {modalImage === null ?
                                                            <Image
                                                                src={noImage}
                                                                alt="not"
                                                                width={400}
                                                                height={400}
                                                                className="object-cover rounded-md"
                                                                style={{ maxWidth: '100%', maxHeight: '100%' }} />
                                                            :
                                                            <Image
                                                                src={imagePreview || modalImage}
                                                                alt="Imagem da Categoria"
                                                                width={400}
                                                                height={400}
                                                                className="object-cover rounded-md"
                                                                style={{ maxWidth: '100%', maxHeight: '100%' }} />}
                                                    </div>
                                                    <div className="flex flex-col gap-3">
                                                        <input
                                                            ref={fileInputRef}
                                                            type="file"
                                                            accept="image/*"
                                                            className="block w-full text-sm text-gray-600 bg-gray-100 border border-gray-300 rounded-lg cursor-pointer p-2 mb-3"
                                                            onChange={handleFileChange} />
                                                        <div className="flex justify-around">
                                                            <button
                                                                onClick={handleUpdateImage}
                                                                className="bg-green-500 text-[#FFFFFF] py-2 px-4 rounded-lg hover:bg-green-600 transition-colors"
                                                            >
                                                                Atualizar Imagem
                                                            </button>
                                                            <button
                                                                onClick={handleDeleteImage}
                                                                className="bg-red-500 text-[#FFFFFF] py-2 px-4 rounded-lg hover:bg-red-600 transition-colors"
                                                            >
                                                                Deletar Imagem
                                                            </button>
                                                        </div>
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
                                render: (item) => (
                                    <>
                                        {editingCategory?.id === item.id && editingCategory?.field === "name" ? (
                                            <input
                                                type="text"
                                                value={editedValue}
                                                onChange={(e) => setEditedValue(e.target.value)}
                                                onBlur={() => handleSave(item.id, "name")}
                                                className="border-gray-300 rounded-md p-1 text-black" />
                                        ) : (
                                            <span
                                                onClick={() => user?.role === "EMPLOYEE" ? "" : handleEdit(item.id, "name", item.name)}
                                                className="cursor-pointer hover:underline text-[#FFFFFF] truncate max-w-44"
                                            >
                                                {item.name}
                                            </span>
                                        )}
                                    </>
                                ),
                            },
                            {
                                key: "description",
                                label: "Descrição",
                                render: (item) => (
                                    <span
                                        onClick={() => user?.role === "EMPLOYEE" ? "" : handleDescriptionClick(item.id, item.description || "")}
                                        className="cursor-pointer text-[#FFFFFF] hover:underline text-xs truncate max-w-32"
                                    >
                                        {item.description ? item.description : "Adicionar descrição"}
                                    </span>
                                ),
                            },
                            {
                                key: 'order',
                                label: 'Ordenação',
                                render: (item) => (
                                    <span>
                                        {editingCategory?.id === item.id && editingCategory?.field === "order" ? (
                                            <input
                                                type="number"
                                                min={1}
                                                value={editedValue || item.order.toString()}
                                                onChange={(e) => setEditedValue(e.target.value)}
                                                onBlur={() => handleSave(item.id, "order")}
                                                className="border-gray-300 rounded-md p-1 text-black" />
                                        ) : (
                                            <span
                                                onClick={() => user?.role === "EMPLOYEE" ? "" : handleEdit(item.id, "order", item.order.toString())}
                                                className="cursor-pointer text-black hover:underline bg-slate-200 p-2 w-3 rounded"
                                            >
                                                {item.order}
                                            </span>
                                        )}
                                    </span>
                                ),
                            },
                            {
                                key: 'children',
                                label: 'Subcategorias',
                                render: (item: CategoryProps) => (
                                    <>
                                        {item.children.length === 0 ?
                                            <span className="text-gray-500">
                                                Sem subcategoria
                                            </span>
                                            :
                                            <span className="flex flex-wrap space-x-2 max-w-xs">
                                                {item.children.map((child: { name: string; }, index: Key | null | undefined) => {
                                                    return (
                                                        <span
                                                            key={index}
                                                            className="p-1 bg-gray-200 rounded-full text-xs whitespace-nowrap text-black"
                                                        >
                                                            {child.name}
                                                        </span>
                                                    );
                                                })}
                                            </span>
                                        }
                                    </>
                                ),
                            },
                            {
                                key: 'products',
                                label: 'Produtos',
                                render: (item: CategoryProps) => (
                                    <>
                                        {item.products.length >= 1 ?
                                        <span
                                        className="bg-gray-200 rounded-full text-xs whitespace-nowrap text-black p-2 cursor-pointer"
                                        onClick={() => router.push(`/categories/products/${item.id}`)}
                                    >
                                            {item.products?.length + "= Quais?"}
                                        </span>
                                            :
                                            <span className="text-gray-500">
                                                Sem produtos
                                            </span>
                                    }
                                    </>
                                ),
                            },
                            {
                                key: 'status',
                                label: 'Status',
                                render: (item) => (
                                    <span>
                                        {editingCategory?.id === item.id && editingCategory?.field === "status" ? (
                                            <select
                                                value={editedValue || item.status}
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
                                            <span onClick={() => user?.role === "EMPLOYEE" ? "" : handleEdit(item.id, "status", item.status)}
                                                className="cursor-pointer text-red-500 hover:underline">
                                                {item.status}
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
                            }
                        ]}
                    />
                </Suspense>
                {/* Popup for editing description */}
                {showDescriptionPopup && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="bg-white p-5 rounded shadow-lg w-80">
                            <h2 className="text-lg font-semibold mb-3 text-black">Editar Descrição</h2>
                            <textarea
                                value={editedValue}
                                onChange={(e) => setEditedValue(e.target.value)}
                                rows={4}
                                className="w-full border-black rounded-md p-2 text-black"
                            />
                            <div className="flex justify-end mt-4 space-x-2">
                                <button
                                    onClick={() => setShowDescriptionPopup(null)}
                                    className="px-4 py-2 text-sm font-semibold text-black bg-gray-100 rounded-md"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => handleSave(showDescriptionPopup, "description")}
                                    className="px-4 py-2 text-sm font-semibold text-[#FFFFFF] bg-backgroundButton rounded-md"
                                >
                                    Salvar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </Section>
        } />
    );
}