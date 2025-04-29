"use client";

import { Suspense } from 'react';
import { useState } from "react";
import { setupAPIClientEcommerce } from '@/app/services/apiEcommerce';
import { SidebarAndHeader } from "../../../components/sidebarAndHeader";
import { Section } from "../../../components/section";
import { TitlePage } from '@/app/components/section/titlePage';
import DataTable from '@/app/components/dataTable';
import Image from "next/image";
import { ModalPasswordChange } from '@/app/components/popups/ModalPasswordChange';
import { MdNotInterested } from "react-icons/md";
import { toast } from "react-toastify";
import moment from "moment";

interface UsersProps {
    name: string;
    id: string;
    photo: string | null;
    status: string;
    role: string;
    email: string;
    created_at: string | number | Date;
    mudar_senha: string;
    last_access: string | number | Date;
}

const statusOptions = ["DISPONIVEL", "INDISPONIVEL"];
const roleOptions = ["SUPER_ADMIN", "ADMIN", "EMPLOYEE"];

export default function All_users() {

    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    const [modalVisiblePassword, setModalVisiblePassword] = useState(false);
    const [userId, setUserId] = useState<string>("");
    const [editingUser, setEditingUser] = useState<{ id: string, field: string } | null>(null);
    const [editedValue, setEditedValue] = useState<string>("");
    const [all_users, setAll_users] = useState<UsersProps[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const [modalImage, setModalImage] = useState<string | null>(null);

    const apiClient = setupAPIClientEcommerce();

    async function fetchUsers({ page, limit, search, orderBy, orderDirection, startDate, endDate }: any) {
        try {
            const response = await apiClient.get(`/user/ecommerce/all_users`, {
                params: { page, limit, search, orderBy, orderDirection, startDate, endDate }
            });
            setAll_users(response.data.users);
            setTotalPages(response.data.totalPages);
        } catch (error) {
            console.log(error);
        }
    }

    function handleCloseModalPassword() {
        setModalVisiblePassword(false);
    }

    async function handleOpenModalPassword(id: string) {
        setModalVisiblePassword(true);
        setUserId(id);
    }

    const handleEdit = (id: string, field: string, currentValue: string) => {
        setEditingUser({ id, field });
        setEditedValue(currentValue);
    };

    const handleSave = async (id: string) => {
        const apiClient = setupAPIClientEcommerce();
        try {

            const updatedField = editingUser?.field === "status" ? { status: editedValue } : { role: editedValue };

            const data = {
                ...updatedField,
                userEcommerce_id: id,
            };

            await apiClient.put(`/user/ecommerce/update`, data);

            setAll_users((prevUsers) =>
                prevUsers.map((user) =>
                    user.id === id ? { ...user, ...updatedField } : user
                )
            );

            setEditingUser(null);
            toast.success("Dado atualizado com sucesso");
        } catch (error) {
            console.log(error);
            toast.error("Erro ao atualizar o dado!!!");
        }
    };

    const handleImageClick = (imageUrl: string) => {
        setModalImage(imageUrl);
    };

    const handleCloseModal = () => {
        setModalImage(null);
    };

    // ---- COLUNAS PARA EXPORTAÇÂO DE DADOS ---- //

    const availableColumns = ["id", "name", "email", "status", "role", "created_at"];

    const customNames: any = {
        id: "ID do usuario",
        name: "Nome",
        email: "Email",
        status: "Status",
        role: "Atribuição",
        created_at: "Data de cadastro"
    };

    // ---- SELECT PARA ORDENAÇÂO DOS ---- //

    const columnsOrder: any = [
        { key: "name", label: "Nome" },
        { key: "email", label: "Email" },
        { key: "created_at", label: "Data de Criação" },
    ];

    const availableColumnsOrder: any = ["name", "created_at", "email"];

    const customNamesOrder: any = {
        name: "Nome Completo",
        created_at: "Data de Registro",
        email: "Email"
    };

    return (
        <SidebarAndHeader>
            <Section>
                <TitlePage title="TODOS OS USUÁRIOS" />

                <Suspense fallback={<div>Carregando...</div>}>
                    <DataTable
                        timeFilterButton={true}
                        checkbox_delete={true}
                        active_buttons_searchInput_comments={false}
                        generate_excel_delete=""
                        delete_bulk_data="/user/ecommerce/delete_user?userEcommerce_id"
                        modal_delete_bulk={false}
                        active_buttons_searchInput_notification={false}
                        active_export_data={true}
                        url_delete_data="/user/ecommerce/delete_user?userEcommerce_id"
                        table_data="userEcommerce"
                        name_file_export="Usuários"
                        data={all_users}
                        columns={[
                            {
                                key: 'photo',
                                label: 'Foto',
                                render: (item) => (
                                    <>
                                        {item.photo ? (
                                            <Image
                                                src={`${API_URL}/files/${item.photo}`}
                                                alt={item.name}
                                                width={80}
                                                height={80}
                                                className="w-8 h-8 rounded-full object-cover cursor-pointer"
                                                onClick={() => handleImageClick(`${API_URL}/files/${item.photo}`)} />
                                        ) : (
                                            <div className="mr-3 w-[50px] h-[50px] rounded-full bg-gray-300 flex items-center justify-center md:w-[40px] md:h-[40px]">
                                                <MdNotInterested color="black" size={25} />
                                            </div>
                                        )}
                                    </>
                                ),
                            },
                            { key: "name", label: "Nome" },
                            { key: "email", label: "Email" },
                            {
                                key: 'status',
                                label: 'Status',
                                render: (item) => (
                                    editingUser?.id === item.id && editingUser?.field === "status" ? (
                                        <select
                                            value={editedValue || item.status}
                                            onChange={(e) => setEditedValue(e.target.value)}
                                            onBlur={() => handleSave(item.id)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    handleSave(item.id);
                                                }
                                            }}
                                            className="appearance-auto text-black border-gray-300 rounded-md p-1"
                                        >
                                            {statusOptions.map((status) => (
                                                <option key={status} value={status}>
                                                    {status}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <span
                                            onClick={() => handleEdit(item.id, "status", item.status)}
                                            className="cursor-pointer text-red-500 hover:underline"
                                        >
                                            {item.status}
                                        </span>
                                    )
                                ),
                            },
                            {
                                key: 'role',
                                label: 'Atribuição',
                                render: (item) => (
                                    editingUser?.id === item.id && editingUser?.field === "role" ? (
                                        <select
                                            value={editedValue || item.role}
                                            onChange={(e) => setEditedValue(e.target.value)}
                                            onBlur={() => handleSave(item.id)}
                                            className="appearance-auto text-black border-gray-300 rounded-md p-1"
                                        >
                                            {roleOptions.map((role) => (
                                                <option key={role} value={role}>
                                                    {role === "SUPER_ADMIN"
                                                        ? "Super administrador"
                                                        : role === "ADMIN"
                                                            ? "Administrador"
                                                            : role === "EMPLOYEE"
                                                                ? "Empregado"
                                                                : null}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <span
                                            onClick={() => handleEdit(item.id, "role", item.role)}
                                            className="cursor-pointer text-backgroundButton hover:underline"
                                        >
                                            {item.role === "SUPER_ADMIN"
                                                ? "Super administrador"
                                                : item.role === "ADMIN"
                                                    ? "Administrador"
                                                    : item.role === "EMPLOYEE"
                                                        ? "Empregado"
                                                        : null}
                                        </span>
                                    )
                                ),
                            },
                            {
                                key: 'mudar_senha',
                                label: 'Mudar senha',
                                render: (item) => (
                                    <button
                                        className='p-1 bg-red-600 text-[#FFFFFF] text-xs rounded hover:bg-hoverButtonBackground transition duration-300'
                                        onClick={() => handleOpenModalPassword(item.id)}
                                    >
                                        Mudar senha
                                    </button>
                                ),
                            },
                            {
                                key: "last_access",
                                label: "Último acesso",
                                render: (item) => (
                                    <>
                                        {!item.last_access ? (
                                            <span>Sem acesso</span>
                                        ) :
                                            <span>{moment(item.last_access).format('DD/MM/YYYY HH:mm')}</span>
                                        }
                                    </>
                                ),
                            },
                        ]}
                        totalPages={totalPages}
                        onFetchData={fetchUsers}
                        availableColumns={availableColumns}
                        customNames={customNames}
                        columnsOrder={columnsOrder}
                        availableColumnsOrder={availableColumnsOrder}
                        customNamesOrder={customNamesOrder}
                    />
                </Suspense>
                {/* Modal for image preview */}
                {modalImage && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
                        <div className="relative">
                            <Image src={modalImage} alt="Category Image" width={500} height={500} className="rounded" />
                            <button
                                onClick={handleCloseModal}
                                className="absolute top-0 right-0 mt-2 mr-2 text-[#FFFFFF] text-2xl font-bold"
                            >
                                &times;
                            </button>
                        </div>
                    </div>
                )}
            </Section>
            {modalVisiblePassword && (
                <ModalPasswordChange
                    isOpen={modalVisiblePassword}
                    onRequestClose={handleCloseModalPassword}
                    id_users={userId}
                    link_update_senha="/user/ecommerce/update"
                />
            )}
        </SidebarAndHeader>
    );
}