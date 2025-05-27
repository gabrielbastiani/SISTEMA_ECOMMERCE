'use client'

import React from 'react'
import { Button, Tooltip } from '@nextui-org/react'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import Image from 'next/image'

interface VideoLinksManagerProps {
    links: { url: string; thumbnail?: string }[]
    onLinksChange: (links: { url: string; thumbnail?: string }[]) => void
    label?: string
}

// Extrai videoId de URL do YouTube
function extractYouTubeId(url: string): string | null {
    const regExp = /(?:v=|\/)([0-9A-Za-z_-]{11})/
    const match = url.match(regExp)
    return match ? match[1] : null
}

export const VideoLinksManager: React.FC<VideoLinksManagerProps> = ({
    links,
    onLinksChange,
    label = 'Vídeos'
}) => {
    const handleAddEmpty = () => {
        onLinksChange([...links, { url: '', thumbnail: undefined }])
    }

    const handleUrlChange = (index: number, url: string) => {
        const id = extractYouTubeId(url)
        const thumb = id ? `https://img.youtube.com/vi/${id}/0.jpg` : undefined
        const updated = [...links]
        updated[index] = { url, thumbnail: thumb }
        onLinksChange(updated)
    }

    const handleRemove = (index: number) => {
        const updated = links.filter((_, i) => i !== index)
        onLinksChange(updated)
    }

    return (
        <div className="space-y-4">
            <label className="block text-sm font-medium mb-1">{label}</label>
            {links.map((v, i) => (
                <div key={i} className="flex items-center gap-2">
                    <input
                        type="url"
                        className="border p-2 rounded flex-1 text-black"
                        value={v.url}
                        placeholder="URL do YouTube"
                        pattern="^(https?://)?(www\.)?(youtube\.com|youtu\.be)/.+"
                        onChange={e => {handleUrlChange(i, e.target.value)}}
                    />
                    {v.thumbnail && (
                        <div className="w-24 h-14 relative">
                            <Image
                                src={v.thumbnail}
                                alt="Thumb"
                                fill
                                className="object-cover rounded"
                                unoptimized
                            />
                        </div>
                    )}
                    <Tooltip content="Remover" placement="top">
                        <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={() => handleRemove(i)}
                        >
                            <TrashIcon className="h-5 w-5 text-red-600" />
                        </Button>
                    </Tooltip>
                </div>
            ))}
            <Button
                className='text-orange-500'
                size="sm"
                variant="bordered"
                startContent={<PlusIcon className="h-5 w-5" />}
                onPress={handleAddEmpty}
            >
                Adicionar vídeo
            </Button>
        </div>
    )
}