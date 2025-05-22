'use client'

import { Input } from '@nextui-org/react';
import { ChangeEvent, useEffect, useState } from "react";
import { formatBRL, parseBRL } from '@/utils/currency';

interface CurrencyInputProps {
    value: number | null;  // Permite null para valores inválidos
    onChange: (val: number | null) => void;
    placeholder?: string;
}

export function CurrencyInputUpdate({ value, onChange, placeholder }: CurrencyInputProps) {

    const [rawValue, setRawValue] = useState('');
    const [focused, setFocused] = useState(false);

    useEffect(() => {
        if (!focused) {
            setRawValue(value !== null ? formatBRL(value) : '');
        }
    }, [value, focused]);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setRawValue(e.target.value);
    };

    const handleBlur = () => {
        setFocused(false);
        const num = parseBRL(rawValue);
        onChange(num);
    };

    const handleFocus = () => {
        setFocused(true);
        setRawValue(value !== null ?
            value.toFixed(2).replace('.', ',') :
            ''
        );
    };

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
    );
}