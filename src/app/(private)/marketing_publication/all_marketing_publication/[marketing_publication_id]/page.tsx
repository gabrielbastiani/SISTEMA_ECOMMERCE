"use client";

export const dynamic = 'force-dynamic';
import { useParams } from "next/navigation";
import { Section } from "@/app/components/section";
import { SidebarAndHeader } from "@/app/components/sidebarAndHeader";
import { setupAPIClientEcommerce } from "@/app/services/apiEcommerce"; 
import { ChangeEvent, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FiUpload } from "react-icons/fi";
import Image from "next/image";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface FormData {
    title: string;
    image_url?: string;
    redirect_url?: string;
    description?: string;
    publish_at_start?: string;
    publish_at_end?: string;
    text_publication?: string;
    local?: string;
    popup_time?: string;
    text_button?: string;
    status?: "Disponivel" | "Indisponivel";
    position?: "SLIDER" | "SIDEBAR" | "POPUP" | "MOSAICO";
    conditions?: "scroll" | "setTimeout" | "beforeunload";
}

export default function UpdateMarketingPublication() {

    const params = useParams<{ marketing_publication_id: string }>();

    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        title: "",
        status: "Disponivel",
        position: "SLIDER",
        local: "",
        conditions: "scroll",
        description: "",
        text_publication: "",
        redirect_url: "",
        text_button: "",
        popup_time: "",
        publish_at_start: "",
        publish_at_end: ""
    });

    useEffect(() => {
        async function fetchMarketingData() {
            try {
                const apiClient = setupAPIClientEcommerce();
                const response = await apiClient.get(`/marketing_publication/all_publications?marketing_publication_id=${params.marketing_publication_id}`);

                const data = response.data.unique_marketing_content;
                setAvatarUrl(data.image_url || null);

                setFormData({
                    title: data.title || "",
                    redirect_url: data.redirect_url || "",
                    status: data.status,
                    position: data.position,
                    text_button: data.text_button,
                    local: data.local,
                    conditions: data.conditions,
                    popup_time: data.popup_time,
                    description: data.description || "",
                    text_publication: data.text_publication || "",
                    publish_at_start: data.publish_at_start
                        ? new Date(data.publish_at_start).toISOString().slice(0, 16)
                        : "",
                    publish_at_end: data.publish_at_end
                        ? new Date(data.publish_at_end).toISOString().slice(0, 16)
                        : "",
                });
            } catch (error) {
                toast.error("Erro ao carregar os dados da publicidade.");
            }
        }

        fetchMarketingData();
    }, [params.marketing_publication_id]);

    function handleInputChange(
        e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    }

    function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
        if (e.target.files) {
            const file = e.target.files[0];
            if (file && (file.type === "image/jpeg" || file.type === "image/png")) {
                setImageFile(file);
                setAvatarUrl(URL.createObjectURL(file));
            } else {
                toast.error("Formato de imagem inválido. Use JPEG ou PNG.");
            }
        }
    }

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const formDataToSend = new FormData();
            formDataToSend.append(
                "marketingPublication_id",
                params.marketing_publication_id
            );

            Object.entries(formData).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    formDataToSend.append(key, value as string);
                }
            });

            if (imageFile) {
                formDataToSend.append("file", imageFile);
            }

            const apiClient = setupAPIClientEcommerce();
            await apiClient.put("/marketing_publication/update", formDataToSend);

            toast.success("Publicidade atualizada com sucesso!");
        } catch (error) {
            console.log(error)
            toast.error("Erro ao atualizar a publicidade.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SidebarAndHeader>
            <Section>
                <form onSubmit={onSubmit} className="space-y-4">
                    <label>
                        Título:
                        <input
                            type="text"
                            name="title"
                            value={formData.title || ""}
                            onChange={handleInputChange}
                            placeholder="Digite o título"
                            className="w-full border-2 rounded-md px-3 py-2 text-black"
                        />
                    </label>

                    <label>
                        Página da publicidade:
                        <select
                            name="local"
                            value={formData.local || ""}
                            onChange={handleInputChange}
                            className="w-full border-2 rounded-md px-3 py-2 text-black"
                        >
                            <option value="">Selecione o local</option>
                            <option value="Pagina_inicial">Página inicial</option>
                            <option value="Pagina_artigo">Página do artigo</option>
                            <option value="Pagina_todos_artigos">Página de todos artigos</option>
                            <option value="Pagina_categoria">Página de categoria</option>
                            <option value="Pagina_todas_categorias">Página de todas as categorias</option>
                            <option value="Pagina_sobre">Página sobre</option>
                            <option value="Pagina_contato">Página de contato</option>
                            <option value="Pagina_politicas_de_privacidade">Página politicas de privacidade</option>
                        </select>
                    </label>

                    <label className="relative w-full h-64 rounded-lg cursor-pointer flex justify-center bg-gray-200 overflow-hidden">
                        <input
                            type="file"
                            accept="image/png, image/jpeg"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        {avatarUrl ? (
                            <Image
                                src={imageFile ? avatarUrl : `${API_URL}/files/${avatarUrl}`}
                                width={450}
                                height={300}
                                alt="Preview da imagem"
                                className="object-fill"
                            />
                        ) : (
                            <div className="flex items-center justify-center w-full h-full bg-gray-300">
                                <FiUpload size={30} color="#ff6700" />
                            </div>
                        )}
                    </label>

                    <label>
                        Descrição:
                        <textarea
                            name="description"
                            value={formData.description || ""}
                            onChange={handleInputChange}
                            placeholder="Digite a descrição"
                            className="w-full border-2 rounded-md px-3 py-2 text-black"
                        />
                    </label>

                    <label>
                        Texto da Publicação:
                        <textarea
                            name="text_publication"
                            value={formData.text_publication || ""}
                            onChange={handleInputChange}
                            placeholder="Digite o texto da publicação"
                            className="w-full border-2 rounded-md px-3 py-2 text-black"
                        />
                    </label>

                    <div className="grid grid-cols-2 gap-4">
                        <label>
                            Link de Redirecionamento:
                            <input
                                type="text"
                                name="redirect_url"
                                value={formData.redirect_url || ""}
                                onChange={handleInputChange}
                                placeholder="Insira o link"
                                className="w-full border-2 rounded-md px-3 py-2 text-black"
                            />
                        </label>

                        <label>
                            Texto do botão:
                            <input
                                type="text"
                                name="text_button"
                                value={formData.text_button || ""}
                                onChange={handleInputChange}
                                placeholder="Digite o texto do botão"
                                className="w-full border-2 rounded-md px-3 py-2 text-black"
                            />
                        </label>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <label>
                            Status:
                            <select
                                name="status"
                                value={formData.status || ""}
                                onChange={handleInputChange}
                                className="w-full border-2 rounded-md px-3 py-2 text-black"
                            >
                                <option value="Disponivel">Disponível</option>
                                <option value="Indisponivel">Indisponível</option>
                                <option value="Programado">Programado</option>
                            </select>
                        </label>

                        <label>
                            Posição:
                            <select
                                name="position"
                                value={formData.position || ""}
                                onChange={handleInputChange}
                                className="w-full border-2 rounded-md px-3 py-2 text-black"
                            >
                                <option value="SLIDER">Slider</option>
                                <option value="SIDEBAR">Sidebar</option>
                                <option value="MOSAICO">Mosaico</option>
                                <option value="POPUP">Popup</option>
                            </select>
                        </label>
                    </div>

                    {formData.position === "POPUP" && (
                        <div className="grid grid-cols-2 gap-4">
                            <label>
                                Condições:
                                <select
                                    name="conditions"
                                    value={formData.conditions || ""}
                                    onChange={handleInputChange}
                                    className="w-full border-2 rounded-md px-3 py-2 text-black"
                                >
                                    <option value="">Selecione uma condição</option>
                                    <option value="scroll">Ao rolar a página</option>
                                    <option value="setTimeout">Tempo na página</option>
                                    <option value="beforeunload">Ao sair da página</option>
                                </select>
                            </label>

                            <label>
                                Tempo do popup para aparecer ou ao rolar a página:
                                <select
                                    name="popup_time"
                                    value={formData.popup_time || ""}
                                    onChange={handleInputChange}
                                    className="w-full border-2 rounded-md px-3 py-2 text-black"
                                >
                                    <option value="">Selecione o tempo do popup para aparecer ou ao rolar a página</option>
                                    <option value="3000">3 Segundos</option>
                                    <option value="5000">5 Segundos</option>
                                    <option value="7000">7 Segundos</option>
                                    <option value="10000">10 Segundos</option>
                                    <option value="13000">13 Segundos</option>
                                    <option value="16000">16 Segundos</option>
                                    <option value="19000">19 Segundos</option>
                                    <option value="22000">22 Segundos</option>
                                </select>
                            </label>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <label>
                            Publicação Início:
                            <input
                                type="datetime-local"
                                name="publish_at_start"
                                value={formData.publish_at_start || ""}
                                onChange={handleInputChange}
                                className="w-full border-2 rounded-md px-3 py-2 text-black"
                            />
                        </label>

                        <label>
                            Publicação Fim:
                            <input
                                type="datetime-local"
                                name="publish_at_end"
                                value={formData.publish_at_end || ""}
                                onChange={handleInputChange}
                                className="w-full border-2 rounded-md px-3 py-2 text-black"
                            />
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3 text-[#FFFFFF] ${loading ? "bg-gray-500" : "bg-green-600 hover:bg-green-700"
                            } rounded-md`}
                    >
                        {loading ? "Atualizando..." : "Atualizar Publicidade"}
                    </button>
                </form>
            </Section>
        </SidebarAndHeader>
    );
}