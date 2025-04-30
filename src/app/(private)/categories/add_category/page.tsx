"use client";

import { ChangeEvent, useContext, useEffect, useState } from "react";
import { setupAPIClientEcommerce } from "@/app/services/apiEcommerce";
import Image from "next/image";
import { AuthContext } from "@/app/contexts/AuthContext";
import { SidebarAndHeader } from "@/app/components/sidebarAndHeader";
import { Section } from "@/app/components/section";
import { TitlePage } from "@/app/components/section/titlePage";
import { toast } from "react-toastify";
import { FiChevronRight, FiMoreVertical, FiArrowUp, FiUpload } from "react-icons/fi";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import BulkDatas from "@/app/components/bulkDatas";
import { Input } from "@/app/components/input";

const schema = z.object({
    name: z.string().nonempty("O campo nome é obrigatório"),
    parentId: z.string().optional(),
    description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Category {
    depth: number;
    id: string;
    name: string;
    parentId: string | null;
    children: Category[];
    order: number;
}

export default function ManageCategoriesMobile() {

    const { user } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
    const [availableCategories, setAvailableCategories] = useState<any[]>([]);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [photo, setPhoto] = useState<File | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [showMoveOptions, setShowMoveOptions] = useState(false);

    const refetchCategories = () => {
        const event = new Event("refetchCategories");
        window.dispatchEvent(event);
    };

    const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
        resolver: zodResolver(schema),
        mode: "onChange",
    });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const apiClient = setupAPIClientEcommerce();
            const response = await apiClient.get('/category/cms');
            setAvailableCategories(response.data.rootCategories);
        } catch (error) {
            toast.error("Erro ao carregar categorias");
        }
    };

    function handleFile(e: ChangeEvent<HTMLInputElement>) {
        if (!e.target.files) return;

        const image = e.target.files[0];
        if (!image) return;

        if (image.type === "image/jpeg" || image.type === "image/png") {
            setPhoto(image);
            setAvatarUrl(URL.createObjectURL(image));
        } else {
            toast.error("Formato de imagem inválido. Selecione uma imagem JPEG ou PNG.");
        }
    }

    const onSubmit = async (data: FormData) => {
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("userEcommerce_id", user?.id || "");
            formData.append("name", data.name);
            formData.append("description", data.description || "");
            if (data.parentId) {
                formData.append("parentId", data.parentId);
            }

            if (photo) {
                formData.append("file", photo);
            }

            const apiClient = setupAPIClientEcommerce();
            await apiClient.post('/category/create', formData);

            toast.success("Categoria cadastrada com sucesso!");
            reset();
            setAvatarUrl(null);
            setPhoto(null);
            refetchCategories();
            fetchCategories();
        } catch (error) {
            toast.error("Erro ao cadastrar a categoria.");
        } finally {
            setLoading(false);
        }
    };

    const handleCategoryPress = (category: Category) => {
        setSelectedCategory(category);
        setShowMoveOptions(true);
    };

    const moveCategory = async (targetId: string | null) => {
        if (!selectedCategory) return;

        try {
            const apiClient = setupAPIClientEcommerce();
            await apiClient.put(`/category/updateOrder`, {
                draggedId: selectedCategory.id,
                targetId: targetId
            });

            // Atualização otimista com recarregamento
            const response = await apiClient.get('/category/cms');
            setAvailableCategories(response.data.rootCategories);

            toast.success("Categoria movida com sucesso!");
        } catch (error) {
            console.error("Erro detalhado:", error);
            toast.error("Erro ao mover categoria");
        } finally {
            setShowMoveOptions(false);
            setSelectedCategory(null);
        }
    };

    const renderCategoryTree = (items: Category[], parentId: string | null = null, depth: number = 0) => {
        return items
            .filter(item => item.parentId === parentId)
            .sort((a, b) => a.order - b.order)
            .map((item) => (
                <div key={item.id} className="text-black">
                    <div className="flex items-center justify-between bg-gray-100 p-3 rounded-lg mb-1 
                        border-l-4 border-blue-200 hover:border-blue-400 transition-all"
                        style={{ marginLeft: `${depth * 20}px` }}>
                        <div className="flex items-center flex-1">
                            {item.children.length > 0 && <FiChevronRight className="mr-2 text-black" />}
                            <span className="font-medium text-black">{item.name}</span>
                        </div>
                        <button
                            onClick={() => handleCategoryPress(item)}
                            className="p-2 hover:bg-gray-200 rounded-full text-black"
                        >
                            <FiMoreVertical />
                        </button>
                    </div>

                    {item.children.length > 0 && (
                        <div className="ml-4 border-l-2 border-gray-300">
                            {renderCategoryTree(item.children, item.id, depth + 1)}
                        </div>
                    )}
                </div>
            ));
    };

    const MoveOptionsModal = () => {
        const flattenCategories = (items: Category[], depth: number = 0): Category[] => {
            return items.reduce<Category[]>((acc, item) => {
                return [
                    ...acc,
                    { ...item, depth },
                    ...flattenCategories(item.children, depth + 1)
                ];
            }, []);
        };

        const allCategories = flattenCategories(availableCategories);

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                <div className="w-full bg-white rounded-lg max-h-[80vh] overflow-y-auto 
                    shadow-xl max-w-2xl text-black">
                    <div className="p-4 border-b">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-black">Mover categoria</h3>
                            <button
                                onClick={() => setShowMoveOptions(false)}
                                className="p-2 hover:bg-gray-100 rounded-full text-black"
                            >
                                ✕
                            </button>
                        </div>

                        <button
                            onClick={() => moveCategory(null)}
                            className="w-full p-3 bg-gray-100 rounded-lg flex items-center mb-4
                                hover:bg-gray-200 transition-colors text-black"
                        >
                            <FiArrowUp className="mr-2" />
                            Tornar categoria raiz
                        </button>

                        <div className="space-y-2">
                            {allCategories.map(category => (
                                <button
                                    key={category.id}
                                    onClick={() => moveCategory(category.id)}
                                    className={`w-full p-3 rounded-lg text-left 
                                        ${category.id === selectedCategory?.id ?
                                            'bg-gray-300 cursor-not-allowed' :
                                            'bg-gray-100 hover:bg-gray-200'}
                                        transition-colors text-black`}
                                    style={{ marginLeft: `${category.depth * 20}px` }}
                                    disabled={category.id === selectedCategory?.id}
                                >
                                    {category.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <SidebarAndHeader>
            <Section>
                <TitlePage title="CADASTRAR E GERENCIAR CATEGORIAS" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-7xl mx-auto">
                    <form onSubmit={handleSubmit(onSubmit)} className="col-span-1 md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex flex-col items-center">
                            <label className="relative w-full h-[200px] rounded-lg cursor-pointer flex justify-center bg-gray-200 overflow-hidden mb-6">
                                <span className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black bg-opacity-50 transition-opacity duration-300">
                                    <FiUpload size={30} color="#ff6700" />
                                </span>
                                <input
                                    type="file"
                                    accept="image/png, image/jpeg"
                                    onChange={handleFile}
                                    className="hidden"
                                />
                                {avatarUrl ? (
                                    <div className="w-full h-full bg-gray-300 flex items-center justify-center overflow-hidden">
                                        <Image
                                            className="object-cover w-full h-full"
                                            src={avatarUrl}
                                            width={250}
                                            height={200}
                                            alt="Preview da imagem"
                                            style={{ objectFit: "cover" }}
                                        />
                                    </div>
                                ) : (
                                    <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                                        <FiUpload size={30} color="#ff6700" />
                                    </div>
                                )}
                            </label>
                        </div>

                        <div className="flex flex-col gap-4">
                            <Input
                                styles="border-2 rounded-md h-12 px-3 w-full"
                                type="text"
                                placeholder="Digite um nome..."
                                name="name"
                                error={errors.name?.message}
                                register={register}
                            />

                            <div>
                                <label htmlFor="parentId" className="block text-sm font-medium text-[#FFFFFF]">
                                    Subcategoria de alguma categoria?
                                </label>
                                <select
                                    {...register("parentId")}
                                    className="border-2 rounded-md h-12 px-3 w-full text-black"
                                    defaultValue=""
                                >
                                    <option value="">Nenhuma (Categoria Raiz)</option>
                                    {availableCategories.map(category => (
                                        <option className="text-black" key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.parentId && <p className="text-red-500 text-xs">{errors.parentId.message}</p>}
                            </div>
                        </div>

                        <div>
                            <textarea
                                {...register("description")}
                                className="border-2 rounded-md h-56 p-3 w-full resize-none text-black"
                                placeholder="Digite uma descrição para a categoria..."
                            />
                            {errors.description && <p className="text-red-500 text-xs">{errors.description.message}</p>}
                        </div>

                        <div className="col-span-1 md:col-span-3">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full px-6 py-3 bg-green-500 text-[#FFFFFF] rounded hover:bg-green-600 transition duration-300"
                            >
                                {loading ? "Cadastrando..." : "Cadastrar Categoria"}
                            </button>
                        </div>
                    </form>

                    <div className="flex items-start justify-center">
                        <BulkDatas
                            link_donwload="/category/donwload_excel_categories?userEcommerce_id"
                            name_file="modelo_categorias.xlsx"
                            link_register_data="/category/bulk_categories?userEcommerce_id"
                        />
                    </div>
                </div>

                <div className="p-4 space-y-2">
                    {renderCategoryTree(availableCategories)}
                </div>

                {showMoveOptions && <MoveOptionsModal />}
            </Section>
        </SidebarAndHeader>
    );
}