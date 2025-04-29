import React, { useState } from "react";
import { AiOutlineClose } from "react-icons/ai";
import moment from "moment";

interface DateFilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDateChange: (startDate: string, endDate: string) => void;
}

const TimeFilterModal: React.FC<DateFilterModalProps> = ({ isOpen, onClose, onDateChange }) => {
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const handleApply = () => {
        onDateChange(startDate, endDate);
        onClose();
    };

    const setToday = () => {
        setStartDate(moment().format('YYYY-MM-DD'));
        setEndDate(moment().format('YYYY-MM-DD'));
    };

    const setYesterday = () => {
        setStartDate(moment().subtract(1, 'day').format('YYYY-MM-DD'));
        setEndDate(moment().subtract(1, 'day').format('YYYY-MM-DD'));
    };

    const setLast7Days = () => {
        setStartDate(moment().subtract(7, 'days').format('YYYY-MM-DD'));
        setEndDate(moment().format('YYYY-MM-DD'));
    };

    const setLast30Days = () => {
        setStartDate(moment().subtract(30, 'days').format('YYYY-MM-DD'));
        setEndDate(moment().format('YYYY-MM-DD'));
    };

    const setLast6Months = () => {
        setStartDate(moment().subtract(6, 'months').format('YYYY-MM-DD'));
        setEndDate(moment().format('YYYY-MM-DD'));
    };

    const setCurrentWeek = () => {
        setStartDate(moment().startOf('week').format('YYYY-MM-DD'));
        setEndDate(moment().endOf('week').format('YYYY-MM-DD'));
    };

    const setCurrentMonth = () => {
        setStartDate(moment().startOf('month').format('YYYY-MM-DD'));
        setEndDate(moment().endOf('month').format('YYYY-MM-DD'));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-auto relative">
                <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">
                    <AiOutlineClose size={24} />
                </button>
                <div className="mt-6">
                    <h3 className="font-semibold text-black mb-2">Intervalo Personalizado</h3>

                    <div className="grid grid-cols-2 gap-2 mb-4">
                        <button onClick={setToday} className="bg-backgroundButton text-black py-1 px-3 rounded">Hoje</button>
                        <button onClick={setYesterday} className="bg-backgroundButton text-black py-1 px-3 rounded">Ontem</button>
                        <button onClick={setLast7Days} className="bg-backgroundButton text-black py-1 px-3 rounded">Últimos 7 dias</button>
                        <button onClick={setLast30Days} className="bg-backgroundButton text-black py-1 px-3 rounded">Últimos 30 dias</button>
                        <button onClick={setLast6Months} className="bg-backgroundButton text-black py-1 px-3 rounded">Últimos 6 meses</button>
                        <button onClick={setCurrentWeek} className="bg-backgroundButton text-black py-1 px-3 rounded">Semana atual</button>
                        <button onClick={setCurrentMonth} className="bg-backgroundButton text-black py-1 px-3 rounded">Mês atual</button>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        <div className="flex flex-col w-full">
                            <label className="text-sm text-gray-600 mb-1">Data de Início:</label>
                            <input
                                type="date"
                                value={moment(startDate).format('YYYY-MM-DD')}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="border rounded p-2 w-full text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex flex-col w-full">
                            <label className="text-sm text-gray-600 mb-1">Data de Fim:</label>
                            <input
                                type="date"
                                value={moment(endDate).format('YYYY-MM-DD')}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="border rounded p-2 w-full text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleApply}
                        className="mt-4 w-full bg-red-500 hover:bg-red-400 text-[#FFFFFF] py-2 rounded transition duration-200"
                    >
                        Aplicar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TimeFilterModal;