"use client"

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation'
import { Container } from '../../../components/container'
import { Input } from '../../../components/input'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useContext, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { LoadingRequest } from '../../../components/loadingRequest'
import { toast } from 'react-toastify'
import { setupAPIClientEcommerce } from '@/app/services/apiEcommerce'; 
import { AuthContext } from '@/app/contexts/AuthContext'; 
import noImage from '../../../../../public/no-image.png'

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const CognitiveChallenge = dynamic(
    () => import('../../../components/cognitiveChallenge/index').then(mod => mod.CognitiveChallenge),
    {
        ssr: false,
        loading: () => (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                Carregando desafio de segurança...
            </div>
        )
    }
);

const passwordSchema = z.object({
    password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
    confirmPassword: z.string().min(6, 'Confirmação de senha deve ter pelo menos 6 caracteres'),
}).refine(data => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function Recoverpassworduserblog({ params }: { params: { recover_password: string } }) {

    const { configs } = useContext(AuthContext);

    const [cognitiveValid, setCognitiveValid] = useState(false);
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<PasswordFormValues>({
        resolver: zodResolver(passwordSchema),
    });

    async function onSubmit(data: PasswordFormValues) {

        if (!cognitiveValid) {
            toast.error('Complete o desafio de segurança antes de enviar');
            return;
        }

        setLoading(true);

        try {
            const apiClient = setupAPIClientEcommerce();
            await apiClient.put(`/user/ecommerce/recovery_password?passwordRecoveryUserEcommerce_id=${params?.recover_password}`, { password: data?.confirmPassword });

            toast.success('Senha atualizada com sucesso!');

            setLoading(false);

            router.push('/login');

        } catch (error) {/* @ts-ignore */
            console.log(error.response.data);
            toast.error('Erro ao cadastrar!');
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
                                <Link href='/'>
                                    <Image
                                        src={configs?.logo ? `${API_URL}/files/ecommerce/${configs?.logo}` : noImage}
                                        alt='logo-do-site'
                                        width={500}
                                        height={500}
                                    />
                                </Link>
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
                                    type="password"
                                    placeholder="Digite a nova senha..."
                                    name="confirmPassword"
                                    error={errors.password?.message}
                                    register={register}
                                />
                            </div>

                            <div className='mb-3'>
                                <Input
                                    styles='w-full p-2'
                                    type="password"
                                    placeholder="Digite novamente a senha..."
                                    name="password"
                                    error={errors.confirmPassword?.message}
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
                                {loading ? 'Solicitando...' : 'Solicitar'}
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