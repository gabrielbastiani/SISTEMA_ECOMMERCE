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
    name_ecommerce: z.string().nonempty("O nome do ecommerce é obrigatório"),
    email_ecommerce: z.string().email("Insira um email válido para o ecommerce").nonempty("O email do ecommerce é obrigatório")
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
            {loading ? <LoadingRequest /> : (
                superAdmin.length >= 1 ? <Login /> : (
                    <Container>
                        <div className='w-full min-h-screen flex items-center justify-center py-8 bg-background text-foreground transition-colors duration-300'>
                            <div className='w-full max-w-4xl bg-background text-foreground transition-colors duration-300 rounded-xl shadow-lg p-8'>
                                <h1 className='text-2xl font-bold bg-background text-foreground transition-colors duration-300 mb-6 text-center'>
                                    Cadastro do E-commerce
                                </h1>

                                <form onSubmit={handleSubmit(onSubmit)} className='space-y-6 bg-background text-foreground transition-colors duration-300'>
                                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6 bg-background text-foreground transition-colors duration-300'>
                                        {/* Seção do E-commerce */}
                                        <div className='space-y-4'>
                                            <h2 className='text-lg font-semibold text-foreground border-b pb-2'>
                                                Informações do e-commerce
                                            </h2>

                                            <div>
                                                <label className='block text-sm font-medium text-foreground mb-1'>
                                                    Nome do E-commerce *
                                                </label>
                                                <Input
                                                    styles='w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-500'
                                                    type="text"
                                                    name="name_ecommerce"
                                                    error={errors.name_ecommerce?.message}
                                                    register={register} placeholder={''} />
                                            </div>

                                            <div>
                                                <label className='block text-sm font-medium text-foreground mb-1'>
                                                    Email do E-commerce *
                                                </label>
                                                <Input
                                                    styles='w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-500'
                                                    type="email"
                                                    name="email_ecommerce"
                                                    error={errors.email_ecommerce?.message}
                                                    register={register} placeholder={''} />
                                            </div>

                                            <div>
                                                <label className='block text-sm font-medium text-foreground mb-1'>
                                                    Logo do E-commerce *
                                                </label>
                                                <label className="relative w-full aspect-square rounded-lg cursor-pointer flex justify-center bg-gray-100 border-2 border-dashed hover:border-orange-500 transition-colors">
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
                                                            width={400}
                                                            height={400}
                                                            className="w-full h-full object-contain p-2"
                                                        />
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center w-full h-full text-gray-400">
                                                            <FiUpload size={32} className='mb-2' />
                                                            <span className='text-sm'>Clique para enviar</span>
                                                        </div>
                                                    )}
                                                </label>
                                            </div>
                                        </div>

                                        {/* Seção do Usuário Admin */}
                                        <div className='space-y-4'>
                                            <h2 className='text-lg font-semibold text-foreground border-b pb-2'>
                                                Informações do Administrador
                                            </h2>

                                            <div>
                                                <label className='block text-sm font-medium text-foreground mb-1'>
                                                    Nome Completo *
                                                </label>
                                                <Input
                                                    styles='w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-500'
                                                    type="text"
                                                    name="name"
                                                    error={errors.name?.message}
                                                    register={register} placeholder={''} />
                                            </div>

                                            <div>
                                                <label className='block text-sm font-medium text-foreground mb-1'>
                                                    Email *
                                                </label>
                                                <Input
                                                    styles='w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-500'
                                                    type="email"
                                                    name="email"
                                                    error={errors.email?.message}
                                                    register={register} placeholder={''} />
                                            </div>

                                            <div>
                                                <label className='block text-sm font-medium text-foreground mb-1'>
                                                    Senha *
                                                </label>
                                                <Input
                                                    styles='w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-500'
                                                    type="password"
                                                    name="password"
                                                    error={errors.password?.message}
                                                    register={register} placeholder={''} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className='mt-8'>
                                        <CognitiveChallenge
                                            onValidate={(isValid) => setCognitiveValid(isValid)}
                                        />
                                    </div>

                                    <button
                                        type='submit'
                                        className={`w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors ${!cognitiveValid ? 'opacity-50 cursor-not-allowed' : ''
                                            }`}
                                        disabled={!cognitiveValid || loading}
                                    >
                                        {loading ? 'Processando...' : 'Finalizar Cadastro'}
                                    </button>
                                </form>

                                <div className='mt-6 text-center'>
                                    <Link
                                        href="/login"
                                        className="text-orange-600 hover:text-orange-700 font-medium hover:underline"
                                    >
                                        Já possui uma conta? Faça o login!
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </Container>
                )
            )}
        </>
    )
}