'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { setupAPIClientEcommerce } from '@/app/services/apiEcommerce'
import { Section } from '@/app/components/section'
import { TitlePage } from '@/app/components/section/titlePage'
import { SidebarAndHeader } from '@/app/components/sidebarAndHeader'
import { Button, Tabs, Tab } from '@nextui-org/react'
import { Category, initialFormData, ProductFormData, VideoInput, ImageRecord } from 'Types/types'
import { toast } from 'react-toastify'
import { BasicProductInfoUpdate } from '@/app/components/add_product/update_product/BasicProductInfoUpdate'
import { ProductDescriptionEditorUpdate } from '@/app/components/add_product/update_product/ProductDescriptionEditorUpdate'
import { CategoryManagerUpdate } from '@/app/components/add_product/update_product/CategoryManagerUpdate'
import { SeoProductInfoUpdate } from '@/app/components/add_product/update_product/SeoProductInfoUpdate'
import { VideoLinksManagerUpdate } from '@/app/components/add_product/update_product/VideoLinksManagerUpdate'
import { VariantManagerUpdate } from '@/app/components/add_product/update_product/VariantManagerUpdate'

export default function UpdateProductPage() {

  const { product_id } = useParams<{ product_id: string }>()
  const router = useRouter()
  const [formData, setFormData] = useState<ProductFormData>(initialFormData)
  const [categories, setCategories] = useState<Category[]>([])
  const [allProducts, setAllProducts] = useState<{ id: string; name: string }[]>([])
  const [promotions, setPromotions] = useState<{ id: string; name: string }[]>([])
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

        const p = dataRes.data;

        function extractYouTubeId(url: string): string | null {
          const regExp = /(?:v=|\/)([0-9A-Za-z_-]{11})/
          const match = url.match(regExp)
          return match ? match[1] : null
        }

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
            .map((v: any) => {
              const id = extractYouTubeId(v.url)
              return {
                url: v.url,
                thumbnail: id ? `https://img.youtube.com/vi/${id}/0.jpg` : undefined
              }
            }),
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
            videos: p.videos
              .filter((vv: any) => vv.variant_id === v.id)
              .map((vv: any) => {
                const id = extractYouTubeId(vv.url)
                return {
                  url: vv.url,
                  thumbnail: id ? `https://img.youtube.com/vi/${id}/0.jpg` : undefined
                }
              }),
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

      // 1) Campos básicos (ignora newImages e existingImages):
      Object.entries(formData).forEach(([key, value]) => {
        if (value == null) return
        if ([
          'variants',
          'relations',
          'videos',
          'newImages',
          'existingImages',
          'productDescriptions',
          'videoLinks'
        ].includes(key)) return

        if (Array.isArray(value) || typeof value === 'object') {
          formPayload.append(key, JSON.stringify(value))
        } else {
          formPayload.append(key, String(value))
        }
      })

      // 2) Vídeos
      formPayload.append('videoLinks', JSON.stringify(formData.videos.map((v) => v.url)));
      console.log('➡️ Enviando videoLinks:', formPayload.get('videoLinks'))

      // 3) Variantes
      const cleanVariants = formData.variants.map((v) => ({
        id: v.id,
        sku: v.sku,
        price_of: v.price_of,
        price_per: v.price_per,
        stock: v.stock,
        sortOrder: v.sortOrder,
        ean: v.ean,
        allowBackorders: v.allowBackorders,
        mainPromotion_id: v.mainPromotion_id,
        images: (v.newImages ?? []).map((f) => f.name),
        videoLinks: variantVideoLinks[v.id]?.map((x) => x.url) || [],
        attributes: (v.variantAttributes ?? []).map((at, i) => ({
          id: at.id,
          key: at.key,
          value: at.value,
          images:
            (attributeFiles?.[v.id]?.[i] ?? []).map((f) => f.name),
        })),
      }))

      formPayload.append('descriptions', JSON.stringify(formData.productDescriptions))

      formPayload.append('variants', JSON.stringify(cleanVariants))

      // 4) Relações
      formPayload.append('relations', JSON.stringify(formData.relations))

      // 5) IDs das imagens que o usuário manteve
      formPayload.append('existingImages', JSON.stringify((formData.existingImages ?? []).map((img) => img.id)))

        // 6) Upload dos arquivos das imagens novas
        ; (formData.newImages ?? []).forEach((file) =>
          formPayload.append('images', file)
        )

      // 7) Arquivos de variantes e atributos
      Object.values(variantFiles).flat().forEach((f) =>
        formPayload.append('variantImages', f)
      )
      Object.values(attributeFiles)
        .flatMap((obj) => Object.values(obj))
        .flat()
        .forEach((f) => formPayload.append('attributeImages', f))

      console.log(formData)

      // 8) Chama o backend
      const api = setupAPIClientEcommerce()
      await api.put('/product/update', formPayload)

      toast.success('Produto atualizado!')
      router.back()
    } catch (e: any) {
      console.error(e)
      toast.error(e.response?.data?.error || 'Erro ao atualizar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SidebarAndHeader>
      <Section>
        <TitlePage title="ATUALIZAR PRODUTO" />
        <Tabs variant="bordered" color="primary" className="my-tabs bg-white rounded-lg shadow-sm">
          <Tab key="info" title="Informações Básicas">
            <BasicProductInfoUpdate
              formData={formData}
              onFormDataChange={setFormData}
              promotions={promotions}
            />
          </Tab>
          <Tab key="descriptions" title="Descrições">
            <ProductDescriptionEditorUpdate
              descriptions={formData.productDescriptions}
              onDescriptionsChange={(d) =>
                setFormData({ ...formData, productDescriptions: d })
              }
            />
          </Tab>
          <Tab key="categories" title="Categorias">
            <CategoryManagerUpdate
              categories={categories}
              selectedCategories={formData.categories}
              onSelectionChange={(c) => setFormData({ ...formData, categories: c })}
            />
          </Tab>
          <Tab key="seo" title="SEO">
            <SeoProductInfoUpdate
              formData={formData}
              onFormDataChange={(data) => setFormData({ ...formData, ...data })}
            />
          </Tab>
          <Tab key="videos" title="Vídeos">
            <VideoLinksManagerUpdate
              links={formData.videos}
              onLinksChange={newLinks => setFormData({ ...formData, videos: newLinks })}
            />
          </Tab>
          <Tab key="variants" title="Variantes">
            <VariantManagerUpdate
              formData={formData}
              onFormDataChange={setFormData}
              promotions={promotions}
            />
          </Tab>
          <Tab key="relations" title="Relacionamentos">

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
          <Button className="text-white bg-green-600" onPress={handleSubmit} isLoading={loading}>Atualizar Produto</Button>
        </div>
      </Section>
    </SidebarAndHeader>
  )
}