'use client';

import { useTheme } from '@/app/contexts/ThemeContext';
import { FiSun, FiMoon } from 'react-icons/fi';

export default function ThemeToggle() {

    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            aria-label="Toggle theme"
        >
            {theme === 'light' ? (
                <FiMoon className="w-6 h-6 text-gray-800" />
            ) : (
                <FiSun className="w-6 h-6 text-yellow-400" />
            )}
        </button>
    );
}