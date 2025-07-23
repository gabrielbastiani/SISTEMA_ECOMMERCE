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

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const TOKEN_TINY = process.env.NEXT_PUBLIC_TINYMCE_API_KEY;

const BRAZILIAN_STATES = [
    { value: "AC", label: "Acre" },
    { value: "AL", label: "Alagoas" },
    { value: "AP", label: "Amapá" },
    { value: "AM", label: "Amazonas" },
    { value: "BA", label: "Bahia" },
    { value: "CE", label: "Ceará" },
    { value: "DF", label: "Distrito Federal" },
    { value: "ES", label: "Espírito Santo" },
    { value: "GO", label: "Goiás" },
    { value: "MA", label: "Maranhão" },
    { value: "MT", label: "Mato Grosso" },
    { value: "MS", label: "Mato Grosso do Sul" },
    { value: "MG", label: "Minas Gerais" },
    { value: "PA", label: "Pará" },
    { value: "PB", label: "Paraíba" },
    { value: "PR", label: "Paraná" },
    { value: "PE", label: "Pernambuco" },
    { value: "PI", label: "Piauí" },
    { value: "RJ", label: "Rio de Janeiro" },
    { value: "RN", label: "Rio Grande do Norte" },
    { value: "RS", label: "Rio Grande do Sul" },
    { value: "RO", label: "Rondônia" },
    { value: "RR", label: "Roraima" },
    { value: "SC", label: "Santa Catarina" },
    { value: "SP", label: "São Paulo" },
    { value: "SE", label: "Sergipe" },
    { value: "TO", label: "Tocantins" }
];

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
    whatsapp: z
        .string()
        .regex(
            /^\(?\d{2}\)?[\s-]?\d{4,5}[\s-]?\d{4}$/,
            "Insira um número de whatsapp válido. Ex: (11) 91234-5678 ou 11912345678"
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
    country: z.string().optional(),
    cnpj: z.string().optional(),
    cpf: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function Configuration_ecommerce() {

    const editorRef = useRef<any>(null);
    const [id, setId] = useState<string>();
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [logo, setLogo] = useState<File | null>(null);
    const [faviconUrl, setFaviconUrl] = useState<string | null>(null);
    const [favicon, setFavicon] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [phoneValue, setPhoneValue] = useState("");
    const [whatsappValue, setWhatsappValue] = useState("");
    const [isMounted, setIsMounted] = useState(false);
    const [privacyPoliciesContent, setPrivacyPoliciesContent] = useState("");
    const [exchangesAndReturnsContent, setExchangesAndReturnsContent] = useState("");
    const [howToBuyContent, setHowToBuyContent] = useState("");
    const [shippingDeliveryTimeContent, setShippingDeliveryTimeContent] = useState("");
    const [faqContent, setFaqContent] = useState("");
    const [paymentMethodsContent, setPaymentMethodsContent] = useState("");
    const [technicalAssistanceContent, setTechnicalAssistanceContent] = useState("");
    const [aboutStoreContent, setAboutStoreContent] = useState("");
    const [activeTab, setActiveTab] = useState('about');
    const [zipCodeValue, setZipCodeValue] = useState("");

    const editorTabs = [
        {
            id: 'about',
            title: 'Sobre a Loja',
            content: aboutStoreContent,
            setContent: setAboutStoreContent
        },
        {
            id: 'policies',
            title: 'Políticas de Privacidade',
            content: privacyPoliciesContent,
            setContent: setPrivacyPoliciesContent
        },
        {
            id: 'payments',
            title: 'Métodos de Pagamento',
            content: paymentMethodsContent,
            setContent: setPaymentMethodsContent
        },
        {
            id: 'returns',
            title: 'Trocas e Devoluções',
            content: exchangesAndReturnsContent,
            setContent: setExchangesAndReturnsContent
        },
        {
            id: 'shipping',
            title: 'Prazos de Entrega',
            content: shippingDeliveryTimeContent,
            setContent: setShippingDeliveryTimeContent
        },
        {
            id: 'howtobuy',
            title: 'Como Comprar',
            content: howToBuyContent,
            setContent: setHowToBuyContent
        },
        {
            id: 'faq',
            title: 'Perguntas Frequentes',
            content: faqContent,
            setContent: setFaqContent
        },
        {
            id: 'assistance',
            title: 'Assistência Técnica',
            content: technicalAssistanceContent,
            setContent: setTechnicalAssistanceContent
        }
    ];

    const formatZipCode = (value: string) => {
        const numbers = value.replace(/\D/g, '');
        const match = numbers.match(/^(\d{0,5})(\d{0,3})$/);

        if (!match) return '';

        return [
            match[1],
            match[2] ? `-${match[2]}` : ''
        ].join('');
    };

    useEffect(() => {
        setZipCodeValue(prev => {
            const newValue = formatZipCode(prev);
            if (newValue !== prev) return newValue;
            return prev;
        });
    }, [zipCodeValue]);

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

        const formatWhatsApp = (value: string) => {
            const numbers = value.replace(/\D/g, '');
            const match = numbers.match(/^(\d{0,2})(\d{0,5})(\d{0,4})$/);

            if (!match) return '';

            return [
                match[1] ? `(${match[1]}` : '',
                match[2] ? `) ${match[2]}` : '',
                match[3] ? `-${match[3]}` : ''
            ].join('');
        };

        setWhatsappValue(prev => {
            const newValue = formatWhatsApp(prev);
            if (newValue !== prev) return newValue;
            return prev;
        });
    }, [phoneValue, whatsappValue]);

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
            if (data.whatsapp) {
                setWhatsappValue(data.whatsapp);
            }
            setId(data?.id || "");

            setLogoUrl(data.logo || null);
            setFaviconUrl(data.favicon || null);

            reset({
                name: data.name,
                email: data.email,
                phone: data.phone,
                whatsapp: data.whatsapp,
                street: data.street,
                city: data.city,
                state: data.state,
                zipCode: data.zipCode,
                number: data.number,
                neighborhood: data.neighborhood,
                country: data.country,
                cnpj: data.cnpj,
                cpf: data.cpf
            });

            setPrivacyPoliciesContent(data.privacy_policies || "");
            setExchangesAndReturnsContent(data.exchanges_and_returns || "");
            setHowToBuyContent(data.how_to_buy || "");
            setShippingDeliveryTimeContent(data.shipping_delivery_time || "");
            setFaqContent(data.faq || "");
            setPaymentMethodsContent(data.payment_methods || "");
            setTechnicalAssistanceContent(data.technical_assistance || "");
            setAboutStoreContent(data.about_store);

            setZipCodeValue(data.zipCode ? formatZipCode(data.zipCode) : "");

        } catch (error) {
            toast.error("Erro ao carregar os dados do post.");
        }
    }

    useEffect(() => {
        fetchData();
    }, [reset]);

    const onSubmit = async (data: FormData) => {
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append("ecommerceData_id", id || "");
            formData.append("cnpj", data.cnpj || "");
            formData.append("cpf", data.cpf || "");
            formData.append("name", data.name || "");
            formData.append("phone", phoneValue.replace(/\D/g, '') || "");
            formData.append("whatsapp", whatsappValue.replace(/\D/g, '') || "");
            formData.append("email", data.email || "");
            formData.append("street", data.street || "");
            formData.append("city", data.city || "");
            formData.append("state", data.state || "");
            formData.append("zipCode", data.zipCode || "");
            formData.append("number", data.number || "");
            formData.append("neighborhood", data.neighborhood || "");
            formData.append("country", data.country || "");
            formData.append("about_store", aboutStoreContent || "");
            formData.append("technical_assistance", technicalAssistanceContent || "");
            formData.append("payment_methods", paymentMethodsContent || "");
            formData.append("privacy_policies", privacyPoliciesContent || "");
            formData.append("faq", faqContent || "");
            formData.append("shipping_delivery_time", shippingDeliveryTimeContent || "");
            formData.append("how_to_buy", howToBuyContent || "");
            formData.append("exchanges_and_returns", exchangesAndReturnsContent || "");

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

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                    {/* Seção de Uploads */}
                    <div className="bg-background text-foreground transition-colors duration-300 p-6 rounded-lg shadow-sm border border-gray-200">
                        <h2 className="text-xl font-semibold mb-4">Logomarca e Favicon</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium mb-2">Logomarca</label>
                                <label className="relative w-full h-64 rounded-lg cursor-pointer flex justify-center overflow-hidden border-2 border-dashed border-gray-300 hover:border-orange-500 bg-background text-foreground transition-colors duration-300">
                                    <input type="file" accept="image/png, image/jpeg" onChange={handleFile} className="hidden" />
                                    {logoUrl ? (
                                        <Image
                                            src={logo ? logoUrl : `${API_URL}/files/${logoUrl}`}
                                            alt="Preview da logomarca"
                                            width={450}
                                            height={300}
                                            className="w-full h-full object-contain p-4"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center w-full h-full text-gray-400">
                                            <FiUpload size={40} className="mb-2" />
                                            <span className="text-center">Clique para enviar a logomarca<br />(PNG ou JPG)</span>
                                        </div>
                                    )}
                                </label>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Favicon</label>
                                <label className="relative w-full h-64 rounded-lg cursor-pointer flex justify-center overflow-hidden border-2 border-dashed border-gray-300 hover:border-orange-500 bg-background text-foreground transition-colors duration-300">
                                    <input type="file" accept=".ico, image/x-icon, image/vnd.microsoft.icon" onChange={handleFileFavicon} className="hidden" />
                                    {faviconUrl ? (
                                        <Image
                                            src={favicon ? faviconUrl : `${API_URL}/files/${faviconUrl}`}
                                            alt="Preview do favicon"
                                            width={300}
                                            height={200}
                                            className="w-full h-full object-contain p-4"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center w-full h-full text-gray-400">
                                            <FiUpload size={40} className="mb-2" />
                                            <span className="text-center">Clique para enviar o favicon<br />(Formato ICO)</span>
                                        </div>
                                    )}
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Seção de Dados Básicos */}
                    <div className="p-6 rounded-lg shadow-sm border border-gray-200 bg-background text-foreground transition-colors duration-300">
                        <h2 className="text-xl font-semibold mb-4">Dados da Loja</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium">Nome da Loja *</label>
                                <input
                                    type="text"
                                    placeholder="Nome da sua loja"
                                    {...register("name")}
                                    className="w-full border-2 rounded-md px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition text-black"
                                />
                                {errors.name && <span className="text-red-500 text-sm">{errors.name.message}</span>}
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium">CNPJ *</label>
                                <input
                                    type="text"
                                    placeholder="CNPJ"
                                    {...register("cnpj")}
                                    className="w-full border-2 rounded-md px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition text-black"
                                />
                                {errors.cnpj && <span className="text-red-500 text-sm">{errors.cnpj.message}</span>}
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium">CPF *</label>
                                <input
                                    type="text"
                                    placeholder="CPF"
                                    {...register("cpf")}
                                    className="w-full border-2 rounded-md px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition text-black"
                                />
                                {errors.cpf && <span className="text-red-500 text-sm">{errors.cpf.message}</span>}
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium">E-mail *</label>
                                <input
                                    type="email"
                                    placeholder="contato@loja.com.br"
                                    {...register("email")}
                                    className="text-black w-full border-2 rounded-md px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none transition"
                                />
                                {errors.email && <span className="text-red-500 text-sm">{errors.email.message}</span>}
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium">Telefone</label>
                                <input
                                    type="tel"
                                    placeholder="(00) 00000-0000"
                                    value={phoneValue}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setPhoneValue(value);
                                        setValue("phone", value.replace(/\D/g, ''));
                                    }}
                                    className="text-black w-full border-2 rounded-md px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none transition"
                                    maxLength={15}
                                />
                                {errors.phone && <span className="text-red-500 text-sm">{errors.phone.message}</span>}
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium">WhatsApp</label>
                                <input
                                    type="tel"
                                    placeholder="(00) 00000-0000"
                                    value={whatsappValue}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setWhatsappValue(value);
                                        setValue("whatsapp", value.replace(/\D/g, '')); // Adicione esta linha
                                    }}
                                    className="text-black w-full border-2 rounded-md px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none transition"
                                    maxLength={15}
                                />
                                {errors.whatsapp && <span className="text-red-500 text-sm">{errors.whatsapp.message}</span>}
                            </div>
                        </div>
                    </div>

                    {/* Seção de Endereço */}
                    <div className="p-6 rounded-lg shadow-sm border border-gray-200 bg-background text-foreground transition-colors duration-300 ">
                        <h2 className="text-xl font-semibold mb-4">Endereço</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium">CEP</label>
                                <input
                                    type="text"
                                    placeholder="00000-000"
                                    value={zipCodeValue}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setZipCodeValue(value);
                                        setValue("zipCode", value.replace(/\D/g, ''));
                                    }}
                                    className="text-black w-full border-2 rounded-md px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none transition"
                                    maxLength={9}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium">Estado</label>
                                <select
                                    {...register("state")}
                                    className="text-black w-full border-2 rounded-md px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none transition bg-white"
                                >
                                    <option value="">Selecione um estado</option>
                                    {BRAZILIAN_STATES.map((state) => (
                                        <option key={state.value} value={state.value}>
                                            {state.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium">Cidade</label>
                                <input
                                    type="text"
                                    placeholder="Cidade"
                                    {...register("city")}
                                    className="text-black w-full border-2 rounded-md px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none transition"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium">Bairro</label>
                                <input
                                    type="text"
                                    placeholder="Bairro"
                                    {...register("neighborhood")}
                                    className="text-black w-full border-2 rounded-md px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none transition"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium">Logradouro</label>
                                <input
                                    type="text"
                                    placeholder="Rua/Avenida"
                                    {...register("street")}
                                    className="text-black w-full border-2 rounded-md px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none transition"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium">Número</label>
                                <input
                                    type="text"
                                    placeholder="Número"
                                    {...register("number")}
                                    className="text-black w-full border-2 rounded-md px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none transition"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-6 rounded-lg shadow-sm border border-gray-200 bg-background text-foreground transition-colors duration-300">
                        <h2 className="text-xl font-semibold mb-4">Conteúdo da Loja</h2>

                        {/* Navegação por abas */}
                        <div className="border-b border-gray-200">
                            <nav className="flex space-x-4 overflow-x-auto">
                                {editorTabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`px-4 py-2 text-sm font-medium transition-colors
                                        ${activeTab === tab.id
                                                ? 'border-b-2 border-orange-500 text-orange-600'
                                                : 'text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300'
                                            }`}
                                    >
                                        {tab.title}
                                    </button>
                                ))}
                            </nav>
                        </div>

                        {/* Conteúdo dos Editores */}
                        <div className="mt-4">
                            {editorTabs.map((tab) => (
                                <div
                                    key={tab.id}
                                    className={`${activeTab === tab.id ? 'block' : 'hidden'}`}
                                >
                                    {isMounted && (
                                        <Editor
                                            apiKey={TOKEN_TINY}
                                            value={tab.content}
                                            onEditorChange={(content) => tab.setContent(content)}
                                            onInit={(evt, editor) => {
                                                editorRef.current = editor;
                                            }}
                                            init={{
                                                height: 600,
                                                menubar: true,
                                                plugins: "advlist autolink lists link image charmap preview anchor searchreplace visualblocks code fullscreen insertdatetime media table code help wordcount",
                                                toolbar: "undo redo | formatselect | bold italic backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | help",
                                                content_style: "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }"
                                            }}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-52 py-3 text-white font-medium rounded-md transition-colors ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-orange-500 hover:bg-orange-600"
                            }`}
                    >
                        {loading ? "Salvando..." : "Salvar Configurações"}
                    </button>
                </form>

                <hr className="mt-7 mb-7" />

                <Config_media_social />

            </Section>
        </SidebarAndHeader>
    )
}