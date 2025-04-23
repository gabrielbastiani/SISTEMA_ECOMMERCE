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
            return <MdConnectWithoutContact size={30} color="white" />;
        case "user":
            return <FaUser size={30} color="white" />;
        case "post":
            return <MdPostAdd size={30} color="white" />;
        case "newsletter":
            return <FaRegNewspaper size={30} color="white" />;
        case "export_data":
            return <FaFileExport size={30} color="white" />;
        case "comment":
            return <FaRegCommentDots size={30} color="white" />;
        case "category":
            return <MdCategory size={30} color="white" />;
        case "tag":
            return <FaTags size={30} color="white" />;
        default:
            return <MdNotifications size={30} color="white" />;
    }
};