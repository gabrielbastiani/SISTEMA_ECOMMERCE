import { AuthContext } from "@/app/contexts/AuthContext"; 
import { setupAPIClientEcommerce } from "@/app/services/apiEcommerce"; 
import { useContext, useState } from "react";
import { AiOutlineClose } from "react-icons/ai";
import { toast } from "react-toastify";

interface BulkDataProps {
    isOpen: boolean;
    onClose: () => void;
    delete_bulk_data: string;
    generate_excel_delete: string;
}

const BulkDeleteData: React.FC<BulkDataProps> = ({ isOpen, onClose, delete_bulk_data, generate_excel_delete }) => {

    if (!isOpen) return null;

    const { user } = useContext(AuthContext);

    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setFile(event.target.files[0]);
        }
    };

    const handleDownload = async () => {
        setIsLoading(true);

        try {
            const apiClient = setupAPIClientEcommerce();
            const response = await apiClient.get(`${generate_excel_delete}=${user?.id}`, { responseType: "blob" });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "modelo_de dados.xlsx");
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast.success("Arquivo Excel pronto para download!");
        } catch (error) {
            console.error(error);
            toast.error("Erro ao gerar o arquivo Excel.");
        } finally {
            setIsLoading(false);
            onClose();
        }
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!file) {
            toast.error("Por favor, selecione um arquivo.");
            return;
        }

        setIsLoading(true);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const apiClient = setupAPIClientEcommerce();
            await apiClient.post(`${delete_bulk_data}=${user?.id}`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            toast.success("Arquivo carregado com sucesso!");

        } catch (error) {
            console.error(error);
            toast.error("Ocorreu um erro ao carregar o arquivo. Tente novamente.");
        } finally {
            setIsLoading(false);
            setFile(null);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-auto relative">
                <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">
                    <AiOutlineClose size={24} />
                </button>
                <div className="mt-6">
                    <h3 className="font-semibold text-black mb-2">Deletar via planilha</h3>

                    <form className="space-y-4">
                        <button
                            type="button"
                            onClick={handleDownload}
                            disabled={isLoading}
                            className={`px-6 py-3 bg-gray-400 text-[#FFFFFF] rounded-md hover:bg-hoverButtonBackground transition duration-300 ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                            {isLoading ? "Gerando..." : "Baixar modelo de arquivo"}
                        </button>
                    </form>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="cursor-pointer">
                            <input
                                type="file"
                                accept=".xlsx"
                                onChange={handleFileChange}
                                className="block w-full text-sm text-gray-500 file:py-3 file:px-4 file:rounded-md file:border file:border-gray-300 file:text-gray-700 file:bg-gray-50 hover:file:bg-gray-100 mt-5"
                            />
                        </div>

                        {file && (
                            <div className="bg-gray-100 p-2 rounded-md w-48">
                                <span className="text-sm text-gray-700">Arquivo Selecionado: <strong>{file.name}</strong></span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`px-6 py-3 bg-backgroundButton text-[#FFFFFF] rounded-md hover:bg-hoverButtonBackground mt-5 transition duration-300 ${isLoading ? "opacity-50 cursor-not-allowed mt-5" : ""}`}
                        >
                            {isLoading ? "Carregando..." : "Carregar Arquivo"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default BulkDeleteData;