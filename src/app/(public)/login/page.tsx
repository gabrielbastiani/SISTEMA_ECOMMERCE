"use client"

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation'
import { Container } from '../../components/container'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { AuthContext } from '@/app/contexts/AuthContext'; 
import { useContext, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { LoadingRequest } from '../../components/loadingRequest'
import noImage from '../../../../public/no-image.png'
import { toast } from 'react-toastify'
import { Input } from '@/app/components/input';

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

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const schema = z.object({
    email: z.string().email("Insira um email válido").nonempty("O campo email é obrigatório"),
    password: z.string().nonempty("O campo senha é obrigatório")
})

type FormData = z.infer<typeof schema>

export default function Login() {

    const [cognitiveValid, setCognitiveValid] = useState(false);
    const router = useRouter();
    const { signIn, configs } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
    const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
        mode: "onChange"
    });

    async function onSubmit(data: FormData) {

        if (!cognitiveValid) {
            toast.error('Complete o desafio de segurança antes de enviar');
            return;
        }

        setLoading(true);

        const email = data?.email;
        const password = data?.password;

        try {
            let dataUser = {
                email,
                password
            };

            const success = await signIn(dataUser);

            if (success) {
                router.push('/dashboard');
                window.location.reload();
            }

            setLoading(false);

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }

    }

    return (
        <>
            {loading ?
                <LoadingRequest />
                :
                <Container>
                    <div className='w-full min-h-screen flex justify-center items-center flex-col gap-4'>
                        <div className='mb-6 max-w-sm w-full'>
                            {configs?.logo ?
                                <Link href='/'>
                                    <Image
                                        src={configs?.logo ? `${API_URL}/files/${configs.logo}` : noImage}
                                        alt='logo-do-blog'
                                        width={500}
                                        height={300}
                                        priority
                                    />
                                </Link>
                                :
                                null
                            }
                        </div>

                        <form
                            className='bg-white max-w-xl w-full rounded-lg p-4'
                            onSubmit={handleSubmit(onSubmit)}
                        >
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

                            <div className="mb-4">
                                <CognitiveChallenge
                                    onValidate={(isValid) => setCognitiveValid(isValid)}
                                />
                            </div>

                            <button
                                type='submit'
                                className={`bg-red-600 w-full rounded-md text-[#FFFFFF] h-10 font-medium ${!cognitiveValid ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                                disabled={!cognitiveValid || loading}
                            >
                                {loading ? 'Acessando...' : 'Acessar'}
                            </button>
                        </form>

                        <Link href="/email_recovery_password">
                            Recupere sua senha!
                        </Link>

                    </div>
                </Container>
            }
        </>
    )
}