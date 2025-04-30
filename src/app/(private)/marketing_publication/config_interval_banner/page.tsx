"use client";

import { Section } from "@/app/components/section";
import { SidebarAndHeader } from "@/app/components/sidebarAndHeader";
import { TitlePage } from "@/app/components/section/titlePage"; 
import { setupAPIClientEcommerce } from "@/app/services/apiEcommerce"; 
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { FaTrashAlt } from "react-icons/fa";
import { toast } from "react-toastify";

interface FormData {
    local_site: string;
    interval_banner: string;
}

interface DataProps {
    id: string;
    local_site: string;
    label_local_site: string;
    interval_banner: string;
    label_interval_banner: string;
}

export default function Config_interval_banner() {

    const [data_interval, setData_interval] = useState<DataProps[]>([]);
    const [editing, setEditing] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({ mode: "onChange" });

    const validateForm = (data: FormData) => {
        const errorMessages: { [key: string]: string } = {};

        if (!data.local_site && ![
            "Pagina_inicial",
            "Pagina_produto",
            "Pagina_produtos_categoria",
            "Pagina_categoria",
            "Pagina_contato"
        ].includes(data.local_site)) {
            errorMessages.local_site = "Selecione um local válido.";
        }

        if (!data.interval_banner && !['3000', '5000', '7000', '10000', '13000', '16000', '19000', '22000'].includes(data.interval_banner)) {
            errorMessages.interval_banner = "Selecione um tempo válido.";
        }

        return errorMessages;
    };

    useEffect(() => {
        async function fetchData() {
            try {
                const apiClient = setupAPIClientEcommerce();
                const { data } = await apiClient.get("/marketing_publication/interval_banner/existing_interval");
                setData_interval(data);
            } catch (error) {
                toast.error("Erro ao carregar os dados da int social.");
            }
        }
        fetchData();
    }, []);

    async function fetchData() {
        try {
            const apiClient = setupAPIClientEcommerce();
            const { data } = await apiClient.get("/marketing_publication/interval_banner/existing_interval");
            setData_interval(data);
        } catch (error) {
            toast.error("Erro ao carregar os dados da int social.");
        }
    }

    const onSubmit = async (data: FormData) => {
        const validationErrors = validateForm(data);
        if (Object.keys(validationErrors).length > 0) {
            Object.values(validationErrors).forEach(message => toast.error(message));
            return;
        }

        setLoading(true);

        try {
            const apiClient = setupAPIClientEcommerce();

            const value = data.local_site.split(',')[0];
            const value_label = data.local_site.split(',')[1];

            const value_interval = data.interval_banner.split(',')[0];
            const label_interval = data.interval_banner.split(',')[1];

            await apiClient.post(`/marketing_publication/interval_banner`, {
                local_site: value,
                label_local_site: value_label,
                interval_banner: value_interval ? String(Number(value_interval)) : "0",
                label_interval_banner: label_interval
            });

            toast.success("Intervalos de tempo cadastrado.");
            reset();
            fetchData();
        } catch (error) {
            console.error(error);
            toast.error("Erro ao cadastrar o intervalo entre banners.");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = async (id: string, field: string, value: any) => {
        setLoading(true);
        try {
            const apiClient = setupAPIClientEcommerce();

            if (field === "local_site") {
                const value_label = value.split(',')[0];
                const label = value.split(',')[1];
                await apiClient.put(`/marketing_publication/interval_banner/update_data?bannerInterval_id=${id}`, {
                    local_site: value_label,
                    label_local_site: label
                });
            }

            if (field === "interval_banner") {
                const value_interval = value.split(',')[0];
                const label_interval = value.split(',')[1];

                await apiClient.put(`/marketing_publication/interval_banner/update_data?bannerInterval_id=${id}`, {
                    interval_banner: value_interval ? String(Number(value_interval)) : "0",
                    label_interval_banner: label_interval
                });
            }

            toast.success(`Atualizado com sucesso`);
            setEditing(null);
            const { data } = await apiClient.get("/marketing_publication/interval_banner/existing_interval");
            setData_interval(data);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao atualizar o dado.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        setLoading(true);
        try {
            const apiClient = setupAPIClientEcommerce();
            await apiClient.delete(`/marketing_publication/delete?bannerInterval_id=${id}`);
            toast.success(`Intervalo deletado com sucesso`);
            const { data } = await apiClient.get("/marketing_publication/interval_banner/existing_interval");
            setData_interval(data);
            fetchData();
        } catch (error) {
            console.error(error);
            toast.error("Erro ao deletar o dado.");
        } finally {
            setLoading(false);
        }
    };


    return (
        <SidebarAndHeader>
            <Section>
                <TitlePage title="INTERVALOS DE TEMPO PARA BANNERS" />
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                    <div className="grid grid-cols-2 gap-4">
                        <select
                            {...register("local_site")}
                            className="border-2 rounded-md px-3 py-2 text-black"
                        >
                            <option value={["Pagina_inicial", "Página inicial"]}>Página inicial</option>
                            <option value={["Pagina_produto", "Página do produto"]}>Página do produto</option>
                            <option value={["Pagina_produtos_categoria", "Página de produtos na categoria"]}>Página de produtos na categoria</option>
                            <option value={["Pagina_categoria", "Página de categoria"]}>Página de categoria</option>
                            <option value={["Pagina_contato", "Página de contato"]}>Página de contato</option>
                        </select>

                        <select
                            {...register("interval_banner")}
                            className="border-2 rounded-md px-3 py-2 text-black"
                        >
                            <option value="">Selecione o intervalo de tempo para cada banner</option>
                            <option value={["3000", "3 Segundos"]}>3 Segundos</option>
                            <option value={["5000", "5 Segundos"]}>5 Segundos</option>
                            <option value={["7000", "7 Segundos"]}>7 Segundos</option>
                            <option value={["10000", "10 Segundos"]}>10 Segundos</option>
                            <option value={["13000", "13 Segundos"]}>13 Segundos</option>
                            <option value={["16000", "16 Segundos"]}>16 Segundos</option>
                            <option value={["19000", "19 Segundos"]}>19 Segundos</option>
                            <option value={["22000", "22 Segundos"]}>22 Segundos</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`px-6 py-3 rounded bg-green-500 text-[#FFFFFF] ${loading ? "opacity-50" : "hover:bg-green-400"
                            }`}
                    >
                        {loading ? "Cadastrando..." : "Cadastrar intervalo"}
                    </button>
                </form>

                <hr className="mt-8 mb-8" />

                <div className="grid gap-6 bg-background text-foreground transition-colors duration-300">
                    {data_interval.map((int) => (
                        <div
                            key={int.id}
                            className="flex flex-col sm:flex-row items-center sm:items-start justify-between p-4 bg-white rounded-lg shadow-md"
                        >
                            {/* local_site */}
                            <div className="flex-1 w-full sm:mx-4 mb-4 sm:mb-0">
                                {editing === `local_site-${int.id}` ? (
                                    <select
                                        {...register("local_site")}
                                        onBlur={(e) => handleEdit(int.id, "local_site", e.target.value)}
                                        className="border-2 rounded-md px-3 py-2 text-black"
                                    >
                                        <option value="">Selecione o local</option>
                                        <option value={["Pagina_inicial", "Página inicial"]}>Página inicial</option>
                                        <option value={["Pagina_produto", "Página do produto"]}>Página do produto</option>
                                        <option value={["Pagina_produtos_categoria", "Página de produtos na categoria"]}>Página de produtos na categoria</option>
                                        <option value={["Pagina_categoria", "Página de categoria"]}>Página de categoria</option>
                                        <option value={["Pagina_contato", "Página de contato"]}>Página de contato</option>
                                    </select>
                                ) : (
                                    <p
                                        onClick={() => setEditing(`local_site-${int.id}`)}
                                        className="text-lg font-medium cursor-pointer hover:text-orange-600 text-black"
                                    >
                                        {int.label_local_site}
                                    </p>
                                )}
                            </div>
                            {/* interval_banner */}
                            <div className="flex-1 w-full">
                                {editing === `interval_banner-${int.id}` ? (
                                    <select
                                        {...register("interval_banner")}
                                        onBlur={(e) => handleEdit(int.id, "interval_banner", e.target.value)}
                                        className="border-2 rounded-md px-3 py-2 text-black"
                                    >
                                        <option value="">Selecione o tempo de intervalo de passagem entre banners</option>
                                        <option value={["3000", "3 Segundos"]}>3 Segundos</option>
                                        <option value={["5000", "5 Segundos"]}>5 Segundos</option>
                                        <option value={["7000", "7 Segundos"]}>7 Segundos</option>
                                        <option value={["10000", "10 Segundos"]}>10 Segundos</option>
                                        <option value={["13000", "13 Segundos"]}>13 Segundos</option>
                                        <option value={["16000", "16 Segundos"]}>16 Segundos</option>
                                        <option value={["19000", "19 Segundos"]}>19 Segundos</option>
                                        <option value={["22000", "22 Segundos"]}>22 Segundos</option>
                                    </select>
                                ) : (
                                    <p
                                        onClick={() => setEditing(`interval_banner-${int.id}`)}
                                        className="text-black cursor-pointer hover:text-orange break-words"
                                    >
                                        {int.label_interval_banner}
                                    </p>
                                )}
                            </div>
                            <div>
                                <FaTrashAlt
                                    color="red"
                                    size={28}
                                    style={{ cursor: "pointer" }}
                                    onClick={() => handleDelete(int.id)}
                                />
                            </div>
                        </div>
                    ))}
                </div>
                {loading && (
                    <div className="text-center">
                        <p className="text-red-500">Atualizando...</p>
                    </div>
                )}
            </Section>
        </SidebarAndHeader>
    );
}