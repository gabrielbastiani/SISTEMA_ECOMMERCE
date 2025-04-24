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
        case "contact_form":
            return <MdConnectWithoutContact size={30} color="black" />;
        case "user":
            return <FaUser size={30} color="black" />;
        case "post":
            return <MdPostAdd size={30} color="black" />;
        case "newsletter":
            return <FaRegNewspaper size={30} color="black" />;
        case "export_data":
            return <FaFileExport size={30} color="black" />;
        case "comment":
            return <FaRegCommentDots size={30} color="black" />;
        case "category":
            return <MdCategory size={30} color="black" />;
        case "tag":
            return <FaTags size={30} color="black" />;
        default:
            return <MdNotifications size={30} color="black" />;
    }
};