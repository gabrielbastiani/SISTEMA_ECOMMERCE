import { AiOutlineClose } from "react-icons/ai";

interface ConfirmDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

function ConfirmDeleteModal({ isOpen, onClose, onConfirm }: ConfirmDeleteModalProps) {

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-auto relative">
                <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">
                    <AiOutlineClose size={24} color="black" />
                </button>
                <h2 className="text-black mb-4">Confirma a exclusão dos dados selecionados?</h2>
                <div className="flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-300 text-gray-800 rounded mr-2">
                        Cancelar
                    </button>
                    <button onClick={onConfirm} className="px-4 py-2 bg-red-500 text-[#FFFFFF] rounded">
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
}
export default ConfirmDeleteModal;