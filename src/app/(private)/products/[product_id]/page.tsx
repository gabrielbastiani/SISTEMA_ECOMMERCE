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
import {
  ProductDescriptionEditorUpdate,
  ProductDescriptionWithId
} from '@/app/components/add_product/update_product/ProductDescriptionEditorUpdate'
import { CategoryManagerUpdate } from '@/app/components/add_product/update_product/CategoryManagerUpdate'
import { SeoProductInfoUpdate } from '@/app/components/add_product/update_product/SeoProductInfoUpdate'
import { VideoLinksManagerUpdate } from '@/app/components/add_product/update_product/VideoLinksManagerUpdate'
import { VariantManagerUpdate } from '@/app/components/add_product/update_product/VariantManagerUpdate'
import {
  ProductRelation,
  ProductRelationsUpdate
} from '@/app/components/add_product/update_product/ProductRelationsUpdate'

export default function UpdateProductPage() {

  const { product_id } = useParams<{ product_id: string }>();

  const router = useRouter();

  const [formData, setFormData] = useState<ProductFormData>(initialFormData)
  const [categories, setCategories] = useState<Category[]>([])
  const [promotions, setPromotions] = useState<{ id: string; name: string }[]>([])
  const [products, setProducts] = useState<Array<{ id: string; name: string }>>([])

  // Estados para novos arquivos de variante / atributo
  const [variantFiles, setVariantFiles] = useState<Record<string, File[]>>({})
  const [attributeFiles, setAttributeFiles] = useState<Record<string, Record<number, File[]>>>({})

  // ─── NOVO: ID da imagem principal do produto (existente) ──────────
  const [primaryMainImageId, setPrimaryMainImageId] = useState<string>("")

  console.log(primaryMainImageId)

  // ─── NOVO: para cada variante (variantId), qual o imageId marcado como principal ───────
  const [primaryVariantImageIdByVariantId, setPrimaryVariantImageIdByVariantId] = useState<
    Record<string, string>
  >({})

  // ─── NOVO: para cada variante e para cada índice de atributo, qual imageId do atributo principal ───
  const [primaryAttributeImageIdByVariantAndAttrIdx, setPrimaryAttributeImageIdByVariantAndAttrIdx] =
    useState<Record<string, Record<number, string>>>({})

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const api = setupAPIClientEcommerce()
        // 1) Busca categorias, lista de produtos, promoções e dados completos do produto
        const [catRes, prodRes, promoRes, dataRes] = await Promise.all([
          api.get('/category/cms'),
          api.get('/get/products'),
          api.get('/promotions'),
          api.get(`/product/cms/get?product_id=${product_id}`)
        ])

        setCategories(catRes.data.all_categories_disponivel)
        setPromotions(
          promoRes.data.map((p: any) => ({
            id: String(p.id),
            name: p.name
          }))
        )
        setProducts(
          prodRes.data.allow_products.map((p: any) => ({
            id: p.id,
            name: p.name
          }))
        )

        const p = dataRes.data

        // Helper para extrair ID do YouTube
        function extractYouTubeId(url: string): string | null {
          const regExp = /(?:v=|\/)([0-9A-Za-z_-]{11})/
          const match = url.match(regExp)
          return match ? match[1] : null
        }

        //
        // ─── TRATAMENTO DAS IMAGENS DE NÍVEL PRODUTO ──────────────────────
        //
        // rawImages vem do back‑end incluindo campo `isPrimary: boolean`
        const rawImages: Array<{ id: string; url: string; altText: string; isPrimary: boolean }> =
          p.images ?? []

        // Encontrar qual ID está marcado como isPrimary
        const initialPrimaryMainImage = rawImages.find((img) => img.isPrimary)?.id ?? ""

        // ─── TRATAMENTO DAS VARIANTES ───────────────────────────────────────
        const rawVariants: Array<any> = p.variants ?? []
        // Para popular primaryVariantImageIdByVariantId e primaryAttributeImageIdByVariantAndAttrIdx
        const primVarMap: Record<string, string> = {}
        const primAttrMap: Record<string, Record<number, string>> = {}

        // Monta formData.variants a partir de rawVariants
        const formVariants: VariantFormData[] = rawVariants.map((v: any) => {
          const variantId: string = v.id

          // todas as imagens de variante, com isPrimary
          const existingVarImgs: Array<{
            id: string
            url: string
            altText: string
            isPrimary: boolean
          }> = v.productVariantImage ?? []

          // Descobre qual imagem de variante é primary
          const primaryVar = existingVarImgs.find((img) => img.isPrimary)
          if (primaryVar) {
            primVarMap[variantId] = primaryVar.id
          } else {
            primVarMap[variantId] = ""
          }

          // agora cada atributo:
          const attributesRaw: Array<any> = v.variantAttribute ?? []
          primAttrMap[variantId] = {}
          attributesRaw.forEach((a: any, idx: number) => {
            const imagesOfAttr: Array<{ id: string; url: string; altText: string; isPrimary: boolean }> =
              a.variantAttributeImage ?? []
            const primaryAttrImg = imagesOfAttr.find((img) => img.isPrimary)
            primAttrMap[variantId][idx] = primaryAttrImg ? primaryAttrImg.id : ""
          })

          // Mapeia os vídeos da variante
          const rawVideosVariant: Array<{ url: string }> = v.productVariantVideo ?? []

          // Montagem de VariantFormData
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

            // Imagens existentes da variante (sem os arquivos File, só IDs e URLs)
            existingImages: existingVarImgs.map(
              (i: any) =>
              ({
                id: i.id,
                url: i.url,
                altText: i.altText
              } as ImageRecord)
            ),

            // Placeholder para novos arquivos File
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

            videos: rawVideosVariant.map((vv) => {
              const ytId = extractYouTubeId(vv.url)
              return {
                url: vv.url,
                thumbnail: ytId ? `https://img.youtube.com/vi/${ytId}/0.jpg` : undefined
              } as VideoInput
            }),

            // Campos extras para satisfazer o tipo VariantFormData
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
            variantAttributes: [] as any[]
          } as VariantFormData
        })

        //
        // ─── POPULAÇÃO DOS STATES ─────────────────────────────────────────────
        //
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
          categories: (p.categories ?? []).map((c: any) => c.category_id),
          description: p.description ?? '',

          // Imagens do produto
          existingImages: rawImages.map(
            (i) =>
            ({
              id: i.id,
              url: i.url,
              altText: i.altText
            } as ImageRecord)
          ),
          newImages: [] as File[],

          // Vídeos do produto
          videos: (p.videos ?? []).map((v: any) => {
            const id = extractYouTubeId(v.url)
            return {
              url: v.url,
              thumbnail: id ? `https://img.youtube.com/vi/${id}/0.jpg` : undefined
            } as VideoInput
          }),

          // Descrições
          productDescriptions: (p.productsDescriptions ?? []).map(
            (d: any) =>
            ({
              id: d.id,
              title: d.title,
              description: d.description,
              status: d.status as any
            } as ProductDescriptionWithId)
          ),

          // Variantes
          variants: formVariants,

          // Relações (união de parentRelations e childRelations)
          relations: [
            ...(p.parentRelations ?? []).map((r: any) => ({
              id: r.id,
              relationDirection: 'parent' as const,
              relatedProductId: r.childProduct_id,
              relationType: r.relationType,
              sortOrder: r.sortOrder,
              isRequired: r.isRequired
            })),
            ...(p.childRelations ?? []).map((r: any) => ({
              id: r.id,
              relationDirection: 'child' as const,
              relatedProductId: r.parentProduct_id,
              relationType: r.relationType,
              sortOrder: r.sortOrder,
              isRequired: r.isRequired
            }))
          ]
        })

        // Inicializa variantFiles e attributeFiles (vazios)
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

        // Finalmente, popula os estados de “primárias”:
        setPrimaryMainImageId(initialPrimaryMainImage)
        setPrimaryVariantImageIdByVariantId(primVarMap)
        setPrimaryAttributeImageIdByVariantAndAttrIdx(primAttrMap)
      } catch (err) {
        console.error(err)
        toast.error('Erro ao carregar produto')
      }
    }
    load()
  }, [product_id])

  //
  // ─── handleSubmit (envio da atualização) ─────────────────────────────────────────
  //
  const handleSubmit = async () => {
    setLoading(true)
    try {
      // 1) Monta o objeto “productPayload”
      const productPayload: Record<string, any> = {}

      // Garante que id existe
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

      // Descrições
      if (formData.productDescriptions && formData.productDescriptions.length > 0) {
        productPayload.descriptions = formData.productDescriptions.map((d) => ({
          id: d.id,
          title: d.title,
          description: d.description,
          status: d.status
        }))
      } else {
        productPayload.descriptions = []
      }

      // Vídeos de Produto
      if (formData.videos && formData.videos.length > 0) {
        productPayload.videoLinks = formData.videos.map((v) => v.url)
      }

      //
      // ─── IMAGENS DO PRODUTO ──────────────────────────────────────────────────────
      //
      // existingImages: IDs a manter
      productPayload.existingImages = formData.existingImages
        ? formData.existingImages.map((img) => img.id)
        : []

      // primaryMainImageId: adiciona ao payload
      if (primaryMainImageId) {
        productPayload.primaryMainImageId = primaryMainImageId
      }

      // newImages (nomes) para o serviço criar
      if (formData.newImages && formData.newImages.length > 0) {
        productPayload.newImages = formData.newImages.map((file) => file.name)
      }

      // Relações
      if (formData.relations && formData.relations.length > 0) {
        productPayload.relations = formData.relations
      }

      //
      // ─── VARIANTES, IMAGENS DE VARIANTE E ATRIBUTOS ──────────────────────────────
      //
      const cleanVariants: Array<Record<string, any>> = (formData.variants || []).map((v) => {
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

          // existingImages de variante
          existingImages: (v.existingImages || []).map((img) => img.id),

          // primaryImageId desta variante
          primaryImageId: primaryVariantImageIdByVariantId[v.id] || ""
        }

        // Se houver novos arquivos de variante
        const arquivosDaVariante = variantFiles[v.id] || []
        if (arquivosDaVariante.length > 0) {
          objVar.newImages = arquivosDaVariante.map((file) => file.name)
        }

        // Vídeos da variante
        if (v.videos && v.videos.length > 0) {
          objVar.videos = v.videos.map((vl) => vl.url)
        }

        // Atributos da variante
        objVar.attributes = (v.attributes || []).map((at, ai) => {
          const objAttr: Record<string, any> = {
            id: at.id,
            key: at.key,
            value: at.value,
            status: at.status,
            existingImages: (at.existingImages || []).map((img) => img.id),

            // primaryAttributeImageId para este atributo
            primaryAttributeImageId:
              (primaryAttributeImageIdByVariantAndAttrIdx[v.id] || {})[ai] || ""
          }

          // Se houver novos arquivos de atributo para este índice
          const arquivosDoAtributo = attributeFiles[v.id]?.[ai] || []
          if (arquivosDoAtributo.length > 0) {
            objAttr.newImages = arquivosDoAtributo.map((file) => file.name)
          }

          return objAttr
        })

        return objVar
      })

      if (cleanVariants.length > 0) {
        productPayload.variants = cleanVariants
      }

      //
      // ─── MONTAÇÃO DO FormData PARA ENVIO ─────────────────────────────────────────────
      //
      const formPayload = new FormData()
      formPayload.append('payload', JSON.stringify(productPayload))

        // Anexa arquivos novos de nível produto
        ; (formData.newImages || []).forEach((file) => {
          // Nome do field: “productImage_<nome_do_arquivo>”
          formPayload.append(`productImage_${file.name}`, file)
        })

      // Anexa arquivos novos de nível variante
      Object.entries(variantFiles).forEach(([variantId, arquivos]) => {
        arquivos.forEach((file) => {
          // Fieldname: “variantImage_<variantId>_<nome_do_arquivo>”
          formPayload.append(`variantImage_${variantId}_${file.name}`, file)
        })
      })

      // Anexa arquivos novos de nível atributo
      Object.entries(attributeFiles).forEach(([variantId, mapaDeAttrs]) => {
        Object.entries(mapaDeAttrs).forEach(([attrIdxStr, arquivos]) => {
          arquivos.forEach((file) => {
            // Fieldname: “attributeImage_<variantId>_<attrIdx>_<nome_do_arquivo>”
            formPayload.append(
              `attributeImage_${variantId}_${attrIdxStr}_${file.name}`,
              file
            )
          })
        })
      })

      //
      // ─── ENVIO AO BACK‑END ─────────────────────────────────────────────────────────
      //
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

  //
  // ─── RENDERIZAÇÃO ─────────────────────────────────────────────────────────────────
  //
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

              // ─── EXISTENTES E NOVAS IMAGENS ─────────────────────────────────────────────────
              existingImages={formData.existingImages ?? []}
              newImages={formData.newImages ?? []}

              // ─── QUAL IMAGEM ESTÁ MARCADA COMO “PRINCIPAL” ────────────────────────────────
              primaryImageId={primaryMainImageId}
              onSetPrimaryImageId={(id: string) => setPrimaryMainImageId(id)}

              // ─── CALLBACKS PARA ADICIONAR / REMOVER IMAGENS ───────────────────────────────
              onAddNewImage={(files: File[]) =>
                setFormData((prev) => ({
                  ...prev,
                  newImages: [...(prev.newImages ?? []), ...files]
                }))
              }
              onRemoveExistingImage={(imgId: string) =>
                setFormData((prev) => ({
                  ...prev,
                  existingImages: (prev.existingImages ?? []).filter((img) => img.id !== imgId)
                }))
              }
              onRemoveNewImage={(index: number) =>
                setFormData((prev) => ({
                  ...prev,
                  newImages: (prev.newImages ?? []).filter((_, i) => i !== index)
                }))
              }
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

              // ─── NOVOS PROPS PARA IMAGENS DE VARIANTE ──────────
              primaryVariantImageIdByVariantId={primaryVariantImageIdByVariantId}
              onSetPrimaryVariantImageId={(variantId: string, imageId: string) =>
                setPrimaryVariantImageIdByVariantId((prev) => ({
                  ...prev,
                  [variantId]: imageId
                }))
              }

              // ─── NOVOS PROPS PARA IMAGENS DE ATRIBUTO ──────────
              primaryAttributeImageIdByVariantAndAttrIdx={
                primaryAttributeImageIdByVariantAndAttrIdx
              }
              onSetPrimaryAttributeImageId={(
                variantId: string,
                attrIndex: number,
                imageId: string
              ) => {
                setPrimaryAttributeImageIdByVariantAndAttrIdx((prev) => {
                  const copy = { ...prev }
                  if (!copy[variantId]) copy[variantId] = {}
                  copy[variantId][attrIndex] = imageId
                  return copy
                })
              }}
            />
          </Tab>

          <Tab key="relations" title="Relacionamentos">
            <ProductRelationsUpdate
              relations={formData.relations as ProductRelation[]}
              products={products}
              onRelationsChange={(newRels) =>
                setFormData({ ...formData, relations: newRels })
              }
            />
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