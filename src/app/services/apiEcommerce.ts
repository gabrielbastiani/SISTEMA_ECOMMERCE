import axios, { AxiosInstance } from 'axios';
import Cookies from 'universal-cookie';
import { toast } from 'react-toastify';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function signOut() {
    try {
        const removeCookieUser = new Cookies();
        removeCookieUser.remove('@ecommerce.token', { path: '/' });
        toast.success('Usuário deslogado com sucesso!');
        setTimeout(() => {
            if (typeof window !== 'undefined') {
                window.location.reload();
            }
        }, 1000);
    } catch (error) {
        if (error instanceof Error) {
            toast.error(error.message);
        } else {
            toast.error('OPS... Erro ao deslogar');
        }
    }
}

export function setupAPIClientEcommerce(): AxiosInstance {
    const cookieUser = new Cookies();
    const cookies = cookieUser.get('@ecommerce.token');

    const apiEcommerce = axios.create({
        baseURL: API_URL,
        headers: {
            Authorization: `Bearer ${cookies}`
        }
    });

    apiEcommerce.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error.response?.status === 401) {
                signOut();
                if (typeof window !== 'undefined') {
                    window.location.href = '/login';
                }
            }
            return Promise.reject(error);
        }
    );

    return apiEcommerce;
}