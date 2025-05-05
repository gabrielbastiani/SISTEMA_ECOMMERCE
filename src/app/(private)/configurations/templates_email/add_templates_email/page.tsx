"use client"

import { useState } from 'react';
import { Section } from "@/app/components/section";
import { TitlePage } from "@/app/components/section/titlePage";
import { SidebarAndHeader } from "@/app/components/sidebarAndHeader";
import Editor from '@monaco-editor/react';
import { useRouter } from 'next/navigation';
import { setupAPIClientEcommerce } from '@/app/services/apiEcommerce'; 
import { toast } from "react-toastify";

interface TemplateForm {
  title: string;
  subject: string;
  templateName: string;
  variables: string;
  isActive: boolean;
  hoursAfter: string;
  content: string;
}

export default function Add_templates_email() {
  const router = useRouter();
  const [form, setForm] = useState<TemplateForm>({
    title: '',
    subject: '',
    templateName: '',
    variables: '',
    isActive: true,
    hoursAfter: '',
    content: '<!DOCTYPE html>\n<html>\n<body>\n  <!-- Seu template aqui -->\n</body>\n</html>'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const api = setupAPIClientEcommerce();
      
      await api.post('/email-templates', {
        ...form,
        variables: form.variables.split(',').map(v => v.trim()).filter(Boolean),
        hoursAfter: form.hoursAfter ? parseInt(form.hoursAfter) : undefined
      });

      toast.success('Template criado com sucesso!');
      router.push('/configurations/templates_email');

    } catch (error) {
        console.log(error);
      toast.error('Erro ao criar template');
    }
  };

  return (
    <SidebarAndHeader>
      <Section>
        <TitlePage title="ADICIONAR TEMPLATE DE EMAIL" />

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Coluna 1 */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Título *</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({...form, title: e.target.value})}
                  className="w-full p-2 border rounded text-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Assunto</label>
                <input
                  value={form.subject}
                  onChange={(e) => setForm({...form, subject: e.target.value})}
                  className="w-full p-2 border rounded text-black"
                  placeholder="Ex: Confirmação de Pedido"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Nome do Arquivo *</label>
                <input
                  required
                  value={form.templateName}
                  onChange={(e) => setForm({...form, templateName: e.target.value})}
                  className="w-full p-2 border rounded text-black"
                  placeholder="Ex: confirmacao_pedido.ejs"
                />
                <p className="text-xs text-gray-500 mt-1">Deve terminar com .ejs</p>
              </div>
            </div>

            {/* Coluna 2 */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Variáveis</label>
                <input
                  value={form.variables}
                  onChange={(e) => setForm({...form, variables: e.target.value})}
                  className="w-full p-2 border rounded text-black"
                  placeholder="Ex: nomeCliente, numeroPedido, dataEntrega"
                />
                <p className="text-xs text-gray-500 mt-1">Separe por vírgulas</p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({...form, isActive: e.target.checked})}
                  className="form-checkbox text-black"
                />
                <label className="text-sm">Template Ativo</label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Horas após o evento</label>
                <input
                  type="number"
                  value={form.hoursAfter}
                  onChange={(e) => setForm({...form, hoursAfter: e.target.value})}
                  className="w-full p-2 border rounded text-black"
                  placeholder="Ex: 24 (horas)"
                />
              </div>
            </div>
          </div>

          {/* Editor EJS */}
          <div className="h-[600px] border rounded-lg overflow-hidden">
            <Editor
              height="100%"
              defaultLanguage="html"
              theme="vs-dark"
              value={form.content}
              onChange={(value) => setForm({...form, content: value || ''})}
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="submit"
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Criar Template
            </button>
          </div>
        </form>
      </Section>
    </SidebarAndHeader>
  )
}