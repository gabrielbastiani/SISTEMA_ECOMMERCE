"use client";

import { toast } from 'react-toastify';
import { setupAPIClientEcommerce } from '@/app/services/apiEcommerce';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect } from 'react';

interface DeleteProps {
    isOpen: boolean;
    onRequestClose: () => void;
    id_users: string;
    link_update_senha: string;
}

const passwordSchema = z.object({
    password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
    confirmPassword: z.string().min(6, 'Confirmação de senha deve ter pelo menos 6 caracteres'),
}).refine(data => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

export function ModalPasswordChange({ isOpen, onRequestClose, id_users, link_update_senha }: DeleteProps) {

    const [isBrowser, setIsBrowser] = useState(false);

    useEffect(() => {
        setIsBrowser(true);
    }, []);

    function generateComplexPassword(length: number): string {
        const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
        const numberChars = '0123456789';
        const specialChars = '!@#$%^&*()-_=+[]{}|;:,.<>?';
        const allChars = uppercaseChars + lowercaseChars + numberChars + specialChars;

        let password = '';
        password += uppercaseChars.charAt(Math.floor(Math.random() * uppercaseChars.length));
        password += lowercaseChars.charAt(Math.floor(Math.random() * lowercaseChars.length));
        password += numberChars.charAt(Math.floor(Math.random() * numberChars.length));
        password += specialChars.charAt(Math.floor(Math.random() * specialChars.length));

        for (let i = password.length; i < length; i++) {
            password += allChars.charAt(Math.floor(Math.random() * allChars.length));
        }

        return password.split('').sort(() => 0.5 - Math.random()).join('');
    }

    const { register, handleSubmit, setValue, formState: { errors } } = useForm<PasswordFormValues>({
        resolver: zodResolver(passwordSchema),
    });

    const handleGeneratePassword = () => {
        const newPassword = generateComplexPassword(22);
        setValue("password", newPassword);
        setValue("confirmPassword", newPassword);
    };

    async function onSubmit(data: PasswordFormValues) {
        try {
            const apiClient = setupAPIClientEcommerce();

            await apiClient.put(`${link_update_senha}`, {
                userEcommerce_id: id_users,
                password: data.password
            });

            toast.success(`Senha alterada com sucesso.`);
            onRequestClose();

        } catch (error) {
            if (error instanceof Error && 'response' in error && error.response) {
                console.log((error as any).response.data);
                toast.error('Ops, erro ao alterar a senha.');
            } else {
                console.error(error);
                toast.error('Erro desconhecido.');
            }
        }
    }

    if (!isBrowser || !isOpen) return null;


    return (
        <div
            className="fixed inset-0 z-[9999998] flex items-center justify-center bg-background/70 text-foreground transition-colors duration-300"
            onClick={onRequestClose}
        >
            <div
                className="relative bg-black p-8 rounded-lg w-[90%] max-w-[600px] mx-auto text-foreground transition-colors duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onRequestClose}
                    className="absolute right-3 top-3 bg-transparent border-0 cursor-pointer text-[#f34748] text-2xl hover:opacity-80 transition-opacity"
                >
                    ×
                </button>

                <div className="text-center">
                    <h1 className="text-xl my-5 text-white">Altere a senha desse usuário.</h1>

                    <div className="mb-6">
                        <button
                            type="button"
                            onClick={handleGeneratePassword}
                            className="bg-orange-600 text-white rounded-lg px-4 py-2 hover:bg-orange-700 transition-colors duration-200"
                        >
                            Gerar Senha
                        </button>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-2">
                            <label className="block text-white text-left mb-2">Senha</label>
                            <input
                                type="text"
                                placeholder="Digite sua senha..."
                                {...register("password")}
                                className="w-full p-3 border-2 border-gray-700 rounded-md bg-white text-black focus:border-orange-500 focus:ring-2 focus:ring-orange-500"
                            />
                            {errors.password && (
                                <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="block text-white text-left mb-2">Confirmar a senha</label>
                            <input
                                type="text"
                                placeholder="Digite novamente a senha..."
                                {...register("confirmPassword")}
                                className="w-full p-3 border-2 border-gray-700 rounded-md bg-white text-black focus:border-orange-500 focus:ring-2 focus:ring-orange-500"
                            />
                            {errors.confirmPassword && (
                                <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="w-full py-3 px-6 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium"
                        >
                            Alterar Senha
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}