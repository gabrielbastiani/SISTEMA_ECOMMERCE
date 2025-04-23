'use client'

import { ThemeProvider } from './contexts/ThemeContext'
import { CookiesProvider } from 'react-cookie'
import { AuthProvider } from './contexts/AuthContext'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider>
            <CookiesProvider>
                <AuthProvider>
                    <ToastContainer autoClose={5000} />
                    {children}
                </AuthProvider>
            </CookiesProvider>
        </ThemeProvider>
    )
}