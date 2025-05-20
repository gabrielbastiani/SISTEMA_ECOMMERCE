"use client"

import { setupAPIClientEcommerce } from '@/app/services/apiEcommerce';
import { Section } from "@/app/components/section"
import { TitlePage } from "@/app/components/section/titlePage"
import { SidebarAndHeader } from "@/app/components/sidebarAndHeader"
import { useState, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { Accordion, AccordionItem, Button, Input, Select, SelectItem, Textarea, Tabs, Tab, Tooltip, Checkbox } from '@nextui-org/react'
import {
  InformationCircleIcon,
  PlusIcon,
  TrashIcon,
  ArrowUpTrayIcon as UploadIcon
} from '@heroicons/react/24/outline'
import { Category } from 'Types/types';
import { Editor } from "@tinymce/tinymce-react";
import { toast } from 'react-toastify';
import { CollapsibleInfo } from '@/app/components/helpers_componentes/CollapsibleInfo';
import { CurrencyInput } from '@/app/components/add_product/CurrencyInput';
import Image from 'next/image';

const TOKEN_TINY = process.env.NEXT_PUBLIC_TINYMCE_API_KEY;

const initialFormData: ProductFormData = {
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

interface VideoInput {
  url: string;
  thumbnail?: string;
  isPrimary: boolean;
}
interface VariantFormData {
  id: string;
  sku: string;
  price_per: string;
  price_of?: string;
  ean?: string;
  stock?: string;
  allowBackorders?: boolean;
  sortOrder?: string;
  mainPromotion_id?: string;
  variantAttributes: AttributeInput[];
  images: File[];
  videos: VideoInput[];
}

interface ProductFormData {
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

interface RelationFormData {
  parentId?: string;
  childId?: string;
  relationType: "VARIANT" | "SIMPLE";
  sortOrder: number;
  isRequired: boolean;
}

interface AttributeInput {
  key: string;
  value: string;
  image?: File;
}

type PromotionOption = { id: string; name: string };

export default function Add_product() {

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [relations, setRelations] = useState<RelationFormData[]>([]);
  const [allProducts, setAllProducts] = useState<{ id: string; name: string }[]>([]);
  const [tab, setTab] = useState<'child' | 'parent'>('child');
  const [promotions, setPromotions] = useState<PromotionOption[]>([]);
  const [variantVideos, setVariantVideos] = useState<VideoInput[]>([]);

  const addVariantVideo = () => {
  setVariantVideos([...variantVideos, { url: '', isPrimary: false }]);
};

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const removeVariant = (index: number) => {
    setFormData(prev => {
      const newVariants = [...prev.variants];
      const removedVariant = newVariants.splice(index, 1)[0];

      // Limpa referências das imagens da variante removida
      if (removedVariant.images) {
        removedVariant.images.forEach(file => {
          if (file instanceof File) {
            URL.revokeObjectURL(URL.createObjectURL(file));
          }
        });
      }

      return {
        ...prev,
        variants: newVariants,
      };
    });
  };

  useEffect(() => {
    const api = setupAPIClientEcommerce();
    api.get('/promotions')
      .then(resp => setPromotions(resp.data))
      .catch(err => console.error('Erro ao carregar promoções', err));
  }, []);

  useEffect(() => {
    (async () => {
      const api = setupAPIClientEcommerce();
      const [cats, prods] = await Promise.all([
        api.get('/category/cms'),
        api.get('/get/products')
      ]);
      setCategories(cats.data.all_categories_disponivel);
      setAllProducts(prods.data.allow_products);
    })();
  }, []);

  // Upload de imagens principal
  const { getRootProps: getMainImagesRootProps, getInputProps: getMainImagesInputProps } = useDropzone({
    accept: { 'image/*': [] },
    onDrop: (acceptedFiles) => {
      setFormData(prev => ({ ...prev, images: [...prev.images, ...acceptedFiles] }))
    }
  });

  const updateRelation = <K extends keyof RelationFormData>(
    idx: number,
    field: K,
    value: RelationFormData[K]
  ) => {
    const arr = [...relations];
    arr[idx] = { ...arr[idx], [field]: value };
    setRelations(arr);
  };

  const update = <K extends keyof RelationFormData>(i: number, k: K, v: RelationFormData[K]) => {
    const a = [...relations]
    a[i] = { ...a[i], [k]: v }
    setRelations(a)
  }
  const add = () => setRelations(r => [...r, { relationType: 'VARIANT', sortOrder: 0, isRequired: false }])
  const remove = (i: number) => setRelations(r => r.filter((_, j) => j !== i))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (relations.some((r) => !r.parentId && !r.childId)) {
      toast.error("Em cada relação, escolha Produto Pai ou Filho.");
      return;
    }
    setLoading(true);

    try {
      const apiClient = setupAPIClientEcommerce();
      const formPayload = new FormData();

      // 1. Campos básicos do produto
      formPayload.append('name', formData.name);
      formPayload.append('description', formData.description);
      formPayload.append('price_per', formData.price_per);

      // Campos opcionais
      if (formData.slug) formPayload.append('slug', formData.slug);
      if (formData.price_of) formPayload.append('price_of', formData.price_of);
      if (formData.metaTitle) formPayload.append('metaTitle', formData.metaTitle);
      if (formData.metaDescription) formPayload.append('metaDescription', formData.metaDescription);
      if (formData.keywords) formPayload.append('keywords', JSON.stringify(formData.keywords.split(',').map(k => k.trim())));
      if (formData.brand) formPayload.append('brand', formData.brand);
      if (formData.ean) formPayload.append('ean', formData.ean);
      if (formData.skuMaster) formPayload.append('skuMaster', formData.skuMaster);
      if (formData.weight) formPayload.append('weight', formData.weight);
      if (formData.length) formPayload.append('length', formData.length);
      if (formData.width) formPayload.append('width', formData.width);
      if (formData.height) formPayload.append('height', formData.height);
      if (formData.stock) formPayload.append('stock', formData.stock);
      if (formData.status) formPayload.append('status', formData.status);
      if (formData.mainPromotion_id) formPayload.append('mainPromotion_id', formData.mainPromotion_id);

      // 2. Campos complexos
      formPayload.append('categoryIds', JSON.stringify(formData.categories));
      formPayload.append('descriptions', JSON.stringify(
        formData.productDescriptions.map(d => ({
          title: d.title,
          description: d.description,
          status: d.status || 'DISPONIVEL'
        }))
      ));
      formPayload.append('relations', JSON.stringify(
        relations.map(r => ({
          parentId: r.parentId,
          childId: r.childId,
          type: r.relationType || 'VARIANT',
          sortOrder: r.sortOrder || 0,
          isRequired: r.isRequired || false
        }))
      ));
      formPayload.append('variants', JSON.stringify(
        formData.variants
          .filter(variant => variant.sku.trim() && variant.price_per.trim())
          .map(variant => ({
            sku: variant.sku,
            price_per: Number(variant.price_per),
            price_of: variant.price_of ? Number(variant.price_of) : undefined,
            ean: variant.ean || undefined,
            stock: variant.stock ? Number(variant.stock) : 0,
            allowBackorders: variant.allowBackorders || false,
            sortOrder: variant.sortOrder ? Number(variant.sortOrder) : 0,
            mainPromotion_id: variant.mainPromotion_id || undefined,
            images: variant.images.map((_, index) => ({
              url: `variant-${variant.sku}-${index}`,
              isPrimary: index === 0
            })),
            videos: variant.videos.map(vid => ({
              url: vid.url,
              isPrimary: vid.isPrimary || false
            })),
            attributes: variant.variantAttributes.map(attr => ({
              key: attr.key,
              value: attr.value,
              isPrimaryImage: !!attr.image,
              attributeImageUrl: attr.image ? `attribute-${variant.sku}-${attr.key}` : undefined
            }))
          }))
      ));

      // 3. Arquivos
      formData.images.forEach(file => formPayload.append('images', file));

      formData.variants.forEach((variant, variantIndex) => {
        variant.images.forEach((file, fileIndex) => {
          const renamed = new File([file], `variant-${variantIndex}-${fileIndex}___${file.name}`);
          formPayload.append('variantImages', renamed);
        });

        variant.variantAttributes.forEach((attr, attrIndex) => {
          if (attr.image) {
            const renamed = new File(
              [attr.image],
              `attribute-${variantIndex}-${attrIndex}___${attr.image.name}`
            );
            formPayload.append('attributeImages', renamed);
          }
        });
      });

      console.log(formPayload)

      // 4. Envio da requisição
      await apiClient.post('/product/create', formPayload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });

      toast.success('Produto criado com sucesso!');
      setFormData(initialFormData);

    } catch (err: any) {
      console.error('Erro detalhado:', err.response?.data || err.message);
      toast.error(`Erro ao cadastrar: ${err.response?.data?.error || 'Verifique os dados e tente novamente'}`);
    } finally {
      setLoading(false);
    }
  };

  // Manipuladores de campos
  const addVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          id: generateId(),
          sku: '',
          price_per: '',
          price_of: '',
          ean: '',
          stock: '',
          allowBackorders: false,
          sortOrder: '',
          mainPromotion_id: '',
          variantAttributes: [],
          images: [],
          videos: [],
        }
      ]
    }))
  }

  const addDescription = () => {
    setFormData(prev => ({
      ...prev,
      productDescriptions: [...prev.productDescriptions, {
        title: '',
        description: '',
        status: 'DISPONIVEL'
      }]
    }))
  }

  return (
    <SidebarAndHeader>
      <Section>
        <TitlePage title="ADICIONAR PRODUTO" />

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seção de Informações Básicas */}
          <div className="bg-white p-6 rounded-lg shadow-sm border-2 border-black">
            <h3 className="text-lg font-semibold mb-4 text-black">Informações Básicas</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-2 text-black">

              <div className="flex items-center mb-1">
                <Tooltip content={
                  <div className="text-sm text-red-500 bg-white p-4">
                    Escreva aqui o nome completo do seu produto principal.
                  </div>
                }>
                  <InformationCircleIcon className="w-4 h-4 text-blue-700" />
                </Tooltip>
                <Input
                  placeholder="Nome do Produto"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="flex items-center mb-1">
                <Tooltip content={
                  <div className="text-sm text-red-500 bg-white p-4">
                    Escreva aqui, o nome do produto principal novamente, <br />
                    ou digite o nome do produto mais simplificado, esse nome,<br />
                    aparecera na URL do navegador, EX: camiseta-de-cola-aberta.
                  </div>
                }>
                  <InformationCircleIcon className="w-4 h-4 text-blue-700" />
                </Tooltip>
                <Input
                  placeholder="Slug (opcional)"
                  value={formData.slug || ''}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                />
              </div>

              <div className="flex items-center mb-1">
                <Tooltip content={
                  <div className="text-sm text-red-500 bg-white p-4">
                    Digite aqui o codigo do seu produto.
                  </div>
                }>
                  <InformationCircleIcon className="w-4 h-4 text-blue-700" />
                </Tooltip>
                <Input
                  placeholder="SKU Mestre"
                  value={formData.skuMaster || ''}
                  onChange={(e) => setFormData({ ...formData, skuMaster: e.target.value })}
                />
              </div>

              <div className="flex items-center mb-1">
                <Tooltip content={
                  <div className="text-sm text-red-500 bg-white p-4">
                    Seu produto vai ficar diponivel na loja ou não?
                  </div>
                }>
                  <InformationCircleIcon className="w-4 h-4 text-blue-700" />
                </Tooltip>
                <Select
                  placeholder="Status do Produto"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                >
                  <SelectItem className='text-black bg-white' key="DISPONIVEL" value="DISPONIVEL">Disponível</SelectItem>
                  <SelectItem className='text-black bg-white' key="INDISPONIVEL" value="INDISPONIVEL">Indisponível</SelectItem>
                </Select>
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-black">
                  Promoção Principal (opcional)
                </label>
                <div className="flex items-center mb-1">
                  <Tooltip content={
                    <div className="text-sm text-red-500 bg-white p-4">
                      Vincule aqui, alguma promoção para esse produto.
                    </div>
                  }>
                    <InformationCircleIcon className="w-4 h-4 text-blue-700" />
                  </Tooltip>
                  <select
                    className="w-full border border-gray-300 rounded p-2 bg-white text-black"
                    value={formData.mainPromotion_id || ''}
                    onChange={e =>
                      setFormData({ ...formData, mainPromotion_id: e.target.value })
                    }
                  >
                    <option value="">— Sem promoção —</option>
                    {promotions.map(promo => (
                      <option key={promo.id} value={promo.id}>
                        {promo.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium">Preço de</label>
                <div className="flex items-center mb-1">
                  <Tooltip content={
                    <div className="text-sm text-red-500 bg-white p-4">
                      Digite aqui, um valor menor, por exemplo: R$5,00. <br />Ou o mesmo valor que vai ser inserido no campo "Preço por",<br /> campo seguinte.
                    </div>
                  }>
                    <InformationCircleIcon className="w-4 h-4 text-blue-700" />
                  </Tooltip>
                  <CurrencyInput
                    value={Number(formData.price_per) || 0}
                    onChange={num => setFormData({ ...formData, price_per: num.toString() })}
                    placeholder="Preço de"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium">Preço por</label>
                <div className="flex items-center mb-1">
                  <Tooltip content={
                    <div className="text-sm text-red-500 bg-white p-4">
                      Digite aqui, um valor maior, por exemplo: R$10,00. <br />
                      Ou o mesmo valor que inserio no campo "Preço de",<br />
                      campo seguinte.
                    </div>
                  }>
                    <InformationCircleIcon className="w-4 h-4 text-blue-700" />
                  </Tooltip>
                  <CurrencyInput
                    value={Number(formData.price_of) || 0}
                    onChange={num =>
                      setFormData({ ...formData, price_of: num > 0 ? num.toString() : '' })
                    }
                    placeholder="Preço por"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Seção de Detalhes do Produto */}
          <div className="bg-white p-6 rounded-lg shadow-sm border-2 border-black text-black">
            <h3 className="text-lg font-semibold mb-4">Detalhes do Produto</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center mb-1">
                <Tooltip content={
                  <div className="text-sm text-red-500 bg-white p-4">
                    Digite aqui, a marca desse produto.
                  </div>
                }>
                  <InformationCircleIcon className="w-4 h-4 text-blue-700" />
                </Tooltip>
                <Input
                  placeholder="Marca"
                  value={formData.brand || ''}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                />
              </div>

              <div className="flex items-center mb-1">
                <Tooltip content={
                  <div className="text-sm text-red-500 bg-white p-4">
                    Em resumo, o EAN é o “RG” do produto no varejo: um número único padronizado<br />
                    globalmente que facilita vendas, estoque e logística.
                  </div>
                }>
                  <InformationCircleIcon className="w-4 h-4 text-blue-700" />
                </Tooltip>
                <Input
                  placeholder="EAN"
                  value={formData.ean || ''}
                  onChange={(e) => setFormData({ ...formData, ean: e.target.value })}
                />
              </div>

              <div className="flex items-center mb-1">
                <Tooltip content={
                  <div className="text-sm text-red-500 bg-white p-4">
                    Digite aqui o peso total bruto do seu produto EX: 25,55
                  </div>
                }>
                  <InformationCircleIcon className="w-4 h-4 text-blue-700" />
                </Tooltip>
                <Input
                  type="number"
                  placeholder="Peso (kg)"
                  value={formData.weight || ''}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                />
              </div>

              <div className="flex items-center mb-1">
                <Tooltip content={
                  <div className="text-sm text-red-500 bg-white p-4">
                    Digite aqui o compromento total do seu produto EX: 45,32
                  </div>
                }>
                  <InformationCircleIcon className="w-4 h-4 text-blue-700" />
                </Tooltip>
                <Input
                  type="number"
                  placeholder="Comprimento (cm)"
                  value={formData.length || ''}
                  onChange={(e) => setFormData({ ...formData, length: e.target.value })}
                />
              </div>

              <div className="flex items-center mb-1">
                <Tooltip content={
                  <div className="text-sm text-red-500 bg-white p-4">
                    Digite aqui a largura total do seu produto EX: 45,32
                  </div>
                }>
                  <InformationCircleIcon className="w-4 h-4 text-blue-700" />
                </Tooltip>
                <Input
                  type="number"
                  placeholder="Largura (cm)"
                  value={formData.width || ''}
                  onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                />
              </div>

              <div className="flex items-center mb-1">
                <Tooltip content={
                  <div className="text-sm text-red-500 bg-white p-4">
                    Digite aqui a altura total do seu produto EX: 45,32
                  </div>
                }>
                  <InformationCircleIcon className="w-4 h-4 text-blue-700" />
                </Tooltip>
                <Input
                  type="number"
                  placeholder="Altura (cm)"
                  value={formData.height || ''}
                  onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                />
              </div>

              <div className="flex items-center mb-1">
                <Tooltip content={
                  <div className="text-sm text-red-500 bg-white p-4">
                    Digite aqui quantos produtos tem no estoque desse produto.
                  </div>
                }>
                  <InformationCircleIcon className="w-4 h-4 text-blue-700" />
                </Tooltip>
                <Input
                  type="number"
                  placeholder="Estoque"
                  value={formData.stock || ''}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                />
              </div>

            </div>
          </div>

          {/* Seção de Descrições */}
          <div className="bg-white p-6 rounded-lg shadow-sm border-2 border-black text-black">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Descrições Detalhadas</h3>
              <Button onClick={addDescription} startContent={<PlusIcon />} size="sm" className='bg-green-600 text-white'>
                Adicionar Descrição
              </Button>
            </div>

            {formData.productDescriptions.map((desc, index) => (
              <div key={index} className="mb-6 p-4 border rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">Descrição {index + 1}</h4>
                  <Button
                    size="sm"
                    isIconOnly
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      productDescriptions: prev.productDescriptions.filter((_, i) => i !== index)
                    }))}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex items-center mb-1">
                  <Tooltip content={
                    <div className="text-sm text-red-500 bg-white p-4">
                      Digite aqui o titulo dessa descrição EX: Imformações do Produto
                    </div>
                  }>
                    <InformationCircleIcon className="w-4 h-4 text-blue-700" />
                  </Tooltip>
                  <Input
                    placeholder="Título"
                    value={desc.title}
                    onChange={(e) => {
                      const newDescriptions = [...formData.productDescriptions]
                      newDescriptions[index].title = e.target.value
                      setFormData({ ...formData, productDescriptions: newDescriptions })
                    }}
                    className="mb-4"
                  />
                </div>

                <Tooltip content={
                  <div className="text-sm text-red-500 bg-white p-4">
                    Aqui você precisa digitar uma descrição com relacionada com o titulo que acabou de digitar.
                  </div>
                }>
                  <InformationCircleIcon className="w-4 h-4 text-blue-700" />
                </Tooltip>
                <Editor
                  apiKey={TOKEN_TINY}
                  value={desc.description}
                  onEditorChange={(content) => {
                    const descs = [...formData.productDescriptions];
                    descs[index].description = content;
                    setFormData({ ...formData, productDescriptions: descs });
                  }}
                  init={{
                    height: 300,
                    menubar: true,
                    plugins: [
                      'advlist autolink lists link image charmap print preview anchor',
                      'searchreplace visualblocks code fullscreen',
                      'insertdatetime media table paste code help wordcount'
                    ],
                    toolbar: 'undo redo | formatselect | ' +
                      'bold italic backcolor | alignleft aligncenter ' +
                      'alignright alignjustify | bullist numlist outdent indent | ' +
                      'removeformat | help',
                    content_style: 'body { font-family: Arial, sans-serif; font-size:14px }'
                  }}
                />
              </div>
            ))}
          </div>

          {/* Seção de SEO */}
          <div className="bg-white p-6 rounded-lg shadow-sm border-2 border-black text-black">
            <h3 className="text-lg font-semibold mb-4">SEO</h3>

            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center mb-1">
                <Tooltip content={
                  <div className="text-sm text-red-500 bg-white p-4">
                    Aqui você precisa digitar um titulo semantico para para o melhor<br />
                    rankeamento nos motores de busca como Google por exemplo.
                  </div>
                }>
                  <InformationCircleIcon className="w-4 h-4 text-blue-700" />
                </Tooltip>
                <Input
                  placeholder="Meta Título"
                  value={formData.metaTitle || ''}
                  onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                />
              </div>

              <div className="flex items-center mb-1">
                <Tooltip content={
                  <div className="text-sm text-red-500 bg-white p-4">
                    Digite aqui, uma pequena descrição semantica para que apareça nas<br />
                    buscas dos motores de busca com o Google por exemplo.
                  </div>
                }>
                  <InformationCircleIcon className="w-4 h-4 text-blue-700" />
                </Tooltip>
                <Textarea
                  className='mb-7'
                  placeholder="Meta Descrição"
                  value={formData.metaDescription || ''}
                  onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                />
              </div>

              <div className="flex items-center mb-1">
                <Tooltip content={
                  <div className="text-sm text-red-500 bg-white p-4">
                    Palavras chaves são as principalis palavras com relação a um assunto,<br />
                    nesse caso, insira palavras que considera importante para esse produto.<br />
                    Digite as palavras e separe elas por virgula, EX: caixa de som, som potente e etc...
                  </div>
                }>
                  <InformationCircleIcon className="w-4 h-4 text-blue-700" />
                </Tooltip>
                <Input
                  placeholder="Palavras-chave (separadas por vírgula)"
                  value={formData.keywords || ''}
                  onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                />
              </div>

            </div>
          </div>

          {/* Seção de Vídeos */}
          <div className="bg-white p-6 rounded-lg shadow-sm border-black border-2 text-black">
            <div className="flex items-center mb-1">
              <Tooltip content={
                <div className="text-sm text-red-500 bg-white p-4">
                  Insira links dos videos que apresentam esse produto, dicas, apresentação etc...<br />
                  Aconselhamos que hospede seus videos em alguma conta no youtube.
                </div>
              }>
                <InformationCircleIcon className="w-4 h-4 text-blue-700" />
              </Tooltip>
            </div>
            <h3 className="text-lg font-semibold mb-4">Vídeos</h3>
            {formData.videos.map((vid, videoIndex) => (
              <div key={videoIndex} className="flex items-center space-x-4 mb-4">
                <input
                  type="url"
                  placeholder="URL do vídeo"
                  value={vid.url}
                  onChange={e => {
                    const url = e.target.value;
                    const idMatch = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
                    const thumbnail = idMatch
                      ? `https://img.youtube.com/vi/${idMatch[1]}/0.jpg`
                      : undefined;
                    const updatedVideos = [...formData.videos];
                    updatedVideos[videoIndex] = {
                      ...vid,
                      url,
                      thumbnail,
                      isPrimary: vid.isPrimary
                    };
                    setFormData({ ...formData, videos: updatedVideos });
                  }}
                  className="border p-2 rounded flex-1"
                />
                <button
                  type="button"
                  onClick={() => {
                    const vids = formData.videos.filter((_, idx) => idx !== videoIndex);
                    setFormData({ ...formData, videos: vids });
                  }}
                  className="text-red-500"
                >
                  Remover
                </button>
                {vid.thumbnail && (
                  <img src={vid.thumbnail} className="w-24 h-16 object-cover rounded" />
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => setFormData(prev => ({
                ...prev,
                videos: [...prev.videos, {
                  url: '',
                  thumbnail: '',
                  isPrimary: false // Adicionar valor padrão obrigatório
                }]
              }))}
              className="text-indigo-600 font-medium"
            >
              Adicionar Vídeo
            </button>
          </div>

          {/* Seção de Imagens */}
          <div className="bg-white p-6 rounded-lg shadow-sm text-black border-black border-2">
            <div className="flex items-center mb-1">
              <Tooltip content={
                <div className="text-sm text-red-500 bg-white p-4">
                  Insira no máximo 20 imagens para o seu produto.
                </div>
              }>
                <InformationCircleIcon className="w-4 h-4 text-blue-700" />
              </Tooltip>
            </div>
            <h3 className="text-lg font-semibold mb-4">Imagens do Produto</h3>

            <div {...getMainImagesRootProps()} className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer">
              <input {...getMainImagesInputProps()} />
              <UploadIcon className="w-8 h-8 mx-auto text-gray-400" />
              <p className="mt-2">Arraste imagens ou clique para selecionar</p>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4">
              {formData.images.map((file, index) => (
                <div key={index} className="relative group">
                  <Image
                    src={URL.createObjectURL(file)}
                    alt={file.name || "imagem-produto"}
                    className="object-cover rounded-lg"
                    height={210}
                    width={210}
                  />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      images: prev.images.filter((_, i) => i !== index)
                    }))}
                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Seção de Categorias */}
          <div className="bg-white p-6 rounded-lg shadow-sm text-black border-black border-2">
            <div className="flex items-center mb-1">
              <Tooltip content={
                <div className="text-sm text-red-500 bg-white p-4">
                  Selecione a, ou as categorias que serão vinculadas a esse produto<br />
                  para que o seu cliente encontre de forma mais facil seu produto em sua loja.
                </div>
              }>
                <InformationCircleIcon className="w-4 h-4 text-blue-700" />
              </Tooltip>
            </div>
            <h3 className="text-lg font-semibold mb-4">Categorias</h3>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {categories.map(category => (
                <label key={category.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.categories.includes(category.id)}
                    onChange={(e) => {
                      const newCategories = e.target.checked
                        ? [...formData.categories, category.id]
                        : formData.categories.filter(id => id !== category.id)
                      setFormData({ ...formData, categories: newCategories })
                    }}
                    className="form-checkbox h-4 w-4 text-indigo-600"
                  />
                  <span>{category.name}</span>
                </label>
              ))}
            </div>
          </div>

          <CollapsibleInfo />

          {/* Seção de Variantes */}
          <div className="bg-white p-6 rounded-lg shadow-sm text-black border-black border-2">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Variantes</h3>
              <Button onClick={addVariant} startContent={<PlusIcon />} size="sm" className='bg-green-600 text-white'>
                Adicionar Variante
              </Button>
            </div>

            <Accordion selectionMode="multiple" variant="splitted">
              {formData.variants.map((variant, index) => (
                <AccordionItem
                  key={variant.id} // Usando ID único estático
                  aria-label={variant.sku || `Variante ${index + 1}`}
                  title={
                    <div className="flex justify-between items-center w-full">
                      <div className="flex items-center gap-2">
                        <span className="text-black">
                          {variant.sku || `Variante ${index + 1}`}
                        </span>
                      </div>
                      <Button
                        isIconOnly
                        size="sm"
                        className="bg-transparent hover:bg-gray-200"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          removeVariant(index)
                        }}
                      >
                        <TrashIcon className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  }
                >
                  <VariantForm
                    variant={variant}
                    index={index}
                    formData={formData}
                    setFormData={setFormData}
                    promotions={promotions}
                  />
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* --- Relações de Produto --- */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-black mb-3">Variantes relacionadas com produtos</h3>
            <Tabs
              selectedKey={tab}
              onSelectionChange={(v) => setTab(v as 'child' | 'parent')}
              classNames={{
                tab: 'text-red-500'
              }}
            >
              <Tab
                key="child"
                title="Cadastrar COMO FILHO">
                {/* Explicação geral */}
                <p className="mb-4 text-sm text-gray-600">
                  Aqui você escolhe um produto existente como “pai” e faz deste novo produto seu <strong>filho</strong>.
                  Útil quando você quer agrupar opções variantes ou simples A ={'>'} B.
                </p>
              </Tab>
              <Tab
                key="parent"
                title="Cadastrar COMO PAI"
              >
                <p className="mb-4 text-sm text-gray-600">
                  Aqui você seleciona um ou mais produtos já cadastrados como “filhos” do produto atual.
                  Use quando este produto novo for o principal (ex.: base) e outros forem opções derivadas.
                </p>
              </Tab>
            </Tabs>

            {/* Relações */}
            {relations.map((r, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-3 items-end">
                {/* Se a aba for child, bloqueia childId */}
                <select
                  className="border p-2 rounded bg-white text-black"
                  disabled={tab === 'parent'}
                  value={tab === 'child' ? r.parentId : r.childId}
                  onChange={e => update(i, tab === 'child' ? 'parentId' : 'childId', e.target.value)}
                >
                  <option value="">
                    {tab === 'child' ? 'Selecione Produto Pai' : 'Selecione Produto Filho'}
                  </option>
                  {allProducts.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>

                {/* RelationType */}
                <div className="relative">
                  <select
                    className="border p-2 rounded bg-white text-black"
                    value={r.relationType}
                    onChange={e => update(i, 'relationType', e.target.value as any)}
                  >
                    <option value="VARIANT">VARIANT</option>
                    <option value="SIMPLE">SIMPLE</option>
                  </select>
                  <Tooltip content={
                    <div className="max-w-xs p-2 text-sm text-red-600 bg-white">
                      <strong>VARIANT</strong>: Agrupa produtos como “alternativas” (ex.: Standard vs Pro).<br />
                      <strong>SIMPLE</strong>: Agrupa cores/tamanhos sem SKU extra.
                    </div>
                  }>
                    <InformationCircleIcon className="w-5 h-5 text-blue-700 absolute right-2 top-1/2 -translate-y-1/2" />
                  </Tooltip>
                </div>

                {/* Sort Order */}
                <div className="relative">
                  <Input
                    className='text-black border-none focus:outline-none pr-8' // Adicione pr-8 e focus:outline-none
                    type="number"
                    placeholder="Ordem"
                    value={r.sortOrder.toString()}
                    onChange={e => update(i, 'sortOrder', Number(e.target.value))}
                  />
                  <Tooltip
                    content={
                      <div className="max-w-xs p-2 text-sm text-red-600 bg-white">
                        Define a ordem de exibição na página de produto
                      </div>
                    }
                    placement="top-end"
                    offset={10}
                  >
                    <InformationCircleIcon className="w-5 h-5 text-blue-700 absolute right-3 top-1/2 -translate-y-1/2" />
                  </Tooltip>
                </div>

                {/* obrigatório */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    isSelected={r.isRequired}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      updateRelation(i, 'isRequired', e.target.checked)
                    }
                    className="text-black"
                  />
                  <label className='text-black'>Obrigatório</label>
                  <Tooltip
                    content={
                      <div className="max-w-xs p-2 text-sm text-red-600 bg-white">
                        Marca se a escolha desta relação é obrigatória na finalização da compra
                      </div>
                    }
                  >
                    <InformationCircleIcon className="w-5 h-5 text-blue-700" />
                  </Tooltip>
                </div>

                {/* Remover */}
                <Button
                  className='text-red-500'
                  size="sm"
                  color="danger"
                  isIconOnly
                  onClick={() => remove(i)}
                >
                  <TrashIcon className="w-4 h-4" />
                </Button>
              </div>
            ))}

            <Button
              className='text-indigo-600'
              size="sm"
              startContent={<PlusIcon className="w-5 h-5" />}
              onClick={add}
            >
              Adicionar Relação
            </Button>
          </div>

          {/* Botão de Submit */}
          <div className="flex justify-end">
            <Button
              type="submit"
              color="primary"
              isLoading={loading}
              className="w-full md:w-auto bg-green-500"
            >
              {loading ? 'Salvando...' : 'Cadastrar Produto'}
            </Button>
          </div>
        </form>
      </Section>
    </SidebarAndHeader>
  )
}

// Componente de Formulário para Variantes
const VariantForm = ({
  variant,
  index: variantIndex,
  formData,
  setFormData,
  promotions
}: {
  variant: ProductFormData['variants'][0]
  index: number
  formData: ProductFormData
  setFormData: React.Dispatch<React.SetStateAction<ProductFormData>>
  promotions: PromotionOption[];
}) => {
  const AttributeImageUploader = ({ attrIndex }: { attrIndex: number }) => {
    const { getRootProps, getInputProps } = useDropzone({
      accept: { 'image/*': [] },
      onDrop: (acceptedFiles) => {
        const newVariants = [...formData.variants];
        newVariants[variantIndex].variantAttributes[attrIndex].image = acceptedFiles[0]; // Pega primeiro arquivo
        setFormData({ ...formData, variants: newVariants });
      },
      multiple: false // Aceita apenas um arquivo
    });

    return (
      <div {...getRootProps()} className="border-2 border-dashed p-2 rounded cursor-pointer">
        <input {...getInputProps()} />
        <p className="text-sm text-center text-gray-500">
          Arraste imagens do atributo ou clique para selecionar
        </p>
      </div>
    );
  };

  const { getRootProps: getVariantImagesRootProps, getInputProps: getVariantImagesInputProps } = useDropzone({
    accept: { 'image/*': [] },
    onDrop: (acceptedFiles) => {
      const newVariants = [...formData.variants];
      newVariants[variantIndex].images = [...newVariants[variantIndex].images, ...acceptedFiles];
      setFormData({ ...formData, variants: newVariants });
    }
  });

  const [localSku, setLocalSku] = useState(variant.sku);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const newVariants = [...formData.variants]
      newVariants[variantIndex].sku = localSku
      setFormData({ ...formData, variants: newVariants })
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [localSku]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-black border-black border-2">
        <Input
          placeholder="SKU"
          value={localSku}
          onChange={(e) => setLocalSku(e.target.value)}
          required
        />

        <select
          className="border p-2 rounded bg-white text-black"
          value={variant.mainPromotion_id || ''}
          onChange={e => {
            const v = [...formData.variants];
            v[variantIndex].mainPromotion_id = e.target.value;
            setFormData({ ...formData, variants: v });
          }}
        >
          <option value="">— Sem promoção —</option>
          {promotions.map((promo) => (
            <option key={promo.id} value={promo.id}>
              {promo.name}
            </option>
          ))}
        </select>

        <div>
          <label className="block text-sm font-medium">Preço de</label>
          <CurrencyInput
            value={Number(variant.price_per) || 0}
            onChange={num => {
              const v = [...formData.variants];
              v[variantIndex].price_per = num.toString();
              setFormData({ ...formData, variants: v });
            }}
            placeholder="Preço de"
          />
        </div>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium">Preço por</label>
          <CurrencyInput
            value={Number(variant.price_of) || 0}
            onChange={num => {
              const v = [...formData.variants];
              v[variantIndex].price_of = num > 0 ? num.toString() : '';
              setFormData({ ...formData, variants: v });
            }}
            placeholder="Preço por"
          />
        </div>

        <Input placeholder="EAN" value={variant.ean || ''}
          onChange={e => {
            const v = [...formData.variants];
            v[variantIndex].ean = e.target.value;
            setFormData({ ...formData, variants: v });
          }}
        />
        <Input placeholder="Estoque" value={variant.stock || ''}
          onChange={e => {
            const v = [...formData.variants];
            v[variantIndex].stock = e.target.value;
            setFormData({ ...formData, variants: v });
          }}
        />
      </div>

      {/* Vídeos da variante */}
      <div className="mt-4">
        <h4 className="font-medium mb-2">Vídeos da Variante</h4>
        {variant.videos.map((vid, videoIndex) => (
          <input
            key={videoIndex}
            type="url"
            placeholder="URL do vídeo"
            value={vid.url}
            onChange={e => {
              const url = e.target.value;
              const idMatch = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
              const thumbnail = idMatch?.length ? `https://img.youtube.com/vi/${idMatch[1]}/0.jpg` : undefined;

              const updatedVariants = [...formData.variants];
              updatedVariants[variantIndex].videos[videoIndex] = {
                ...vid,
                url,
                thumbnail,
                isPrimary: vid.isPrimary // Mantém o valor existente
              };
              setFormData({ ...formData, variants: updatedVariants });
            }}
          />
        ))}
        <button
          type="button"
          onClick={() => setFormData(prev => ({
            ...prev,
            videos: [...prev.videos, {
              url: '',
              thumbnail: '',
              isPrimary: false // Adicionar valor padrão
            }]
          }))}
          className="text-indigo-600 font-medium"
        >
          Adicionar Vídeo
        </button>
      </div>

      {/* Seção de Atributos */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">Atributos da Variante</h4>
        {variant.variantAttributes.map((attr, attrIndex) => (
          <div key={attrIndex} className="mb-4 p-4 border rounded">
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="Chave (ex: cor)"
                value={attr.key}
                onChange={(e) => {
                  const newVariants = [...formData.variants];
                  newVariants[variantIndex].variantAttributes[attrIndex].key = e.target.value;
                  setFormData({ ...formData, variants: newVariants });
                }}
              />
              <Input
                placeholder="Valor (ex: azul)"
                value={attr.value}
                onChange={(e) => {
                  const newVariants = [...formData.variants];
                  newVariants[variantIndex].variantAttributes[attrIndex].value = e.target.value;
                  setFormData({ ...formData, variants: newVariants });
                }}
              />
              <Button
                size="sm"
                isIconOnly
                onClick={() => {
                  const newVariants = [...formData.variants];
                  newVariants[variantIndex].variantAttributes.splice(attrIndex, 1);
                  setFormData({ ...formData, variants: newVariants });
                }}
              >
                <TrashIcon className="w-4 h-4" />
              </Button>
            </div>

            {/* Upload de imagens para o atributo */}
            <div className="mt-2">

              <AttributeImageUploader attrIndex={attrIndex} />

              <div className="grid grid-cols-3 gap-2 mt-2">
                {attr.image && (
                  <div className="relative group">
                    <Image
                      src={URL.createObjectURL(attr.image)}
                      alt={attr.image.name}
                      width={100}
                      height={100}
                      className="object-cover rounded"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newVariants = [...formData.variants];
                        newVariants[variantIndex].variantAttributes[attrIndex].image = undefined;
                        setFormData({ ...formData, variants: newVariants });
                      }}
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100"
                    >
                      <TrashIcon className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        <Button
          onClick={() => {
            const newVariants = [...formData.variants];
            newVariants[variantIndex].variantAttributes.push({
              key: '',
              value: '',
              image: undefined // Usando a propriedade correta
            });
            setFormData({ ...formData, variants: newVariants });
          }}
          startContent={<PlusIcon />}
          size="sm"
          className="mt-2"
        >
          Adicionar Atributo
        </Button>
      </div>

      {/* Seção de Imagens da Variante */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">Imagens da Variante</h4>
        <div {...getVariantImagesRootProps()} className="border-2 border-dashed p-2 rounded cursor-pointer">
          <input {...getVariantImagesInputProps()} />
          <p className="text-sm text-center text-gray-500">
            Arraste imagens da variante ou clique para selecionar
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4">
          {variant.images.map((file, fileIndex) => (
            <div key={fileIndex} className="relative group">
              <Image
                src={URL.createObjectURL(file)}
                alt={file.name}
                className="object-cover rounded"
                width={210}
                height={210}
              />
              <button
                type="button"
                onClick={() => {
                  const newVariants = [...formData.variants];
                  newVariants[variantIndex].images.splice(fileIndex, 1);
                  setFormData({ ...formData, variants: newVariants });
                }}
                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100"
              >
                <TrashIcon className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
