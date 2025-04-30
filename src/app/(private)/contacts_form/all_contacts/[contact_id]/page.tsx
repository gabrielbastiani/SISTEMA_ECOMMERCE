"use client"

export const dynamic = 'force-dynamic';
import { Section } from "@/app/components/section";
import { SidebarAndHeader } from "@/app/components/sidebarAndHeader";
import { TitlePage } from "@/app/components/section/titlePage";
import { setupAPIClientEcommerce } from "@/app/services/apiEcommerce";
import { useEffect, useState } from "react";
import { RiMailSendLine } from "react-icons/ri";
import { toast } from "react-toastify";
import { useParams } from 'next/navigation'; // Importe useParams

interface ContactProps {
    id: string;
    name_user: string;
    slug_name_user: string;
    email_user: string;
    subject: string;
    message: string;
    created_at: string;
}

export default function Contact_id() { // Remova as props params

    const params = useParams(); // Use useParams para obter os parâmetros
    const contact_id = params.contact_id as string; // Acesse contact_id

    const [contactData, setContactData] = useState<ContactProps>();

    useEffect(() => {
        const apiClient = setupAPIClientEcommerce();
        async function load_contact() {
            try {
                // Use contact_id obtido do useParams
                const response = await apiClient.get(`/contacts_form/contact?formContact_id=${contact_id}`);
                setContactData(response.data);
            } catch (error) {
                console.log(error);
            }
        }
        load_contact();
    }, [contact_id]); // Adicione contact_id como dependência

    const handleClick = () => {
        if (contactData?.email_user && contactData?.subject) {
            window.location.href = `mailto:${contactData?.email_user}?subject=${encodeURIComponent(contactData?.subject)}`;
        } else {
            toast.error("Email ou assunto estão indefinidos.");
            console.error("Email ou assunto estão indefinidos.");
        }
    };

    return (
        <SidebarAndHeader>
            <Section>
                <TitlePage title="CONTATO" />
                <div className="mb-4">
                    <h2 className="text-xl text-foreground transition-colors duration-300">{contactData?.name_user}</h2>
                </div>
                <div>
                    <p className="flex items-center">
                        Email: <span className="ml-2 text-foreground transition-colors duration-300">
                            {contactData?.email_user}
                        </span>
                    </p>
                    <p className="mt-3 text-foreground transition-colors duration-300">Assunto: <span>{contactData?.subject}</span></p>
                </div>
                <div className="mt-10">
                    <p className="mb-2 text-foreground transition-colors duration-300">Mensagem:</p>
                    <p className="border p-4 text-foreground transition-colors duration-300">
                        {contactData?.message}
                    </p>
                    <button
                        onClick={handleClick}
                        className="mt-3 cursor-pointer flex items-center bg-green-500 text-white p-2 font-bold rounded"
                    >
                        Responder
                        <RiMailSendLine className="ml-3" size={30} />
                    </button>
                </div>
            </Section>
        </SidebarAndHeader>
    )
}