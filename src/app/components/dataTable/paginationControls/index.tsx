import React from 'react';

interface PaginationControlsProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({ currentPage, totalPages, onPageChange }) => {
    const getVisiblePages = () => {
        const pages = [];
        const maxVisiblePages = 5;
        const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }
        return pages;
    };

    return (
        <div className="flex space-x-2">
            {getVisiblePages().map((page) => (
                <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={`p-2 rounded-md ${page === currentPage ? 'bg-orange-500 text-black' : 'bg-gray-500'}`}
                >
                    {page}
                </button>
            ))}
        </div>
    );
};

export default PaginationControls;