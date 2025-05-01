import { AuthContext } from "@/app/contexts/AuthContext"; 
import { setupAPIClientEcommerce } from "@/app/services/apiEcommerce"; 
import { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";

interface BulkProps {
    link_donwload: string;
    name_file: string;
    link_register_data: string;
}

export function BulkDatas({ link_donwload, name_file, link_register_data }: BulkProps) {

    const { user } = useContext(AuthContext);

    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setFile(event.target.files[0]);
        }
    };

    const handleDownload = async () => {
        setIsLoading(true);

        try {
            const apiClient = setupAPIClientEcommerce();
            const response = await apiClient.get(`${link_donwload}=${user?.id}`, { responseType: "blob" });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `${name_file}`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast.success("Arquivo Excel pronto para download!");
        } catch (error) {
            console.error(error);
            toast.error("Erro ao gerar o arquivo Excel.");
        } finally {
            setIsLoading(false);
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
            await apiClient.post(`${link_register_data}=${user?.id}`, formData, {
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
        }
    };

    return (
        <div className="w-full max-w-md md:max-w-none space-y-6">

            <h2 className="text-xl font-semibold text-[#FFFFFF]">Cadastro em massa</h2>

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
                        className="block w-full text-sm text-gray-500 file:py-3 file:px-4 file:rounded-md file:border file:border-gray-300 file:text-gray-700 file:bg-gray-50 hover:file:bg-gray-100"
                    />
                </div>

                {isMounted && file && (
                    <div className="bg-gray-100 p-2 rounded-md w-48">
                        <span className="text-sm text-gray-700">
                            Arquivo Selecionado: <strong>{file.name}</strong>
                        </span>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isLoading}
                    className={`px-6 py-3 bg-orange-500 text-[#FFFFFF] rounded-md hover:bg-orange-600 transition duration-300 ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                    {isLoading ? "Carregando..." : "Carregar Arquivo"}
                </button>
            </form>

        </div>
    );
};

export default BulkDatas;