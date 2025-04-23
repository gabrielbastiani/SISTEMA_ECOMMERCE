import Link from "next/link";
import clsx from "clsx";
import { CaretRight } from "phosphor-react";

interface MenuItem {
    title: string;
    path: string;
}

interface CollapsibleMenuProps {
    title: string;
    items: MenuItem[];
    openMenu: string | null;
    currentRoute: string | null;
    menuName: string;
    onMenuToggle: (menuName: string) => void;
}

export const CollapsibleMenu = ({
    title,
    items,
    openMenu,
    currentRoute,
    menuName,
    onMenuToggle,
}: CollapsibleMenuProps) => (
    <div>
        <button
            onClick={() => onMenuToggle(menuName)}
            className={clsx('p-2 text-left mb-2 flex justify-between items-center w-full', {
                'bg-activeLink rounded': openMenu === menuName || currentRoute?.includes(`/${menuName}`),
                'text-[#FFFFFF]': openMenu !== menuName && !currentRoute?.includes(`/${menuName}`)
            })}
        >
            {title}
            <CaretRight className={clsx('transition-transform duration-200', {
                'rotate-90': openMenu === menuName,
                'rotate-0': openMenu !== menuName
            })} />
        </button>
        {openMenu === menuName && (
            <div className="ml-4 overflow-hidden transition-all duration-300 ease-in-out flex flex-col">
                {items.map((item) => (
                    <Link
                        key={item.path}
                        href={item.path}
                        className={clsx({
                            'bg-activeLink rounded p-2 mb-2 text-sm': currentRoute === item.path,
                            'text-[#FFFFFF] p-2 mb-2 text-sm': currentRoute !== item.path
                        })}
                    >
                        {item.title}
                    </Link>
                ))}
            </div>
        )}
    </div>
);