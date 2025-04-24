"use client"

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation'
import { Container } from '../../components/container'
import { Input } from '../../components/input'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useContext, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { LoadingRequest } from '../../components/loadingRequest'
import { toast } from 'react-toastify'
import { setupAPIClientEcommerce } from '@/app/services/apiEcommerce'; 
import { AuthContext } from '@/app/contexts/AuthContext'; 
import noImage from '../../../../public/no-image.png'

const API_URL = process.env.NEXT_PUBLIC_API_URL;

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
    email: z.string().email("Insira um email válido").nonempty("O campo email é obrigatório"),
})

type FormData = z.infer<typeof schema>

export default function EmailRecoveryPassword() {

    const { configs } = useContext(AuthContext);
    
    const [cognitiveValid, setCognitiveValid] = useState(false);
    const router = useRouter();
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

        try {
            const apiClient = setupAPIClientEcommerce();
            await apiClient.post(`/user/ecommerce/email_recovery_password`, { email: email });

            toast.success(`Email enviado para o endereço "${email}`);

            setLoading(false);

            router.push('/login');

        } catch (error) {
            if (error instanceof Error && 'response' in error && error.response) {
                console.log((error as any).response.data);
                toast.error('Ops erro ao enviar email ao usuario.');
            } else {
                console.error(error);
                toast.error('Erro desconhecido.');
            }
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
                    <div className='w-full min-h-screen flex justify-center items-center flex-col gap-4 bg-background text-foreground transition-colors duration-300'>
                        <div className='mb-6 max-w-sm w-full'>
                            {configs?.logo ?
                                <Image
                                    src={configs?.logo ? `${API_URL}/files/${configs?.logo}` : noImage}
                                    alt='logo-do-site'
                                    width={500}
                                    height={500}
                                />
                                :
                                null
                            }
                        </div>

                        <form
                            className='max-w-xl w-full rounded-lg p-4 bg-background text-foreground transition-colors duration-300'
                            onSubmit={handleSubmit(onSubmit)}
                        >
                            <div className='mb-3'>
                                <Input
                                    styles='w-full p-2'
                                    type="email"
                                    placeholder="Digite seu email..."
                                    name="email"
                                    error={errors.email?.message}
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
                                {loading ? 'Enviando...' : 'Enviar'}
                            </button>
                        </form>

                        <Link href="/register">
                            Ainda não possui uma conta? Cadastre-se
                        </Link>

                        <Link href="/login">
                            Já possui uma conta? Faça o login!
                        </Link>

                    </div>
                </Container>
            }
        </>
    )
}