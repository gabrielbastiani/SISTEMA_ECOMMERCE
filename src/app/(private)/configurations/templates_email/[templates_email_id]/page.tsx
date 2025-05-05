"use client";

import { Section } from "@/app/components/section";
import { SidebarAndHeader } from "@/app/components/sidebarAndHeader";
import { TitlePage } from "@/app/components/section/titlePage";
import { setupAPIClientEcommerce } from "@/app/services/apiEcommerce";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useParams, useRouter } from "next/navigation";
import Editor from "@monaco-editor/react";

interface TemplateData {
    id: string;
    title: string;
    subject: string;
    templateName: string;
    variables: string[] | null;
    isActive: boolean;
    hoursAfter: number;
}

export default function Templates_email_id() {

    const router = useRouter();

    const params = useParams();
    const templates_email_id = params.templates_email_id as string;

    const [templateEmail, setTemplateEmail] = useState<TemplateData>({
        id: "",
        title: "",
        subject: "",
        templateName: "",
        variables: [],
        isActive: true,
        hoursAfter: 0,
    });

    const [ejsContent, setEjsContent] = useState<string>("");
    const [renderedHtml, setRenderedHtml] = useState<string>("");
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const allowedTemplates = [
        'criacao_de_super_administrador.ejs',
        'recuperar_senha.ejs',
        'criacao_de_employee.ejs',
        'data_login_user.ejs',
        'criacao_de_mensagem_formulario.ejs',
        'encerrar_publicidade_programada.ejs',
        'publicidade_programada.ejs'
    ];

    const filterTemplates = (templateObject: { templateName: string; }) => {
        return allowedTemplates.includes(templateObject.templateName);
    };

    const filter = filterTemplates(templateEmail);

    useEffect(() => {
        const apiClient = setupAPIClientEcommerce();

        async function loadTemplateData() {
            try {
                const [templateResponse, contentResponse] = await Promise.all([
                    apiClient.get(`/template_email/data?emailTemplate_id=${templates_email_id}`),
                    apiClient.get(`/template_email/content?emailTemplate_id=${templates_email_id}`)
                ]);

                const data = templateResponse.data;
                setTemplateEmail({
                    ...data,
                    variables: Array.isArray(data.variables) ? data.variables : [],
                });

                setEjsContent(contentResponse.data.content);
            } catch (error) {
                console.error("Error loading templateEmail:", error);
                toast.error("Erro ao carregar o templateEmail");
            }
        }

        loadTemplateData();
    }, [templates_email_id]);

    // Componente Client-Side Atualizado
    const renderEjsPreview = async () => {
        setIsPreviewLoading(true);
        try {
            const response = await fetch("/api/template_email/render-preview", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: ejsContent }),
            });

            const html = await response.text();

            if (!response.ok) throw new Error('Erro no preview');

            setRenderedHtml(`
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                ${html}
                <div style="margin-top: 30px; padding: 15px; background: #fff7ed; border-left: 4px solid #fb923c;">
                    <p style="margin: 0; color: #c2410c;">
                        Variáveis serão substituídas dinamicamente conforme uso
                    </p>
                </div>
            </div>
        `);

        } catch (err) {
            toast.error("Erro ao gerar visualização");
        } finally {
            setIsPreviewLoading(false);
        }
    };

    const handleEditorChange = (value: string | undefined) => {
        if (typeof value === "string") {
            setEjsContent(value);
        }
    };

    const updateMetadata = async () => {
        try {
            const api = setupAPIClientEcommerce();
            await api.put(
                `/template_email/metadata?emailTemplate_id=${templates_email_id}`,
                templateEmail
            );
            toast.success("Metadados atualizados!");
        } catch (error) {
            toast.error("Erro ao atualizar metadados");
        }
    };

    const updateContent = async () => {
        try {
            const api = setupAPIClientEcommerce();
            await api.put(
                `/template_email/update?emailTemplate_id=${templates_email_id}`,
                {
                    newContent: ejsContent,
                    templateName: templateEmail.templateName,
                }
            );
            toast.success("Template atualizado!");
        } catch (error) {
            toast.error("Erro ao atualizar templateEmail");
        }
    };

    const handleDeleteTemplate = async () => {
        try {
            const api = setupAPIClientEcommerce();
            await api.delete(`/email-templates/delete?emailTemplate_id=${templates_email_id}`);

            toast.success("Template excluído com sucesso!");
            router.push('/configurations/templates_email');
        } catch (error) {
            toast.error("Erro ao excluir template");
        } finally {
            setShowDeleteModal(false);
        }
    };

    return (
        <SidebarAndHeader>
            <Section>
                <TitlePage title="EMAIL TEMPLATE" />

                {filter == true ?
                    null
                    :
                    <button
                        onClick={() => setShowDeleteModal(true)}
                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                    >
                        Excluir Template
                    </button>
                }

                <div className="p-6 space-y-6">
                    {/* Metadados */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Título</label>
                                <input
                                    value={templateEmail.title}
                                    onChange={(e) =>
                                        setTemplateEmail({ ...templateEmail, title: e.target.value })
                                    }
                                    className="w-full p-2 border rounded text-black"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Assunto</label>
                                <input
                                    value={templateEmail.subject}
                                    onChange={(e) =>
                                        setTemplateEmail({ ...templateEmail, subject: e.target.value })
                                    }
                                    className="w-full p-2 border rounded text-black"
                                />
                            </div>
                            {filter == true ?
                                null
                                :
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Nome do Template
                                    </label>
                                    <input
                                        value={templateEmail.templateName}
                                        onChange={(e) =>
                                            setTemplateEmail({
                                                ...templateEmail,
                                                templateName: e.target.value,
                                            })
                                        }
                                        className="w-full p-2 border rounded text-black"
                                    />
                                </div>
                            }

                        </div>
                        <div className="space-y-4">

                            {filter == true ?
                                null
                                :
                                <>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            Variáveis
                                        </label>
                                        <input
                                            value={templateEmail.variables?.join(", ") || ""}
                                            onChange={(e) =>
                                                setTemplateEmail({
                                                    ...templateEmail,
                                                    variables: e.target.value
                                                        .split(",")
                                                        .map((v) => v.trim())
                                                        .filter((v) => v.length > 0),
                                                })
                                            }
                                            className="w-full p-2 border rounded text-black"
                                            placeholder="Ex: nome, email, telefone"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={templateEmail.isActive}
                                            onChange={(e) =>
                                                setTemplateEmail({
                                                    ...templateEmail,
                                                    isActive: e.target.checked,
                                                })
                                            }
                                            className="form-checkbox text-black"
                                        />
                                        <label className="text-sm">Template Ativo</label>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            Horas após o evento
                                        </label>
                                        <input
                                            type="number"
                                            value={templateEmail.hoursAfter}
                                            onChange={(e) =>
                                                setTemplateEmail({
                                                    ...templateEmail,
                                                    hoursAfter: Number(e.target.value) || 0,
                                                })
                                            }
                                            className="w-full p-2 border rounded text-black"
                                        />
                                    </div>
                                </>
                            }

                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={updateMetadata}
                            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                        >
                            Salvar Metadados
                        </button>
                        <button
                            onClick={updateContent}
                            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                        >
                            Salvar Template
                        </button>
                        <button
                            onClick={renderEjsPreview}
                            disabled={isPreviewLoading}
                            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
                        >
                            {isPreviewLoading ? 'Gerando Preview...' : 'Visualizar Email'}
                        </button>
                    </div>

                    {/* Editor de código EJS */}
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

                    {renderedHtml && (
                        <div className="border rounded-lg overflow-hidden shadow-lg bg-white mt-6">
                            <div className="bg-gray-100 p-3 border-b flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <span className="text-sm font-medium">Preview do Email</span>
                                </div>
                                <div className="text-sm text-gray-600">
                                    {templateEmail.subject}
                                </div>
                            </div>
                            <iframe
                                srcDoc={renderedHtml}
                                className="w-full h-[600px] border-0"
                                sandbox="allow-same-origin"
                                key={Date.now()}
                            />
                        </div>
                    )}
                </div>
                {showDeleteModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-md w-full">
                            <h3 className="text-lg font-bold mb-4 text-black">Confirmar Exclusão</h3>
                            <p className="mb-6 text-black">Tem certeza que deseja excluir este template permanentemente?</p>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleDeleteTemplate}
                                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                                >
                                    Confirmar Exclusão
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </Section>
        </SidebarAndHeader>
    );
}
