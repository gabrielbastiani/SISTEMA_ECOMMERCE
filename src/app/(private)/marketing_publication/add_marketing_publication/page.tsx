"use client";

import { Section } from "@/app/components/section";
import { SidebarAndHeader } from "@/app/components/sidebarAndHeader";
import { TitlePage } from "@/app/components/section/titlePage"; 
import { setupAPIClientEcommerce } from "@/app/services/apiEcommerce"; 
import { useState, ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { FiUpload } from "react-icons/fi";
import { toast } from "react-toastify";
import Image from "next/image";

interface FormData {
    title: string;
    image_url?: string;
    description?: string;
    status?: string;
    publish_at_start?: string;
    publish_at_end?: string;
    redirect_url?: string;
    position?: string;
    conditions?: string;
    text_publication?: string;
    local: string;
    popup_time?: string;
    interval_banner?: string;
    text_button?: string;
}

export default function AddMarketingPublication() {

    const [loading, setLoading] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isPopup, setIsPopup] = useState(false);

    const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({ mode: "onChange" });

    const validateForm = (data: FormData) => {
        const errorMessages: { [key: string]: string } = {};

        if (!data.title || data.title.trim() === "") {
            errorMessages.title = "O título é obrigatório.";
        }

        if (!data.local && ![
            "Pagina_inicial",
            "Pagina_produto",
            "Pagina_produtos_categoria",
            "Pagina_categoria",
            "Pagina_contato"
        ].includes(data.local)) {
            errorMessages.local = "Selecione um local válido.";
        }

        if (data.status && !["Disponivel", "Indisponivel", "Programado"].includes(data.status)) {
            errorMessages.status = "Selecione um status válido.";
        }

        if (data.popup_time && !['3000', '5000', '7000', '10000', '13000', '16000', '19000', '22000'].includes(data.popup_time)) {
            errorMessages.popup_time = "Selecione um tempo válido.";
        }

        if (data.interval_banner && !['3000', '5000', '7000', '10000', '13000', '16000', '19000', '22000'].includes(data.interval_banner)) {
            errorMessages.interval_banner = "Selecione um tempo válido.";
        }

        if (data.position && !["SLIDER", "SIDEBAR", "POPUP", "MOSAICO"].includes(data.position)) {
            errorMessages.position = "Selecione uma posição válida.";
        }

        if (isPopup && data.conditions && !["scroll", "setTimeout", "beforeunload"].includes(data.conditions)) {
            errorMessages.conditions = "Selecione uma condição válida.";
        }

        if (
            (data.publish_at_start && !data.publish_at_end) ||
            (!data.publish_at_start && data.publish_at_end)
        ) {
            errorMessages.publish_at = "Preencha ambas as datas ou deixe as duas em branco.";
        }

        return errorMessages;
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        if (file.type === "image/jpeg" || file.type === "image/png") {
            setImageFile(file);
            setAvatarUrl(URL.createObjectURL(file));
        } else {
            toast.error("Formato de imagem inválido. Escolha JPEG ou PNG.");
            setImageFile(null);
            setAvatarUrl(null);
        }
    };

    const onSubmit = async (data: FormData) => {
        const validationErrors = validateForm(data);
        if (Object.keys(validationErrors).length > 0) {
            Object.values(validationErrors).forEach(message => toast.error(message));
            return;
        }

        setLoading(true);

        try {
            const apiClient = setupAPIClientEcommerce();
            const formData = new FormData();

            formData.append("title", data.title);
            formData.append("text_button", data.text_button || "");
            formData.append("description", data.description || "");
            formData.append("status", data.status || "");
            formData.append("publish_at_start", data.publish_at_start ? new Date(data.publish_at_start).toISOString() : "");
            formData.append("publish_at_end", data.publish_at_end ? new Date(data.publish_at_end).toISOString() : "");
            formData.append("redirect_url", data.redirect_url || "");
            formData.append("position", isPopup ? "POPUP" : data.position || "");
            formData.append("conditions", data.conditions || "");
            formData.append("text_publication", data.text_publication || "");
            formData.append("local", data.local);
            formData.append("popup_time", data.popup_time ? String(Number(data.popup_time)) : "0");

            if (imageFile) {
                formData.append("file", imageFile);
            }

            // Cadastra o marketing publication
            await apiClient.post("/marketing_publication/create", formData);

            toast.success("Publicidade cadastrada com sucesso!");
            reset();
            setAvatarUrl(null);
            setImageFile(null);
            setIsPopup(false);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao cadastrar a publicidade.");
        } finally {
            setLoading(false);
        }
    };


    return (
        <SidebarAndHeader>
            <Section>
                <TitlePage title="CADASTRAR PUBLICIDADE" />
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <input
                        type="text"
                        placeholder="Digite um título para a publicidade..."
                        {...register("title")}
                        className="w-full border-2 rounded-md px-3 py-2 text-black"
                    />
                    {errors.title && <p className="text-red-500">{errors.title.message}</p>}

                    <select
                        {...register("local")}
                        className="border-2 rounded-md px-3 py-2 text-black"
                    >
                        <option value="">Selecione o local</option>
                        <option value="Pagina_inicial">Página inicial</option>
                        <option value="Pagina_produto">Página do produto</option>
                        <option value="Pagina_produtos_categoria">Página de produtos na categoria</option>
                        <option value="Pagina_categoria">Página de categoria</option>
                        <option value="Pagina_contato">Página de contato</option>
                    </select>

                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            checked={isPopup}
                            onChange={() => setIsPopup(!isPopup)}
                            className="mr-2"
                        />
                        A publicidade será exibida em um popup?
                    </label>

                    {/* Input para Imagem */}
                    <label className="relative w-full h-[450px] rounded-lg cursor-pointer flex justify-center bg-gray-200 overflow-hidden">
                        <input type="file" accept="image/png, image/jpeg" onChange={handleFileChange} className="hidden" />
                        {avatarUrl ? (
                            <Image src={avatarUrl} alt="Preview da imagem" width={200} height={150} className="object-contain w-full h-full" />
                        ) : (
                            <div className="flex items-center justify-center w-full h-full bg-gray-300">
                                <FiUpload size={30} color="#ff6700" />
                            </div>
                        )}
                    </label>

                    <textarea
                        placeholder="Digite uma descrição..."
                        {...register("description")}
                        className="w-full border-2 rounded-md px-3 py-2 text-black resize-none h-24"
                    />

                    <textarea
                        placeholder="Digite uma chamada para ação..."
                        {...register("text_publication")}
                        className="w-full border-2 rounded-md px-3 py-2 text-black resize-none h-24"
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <input
                            type="text"
                            placeholder="Link da publicação..."
                            {...register("redirect_url")}
                            className="w-full border-2 rounded-md px-3 py-2 text-black"
                        />

                        <select
                            {...register("status")}
                            className="border-2 rounded-md px-3 py-2 text-black"
                        >
                            <option value="">Selecione o status</option>
                            <option value="Disponivel">Disponível</option>
                            <option value="Indisponivel">Indisponível</option>
                            <option value="Programado">Programado</option>
                        </select>
                    </div>

                    {isPopup ? (
                        <div className="grid grid-cols-2 gap-4">
                            <select
                                {...register("conditions")}
                                className="border-2 rounded-md px-3 py-2 text-black"
                            >
                                <option value="">Selecione uma condição</option>
                                <option value="scroll">Ao rolar a página</option>
                                <option value="setTimeout">Tempo na página</option>
                                <option value="beforeunload">Ao sair da página</option>
                            </select>

                            <select
                                {...register("popup_time")}
                                className="border-2 rounded-md px-3 py-2 text-black"
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
                        </div>
                    ) : (
                        null
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <input
                            type="text"
                            placeholder="Texto para o botão..."
                            {...register("text_button")}
                            className="w-full border-2 rounded-md px-3 py-2 text-black"
                        />

                        <select
                            {...register("position")}
                            className="border-2 rounded-md px-3 py-2 text-black"
                        >
                            <option value="">Selecione uma posição</option>
                            <option value="SLIDER">Slider banner</option>
                            <option value="SIDEBAR">No sidebar</option>
                            <option value="MOSAICO">Mosaico</option>
                            {isPopup ? <option value="POPUP">Popup</option> : null}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <label>
                            Data para o inicio da publicidade: &nbsp;&nbsp;
                            <input
                                type="datetime-local"
                                {...register("publish_at_start")}
                                className="border-2 rounded-md px-3 py-2 text-black"
                            />
                        </label>

                        <label>
                            Data do término da publicidade: &nbsp;&nbsp;
                            <input
                                type="datetime-local"
                                {...register("publish_at_end")}
                                className="border-2 rounded-md px-3 py-2 text-black"
                            />
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`px-6 py-3 rounded bg-green-500 text-[#FFFFFF] ${loading ? "opacity-50" : "hover:bg-green-400"
                            }`}
                    >
                        {loading ? "Cadastrando..." : "Cadastrar publicidade"}
                    </button>
                </form>
            </Section>
        </SidebarAndHeader>
    );
}