import Link from 'next/link';

export default function Notfound() {
    return (
        <div className="flex flex-col items-center justify-center h-screen text-center bg-background text-foreground transition-colors duration-300">
            <h1 className="text-6xl font-bold text-gray-800">404</h1>
            <p className="text-xl mt-4 mb-10">Oops! Página não encontrada.</p>
            <Link href="/" className="w-full md:w-80 px-6 py-3 bg-backgroundButton rounded hover:bg-hoverButtonBackground transition duration-300">
                Voltar
            </Link>
        </div>
    );
};