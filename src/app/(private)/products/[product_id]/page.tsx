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
import { BasicProductInfoUpdate, BuyTogetherOption } from '@/app/components/add_product/update_product/BasicProductInfoUpdate'
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

import { CharacteristicManagerUpdate, CharacteristicItem } from '@/app/components/add_product/update_product/CharacteristicManagerUpdate'

/* Skeleton helpers (mantive seu layout de skeletons) */
const SkeletonLine: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-4 rounded bg-gray-200 ${className} animate-pulse`} />
)

const SkeletonBox: React.FC<{ w?: string; h?: string; className?: string }> = ({ w = 'w-full', h = 'h-6', className = '' }) => (
  <div className={`${w} ${h} rounded bg-gray-200 ${className} animate-pulse`} />
)

const SkeletonVariantCard: React.FC = () => (
  <div className="border rounded-lg p-4 bg-white shadow">
    <div className="flex justify-between items-center mb-4">
      <div className="w-48"><SkeletonLine className="h-5" /></div>
      <div className="w-10"><SkeletonBox className="h-8 w-8" /></div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
      <SkeletonBox className="h-10" />
      <SkeletonBox className="h-10" />
      <SkeletonBox className="h-10" />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <SkeletonBox className="h-10" />
      <SkeletonBox className="h-10" />
    </div>
  </div>
)

const SkeletonImagesRow: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <div className="flex gap-2 mt-2 overflow-x-auto pb-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="shrink-0">
        <div className="w-20 h-20 rounded-lg bg-gray-200 animate-pulse" />
      </div>
    ))}
  </div>
)

export default function UpdateProductPage() {
  const { product_id } = useParams<{ product_id: string }>()
  const router = useRouter()

  const [buyTogetherOptions, setBuyTogetherOptions] = useState<BuyTogetherOption[]>([])
  const [formData, setFormData] = useState<ProductFormData>(initialFormData)
  const [categories, setCategories] = useState<Category[]>([])
  const [promotions, setPromotions] = useState<{ id: string; name: string }[]>([])
  const [products, setProducts] = useState<Array<{ id: string; name: string }>>([])
  const [variantFiles, setVariantFiles] = useState<Record<string, File[]>>({})
  const [attributeFiles, setAttributeFiles] = useState<Record<string, Record<number, File[]>>>({})

  // primary states: for existing images we store id; for new images we store file.name
  const [primaryMainImageId, setPrimaryMainImageId] = useState<string>("")
  const [primaryMainImageName, setPrimaryMainImageName] = useState<string>("")

  // variant / attribute primaries
  const [primaryVariantImageIdByVariantId, setPrimaryVariantImageIdByVariantId] = useState<Record<string, string>>({})
  const [primaryAttributeImageIdByVariantAndAttrIdx, setPrimaryAttributeImageIdByVariantAndAttrIdx] = useState<Record<string, Record<number, string>>>({})

  // characteristics states
  const [characteristicFiles, setCharacteristicFiles] = useState<File[]>([]) // files to append
  const [characteristicsLocal, setCharacteristicsLocal] = useState<CharacteristicItem[]>([])

  // loading
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      setInitialLoading(true)
      try {
        const api = setupAPIClientEcommerce()
        const [catRes, prodRes, promoRes, dataRes, btRes] = await Promise.all([
          api.get('/category/cms'),
          api.get('/get/products'),
          api.get('/promotions/get'),
          api.get(`/product/cms/get?product_id=${product_id}`),
          api.get('/buy_together')
        ])

        if (!mounted) return

        setCategories(catRes.data.all_categories_disponivel)
        setPromotions(
          promoRes.data.allow_promotions.map((p: any) => ({ id: String(p.id), name: p.name }))
        )
        setBuyTogetherOptions(btRes.data.map((p: any) => ({ id: String(p.id), name: p.name })))
        setProducts(prodRes.data.allow_products.map((p: any) => ({ id: p.id, name: p.name })))

        const p = dataRes.data

        function extractYouTubeId(url: string): string | null {
          const regExp = /(?:v=|\/)([0-9A-Za-z_-]{11})/
          const match = url.match(regExp)
          return match ? match[1] : null
        }

        const rawImages: Array<{ id: string; url: string; altText: string; isPrimary: boolean }> = p.images ?? []
        const initialPrimaryMainImage = rawImages.find((img) => img.isPrimary)?.id ?? ""
        const rawVariants: Array<any> = p.variants ?? []
        const primVarMap: Record<string, string> = {}
        const primAttrMap: Record<string, Record<number, string>> = {}

        const formVariants: VariantFormData[] = rawVariants.map((v: any) => {
          const variantId: string = v.id
          const existingVarImgs: Array<any> = v.productVariantImage ?? []

          const primaryVar = existingVarImgs.find((img) => img.isPrimary)
          primVarMap[variantId] = primaryVar ? primaryVar.id : ""

          const attributesRaw: Array<any> = v.variantAttribute ?? []
          primAttrMap[variantId] = {}
          attributesRaw.forEach((a: any, idx: number) => {
            const imagesOfAttr: Array<any> = a.variantAttributeImage ?? []
            const primaryAttrImg = imagesOfAttr.find((img) => img.isPrimary)
            primAttrMap[variantId][idx] = primaryAttrImg ? primaryAttrImg.id : ""
          })

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

            existingImages: existingVarImgs.map((i: any) => ({ id: i.id, url: i.url, altText: i.altText } as ImageRecord)),
            newImages: [] as File[],

            attributes: attributesRaw.map((a: any) => {
              const imagesOfAttr: Array<any> = a.variantAttributeImage ?? []
              return {
                id: a.id,
                key: a.key,
                value: a.value,
                status: a.status as StatusProduct,
                existingImages: imagesOfAttr.map((ai: any) => ({ id: ai.id, url: ai.url, altText: ai.altText } as ImageRecord)),
                newImages: [] as File[]
              } as VariantAttribute
            }),

            videos: rawVideosVariant.map((vv) => {
              const ytId = extractYouTubeId(vv.url)
              return { url: vv.url, thumbnail: ytId ? `https://img.youtube.com/vi/${ytId}/0.jpg` : undefined } as VideoInput
            }),

            images: [] as File[],
            productVariantImage: existingVarImgs.map((i: any) => ({ id: i.id, url: i.url, altText: i.altText } as ImageRecord)),
            productVariantVideo: rawVideosVariant.map((vv) => {
              const ytId = extractYouTubeId(vv.url)
              return { url: vv.url, thumbnail: ytId ? `https://img.youtube.com/vi/${ytId}/0.jpg` : undefined } as VideoInput
            }),
            created_at: undefined,
            product_id: v.product_id ?? product_id,
            variantAttributes: [] as any[]
          } as VariantFormData
        })

        if (!mounted) return

        // Build characteristics array from p.productCharacteristics (if provided by backend)
        const rawChars: any[] = Array.isArray(p.productCharacteristics) ? p.productCharacteristics : []
        const mappedChars: CharacteristicItem[] = rawChars.map((c: any) => {
          const imageField = c.image ?? c.imageName ?? null
          let previewUrl: string | null = null
          if (imageField) {
            if (typeof imageField === 'string' && (imageField.startsWith('http://') || imageField.startsWith('https://') || imageField.startsWith('/'))) {
              previewUrl = imageField
            } else if (typeof imageField === 'string') {
              previewUrl = `/files/${imageField}`
            }
          }
          return {
            id: c.id,
            key: c.key ?? '',
            value: c.value ?? '',
            file: null,
            imageName: imageField ?? null,
            previewUrl
          } as CharacteristicItem
        })

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
          buyTogether_id: p.buyTogether_id ?? '',
          categories: (p.categories ?? []).map((c: any) => c.category_id),
          description: p.description ?? '',

          existingImages: rawImages.map((i) => ({ id: i.id, url: i.url, altText: i.altText } as ImageRecord)),
          newImages: [] as File[],

          videos: (p.videos ?? []).map((v: any) => {
            const id = extractYouTubeId(v.url)
            return { url: v.url, thumbnail: id ? `https://img.youtube.com/vi/${id}/0.jpg` : undefined } as VideoInput
          }),

          productDescriptions: (p.productsDescriptions ?? []).map((d: any) => ({ id: d.id, title: d.title, description: d.description, status: d.status } as ProductDescriptionWithId)),

          variants: formVariants,

          relations: [
            ...(p.parentRelations ?? []).map((r: any) => ({ id: r.id, relationDirection: 'parent' as const, relatedProductId: r.childProduct_id, relationType: r.relationType, sortOrder: r.sortOrder, isRequired: r.isRequired })),
            ...(p.childRelations ?? []).map((r: any) => ({ id: r.id, relationDirection: 'child' as const, relatedProductId: r.parentProduct_id, relationType: r.relationType, sortOrder: r.sortOrder, isRequired: r.isRequired }))
          ],

          // add loaded characteristics to formData for convenience
          characteristics: mappedChars.map(c => ({ id: c.id, key: c.key, value: c.value, imageName: c.imageName }))
        })

        // set local char state for interactive editing
        setCharacteristicsLocal(mappedChars)

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

        // popula os estados de primárias
        setPrimaryMainImageId(initialPrimaryMainImage)
        setPrimaryMainImageName("")
        setPrimaryVariantImageIdByVariantId(primVarMap)
        setPrimaryAttributeImageIdByVariantAndAttrIdx(primAttrMap)
      } catch (err) {
        console.error(err)
        if (mounted) toast.error('Erro ao carregar produto')
      } finally {
        if (mounted) setInitialLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [product_id])

  const handleSetPrimaryMainImage = (idOrName: string, isNew?: boolean) => {
    if (isNew) {
      setPrimaryMainImageName(idOrName)
      setPrimaryMainImageId("")
    } else {
      setPrimaryMainImageId(idOrName)
      setPrimaryMainImageName("")
    }
  }

  // Characteristics change handler (recebe do componente update)
  const onCharacteristicsChange = (chars: CharacteristicItem[]) => {
    const files: File[] = chars.map(c => c.file).filter(Boolean) as File[]
    setCharacteristicFiles(files)

    const forPayload = chars.map(c => ({
      id: c.id,
      key: c.key,
      value: c.value,
      imageName: c.file instanceof File ? c.file.name : (c.imageName ?? null)
    }))

    setFormData(prev => ({
      ...prev,
      characteristics: forPayload
    }))

    setCharacteristicsLocal(chars)
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const productPayload: Record<string, any> = {}
      const finalId = formData.id?.trim() ? formData.id : product_id
      productPayload.id = finalId

      const camposSimples = [
        'name', 'slug', 'description', 'status', 'price_per', 'price_of', 'metaTitle', 'metaDescription', 'brand', 'ean', 'skuMaster', 'weight', 'length', 'width', 'height', 'stock', 'mainPromotion_id', 'buyTogether_id'
      ] as const

      camposSimples.forEach((campo) => {
        const valor = (formData as any)[campo]
        if (valor !== undefined && valor !== null) productPayload[campo] = valor
      })

      if (formData.keywords && formData.keywords.length > 0) productPayload.keywords = formData.keywords
      if (formData.categories && formData.categories.length > 0) productPayload.categories = formData.categories

      productPayload.descriptions = (formData.productDescriptions && formData.productDescriptions.length > 0)
        ? formData.productDescriptions.map((d) => ({ id: d.id, title: d.title, description: d.description, status: d.status }))
        : []

      if (formData.videos && formData.videos.length > 0) productPayload.videoLinks = formData.videos.map((v) => v.url)

      if (formData.existingImages) {
        productPayload.existingImages = formData.existingImages.map((img) => img.id)
      }

      if (primaryMainImageId && primaryMainImageId.trim() !== "") {
        productPayload.primaryMainImageId = primaryMainImageId
      } else if (primaryMainImageName && primaryMainImageName.trim() !== "") {
        productPayload.primaryMainImageName = primaryMainImageName
      }

      if (formData.newImages && formData.newImages.length > 0) {
        productPayload.newImages = formData.newImages.map((file) => file.name)
      }

      if (formData.relations && formData.relations.length > 0) productPayload.relations = formData.relations

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

          existingImages: (v.existingImages || []).map((img) => img.id),

          primaryImageId: primaryVariantImageIdByVariantId[v.id] || ""
        }

        const arquivosDaVariante = variantFiles[v.id] || []
        if (arquivosDaVariante.length > 0) objVar.newImages = arquivosDaVariante.map((file) => file.name)

        if (v.videos && v.videos.length > 0) objVar.videos = v.videos.map((vl) => vl.url)

        objVar.attributes = (v.attributes || []).map((at, ai) => {
          const objAttr: Record<string, any> = {
            id: at.id,
            key: at.key,
            value: at.value,
            status: at.status,
            existingImages: (at.existingImages || []).map((img) => img.id),
            primaryAttributeImageId: (primaryAttributeImageIdByVariantAndAttrIdx[v.id] || {})[ai] || ""
          }
          const arquivosDoAtributo = attributeFiles[v.id]?.[ai] || []
          if (arquivosDoAtributo.length > 0) objAttr.newImages = arquivosDoAtributo.map((file) => file.name)
          return objAttr
        })

        return objVar
      })

      if (cleanVariants.length > 0) productPayload.variants = cleanVariants

      // Características: incluir no payload
      const charsForPayload = (formData as any).characteristics ?? []
      if (Array.isArray(charsForPayload) && charsForPayload.length > 0) {
        productPayload.characteristics = charsForPayload
          .map((c: any) => ({
            id: c.id ?? undefined,
            key: String(c.key ?? '').trim(),
            value: String(c.value ?? '').trim(),
            imageName: c.imageName === undefined ? null : c.imageName
          }))
      } else {
        productPayload.characteristics = []
      }

      const formPayload = new FormData()
      formPayload.append('payload', JSON.stringify(productPayload))

      // append files — use explicit loops to avoid ASI/parsing problems
      const newImagesList = formData.newImages || []
      for (const file of newImagesList) {
        formPayload.append(`productImage::${file.name}`, file)
      }

      for (const [variantId, arquivos] of Object.entries(variantFiles)) {
        for (const file of arquivos) {
          formPayload.append(`variantImage::${variantId}::${file.name}`, file)
        }
      }

      for (const [variantId, mapaDeAttrs] of Object.entries(attributeFiles)) {
        for (const [attrIdxStr, arquivos] of Object.entries(mapaDeAttrs)) {
          for (const file of arquivos) {
            formPayload.append(`attributeImage::${variantId}::${attrIdxStr}::${file.name}`, file)
          }
        }
      }

      // append characteristics files (backend expects 'characteristicImages' field)
      for (const file of (characteristicFiles || [])) {
        formPayload.append('characteristicImages', file, file.name)
      }

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
        <Tabs variant="bordered" color="danger" className="my-tabs bg-white rounded-lg shadow-sm">
          <Tab key="info" title="Informações Básicas">
            {initialLoading ? (
              <div className="space-y-6 max-w-3xl">
                <div className="grid grid-cols-1 gap-4">
                  <SkeletonBox className="h-12 w-3/4" />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <SkeletonBox className="h-10" />
                  <SkeletonBox className="h-10" />
                  <SkeletonBox className="h-10" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <SkeletonBox className="h-10" />
                  <SkeletonBox className="h-10" />
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <SkeletonBox className="h-10" />
                  <SkeletonBox className="h-10" />
                  <SkeletonBox className="h-10" />
                  <SkeletonBox className="h-10" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <SkeletonBox className="h-10" />
                  <SkeletonBox className="h-10" />
                </div>

                <div>
                  <SkeletonLine className="h-5 w-32 mb-2" />
                  <SkeletonImagesRow count={4} />
                </div>
              </div>
            ) : (
              <BasicProductInfoUpdate
                formData={formData}
                onFormDataChange={setFormData}
                promotions={promotions}
                existingImages={formData.existingImages ?? []}
                newImages={formData.newImages ?? []}
                primaryImageId={primaryMainImageId}
                primaryImageName={primaryMainImageName}
                onSetPrimaryImage={(idOrName: string, isNew?: boolean) => handleSetPrimaryMainImage(idOrName, isNew)}
                onAddNewImage={(files: File[]) => setFormData((prev) => ({ ...prev, newImages: [...(prev.newImages ?? []), ...files] }))}
                onRemoveExistingImage={(imgId: string) => {
                  setFormData((prev) => ({ ...prev, existingImages: (prev.existingImages ?? []).filter((img) => img.id !== imgId) }))
                  if (primaryMainImageId === imgId) setPrimaryMainImageId("")
                }}
                onRemoveNewImage={(index: number) => {
                  const toRemove = (formData.newImages ?? [])[index]
                  setFormData((prev) => ({ ...prev, newImages: (prev.newImages ?? []).filter((_, i) => i !== index) }))
                  if (toRemove && toRemove.name === primaryMainImageName) setPrimaryMainImageName("")
                }}
                buyTogetherOptions={buyTogetherOptions}
                onBuyTogetherChange={(id) => setFormData(d => ({ ...d, buyTogether_id: id }))}
              />
            )}
          </Tab>

          <Tab key="descriptions" title="Descrições">
            {initialLoading ? (
              <div className="space-y-3">
                <SkeletonLine className="h-5 w-48" />
                <SkeletonBox className="h-40" />
                <SkeletonLine className="h-5 w-48" />
                <SkeletonBox className="h-40" />
              </div>
            ) : (
              <ProductDescriptionEditorUpdate descriptions={formData.productDescriptions} onDescriptionsChange={(d) => setFormData({ ...formData, productDescriptions: d })} />
            )}
          </Tab>

          <Tab key="characteristics" title="Caracteristicas">
            {initialLoading ? (
              <div>
                <SkeletonLine className="h-5 w-48" />
                <SkeletonBox className="h-24" />
              </div>
            ) : (
              <CharacteristicManagerUpdate
                characteristics={characteristicsLocal}
                onChange={onCharacteristicsChange}
              />
            )}
          </Tab>

          <Tab key="categories" title="Categorias">
            {initialLoading ? (
              <div className="space-y-4 max-w-lg">
                <SkeletonLine className="h-5 w-32" />
                <div className="flex flex-wrap gap-2">
                  <SkeletonBox className="h-8 w-24" />
                  <SkeletonBox className="h-8 w-24" />
                  <SkeletonBox className="h-8 w-24" />
                </div>
              </div>
            ) : (
              <CategoryManagerUpdate categories={categories} selectedCategories={formData.categories} onSelectionChange={(c) => setFormData({ ...formData, categories: c })} />
            )}
          </Tab>

          <Tab key="seo" title="SEO">
            {initialLoading ? (
              <div className="space-y-3 max-w-2xl">
                <SkeletonBox className="h-10" />
                <SkeletonBox className="h-10" />
                <SkeletonBox className="h-10" />
              </div>
            ) : (
              <SeoProductInfoUpdate formData={formData} onFormDataChange={(data) => setFormData({ ...formData, ...data })} />
            )}
          </Tab>

          <Tab key="videos" title="Vídeos">
            {initialLoading ? (
              <div className="space-y-3">
                <SkeletonLine className="h-5 w-24" />
                <SkeletonBox className="h-12 w-64" />
              </div>
            ) : (
              <VideoLinksManagerUpdate links={formData.videos} onLinksChange={(newLinks) => setFormData({ ...formData, videos: newLinks })} />
            )}
          </Tab>

          <Tab key="variants" title="Variantes">
            {initialLoading ? (
              <div className="space-y-4">
                <SkeletonVariantCard />
                <SkeletonVariantCard />
              </div>
            ) : (
              <VariantManagerUpdate
                formData={formData}
                onFormDataChange={setFormData}
                promotions={promotions}
                variantFiles={variantFiles}
                setVariantFiles={setVariantFiles}
                attributeFiles={attributeFiles}
                setAttributeFiles={setAttributeFiles}
                primaryVariantImageIdByVariantId={primaryVariantImageIdByVariantId}
                onSetPrimaryVariantImageId={(variantId: string, imageId: string) => setPrimaryVariantImageIdByVariantId((prev) => ({ ...prev, [variantId]: imageId }))}
                primaryAttributeImageIdByVariantAndAttrIdx={primaryAttributeImageIdByVariantAndAttrIdx}
                onSetPrimaryAttributeImageId={(variantId: string, attrIndex: number, imageId: string) => {
                  setPrimaryAttributeImageIdByVariantAndAttrIdx((prev) => {
                    const copy = { ...prev }
                    if (!copy[variantId]) copy[variantId] = {}
                    copy[variantId][attrIndex] = imageId
                    return copy
                  })
                }}
              />
            )}
          </Tab>

          <Tab key="relations" title="Relacionamentos">
            {initialLoading ? (
              <div className="space-y-3 max-w-lg">
                <SkeletonLine className="h-5 w-48" />
                <SkeletonBox className="h-10" />
                <SkeletonBox className="h-10" />
              </div>
            ) : (
              <ProductRelationsUpdate relations={formData.relations as ProductRelation[]} products={products} onRelationsChange={(newRels) => setFormData({ ...formData, relations: newRels })} />
            )}
          </Tab>
        </Tabs>

        <style jsx global>{`
          .my-tabs [role="tab"][aria-selected="true"] { background: #e09200; color: white; }
          .my-tabs [role="tab"]:not([aria-selected="true"]) { color: #000; }
          .my-tabs [role="tab"]:not([aria-selected="true"]):hover { background: #f3f4f6; }
          .my-tabs > .nextui-tabs-tablist { gap: 0.5rem; padding: 0.5rem 1rem; }
          .my-tabs .nextui-tabs-panel { padding: 1rem; }
        `}</style>

        <div className="mt-6">
          <Button className="text-white bg-green-600" onPress={handleSubmit} isLoading={loading}>Atualizar Produto</Button>
        </div>
      </Section>
    </SidebarAndHeader>
  )
}