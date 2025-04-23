import { ReactNode } from "react";

export function Section({ children }: { children: ReactNode }) {
    return (
        <section className="p-4 md:p-16 w-full h-full max-w-full overflow-y-auto">
            {children}
        </section>
    );
}