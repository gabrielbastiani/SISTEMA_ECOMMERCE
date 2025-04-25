"use client";

import { Section } from "@/app/components/section";
import { SidebarAndHeader } from "@/app/components/sidebarAndHeader";
import { TitlePage } from "@/app/components/section/titlePage";
import { setupAPIClientEcommerce } from "@/app/services/apiEcommerce";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { FiUpload } from "react-icons/fi";
import { toast } from "react-toastify";
import { z } from "zod";
import Config_media_social from "@/app/components/config_media_social";
import { Editor } from "@tinymce/tinymce-react";

const schema = z.object({
    name: z.string().nonempty("O nome é obrigatório"),
    logo: z.string().optional(),
    favicon: z.string().optional(),
    email: z.string().email("Insira um email válido").nonempty("O campo email é obrigatório"),
    phone: z
        .string()
        .regex(
            /^\(?\d{2}\)?[\s-]?\d{4,5}[\s-]?\d{4}$/,
            "Insira um número de telefone/celular válido. Ex: (11) 91234-5678 ou 11912345678"
        )
        .optional(),
    about_store: z.string().optional(),
    technical_assistance: z.string().optional(),
    payment_methods: z.string().optional(),
    privacy_policies: z.string().optional(),
    faq: z.string().optional(),
    shipping_delivery_time: z.string().optional(),
    how_to_buy: z.string().optional(),
    exchanges_and_returns: z.string().optional(),
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    number: z.string().optional(),
    neighborhood: z.string().optional(),
    country: z.string().optional()
});

type FormData = z.infer<typeof schema>;

export default function Configuration_ecommerce() {

    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    const TOKEN_TINY = process.env.NEXT_PUBLIC_TINYMCE_API_KEY;

    const editorRef = useRef<any>(null);
    const [id, setId] = useState<string>();
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [logo, setLogo] = useState<File | null>(null);
    const [faviconUrl, setFaviconUrl] = useState<string | null>(null);
    const [favicon, setFavicon] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [phoneValue, setPhoneValue] = useState("");
    const [isMounted, setIsMounted] = useState(false);
    const [privacyPoliciesContent, setPrivacyPoliciesContent] = useState("");
    const [exchangesAndReturnsContent, setExchangesAndReturnsContent] = useState("");
    const [howToBuyContent, setHowToBuyContent] = useState("");
    const [shippingDeliveryTimeContent, setShippingDeliveryTimeContent] = useState("");
    const [faqContent, setFaqContent] = useState("");
    const [paymentMethodsContent, setPaymentMethodsContent] = useState("");
    const [technicalAssistanceContent, setTechnicalAssistanceContent] = useState("");
    const [aboutStoreContent, setAboutStoreContent] = useState("");

    useEffect(() => {
        const formatPhone = (value: string) => {
            const numbers = value.replace(/\D/g, '');
            const match = numbers.match(/^(\d{0,2})(\d{0,5})(\d{0,4})$/);

            if (!match) return '';

            return [
                match[1] ? `(${match[1]}` : '',
                match[2] ? `) ${match[2]}` : '',
                match[3] ? `-${match[3]}` : ''
            ].join('');
        };

        setPhoneValue(prev => {
            const newValue = formatPhone(prev);
            if (newValue !== prev) return newValue;
            return prev;
        });
    }, [phoneValue]);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        mode: "onChange",
    });

    function handleFile(e: ChangeEvent<HTMLInputElement>) {
        if (!e.target.files) return;

        const image = e.target.files[0];
        if (!image) return;

        if (image.type === "image/jpeg" || image.type === "image/png") {
            setLogo(image);
            setLogoUrl(URL.createObjectURL(image));
        } else {
            toast.error("Formato de imagem inválido. Selecione uma imagem JPEG ou PNG.");
        }
    }

    function handleFileFavicon(e: ChangeEvent<HTMLInputElement>) {
        if (!e.target.files) return;

        const image = e.target.files[0];
        if (!image) return;

        if (image.type === "image/x-icon" || image.type === "image/vnd.microsoft.icon") {
            setFavicon(image);
            setFaviconUrl(URL.createObjectURL(image));
        } else {
            toast.error("Formato de imagem inválido. Selecione uma imagem ICO.");
        }
    }

    async function fetchData() {
        try {
            const apiClient = setupAPIClientEcommerce();
            const { data } = await apiClient.get("/configuration_ecommerce/get_configs");
            if (data.phone) {
                setPhoneValue(data.phone);
            }
            setId(data?.id || "");

            setLogoUrl(data.logo || null);
            setFaviconUrl(data.favicon || null);

            reset({
                name: data.name,
                email: data.email,
                phone: data.phone,
                street: data.street,
                city: data.city,
                state: data.state,
                zipCode: data.zipCode,
                number: data.number,
                neighborhood: data.neighborhood,
                country: data.country
            });

            setPrivacyPoliciesContent(data.privacy_policies || "");
            setExchangesAndReturnsContent(data.exchanges_and_returns || "");
            setHowToBuyContent(data.how_to_buy || "");
            setShippingDeliveryTimeContent(data.shipping_delivery_time || "");
            setFaqContent(data.faq || "");
            setPaymentMethodsContent(data.payment_methods || "");
            setTechnicalAssistanceContent(data.technical_assistance || "");
            setAboutStoreContent(data.about_store);

        } catch (error) {
            toast.error("Erro ao carregar os dados do post.");
        }
    }

    useEffect(() => {
        fetchData();
    }, [reset]);

    const onSubmit = async (data: FormData) => {
        setLoading(true);

        /* const content = editorRef.current?.getContent();
        if (!content || content.trim() === "") {
            toast.error("O conteúdo do post não pode estar vazio!");
            setLoading(false);
            return;
        } */

        try {

            const formData = new FormData();
            formData.append("ecommerceData_id", id || "");
            formData.append("name", data.name || "");
            formData.append("phone", phoneValue.replace(/\D/g, '') || "");
            formData.append("email", data.email || "");
            formData.append("street", data.street || "");
            formData.append("city", data.city || "");
            formData.append("state", data.state || "");
            formData.append("zipCode", data.zipCode || "");
            formData.append("number", data.number || "");
            formData.append("neighborhood", data.neighborhood || "");
            formData.append("country", data.country || "");
            formData.append("about_store",);
            formData.append("technical_assistance",);
            formData.append("payment_methods",);
            formData.append("privacy_policies",);

            if (logo) {
                formData.append("logo", logo);
            }

            if (favicon) {
                formData.append("favicon", favicon);
            }

            const apiClient = setupAPIClientEcommerce();
            await apiClient.put("/configuration_ecommerce/update", formData);

            toast.success("Configuração atualizada com sucesso");
        } catch (error) {
            toast.error("Erro ao atualizar a configuração.");
        } finally {
            setLoading(false);
        }
    };

    async function delete_files() {
        try {
            const apiClient = setupAPIClientEcommerce();
            await apiClient.get("/configuration_ecommerce/delete_all_files");
            toast.success("Arquivos deletados com sucesso");
        } catch (error) {
            toast.error("Erro ao deletar os arquivos.");
            console.log(error);
        }
    }

    return (
        <SidebarAndHeader>
            <Section>
                <TitlePage title="CONFIGURAÇÕES DO BLOG" />

                <button
                    className="bg-red-500 text-[#FFFFFF] p-5 rounded-md mb-7"
                    onClick={delete_files}
                >
                    Deletar arquivos absoletos no sistema
                </button>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                    <p>Logomarca:</p>
                    <div className="grid grid-cols-2 gap-4">
                        <label className="relative w-[380px] h-[280px] rounded-lg cursor-pointer flex justify-center bg-gray-200 overflow-hidden">
                            <input type="file" accept="image/png, image/jpeg" onChange={handleFile} className="hidden" />
                            {logoUrl ? (
                                <Image
                                    src={logo ? logoUrl : `${API_URL}/files/${logoUrl}`}
                                    alt="Preview da imagem"
                                    width={450}
                                    height={300}
                                    className="w-full h-full"
                                />
                            ) : (
                                <div className="flex items-center justify-center w-full h-full bg-gray-300">
                                    <FiUpload size={30} color="#ff6700" />
                                </div>
                            )}
                        </label>
                    </div>

                    <p>Favicon:</p>
                    <div className="grid grid-cols-2 gap-4">
                        <label className="relative w-[300px] h-[200px] rounded-lg cursor-pointer flex justify-center bg-gray-200 overflow-hidden">
                            <input type="file" accept=".ico, image/x-icon, image/vnd.microsoft.icon" onChange={handleFileFavicon} className="hidden" />
                            {faviconUrl ? (
                                <Image
                                    src={favicon ? faviconUrl : `${API_URL}/files/${faviconUrl}`}
                                    alt="Preview da imagem"
                                    width={300}
                                    height={200}
                                    className="w-full h-full"
                                />
                            ) : (
                                <div className="flex items-center justify-center w-full h-full bg-gray-300">
                                    <FiUpload size={30} color="#ff6700" />
                                </div>
                            )}
                        </label>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <label>
                            Nome da loja:
                            <input
                                type="text"
                                placeholder="Digite um título..."
                                {...register("name")}
                                className="w-full border-2 rounded-md px-3 py-2 text-black"
                            />
                        </label>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <label>
                            Endereço:
                            <input
                                type="text"
                                placeholder="Digite o endereço..."
                                {...register("street")}
                                className="w-full border-2 rounded-md px-3 py-2 text-black"
                            />
                        </label>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <label>
                            Cidade:
                            <input
                                placeholder="Sobre o autor..."
                                {...register("city")}
                                className="w-full h-96 border-2 rounded-md px-3 py-2 text-black"
                            />
                        </label>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <label>
                            Email da loja:
                            <input
                                type="email"
                                placeholder="Email do blog..."
                                {...register("email")}
                                className="w-full border-2 rounded-md px-3 py-2 text-black"
                            />
                        </label>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <label>
                            CEP da loja:
                            <input
                                type="text"
                                placeholder="00000-000..."
                                {...register("zipCode")}
                                className="w-full border-2 rounded-md px-3 py-2 text-black"
                            />
                        </label>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <label>
                            Estado:
                            <input
                                type="text"
                                placeholder="RS"
                                {...register("state")}
                                className="w-full border-2 rounded-md px-3 py-2 text-black"
                            />
                        </label>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <label>
                            Numero:
                            <input
                                type="text"
                                placeholder="2000"
                                {...register("number")}
                                className="w-full border-2 rounded-md px-3 py-2 text-black"
                            />
                        </label>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <label>
                            Bairro:
                            <input
                                type="text"
                                placeholder="Digite o bairro"
                                {...register("neighborhood")}
                                className="w-full border-2 rounded-md px-3 py-2 text-black"
                            />
                        </label>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <label>
                            Pais:
                            <input
                                type="text"
                                placeholder="Digite o pais"
                                {...register("country")}
                                className="w-full border-2 rounded-md px-3 py-2 text-black"
                            />
                        </label>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <label>
                            Telefone:
                            <input
                                type="tel"
                                placeholder="(11) 91234-5678"
                                value={phoneValue}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setPhoneValue(value);
                                    setValue("phone", value.replace(/\D/g, ''));
                                }}
                                className={`w-full border-2 rounded-md px-3 py-2 text-black ${errors.phone ? "border-red-500" : ""
                                    }`}
                                maxLength={15}
                            />
                            {errors.phone && (
                                <span className="text-red-500">{errors.phone.message}</span>
                            )}
                        </label>
                    </div>

                    {isMounted && (
                        <label>Trocas e devoluções
                            <Editor
                                apiKey={TOKEN_TINY}
                                onInit={(evt, editor) => {
                                    editorRef.current = editor;
                                    editor.setContent(exchangesAndReturnsContent);
                                }}
                                initialValue={exchangesAndReturnsContent}
                                id="exchanges_and_returns"
                                init={{
                                    height: 800,
                                    menubar: true,
                                    toolbar: "undo redo | formatselect | bold italic | bold italic backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image emoticons | table codesample | preview help",
                                    external_plugins: {
                                        insertdatetime: "https://cdn.jsdelivr.net/npm/tinymce/plugins/insertdatetime/plugin.min.js",
                                        media: "https://cdn.jsdelivr.net/npm/tinymce/plugins/media/plugin.min.js",
                                        table: "https://cdn.jsdelivr.net/npm/tinymce/plugins/table/plugin.min.js",
                                        paste: "https://cdn.jsdelivr.net/npm/tinymce/plugins/paste/plugin.min.js",
                                        code: "https://cdn.jsdelivr.net/npm/tinymce/plugins/code/plugin.min.js",
                                        help: "https://cdn.jsdelivr.net/npm/tinymce/plugins/help/plugin.min.js",
                                        wordcount: "https://cdn.jsdelivr.net/npm/tinymce/plugins/wordcount/plugin.min.js",
                                    },
                                    codesample_languages: [
                                        { text: "HTML/XML", value: "markup" },
                                        { text: "JavaScript", value: "javascript" },
                                        { text: "CSS", value: "css" },
                                        { text: "PHP", value: "php" },
                                        { text: "Ruby", value: "ruby" },
                                        { text: "Python", value: "python" },
                                    ],
                                    content_style: "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }",
                                }}
                            />
                        </label>
                    )}

                    {isMounted && (
                        <label>Políticas de privacidade
                            <Editor
                                apiKey={TOKEN_TINY}
                                onInit={(evt, editor) => {
                                    editorRef.current = editor;
                                    editor.setContent(privacyPoliciesContent);
                                }}
                                initialValue={privacyPoliciesContent}
                                id="privacy_policies_editor"
                                init={{
                                    height: 800,
                                    menubar: true,
                                    toolbar: "undo redo | formatselect | bold italic | bold italic backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image emoticons | table codesample | preview help",
                                    external_plugins: {
                                        insertdatetime: "https://cdn.jsdelivr.net/npm/tinymce/plugins/insertdatetime/plugin.min.js",
                                        media: "https://cdn.jsdelivr.net/npm/tinymce/plugins/media/plugin.min.js",
                                        table: "https://cdn.jsdelivr.net/npm/tinymce/plugins/table/plugin.min.js",
                                        paste: "https://cdn.jsdelivr.net/npm/tinymce/plugins/paste/plugin.min.js",
                                        code: "https://cdn.jsdelivr.net/npm/tinymce/plugins/code/plugin.min.js",
                                        help: "https://cdn.jsdelivr.net/npm/tinymce/plugins/help/plugin.min.js",
                                        wordcount: "https://cdn.jsdelivr.net/npm/tinymce/plugins/wordcount/plugin.min.js",
                                    },
                                    codesample_languages: [
                                        { text: "HTML/XML", value: "markup" },
                                        { text: "JavaScript", value: "javascript" },
                                        { text: "CSS", value: "css" },
                                        { text: "PHP", value: "php" },
                                        { text: "Ruby", value: "ruby" },
                                        { text: "Python", value: "python" },
                                    ],
                                    content_style: "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }",
                                }}
                            />
                        </label>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-52 py-3 text-[#FFFFFF] ${loading ? "bg-gray-500" : "bg-red-600 hover:bg-orange-600"} rounded-md`}
                    >
                        {loading ? "Atualizando..." : "Atualizar Cadastro"}
                    </button>
                </form>

                <hr className="mt-7 mb-7" />

                <Config_media_social />

            </Section>
        </SidebarAndHeader>
    )
}