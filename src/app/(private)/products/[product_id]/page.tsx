"use client"

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
import Image from "next/image";
import { CurrencyInputUpdate } from "@/app/components/add_product/CurrencyInputUpdate";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type PromotionOption = { id: string; name: string };
type RelationType = "VARIANT" | "SIMPLE";
type StatusProduct = "DISPONIVEL" | "INDISPONIVEL";

interface VideoInput { url: string; thumbnail?: string }

interface VariantFormData {
    id?: string;
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
    existingImages: Array<{
        id: any; url: string; altText?: string
    }>;
    newImages: File[];
    videos: VideoInput[];
    productDescriptions: Array<{ title: string; description: string }>;
    variants: VariantFormData[];
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
        const renamedFiles = files.map(file =>
            new File([file], `${index}___${file.name}`, {
                type: file.type
            })
        );
        newVariants[index].newImages = [...newVariants[index].newImages, ...renamedFiles];
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
                        <Image
                            src={`${API_URL}/files/${img.url}`}
                            className="object-cover rounded"
                            width={210}
                            height={210}
                            alt={img.altText || "imagem-variante"}
                        />
                        <Button
                            onClick={() => {
                                const newVariants = [...formData.variants];
                                newVariants[index].existingImages.splice(i, 1);
                                setFormData({ ...formData, variants: newVariants });
                            }}
                        >
                            <TrashIcon color="red" className="w-4 h-4" />
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
                            <TrashIcon color="red" className="w-4 h-4" />
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

    const [initialProductData, setInitialProductData] = useState<any>(null);
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
            const [prodAllowRes, promoRes] = await Promise.all([
                api.get("/get/products"),
                api.get("/promotions"),
            ]);

            // 1. Carregar categorias primeiro
            const catRes = await api.get("/category/cms");
            const allCategories = catRes.data.all_categories_disponivel;

            // 2. Carregar dados do produto
            const prodRes = await api.get(`/product/cms/get?product_id=${product_id}`);
            const p = prodRes.data;

            // 3. Extrair IDs corretamente de category_id (não de category.id)
            const productCategoryIds = p.categories
                .map((c: any) => String(c.category_id)) // Alteração crítica aqui
                .filter((id: any) => allCategories.some((cat: { id: any; }) => cat.id === id));

            setInitialProductData(p);

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
                categories: productCategoryIds,
                description: p.description,
                existingImages: p.images.map((img: any) => ({
                    url: img.url,
                    altText: img.altText,
                })),
                newImages: [],
                videos: p.videos.map((v: any) => {
                    const url = v.url;
                    // Usar a mesma regex do input
                    const idMatch = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
                    return {
                        url,
                        thumbnail: idMatch
                            ? `https://img.youtube.com/vi/${idMatch[1]}/0.jpg`
                            : ''
                    };
                }),
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

            setCategories(allCategories);
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

            // 1. Campos básicos
            fd.append("id", product_id);
            fd.append("name", formData.name);
            fd.append("slug", formData.slug || "");
            fd.append("status", formData.status);

            fd.append("descriptionBlocks", JSON.stringify(
                formData.productDescriptions.map(d => ({
                    title: d.title,
                    description: d.description,
                })) || []
            ));

            // 2. Campos numéricos com tratamento especial
            const numericFields = {
                price_per: formData.price_per,
                price_of: formData.price_of,
                weight: formData.weight,
                length: formData.length,
                width: formData.width,
                height: formData.height,
                stock: formData.stock
            };

            Object.entries(numericFields).forEach(([key, value]) => {
                fd.append(key, value ? Number(value).toString() : "0");
            });

            fd.append("mainPromotion_id", formData.mainPromotion_id || "");

            // 4. Demais campos
            fd.append("metaTitle", formData.metaTitle || "");
            fd.append("metaDescription", formData.metaDescription || "");
            fd.append("keywords", JSON.stringify(formData.keywords || []));
            fd.append("skuMaster", formData.skuMaster || "");
            fd.append("brand", formData.brand || "");
            fd.append("ean", formData.ean || "");
            fd.append("categoryIds", JSON.stringify(formData.categories));

            // 5. Vídeos - Mantém os existentes e adiciona novos
            const currentVideos = formData.videos.filter(v => v.url !== "");
            fd.append("videoUrls", JSON.stringify(currentVideos.map(v => v.url)));

            // 6. Imagens existentes
            const currentImages = formData.existingImages.filter(img => img.url !== "");
            fd.append("imageUrls", JSON.stringify(currentImages.map(img => img.url)));

            // 7. Novas imagens
            formData.newImages.forEach(file => {
                fd.append("imageFiles", file);
            });

            // 7. Variantes (só envia se houver conteúdo)
            if (formData.variants.length > 0) {
                const variantsPayload = formData.variants.map(v => ({
                    id: v.id,
                    sku: v.sku,
                    price_per: Number(v.price_per) || 0,
                    price_of: Number(v.price_of) || null,
                    ean: v.ean || "",
                    stock: Number(v.stock) || 0,
                    allowBackorders: Boolean(v.allowBackorders),
                    sortOrder: Number(v.sortOrder) || 0,
                    attributes: v.variantAttributes,
                    videoUrls: v.videos.map(x => x.url)
                }));

                fd.append("variants", JSON.stringify(variantsPayload));

                // Imagens de variantes
                formData.variants.forEach((variant, idx) => {
                    variant.newImages.forEach(file => {
                        const renamedFile = new File(
                            [file],
                            `${idx}___${file.name}`,
                            { type: file.type }
                        );
                        fd.append("variantImageFiles", renamedFile);
                    });
                });
            }

            // 8. Relações (formato corrigido)
            const relationsPayload = relations.map(r => ({
                parentId: r.parentId || product_id,
                childId: r.childId || product_id,
                relationType: r.relationType,
                sortOrder: Number(r.sortOrder),
                isRequired: Boolean(r.isRequired),
            }));

            fd.append("relations", JSON.stringify(relationsPayload));

            // 9. Debug final
            console.log("Dados enviados:", Array.from(fd.entries()));

            await api.put("/product/update", fd, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            toast.success("Produto atualizado com sucesso!");
            router.refresh();

        } catch (err) {
            console.error("Erro detalhado:", err);
            toast.error("Falha na atualização. Verifique o console.");
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
                        <h3 className="font-semibold mb-4 text-black">Informações Básicas</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block mb-1 text-sm font-medium text-black">
                                    Nome do produto
                                </label>
                                <Input
                                    className="bg-white text-black p-5"
                                    placeholder="Nome do produto"
                                    value={formData.name}
                                    onChange={e => updateField("name", e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block mb-1 text-sm font-medium text-black">
                                    Slug do produto
                                </label>
                                <Input
                                    className="bg-white text-black"
                                    placeholder="Slug"
                                    value={formData.slug}
                                    onChange={e => updateField("slug", e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block mb-1 text-sm font-medium text-black">
                                    SKU Mestre
                                </label>
                                <Input
                                    className="bg-white text-black"
                                    placeholder="SKU Mestre"
                                    value={formData.skuMaster}
                                    onChange={e => updateField("skuMaster", e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block mb-1 text-sm font-medium text-black">
                                    Status
                                </label>
                                <Select
                                    className="bg-white text-black"
                                    selectedKeys={new Set([formData.status])}
                                    onSelectionChange={(keys) => {
                                        const value = Array.from(keys)[0]?.toString() as StatusProduct || "DISPONIVEL";
                                        updateField("status", value);
                                    }}
                                >
                                    <SelectItem key="DISPONIVEL" value="DISPONIVEL" className="bg-white text-black">
                                        Disponível
                                    </SelectItem>
                                    <SelectItem key="INDISPONIVEL" value="INDISPONIVEL" className="bg-white text-black">
                                        Indisponível
                                    </SelectItem>
                                </Select>
                            </div>

                            <div>
                                <label className="block mb-1 text-sm font-medium text-black">
                                    Preço De
                                </label>
                                <CurrencyInputUpdate
                                    value={formData.price_per ? Number(formData.price_per) : null}
                                    onChange={(val) => updateField("price_per", val?.toString() || "")}
                                    placeholder="Preço De"
                                />
                            </div>

                            <div>
                                <label className="block mb-1 text-sm font-medium text-black">
                                    Preço Por
                                </label>
                                <CurrencyInputUpdate
                                    value={formData.price_of ? Number(formData.price_of) : null}
                                    onChange={(val) => updateField("price_of", val?.toString() || "")}
                                    placeholder="Preço Por"
                                />
                            </div>

                        </div>
                    </div>

                    {/* — Detalhes do Produto — */}
                    <div className="bg-white p-6 rounded-lg shadow border">
                        <h3 className="font-semibold mb-4 text-black">Detalhes do Produto</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block mb-1 text-sm font-medium text-black">
                                    Marca
                                </label>
                                <Input
                                    className="bg-white text-black"
                                    placeholder="Marca"
                                    value={formData.brand}
                                    onChange={e => updateField("brand", e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block mb-1 text-sm font-medium text-black">
                                    EAN
                                </label>
                                <Input
                                    className="bg-white text-black"
                                    placeholder="EAN"
                                    value={formData.ean}
                                    onChange={e => updateField("ean", e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block mb-1 text-sm font-medium text-black">
                                    Peso (kg)
                                </label>
                                <Input
                                    className="bg-white text-black"
                                    placeholder="Peso (kg)"
                                    type="number"
                                    value={formData.weight}
                                    onChange={e => updateField("weight", e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block mb-1 text-sm font-medium text-black">
                                    Comprimento (cm)
                                </label>
                                <Input
                                    className="bg-white text-black"
                                    placeholder="Comprimento (cm)"
                                    type="number"
                                    value={formData.length}
                                    onChange={e => updateField("length", e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block mb-1 text-sm font-medium text-black">
                                    Largura (cm)
                                </label>
                                <Input
                                    className="bg-white text-black"
                                    placeholder="Largura (cm)"
                                    type="number"
                                    value={formData.width}
                                    onChange={e => updateField("width", e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block mb-1 text-sm font-medium text-black">
                                    Altura (cm)
                                </label>
                                <Input
                                    className="bg-white text-black"
                                    placeholder="Altura (cm)"
                                    type="number"
                                    value={formData.height}
                                    onChange={e => updateField("height", e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block mb-1 text-sm font-medium text-black">
                                    Estoque
                                </label>
                                <Input
                                    className="bg-white text-black"
                                    placeholder="Estoque"
                                    type="number"
                                    value={formData.stock}
                                    onChange={e => updateField("stock", e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm mb-1 text-black">Promoção Principal</label>
                                <Select
                                    className="bg-white text-black"
                                    placeholder="Sem promoção"
                                    selectedKeys={formData.mainPromotion_id ? [formData.mainPromotion_id] : []}
                                    onSelectionChange={(keys) => {
                                        const key = Array.from(keys)[0]?.toString() || "";
                                        updateField("mainPromotion_id", key);
                                    }}
                                    items={promotions}
                                >
                                    {(promotion) => (
                                        <SelectItem
                                            key={promotion.id}
                                            value={promotion.id}
                                            textValue={promotion.name}
                                            className="text-black bg-white"
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
                            <h3 className="font-semibold text-black">Descrições Detalhadas</h3>
                            <Button
                                className="bg-green-600 text-white"
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
                                    <span className="font-medium text-black">Descrição {i + 1}</span>
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
                                        <TrashIcon className="w-4 h-4" color="red" />
                                    </Button>
                                </div>
                                <div>
                                    <label className="block mb-1 text-sm font-medium text-black">
                                        Titulo
                                    </label>
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
                                </div>

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
                        <h3 className="font-semibold mb-3 text-black">SEO</h3>
                        <div>
                            <label className="block mb-1 text-sm font-medium text-black">
                                Meta título
                            </label>
                            <Input
                                className="mb-4 bg-white text-black"
                                placeholder="Meta título"
                                value={formData.metaTitle}
                                onChange={e => updateField("metaTitle", e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block mb-1 text-sm font-medium text-black">
                                Meta descrição
                            </label>
                            <Textarea
                                className="bg-white text-black"
                                placeholder="Meta descrição"
                                value={formData.metaDescription}
                                onChange={e => updateField("metaDescription", e.target.value)}
                            />
                        </div>

                        <div className="mt-10">
                            <label className="block mb-1 text-sm font-medium text-black">
                                Palavras chaves
                            </label>
                            <Input
                                className="bg-white text-black"
                                placeholder="Palavras-chave (separadas por vírgula)"
                                value={formData.keywords}
                                onChange={e => updateField("keywords", e.target.value)}
                            />
                        </div>
                    </div>

                    {/* — Vídeos — */}
                    <div className="bg-white p-6 rounded-lg shadow border">
                        <h3 className="font-semibold mb-2 text-black">Vídeos</h3>
                        {formData.videos.map((v, i) => (
                            <div key={i} className="flex items-center gap-4 mb-4"> {/* Aumente o gap e alterei a margem */}
                                {/* Thumbnail preview */}
                                {v.thumbnail && (
                                    <img
                                        src={v.thumbnail}
                                        className="w-24 h-16 object-cover rounded"
                                        alt="Thumbnail do vídeo"
                                    />
                                )}

                                <div className="flex items-center gap-2 flex-1">
                                    <input
                                        type="url"
                                        className="border p-2 rounded flex-1 text-black"
                                        value={v.url}
                                        placeholder="URL do YouTube"
                                        pattern="^(https?\:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+"
                                        onChange={e => {
                                            const arr = [...formData.videos];
                                            const url = e.target.value;
                                            // Regex melhorada para capturar diferentes formatos de URLs do YouTube
                                            const idMatch = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
                                            arr[i] = {
                                                url,
                                                thumbnail: idMatch
                                                    ? `https://img.youtube.com/vi/${idMatch[1]}/0.jpg`
                                                    : undefined,
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
                                        <TrashIcon className="w-4 h-4" color="red" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                        <Button
                            className="text-indigo-600 font-medium"
                            size="sm"
                            startContent={<PlusIcon color="red" />}
                            onClick={() => setFormData(f => ({
                                ...f,
                                videos: [...f.videos, { url: '', thumbnail: '' }] // Garantir estrutura inicial
                            }))}
                        >
                            Adicionar Vídeo
                        </Button>
                    </div>

                    {/* — Imagens — */}
                    <div className="bg-white p-6 rounded-lg shadow border">
                        <h3 className="font-semibold mb-2 text-black">Imagens</h3>
                        <div
                            {...getRootProps()}
                            className="border-2 border-dashed p-6 text-center cursor-pointer"
                        >
                            <input {...getInputProps()} />
                            <UploadIcon className="w-8 h-8 mx-auto text-gray-400" />
                            <p className="text-gray-400">Arraste ou clique para adicionar</p>
                        </div>
                        <div className="grid grid-cols-4 gap-4 mt-4">
                            {formData.existingImages.map((img, i) => (
                                <div key={`existing-${i}`} className="relative group">
                                    <Image
                                        src={`${API_URL}/files/${img.url}`}
                                        className="object-cover rounded"
                                        height={210}
                                        width={210}
                                        alt={img.altText || "imagem-produto"}
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
                                        <TrashIcon color="red" className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                            {formData.newImages.map((f: Blob | MediaSource, i: number) => (
                                <div key={`new-${i}`} className="relative group">
                                    <Image
                                        src={URL.createObjectURL(f)}
                                        className="object-cover rounded"
                                        width={210}
                                        height={210}
                                        alt="imagem-variante"
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
                                        <TrashIcon color="red" className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* — Categorias — */}
                    <div className="bg-white p-6 rounded-lg shadow border">
                        <h3 className="font-semibold mb-2 text-black">Categorias</h3>
                        <div className="grid grid-cols-3 gap-2">
                            {categories.map(category => (
                                <div key={category.id} className="flex items-center gap-2">
                                    <Checkbox
                                        isSelected={formData.categories.includes(category.id)}
                                        onValueChange={(isChecked) => {
                                            const updated = isChecked
                                                ? [...formData.categories, category.id]
                                                : formData.categories.filter(id => id !== category.id);
                                            updateField("categories", updated);
                                        }}
                                    >
                                        <span className="text-black">{category.name}</span>
                                    </Checkbox>
                                </div>
                            ))}
                        </div>
                    </div>

                    <CollapsibleInfo />

                    {/* — Variantes — */}
                    <div className="bg-white p-6 rounded-lg shadow border">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-black">Variantes</h3>
                            <Button
                                className="text-white bg-green-600"
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
                                            existingImages: [],
                                            newImages: [],
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
                                    style={{ color: "black" }}
                                    key={vi}
                                    aria-label={`Variante ${vi + 1}`}
                                    title={
                                        <span className="text-black">
                                            {`Variante ${vi + 1}`}
                                        </span>
                                    }
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block mb-1 text-sm font-medium text-black">
                                                SKU Variante
                                            </label>
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
                                        </div>

                                        <div>
                                            <label className="block mb-1 text-sm font-medium text-black">
                                                Preço De
                                            </label>
                                            <CurrencyInputUpdate
                                                placeholder="Preço De"
                                                value={variant.price_per ? Number(variant.price_per) : null}
                                                onChange={(val) => {
                                                    const arr = [...formData.variants];
                                                    arr[vi].price_per = val?.toString() || "";
                                                    setFormData({ ...formData, variants: arr });
                                                }}
                                            />
                                        </div>

                                        <div>
                                            <label className="block mb-1 text-sm font-medium text-black">
                                                Preço Por
                                            </label>
                                            <CurrencyInputUpdate
                                                placeholder="Preço Por"
                                                value={variant.price_of ? Number(variant.price_of) : null}
                                                onChange={(val) => {
                                                    const arr = [...formData.variants];
                                                    arr[vi].price_of = val?.toString() || "";
                                                    setFormData({ ...formData, variants: arr });
                                                }}
                                            />
                                        </div>

                                        <div>
                                            <label className="block mb-1 text-sm font-medium text-black">
                                                EAN Variante
                                            </label>
                                            <Input
                                                className="bg-white text-black"
                                                placeholder="EAN Variante"
                                                value={variant.ean}
                                                onChange={e => {
                                                    const arr = [...formData.variants];
                                                    arr[vi].ean = e.target.value;
                                                    setFormData(f => ({ ...f, variants: arr }));
                                                }}
                                            />
                                        </div>

                                        <div>
                                            <label className="block mb-1 text-sm font-medium text-black">
                                                Estoque Variantes
                                            </label>
                                            <Input
                                                className="bg-white text-black"
                                                placeholder="Estoque Variantes"
                                                type="number"
                                                value={variant.stock}
                                                onChange={e => updateField("stock", e.target.value)}
                                            />
                                        </div>

                                        <Checkbox
                                            className="text-black"
                                            style={{ color: "black" }}
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
                                        <h4 className="font-medium mb-2 text-black">Atributos</h4>
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
                                                    <TrashIcon color="red" className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))}
                                        <Button className="text-indigo-600" size="sm" startContent={<PlusIcon color="red" />} onClick={() => {
                                            const arr = [...formData.variants];
                                            arr[vi].variantAttributes.push({ key: "", value: "" });
                                            setFormData(f => ({ ...f, variants: arr }));
                                        }}>
                                            Adicionar Atributo
                                        </Button>
                                    </div>

                                    <div className="mb-4">
                                        <h4 className="font-medium mb-2 text-black">Imagens da Variante</h4>
                                        <DropzoneVariant index={vi} formData={formData} setFormData={setFormData} />
                                    </div>

                                    <div className="mb-4">
                                        <h4 className="font-medium mb-2 text-black">Vídeos da Variante</h4>
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
                                                    <TrashIcon color="red" className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))}
                                        <Button className="text-indigo-600" size="sm" startContent={<PlusIcon />} onClick={() => {
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
                        <h3 className="font-semibold mb-3 text-black">Relações de Produtos</h3>
                        <Tabs
                            selectedKey={tab}
                            onSelectionChange={(k) => setTab(k as "child" | "parent")}
                            classNames={{
                                tabList: "gap-4 p-0",
                                tab: "px-4 h-8 data-[selected=true]:bg-black data-[selected=true]:text-white",
                                cursor: "hidden"
                            }}
                        >
                            <Tab
                                key="child"
                                title="Como Filho"
                                className="text-gray-500 bg-gray-100 transition-all"
                            />
                            <Tab
                                key="parent"
                                title="Como Pai"
                                className="text-gray-500 bg-gray-100 transition-all"
                            />
                        </Tabs>

                        {relations.map((r, ri) => {
                            // Encontra o produto relacionado baseado na aba
                            allProducts.find(p =>
                                tab === 'child' ? p.id === r.parentId : p.id === r.childId
                            );

                            return (
                                <div key={ri} className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-3">

                                    {/* Select de Relacionamento */}
                                    <Select
                                        placeholder={tab === 'child' ? "Produto Pai" : "Produto Filho"}
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
                                        className="col-span-2 text-black bg-white"
                                        style={{ color: "black" }}
                                        isDisabled={!allProducts.length}
                                    >
                                        {allProducts.map(product => (
                                            <SelectItem
                                                key={product.id}
                                                value={product.id}
                                                textValue={product.name}
                                                className="bg-white text-black"
                                            >
                                                {product.name} ({product.id})
                                            </SelectItem>
                                        ))}
                                    </Select>

                                    {/* Tipo de Relação */}
                                    <Select
                                        className="bg-white text-black"
                                        placeholder="Tipo"
                                        selectedKeys={[r.relationType]}
                                        onSelectionChange={(keys) =>
                                            updateRelation(ri, 'relationType', Array.from(keys)[0] as RelationType)
                                        }
                                    >
                                        <SelectItem className="bg-white text-black" key="VARIANT" value="VARIANT">Variante</SelectItem>
                                        <SelectItem className="bg-white text-black" key="SIMPLE" value="SIMPLE">Simples</SelectItem>
                                    </Select>

                                    {/* Ordem */}
                                    <Input
                                        className="bg-white text-black"
                                        type="number"
                                        placeholder="Ordem"
                                        value={r.sortOrder.toString()}
                                        onChange={(e) =>
                                            updateRelation(ri, 'sortOrder', Number(e.target.value))
                                        }
                                    />

                                    {/* Obrigatório */}
                                    <Checkbox
                                        className="bg-white text-black"
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
                                        <TrashIcon color="red" className="h-4 w-4" />
                                    </Button>
                                </div>
                            );
                        })}

                        <Button className="text-white bg-green-600" size="sm" startContent={<PlusIcon />} onClick={addRelation}>
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