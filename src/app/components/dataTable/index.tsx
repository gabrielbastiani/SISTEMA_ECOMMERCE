import { JSX, Suspense } from "react";
import { useContext, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { setupAPIClientEcommerce } from "@/app/services/apiEcommerce"; 
import { toast } from "react-toastify";
import ConfirmDeleteModal from "./confirmDeleteModal";
import TimeFilterModal from "./timeFilterModal";
import SearchInput from "./searchInput";
import OrderSelect from "./orderSelect";
import PaginationControls from "./paginationControls";
import ExportDataFunctions from "./exportDataFunctions";
import BulkDeleteData from "./bulkDeleteData";
import { AuthContext } from "@/app/contexts/AuthContext"; 

interface Column<T> {
    key: keyof T;
    label: string;
    render?: (item: T) => JSX.Element;
}

interface DataTableProps<T extends { id: string }> {
    timeFilterButton: boolean;
    generate_excel_delete: string;
    delete_bulk_data: string;
    modal_delete_bulk: boolean;
    active_buttons_searchInput_notification: boolean;
    active_buttons_searchInput_comments: boolean;
    checkbox_delete: boolean;
    active_export_data: boolean;
    customNamesOrder: {};
    availableColumnsOrder: string[];
    columnsOrder: any;
    availableColumns: string[];
    customNames?: {};
    name_file_export?: string;
    table_data: string;
    url_item_router?: string;
    url_delete_data: string;
    data: T[];
    columns: Column<T>[];
    totalPages: number;
    onFetchData: (
        params: {
            page: number;
            limit: number;
            search: string;
            orderBy: string;
            orderDirection: string,
            startDate?: string,
            endDate?: string
        }) => void;
}

function DataTable<T extends {
    photo?: any;
    name?: string;
    status?: string;
    role?: string;
    created_at?: string | number | Date; id: string
}>({
    timeFilterButton,
    generate_excel_delete,
    delete_bulk_data,
    modal_delete_bulk,
    active_buttons_searchInput_notification,
    active_buttons_searchInput_comments,
    checkbox_delete,
    active_export_data,
    availableColumnsOrder,
    customNamesOrder,
    columnsOrder,
    availableColumns,
    customNames,
    name_file_export,
    table_data,
    url_item_router,
    url_delete_data,
    data,
    columns,
    totalPages,
    onFetchData,
}: DataTableProps<T>) {

    const { user } = useContext(AuthContext);

    const router = useRouter();
    const searchParams = useSearchParams();

    const [search, setSearch] = useState(searchParams.get("search") || "");
    const [orderBy, setOrderBy] = useState("created_at");
    const [orderDirection, setOrderDirection] = useState("desc");
    const [limit, setLimit] = useState(Number(searchParams.get("limit")) || 5);
    const [currentPage, setCurrentPage] = useState(Number(searchParams.get("page")) || 1);
    const [modalVisibleDelete, setModalVisibleDelete] = useState(false);
    const [selectdData, setSelectdData] = useState<string[]>([]);
    const [startDate, setStartDate] = useState(searchParams.get("startDate") || "");
    const [endDate, setEndDate] = useState(searchParams.get("endDate") || "");
    const [isModalOpenTimeData, setIsModalOpenTimeData] = useState(false);
    const handleOpenTimeData = () => setIsModalOpenTimeData(true);
    const [isModalOpenBulkDeleteData, setIsModalOpenBulkDeleteData] = useState(false);
    const handleOpenBulkDeleteData = () => setIsModalOpenBulkDeleteData(true);
    const handleCloseModalBulkDeleteData = () => setIsModalOpenBulkDeleteData(false);
    const handleCloseModalTimeData = () => setIsModalOpenTimeData(false);

    useEffect(() => {
        const initialSearch = searchParams.get("search") || "";
        const initialOrderBy = searchParams.get("orderBy") || "created_at";
        const initialOrderDirection = searchParams.get("orderDirection") || "desc";
        const initialLimit = Number(searchParams.get("limit")) || 5;
        const initialCurrentPage = Number(searchParams.get("page")) || 1;
        const initialStartDate = searchParams.get("startDate") || "";
        const initialEndDate = searchParams.get("endDate") || "";

        setSearch(initialSearch);
        setOrderBy(initialOrderBy);
        setOrderDirection(initialOrderDirection);
        setLimit(initialLimit);
        setCurrentPage(initialCurrentPage);
        setStartDate(initialStartDate);
        setEndDate(initialEndDate);

    }, [searchParams]);

    const updateUrlParams = () => {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (orderBy) params.set("orderBy", orderBy);
        if (orderDirection) params.set("orderDirection", orderDirection);
        if (limit) params.set("limit", limit.toString());
        if (currentPage) params.set("page", currentPage.toString());
        if (startDate) params.set("startDate", startDate);
        if (endDate) params.set("endDate", endDate);

        router.replace(`?${params.toString()}`);
    };

    useEffect(() => {
        updateUrlParams();
    }, [search, orderBy, orderDirection, limit, currentPage, startDate, endDate]);

    useEffect(() => {
        onFetchData({ page: currentPage, limit, search, orderBy, orderDirection, startDate, endDate });
    }, [currentPage, limit, orderBy, orderDirection, search, startDate, endDate]);

    function handleLimitChange(e: React.ChangeEvent<HTMLSelectElement>) {
        setLimit(Number(e.target.value));
        setCurrentPage(1);
    }

    function handleResetFilters() {
        setSearch("");
        setOrderBy("created_at");
        setOrderDirection("desc");
        setLimit(5);
        setCurrentPage(1);
        setStartDate("");
        setEndDate("");
        router.replace("");
    }

    async function handleDelete() {
        if (selectdData.length === 0) {
            alert("Nenhum dado selecionado.");
            return;
        }
        setModalVisibleDelete(true);
    }

    const handleCloseModal = () => {
        setModalVisibleDelete(false);
    };

    async function handleDeleteData() {
        try {
            const apiClient = setupAPIClientEcommerce();
            await apiClient.delete(`${url_delete_data}`, {
                data: {
                    userEcommerce_id: user?.id || null,
                    name: user?.name || null,
                    id_delete: selectdData
                }
            });

            toast.success(`Dado(s) deletados com sucesso`);
            setSelectdData([]);
            onFetchData({ page: currentPage, limit, search, orderBy, orderDirection });

            setModalVisibleDelete(false);

        } catch (error) {
            if (error instanceof Error && 'response' in error && error.response) {
                console.log((error as any).response.data);
                toast.error('Ops, erro ao deletar o(s) dado(s).');
            } else {
                console.error(error);
                toast.error('Erro desconhecido.');
            }
        }
    }

    function handleSelectContact(id: string) {
        setSelectdData((prev) =>
            prev.includes(id) ? prev.filter((contactId) => contactId !== id) : [...prev, id]
        );
    }

    function handleSelectAll() {
        if (selectdData.length === data.length) {
            setSelectdData([]);
        } else {
            setSelectdData(data.map((contact) => contact.id));
        }
    }

    const handleDateChange = (start: string, end: string) => {
        setStartDate(start);
        setEndDate(end);
        setCurrentPage(1);
    };


    return (
        <Suspense fallback={<p>Carregando...</p>}>
            <div>
                <div className="mb-4 flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
                    <div className="flex flex-col md:flex-row items-center w-full md:w-auto">
                        <SearchInput
                            active_buttons_searchInput_notification={active_buttons_searchInput_notification}
                            active_buttons_searchInput_comments={active_buttons_searchInput_comments}
                            value={search}
                            onChange={setSearch}
                            onReset={handleResetFilters}
                        />
                    </div>
                    <div className="flex flex-col md:flex-row items-center w-full md:w-auto">
                        <OrderSelect
                            orderBy={orderBy}
                            orderDirection={orderDirection}
                            columns={columnsOrder}
                            onOrderByChange={setOrderBy}
                            onOrderDirectionChange={setOrderDirection}
                            availableColumns={availableColumnsOrder}
                            customNames={customNamesOrder}
                        />
                        {timeFilterButton ?
                            <button
                                onClick={handleOpenTimeData}
                                className="mt-2 md:mt-0 md:ml-2 p-2 bg-gray-500 text-[#FFFFFF] rounded w-full md:w-auto"
                            >
                                Por data
                            </button>
                            :
                            null
                        }
                        <TimeFilterModal
                            isOpen={isModalOpenTimeData}
                            onClose={handleCloseModalTimeData}
                            onDateChange={handleDateChange}
                        />
                        {selectdData.length > 0 && (
                            <div className="flex justify-end items-center ml-4">
                                {selectdData.length > 0 && (
                                    <button onClick={handleDelete} className="p-2 bg-red-500 text-[#FFFFFF] rounded">
                                        Deletar {selectdData.length} dado(s)
                                    </button>
                                )}
                            </div>
                        )}
                        {user?.role === "SUPER_ADMIN" ?
                            <>
                                {modal_delete_bulk ?
                                    <>
                                        <button
                                            onClick={handleOpenBulkDeleteData}
                                            className="mt-2 md:mt-0 md:ml-2 p-2 bg-gray-500 text-[#FFFFFF] rounded w-full md:w-auto"
                                        >
                                            Deletar em massa
                                        </button>
                                        <BulkDeleteData
                                            generate_excel_delete={generate_excel_delete}
                                            isOpen={isModalOpenBulkDeleteData}
                                            onClose={handleCloseModalBulkDeleteData}
                                            delete_bulk_data={delete_bulk_data}
                                        />
                                    </>
                                    :
                                    null
                                }
                            </>
                            :
                            null
                        }
                        {active_export_data ? (
                            <ExportDataFunctions
                                data={data}
                                table_data={table_data}
                                name_file_export={name_file_export}
                                availableColumns={availableColumns}
                                customNames={customNames}
                            />
                        ) :
                            null
                        }
                        {modalVisibleDelete && (
                            <ConfirmDeleteModal
                                isOpen={modalVisibleDelete}
                                onClose={handleCloseModal}
                                onConfirm={handleDeleteData}
                            />
                        )}
                    </div>
                </div>
                {/* Tabela */}
                <div className="overflow-x-auto">
                    <table className="border rounded min-w-full table-auto">
                        <thead>
                            <tr className="border-b">
                                <th className="p-3 text-left">
                                    {checkbox_delete ? (
                                        <input
                                            type="checkbox"
                                            onChange={handleSelectAll}
                                            checked={selectdData.length === data.length}
                                        />
                                    ) :
                                        null
                                    }
                                </th>
                                {columns.map((column) => (
                                    <th key={String(column.key)} className="p-3 text-left">
                                        {column.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item) => (
                                <tr key={item.id} className="border-b">
                                    {checkbox_delete ? (
                                        <td className="p-3">
                                            <input
                                                type="checkbox"
                                                checked={selectdData.includes(item.id)}
                                                onChange={() => handleSelectContact(item.id)}
                                            />
                                        </td>
                                    ) :
                                        <td></td>
                                    }
                                    {columns.map((column, index) => (
                                        <td
                                            key={index}
                                            onClick={
                                                url_item_router
                                                    ? () => router.push(`${url_item_router}/${item.id}`)
                                                    : undefined
                                            }
                                            className={url_item_router ? 'cursor-pointer' : ''}
                                        >
                                            {column.render ? (column.render(item) as React.ReactNode) : (item[column.key] as React.ReactNode)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {/* Paginação */}
                <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                    <div className="flex justify-center sm:justify-between w-full sm:w-80 space-x-2">
                        <button
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="p-2 bg-gray-300 rounded disabled:opacity-50 text-black w-full sm:w-auto"
                        >
                            Anterior
                        </button>
                        <PaginationControls
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                        <button
                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="p-2 bg-gray-300 rounded disabled:opacity-50 text-black w-full sm:w-auto"
                        >
                            Próxima
                        </button>
                    </div>
                    <div className="flex items-center w-full sm:w-auto">
                        <label htmlFor="limit" className="mr-2">Itens por página:</label>
                        <select
                            id="limit"
                            value={limit}
                            onChange={handleLimitChange}
                            className="border p-2 rounded text-black"
                        >
                            <option value="5">5</option>
                            <option value="10">10</option>
                            <option value="20">20</option>
                        </select>
                    </div>
                </div>
            </div>
        </Suspense>
    );
}

export default DataTable;