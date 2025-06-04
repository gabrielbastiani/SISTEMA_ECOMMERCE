'use client'

import React from 'react'
import { Button, Tooltip } from '@nextui-org/react'
import { PlusIcon, TrashIcon, InformationCircleIcon } from '@heroicons/react/24/outline'
import Image from 'next/image'

interface VideoLink {
    url: string
    thumbnail?: string
}

interface VideoLinksManagerUpdateProps {
    links: VideoLink[]
    onLinksChange: (links: VideoLink[]) => void
}

// Extrai o ID do YouTube para gerar thumbnail
function extractYouTubeId(url: string): string | null {
    const regExp = /(?:v=|\/)([0-9A-Za-z_-]{11})/
    const match = url.match(regExp)
    return match ? match[1] : null
}

export const VideoLinksManagerUpdate: React.FC<VideoLinksManagerUpdateProps> = ({
    links,
    onLinksChange
}) => {
    const handleAdd = () => {
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
        onLinksChange(links.filter((_, i) => i !== index))
    }

    return (
        <div className="space-y-4 max-w-3xl">
            <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium text-black">Videos</h3>
            </div>

            {links.map((v, i) => (
                <div key={i} className="flex items-center gap-2">
                    <input
                        type="url"
                        className="flex-1 border border-gray-300 rounded-md px-2 py-1 text-black"
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={v.url}
                        onChange={(e) => handleUrlChange(i, e.target.value)}
                    />
                    {v.thumbnail && (
                        <div className="w-24 h-14 relative rounded overflow-hidden">
                            <Image
                                src={v.thumbnail}
                                alt="Thumbnail do vídeo"
                                fill
                                className="object-cover"
                                unoptimized
                            />
                        </div>
                    )}
                    <Tooltip content="Remover vídeo" placement="top">
                        <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            className="text-red-500"
                            onPress={() => handleRemove(i)}
                        >
                            <TrashIcon className="h-5 w-5" />
                        </Button>
                    </Tooltip>
                </div>
            ))}

            <Button
                size="sm"
                variant="bordered"
                startContent={<PlusIcon className="h-5 w-5 text-orange-500" />}
                onPress={handleAdd}
                className="text-orange-600 border-orange-600 hover:bg-orange-50"
            >
                Adicionar vídeo
            </Button>
        </div>
    )
}