"use client";

import { useState, useEffect, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { setupAPIClientEcommerce } from "@/app/services/apiEcommerce";
import { SidebarAndHeader } from "@/app/components/sidebarAndHeader";
import { Section } from "@/app/components/section";
import { TitlePage } from "@/app/components/section/titlePage";
import { toast } from "react-toastify";
import {
    Input,
    Textarea,
    Select,
    SelectItem,
    Checkbox,
    Button,
    Tabs,
    Tab,
    Accordion,
    AccordionItem
} from "@nextui-org/react";
import { TrashIcon, PlusIcon } from "@heroicons/react/24/outline";
import { ArrowUpTrayIcon as UploadIcon } from "@heroicons/react/24/outline";
import { useDropzone } from "react-dropzone";
import { Editor } from "@tinymce/tinymce-react";
import { CollapsibleInfo } from "@/app/components/helpers_componentes/CollapsibleInfo";

type PromotionOption = { id: string; name: string };
type RelationType = "VARIANT" | "SIMPLE";
type StatusProduct = "DISPONIVEL" | "INDISPONIVEL";

interface VideoInput { url: string; thumbnail?: string }

interface VariantFormData {
    id?: string; // Adicionar ID opcional
    sku: string;
    price_per: string;
    price_of?: string;
    ean?: string;
    stock?: string;
    allowBackorders?: boolean;
    sortOrder?: string;
    mainPromotion_id?: string;
    variantAttributes: Array<{ key: string; value: string }>;
    existingImages: Array<{ id: string; url: string; altText?: string }>; // Adicionar ID
    newImages: File[];
    videos: VideoInput[];
}

interface RelationFormData {
    parentId?: string;
    childId?: string;
    relationType: RelationType;
    sortOrder: number;
    isRequired: boolean;
}

interface ProductFormData {
    name: string;
    slug?: string;
    metaTitle?: string;
    metaDescription?: string;
    keywords?: any;
    skuMaster?: string;
    status: StatusProduct;
    price_per: string;
    price_of?: string;
    brand?: string;
    ean?: string;
    weight?: string;
    length?: string;
    width?: string;
    height?: string;
    stock?: string;
    mainPromotion_id?: string;
    categories: string[];
    description: string;
    existingImages: Array<{ url: string; altText?: string }>;
    newImages: File[];
    videos: VideoInput[];
    productDescriptions: Array<{ title: string; description: string }>;
    variants: VariantFormData[];
}

interface APIProductRelation {
    id: string;
    parentProduct_id: string;
    childProduct_id: string;
    relationType: "VARIANT" | "SIMPLE";
    sortOrder: number;
    isRequired: boolean;
    childProduct?: {
        id: string;
        name: string;
        // ... outros campos
    };
    parentProduct?: {
        id: string;
        name: string;
        // ... outros campos
    };
}

const emptyVideo: VideoInput = { url: "", thumbnail: "" };

const initialFormData: ProductFormData = {
    name: "",
    slug: "",
    metaTitle: "",
    metaDescription: "",
    skuMaster: "",
    status: "DISPONIVEL",
    price_per: "",
    price_of: "",
    brand: "",
    ean: "",
    weight: "",
    length: "",
    width: "",
    height: "",
    stock: "",
    mainPromotion_id: "",
    categories: [],
    description: "",
    existingImages: [],
    newImages: [],
    videos: [],
    productDescriptions: [],
    variants: [],
};

const DropzoneVariant = ({ index, formData, setFormData }: any) => {
    const onDrop = (files: File[]) => {
        const newVariants = [...formData.variants];
        newVariants[index].newImages = [...newVariants[index].newImages, ...files];
        setFormData({ ...formData, variants: newVariants });
    };

    const { getRootProps, getInputProps } = useDropzone({
        accept: { "image/*": [] },
        onDrop,
    });

    return (
        <div {...getRootProps()} className="border-2 border-dashed p-4 text-center cursor-pointer">
            <input {...getInputProps()} />
            <UploadIcon className="w-6 h-6 mx-auto text-gray-400" />
            <p>Arraste ou clique para adicionar</p>
            <div className="grid grid-cols-4 gap-4 mt-4">
                {/* Imagens existentes */}
                {formData.variants[index].existingImages.map((img: any, i: number) => (
                    <div key={i} className="relative group">
                        <img
                            src={img.url}
                            className="w-full h-24 object-cover rounded"
                        />
                        <Button
                            onClick={() => {
                                const newVariants = [...formData.variants];
                                newVariants[index].existingImages.splice(i, 1);
                                setFormData({ ...formData, variants: newVariants });
                            }}
                        >
                            <TrashIcon className="w-4 h-4" />
                        </Button>
                    </div>
                ))}

                {/* Novas imagens */}
                {formData.variants[index].newImages.map((file: File, i: number) => (
                    <div key={i} className="relative group">
                        <img
                            src={URL.createObjectURL(file)}
                            className="w-full h-24 object-cover rounded"
                        />
                        <Button
                            onClick={() => {
                                const newVariants = [...formData.variants];
                                newVariants[index].newImages.splice(i, 1);
                                setFormData({ ...formData, variants: newVariants });
                            }}
                        >
                            <TrashIcon className="w-4 h-4" />
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default function UpdateProduct() {

    const { product_id } = useParams<{ product_id: string }>() as { product_id: string };
    const router = useRouter();

    const [formData, setFormData] = useState<ProductFormData>(initialFormData);
    const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
    const [allProducts, setAllProducts] = useState<{ id: string; name: string }[]>([]);
    const [promotions, setPromotions] = useState<PromotionOption[]>([]);
    const [relations, setRelations] = useState<RelationFormData[]>([]);
    const [tab, setTab] = useState<"child" | "parent">("child");
    const [loading, setLoading] = useState(false);

    const { getRootProps, getInputProps } = useDropzone({
        accept: { "image/*": [] },
        onDrop(files) {
            setFormData(f => ({ ...f, newImages: [...f.newImages, ...files] }));
        },
    });

    useEffect(() => {
        async function load() {
            const api = setupAPIClientEcommerce();
            const [prodRes, catRes, prodAllowRes, promoRes] = await Promise.all([
                api.get(`/product/cms/get?product_id=${product_id}`),
                api.get("/category/cms"),
                api.get("/get/products"),
                api.get("/promotions"),
            ]);

            const p = prodRes.data;

            console.log(p)

            setFormData({
                ...p,
                name: p.name,
                slug: p.slug || "",
                metaTitle: p.metaTitle || "",
                metaDescription: p.metaDescription || "",
                keywords: p.keywords || null,
                skuMaster: p.skuMaster || "",
                status: p.status,
                price_per: p.price_per?.toString() || "",
                price_of: p.price_of?.toString() || "",
                brand: p.brand || "",
                ean: p.ean || "",
                weight: p.weight?.toString() || "",
                length: p.length?.toString() || "",
                width: p.width?.toString() || "",
                height: p.height?.toString() || "",
                stock: p.stock?.toString() || "",
                mainPromotion_id: p.mainPromotion_id || "",
                categories: p.categories.map((c: any) => c.categoryId),
                description: p.description,
                existingImages: p.images.map((img: any) => ({
                    url: img.url,
                    altText: img.altText,
                })),
                newImages: [],
                videos: p.videos.map((v: any) => ({
                    url: v.url,
                    thumbnail: `https://img.youtube.com/vi/${v.url.split("v=")[1]}/0.jpg`,
                })),
                productDescriptions: p.productsDescriptions.map((d: any) => ({
                    title: d.title,
                    description: d.description,
                })),
                // No useEffect, substituir o mapeamento de variants por:
                variants: p.variants.map((v: any) => ({
                    id: v.id, // Adicionar ID da variante
                    sku: v.sku,
                    price_per: v.price_per.toString(),
                    price_of: v.price_of?.toString() || "",
                    ean: v.ean || "",
                    stock: v.stock?.toString() || "",
                    allowBackorders: v.allowBackorders,
                    sortOrder: v.sortOrder?.toString() || "",
                    mainPromotion_id: v.mainPromotion_id || "",
                    existingImages: p.images
                        .filter((img: any) => img.variant_id === v.id)
                        .map((img: any) => ({
                            id: img.id,
                            url: img.url,
                            altText: img.altText
                        })),
                    newImages: [],
                    // Corrigir mapeamento de atributos
                    variantAttributes: v.attributes
                        ? v.attributes.map((a: any) => ({ key: a.key, value: a.value }))
                        : [],
                    // Mapear imagens da variante filtrando pelo variant_id
                    images: p.images
                        .filter((img: any) => img.variant_id === v.id)
                        .map((img: any) => ({
                            url: img.url,
                            altText: img.altText
                        })),
                    // Mapear vídeos da variante
                    videos: p.videos
                        .filter((vid: any) => vid.variant_id === v.id)
                        .map((vid: any) => ({
                            url: vid.url,
                            thumbnail: `https://img.youtube.com/vi/${vid.url.split("v=")[1]}/0.jpg`
                        }))
                })),
            });

            setCategories(catRes.data.all_categories_disponivel);
            setAllProducts(prodAllowRes.data.allow_products);
            setPromotions(promoRes.data.map((p: { id: any; name: any; }) => ({
                id: String(p.id),
                name: p.name
            })));
            setRelations([
                ...(p.parentRelations || []).map((r: any) => ({
                    parentId: product_id,
                    childId: r.childProduct_id,
                    relationType: r.relationType,
                    sortOrder: r.sortOrder,
                    isRequired: r.isRequired,
                })),
                ...(p.childRelations || []).map((r: any) => ({
                    parentId: r.parentProduct_id,
                    childId: product_id,
                    relationType: r.relationType,
                    sortOrder: r.sortOrder,
                    isRequired: r.isRequired,
                }))
            ]);
        }
        load();
    }, [product_id]);

    function updateField<K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) {
        setFormData(f => ({ ...f, [key]: value }));
    }

    function updateRelation<K extends keyof RelationFormData>(
        idx: number,
        field: K,
        value: RelationFormData[K]
    ) {
        const arr = [...relations];
        arr[idx] = { ...arr[idx], [field]: value };
        setRelations(arr);
    }

    function addRelation() {
        setRelations(r => [
            ...r,
            { relationType: "VARIANT", sortOrder: 0, isRequired: false },
        ]);
    }

    function removeRelation(idx: number) {
        setRelations(r => r.filter((_, i) => i !== idx));
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            const api = setupAPIClientEcommerce();
            const fd = new FormData();

            // Campos principais
            fd.append("id", product_id);
            fd.append("name", formData.name);
            fd.append("slug", formData.slug || "");
            fd.append("metaTitle", formData.metaTitle || "");
            fd.append("metaDescription", formData.metaDescription || "");
            fd.append("keywords", JSON.stringify(formData.keywords || null));
            fd.append("skuMaster", formData.skuMaster || "");
            fd.append("status", formData.status);
            fd.append("price_per", formData.price_per);
            fd.append("price_of", formData.price_of || "");
            fd.append("brand", formData.brand || "");
            fd.append("ean", formData.ean || "");
            fd.append("weight", formData.weight || "");
            fd.append("length", formData.length || "");
            fd.append("width", formData.width || "");
            fd.append("height", formData.height || "");
            fd.append("stock", formData.stock || "");
            fd.append("mainPromotion_id", formData.mainPromotion_id || "");
            fd.append("categoryIds", JSON.stringify(formData.categories));
            fd.append("descriptionBlocks", JSON.stringify(
                formData.productDescriptions.map(d => ({
                    title: d.title,
                    description: d.description,
                }))
            ));
            fd.append("description", formData.description);

            // Vídeos globais
            formData.videos.forEach(v => fd.append("videoUrls", v.url));

            // Imagens principais (novas)
            formData.newImages.forEach(f => fd.append("imageFiles", f));

            // Variantes
            fd.append("variants", JSON.stringify(
                formData.variants.map(v => ({
                    sku: v.sku,
                    price_per: Number(v.price_per),
                    price_of: v.price_of ? Number(v.price_of) : undefined,
                    ean: v.ean,
                    stock: v.stock ? Number(v.stock) : undefined,
                    allowBackorders: v.allowBackorders,
                    sortOrder: v.sortOrder ? Number(v.sortOrder) : undefined,
                    mainPromotion_id: v.mainPromotion_id,
                    attributes: v.variantAttributes,
                    videoUrls: v.videos.map(x => x.url),
                }))
            ));

            // Imagens de variantes
            // Substitua o código problemático por:
            formData.variants.forEach((variant, idx) => {
    // Enviar novas imagens
    variant.newImages.forEach((file: File) => {
        const f2 = new File([file], `${idx}___${file.name}`, { type: file.type });
        fd.append("variantImageFiles", f2);
    });

    // Gerenciar imagens existentes e deletadas
    if (variant.id) {
        const initialVariant = p.variants.find((v: any) => v.id === variant.id);
        if (initialVariant) {
            const keptImageIds = variant.existingImages.map(img => img.id);
            const allOriginalIds = initialVariant.images.map((img: any) => img.id);
            
            const imagesToDelete = allOriginalIds.filter((id: string) => 
                !keptImageIds.includes(id)
            );
            
            fd.append(`deletedVariantImages-${variant.id}`, JSON.stringify(imagesToDelete));
        }
    }
});

// Imagens existentes mantidas
fd.append("existingVariantImages", JSON.stringify(
    formData.variants.flatMap(v => 
        v.existingImages.map(img => ({
            id: img.id,
            url: img.url,
            variantId: v.id || 'new' // Lidar com novas variantes
        }))
    )
));

            // Relações
            fd.append("relations", JSON.stringify(
                relations.map(r => ({
                    parentId: tab === 'child' ? r.parentId : product_id,
                    childId: tab === 'child' ? product_id : r.childId,
                    relationType: r.relationType,
                    sortOrder: r.sortOrder,
                    isRequired: r.isRequired,
                }))
            ));

            await api.put("/product/update", fd, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            toast.success("Produto atualizado com sucesso!");
            router.push("/products");
        } catch (err) {
            console.error(err);
            toast.error("Erro ao atualizar produto!");
        }
        setLoading(false);
    }

    return (
        <SidebarAndHeader>
            <Section>
                <TitlePage title="ATUALIZAR PRODUTO" />
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* — Informações Básicas — */}
                    <div className="bg-white p-6 rounded-lg shadow border">
                        <h3 className="font-semibold mb-4">Informações Básicas</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                className="bg-white text-black"
                                label="Nome"
                                value={formData.name}
                                onChange={e => updateField("name", e.target.value)}
                                required
                            />
                            <Input
                                className="bg-white text-black"
                                label="Slug"
                                value={formData.slug}
                                onChange={e => updateField("slug", e.target.value)}
                            />
                            <Input
                                className="bg-white text-black"
                                label="SKU Mestre"
                                value={formData.skuMaster}
                                onChange={e => updateField("skuMaster", e.target.value)}
                            />
                            <Select
                                className="bg-white text-black"
                                label="Status"
                                value={formData.status}
                                onChange={v => updateField("status", v as unknown as StatusProduct)}
                            >
                                <SelectItem value="DISPONIVEL">Disponível</SelectItem>
                                <SelectItem value="INDISPONIVEL">Indisponível</SelectItem>
                            </Select>
                            <Input
                                className="bg-white text-black"
                                label="Preço de Venda"
                                type="number"
                                value={formData.price_per}
                                onChange={e => updateField("price_per", e.target.value)}
                                required
                            />
                            <Input
                                className="bg-white text-black"
                                label="Preço Original"
                                type="number"
                                value={formData.price_of}
                                onChange={e => updateField("price_of", e.target.value)}
                            />
                        </div>
                    </div>

                    {/* — Detalhes do Produto — */}
                    <div className="bg-white p-6 rounded-lg shadow border">
                        <h3 className="font-semibold mb-4">Detalhes do Produto</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Input
                                className="bg-white text-black"
                                label="Marca"
                                value={formData.brand}
                                onChange={e => updateField("brand", e.target.value)}
                            />
                            <Input
                                className="bg-white text-black"
                                label="EAN"
                                value={formData.ean}
                                onChange={e => updateField("ean", e.target.value)}
                            />
                            <Input
                                className="bg-white text-black"
                                label="Peso (kg)"
                                type="number"
                                value={formData.weight}
                                onChange={e => updateField("weight", e.target.value)}
                            />
                            <Input
                                className="bg-white text-black"
                                label="Comprimento (cm)"
                                type="number"
                                value={formData.length}
                                onChange={e => updateField("length", e.target.value)}
                            />
                            <Input
                                className="bg-white text-black"
                                label="Largura (cm)"
                                type="number"
                                value={formData.width}
                                onChange={e => updateField("width", e.target.value)}
                            />
                            <Input
                                className="bg-white text-black"
                                label="Altura (cm)"
                                type="number"
                                value={formData.height}
                                onChange={e => updateField("height", e.target.value)}
                            />
                            <Input
                                className="bg-white text-black"
                                label="Estoque"
                                type="number"
                                value={formData.stock}
                                onChange={e => updateField("stock", e.target.value)}
                            />

                            <div>
                                <label className="block text-sm mb-1">Promoção Principal</label>
                                <Select
                                    className="bg-white text-black"
                                    placeholder="Sem promoção"
                                    selectedKeys={formData.mainPromotion_id ? [formData.mainPromotion_id] : []}
                                    onSelectionChange={(keys) => {
                                        const key = Array.from(keys)[0]?.toString() || "";
                                        updateField("mainPromotion_id", key);
                                    }}
                                    items={promotions} // Adicione esta linha
                                >
                                    {(promotion) => (
                                        <SelectItem
                                            key={promotion.id}
                                            value={promotion.id}
                                            textValue={promotion.name}
                                            className="text-black"
                                        >
                                            {promotion.name}
                                        </SelectItem>
                                    )}
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* — Descrições Detalhadas — */}
                    <div className="bg-white p-6 rounded-lg shadow border">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold">Descrições Detalhadas</h3>
                            <Button
                                size="sm"
                                startContent={<PlusIcon />}
                                onClick={() =>
                                    setFormData(f => ({
                                        ...f,
                                        productDescriptions: [
                                            ...f.productDescriptions,
                                            { title: "", description: "" },
                                        ],
                                    }))
                                }
                            >
                                Adicionar
                            </Button>
                        </div>
                        {formData.productDescriptions.map((desc, i) => (
                            <div key={i} className="mb-4 p-4 border rounded">
                                <div className="flex justify-between mb-2">
                                    <span className="font-medium">Descrição {i + 1}</span>
                                    <Button
                                        size="sm"
                                        isIconOnly
                                        onClick={() =>
                                            setFormData(f => ({
                                                ...f,
                                                productDescriptions: f.productDescriptions.filter((_, idx) => idx !== i),
                                            }))
                                        }
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </Button>
                                </div>
                                <Input
                                    className="mb-2 bg-white text-black"
                                    placeholder="Título"
                                    value={desc.title}
                                    onChange={e => {
                                        const arr = [...formData.productDescriptions];
                                        arr[i].title = e.target.value;
                                        setFormData(f => ({ ...f, productDescriptions: arr }));
                                    }}
                                />
                                <Editor
                                    apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                                    value={desc.description}
                                    onEditorChange={val => {
                                        const arr = [...formData.productDescriptions];
                                        arr[i].description = val;
                                        setFormData(f => ({ ...f, productDescriptions: arr }));
                                    }}
                                    init={{
                                        height: 200,
                                        menubar: false,
                                        plugins: ["link", "lists", "code"],
                                        toolbar: "undo redo | bold italic | alignleft aligncenter",
                                    }}
                                />
                            </div>
                        ))}
                    </div>

                    {/* — SEO — */}
                    <div className="bg-white p-6 rounded-lg shadow border">
                        <h3 className="font-semibold mb-3">SEO</h3>
                        <Input
                            className="mb-4 bg-white text-black"
                            placeholder="Meta título"
                            value={formData.metaTitle}
                            onChange={e => updateField("metaTitle", e.target.value)}
                        />
                        <Textarea
                            className="bg-white text-black"
                            placeholder="Meta descrição"
                            value={formData.metaDescription}
                            onChange={e => updateField("metaDescription", e.target.value)}
                        />
                    </div>

                    {/* — Vídeos — */}
                    <div className="bg-white p-6 rounded-lg shadow border">
                        <h3 className="font-semibold mb-2">Vídeos</h3>
                        {formData.videos.map((v, i) => (
                            <div key={i} className="flex items-center gap-2 mb-2">
                                <input
                                    type="url"
                                    className="border p-2 rounded flex-1"
                                    value={v.url}
                                    onChange={e => {
                                        const arr = [...formData.videos];
                                        const url = e.target.value;
                                        const idm = url.match(/v=([^&]+)/);
                                        arr[i] = {
                                            url,
                                            thumbnail: idm ? `https://img.youtube.com/vi/${idm[1]}/0.jpg` : undefined,
                                        };
                                        setFormData(f => ({ ...f, videos: arr }));
                                    }}
                                />
                                <Button
                                    size="sm"
                                    isIconOnly
                                    onClick={() =>
                                        setFormData(f => ({
                                            ...f,
                                            videos: f.videos.filter((_, idx) => idx !== i),
                                        }))
                                    }
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                        <Button size="sm" startContent={<PlusIcon />} onClick={() => setFormData(f => ({ ...f, videos: [...f.videos, emptyVideo] }))}>
                            Adicionar Vídeo
                        </Button>
                    </div>

                    {/* — Imagens — */}
                    <div className="bg-white p-6 rounded-lg shadow border">
                        <h3 className="font-semibold mb-2">Imagens</h3>
                        <div
                            {...getRootProps()}
                            className="border-2 border-dashed p-6 text-center cursor-pointer"
                        >
                            <input {...getInputProps()} />
                            <UploadIcon className="w-8 h-8 mx-auto text-gray-400" />
                            <p>Arraste ou clique para adicionar</p>
                        </div>
                        <div className="grid grid-cols-4 gap-4 mt-4">
                            {formData.existingImages.map((img, i) => (
                                <div key={`existing-${i}`} className="relative group">
                                    <img
                                        src={img.url}
                                        className="w-full h-24 object-cover rounded"
                                    />
                                    <Button
                                        size="sm"
                                        isIconOnly
                                        className="absolute top-1 right-1"
                                        onClick={() => {
                                            const arr = formData.existingImages.filter((_, idx) => idx !== i);
                                            setFormData(f => ({ ...f, existingImages: arr }));
                                        }}
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                            {formData.newImages.map((f, i) => (
                                <div key={`new-${i}`} className="relative group">
                                    <img
                                        src={URL.createObjectURL(f)}
                                        className="w-full h-24 object-cover rounded"
                                    />
                                    <Button
                                        size="sm"
                                        isIconOnly
                                        className="absolute top-1 right-1"
                                        onClick={() =>
                                            setFormData(x => ({
                                                ...x,
                                                newImages: x.newImages.filter((_, idx) => idx !== i),
                                            }))
                                        }
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* — Categorias — */}
                    <div className="bg-white p-6 rounded-lg shadow border">
                        <h3 className="font-semibold mb-2">Categorias</h3>
                        <div className="grid grid-cols-3 gap-2">
                            {categories.map(c => (
                                <label key={c.id} className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.categories.includes(c.id)}
                                        onChange={e => {
                                            const arr = formData.categories.includes(c.id)
                                                ? formData.categories.filter(x => x !== c.id)
                                                : [...formData.categories, c.id];
                                            updateField("categories", arr);
                                        }}
                                    />
                                    {c.name}
                                </label>
                            ))}
                        </div>
                    </div>

                    <CollapsibleInfo />

                    {/* — Variantes — */}
                    <div className="bg-white p-6 rounded-lg shadow border">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold">Variantes</h3>
                            <Button
                                size="sm"
                                startContent={<PlusIcon />}
                                onClick={() => {
                                    setFormData(f => ({
                                        ...f,
                                        variants: [...f.variants, {
                                            sku: "",
                                            price_per: "",
                                            price_of: "",
                                            ean: "",
                                            stock: "",
                                            allowBackorders: false,
                                            sortOrder: "",
                                            mainPromotion_id: "",
                                            variantAttributes: [],
                                            existingImages: [], // Corrigido
                                            newImages: [],      // Corrigido
                                            videos: [],
                                        }],
                                    }));
                                }}
                            >
                                Adicionar Variante
                            </Button>
                        </div>
                        <Accordion selectionMode="multiple">
                            {formData.variants.map((variant, vi) => (
                                <AccordionItem
                                    key={vi}
                                    aria-label={`Variante ${vi + 1}`}
                                    title={`Variante ${vi + 1}`}
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <Input
                                            placeholder="SKU"
                                            value={variant.sku}
                                            onChange={e => {
                                                const arr = [...formData.variants];
                                                arr[vi].sku = e.target.value;
                                                setFormData(f => ({ ...f, variants: arr }));
                                            }}
                                            required
                                        />
                                        <Input
                                            placeholder="Preço"
                                            type="number"
                                            value={variant.price_per}
                                            onChange={e => {
                                                const arr = [...formData.variants];
                                                arr[vi].price_per = e.target.value;
                                                setFormData(f => ({ ...f, variants: arr }));
                                            }}
                                            required
                                        />
                                        <Checkbox
                                            isSelected={variant.allowBackorders}
                                            onValueChange={(checked) => {
                                                const arr = [...formData.variants];
                                                arr[vi].allowBackorders = checked;
                                                setFormData(f => ({ ...f, variants: arr }));
                                            }}
                                        >
                                            Permitir Backorders
                                        </Checkbox>
                                    </div>

                                    <div className="mb-4">
                                        <h4 className="font-medium mb-2">Atributos</h4>
                                        {variant.variantAttributes.map((at, ai) => (
                                            <div key={ai} className="flex gap-2 mb-2">
                                                <Input
                                                    placeholder="Chave"
                                                    value={at.key}
                                                    onChange={e => {
                                                        const arr = [...formData.variants];
                                                        arr[vi].variantAttributes[ai].key = e.target.value;
                                                        setFormData(f => ({ ...f, variants: arr }));
                                                    }}
                                                />
                                                <Input
                                                    placeholder="Valor"
                                                    value={at.value}
                                                    onChange={e => {
                                                        const arr = [...formData.variants];
                                                        arr[vi].variantAttributes[ai].value = e.target.value;
                                                        setFormData(f => ({ ...f, variants: arr }));
                                                    }}
                                                />
                                                <Button size="sm" isIconOnly onClick={() => {
                                                    const arr = [...formData.variants];
                                                    arr[vi].variantAttributes.splice(ai, 1);
                                                    setFormData(f => ({ ...f, variants: arr }));
                                                }}>
                                                    <TrashIcon className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))}
                                        <Button size="sm" startContent={<PlusIcon />} onClick={() => {
                                            const arr = [...formData.variants];
                                            arr[vi].variantAttributes.push({ key: "", value: "" });
                                            setFormData(f => ({ ...f, variants: arr }));
                                        }}>
                                            Adicionar Atributo
                                        </Button>
                                    </div>

                                    <div className="mb-4">
                                        <h4 className="font-medium mb-2">Imagens da Variante</h4>
                                        <DropzoneVariant index={vi} formData={formData} setFormData={setFormData} />
                                    </div>

                                    <div className="mb-4">
                                        <h4 className="font-medium mb-2">Vídeos da Variante</h4>
                                        {variant.videos.map((vid, vj) => (
                                            <div key={vj} className="flex items-center gap-2 mb-2">
                                                <input
                                                    type="url"
                                                    className="border p-2 rounded flex-1"
                                                    value={vid.url}
                                                    onChange={e => {
                                                        const arr = [...formData.variants];
                                                        const url = e.target.value;
                                                        const idm = url.match(/v=([^&]+)/);
                                                        arr[vi].videos[vj] = {
                                                            url,
                                                            thumbnail: idm ? `https://img.youtube.com/vi/${idm[1]}/0.jpg` : undefined,
                                                        };
                                                        setFormData(f => ({ ...f, variants: arr }));
                                                    }}
                                                />
                                                <Button
                                                    size="sm"
                                                    isIconOnly
                                                    onClick={() => {
                                                        const arr = [...formData.variants];
                                                        arr[vi].videos.splice(vj, 1);
                                                        setFormData(f => ({ ...f, variants: arr }));
                                                    }}
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))}
                                        <Button size="sm" startContent={<PlusIcon />} onClick={() => {
                                            const arr = [...formData.variants];
                                            arr[vi].videos.push(emptyVideo);
                                            setFormData(f => ({ ...f, variants: arr }));
                                        }}>
                                            Adicionar Vídeo
                                        </Button>
                                    </div>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>

                    {/* — Relações — */}
                    <div className="bg-white p-6 rounded-lg shadow border">
                        <h3 className="font-semibold mb-3">Relações de Produtos</h3>
                        <Tabs
                            selectedKey={tab}
                            onSelectionChange={(k) => setTab(k as "child" | "parent")}
                        >
                            <Tab key="child" title="Como Filho" />
                            <Tab key="parent" title="Como Pai" />
                        </Tabs>

                        {relations.map((r, ri) => {
                            // Encontra o produto relacionado baseado na aba
                            const relatedProduct = allProducts.find(p =>
                                tab === 'child' ? p.id === r.parentId : p.id === r.childId
                            );

                            return (
                                <div key={ri} className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-3">

                                    {/* Select de Relacionamento */}
                                    <Select
                                        label={tab === 'child' ? "Produto Pai" : "Produto Filho"}
                                        selectedKeys={
                                            new Set([
                                                (tab === 'child'
                                                    ? r.parentId
                                                    : r.childId
                                                )?.toString() || ''
                                            ])
                                        }
                                        onSelectionChange={(keys) => {
                                            const newId = Array.from(keys)[0]?.toString() || "";
                                            updateRelation(
                                                ri,
                                                tab === 'child' ? 'parentId' : 'childId',
                                                newId
                                            );
                                        }}
                                        className="col-span-2"
                                        isDisabled={!allProducts.length}
                                    >
                                        {allProducts.map(product => (
                                            <SelectItem
                                                key={product.id}
                                                value={product.id}
                                                textValue={product.name}
                                                className="text-black"
                                            >
                                                {product.name} ({product.id})
                                            </SelectItem>
                                        ))}
                                    </Select>

                                    {/* Tipo de Relação */}
                                    <Select
                                        label="Tipo"
                                        selectedKeys={[r.relationType]}
                                        onSelectionChange={(keys) =>
                                            updateRelation(ri, 'relationType', Array.from(keys)[0] as RelationType)
                                        }
                                    >
                                        <SelectItem key="VARIANT" value="VARIANT">Variante</SelectItem>
                                        <SelectItem key="SIMPLE" value="SIMPLE">Simples</SelectItem>
                                    </Select>

                                    {/* Ordem */}
                                    <Input
                                        type="number"
                                        label="Ordem"
                                        value={r.sortOrder.toString()}
                                        onChange={(e) =>
                                            updateRelation(ri, 'sortOrder', Number(e.target.value))
                                        }
                                    />

                                    {/* Obrigatório */}
                                    <Checkbox
                                        isSelected={r.isRequired}
                                        onValueChange={(checked) =>
                                            updateRelation(ri, 'isRequired', checked)
                                        }
                                    >
                                        Obrigatório
                                    </Checkbox>

                                    {/* Botão de Remover */}
                                    <Button
                                        isIconOnly
                                        color="danger"
                                        onClick={() => removeRelation(ri)}
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                    </Button>
                                </div>
                            );
                        })}

                        <Button size="sm" startContent={<PlusIcon />} onClick={addRelation}>
                            Adicionar Relação
                        </Button>
                    </div>

                    {/* — Botão Final — */}
                    <div className="text-right">
                        <Button type="submit" isLoading={loading} className="bg-green-500">
                            Salvar Alterações
                        </Button>
                    </div>
                </form>
            </Section>
        </SidebarAndHeader>
    );
}