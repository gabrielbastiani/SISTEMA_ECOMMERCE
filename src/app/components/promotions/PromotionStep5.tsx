'use client'

import { Dispatch, SetStateAction, useState, ChangeEvent } from 'react'
import { Button, Tooltip } from '@nextui-org/react'
import { PromotionWizardDto } from 'Types/types'

// Tipo local que estende o BadgeInput original com o File
export type BadgeWithFile = {
  title: string
  imageUrl: string
  file: File
}

interface Props {
  data: PromotionWizardDto & { badges: BadgeWithFile[] }
  setData: Dispatch<SetStateAction<PromotionWizardDto & { badges: BadgeWithFile[] }>>
  onBack: () => void
  onFinish: () => void
}

export default function PromotionStep5({ data, setData, onBack, onFinish }: Props) {
  const [title, setTitle] = useState<string>('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string>('')

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const add = () => {
    if (!title || !file) return
    setData((d: any) => ({
      ...d,
      badges: [
        ...(d.badges || []),
        { title, imageUrl: preview, file }
      ]
    }))
    setTitle('')
    setFile(null)
    setPreview('')
  }

  const remove = (i: number) => {
    setData((d: any) => ({ ...d, badges: d.badges.filter((_: any, j: number) => j !== i) }))
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Passo 5: Selos</h2>

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b bg-gray-100 text-black">
            <th className="p-2">Título</th>
            <th className="p-2">Imagem</th>
            <th className="p-2"></th>
          </tr>
        </thead>
        <tbody>
          {data.badges.map((b, i) => (
            <tr key={i} className="border-b">
              <td className="p-2">{b.title}</td>
              <td className="p-2">
                <img src={b.imageUrl} alt={b.title} className="h-12 object-contain" />
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
            content="Informe um nome para esse selo. (Preenchimento Obrigatório)"
            placement="top-start"
            className="bg-white text-red-500 border border-gray-200 p-2"
          >
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="bg-white border border-gray-200 rounded-md w-full text-black p-2"
              placeholder='Titulo do selo'
            />
          </Tooltip>
        </div>

        <div>
          <label className="block">Imagem do Selo</label>
          <input
            type="file"
            accept="image/*"
            onChange={onFileChange}
            className="border p-1 rounded w-full"
          />
          {preview && (
            <img src={preview} alt="preview" className="mt-2 h-24 object-contain border" />
          )}
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
        <Button
          disabled={!title || !file}
          onClick={add}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Adicionar
        </Button>
        <Button
          onClick={onFinish}
          className="px-4 py-2 bg-violet-500 text-white rounded hover:bg-violet-600"
        >
          Concluir
        </Button>
      </div>
    </div>
  )
}
