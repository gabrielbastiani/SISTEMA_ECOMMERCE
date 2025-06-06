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
    parentId: string | null;
    children?: Category[];
    promotion_id: string;
    filterId: string;
    selected?: boolean
    indeterminate?: boolean
    created_at: string;
}

export type StatusProduct = 'DISPONIVEL' | 'INDISPONIVEL';
export type StatusDescription = 'DISPONIVEL' | 'INDISPONIVEL';

export interface ProductDescription {
    id?: any;
    title: string;
    description: string;
    status?: StatusDescription;
}

export interface ImageRecord {
    id: string;
    url: string;
    altText: string;
}

export interface VariantFormData {
    id: string
    sku: string
    price_of?: number
    price_per?: number
    stock: number
    sortOrder: number
    ean?: string
    mainPromotion_id?: string
    allowBackorders?: boolean
    attributes: VariantAttribute[]
    images: File[]
    product_id?: string
    created_at?: string
    productVariantImage?: any[]
    productVariantVideo?: any[]
    variantAttributes: VariantAttribute[];
    videos?: VideoInput[];
    videoLinks?: VideoInput[];
    existingImages?: ImageRecord[]
    newImages?: File[]
    newVideos?: VideoInput[]
}

export interface VariantAttribute {
    id?: string;
    key: string;
    value: string;
    status?: StatusProduct;
    images?: File[];
    existingImages?: ImageRecord[]
    newImages?: File[]
}

export interface VideoInput {
    url: string;
    isPrimary?: boolean;
    thumbnail?: string;
}

export interface ProductVariant {
    id?: string;
    product_id?: string;
    created_at?: string;
    sku?: string
    price_of?: number
    price_per?: number
    stock?: number
    sortOrder?: number
    ean?: string
    mainPromotion_id?: string
    allowBackorders?: boolean
    attributes?: VariantAttribute[]
    images?: File[]
    videoLinks?: string[]
}

export interface ProductFormData {
    id?: string;
    relations: any;
    name: string;
    slug: string;
    description: string;
    brand?: string;
    ean?: string;
    skuMaster?: string;
    status: StatusProduct;
    price_of?: number;
    price_per: number;
    stock?: number;
    weight?: number;
    length?: number;
    width?: number;
    height?: number;
    categories: string[];
    mainPromotion_id?: string;
    images: File[];
    videos: VideoInput[];
    variants: VariantFormData[];
    productDescriptions: ProductDescription[];
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
    videoLinks?: string[]
    existingImages?: ImageRecord[];
    newImages?: File[];
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
    id: '',
    name: '',
    slug: '',
    description: '',
    status: 'DISPONIVEL',
    price_per: 0,
    price_of: undefined,
    metaTitle: undefined,
    metaDescription: undefined,
    keywords: undefined,
    brand: undefined,
    ean: undefined,
    skuMaster: undefined,
    weight: undefined,
    length: undefined,
    width: undefined,
    height: undefined,
    stock: undefined,
    categories: [],
    images: [],
    videos: [],
    productDescriptions: [],
    relations: [],
    variants: [] as VariantFormData[],
    videoLinks: [],
    newImages: [],
    mainPromotion_id: undefined,
    existingImages: [],
};