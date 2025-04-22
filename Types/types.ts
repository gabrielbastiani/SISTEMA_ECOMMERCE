export interface Notification {
    id: string;
    message: string;
    created_at: string;
    href?: string;
    read: boolean;
    type: string;
}