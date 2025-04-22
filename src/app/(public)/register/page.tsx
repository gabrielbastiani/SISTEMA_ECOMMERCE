"use client"

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation'
import { Container } from '@/app/components/container';
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { setupAPIClientEcommerce } from '@/app/services/apiEcommerce'; 
import { toast } from 'react-toastify'
import Link from 'next/link'
import Image from 'next/image'
import { ChangeEvent, useEffect, useState } from 'react'
import { LoadingRequest } from '@/app/components/loadingRequest'; 
import { FiUpload } from 'react-icons/fi'
import { Input } from '@/app/components/input';
import Login from '../login/page';

const CognitiveChallenge = dynamic(
    () => import('../../components/cognitiveChallenge/index').then(mod => mod.CognitiveChallenge),
    {
        ssr: false,
        loading: () => (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                Carregando desafio de segurança...
            </div>
        )
    }
);

const schema = z.object({
    name: z.string().nonempty("O campo nome é obrigatório"),
    email: z.string().email("Insira um email válido").nonempty("O campo email é obrigatório"),
    password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres").nonempty("O campo senha é obrigatório"),
    logo: z.string().optional(),
    name_ecommerce: z.string().nonempty("O nome do blog é obrigatório"),
    email_ecommerce: z.string().email("Insira um email válido para o blog").nonempty("O email do blog é obrigatório")
});

type FormData = z.infer<typeof schema>

export default function Register() {

    const router = useRouter();
    const [cognitiveValid, setCognitiveValid] = useState(false);
    const [superAdmin, setSuperAdmin] = useState([]);
    const [loading, setLoading] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [logo, setLogo] = useState<File | null>(null);

    useEffect(() => {
        const apiClient = setupAPIClientEcommerce();
        async function fetch_super_user() {
            try {
                setLoading(true);
                const response = await apiClient.get(`/user/ecommerce/publicSuper_user`);
                setSuperAdmin(response.data);
            } catch (error) {
                console.log(error);
            } finally {
                setLoading(false);
            }
        }
        fetch_super_user();
    }, []);

    const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
        mode: "onChange"
    });

    const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;

        const image = e.target.files[0];
        if (!image) return;

        if (image.type === "image/jpeg" || image.type === "image/png") {
            setLogo(image);
            setAvatarUrl(URL.createObjectURL(image));
        } else {
            toast.error("Formato de imagem inválido. Selecione uma imagem JPEG ou PNG.");
        }
    };

    const onSubmit = async (data: FormData) => {

        if (!cognitiveValid) {
            toast.error('Complete o desafio de segurança antes de enviar');
            return;
        }

        setLoading(true);

        if (!logo) {
            toast.error("A imagem da logo é obrigatória");
            setLoading(false);
            return;
        }

        try {
            const apiClient = setupAPIClientEcommerce();

            const ecommerceFormData = new FormData();
            ecommerceFormData.append("name", data.name_ecommerce);
            ecommerceFormData.append("email", data.email_ecommerce);
            ecommerceFormData.append("logo", logo);

            await apiClient.post('/create/ecommerce', ecommerceFormData);

            await apiClient.post('/user/ecommerce/create', {
                name: data.name,
                email: data.email,
                password: data.password
            });

            toast.success('Cadastro realizado com sucesso!');
            router.push('/login');
        } catch (error) {
            console.error(error);
            toast.error('Erro ao realizar cadastro');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {loading ?
                <LoadingRequest />
                :
                <>
                    {superAdmin.length >= 1 ?
                        <Login />
                        :
                        <Container>
                            <div className='w-full min-h-screen flex justify-center items-center flex-col gap-4'>
                                <form
                                    className='bg-white max-w-xl w-full rounded-lg p-4'
                                    onSubmit={handleSubmit(onSubmit)}
                                >
                                    <div className='mb-3'>
                                        <Input
                                            styles='w-full border-2 rounded-md h-11 px-2'
                                            type="text"
                                            placeholder="Digite o nome do blog..."
                                            name="name"
                                            error={errors.name?.message}
                                            register={register}
                                        />
                                    </div>

                                    <div className='mb-3'>
                                        <Input
                                            styles='w-full border-2 rounded-md h-11 px-2'
                                            type="email"
                                            placeholder="Digite o email do blog..."
                                            name="email"
                                            error={errors.email?.message}
                                            register={register}
                                        />
                                    </div>

                                    <div className='mb-3'>
                                        <label className="relative w-full h-[250px] rounded-lg cursor-pointer flex justify-center bg-gray-200 overflow-hidden">
                                            <input
                                                type="file"
                                                accept="image/png, image/jpeg"
                                                onChange={handleFile}
                                                className="hidden"
                                            />
                                            {avatarUrl ? (
                                                <Image
                                                    src={avatarUrl}
                                                    alt="Preview da imagem"
                                                    width={250}
                                                    height={200}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center w-full h-full bg-gray-300">
                                                    <FiUpload size={30} color="#ff6700" />
                                                </div>
                                            )}
                                        </label>
                                    </div>

                                    <div className='mb-3'>
                                        <Input
                                            styles='w-full border-2 rounded-md h-11 px-2'
                                            type="text"
                                            placeholder="Digite seu nome completo..."
                                            name="name"
                                            error={errors.name?.message}
                                            register={register}
                                        />
                                    </div>

                                    <div className='mb-3'>
                                        <Input
                                            styles='w-full border-2 rounded-md h-11 px-2'
                                            type="email"
                                            placeholder="Digite seu email..."
                                            name="email"
                                            error={errors.email?.message}
                                            register={register}
                                        />
                                    </div>

                                    <div className='mb-3'>
                                        <Input
                                            styles='w-full border-2 rounded-md h-11 px-2'
                                            type="password"
                                            placeholder="Digite sua senha..."
                                            name="password"
                                            error={errors.password?.message}
                                            register={register}
                                        />
                                    </div>

                                    <CognitiveChallenge
                                        onValidate={(isValid) => setCognitiveValid(isValid)}
                                    />

                                    <button
                                        type='submit'
                                        className={`bg-red-600 w-full rounded-md text-[#FFFFFF] h-10 font-medium ${!cognitiveValid ? 'opacity-50 cursor-not-allowed' : ''
                                            }`}
                                        disabled={!cognitiveValid || loading}
                                    >
                                        {loading ? 'Carregando...' : 'Cadastrar'}
                                    </button>
                                </form>

                                <Link href="/login" className="text-[#FFFFFF] hover:underline">
                                    Já possui uma conta? Faça o login!
                                </Link>
                            </div>
                        </Container>
                    }
                </>
            }
        </>
    )
}