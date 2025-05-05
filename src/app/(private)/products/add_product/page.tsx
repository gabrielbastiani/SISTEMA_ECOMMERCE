"use client"

import { setupAPIClientEcommerce } from '@/app/services/apiEcommerce';
import { Section } from "@/app/components/section"
import { TitlePage } from "@/app/components/section/titlePage"
import { SidebarAndHeader } from "@/app/components/sidebarAndHeader"
import { useState, useEffect, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Category, ProductVariant } from '@/types'
import { Accordion, AccordionItem, Button, Input, Textarea } from '@nextui-org/react'
import { PlusIcon, TrashIcon, ArrowUpTrayIcon as UploadIcon } from '@heroicons/react/24/outline'

interface ProductFormData {
  name: string
  description: string
  price_per: string
  slug?: string
  metaTitle?: string
  metaDescription?: string
  keywords?: string
  brand?: string
  ean?: string
  price_of?: string
  weight?: string
  length?: string
  width?: string
  height?: string
  mainPromotionId?: string
  categories: string[]
  images: File[]
  variants: Array<{
    sku: string
    price_of?: string
    price_per: string
    stock?: string
    allowBackorders?: boolean
    sortOrder?: string
    ean?: string
    mainPromotionId?: string
    variantAttributes: Array<{
      key: string
      value: string
    }>
    images: File[]
  }>
  productDescriptions: Array<{
    title: string
    description: string
  }>
}

export default function Add_product() {

  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price_per: '',
    categories: [],
    images: [],
    variants: [],
    productDescriptions: []
  })

  // Carregar categorias
  useEffect(() => {
    const loadCategories = async () => {
      const apiClient = setupAPIClientEcommerce();
      const res = await apiClient.get('/category/cms');
      const data = await res.json()
      setCategories(data)
    }
    loadCategories()
  }, [])

  // Upload de imagens principal
  const { getRootProps: getMainImagesRootProps, getInputProps: getMainImagesInputProps } = useDropzone({
    accept: {'image/*': []},
    onDrop: (acceptedFiles) => {
      setFormData(prev => ({...prev, images: [...prev.images, ...acceptedFiles]}))
    }
  })

  // Submit do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const formPayload = new FormData()
      
      // Dados básicos
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'images' || key === 'variants') return
        if (value !== undefined) formPayload.append(key, JSON.stringify(value))
      })

      // Imagens principais
      formData.images.forEach((file, index) => {
        formPayload.append(`images`, file)
      })

      // Variantes
      formData.variants.forEach((variant, index) => {
        formPayload.append(`variants[${index}]`, JSON.stringify(variant))
        variant.images.forEach((file, fileIndex) => {
          formPayload.append(`variants[${index}].images`, file)
        })
      })

      const response = await fetch('/api/products', {
        method: 'POST',
        body: formPayload
      })

      if (!response.ok) throw new Error('Erro ao cadastrar produto')
      
      // Reset form após sucesso
      setFormData({
        name: '',
        description: '',
        price_per: '',
        categories: [],
        images: [],
        variants: [],
        productDescriptions: []
      })

    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setLoading(false)
    }
  }

  // Manipuladores de campos dinâmicos
  const addVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, {
        sku: '',
        price_per: '',
        variantAttributes: [],
        images: []
      }]
    }))
  }

  const addDescription = () => {
    setFormData(prev => ({
      ...prev,
      productDescriptions: [...prev.productDescriptions, {
        title: '',
        description: ''
      }]
    }))
  }

  return (
    <SidebarAndHeader>
      <Section>
        <TitlePage title="ADICIONAR PRODUTO" />
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seção de Informações Básicas */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Informações Básicas</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nome do Produto"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
              
              <Input
                label="Slug (opcional)"
                value={formData.slug || ''}
                onChange={(e) => setFormData({...formData, slug: e.target.value})}
              />
              
              <Textarea
                label="Descrição"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                required
              />
            </div>
          </div>

          {/* Seção de Preços */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Preços</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="number"
                label="Preço de Venda"
                value={formData.price_per}
                onChange={(e) => setFormData({...formData, price_per: e.target.value})}
                required
              />
              
              <Input
                type="number"
                label="Preço Original (opcional)"
                value={formData.price_of || ''}
                onChange={(e) => setFormData({...formData, price_of: e.target.value})}
              />
            </div>
          </div>

          {/* Seção de Imagens */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Imagens do Produto</h3>
            
            <div {...getMainImagesRootProps()} className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer">
              <input {...getMainImagesInputProps()} />
              <UploadIcon className="w-8 h-8 mx-auto text-gray-400" />
              <p className="mt-2">Arraste imagens ou clique para selecionar</p>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mt-4">
              {formData.images.map((file, index) => (
                <div key={index} className="relative group">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      images: prev.images.filter((_, i) => i !== index)
                    }))}
                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Seção de Categorias */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Categorias</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {categories.map(category => (
                <label key={category.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.categories.includes(category.id)}
                    onChange={(e) => {
                      const newCategories = e.target.checked
                        ? [...formData.categories, category.id]
                        : formData.categories.filter(id => id !== category.id)
                      setFormData({...formData, categories: newCategories})
                    }}
                    className="form-checkbox h-4 w-4 text-indigo-600"
                  />
                  <span>{category.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Seção de Variantes */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Variantes</h3>
              <Button onClick={addVariant} startContent={<PlusIcon />} size="sm">
                Adicionar Variante
              </Button>
            </div>

            <Accordion selectionMode="multiple">
              {formData.variants.map((variant, index) => (
                <AccordionItem key={index} title={`Variante ${index + 1}`}>
                  <VariantForm
                    variant={variant}
                    index={index}
                    formData={formData}
                    setFormData={setFormData}
                  />
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Botão de Submit */}
          <div className="flex justify-end">
            <Button
              type="submit"
              color="primary"
              isLoading={loading}
              className="w-full md:w-auto"
            >
              {loading ? 'Salvando...' : 'Cadastrar Produto'}
            </Button>
          </div>
        </form>
      </Section>
    </SidebarAndHeader>
  )
}

// Componente de Formulário para Variantes
const VariantForm = ({ variant, index, formData, setFormData }: {
  variant: ProductFormData['variants'][0]
  index: number
  formData: ProductFormData
  setFormData: React.Dispatch<React.SetStateAction<ProductFormData>>
}) => {
  const { getRootProps: getVariantImagesRootProps, getInputProps: getVariantImagesInputProps } = useDropzone({
    accept: {'image/*': []},
    onDrop: (acceptedFiles) => {
      const newVariants = [...formData.variants]
      newVariants[index].images = [...newVariants[index].images, ...acceptedFiles]
      setFormData({...formData, variants: newVariants})
    }
  })

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="SKU"
          value={variant.sku}
          onChange={(e) => {
            const newVariants = [...formData.variants]
            newVariants[index].sku = e.target.value
            setFormData({...formData, variants: newVariants})
          }}
          required
        />
        
        <Input
          type="number"
          label="Preço da Variante"
          value={variant.price_per}
          onChange={(e) => {
            const newVariants = [...formData.variants]
            newVariants[index].price_per = e.target.value
            setFormData({...formData, variants: newVariants})
          }}
          required
        />
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">Atributos da Variante</h4>
        {variant.variantAttributes.map((attr, attrIndex) => (
          <div key={attrIndex} className="flex gap-2 mb-2">
            <Input
              placeholder="Chave (ex: cor)"
              value={attr.key}
              onChange={(e) => {
                const newVariants = [...formData.variants]
                newVariants[index].variantAttributes[attrIndex].key = e.target.value
                setFormData({...formData, variants: newVariants})
              }}
            />
            <Input
              placeholder="Valor (ex: azul)"
              value={attr.value}
              onChange={(e) => {
                const newVariants = [...formData.variants]
                newVariants[index].variantAttributes[attrIndex].value = e.target.value
                setFormData({...formData, variants: newVariants})
              }}
            />
            <Button
              size="sm"
              isIconOnly
              onClick={() => {
                const newVariants = [...formData.variants]
                newVariants[index].variantAttributes.splice(attrIndex, 1)
                setFormData({...formData, variants: newVariants})
              }}
            >
              <TrashIcon className="w-4 h-4" />
            </Button>
          </div>
        ))}
        <Button
          onClick={() => {
            const newVariants = [...formData.variants]
            newVariants[index].variantAttributes.push({ key: '', value: '' })
            setFormData({...formData, variants: newVariants})
          }}
          startContent={<PlusIcon />}
          size="sm"
          className="mt-2"
        >
          Adicionar Atributo
        </Button>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">Imagens da Variante</h4>
        <div {...getVariantImagesRootProps()} className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer">
          <input {...getVariantImagesInputProps()} />
          <UploadIcon className="w-6 h-6 mx-auto text-gray-400" />
          <p className="text-sm mt-1">Arraste imagens ou clique para selecionar</p>
        </div>
        
        <div className="grid grid-cols-3 gap-2 mt-4">
          {variant.images.map((file, fileIndex) => (
            <div key={fileIndex} className="relative group">
              <img
                src={URL.createObjectURL(file)}
                alt={file.name}
                className="w-full h-24 object-cover rounded"
              />
              <button
                type="button"
                onClick={() => {
                  const newVariants = [...formData.variants]
                  newVariants[index].images.splice(fileIndex, 1)
                  setFormData({...formData, variants: newVariants})
                }}
                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <TrashIcon className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}