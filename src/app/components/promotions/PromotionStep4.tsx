'use client'
import { Dispatch, SetStateAction, useState } from 'react'
import { Button, Input } from '@nextui-org/react'
import { Editor } from '@tinymce/tinymce-react'
import { CreatePromotionDto, PromotionWizardDto } from 'Types/types'

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
          <tr className="border-b">
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
          <label className="block">Título</label>
          <Input value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="block">Tipo</label>
          <select
            className="w-full border p-2 rounded"
            value={type}
            onChange={e => setType(e.target.value as any)}
          >
            <option value="SPOT">Spot</option>
            <option value="PRODUCT_PAGE">Página do produto</option>
          </select>
        </div>
        <div>
          <label className="block">Conteúdo</label>
          <Editor
            apiKey={TOKEN_TINY}
            init={{ height: 200, menubar: false, plugins: ['link', 'lists', 'code'], toolbar: 'undo redo | bold italic | bullist numlist | code' }}
            value={content}
            onEditorChange={c => setContent(c)}
          />
        </div>
      </div>

      <div className="flex justify-between">
        <Button onClick={onBack}>Voltar</Button>
        <Button onClick={add}>Adicionar</Button>
        <Button onClick={onNext}>Próximo</Button>
      </div>
    </div>
  )
}