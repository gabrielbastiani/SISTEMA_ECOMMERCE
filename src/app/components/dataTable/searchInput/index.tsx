import React from 'react';

interface SearchInputProps {
    value: string;
    onChange: (value: string) => void;
    onReset: () => void;
    active_buttons_searchInput_notification: boolean;
    active_buttons_searchInput_comments: boolean;
}

const SearchInput: React.FC<SearchInputProps> = ({ value, onChange, onReset, active_buttons_searchInput_notification, active_buttons_searchInput_comments }) => {

    const filterValuesNotification = [
        { label: "Usuário", value: "USER" },
        { label: "Formulário de Contato", value: "CONTACT_FORM" },
        { label: "Postagem", value: "PRODUCT" },
        { label: "Newsletter", value: "NEWSLETTER" },
        { label: "Exportar Dados", value: "REPORT" },
        { label: "Comentário", value: "CONTACT_ORDER" },
        { label: "Categoria", value: "CATEGORY" }
    ];

    const filterValuesComment = [
        { label: "Pendente", value: "pendente" },
        { label: "Aprovado", value: "aprovado" },
        { label: "Recusado", value: "recusado" }
    ];

    return (
        <div className="flex flex-col items-start space-y-2">
            {active_buttons_searchInput_notification ? (
                <div className="flex flex-wrap space-x-2 mb-4 items-center">
                    <span className="text-sm md:text-base">Filtrar por tipo:</span>
                    {filterValuesNotification.map((filter) => (
                        <button
                            key={filter.value}
                            onClick={() => onChange(filter.value)}
                            className="px-2 py-1 bg-gray-400 text-black rounded text-xs md:text-sm mt-2"
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>
            ) : null}

            {active_buttons_searchInput_comments ? (
                <div className="flex flex-wrap space-x-2 mb-4 items-center">
                    <span className="text-sm md:text-base">Filtrar por tipo:</span>
                    {filterValuesComment.map((filter) => (
                        <button
                            key={filter.value}
                            onClick={() => onChange(filter.value)}
                            className="px-2 py-1 bg-gray-400 text-black rounded text-xs md:text-sm mt-2"
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>
            ) : null}

            <div className="flex flex-col md:flex-row items-center w-full md:w-auto">
                <input
                    type="text"
                    placeholder="Buscar"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="border p-2 rounded w-full md:w-96 text-black"
                />
                <button onClick={onReset} className="mt-2 md:mt-0 md:ml-2 p-2 bg-red-500 text-[#FFFFFF] rounded">
                    Resetar
                </button>
            </div>
        </div>
    );
};

export default SearchInput;