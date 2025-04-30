import { setupAPIClientEcommerce } from "@/app/services/apiEcommerce"; 
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { ChangeEvent, useState } from "react";
import { useForm } from "react-hook-form";
import { FiUpload } from "react-icons/fi";
import { toast } from "react-toastify";
import { z } from "zod";
import Medias_social from "./medias_social"; 
import noImage from '../../../../public/no-image.png';

const schema = z.object({
    name_media: z.string().nonempty("O título é obrigatório"),
    logo_media: z.string().optional(),
    link: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function Config_media_social() {

    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [logo_media, setLogo_media] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        mode: "onChange",
    });

    function handleFile(e: ChangeEvent<HTMLInputElement>) {
        if (!e.target.files) return;

        const image = e.target.files[0];
        if (!image) return;

        if (image.type === "image/jpeg" || image.type === "image/png") {
            setLogo_media(image);
            setLogoUrl(URL.createObjectURL(image));
        } else {
            toast.error("Formato de imagem inválido. Selecione uma imagem JPEG ou PNG.");
        }
    }

    const onSubmit = async (data: FormData) => {
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("name_media", data.name_media || "");
            formData.append("link", data.link || "");

            if (logo_media) {
                formData.append("file", logo_media);
            }

            const apiClient = setupAPIClientEcommerce();
            await apiClient.post("/create/media_social", formData);

            toast.success("Media social cadastrada com sucesso");
            reset();
            setLogoUrl(null);
            setLogo_media(null);

        } catch (error) {
            toast.error("Erro ao cadastrar a media social.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <h1 className="text-[#FFFFFF] text-3xl mb-4">Redes sociais da loja</h1>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <label className="relative w-[80px] h-[80px] rounded-lg cursor-pointer flex justify-center bg-gray-200 overflow-hidden">
                        <input type="file" accept="image/png, image/jpeg" onChange={handleFile} className="hidden" />
                        {logoUrl ? (
                            <Image
                                src={logo_media && noImage ? logoUrl : `${API_URL}/files/${logoUrl}`}
                                alt="Preview da imagem"
                                width={80}
                                height={80}
                                className="w-full h-full"
                            />
                        ) : (
                            <div className="flex items-center justify-center w-full h-full bg-gray-300">
                                <FiUpload size={20} color="#ff6700" />
                            </div>
                        )}
                    </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <label>
                        Nome da media social:
                        <input
                            type="text"
                            placeholder="Digite o nome..."
                            {...register("name_media")}
                            className="w-full border-2 rounded-md px-3 py-2 text-black"
                        />
                    </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <label>
                        Link da media social:
                        <input
                            type="text"
                            placeholder="Link da rede social..."
                            {...register("link")}
                            className="w-full border-2 rounded-md px-3 py-2 text-black"
                        />
                    </label>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className={`w-52 py-3 text-[#FFFFFF] ${loading ? "bg-gray-500" : "bg-red-600 hover:bg-orange-600"} rounded-md`}
                >
                    {loading ? "Salvando..." : "Salvar"}
                </button>
            </form>

            <hr className="mt-7 mb-7" />

            <Medias_social />
        </>
    )
}