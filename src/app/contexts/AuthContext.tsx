"use client"

import { createContext, ReactNode, useState, useEffect } from 'react';
import { apiEcommerce } from '../services/apiClientEcommerce';
import { toast } from 'react-toastify';
import { useCookies } from 'react-cookie';
import { useRouter } from 'next/navigation';
import axios from 'axios';

type AuthContextData = {
    user?: UserProps;
    isAuthenticated: boolean;
    loadingAuth?: boolean;
    signIn: (credentials: SignInProps) => Promise<boolean>;
    signOut: () => void;
    updateUser: (newUserData: Partial<UserProps>) => void;
    configs?: ConfigProps;
};

type UserProps = {
    id: string;
    name: string;
    email: string;
    photo?: string;
    role?: string;
};

type SignInProps = {
    email: string;
    password: string;
};

type AuthProviderProps = {
    children: ReactNode;
};

interface ConfigProps {
    name?: string;
    whatsap?: string;
    logo?: string;
    favicon?: string;
    phone?: string;
    email?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    number?: string;
    neighborhood?: string;
    country?: string;
    privacy_policies?: string;
    about_store?: string;
    exchanges_and_returns?: string;
    how_to_buy?: string;
    shipping_delivery_time?: string;
    faq?: string;
    payment_methods?: string;
    technical_assistance?: string;
    street?: string;
}

export const AuthContext = createContext({} as AuthContextData);

export function AuthProvider({ children }: AuthProviderProps) {
    const router = useRouter();

    const [isClient, setIsClient] = useState(false)

    const [configs, setConfigs] = useState<ConfigProps>({
        name: "",
        whatsap: "",
        logo: "",
        favicon: "",
        phone: "",
        email: "",
        city: "",
        state: "",
        zipCode: "",
        number: "",
        neighborhood: "",
        country: "",
        privacy_policies: "",
        about_store: "",
        exchanges_and_returns: "",
        how_to_buy: "",
        shipping_delivery_time: "",
        faq: "",
        payment_methods: "",
        technical_assistance: "",
        street: ""
    });

    useEffect(() => {
        setIsClient(true)
    }, [])

    const [cookies, setCookie, removeCookie] = useCookies(['@ecommerce.token']);
    const [cookiesId, setCookieId, removeCookieId] = useCookies(['@idUser']);
    const [user, setUser] = useState<UserProps>();
    const [loadingAuth, setLoadingAuth] = useState<boolean>(true);
    const isAuthenticated = !!user;

    useEffect(() => {
        async function loadConfigs() {
            try {
                const response = await apiEcommerce.get(`/configuration_ecommerce/get_configs`);

                if (response.status === 200) {
                    const defaultConfigs: ConfigProps = {
                        name: "Ecommerce",
                        logo: "../../../public/no-image.png",
                        email: "contato@ecommerce.com",
                        phone: "(00) 0000-0000",
                        favicon: "../../src/app/favicon.ico",
                        street: "Rua XXXXX",
                        city: "cidade",
                        state: "US",
                        zipCode: "99999-999",
                        number: "0000",
                        neighborhood: "Bairro",
                        country: "Brasil",
                        exchanges_and_returns: "Trocas e devoluções",
                        how_to_buy: "Como comprar",
                        shipping_delivery_time: "Prazo de entregas",
                        faq: "Perguntas e respostas",
                        payment_methods: "Metodos de pagamentos",
                        technical_assistance: "Assistencia tecnica",
                        about_store: "Escreva uma descrição para o ecommerce, do que se trata...",
                        privacy_policies: "Escrveva aqui seu texto das suas politicas de privacidades focado na lei LGPD"
                    };

                    setConfigs(response.data || defaultConfigs);
                }
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    if (error.response?.status === 404) {
                        console.warn("Endpoint não encontrado. Usando configurações padrão.");
                        setConfigs({
                            name: "Ecommerce",
                            logo: "../../../public/no-image.png",
                            email: "contato@ecommerce.com",
                            phone: "(00) 0000-0000",
                            favicon: "../../src/app/favicon.ico",
                            street: "Rua XXXXX",
                            city: "cidade",
                            state: "US",
                            zipCode: "99999-999",
                            number: "0000",
                            neighborhood: "Bairro",
                            country: "Brasil",
                            exchanges_and_returns: "Trocas e devoluções",
                            how_to_buy: "Como comprar",
                            shipping_delivery_time: "Prazo de entregas",
                            faq: "Perguntas e respostas",
                            payment_methods: "Metodos de pagamentos",
                            technical_assistance: "Assistencia tecnica",
                            about_store: "Escreva uma descrição para o ecommerce, do que se trata...",
                            privacy_policies: "Escrveva aqui seu texto das suas politicas de privacidades focado na lei LGPD"
                        });
                    } else {
                        console.error("Erro na requisição:", error.message);
                    }
                } else {
                    console.error("Erro desconhecido:", error);
                }
            }
        }
        loadConfigs();
    }, []);

    async function signIn({ email, password }: SignInProps): Promise<boolean> {
        setLoadingAuth(true);
        try {
            const response = await apiEcommerce.post('/user/ecommerce/session', { email, password });
            const { id, token } = response.data;

            const cookieOptions = {
                maxAge: 60 * 60 * 24 * 30,
                path: "/",
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax' as 'lax'
            };

            setCookie('@ecommerce.token', token, cookieOptions);
            setCookieId('@idUser', id, cookieOptions);

            apiEcommerce.defaults.headers['Authorization'] = `Bearer ${token}`;

            toast.success('Logado com sucesso!');
            setUser({ id, name: response.data.name, email });
            return true;
        } catch (err: any) {
            toast.error("Erro ao acessar");
            toast.error(`${err.response.data.error}`);
            console.log("Erro ao acessar", err);
            return false;
        } finally {
            setLoadingAuth(false);
        }
    }

    const updateUser = (newUserData: Partial<UserProps>) => {
        if (user) {
            setUser({
                ...user,
                ...newUserData,
            });
        }
    };

    useEffect(() => {
        let token = cookies['@ecommerce.token'];
        let userid = cookiesId['@idUser'];

        async function loadUserData() {
            if (token) {
                try {
                    const response = await apiEcommerce.get(`/user/ecommerce/me?userEcommerce_id=${userid}`);
                    const { id, name, email, photo, role } = response.data;
                    setUser({ id, name, email, photo, role });
                } catch (error) {
                    console.error("Erro ao carregar dados do usuário: ", error);
                }
            }
            setLoadingAuth(false);
        }
        loadUserData();
    }, [cookies, cookiesId]);

    function signOut() {
        try {
            removeCookie('@ecommerce.token', { path: '/' });
            removeCookieId('@idUser', { path: '/' });
            setUser(undefined);
            toast.success('Usuário deslogado com sucesso!');
            router.push("/login");
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (error) {
            toast.error("OPS... Erro ao deslogar");
        }
    }

    return (
        <AuthContext.Provider value={{ configs, user, isAuthenticated, loadingAuth, signIn, signOut, updateUser }}>
            {isClient ? children : null}
        </AuthContext.Provider>
    );
}