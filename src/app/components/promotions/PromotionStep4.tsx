'use client'
import { Dispatch, SetStateAction, useState } from 'react'
import { Input, Tooltip } from '@nextui-org/react'
import { Editor } from '@tinymce/tinymce-react'
import { PromotionWizardDto } from 'Types/types'

const TOKEN_TINY = process.env.NEXT_PUBLIC_TINYMCE_API_KEY;

interface Props {
  data: PromotionWizardDto
  setData: Dispatch<SetStateAction<PromotionWizardDto>>
  onBack: () => void
  onNext: () => void
}

export default function PromotionStep4({ data, setData, onBack, onNext }: Props) {
  
  const [title, setTitle] = useState('')
  const [type, setType] = useState<'SPOT' | 'PRODUCT_PAGE'>('SPOT')
  const [content, setContent] = useState('')

  const add = () => {
    if (!title || !content) return
    setData(d => ({
      ...d,
      displays: [
        ...(d.displays || []),
        { title, type, content }
      ]
    }))
    setTitle(''); setContent('')
  }

  const remove = (i: number) =>
    setData(d => ({ ...d, displays: d.displays?.filter((_, j) => j !== i) }))

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Passo 4: Divulgações</h2>

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b bg-gray-100 text-black">
            <th className="p-2">Título</th>
            <th className="p-2">Tipo</th>
            <th className="p-2">Conteúdo</th>
            <th className="p-2"></th>
          </tr>
        </thead>
        <tbody>
          {data.displays?.map((d, i) => (
            <tr key={i} className="border-b">
              <td className="p-2">{d.title}</td>
              <td className="p-2">{d.type}</td>
              <td className="p-2">
                <div dangerouslySetInnerHTML={{ __html: d.content }} />
              </td>
              <td className="p-2">
                <button className="text-red-600" onClick={() => remove(i)}>
                  Remover
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="space-y-4">
        <div>
          <Tooltip
            content="Informe o titulo da promoção para divulgação da promoção (Preenchimento Obrigatório)."
            placement="top-start"
            className="bg-white text-red-500 border border-gray-200 p-2"
          >
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="bg-white border border-gray-200 rounded-md"
              classNames={{
                input: "text-black",
              }}
              placeholder='Titulo'
            />
          </Tooltip>

        </div>
        <div>
          <Tooltip
            content="Selecione o tipo de divulgação, o tipo texto é para o Spot (exibido no anúncio, na listagem da loja), e o tipo HTML é para os detalhes do produto (exibido na página do produto). (Preenchimento Obrigatório)"
            placement="top-start"
            className="bg-white text-red-500 border border-gray-200 p-2"
          >
            <select
              className="w-full border p-2 rounded text-black"
              value={type}
              onChange={e => setType(e.target.value as any)}
            >
              <option value="SPOT">Spot</option>
              <option value="PRODUCT_PAGE">Página do produto</option>
            </select>
          </Tooltip>

        </div>
        <div>
          <Tooltip
            content="Informe um texto descritivo com informações da divulgação. (Preenchimento Obrigatório)"
            placement="top-start"
            className="bg-white text-red-500 border border-gray-200 p-2"
          >
            <label className="block">Conteúdo</label>
          </Tooltip>
          <Editor
            apiKey={TOKEN_TINY}
            init={{ height: 200, menubar: false, plugins: ['link', 'lists', 'code'], toolbar: 'undo redo | bold italic | bullist numlist | code' }}
            value={content}
            onEditorChange={c => setContent(c)}
          />
        </div>
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded bg-gray-200 text-black hover:bg-gray-300"
        >
          Voltar
        </button>
        <button
          type="button"
          onClick={add}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Adicionar Conteúdo
        </button>
        <button
          type="button"
          onClick={onNext}
          className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
        >
          Próximo
        </button>
      </div>
    </div>
  )
}