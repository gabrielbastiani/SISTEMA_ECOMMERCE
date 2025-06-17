'use client'

import { AuthContext } from '@/app/contexts/AuthContext'
import { useState, useEffect, useContext } from 'react'
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
import { SeoProductInfo } from '@/app/components/add_product/SeoProductInfo'

export default function AddProductPage() {
  const { user } = useContext(AuthContext)

  const [categories, setCategories] = useState<Category[]>([])
  const [allProducts, setAllProducts] = useState<{ id: string; name: string }[]>([])
  const [promotions, setPromotions] = useState<{ id: string; name: string }[]>([])

  const [formData, setFormData] = useState<ProductFormData>(initialFormData)
  const [mainImages, setMainImages] = useState<File[]>([])

  const [primaryMainImageIndex, setPrimaryMainImageIndex] = useState<number>(-1)

  const [productVideoLinks, setProductVideoLinks] = useState<VideoInput[]>([])
  const [variantVideoLinks, setVariantVideoLinks] = useState<Record<string, VideoInput[]>>({})

  const [variantFiles, setVariantFiles] = useState<Record<string, File[]>>({})
  const [attributeFiles, setAttributeFiles] = useState<Record<string, Record<number, File[]>>>({})

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const api = setupAPIClientEcommerce()
    api.get('/promotions/get').then(r => setPromotions(r.data.allow_promotions)).catch(console.error)
    api.get('/category/cms').then(r => setCategories(r.data.all_categories_disponivel)).catch(console.error)
    api.get('/get/products').then(r => setAllProducts(r.data.allow_products)).catch(console.error)
  }, [])

  const resetForm = () => {
    setFormData(initialFormData)
    setProductVideoLinks([])
    setVariantVideoLinks({})
    setMainImages([])
    setPrimaryMainImageIndex(-1)
    setVariantFiles({})
    setAttributeFiles({})
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const formPayload = new FormData()

      // Campos simples / arrays (exceto variantes, relações, vídeoLinks)
      Object.entries(formData).forEach(([key, value]) => {
        if (value === undefined || value === null) return
        if (key === 'variants' || key === 'relations' || key === 'videoLinks') return
        if (Array.isArray(value) || typeof value === 'object') {
          formPayload.append(key, JSON.stringify(value))
        } else {
          formPayload.append(key, String(value))
        }
      })

      formPayload.append('userEcommerce_id', user?.id || '')

      // Vídeo-links do produto
      const videoLinksToSend = productVideoLinks.map(v => v.url)
      formPayload.append('videoLinks', JSON.stringify(videoLinksToSend))

      // Montar as variantes com os novos campos “images” e “primaryImageName” e, dentro de cada atributo, “images” e “primaryAttributeImageName”
      const cleanVariants = formData.variants.map(v => {
        const variantId = v.id
        const uploadedVariantFiles = variantFiles[variantId] || []
        const indexPrimaryVariant = primaryVariantIndexById[variantId] ?? -1
        const primaryVariantImageName =
          indexPrimaryVariant >= 0 && uploadedVariantFiles[indexPrimaryVariant]
            ? uploadedVariantFiles[indexPrimaryVariant].name
            : null

        // Para cada atributo, capturamos “primaryAttributeImageName”
        const attributesWithPrimaries = v.attributes.map((attr, idx) => {
          const uploadedAttrFiles = attributeFiles[variantId]?.[idx] || []
          const indexPrimaryAttr =
            primaryAttributeIndexById[variantId]?.[idx] ?? -1
          const primaryAttributeImageName =
            indexPrimaryAttr >= 0 && uploadedAttrFiles[indexPrimaryAttr]
              ? uploadedAttrFiles[indexPrimaryAttr].name
              : null

          return {
            key: attr.key,
            value: attr.value,
            // Se quiser enviar status de atributo, pode acrescentar aqui
            images: uploadedAttrFiles.map(f => f.name),
            primaryAttributeImageName, // NOME da imagem principal do atributo (ou null)
          }
        })

        return {
          id: v.id,
          sku: v.sku,
          price_of: v.price_of,
          price_per: v.price_per,
          stock: v.stock,
          sortOrder: v.sortOrder,
          ean: v.ean,
          allowBackorders: v.allowBackorders,
          mainPromotion_id: v.mainPromotion_id,
          images: uploadedVariantFiles.map(f => f.name),
          primaryImageName: primaryVariantImageName, // NOME da imagem principal da variante (ou null)
          videoLinks: variantVideoLinks[variantId]?.map(x => x.url) || [],
          attributes: attributesWithPrimaries,
        }
      })

      formPayload.append('variants', JSON.stringify(cleanVariants))
      formPayload.append('relations', JSON.stringify(formData.relations))

      // Anexar arquivos físicos: mainImages
      mainImages.forEach(f => {
        formPayload.append('images', f)
      })
      // Enviar nome da imagem principal do produto
      const primaryMainName =
        primaryMainImageIndex >= 0 && mainImages[primaryMainImageIndex]
          ? mainImages[primaryMainImageIndex].name
          : ''
      formPayload.append('primaryMainImageName', primaryMainName)

      // Anexar arquivos físicos: variantImages
      Object.values(variantFiles).forEach(files =>
        files.forEach(file => formPayload.append('variantImages', file))
      )

      // Anexar arquivos físicos: attributeImages
      Object.values(attributeFiles).forEach(attrs =>
        Object.values(attrs).forEach(files =>
          files.forEach(file => formPayload.append('attributeImages', file))
        )
      )

      const api = setupAPIClientEcommerce()
      await api.post('/product/create', formPayload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      toast.success('Produto cadastrado!')
      resetForm()
    } catch (e: any) {
      console.error(e)
      toast.error(e.response?.data?.error || 'Erro ao cadastrar')
    } finally {
      setLoading(false)
    }
  }

  const [primaryVariantIndexById, setPrimaryVariantIndexById] = useState<
    Record<string, number>
  >({});

  const [primaryAttributeIndexById, setPrimaryAttributeIndexById] = useState<
    Record<string, Record<number, number>>
  >({});

  return (
    <SidebarAndHeader>
      <Section>
        <TitlePage title="ADICIONAR PRODUTO" />

        <Tabs
          variant="bordered"
          color="primary"
          className="my-tabs bg-white rounded-lg shadow-sm"
        >
          <Tab key="info" title="Informações Básicas">
            <BasicProductInfo
              formData={formData}
              onFormDataChange={setFormData}
              promotions={promotions}
              mainImages={mainImages}
              onMainImagesChange={setMainImages}
              primaryIndex={primaryMainImageIndex}
              onSetPrimary={(i: number) => setPrimaryMainImageIndex(i)}
            />
          </Tab>

          <Tab key="descriptions" title="Descrições">
            <ProductDescriptionEditor
              descriptions={formData.productDescriptions}
              onDescriptionsChange={(desc) =>
                setFormData({ ...formData, productDescriptions: desc })
              }
            />
          </Tab>

          <Tab key="categories" title="Categorias">
            <CategorySelector
              categories={categories}
              selectedCategories={formData.categories}
              onSelectionChange={(c) =>
                setFormData({ ...formData, categories: c })
              }
            />
          </Tab>

          <Tab key="seo" title="SEO">
            <SeoProductInfo formData={formData} onFormDataChange={setFormData} />
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
              onVariantsChange={(variants) =>
                setFormData({ ...formData, variants })
              }
              promotions={promotions}
              variantFiles={variantFiles}
              setVariantFiles={setVariantFiles}
              attributeFiles={attributeFiles}
              setAttributeFiles={setAttributeFiles}
              variantVideoLinks={variantVideoLinks}
              onVariantVideoLinksChange={(variantId, links) =>
                setVariantVideoLinks((prev) => ({ ...prev, [variantId]: links }))
              }
              primaryVariantIndexById={primaryVariantIndexById}
              setPrimaryVariantIndexById={setPrimaryVariantIndexById}
              primaryAttributeIndexById={primaryAttributeIndexById}
              setPrimaryAttributeIndexById={setPrimaryAttributeIndexById}
            />
          </Tab>

          <Tab key="relations" title="Relacionamentos">
            <ProductRelations
              relations={formData.relations}
              products={allProducts}
              onRelationsChange={(r) =>
                setFormData({ ...formData, relations: r })
              }
            />
          </Tab>
        </Tabs>

        <style jsx global>{`
        /* Aba ativa: laranja */
        .my-tabs [role="tab"][aria-selected="true"] {
          background: #e09200;
          color: #ffffff;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        /* Aba inativa: texto cinza, hover com fundo cinza-claro */
        .my-tabs [role="tab"]:not([aria-selected="true"]) {
          color: #000000;
        }
        .my-tabs [role="tab"]:not([aria-selected="true"]):hover {
          background: #f3f4f6;
        }
        /* Espaçamento interno da lista de tabs */
        .my-tabs > .nextui-tabs-tablist {
          gap: 0.5rem;
          padding: 0.5rem 1rem;
        }
        /* Padding do painel de conteúdo */
        .my-tabs .nextui-tabs-panel {
          padding: 1rem;
        }
      `}</style>

        <div className="mt-6">
          <Button
            className="text-white bg-green-500"
            onPress={handleSubmit}
            isLoading={loading}
          >
            Cadastrar Produto
          </Button>
        </div>
      </Section>
    </SidebarAndHeader>
  )
}