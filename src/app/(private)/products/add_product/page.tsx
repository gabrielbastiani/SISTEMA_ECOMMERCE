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
import { BasicProductInfo, BuyTogetherOption } from '@/app/components/add_product/BasicProductInfo'
import { ProductDescriptionEditor } from '@/app/components/add_product/ProductDescriptionEditor'
import { CategorySelector } from '@/app/components/add_product/CategorySelector'
import { VariantManager } from '@/app/components/add_product/VariantManager'
import { ProductRelations } from '@/app/components/add_product/ProductRelations'
import { VideoLinksManager } from '@/app/components/add_product/VideoLinksManager'
import { SeoProductInfo } from '@/app/components/add_product/SeoProductInfo'
import { CharacteristicManager } from '@/app/components/add_product/CharacteristicManager'

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
  const [buyTogetherOptions, setBuyTogetherOptions] = useState<BuyTogetherOption[]>([])
  const [loading, setLoading] = useState(false)
  const [characteristicFiles, setCharacteristicFiles] = useState<File[]>([])

  useEffect(() => {
    const api = setupAPIClientEcommerce()
    api.get('/promotions/get').then(r => setPromotions(r.data.allow_promotions)).catch(console.error)
    api.get('/category/cms').then(r => setCategories(r.data.all_categories_disponivel)).catch(console.error)
    api.get('/get/products').then(r => setAllProducts(r.data.allow_products)).catch(console.error)
    api.get('/buy_together').then(r => setBuyTogetherOptions(r.data as BuyTogetherOption[])).catch(() => toast.error('Não foi possível carregar grupos Compre Junto.'))
  }, [])

  const resetForm = () => {
    setFormData(initialFormData)
    setProductVideoLinks([])
    setVariantVideoLinks({})
    setMainImages([])
    setPrimaryMainImageIndex(-1)
    setVariantFiles({})
    setAttributeFiles({})
    setCharacteristicFiles([])
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const formPayload = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        if (value === undefined || value === null) return
        if (key === 'variants' || key === 'relations' || key === 'videoLinks' || key === 'characteristics') return
        if (Array.isArray(value) || typeof value === 'object') {
          formPayload.append(key, JSON.stringify(value))
        } else {
          formPayload.append(key, String(value))
        }
      })

      formPayload.append('userEcommerce_id', user?.id || '')
      const videoLinksToSend = productVideoLinks.map(v => v.url)
      formPayload.append('videoLinks', JSON.stringify(videoLinksToSend))

      // Variantes
      const cleanVariants = formData.variants.map(v => {
        const variantId = v.id
        const uploadedVariantFiles = variantFiles[variantId] || []
        const indexPrimaryVariant = primaryVariantIndexById[variantId] ?? -1
        const primaryVariantImageName =
          indexPrimaryVariant >= 0 && uploadedVariantFiles[indexPrimaryVariant]
            ? uploadedVariantFiles[indexPrimaryVariant].name
            : null

        const attributesWithPrimaries = v.attributes.map((attr, idx) => {
          const uploadedAttrFiles = attributeFiles[variantId]?.[idx] || []
          const indexPrimaryAttr = primaryAttributeIndexById[variantId]?.[idx] ?? -1
          const primaryAttributeImageName =
            indexPrimaryAttr >= 0 && uploadedAttrFiles[indexPrimaryAttr]
              ? uploadedAttrFiles[indexPrimaryAttr].name
              : null

          return {
            key: attr.key,
            value: attr.value,
            images: uploadedAttrFiles.map(f => f.name),
            primaryAttributeImageName,
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
          primaryImageName: primaryVariantImageName,
          videoLinks: variantVideoLinks[variantId]?.map(x => x.url) || [],
          attributes: attributesWithPrimaries,
        }
      })

      formPayload.append('variants', JSON.stringify(cleanVariants))
      formPayload.append('relations', JSON.stringify(formData.relations))
      const rawCharacteristics = (formData as any).characteristics ?? []
      const normalizedChars = Array.isArray(rawCharacteristics) ? rawCharacteristics : [rawCharacteristics]

      const validCharacteristics = normalizedChars
        .filter((c: any) => c?.key && c?.value)
        .map((c: any) => {
          const correspondingFile = characteristicFiles.find(file =>
            file.name === c.imageName
          )

          return {
            key: String(c.key).trim(),
            value: String(c.value).trim(),
            imageName: correspondingFile ? correspondingFile.name : (c.imageName || null)
          }
        })

      formPayload.append('characteristics', JSON.stringify(validCharacteristics))

      mainImages.forEach(file => {
        formPayload.append('images', file, file.name)
      })

      // Imagem principal
      const primaryMainName = primaryMainImageIndex >= 0 && mainImages[primaryMainImageIndex]
        ? mainImages[primaryMainImageIndex].name
        : ''
      formPayload.append('primaryMainImageName', primaryMainName)

      // Anexar arquivos de variantes
      Object.values(variantFiles).forEach((files: File[]) => {
        files.forEach(file => {
          formPayload.append('variantImages', file, file.name)
        })
      })

      // Anexar arquivos de atributos
      Object.values(attributeFiles).forEach((attrMap: Record<number, File[]>) => {
        Object.values(attrMap).forEach((files: File[]) => {
          files.forEach(file => {
            formPayload.append('attributeImages', file, file.name)
          })
        })
      })

      characteristicFiles.forEach(file => {
        formPayload.append('characteristicImages', file, file.name)
      })

      const api = setupAPIClientEcommerce()
      await api.post('/product/create', formPayload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000
      })

      toast.success('Produto cadastrado!')
      resetForm()
    } catch (e: any) {
      console.error('Error creating product:', e)
      toast.error(e.response?.data?.error || 'Erro ao cadastrar')
    } finally {
      setLoading(false)
    }
  }

  const [primaryVariantIndexById, setPrimaryVariantIndexById] = useState<Record<string, number>>({})
  const [primaryAttributeIndexById, setPrimaryAttributeIndexById] = useState<Record<string, Record<number, number>>>({})

  const onCharacteristicsChange = (chars: any[]) => {
    const files: File[] = chars
      .map(c => c.file)
      .filter((file): file is File => file instanceof File && file.name !== undefined)

    setCharacteristicFiles(files)

    const characteristicsForFormData = chars.map(c => ({
      key: c.key,
      value: c.value,
      imageName: c.file instanceof File ? c.file.name : (c.imageName || null)
    }))

    setFormData(prev => ({
      ...prev,
      characteristics: characteristicsForFormData
    }))
  }

  return (
    <SidebarAndHeader>
      <Section>
        <TitlePage title="ADICIONAR PRODUTO" />

        <Tabs
          variant="bordered"
          color="primary"
          className="my-tabs bg-white rounded-lg shadow-sm"
        >
          {/* ... resto do código das tabs permanece igual ... */}
          <Tab key="info" title="Informações Básicas">
            <BasicProductInfo
              formData={formData}
              onFormDataChange={setFormData}
              promotions={promotions}
              mainImages={mainImages}
              onMainImagesChange={setMainImages}
              primaryIndex={primaryMainImageIndex}
              onSetPrimary={(i: number) => setPrimaryMainImageIndex(i)}
              buyTogetherOptions={buyTogetherOptions}
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

          <Tab key="characteristics" title="Caracteristicas">
            <CharacteristicManager
              characteristics={(formData as any).characteristics ?? []}
              onChange={onCharacteristicsChange}
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
          .my-tabs [role="tab"][aria-selected="true"] {
            background: #e09200;
            color: #ffffff;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .my-tabs [role="tab"]:not([aria-selected="true"]) {
            color: #000000;
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