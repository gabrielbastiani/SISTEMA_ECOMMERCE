'use client'

import NextTopLoader from 'nextjs-toploader';
import { ThemeProvider } from './contexts/ThemeContext'
import { CookiesProvider } from 'react-cookie'
import { AuthProvider } from './contexts/AuthContext'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider>
            <NextTopLoader color="#ff4444" showSpinner={false} />
            <CookiesProvider>
                <AuthProvider>
                    <ToastContainer autoClose={5000} />
                    {children}
                </AuthProvider>
            </CookiesProvider>
        </ThemeProvider>
    )
}