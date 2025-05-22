'use client'

import { Input } from '@nextui-org/react'
import { useState, useEffect, FocusEvent, ChangeEvent } from 'react'
import { formatBRL, parseBRL } from '@/utils/currency'

interface CurrencyInputProps {
    value: number | undefined  // Permite undefined
    onChange: (value: number) => void
    placeholder?: string
}

export function CurrencyInput({ value, onChange, placeholder }: CurrencyInputProps) {
    const [rawValue, setRawValue] = useState('')
    const [focused, setFocused] = useState(false)

    useEffect(() => {
        if (!focused) {
            setRawValue(formatBRL(value || 0))  // Trata undefined como 0
        }
    }, [value, focused])

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setRawValue(e.target.value)
    }

    const handleBlur = (_: FocusEvent<HTMLInputElement>) => {
        setFocused(false)
        const num = parseBRL(rawValue)
        onChange(num)
        setRawValue(formatBRL(num))
    }

    const handleFocus = (_: FocusEvent<HTMLInputElement>) => {
        setFocused(true)
        const num = parseBRL(rawValue)
        setRawValue(num.toFixed(2).replace('.', ','))
    }

    return (
        <Input
            type="text"
            placeholder={placeholder ?? ''}
            value={rawValue}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className="bg-white text-black"
        />
    )
}