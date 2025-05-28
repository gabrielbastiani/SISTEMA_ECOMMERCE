'use client'

import { useState, useEffect, ChangeEvent } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { setupAPIClientEcommerce } from '@/app/services/apiEcommerce'
import { Section } from '@/app/components/section'
import { TitlePage } from '@/app/components/section/titlePage'
import { SidebarAndHeader } from '@/app/components/sidebarAndHeader'
import { Button, Tabs, Tab } from '@nextui-org/react'
import { Category, initialFormData, ProductFormData, VideoInput, ImageRecord } from 'Types/types'
import { toast } from 'react-toastify'
import { BasicProductInfo } from '@/app/components/add_product/BasicProductInfo'
import { ProductDescriptionEditor } from '@/app/components/add_product/ProductDescriptionEditor'
import { CategorySelector } from '@/app/components/add_product/CategorySelector'
import { VariantManager } from '@/app/components/add_product/VariantManager'
import { ProductRelations } from '@/app/components/add_product/ProductRelations'
import { VideoLinksManager } from '@/app/components/add_product/VideoLinksManager'
import { SeoProductInfo } from '@/app/components/add_product/SeoProductInfo'

export default function UpdateProductPage() {
    
  const { product_id } = useParams<{ product_id: string }>()
  const router = useRouter()
  const [formData, setFormData] = useState<ProductFormData>(initialFormData)
  const [categories, setCategories] = useState<Category[]>([])
  const [allProducts, setAllProducts] = useState<{ id: string; name: string }[]>([])
  const [promotions, setPromotions] = useState<{ id: string; name: string }[]>([])
  const [productVideoLinks, setProductVideoLinks] = useState<VideoInput[]>([])
  const [variantVideoLinks, setVariantVideoLinks] = useState<Record<string, VideoInput[]>>({})
  const [variantFiles, setVariantFiles] = useState<Record<string, File[]>>({})
  const [attributeFiles, setAttributeFiles] = useState<Record<string, Record<number, File[]>>>({})
  const [loading, setLoading] = useState(false)

  // Carrega dados iniciais
  useEffect(() => {
    async function load() {
      try {
        const api = setupAPIClientEcommerce()
        const [catRes, prodRes, promoRes, dataRes] = await Promise.all([
          api.get('/category/cms'),
          api.get('/get/products'),
          api.get('/promotions'),
          api.get(`/product/cms/get?product_id=${product_id}`)
        ])
        const allCats = catRes.data.all_categories_disponivel
        setCategories(allCats)
        setAllProducts(prodRes.data.allow_products)
        setPromotions(promoRes.data.map((p: any) => ({ id: String(p.id), name: p.name })))

        const p = dataRes.data
        // inicializa formData populando existingImages, newImages, videos, etc.
        setFormData({
          ...initialFormData,
          id: p.id,
          name: p.name,
          slug: p.slug,
          metaTitle: p.metaTitle,
          metaDescription: p.metaDescription,
          keywords: p.keywords || [],
          brand: p.brand || '',
          ean: p.ean || '',
          skuMaster: p.skuMaster || '',
          price_of: p.price_of || 0,
          price_per: p.price_per,
          weight: p.weight,
          length: p.length,
          width: p.width,
          height: p.height,
          stock: p.stock,
          status: p.status,
          mainPromotion_id: p.mainPromotion_id || '',
          categories: p.categories.map((c: any) => c.category_id),
          description: p.description,
          existingImages: p.images
            .filter((i: any) => !i.variant_id)
            .map((i: any) => ({ id: i.id, url: i.url, altText: i.altText } as ImageRecord)),
          newImages: [],
          videos: p.videos
            .filter((v: any) => !v.variant_id)
            .map((v: any) => ({ url: v.url, thumbnail: '' } as VideoInput)),
          productDescriptions: p.productsDescriptions.map((d: any) => ({ title: d.title, description: d.description })),
          variants: p.variants.map((v: any) => ({
            id: v.id,
            sku: v.sku,
            price_of: v.price_of,
            price_per: v.price_per,
            stock: v.stock,
            allowBackorders: v.allowBackorders,
            sortOrder: v.sortOrder,
            ean: v.ean,
            mainPromotion_id: v.mainPromotion_id,
            existingImages: p.images
              .filter((i: any) => i.variant_id === v.id)
              .map((i: any) => ({ id: i.id, url: i.url, altText: i.altText } as ImageRecord)),
            newImages: [],
            variantAttributes: v.variantAttribute.map((a: any) => ({
              id: a.id,
              key: a.key,
              value: a.value,
              status: a.status
            })),
            images: [],
            videos: []
          })),
          relations: [
            ...p.parentRelations.map((r: any) => ({
              relationDirection: 'parent',
              relatedProductId: r.childProduct_id,
              relationType: r.relationType,
              sortOrder: r.sortOrder,
              isRequired: r.isRequired
            })),
            ...p.childRelations.map((r: any) => ({
              relationDirection: 'child',
              relatedProductId: r.parentProduct_id,
              relationType: r.relationType,
              sortOrder: r.sortOrder,
              isRequired: r.isRequired
            }))
          ]
        })
      } catch (err) {
        console.error(err)
        toast.error('Erro ao carregar produto')
      }
    }
    load()
  }, [product_id])

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const formPayload = new FormData()
      // campos básicos
      Object.entries(formData).forEach(([key, value]) => {
        if (value == null) return
        if (['variants','relations','videos'].includes(key)) return
        if (Array.isArray(value) || typeof value === 'object') {
          formPayload.append(key, JSON.stringify(value))
        } else {
          formPayload.append(key, String(value))
        }
      })
      // vídeos
      formPayload.append('videoLinks', JSON.stringify(formData.videos.map(v=>v.url)))
      // variantes similares ao create
      const cleanVariants = formData.variants.map(v=>({
        id: v.id,
        sku: v.sku,
        price_of: v.price_of,
        price_per: v.price_per,
        stock: v.stock,
        sortOrder: v.sortOrder,
        ean: v.ean,
        allowBackorders: v.allowBackorders,
        mainPromotion_id: v.mainPromotion_id,
        images: v.newImages.map(f=>f.name),
        videoLinks: variantVideoLinks[v.id]?.map(x=>x.url)||[],
        attributes: v.variantAttributes.map(at=>({
          id: at.id,
          key: at.key,
          value: at.value,
          images: attributeFiles[v.id]?.[at.id]?.map(f=>f.name)||[]
        }))
      }))
      formPayload.append('variants', JSON.stringify(cleanVariants))
      formPayload.append('relations', JSON.stringify(formData.relations))
      // arquivos
      formData.newImages.forEach(f=>formPayload.append('images',f))
      Object.values(variantFiles).flat().forEach(f=>formPayload.append('variantImages',f))
      Object.values(attributeFiles).flatMap(obj=>Object.values(obj)).flat().forEach(f=>formPayload.append('attributeImages',f))

      const api = setupAPIClientEcommerce();
      await api.put('/product/update', formPayload);
      
      toast.success('Produto atualizado!');

      router.back()
    } catch (e:any) {
      console.error(e)
      toast.error(e.response?.data?.error||'Erro ao atualizar')
    } finally{ setLoading(false) }
  }

  return (
    <SidebarAndHeader>
      <Section>
        <TitlePage title="ATUALIZAR PRODUTO" />
        <Tabs variant="bordered" color="primary" className="my-tabs bg-white rounded-lg shadow-sm">
          <Tab key="info" title="Informações Básicas">
            <BasicProductInfo
              formData={formData}
              onFormDataChange={setFormData}
              promotions={promotions}
            />
          </Tab>
          <Tab key="descriptions" title="Descrições">
            <ProductDescriptionEditor
              descriptions={formData.productDescriptions}
              onDescriptionsChange={desc=>setFormData({...formData, productDescriptions:desc})}
            />
          </Tab>
          <Tab key="categories" title="Categorias">
            <CategorySelector
              categories={categories}
              selectedCategories={formData.categories}
              onSelectionChange={c=>setFormData({...formData,categories:c})}
            />
          </Tab>
          <Tab key="seo" title="SEO">
            <SeoProductInfo formData={formData} onFormDataChange={setFormData} />
          </Tab>
          <Tab key="videos" title="Vídeos">
            <VideoLinksManager label="Vídeos do Produto" links={formData.videos} onLinksChange={links=>setFormData({...formData,videos:links})} />
          </Tab>
          <Tab key="variants" title="Variantes">
            <VariantManager
              variants={formData.variants}
              onVariantsChange={vars=>setFormData({...formData,variants:vars})}
              promotions={promotions}
              variantFiles={variantFiles}
              setVariantFiles={setVariantFiles}
              attributeFiles={attributeFiles}
              setAttributeFiles={setAttributeFiles}
              variantVideoLinks={variantVideoLinks}
              onVariantVideoLinksChange={(id,links)=>setVariantVideoLinks(prev=>({...prev,[id]:links}))}
            />
          </Tab>
          <Tab key="relations" title="Relacionamentos">
            <ProductRelations
              relations={formData.relations}
              products={allProducts}
              onRelationsChange={r=>setFormData({...formData,relations:r})}
            />
          </Tab>
        </Tabs>
        <style jsx global>{`
          .my-tabs [role="tab"][aria-selected="true"] { background: #e09200; color: white; }
          .my-tabs [role="tab"]:not([aria-selected="true"]) { color: #000; }
          .my-tabs [role="tab"]:not([aria-selected="true"]):hover { background: #f3f4f6; }
          .my-tabs > .nextui-tabs-tablist { gap: .5rem; padding: .5rem 1rem; }
          .my-tabs .nextui-tabs-panel { padding: 1rem; }
        `}</style>
        <div className="mt-6">
          <Button className="text-white bg-blue-600" onPress={handleSubmit} isLoading={loading}>Atualizar Produto</Button>
        </div>
      </Section>
    </SidebarAndHeader>
  )
}