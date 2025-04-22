import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const BLOG_URL = process.env.NEXT_PUBLIC_URL_ECOMMERCE || 'http://localhost:3000';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  let ecommerce = null;

  try {
    const response = await fetch(`${API_URL}/configuration_ecommerce/get_configs`, {
      headers: { 'Cache-Control': 'public, max-age=3600' }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    ecommerce = await response.json();
  } catch (error) {
    console.error("Error fetching ecommerce configuration:", error);
  }

  const defaultMetadata = {
    title: "Ecommerce",
    description: "Descrição do ecommerce",
    favicon: "./favicon.ico",
  };

  const faviconUrl = ecommerce?.favicon
    ? new URL(`/files/${ecommerce.favicon}`, API_URL).toString()
    : defaultMetadata.favicon;

  return {
    metadataBase: new URL(BLOG_URL),
    title: ecommerce?.name_blog || defaultMetadata.title,
    description: ecommerce?.description_blog || defaultMetadata.description,
    icons: {
      icon: faviconUrl,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <ToastContainer autoClose={5000} />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
