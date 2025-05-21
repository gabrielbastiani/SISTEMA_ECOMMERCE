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
import { Category, PromotionOption, RelationFormData } from 'Types/types';
import { Editor } from "@tinymce/tinymce-react";
import { toast } from 'react-toastify';
import { CurrencyInput } from '@/app/components/add_product/CurrencyInput';
import Image from 'next/image';
import { ProductRelations } from '@/app/components/add_product/ProductRelations';
import { VariantManager } from '@/app/components/add_product/VariantManager';
import { MediaUploadComponent } from '@/app/components/add_product/MediaUploadComponent';

const TOKEN_TINY = process.env.NEXT_PUBLIC_TINYMCE_API_KEY;

type ProductFormData = {
  name: string;
  description: string;
  slug: string;
  brand: string;
  ean: string;
  skuMaster: string;
  price_of: number;
  price_per: number;
  weight: number;
  length: number;
  width: number;
  height: number;
  stock: number;
  status: StatusProduct;
  mainPromotion_id: string;
  variants: any[]
  relations: any[]
  mainImages: File[]
  variantImages: File[]
  attributeImages: File[]
}

const initialFormData: ProductFormData = {
  name: '',
  description: '',
  variants: [],
  relations: [],
  mainImages: [],
  variantImages: [],
  attributeImages: [],
  slug: '',
  brand: '',
  ean: '',
  skuMaster: '',
  price_of: 0,
  price_per: 0,
  weight: 0,
  length: 0,
  width: 0,
  height: 0,
  stock: 0,
  status: 'DISPONIVEL',
  mainPromotion_id: '',
}

export default function Add_product() {

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [relations, setRelations] = useState<RelationFormData[]>([]);
  const [allProducts, setAllProducts] = useState<{ id: string; name: string }[]>([]);
  const [promotions, setPromotions] = useState<PromotionOption[]>([]);
  const [mainImages, setMainImages] = useState<File[]>([])
  const [variantImages, setVariantImages] = useState<File[]>([])
  const [attributeImages, setAttributeImages] = useState<File[]>([])

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

  const handleSubmit = async () => {
    setLoading(true)

    try {
      const formPayload = new FormData()

      // Campos básicos
      Object.entries(formData).forEach(([key, value]) => {
        if (typeof value === 'object') {
          formPayload.append(key, JSON.stringify(value))
        } else {
          formPayload.append(key, value)
        }
      })

      // Imagens
      mainImages.forEach(file => formPayload.append('images', file))
      variantImages.forEach(file => formPayload.append('variantImages', file))
      attributeImages.forEach(file => formPayload.append('attributeImages', file))

      const api = setupAPIClientEcommerce()
      await api.post('/product/create', formPayload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      toast.success('Produto cadastrado com sucesso!')
      // Reset form
    } catch (error) {
      toast.error('Erro ao cadastrar produto')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SidebarAndHeader>
      <Section>
        <TitlePage title="ADICIONAR PRODUTO" />

        <Tabs aria-placeholder="Formulário de produto">
          <Tab key="info" title="Informações Básicas">
            <div className="space-y-6 max-w-3xl">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="Nome do Produto"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  isRequired
                />

                <div className="flex gap-2 items-end">
                  <Input
                    placeholder="Slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    description="URL amigável do produto"
                  />
                  <Button
                    size="sm"
                    onPress={() => {
                      const generatedSlug = formData.name
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/^-+|-+$/g, '');
                      setFormData({ ...formData, slug: generatedSlug })
                    }}
                  >
                    Gerar
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Input
                  placeholder="Marca"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                />

                <Input
                  placeholder="EAN"
                  value={formData.ean}
                  onChange={(e) => setFormData({ ...formData, ean: e.target.value })}
                />

                <Input
                  placeholder="SKU Master"
                  value={formData.skuMaster}
                  onChange={(e) => setFormData({ ...formData, skuMaster: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <CurrencyInput
                  placeholder="Preço De"
                  value={formData.price_of || 0}
                  onChange={(value) => setFormData({ ...formData, price_of: value })}
                />

                <CurrencyInput
                  placeholder="Preço Por"
                  value={formData.price_per}
                  onChange={(value) => setFormData({ ...formData, price_per: value })}
                />
              </div>

              <div className="grid grid-cols-4 gap-4">
                <Input
                  placeholder="Peso (kg)"
                  type="number"
                  value={formData.weight?.toString()}
                  onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) })}
                  startContent={
                    <div className="pointer-events-none flex items-center">
                      <span className="text-default-400 text-small">kg</span>
                    </div>
                  }
                />

                <Input
                  placeholder="Comprimento (cm)"
                  type="number"
                  value={formData.length?.toString()}
                  onChange={(e) => setFormData({ ...formData, length: parseFloat(e.target.value) })}
                  startContent={
                    <div className="pointer-events-none flex items-center">
                      <span className="text-default-400 text-small">cm</span>
                    </div>
                  }
                />

                <Input
                  placeholder="Largura (cm)"
                  type="number"
                  value={formData.width?.toString()}
                  onChange={(e) => setFormData({ ...formData, width: parseFloat(e.target.value) })}
                  startContent={
                    <div className="pointer-events-none flex items-center">
                      <span className="text-default-400 text-small">cm</span>
                    </div>
                  }
                />

                <Input
                  placeholder="Altura (cm)"
                  type="number"
                  value={formData.height?.toString()}
                  onChange={(e) => setFormData({ ...formData, height: parseFloat(e.target.value) })}
                  startContent={
                    <div className="pointer-events-none flex items-center">
                      <span className="text-default-400 text-small">cm</span>
                    </div>
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="Estoque"
                  type="number"
                  min="0"
                  value={formData.stock?.toString()}
                  onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
                />

                <Select
                  placeholder="Status"
                  selectedKeys={[formData.status]}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as StatusProduct })}
                >
                  <SelectItem key="DISPONIVEL">Disponível</SelectItem>
                  <SelectItem key="INDISPONIVEL">Indisponível</SelectItem>
                </Select>
              </div>

              <Select
                placeholder="Promoção Principal"
                selectedKeys={formData.mainPromotion_id ? [formData.mainPromotion_id] : []}
                onChange={(e) => setFormData({ ...formData, mainPromotion_id: e.target.value })}
              >
                {promotions.map(promotion => (
                  <SelectItem key={promotion.id} value={promotion.id}>
                    {promotion.name}
                  </SelectItem>
                ))}
              </Select>

              <Textarea
                placeholder="Descrição"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                minRows={5}
              />

              <MediaUploadComponent
                label="Imagens Principais"
                files={mainImages}
                onUpload={setMainImages}
                onRemove={(index) => setMainImages(mainImages.filter((_, i) => i !== index))}
              />
            </div>
          </Tab>

          <Tab key="variants" title="Variantes">
            <VariantManager
              variants={formData.variants}
              onVariantsChange={(variants) => setFormData({ ...formData, variants })}
            />
          </Tab>

          <Tab key="relations" title="Relacionamentos">
            <ProductRelations
              relations={formData.relations}
              products={allProducts}
              onRelationsChange={(relations) => setFormData({ ...formData, relations })}
            />
          </Tab>
        </Tabs>

        <div className="mt-6">
          <Button
            color="primary"
            size="lg"
            isLoading={loading}
            onPress={handleSubmit}
          >
            Cadastrar Produto
          </Button>
        </div>
      </Section>
    </SidebarAndHeader>
  )
}