"use client"

import { Section } from "@/app/components/section";
import { SidebarAndHeader } from "@/app/components/sidebarAndHeader";
import { TitlePage } from "@/app/components/section/titlePage";
import { setupAPIClientEcommerce } from "@/app/services/apiEcommerce";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useParams } from 'next/navigation';
import Editor from '@monaco-editor/react';

interface TemplateData {
    id: string;
    title: string;
    subject: string;
    templateName: string;
    variables: string[];
    isActive: boolean;
    hoursAfter: number;
}

export default function Templates_email_id() {
    const params = useParams();
    const templates_email_id = params.templates_email_id as string;

    const [templateEmail, setTemplateEmail] = useState<TemplateData>({
        id: '',
        title: '',
        subject: '',
        templateName: '',
        variables: [],
        isActive: true,
        hoursAfter: 0
    });

    const [ejsContent, setEjsContent] = useState<string>("");
    const [renderedHtml, setRenderedHtml] = useState<string>("");

    useEffect(() => {
        const apiClient = setupAPIClientEcommerce();

        async function loadTemplateData() {
            try {
                // Carrega metadados do templateEmail
                const templateResponse = await apiClient.get(`/template_email/data?emailTemplate_id=${templates_email_id}`);
                const templateData = templateResponse.data;
                setTemplateEmail(templateData);

                // Carrega o conteúdo do arquivo EJS
                const contentResponse = await apiClient.get(`/template_email/content?emailTemplate_id=${templates_email_id}`);
                const templateContent = contentResponse.data.content;
                setEjsContent(templateContent);

            } catch (error) {
                console.error('Error loading templateEmail:', error);
                toast.error('Erro ao carregar o templateEmail');
            }
        }

        loadTemplateData();
    }, [templates_email_id]);

    const handleEditorChange = (value: string | undefined) => {
        if (typeof value === 'string') {
            setEjsContent(value);
        }
    };

    const updateMetadata = async () => {
        try {
            const api = setupAPIClientEcommerce();
            await api.put(`/template_email/metadata?emailTemplate_id=${templates_email_id}`, templateEmail);
            toast.success('Metadados atualizados!');
        } catch (error) {
            toast.error('Erro ao atualizar metadados');
        }
    };

    const updateContent = async () => {
        try {
            const api = setupAPIClientEcommerce();
            await api.put(`/template_email/content?emailTemplate_id=${templates_email_id}`, {
                newContent: ejsContent,
                templateName: templateEmail.templateName
            });
            toast.success('Template atualizado!');
        } catch (error) {
            toast.error('Erro ao atualizar templateEmail');
        }
    };

    const previewTemplate = async () => {
        try {
          const api = setupAPIClientEcommerce();
      
          // Converter variáveis para objeto seguro
          const variables = Array.isArray(templateEmail.variables)
            ? templateEmail.variables.reduce((acc: Record<string, string>, curr: string) => ({
                ...acc,
                [curr.trim()]: `Exemplo_${curr.replace(/\s+/g, '_')}`
              }), {})
            : {};
      
          const response = await api.post(
            `/template_email/render?emailTemplate_id=${templates_email_id}`,
            { variables },
            {
              headers: {
                'Content-Type': 'application/json',
                'X-Debug-Request': 'true'
              },
              timeout: 10000
            }
          );
      
          if (typeof response.data === 'string') {
            setRenderedHtml(response.data);
          } else {
            throw new Error('Resposta inválida do servidor');
          }
      
        } catch (error: any) {
          console.error('Erro completo:', {
            error: error.response?.data || error.message,
            config: error.config
          });
          
          toast.error(`Falha na renderização: ${
            error.response?.data?.error || 
            error.message || 
            'Erro desconhecido'
          }`);
        }
      };

    return (
        <SidebarAndHeader>
            <Section>
                <TitlePage title="EMAIL TEMPLATE" />

                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Título</label>
                                <input
                                    value={templateEmail.title}
                                    onChange={(e) => setTemplateEmail({ ...templateEmail, title: e.target.value })}
                                    className="w-full p-2 border rounded"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Assunto</label>
                                <input
                                    value={templateEmail.subject}
                                    onChange={(e) => setTemplateEmail({ ...templateEmail, subject: e.target.value })}
                                    className="w-full p-2 border rounded"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Nome do Template</label>
                                <input
                                    value={templateEmail.templateName}
                                    onChange={(e) => setTemplateEmail({ ...templateEmail, templateName: e.target.value })}
                                    className="w-full p-2 border rounded"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Variáveis</label>
                                <input
                                    value={templateEmail.variables?.join(', ') || ''}
                                    onChange={(e) => setTemplateEmail({
                                        ...templateEmail,
                                        variables: e.target.value.split(',').map(v => v.trim())
                                    })}
                                    className="w-full p-2 border rounded"
                                    placeholder="Ex: nome, email, telefone"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={templateEmail.isActive}
                                    onChange={(e) => setTemplateEmail({ ...templateEmail, isActive: e.target.checked })}
                                    className="form-checkbox"
                                />
                                <label className="text-sm">Template Ativo</label>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Horas após o evento</label>
                                <input
                                    type="number"
                                    value={templateEmail.hoursAfter}
                                    onChange={(e) => setTemplateEmail({
                                        ...templateEmail,
                                        hoursAfter: Number(e.target.value) || 0
                                    })}
                                    className="w-full p-2 border rounded"
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={updateMetadata}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                        Salvar Metadados
                    </button>

                    <div className="h-[600px] border rounded-lg overflow-hidden">
                        <Editor
                            value={ejsContent}
                            onChange={handleEditorChange}
                            language="html"
                            theme="vs-dark"
                            options={{
                                minimap: { enabled: false },
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                            }}
                        />
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={updateContent}
                            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                        >
                            Salvar Template
                        </button>

                        <button
                            onClick={previewTemplate}
                            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                        >
                            Pré-visualizar
                        </button>
                    </div>

                    {renderedHtml && (
                        <div className="border rounded-lg p-4 bg-white">
                            <div dangerouslySetInnerHTML={{ __html: renderedHtml }} />
                        </div>
                    )}
                </div>
            </Section>
        </SidebarAndHeader>
    )
}