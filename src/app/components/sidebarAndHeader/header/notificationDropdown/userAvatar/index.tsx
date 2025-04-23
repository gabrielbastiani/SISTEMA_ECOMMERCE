import Image from 'next/image';
import Link from 'next/link';
import { FiUser } from 'react-icons/fi';

interface UserAvatarProps {
    user: any;
    API_URL: string;
}

export const UserAvatar = ({ user, API_URL }: UserAvatarProps) => (
    <Link href="/user/profile">
        <div className="border-2 rounded-full p-1 border-var(--foreground) overflow-hidden w-[50px] h-[50px] flex items-center justify-center">
            {user?.photo ? (
                <Image
                    src={`${API_URL}/files/${user.photo}`}
                    alt="user"
                    width={50}
                    height={50}
                    className="object-cover w-full h-full rounded-full"
                />
            ) : (
                <FiUser cursor="pointer" size={24} color="var(--foreground)" />
            )}
        </div>
    </Link>
);