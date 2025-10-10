"use client"

export const dynamic = 'force-dynamic';
import { Section } from "@/app/components/section";
import { SidebarAndHeader } from "@/app/components/sidebarAndHeader";
import { TitlePage } from "@/app/components/section/titlePage";
import { setupAPIClientEcommerce } from "@/app/services/apiEcommerce";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { FiEdit, FiTrash, FiUpload } from "react-icons/fi";
import { toast } from "react-toastify";
import { z } from "zod";
import { FiCheck } from "react-icons/fi";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const schema = z.object({
    page: z.enum([
        "Pagina principal",
        "Sobre",
        "Contato",
        "Trocas e devoluções",
        "Formas de pagamento",
        "Como comprar",
        "Politicas de privacidade",
        "Envio e prazo de entrega",
        "Perguntas frequentes"
    ], {
        errorMap: () => ({ message: "Selecione uma página válida" })
    }),
    title: z.string().optional(),
    description: z.string().optional(),
    ogTitle: z.string().optional(),
    ogDescription: z.string().optional(),
    ogImageWidth: z.number().optional(),
    ogImageHeight: z.number().optional(),
    ogImageAlt: z.string().optional(),
    twitterTitle: z.string().optional(),
    twitterDescription: z.string().optional(),
    twitterCreator: z.string().optional(),
});

type FormData = z.infer<typeof schema>;
type SEOData = FormData & {
    keywords: string[];
    ogImages: string[];
    twitterImages: string[];
};

export default function Seo_id({ params }: { params: { seo_id: string } }) {

    const [loading, setLoading] = useState(true);
    const [keywords, setKeywords] = useState<string[]>([]);
    const [editingKeywordIndex, setEditingKeywordIndex] = useState<number | null>(null);
    const [existingOgImages, setExistingOgImages] = useState<string[]>([]);
    const [ogImageIndexes, setOgImageIndexes] = useState<number[]>([]);
    const [newOgImages, setNewOgImages] = useState<File[]>([]);
    const [existingTwitterImages, setExistingTwitterImages] = useState<string[]>([]);
    const [twitterImageIndexes, setTwitterImageIndexes] = useState<number[]>([]);
    const [newTwitterImages, setNewTwitterImages] = useState<File[]>([]);
    const [deletedKeywordIndexes, setDeletedKeywordIndexes] = useState<number[]>([]);
    const [isAddingKeyword, setIsAddingKeyword] = useState(false);
    const [newKeywordTemp, setNewKeywordTemp] = useState("");

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        mode: "onChange",
    });

    useEffect(() => {
        const loadSeoData = async () => {
            try {
                const apiClient = setupAPIClientEcommerce();
                const response = await apiClient.get(`/seo/get_seo?sEOSettings_id=${params.seo_id}`);
                const data: SEOData = response.data;

                reset({
                    ...data,
                    ogImageWidth: data.ogImageWidth !== undefined ? Number(data.ogImageWidth) : undefined,
                    ogImageHeight: data.ogImageHeight !== undefined ? Number(data.ogImageHeight) : undefined,
                });
                setKeywords(data.keywords || []);
                setExistingOgImages(data.ogImages || []);
                setExistingTwitterImages(data.twitterImages || []);

            } catch (error) {
                toast.error("Erro ao carregar dados SEO");
            } finally {
                setLoading(false);
            }
        };

        loadSeoData();
    }, [params.seo_id, reset]);

    const handleKeywordUpdate = (index: number, newValue: string) => {
        const updatedKeywords = [...keywords];
        updatedKeywords[index] = newValue;
        setKeywords(updatedKeywords);
        setEditingKeywordIndex(null);
    };

    const onSubmit = async (formData: FormData) => {
        try {
            const apiClient = setupAPIClientEcommerce();
            const formPayload = new FormData();

            formPayload.append("sEOSettings_id", params.seo_id);

            const numericFields = ["ogImageWidth", "ogImageHeight"];
            const processedData: Record<string, any> = { ...formData };

            numericFields.forEach((field) => {
                if (
                    processedData[field] === "" ||
                    isNaN(processedData[field]) ||
                    processedData[field] === null
                ) {
                    delete processedData[field];
                }
            });

            Object.entries(processedData).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    formPayload.append(key, value.toString());
                }
            });

            formPayload.append("deletedKeywordIndexes", JSON.stringify(deletedKeywordIndexes));
            formPayload.append("newKeywords", JSON.stringify(keywords));
            formPayload.append("keywordIndexes", JSON.stringify(keywords.map((_, i) => i)));

            formPayload.append("ogImageIndexes", JSON.stringify(ogImageIndexes));
            newOgImages.forEach(file => formPayload.append("ogImages", file));

            formPayload.append("twitterImageIndexes", JSON.stringify(twitterImageIndexes));
            newTwitterImages.forEach(file => formPayload.append("twitterImages", file));

            await apiClient.put(`/seo/update_seo`, formPayload, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            toast.success("Configurações atualizadas com sucesso!");
            setDeletedKeywordIndexes([]); // Resetar índices deletados após sucesso

        } catch (error) {
            toast.error("Erro ao atualizar configurações");
            console.error("Erro detalhado:", error);
        }
    };

    // Função para deletar keyword
    const handleKeywordDeletes = async (index: number) => {
        try {
            const apiClient = setupAPIClientEcommerce();

            // Enviar índice para deleção
            await apiClient.delete(`/seo/keyword`, {
                data: {
                    sEOSettings_id: params.seo_id,
                    keywordIndex: index
                }
            });

            // Atualizar estado local
            const newKeywords = [...keywords];
            newKeywords.splice(index, 1);
            setKeywords(newKeywords);

            toast.success("Palavra-chave deletada com sucesso!");

        } catch (error) {
            toast.error("Erro ao deletar palavra-chave");
        }
    };

    // Função para adicionar nova keyword
    const handleAddKeyword = async () => {
        if (!newKeywordTemp.trim()) return;

        try {
            const apiClient = setupAPIClientEcommerce();
            await apiClient.post(`/seo/keyword`, {
                sEOSettings_id: params.seo_id,
                keyword: newKeywordTemp.trim()
            });

            setKeywords(prev => [...prev, newKeywordTemp.trim()]);
            setNewKeywordTemp("");
            setIsAddingKeyword(false);
            toast.success("Palavra-chave adicionada!");

        } catch (error) {
            toast.error("Erro ao adicionar palavra-chave");
        }
    };

    // Função para deletar imagem OG (melhor tratamento e usa retorno do servidor)
    const handleDeleteOgImage = async (index: number) => {
        try {
            const apiClient = setupAPIClientEcommerce();
            // garantir que index seja number
            const imageIndex = Number(index);
            const response = await apiClient.delete('/seo/og-image', {
                data: {
                    sEOSettings_id: params.seo_id,
                    imageIndex
                }
            });

            // usar retorno do servidor (lista atualizada) preferencialmente
            const updatedImages: string[] = response.data?.ogImages ?? [];
            setExistingOgImages(updatedImages);

            toast.success("Imagem OG removida!");

        } catch (error) {
            console.error("Erro ao chamar delete og-image:", error);
            toast.error("Erro ao remover imagem OG");
        }
    };

    // Função para deletar imagem Twitter
    const handleDeleteTwitterImage = async (index: number) => {
        try {
            const apiClient = setupAPIClientEcommerce();
            const imageIndex = Number(index);
            const response = await apiClient.delete('/seo/twitter-image', {
                data: {
                    sEOSettings_id: params.seo_id,
                    imageIndex
                }
            });

            const updatedImages: string[] = response.data?.twitterImages ?? [];
            setExistingTwitterImages(updatedImages);

            toast.success("Imagem Twitter removida!");

        } catch (error) {
            console.error("Erro ao deletar imagem twitter:", error);
            toast.error("Erro ao remover imagem Twitter");
        }
    };

    if (loading) {
        return (
            <SidebarAndHeader>
                <Section>
                    <TitlePage title="Carregando..." />
                    <div className="text-center py-8">Carregando dados SEO...</div>
                </Section>
            </SidebarAndHeader>
        );
    }

    return (
        <SidebarAndHeader>
            <Section>
                <TitlePage title="EDITAR CONFIGURAÇÕES SEO" />

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-4xl">
                    <div className="grid gap-4">
                        <label className="block">
                            Página:
                            <select
                                {...register("page")}
                                className="w-full p-2 border rounded-md bg-white text-black"
                            >
                                <option value="">Selecione uma página</option>
                                {[
                                    "Pagina principal",
                                    "Sobre",
                                    "Contato",
                                    "Trocas e devoluções",
                                    "Formas de pagamento",
                                    "Como comprar",
                                    "Politicas de privacidade",
                                    "Envio e prazo de entrega",
                                    "Perguntas frequentes"
                                ].map((path) => (
                                    <option key={path} value={path}>
                                        {path}
                                    </option>
                                ))}
                            </select>
                            {errors.page && (
                                <span className="text-red-500 text-sm">{errors.page.message}</span>
                            )}
                        </label>

                        <label className="block">
                            Título:
                            <input
                                type="text"
                                {...register("title")}
                                className="w-full p-2 border rounded-md text-black"
                            />
                        </label>

                        <label className="block">
                            Descrição:
                            <textarea
                                {...register("description")}
                                className="w-full p-2 border rounded-md h-24 text-black"
                            />
                        </label>

                        <div className="block">
                            <label className="mb-2 block">Palavras-chave:</label>
                            <div className="flex flex-wrap gap-2">
                                {keywords.map((keyword, index) => (
                                    <div key={index} className="relative group">
                                        {editingKeywordIndex === index ? (
                                            <input
                                                type="text"
                                                value={keyword}
                                                onChange={(e) => {
                                                    const newKeywords = [...keywords];
                                                    newKeywords[index] = e.target.value;
                                                    setKeywords(newKeywords);
                                                }}
                                                onBlur={() => handleKeywordUpdate(index, keyword)}
                                                className="p-1 border rounded-md text-black"
                                                autoFocus
                                            />
                                        ) : (
                                            <div className="bg-gray-100 px-3 py-1 rounded-md flex items-center gap-2 text-black">
                                                <span>{keyword}</span>
                                                <FiEdit
                                                    className="cursor-pointer hover:text-green-600"
                                                    onClick={() => setEditingKeywordIndex(index)}
                                                />
                                                <FiTrash
                                                    className="cursor-pointer hover:text-red-600"
                                                    onClick={() => handleKeywordDeletes(index)}
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {isAddingKeyword ? (
                                    <div className="flex gap-2 items-center">
                                        <input
                                            type="text"
                                            value={newKeywordTemp}
                                            onChange={(e) => setNewKeywordTemp(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleAddKeyword()}
                                            autoFocus
                                            className="p-1 border rounded-md text-black w-32"
                                            placeholder="Nova keyword"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddKeyword}
                                            className="p-1 bg-green-500 text-[#FFFFFF] rounded-md hover:bg-green-600"
                                        >
                                            <FiCheck className="text-lg" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsAddingKeyword(false);
                                                setNewKeywordTemp("");
                                            }}
                                            className="p-1 bg-red-500 text-[#FFFFFF] rounded-md hover:bg-red-600"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => setIsAddingKeyword(true)}
                                        className="px-3 py-1 bg-green-500 text-[#FFFFFF] rounded-md hover:bg-green-600"
                                    >
                                        Adicionar
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Seção Open Graph */}
                    <div className="border-t pt-6">
                        <h3 className="text-xl font-bold mb-4">Open Graph</h3>

                        <div className="grid gap-4">
                            <label className="block">
                                Título OG:
                                <input
                                    type="text"
                                    {...register("ogTitle")}
                                    className="w-full p-2 border rounded-md text-black"
                                />
                            </label>

                            <label className="block">
                                Descrição OG:
                                <textarea
                                    {...register("ogDescription")}
                                    className="w-full p-2 border rounded-md h-24 text-black"
                                />
                            </label>

                            <div className="grid grid-cols-2 gap-4">
                                <label className="block">
                                    Largura da Imagem OG:
                                    <input
                                        type="number"
                                        {...register("ogImageWidth", { valueAsNumber: true })}
                                        className="w-full p-2 border rounded-md text-black"
                                    />
                                </label>

                                <label className="block">
                                    Altura da Imagem OG:
                                    <input
                                        type="number"
                                        {...register("ogImageHeight", { valueAsNumber: true })}
                                        className="w-full p-2 border rounded-md text-black"
                                    />
                                </label>
                            </div>

                            <label className="block">
                                Texto Alternativo OG:
                                <input
                                    type="text"
                                    {...register("ogImageAlt")}
                                    className="w-full p-2 border rounded-md text-black"
                                />
                            </label>

                            <div className="block">
                                <label className="mb-2 block">Imagens OG:</label>
                                <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4">
                                    {existingOgImages.map((image, index) => (
                                        <div key={index} className="relative group w-full aspect-square">
                                            <div className="relative w-full h-full rounded-lg border-2 overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                                                <Image
                                                    src={`${API_URL}/files/seo/${image}`}
                                                    alt={`Imagem OG ${index}`}
                                                    fill
                                                    className="object-cover"
                                                    sizes="(max-width: 768px) 100vw, 150px"
                                                />
                                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                    {/* Botão para substituir imagem */}
                                                    <label className="cursor-pointer p-2 bg-white/80 rounded-full hover:bg-white transition-colors">
                                                        <FiUpload className="text-xl text-gray-800" />
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={async (e) => {
                                                                if (e.target.files?.[0]) {
                                                                    try {
                                                                        const apiClient = setupAPIClientEcommerce();
                                                                        const formData = new FormData();

                                                                        formData.append('sEOSettings_id', params.seo_id);
                                                                        formData.append('ogImageIndexes', JSON.stringify([index]));
                                                                        formData.append('ogImages', e.target.files[0]);

                                                                        const response = await apiClient.put('/seo/update_seo', formData, {
                                                                            headers: { 'Content-Type': 'multipart/form-data' }
                                                                        });

                                                                        // Atualização correta com o caminho do servidor
                                                                        const updatedImages = response.data.ogImages; // Supondo que o backend retorne as imagens atualizadas
                                                                        setExistingOgImages(updatedImages);

                                                                        toast.success("Imagem OG atualizada!");
                                                                    } catch (error) {
                                                                        console.log(error);
                                                                        toast.error("Erro ao atualizar imagem OG");
                                                                    }
                                                                }
                                                            }}
                                                            className="hidden"
                                                        />
                                                    </label>

                                                    {/* Botão para deletar imagem */}
                                                    <button
                                                        onClick={async () => await handleDeleteOgImage(index)}
                                                        className="p-2 bg-white/80 rounded-full hover:bg-white transition-colors"
                                                    >
                                                        <FiTrash className="text-xl text-red-600" />
                                                    </button>
                                                </div>
                                            </div>
                                            <span className="absolute top-1 left-1 bg-black/70 text-[#FFFFFF] text-xs px-2 py-1 rounded-md">
                                                Imagem {index + 1}
                                            </span>
                                        </div>
                                    ))}

                                    {/* Botão para adicionar novas imagens */}
                                    <label className="relative aspect-square w-full flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                                        <FiUpload className="text-2xl text-gray-500" />
                                        <span className="text-sm text-gray-600">Adicionar Imagens</span>
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            onChange={async (e) => {
                                                if (e.target.files?.length) {
                                                    try {
                                                        const apiClient = setupAPIClientEcommerce();
                                                        const formData = new FormData();
                                                        formData.append('sEOSettings_id', params.seo_id);
                                                        Array.from(e.target.files).forEach(file => formData.append('images', file));

                                                        const response = await apiClient.post('/seo/og-images', formData, {
                                                            headers: { 'Content-Type': 'multipart/form-data' }
                                                        });

                                                        setExistingOgImages(prev => [...prev, ...response.data.newImages]);
                                                        toast.success("Imagens adicionadas com sucesso!");
                                                    } catch (error) {
                                                        toast.error("Erro ao adicionar imagens");
                                                    }
                                                }
                                            }}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                            </div>

                            {/* Seção Twitter */}
                            <div className="border-t pt-6">
                                <h3 className="text-xl font-bold mb-4">Twitter</h3>

                                <div className="grid gap-4">
                                    <label className="block">
                                        Título Twitter:
                                        <input
                                            type="text"
                                            {...register("twitterTitle")}
                                            className="w-full p-2 border rounded-md text-black"
                                        />
                                    </label>

                                    <label className="block">
                                        Descrição Twitter:
                                        <textarea
                                            {...register("twitterDescription")}
                                            className="w-full p-2 border rounded-md h-24 text-black"
                                        />
                                    </label>

                                    <label className="block">
                                        Criador Twitter:
                                        <input
                                            type="text"
                                            {...register("twitterCreator")}
                                            className="w-full p-2 border rounded-md text-black"
                                            placeholder="@usuário"
                                        />
                                    </label>

                                    <div className="block">
                                        <label className="mb-2 block">Imagens Twitter:</label>
                                        <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4">
                                            {existingTwitterImages.map((image, index) => (
                                                <div key={index} className="relative group w-full aspect-square">
                                                    <div className="relative w-full h-full rounded-lg border-2 overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                                                        <Image
                                                            src={`${API_URL}/files/seo/${image}`}
                                                            alt={`Imagem Twitter ${index}`}
                                                            fill
                                                            className="object-cover"
                                                            sizes="(max-width: 768px) 100vw, 150px"
                                                        />
                                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                            {/* Botão para substituir imagem */}
                                                            <label className="cursor-pointer p-2 bg-white/80 rounded-full hover:bg-white transition-colors">
                                                                <FiUpload className="text-xl text-gray-800" />
                                                                <input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    onChange={async (e) => {
                                                                        if (e.target.files?.[0]) {
                                                                            try {
                                                                                const apiClient = setupAPIClientEcommerce();
                                                                                const formData = new FormData();

                                                                                formData.append('sEOSettings_id', params.seo_id);
                                                                                formData.append('twitterImageIndexes', JSON.stringify([index]));
                                                                                formData.append('twitterImages', e.target.files[0]);

                                                                                const response = await apiClient.put('/seo/update_seo', formData, {
                                                                                    headers: { 'Content-Type': 'multipart/form-data' }
                                                                                });

                                                                                // Atualização correta com o caminho do servidor
                                                                                const updatedImages = response.data.twitterImages; // Supondo que o backend retorne as imagens atualizadas
                                                                                setExistingTwitterImages(updatedImages);

                                                                                toast.success("Imagem OG atualizada!");
                                                                            } catch (error) {
                                                                                console.log(error);
                                                                                toast.error("Erro ao atualizar imagem OG");
                                                                            }
                                                                        }
                                                                    }}
                                                                    className="hidden"
                                                                />
                                                            </label>

                                                            {/* Botão para deletar imagem */}
                                                            <button
                                                                onClick={async () => await handleDeleteTwitterImage(index)}
                                                                className="p-2 bg-white/80 rounded-full hover:bg-white transition-colors"
                                                            >
                                                                <FiTrash className="text-xl text-red-600" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <span className="absolute top-1 left-1 bg-black/70 text-[#FFFFFF] text-xs px-2 py-1 rounded-md">
                                                        Imagem {index + 1}
                                                    </span>
                                                </div>
                                            ))}
                                            {/* Botão para adicionar novas imagens */}
                                            <label className="relative aspect-square w-full flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                                                <FiUpload className="text-2xl text-gray-500" />
                                                <span className="text-sm text-gray-600">Adicionar Imagens</span>
                                                <input
                                                    type="file"
                                                    multiple
                                                    accept="image/*"
                                                    onChange={async (e) => {
                                                        if (e.target.files?.length) {
                                                            try {
                                                                const apiClient = setupAPIClientEcommerce();
                                                                const formData = new FormData();
                                                                formData.append('sEOSettings_id', params.seo_id);
                                                                Array.from(e.target.files).forEach(file => formData.append('images', file));

                                                                const response = await apiClient.post('/seo/twitter-images', formData, {
                                                                    headers: { 'Content-Type': 'multipart/form-data' }
                                                                });

                                                                setExistingTwitterImages(prev => [...prev, ...response.data.newImages]);
                                                                toast.success("Imagens adicionadas com sucesso!");
                                                            } catch (error) {
                                                                toast.error("Erro ao adicionar imagens");
                                                            }
                                                        }
                                                    }}
                                                    className="hidden"
                                                />
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`px-6 py-3 rounded-md text-[#FFFFFF] ${isSubmitting ? "bg-gray-500" : "bg-red-600 hover:bg-red-700"
                            }`}
                    >
                        {isSubmitting ? "Atualizando..." : "Atualizar Configurações"}
                    </button>
                </form>
            </Section>
        </SidebarAndHeader>
    );
}