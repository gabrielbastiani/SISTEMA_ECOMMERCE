import { setupAPIClientEcommerce } from "@/app/services/apiEcommerce";
import { ChangeEvent, useEffect, useState } from "react";
import Image from "next/image";
import { toast } from "react-toastify";
import { FaTrashAlt } from "react-icons/fa";

interface MediasProps {
    id: string;
    name_media: string;
    link: string;
    logo_media: string;
}

export default function Medias_social() {

    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    const [dataMedias, setDataMedias] = useState<MediasProps[]>([]);
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [logo_media, setLogo_media] = useState<File | null>(null);
    const [editing, setEditing] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        async function fetchData() {
            try {
                const apiClient = setupAPIClientEcommerce();
                const { data } = await apiClient.get("/get/media_social");
                setDataMedias(data);
            } catch (error) {
                toast.error("Erro ao carregar os dados da media social.");
            }
        }

        fetchData();
    }, []);

    function handleFile(e: ChangeEvent<HTMLInputElement>, id: string) {
        if (!e.target.files) return;

        const image = e.target.files[0];
        if (!image) return;

        if (image.type === "image/jpeg" || image.type === "image/png") {
            setLogo_media(image);
            setLogoUrl(URL.createObjectURL(image));

            handleImageUpdate(id, image);
        } else {
            toast.error("Formato de imagem inválido. Selecione uma imagem JPEG ou PNG.");
        }
    }

    async function handleImageUpdate(id: string, file: File) {
        const formData = new FormData();
        formData.append("socialMediasBlog_id", id);
        formData.append("file", file);
        setLoading(true);
        try {
            const apiClient = setupAPIClientEcommerce();
            await apiClient.put("/update/media_social", formData);
            toast.success("Imagem atualizada com sucesso!");
            const { data } = await apiClient.get("/get/media_social");
            setDataMedias(data);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao atualizar a imagem.");
        } finally {
            setLoading(false);
        }
    }

    const handleEdit = async (id: string, field: string, value: string) => {
        setLoading(true);
        try {
            const apiClient = setupAPIClientEcommerce();
            await apiClient.put(`/update/media_social`, {
                socialMediasBlog_id: id,
                [field]: value,
            });
            toast.success(`${field} atualizado com sucesso`);
            setEditing(null);
            const { data } = await apiClient.get("/get/media_social");
            setDataMedias(data);
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
            await apiClient.delete(`/delete/media_social?socialMediasBlog_id=${id}`);
            toast.success(`Media deletada com sucesso`);
            const { data } = await apiClient.get("/get/media_social");
            setDataMedias(data);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao deletar o dado.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 px-4 sm:px-6 lg:px-8">
            <h1 className="text-xl sm:text-2xl font-bold text-center sm:text-left">Gerenciar Mídias Sociais</h1>
            <div className="grid gap-6">
                {dataMedias.map((media) => (
                    <div
                        key={media.id}
                        className="flex flex-col sm:flex-row items-center sm:items-start justify-between p-4 bg-white rounded-lg shadow-md"
                    >
                        {/* Logo */}
                        <div className="w-20 h-20 sm:w-16 sm:h-16 mb-4 sm:mb-0 sm:mr-8">
                            <label className="relative w-[80px] h-[80px] rounded-lg cursor-pointer flex justify-center bg-gray-200 overflow-hidden">
                                <input
                                    type="file"
                                    accept="image/png, image/jpeg"
                                    onChange={(e) => handleFile(e, media.id)}
                                    className="hidden"
                                />
                                <Image
                                    src={
                                        logoUrl && logo_media?.name === media.logo_media
                                            ? logoUrl
                                            : `${API_URL}/files/mediaSocial/${media.logo_media}`
                                    }
                                    alt="Logo da mídia social"
                                    width={80}
                                    height={80}
                                    className="w-full h-full object-cover"
                                />
                            </label>
                        </div>
                        {/* Nome */}
                        <div className="flex-1 w-full sm:mx-4 mb-4 sm:mb-0">
                            {editing === `name-${media.id}` ? (
                                <input
                                    type="text"
                                    defaultValue={media.name_media}
                                    onBlur={(e) => handleEdit(media.id, "name_media", e.target.value)}
                                    className="w-full border-b-2 border-gray-300 focus:outline-none focus:border-orange-500 text-black"
                                />
                            ) : (
                                <p
                                    onClick={() => setEditing(`name-${media.id}`)}
                                    className="text-lg font-medium cursor-pointer hover:text-orange-600 text-black"
                                >
                                    {media.name_media}
                                </p>
                            )}
                        </div>
                        {/* Link */}
                        <div className="flex-1 w-full">
                            {editing === `link-${media.id}` ? (
                                <input
                                    type="text"
                                    defaultValue={media.link}
                                    onBlur={(e) => handleEdit(media.id, "link", e.target.value)}
                                    className="w-full border-b-2 border-gray-300 focus:outline-none focus:border-orange-500 text-black"
                                />
                            ) : (
                                <p
                                    onClick={() => setEditing(`link-${media.id}`)}
                                    className="text-black cursor-pointer hover:text-orange break-words"
                                >
                                    {media.link}
                                </p>
                            )}
                        </div>
                        <div>
                            <FaTrashAlt
                                color="red"
                                size={28}
                                style={{ cursor: "pointer" }}
                                onClick={() => handleDelete(media.id)}
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
        </div>
    );
}