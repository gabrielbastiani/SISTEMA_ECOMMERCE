import { AuthContext } from "@/app/contexts/AuthContext"; 
import { setupAPIClientEcommerce } from "@/app/services/apiEcommerce"; 
import React, { useState, useContext } from "react";
import { toast } from "react-toastify";
import ExportDataModal from "../exportDataModal";

interface Column<T> {
    key: keyof T;
    label: string;
}

interface ExportDataProps<T> {
    data: T[];
    customNames?: Record<string, string>;
    table_data: string;
    name_file_export?: string;
    availableColumns: string[];
}

const ExportDataFunctions: React.FC<ExportDataProps<any>> = ({ data, customNames = {}, table_data, name_file_export, availableColumns }) => {

    const { user } = useContext(AuthContext);

    const handleOpenExportData = () => setIsModalOpenExportData(true);
    const [isModalOpenExportData, setIsModalOpenExportData] = useState(false);
    const handleCloseModalExportData = () => setIsModalOpenExportData(false);

    const columns: Column<any>[] = Object.keys(data[0] || {})
        .filter((key) => availableColumns.includes(key))
        .map((key) => ({
            key: key as keyof typeof data[0],
            label: customNames[key] || key,
        }));

    const [selectedColumns, setSelectedColumns] = useState<{
        [key: string]: { selected: boolean; customName: string };
    }>(
        availableColumns.reduce((acc, column) => {
            acc[column] = { selected: false, customName: customNames[column] || column };
            return acc;
        }, {} as { [key: string]: { selected: boolean; customName: string } })
    );

    const selectedKeys = Object.keys(selectedColumns)
        .filter((key) => selectedColumns[key].selected)
        .map((key) => ({
            key,
            customName: selectedColumns[key].customName,
        }));

    const toggleColumnSelection = (columnKey: string) => {
        setSelectedColumns((prev) => ({
            ...prev,
            [columnKey]: {
                ...prev[columnKey],
                selected: !(prev[columnKey]?.selected || false),
            },
        }));
    };

    const handleExportData = async () => {
        const apiClient = setupAPIClientEcommerce();
        const columnsKeys = selectedKeys.map(column => column.key);
        const customColumnNames = selectedKeys.reduce((acc, column) => {
            acc[column.key] = selectedColumns[column.key].customName || column.key;
            return acc;
        }, {} as { [key: string]: string });

        try {
            const response = await apiClient.post('/export_data', {
                userEcommerce_id: user?.id,
                tableName: table_data,
                columns: columnsKeys,
                format: "xlsx",
                customColumnNames,
            }, { responseType: 'blob' });

            const url = window.URL.createObjectURL(new Blob([response.data]));

            const a = document.createElement('a');
            a.href = url;
            a.download = `${name_file_export}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            toast.success("Dados exportados com sucesso");
            handleCloseModalExportData();

        } catch (error) {
            console.error(error);
            toast.error("Erro ao exportar os dados");
        }
    };


    return (
        <>
            <div className="flex justify-end items-center ml-4">
                <button
                    onClick={handleOpenExportData}
                    className="p-2 bg-green-500 text-[#FFFFFF] rounded"
                >
                    Exportar dados
                </button>
            </div>
            <ExportDataModal
                isOpen={isModalOpenExportData}
                columns={columns.map((column) => ({
                    ...column,
                    key: String(column.key),
                }))}
                selectedColumns={selectedColumns}
                onClose={handleCloseModalExportData}
                onColumnToggle={toggleColumnSelection}
                onExport={handleExportData}
                customNames={customNames}
            />
        </>
    );
};

export default ExportDataFunctions;