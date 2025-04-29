import {
    MdCategory,
    MdConnectWithoutContact,
    MdNotifications,
    MdPostAdd
} from 'react-icons/md';
import {
    FaFileExport,
    FaRegCommentDots,
    FaRegNewspaper,
    FaTags,
    FaUser
} from 'react-icons/fa';

export const NotificationIcon = ({ type }: { type: string }) => {
    switch (type) {
        case "CONTACT_FORM":
            return <MdConnectWithoutContact size={30} color="black" />;
        case "USER":
            return <FaUser size={30} color="black" />;
        case "PRODUCT":
            return <MdPostAdd size={30} color="black" />;
        case "NEWSLETTER":
            return <FaRegNewspaper size={30} color="black" />;
        case "REPORT":
            return <FaFileExport size={30} color="black" />;
        case "MARKETING":
            return <FaRegCommentDots size={30} color="black" />;
        case "CATEGORY":
            return <MdCategory size={30} color="black" />;
        case "ORDER":
            return <FaTags size={30} color="black" />;
        default:
            return <MdNotifications size={30} color="black" />;
    }
};