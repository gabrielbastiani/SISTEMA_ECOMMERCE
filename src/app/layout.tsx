import type { Metadata } from "next";
import { Providers } from "./providers";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const ECOMMERCE_URL = process.env.NEXT_PUBLIC_URL_ECOMMERCE || 'http://localhost:3000';

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
    metadataBase: new URL(ECOMMERCE_URL),
    title: ecommerce?.name || defaultMetadata.title,
    description: ecommerce?.about_store || defaultMetadata.description,
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
    <html lang="pt-BR" className="scroll-smooth" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}