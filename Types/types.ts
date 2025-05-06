export interface Notification {
    id: string;
    message: string;
    created_at: string;
    href?: string;
    read: boolean;
    type: string;
}

export interface Category {
    id: string;
    name: string;
    slug: string;
    description: string;
    image: string;
    order: number;
    parentId: string;
    children: any;
    promotion_id: string;
    filterId: string;
    created_at: string;
}

export interface ProductVariant {
    id: string;
    product_id: string;
    sku: string;
    price_of: number;
    price_per: number;
    stock: number;
    allowBackorders: boolean;
    sortOrder: number;
    ean: string;
    mainPromotion_id: string;
    created_at: string;
}