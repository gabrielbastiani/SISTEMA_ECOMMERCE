export const brlFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

export function formatBRL(value: number): string {
    return brlFormatter.format(value);
}

// de "1.234,56" ou "1234,56" retorna 1234.56
export function parseBRL(str: string): number {
    const cleaned = str.replace(/[^\d,]/g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
}