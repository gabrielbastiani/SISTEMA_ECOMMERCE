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

export interface VideoInput {
    url: string;
    thumbnail?: string;
}

export interface VariantFormData {
    sku: string;
    price_per: string;
    price_of?: string;
    ean?: string;
    stock?: string;
    allowBackorders?: boolean;
    sortOrder?: string;
    mainPromotion_id?: string;
    variantAttributes: Array<{ key: string; value: string }>;
    images: File[];
    videos: VideoInput[];
}

export interface ProductFormData {
    name: string
    slug?: string
    price_per: string
    price_of?: string
    metaTitle?: string
    metaDescription?: string
    keywords?: string
    brand?: string
    ean?: string
    skuMaster?: string
    weight?: string
    length?: string
    width?: string
    height?: string
    stock?: string
    mainPromotion_id?: string;
    status?: 'DISPONIVEL' | 'INDISPONIVEL'
    categories: string[]
    description: string;
    images: File[];
    videos: VideoInput[];
    variants: VariantFormData[];
    productDescriptions: Array<{
        title: string;
        description: string;
        status?: 'DISPONIVEL' | 'INDISPONIVEL';
    }>;
}

export interface RelationFormData {
    parentId?: string;
    childId?: string;
    relationType: "VARIANT" | "SIMPLE";
    sortOrder: number;
    isRequired: boolean;
}

export type PromotionOption = { id: string; name: string };

export const initialFormData: ProductFormData = {
    name: '',
    slug: '',
    price_per: '',
    price_of: '',
    metaTitle: '',
    metaDescription: '',
    keywords: '',
    brand: '',
    ean: '',
    skuMaster: '',
    weight: '',
    length: '',
    width: '',
    height: '',
    stock: '',
    status: 'DISPONIVEL',
    categories: [],
    description: '',
    images: [],
    videos: [],
    variants: [],
    productDescriptions: []
};