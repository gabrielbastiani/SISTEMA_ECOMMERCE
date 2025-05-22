"use client"

import { useState } from 'react'
import { Button } from '@nextui-org/react'
import { InformationCircleIcon } from '@heroicons/react/24/outline'
import { VariantVsRelationInfo } from './VariantVsRelationInfo'

export function CollapsibleInfo() {
    const [open, setOpen] = useState(false)
    return (
        <div className="mb-6">
            <Button
                size="sm"
                variant="light"
                className="flex items-center space-x-2"
                onClick={() => setOpen(o => !o)}
            >
                <InformationCircleIcon className="w-5 h-5" />
                <span className='text-orange-400'>{open ? 'Ocultar Dicas' : 'Ver Dicas: Variantes x Relações'}</span>
            </Button>
            {open && <VariantVsRelationInfo />}
        </div>
    )
}
