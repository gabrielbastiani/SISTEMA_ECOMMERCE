import React from "react";
import { AiOutlineClose } from "react-icons/ai";

interface ExportDataModalProps {
    isOpen: boolean;
    columns: { key: string; label: string }[];
    selectedColumns: Record<string, { selected: boolean; customName: string }>;
    onClose: () => void;
    onColumnToggle: (key: string) => void;
    onExport: () => void;
    customNames: any;
}

const ExportDataModal: React.FC<ExportDataModalProps> = ({
    isOpen,
    columns,
    selectedColumns,
    onClose,
    onColumnToggle,
    onExport,
    customNames = {},
}) => {
    if (!isOpen) return null;

    const getColumnName = (columnKey: string, defaultLabel: string) => {
        return customNames[columnKey] || defaultLabel;
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-auto relative">
                <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">
                    <AiOutlineClose size={24} color="black" />
                </button>
                <h2 className="mb-4 text-black">Selecione os dados a serem exportados</h2>
                <div>
                    {columns.map((column) => (
                        <div key={column.key} className="flex items-center mb-2">
                            <input
                                type="checkbox"
                                checked={selectedColumns[column.key]?.selected || false}
                                onChange={() => onColumnToggle(column.key)}
                            />
                            <label className="ml-2 text-black">{getColumnName(column.key, column.label)}</label>
                        </div>
                    ))}
                </div>
                <div className="flex justify-end mt-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 mr-2">
                        Cancelar
                    </button>
                    <button onClick={onExport} className="px-4 py-2 bg-backgroundButton text-black rounded hover:bg-hoverButtonBackground">
                        Exportar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExportDataModal;