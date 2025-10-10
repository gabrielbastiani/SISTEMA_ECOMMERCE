"use client";

import { ChangeEvent, useContext, useEffect, useState } from "react";
import { SidebarAndHeader } from "../../../components/sidebarAndHeader";
import { FiUpload } from "react-icons/fi";
import { toast } from "react-toastify";
import { setupAPIClientEcommerce } from "@/app/services/apiEcommerce"; 
import { AuthContext } from "@/app/contexts/AuthContext";
import Image from "next/image";
import { Input } from "../../../components/input";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TitlePage } from "@/app/components/section/titlePage"; 
import { Section } from "../../../components/section";
import { BsFillTrash3Fill } from "react-icons/bs";

const schema = z.object({
    name: z.string().nonempty("O campo nome é obrigatório"),
    email: z
        .string()
        .email("Insira um email válido")
        .nonempty("O campo email é obrigatório"),
});

type FormData = z.infer<typeof schema>;

export default function Profile() {
    
    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    const { user, signOut, updateUser } = useContext(AuthContext);

    const [avatarUrl, setAvatarUrl] = useState(
        user?.photo ? `${API_URL}/files/userEcommerce/${user.photo}` : ""
    );
    const [photo, setPhoto] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: user?.name || "",
            email: user?.email || "",
        },
        mode: "onChange",
    });

    useEffect(() => {
        if (user?.photo) {
            setAvatarUrl(`${API_URL}/files/userEcommerce/${user.photo}`);
        }
        reset({
            name: user?.name,
            email: user?.email,
        });
    }, [user?.photo, user?.name, user?.email, reset]);

    function handleFile(e: ChangeEvent<HTMLInputElement>) {
        if (!e.target.files) {
            return;
        }

        const image = e.target.files[0];
        if (!image) {
            return;
        }

        if (image.type === "image/jpeg" || image.type === "image/png") {
            setPhoto(image);
            setAvatarUrl(URL.createObjectURL(image));
        }
    }

    async function onSubmit(data: FormData) {
        try {
            setLoading(true);

            const apiClient = setupAPIClientEcommerce();
            const formData = new FormData();

            if (!user) {
                toast.error("Usuário não encontrado!");
                return;
            }

            if (photo) {
                formData.append("file", photo);
            }

            if (data.name !== user.name) {
                formData.append("name", data.name);
            }

            if (data.email !== user.email) {
                formData.append("email", data.email);
            }

            formData.append("userEcommerce_id", user.id);

            const response = await apiClient.put("/user/ecommerce/update", formData);

            toast.success("Dados atualizados com sucesso!");

            setPhoto(null);

            updateUser({ photo: response.data.photo });

        } catch (error) {
            toast.error("Erro ao atualizar!");
        } finally {
            setLoading(false);
        }
    }

    async function deletePhoto() {
        try {
            setLoading(true);

            const apiClient = setupAPIClientEcommerce();

            if (!user) {
                toast.error('Usuário não encontrado!');
                return;
            }

            const response = await apiClient.put(`/user/ecommerce/delete_photo?userEcommerce_id=${user.id}`);

            toast.success("Foto do usuário deletada com sucesso!");

            updateUser({ photo: response.data.photo });

            setAvatarUrl('');

        } catch (error) {
            toast.error("Erro ao deletar!");
        } finally {
            setLoading(false);
        }
    }

    return (
        <SidebarAndHeader>
            <Section>

                <TitlePage title="PERFIL" />

                <button
                    className="flex items-center mb-6"
                    onClick={deletePhoto}
                >
                    <BsFillTrash3Fill
                        color="red"
                        size={30}
                        style={{ marginRight: '10' }}
                    />
                    Deletar Imagem
                </button>

                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">

                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="flex flex-col space-y-6 w-full max-w-md md:max-w-none"
                    >
                        <label className="relative w-[120px] h-[120px] md:w-[180px] md:h-[180px] rounded-full cursor-pointer flex justify-center bg-gray-200 overflow-hidden">
                            <span className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black bg-opacity-50 transition-opacity duration-300 rounded-full">
                                <FiUpload size={30} color="#ff6700" />
                            </span>
                            <input
                                type="file"
                                accept="image/png, image/jpeg"
                                onChange={handleFile}
                                className="hidden"
                                alt="Foto do usuário"
                            />
                            {avatarUrl ? (
                                <div className="w-full h-full rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                                    <Image
                                        className="object-cover w-full h-full rounded-full"
                                        src={avatarUrl}
                                        width={180}
                                        height={180}
                                        alt="Foto do usuário"
                                        style={{ objectFit: "cover" }}
                                    />
                                </div>
                            ) : (
                                <div className="w-full h-full rounded-full bg-gray-300 flex items-center justify-center">
                                    <FiUpload size={30} color="#ff6700" />
                                </div>
                            )}
                        </label>

                        <Input
                            styles="border-2 rounded-md h-12 px-3 w-full max-w-sm"
                            type="text"
                            placeholder="Digite seu nome completo..."
                            name="name"
                            value={user?.name}
                            error={errors.name?.message}
                            register={register}
                        />

                        <Input
                            styles="border-2 rounded-md h-12 px-3 w-full max-w-sm"
                            type="email"
                            placeholder="Digite seu email..."
                            name="email"
                            value={user?.email}
                            error={errors.email?.message}
                            register={register}
                        />

                        <button
                            type="submit"
                            className="w-full md:w-80 px-6 py-3 bg-green-500 text-[#FFFFFF] rounded hover:bg-hoverButtonBackground transition duration-300"
                            disabled={loading}
                        >
                            {loading ? "Salvando..." : "Salvar alterações"}
                        </button>
                    </form>
                </div>

                <button
                    onClick={signOut}
                    className="mb-16 mt-24 w-full md:w-80 px-6 py-3 bg-red-600 text-[#FFFFFF] rounded hover:bg-hoverButtonBackground transition duration-300"
                    disabled={loading}
                >
                    {loading ? "Saindo..." : "Sair da conta"}
                </button>

            </Section>
        </SidebarAndHeader>
    );
}