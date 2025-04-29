import React from 'react';

interface OrderSelectProps {
    orderBy: string;
    orderDirection: string;
    columns: { key: any; label: string; }[];
    onOrderByChange: (value: string) => void;
    onOrderDirectionChange: (value: string) => void;
    availableColumns?: string[];
    customNames?: { [key: string]: string };
}

const OrderSelect: React.FC<OrderSelectProps> = ({
    orderBy,
    orderDirection,
    columns,
    onOrderByChange,
    onOrderDirectionChange,
    availableColumns,
    customNames
}) => {
    const filteredColumns = columns.filter((column) =>
        availableColumns ? availableColumns.includes(column.key) : true
    );

    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full">
            <select
                value={orderBy}
                onChange={(e) => onOrderByChange(e.target.value)}
                className="border p-2 rounded text-black w-full sm:w-auto"
            >
                {filteredColumns.map((column) => (
                    <option className="text-black" key={column.key} value={column.key}>
                        Ordenar por {customNames?.[column.key] || column.label}
                    </option>
                ))}
            </select>

            <select
                value={orderDirection}
                onChange={(e) => onOrderDirectionChange(e.target.value)}
                className="border p-2 rounded text-black w-full sm:w-auto"
            >
                <option className="text-black" value="asc">Ascendente</option>
                <option className="text-black" value="desc">Descendente</option>
            </select>
        </div>
    );
};

export default OrderSelect;