"use client"

import { setupAPIClientEcommerce } from '@/app/services/apiEcommerce';
import { Section } from "@/app/components/section"
import { TitlePage } from "@/app/components/section/titlePage"
import { SidebarAndHeader } from "@/app/components/sidebarAndHeader"
import { useState, useEffect } from 'react'
import { Button, Tabs, Tab } from '@nextui-org/react'
import { Category, initialFormData, ProductFormData, PromotionOption, RelationFormData } from 'Types/types';
import { toast } from 'react-toastify';
import { ProductRelations } from '@/app/components/add_product/ProductRelations';
import { VariantManager } from '@/app/components/add_product/VariantManager';
import { BasicProductInfo } from '@/app/components/add_product/BasicProductInfo';
import { ProductDescriptionEditor } from '@/app/components/add_product/ProductDescriptionEditor';
import { CategorySelector } from '@/app/components/add_product/CategorySelector';

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

        <Tabs
          aria-placeholder="Formulário de produto"
          variant="underlined"
          classNames={{
            base: "w-full",
            tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
            cursor: "w-full bg-[#ff8800]",
            tab: "max-w-fit px-0 h-12",
            tabContent: "group-data-[selected=true]:text-[#ff8800] font-medium text-lg"
          }}
        >
          <Tab
            key="info"
            title={
              <div className="flex items-center space-x-2">
                <span>Informações Básicas</span>
                {formData.name && (
                  <span className="text-[#ff8800]">•</span>
                )}
              </div>
            }
            className="data-[selected=true]:border-b-2 data-[selected=true]:border-[#ff8800]"
          >
            <BasicProductInfo
              formData={formData}
              onFormDataChange={setFormData}
              promotions={promotions}
              mainImages={mainImages}
              onMainImagesChange={setMainImages}
            />
          </Tab>

          <Tab
            key="descriptions"
            title={
              <div className="flex items-center space-x-2">
                <span>Descrições</span>
                {formData.productDescriptions.length > 0 && (
                  <span className="text-[#ff8800]">•</span>
                )}
              </div>
            }
            className="data-[selected=true]:border-b-2 data-[selected=true]:border-[#ff8800]"
          >
            <ProductDescriptionEditor
              descriptions={formData.productDescriptions}
              onDescriptionsChange={(descriptions) =>
                setFormData({ ...formData, productDescriptions: descriptions })
              }
            />
          </Tab>

          <Tab
            key="categories"
            title={
              <div className="flex items-center gap-2">
                <span>Categorias</span>
                {formData.categories.length > 0 && (
                  <span className="text-primary">•</span>
                )}
              </div>
            }
          >
            <CategorySelector
              categories={categories}
              selectedCategories={formData.categories}
              onSelectionChange={(selected) =>
                setFormData({ ...formData, categories: selected })
              }
            />
          </Tab>

          <Tab
            key="variants"
            title={
              <div className="flex items-center space-x-2">
                <span>Variantes</span>
                {formData.variants.length > 0 && (
                  <span className="text-[#ff8800]">•</span>
                )}
              </div>
            }
            className="data-[selected=true]:border-b-2 data-[selected=true]:border-[#ff8800]"
          >
            <VariantManager
              variants={formData.variants}
              onVariantsChange={(variants) => setFormData({ ...formData, variants })}
              promotions={promotions}
            />
          </Tab>

          <Tab
            key="relations"
            title={
              <div className="flex items-center space-x-2">
                <span>Relacionamentos</span>
                {formData.relations.length > 0 && (
                  <span className="text-[#ff8800]">•</span>
                )}
              </div>
            }
            className="data-[selected=true]:border-b-2 data-[selected=true]:border-[#ff8800]"
          >
            <ProductRelations
              relations={formData.relations}
              products={allProducts}
              onRelationsChange={(relations) => setFormData({ ...formData, relations })}
            />
          </Tab>
        </Tabs>

        <div className="mt-6">
          <Button
            className='bg-green-600 text-white'
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