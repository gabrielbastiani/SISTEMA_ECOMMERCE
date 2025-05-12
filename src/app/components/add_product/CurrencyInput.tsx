'use client';

import { Input } from '@nextui-org/react';
import { useState, useEffect, FocusEvent, ChangeEvent } from 'react';
import { formatBRL, parseBRL } from '@/utils/currency';

interface CurrencyInputProps {
    value: number;
    onChange: (val: number) => void;
    placeholder?: string;
}

export function CurrencyInput({ value, onChange, placeholder }: CurrencyInputProps) {
    // rawValue = o texto que aparece no input
    const [rawValue, setRawValue] = useState('');
    // focused: evita reformatar enquanto digita
    const [focused, setFocused] = useState(false);

    // Quando value externo muda e não estamos focados, atualiza rawValue formatado
    useEffect(() => {
        if (!focused) {
            setRawValue(formatBRL(value));
        }
    }, [value, focused]);

    // Ao digitar: só atualiza rawValue
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setRawValue(e.target.value);
    };

    // Ao sair do campo: parseia rawValue, avisa onChange e formata
    const handleBlur = (_: FocusEvent<HTMLInputElement>) => {
        setFocused(false);
        const num = parseBRL(rawValue);
        onChange(num);
        setRawValue(formatBRL(num));
    };

    // Ao focar: exibimos o número puro para facilitar edição
    const handleFocus = (_: FocusEvent<HTMLInputElement>) => {
        setFocused(true);
        // exibe sem prefixo "R$ " e sem pontos, mantendo vírgula
        const num = parseBRL(rawValue);
        setRawValue(num
            .toFixed(2)     // "1234.56"
            .replace('.', ',')  // "1234,56"
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