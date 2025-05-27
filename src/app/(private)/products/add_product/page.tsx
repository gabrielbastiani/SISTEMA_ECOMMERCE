'use client'

import { useState, useEffect } from 'react'
import { setupAPIClientEcommerce } from '@/app/services/apiEcommerce'
import { Section } from '@/app/components/section'
import { TitlePage } from '@/app/components/section/titlePage'
import { SidebarAndHeader } from '@/app/components/sidebarAndHeader'
import { Button, Tabs, Tab } from '@nextui-org/react'
import { Category, initialFormData, ProductFormData, VideoInput } from 'Types/types'
import { toast } from 'react-toastify'
import { BasicProductInfo } from '@/app/components/add_product/BasicProductInfo'
import { ProductDescriptionEditor } from '@/app/components/add_product/ProductDescriptionEditor'
import { CategorySelector } from '@/app/components/add_product/CategorySelector'
import { VariantManager } from '@/app/components/add_product/VariantManager'
import { ProductRelations } from '@/app/components/add_product/ProductRelations'
import { VideoLinksManager } from '@/app/components/add_product/VideoLinksManager'

export default function AddProductPage() {

  const [categories, setCategories] = useState<Category[]>([])
  const [allProducts, setAllProducts] = useState<{ id: string; name: string }[]>([])
  const [promotions, setPromotions] = useState<{ id: string; name: string }[]>([])
  const [formData, setFormData] = useState<ProductFormData>(initialFormData)
  const [mainImages, setMainImages] = useState<File[]>([])

  const [productVideoLinks, setProductVideoLinks] = useState<VideoInput[]>([])
  const [variantVideoLinks, setVariantVideoLinks] = useState<Record<string, VideoInput[]>>({})

  const [variantFiles, setVariantFiles] = useState<Record<string, File[]>>({})
  const [attributeFiles, setAttributeFiles] = useState<Record<string, Record<number, File[]>>>({})

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const api = setupAPIClientEcommerce()
    api.get('/promotions').then(r => setPromotions(r.data)).catch(console.error)
    api.get('/category/cms').then(r => setCategories(r.data.all_categories_disponivel)).catch(console.error)
    api.get('/get/products').then(r => setAllProducts(r.data.allow_products)).catch(console.error)
  }, []);

  const resetForm = () => {
    setFormData(initialFormData);
    setProductVideoLinks([]);
    setVariantVideoLinks({});
    setMainImages([]);
    setVariantFiles({});
    setAttributeFiles({});
  };

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const formPayload = new FormData()

      Object.entries(formData).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (key === 'variants' || key === 'relations' || key === 'videoLinks') return;
        if (Array.isArray(value) || typeof value === 'object') {
          formPayload.append(key, JSON.stringify(value));
        } else {
          formPayload.append(key, String(value));
        }
      });

      const videoLinksToSend = productVideoLinks.map(v => v.url);
      formPayload.append('videoLinks', JSON.stringify(videoLinksToSend));

      const cleanVariants = formData.variants.map(v => ({
        id: v.id,
        sku: v.sku,
        price_of: v.price_of,
        price_per: v.price_per,
        stock: v.stock,
        sortOrder: v.sortOrder,
        ean: v.ean,
        allowBackorders: v.allowBackorders,
        mainPromotion_id: v.mainPromotion_id,
        images: (variantFiles[v.id] || []).map(f => f.name),
        videoLinks: (variantVideoLinks[v.id] || []).map(v => v.url),
        attributes: v.attributes.map((attr, i) => ({
          key: attr.key,
          value: attr.value,
          images: (attributeFiles[v.id]?.[i] || []).map(f => f.name)
        }))
      }))
      formPayload.append('variants', JSON.stringify(cleanVariants))

      formPayload.append('relations', JSON.stringify(formData.relations))

      mainImages.forEach(f => formPayload.append('images', f))

      Object.values(variantFiles).forEach(files =>
        files.forEach(file => formPayload.append('variantImages', file))
      )

      Object.values(attributeFiles).forEach(attrs =>
        Object.values(attrs).forEach(files =>
          files.forEach(file => formPayload.append('attributeImages', file))
        )
      )

      const api = setupAPIClientEcommerce()
      await api.post('/product/create', formPayload, { headers: { 'Content-Type': 'multipart/form-data' } })

      toast.success('Produto cadastrado!');
      resetForm();
    } catch (e: any) {
      console.error(e)
      toast.error(e.response?.data?.error || 'Erro ao cadastrar')
    } finally { setLoading(false) }
  }

  return (
    <SidebarAndHeader>
      <Section>
        <TitlePage title="ADICIONAR PRODUTO" />
        <Tabs variant="underlined">
          <Tab key="info" title="Informações Básicas">
            <BasicProductInfo
              formData={formData}
              onFormDataChange={setFormData}
              promotions={promotions}
              mainImages={mainImages}
              onMainImagesChange={setMainImages}
            />
          </Tab>
          <Tab key="descriptions" title="Descrições">
            <ProductDescriptionEditor
              descriptions={formData.productDescriptions}
              onDescriptionsChange={desc => setFormData({ ...formData, productDescriptions: desc })}
            />
          </Tab>
          <Tab key="categories" title="Categorias">
            <CategorySelector
              categories={categories}
              selectedCategories={formData.categories}
              onSelectionChange={c => setFormData({ ...formData, categories: c })}
            />
          </Tab>
          <Tab key="videos" title="Vídeos">
            <VideoLinksManager
              label="Vídeos do Produto"
              links={productVideoLinks}
              onLinksChange={setProductVideoLinks}
            />
          </Tab>

          <Tab key="variants" title="Variantes">
            <VariantManager
              variants={formData.variants}
              onVariantsChange={variants => setFormData({ ...formData, variants })}
              promotions={promotions}
              variantFiles={variantFiles}
              setVariantFiles={setVariantFiles}
              attributeFiles={attributeFiles}
              setAttributeFiles={setAttributeFiles}
              variantVideoLinks={variantVideoLinks}
              onVariantVideoLinksChange={(variantId, links) =>
                setVariantVideoLinks(prev => ({ ...prev, [variantId]: links }))
              }
            />
          </Tab>
          <Tab key="relations" title="Relacionamentos">
            <ProductRelations
              relations={formData.relations}
              products={allProducts}
              onRelationsChange={r => setFormData({ ...formData, relations: r })}
            />
          </Tab>
        </Tabs>
        <div className="mt-6">
          <Button className='text-white bg-green-500' onPress={handleSubmit} isLoading={loading}>Cadastrar Produto</Button>
        </div>
      </Section>
    </SidebarAndHeader>
  )
}