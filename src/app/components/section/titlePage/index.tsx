"use client"

import { IoArrowUndoSharp } from "react-icons/io5";
import { useRouter } from 'next/navigation';

interface TitleProps {
    title: string;
}

export function TitlePage({ title }: TitleProps) {

    const router = useRouter();

    return (
        <div className="flex">
            <IoArrowUndoSharp
                color="white"
                style={{ cursor: 'pointer', marginRight: '15' }}
                size={40}
                onClick={() => router.back()}
            />
            <h1 className="font-bold text-2xl md:text-4xl mb-8 md:mb-16 text-left">
                {title}
            </h1>
        </div>
    )
}