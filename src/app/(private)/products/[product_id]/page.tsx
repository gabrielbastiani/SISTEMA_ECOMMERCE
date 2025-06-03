'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { setupAPIClientEcommerce } from '@/app/services/apiEcommerce'
import { Section } from '@/app/components/section'
import { TitlePage } from '@/app/components/section/titlePage'
import { SidebarAndHeader } from '@/app/components/sidebarAndHeader'
import { Button, Tabs, Tab } from '@nextui-org/react'
import {
  Category,
  initialFormData,
  ProductFormData,
  VideoInput,
  ImageRecord,
  VariantAttribute,
  StatusProduct,
  VariantFormData
} from 'Types/types'
import { toast } from 'react-toastify'
import { BasicProductInfoUpdate } from '@/app/components/add_product/update_product/BasicProductInfoUpdate'
import { ProductDescriptionEditorUpdate, ProductDescriptionWithId } from '@/app/components/add_product/update_product/ProductDescriptionEditorUpdate'
import { CategoryManagerUpdate } from '@/app/components/add_product/update_product/CategoryManagerUpdate'
import { SeoProductInfoUpdate } from '@/app/components/add_product/update_product/SeoProductInfoUpdate'
import { VideoLinksManagerUpdate } from '@/app/components/add_product/update_product/VideoLinksManagerUpdate'
import { VariantManagerUpdate } from '@/app/components/add_product/update_product/VariantManagerUpdate'

export default function UpdateProductPage() {
  const { product_id } = useParams<{ product_id: string }>()
  const router = useRouter()

  const [formData, setFormData] = useState<ProductFormData>(initialFormData)
  const [categories, setCategories] = useState<Category[]>([])
  const [promotions, setPromotions] = useState<{ id: string; name: string }[]>([])

  // Fonte de verdade dos arquivos “novos” de cada variante
  const [variantFiles, setVariantFiles] = useState<Record<string, File[]>>({})

  // Fonte de verdade dos arquivos “novos” de cada atributo de cada variante
  const [attributeFiles, setAttributeFiles] = useState<Record<string, Record<number, File[]>>>(
    {}
  )

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const api = setupAPIClientEcommerce()
        const [catRes, _, promoRes, dataRes] = await Promise.all([
          api.get('/category/cms'),
          api.get('/get/products'),
          api.get('/promotions'),
          api.get(`/product/cms/get?product_id=${product_id}`)
        ])

        setCategories(catRes.data.all_categories_disponivel)
        setPromotions(promoRes.data.map((p: any) => ({ id: String(p.id), name: p.name })))

        const p = dataRes.data

        function extractYouTubeId(url: string): string | null {
          const regExp = /(?:v=|\/)([0-9A-Za-z_-]{11})/
          const match = url.match(regExp)
          return match ? match[1] : null
        }

        const rawImages: Array<{
          id: string
          url: string
          altText: string
        }> = p.images ?? []

        const rawVariants: Array<any> = p.variants ?? []
        const rawDescriptions: Array<{
          id: string
          title: string
          description: string
          status: string
        }> = p.productsDescriptions ?? []
        const rawParentRels: Array<any> = p.parentRelations ?? []
        const rawChildRels: Array<any> = p.childRelations ?? []
        const rawCategories: Array<{ category_id: string }> = p.categories ?? []

        setFormData({
          ...initialFormData,
          id: p.id,
          name: p.name,
          slug: p.slug,
          metaTitle: p.metaTitle,
          metaDescription: p.metaDescription,
          keywords: p.keywords ?? [],
          brand: p.brand ?? '',
          ean: p.ean ?? '',
          skuMaster: p.skuMaster ?? '',
          price_of: p.price_of ?? 0,
          price_per: p.price_per ?? 0,
          weight: p.weight ?? 0,
          length: p.length ?? 0,
          width: p.width ?? 0,
          height: p.height ?? 0,
          stock: p.stock ?? 0,
          status: p.status ?? ('DISPONIVEL' as StatusProduct),
          mainPromotion_id: p.mainPromotion_id ?? '',
          categories: rawCategories.map((c) => c.category_id),
          description: p.description ?? '',

          // Imagens de nível produto
          existingImages: rawImages.map(
            (i) =>
            ({
              id: i.id,
              url: i.url,
              altText: i.altText
            } as ImageRecord)
          ),
          newImages: [],

          // Vídeos de nível produto
          videos: (p.videos ?? []).map((v: any) => {
            const id = extractYouTubeId(v.url)
            return {
              url: v.url,
              thumbnail: id ? `https://img.youtube.com/vi/${id}/0.jpg` : undefined
            } as VideoInput
          }),

          productDescriptions: rawDescriptions.map((d) => ({
            id: d.id,
            title: d.title,
            description: d.description,
            status: d.status as any
          })) as ProductDescriptionWithId[],

          // — Aqui vem a correção principal: carregamos os vídeos de variante em `videos` —
          variants: rawVariants.map((v: any) => {
            // 1) existingImages de variante
            const existingVarImgs: Array<any> = v.productVariantImage ?? []

            // 2) atributos da variante
            const attributesRaw: Array<any> = v.variantAttribute ?? []

            // 3) vídeos da variante vindos do banco (tabela `productVariantVideo`)
            const rawVideosVariant: Array<{ url: string }> = v.productVariantVideo ?? []

            return {
              id: v.id,
              sku: v.sku,
              price_of: v.price_of,
              price_per: v.price_per,
              stock: v.stock,
              allowBackorders: v.allowBackorders,
              sortOrder: v.sortOrder,
              ean: v.ean,
              mainPromotion_id: v.mainPromotion_id,

              // Popula existingImages do MediaUpdateComponent
              existingImages: existingVarImgs.map(
                (i: any) =>
                ({
                  id: i.id,
                  url: i.url,
                  altText: i.altText
                } as ImageRecord)
              ),

              // “Novos arquivos” de variante (ficarão em variantFiles[v.id])
              newImages: [] as File[],

              // Atributos
              attributes: attributesRaw.map((a: any) => {
                const imagesOfAttr: Array<any> = a.variantAttributeImage ?? []
                return {
                  id: a.id,
                  key: a.key,
                  value: a.value,
                  status: a.status as StatusProduct,
                  existingImages: imagesOfAttr.map(
                    (ai: any) =>
                    ({
                      id: ai.id,
                      url: ai.url,
                      altText: ai.altText
                    } as ImageRecord)
                  ),
                  newImages: [] as File[]
                } as VariantAttribute
              }),

              // Vídeos de VARIANTE: mapeamos cada `v.productVariantVideo` em VideoInput
              videos: rawVideosVariant.map((vv) => {
                const ytId = extractYouTubeId(vv.url)
                return {
                  url: vv.url,
                  thumbnail: ytId ? `https://img.youtube.com/vi/${ytId}/0.jpg` : undefined
                } as VideoInput
              }),

              // Esses campos são apenas para satisfazer o tipo VariantFormData:
              images: [] as File[],
              productVariantImage: existingVarImgs.map(
                (i: any) =>
                ({
                  id: i.id,
                  url: i.url,
                  altText: i.altText
                } as ImageRecord)
              ),
              productVariantVideo: rawVideosVariant.map((vv) => {
                const ytId = extractYouTubeId(vv.url)
                return {
                  url: vv.url,
                  thumbnail: ytId ? `https://img.youtube.com/vi/${ytId}/0.jpg` : undefined
                } as VideoInput
              }),
              created_at: undefined,
              product_id: v.product_id ?? product_id,
              variantAttributes: [] as any[],
            } as VariantFormData
          }),

          relations: [
            ...rawParentRels.map((r: any) => ({
              relationDirection: 'parent' as const,
              relatedProductId: r.childProduct_id,
              relationType: r.relationType,
              sortOrder: r.sortOrder,
              isRequired: r.isRequired
            })),
            ...rawChildRels.map((r: any) => ({
              relationDirection: 'child' as const,
              relatedProductId: r.parentProduct_id,
              relationType: r.relationType,
              sortOrder: r.sortOrder,
              isRequired: r.isRequired
            }))
          ]
        })

        // Inicializa variantFiles e attributeFiles (vazios) para cada variante carregada
        const vfInit: Record<string, File[]> = {}
        const afInit: Record<string, Record<number, File[]>> = {}
        rawVariants.forEach((v: any) => {
          vfInit[v.id] = []
          afInit[v.id] = {}
          const attrsArray: Array<any> = v.variantAttribute ?? []
          attrsArray.forEach((_: any, idx: number) => {
            afInit[v.id][idx] = []
          })
        })
        setVariantFiles(vfInit)
        setAttributeFiles(afInit)
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
      // 1) Monta productPayload como objeto “limpo”
      const productPayload: Record<string, any> = {}

      // Garantir que id esteja definido
      const finalId = formData.id?.trim() ? formData.id : product_id
      productPayload.id = finalId

      // Campos simples
      const camposSimples = [
        'name',
        'slug',
        'description',
        'status',
        'price_per',
        'price_of',
        'metaTitle',
        'metaDescription',
        'brand',
        'ean',
        'skuMaster',
        'weight',
        'length',
        'width',
        'height',
        'stock',
        'mainPromotion_id'
      ] as const

      camposSimples.forEach((campo) => {
        const valor = (formData as any)[campo]
        if (valor !== undefined && valor !== null) {
          productPayload[campo] = valor
        }
      })

      if (formData.keywords && formData.keywords.length > 0) {
        productPayload.keywords = formData.keywords
      }
      if (formData.categories && formData.categories.length > 0) {
        productPayload.categories = formData.categories
      }
      if (formData.productDescriptions && formData.productDescriptions.length > 0) {
        productPayload.descriptions = formData.productDescriptions.map((d) => ({
          title: d.title,
          description: d.description,
          status: d.status
        }))
      } else {
        productPayload.descriptions = []
      }
      if (formData.videos && formData.videos.length > 0) {
        productPayload.videoLinks = formData.videos.map((v) => v.url)
      }

      // Sempre envie existingImages (mesmo que vazio)
      productPayload.existingImages = formData.existingImages
        ? formData.existingImages.map((img) => img.id)
        : []

      if (formData.newImages && formData.newImages.length > 0) {
        productPayload.newImages = formData.newImages.map((file) => file.name)
      }
      if (formData.relations && formData.relations.length > 0) {
        productPayload.relations = formData.relations
      }

      // 2) Monta cleanVariants (sem condição de length>0 para existingImages)
      const cleanVariants: Array<Record<string, any>> =
        (formData.variants || []).map((v) => {
          const objVar: Record<string, any> = {
            id: v.id,
            sku: v.sku,
            price_of: v.price_of,
            price_per: v.price_per,
            stock: v.stock,
            sortOrder: v.sortOrder,
            ean: v.ean,
            allowBackorders: v.allowBackorders,
            mainPromotion_id: v.mainPromotion_id,
            // Enviar existingImages sempre, mesmo que seja []
            existingImages: (v.existingImages || []).map((img) => img.id)
          }

          // Se houver arquivos novos, adiciona newImages
          const arquivosDaVariante = variantFiles[v.id] || []
          if (arquivosDaVariante.length > 0) {
            objVar.newImages = arquivosDaVariante.map((file) => file.name)
          }

          if (v.videos && v.videos.length > 0) {
            objVar.videos = v.videos.map((vl) => vl.url)
          }

          // Monta atributos
          objVar.attributes = (v.attributes || []).map((at, ai) => {
            const objAttr: Record<string, any> = {
              id: at.id,
              key: at.key,
              value: at.value,
              status: at.status,
              // Enviar existingImages sempre (mesmo que [])
              existingImages: (at.existingImages || []).map((img) => img.id)
            }

            const arquivosDoAtributo = attributeFiles[v.id]?.[ai] || []
            if (arquivosDoAtributo.length > 0) {
              objAttr.newImages = arquivosDoAtributo.map((file) => file.name)
            }

            return objAttr
          })

          return objVar
        })

      // Se variants existir, inclua no payload
      if (cleanVariants.length > 0) {
        productPayload.variants = cleanVariants
      }

      // 3) Cria o FormData
      const formPayload = new FormData()
      formPayload.append('payload', JSON.stringify(productPayload))

        // 3a) Arquivos “globais” de produto
        ; (formData.newImages || []).forEach((file) => {
          formPayload.append(`productImage_${file.name}`, file)
        })

      // 3b) Arquivos de variantes
      Object.entries(variantFiles).forEach(([variantId, arquivos]) => {
        arquivos.forEach((file) => {
          formPayload.append(`variantImage_${variantId}_${file.name}`, file)
        })
      })

      // 3c) Arquivos de atributos
      Object.entries(attributeFiles).forEach(([variantId, mapaDeAttrs]) => {
        Object.entries(mapaDeAttrs).forEach(([attrIdxStr, arquivos]) => {
          arquivos.forEach((file) => {
            formPayload.append(
              `attributeImage_${variantId}_${attrIdxStr}_${file.name}`,
              file
            )
          })
        })
      })

      // 4) Envia para o endpoint sem definir Content-Type manualmente
      const api = setupAPIClientEcommerce()
      await api.put('/product/update', formPayload)

      toast.success('Produto atualizado com sucesso!')
      router.back()
    } catch (e: any) {
      console.error(e)
      toast.error(e.response?.data?.error || 'Erro ao atualizar produto')
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
              onLinksChange={(newLinks) =>
                setFormData({ ...formData, videos: newLinks })
              }
            />
          </Tab>
          <Tab key="variants" title="Variantes">
            <VariantManagerUpdate
              formData={formData}
              onFormDataChange={setFormData}
              promotions={promotions}
              variantFiles={variantFiles}
              setVariantFiles={setVariantFiles}
              attributeFiles={attributeFiles}
              setAttributeFiles={setAttributeFiles}
            />
          </Tab>
          <Tab key="relations" title="Relacionamentos">
            {/* UI para relações, se existir */}
          </Tab>
        </Tabs>
        <style jsx global>{`
          .my-tabs [role="tab"][aria-selected="true"] {
            background: #e09200;
            color: white;
          }
          .my-tabs [role="tab"]:not([aria-selected="true"]) {
            color: #000;
          }
          .my-tabs [role="tab"]:not([aria-selected="true"]):hover {
            background: #f3f4f6;
          }
          .my-tabs > .nextui-tabs-tablist {
            gap: 0.5rem;
            padding: 0.5rem 1rem;
          }
          .my-tabs .nextui-tabs-panel {
            padding: 1rem;
          }
        `}</style>
        <div className="mt-6">
          <Button
            className="text-white bg-green-600"
            onPress={handleSubmit}
            isLoading={loading}
          >
            Atualizar Produto
          </Button>
        </div>
      </Section>
    </SidebarAndHeader>
  )
}