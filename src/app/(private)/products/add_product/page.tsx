"use client"

import { setupAPIClientEcommerce } from '@/app/services/apiEcommerce';
import { Section } from "@/app/components/section"
import { TitlePage } from "@/app/components/section/titlePage"
import { SidebarAndHeader } from "@/app/components/sidebarAndHeader"
import { useState, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { Accordion, AccordionItem, Button, Input, Select, SelectItem, Textarea } from '@nextui-org/react'
import {
  PlusIcon,
  TrashIcon,
  ArrowUpTrayIcon as UploadIcon
} from '@heroicons/react/24/outline'
import { Category } from 'Types/types';
import { Editor } from "@tinymce/tinymce-react";

const TOKEN_TINY = process.env.NEXT_PUBLIC_TINYMCE_API_KEY;

interface ProductFormData {
  name: string
  slug?: string
  price_per: string
  price_of?: string
  metaTitle?: string
  metaDescription?: string
  keywords?: string
  brand?: string
  ean?: string
  skuMaster?: string
  weight?: string
  length?: string
  width?: string
  height?: string
  status?: 'DISPONIVEL' | 'INDISPONIVEL'
  categories: string[]
  description: string[]
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
    status?: 'DISPONIVEL' | 'INDISPONIVEL'
  }>
}

export default function Add_product() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    price_per: '',
    categories: [],
    images: [],
    variants: [],
    productDescriptions: [],
    description: []
  })

  // Carregar categorias
  useEffect(() => {
    const loadCategories = async () => {
      const apiClient = setupAPIClientEcommerce();
      const res = await apiClient.get('/category/cms');
      setCategories(res.data.all_categories_disponivel);
    }
    loadCategories()
  }, [])

  // Upload de imagens principal
  const { getRootProps: getMainImagesRootProps, getInputProps: getMainImagesInputProps } = useDropzone({
    accept: { 'image/*': [] },
    onDrop: (acceptedFiles) => {
      setFormData(prev => ({ ...prev, images: [...prev.images, ...acceptedFiles] }))
    }
  })

  // Submit do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    const apiClient = setupAPIClientEcommerce();
    e.preventDefault()
    setLoading(true)
  
    try {
      const formPayload = new FormData();
  
      // 1. Construir o objeto de dados corretamente
      const productData = {
        name: formData.name,
        description: formData.description,
        slug: formData.slug,
        price_per: Number(formData.price_per),
        price_of: formData.price_of ? Number(formData.price_of) : undefined,
        metaTitle: formData.metaTitle,
        metaDescription: formData.metaDescription,
        keywords: formData.keywords,
        brand: formData.brand,
        ean: formData.ean,
        skuMaster: formData.skuMaster,
        weight: formData.weight ? Number(formData.weight) : undefined,
        length: formData.length ? Number(formData.length) : undefined,
        width: formData.width ? Number(formData.width) : undefined,
        height: formData.height ? Number(formData.height) : undefined,
        status: formData.status || 'DISPONIVEL',
        categories: formData.categories,
        productDescriptions: formData.productDescriptions,
        productRelations: [],
        videos: []
      };
  
      // 2. Adicionar dados principais como JSON
      formPayload.append('data', JSON.stringify(productData));
  
      // 3. Adicionar imagens principais
      formData.images.forEach((file) => {
        formPayload.append('images', file);
      });
  
      // 4. Adicionar variantes corretamente
      formData.variants.forEach((variant, index) => {
        const variantData = {
          ...variant,
          price_per: Number(variant.price_per),
          price_of: variant.price_of ? Number(variant.price_of) : undefined,
          stock: variant.stock ? Number(variant.stock) : 0,
          sortOrder: variant.sortOrder ? Number(variant.sortOrder) : 0
        };
        
        formPayload.append(`variants[${index}]`, JSON.stringify(variantData));
        
        // Adicionar imagens da variante
        variant.images.forEach((file) => {
          formPayload.append(`variants[${index}].images`, file);
        });
      });

      console.log(productData)
  
      await apiClient.post('/create/product', formPayload);
  
      // ... resto do código
    } catch (error) {
      console.error('Erro:', error)
      // Adicionar feedback para o usuário
      alert('Erro ao cadastrar produto! Verifique os dados e tente novamente.');
    } finally {
      setLoading(false)
    }
  }

  // Manipuladores de campos
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
        description: '',
        status: 'DISPONIVEL'
      }]
    }))
  }

  return (
    <SidebarAndHeader>
      <Section>
        <TitlePage title="ADICIONAR PRODUTO" />

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seção de Informações Básicas */}
          <div className="bg-white p-6 rounded-lg shadow-sm border-2 border-black">
            <h3 className="text-lg font-semibold mb-4 text-black">Informações Básicas</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-2 text-black">
              <Input
                placeholder="Nome do Produto"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />

              <Input
                placeholder="Slug (opcional)"
                value={formData.slug || ''}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              />

              <Input
                placeholder="SKU Mestre"
                value={formData.skuMaster || ''}
                onChange={(e) => setFormData({ ...formData, skuMaster: e.target.value })}
              />

              <Select
                placeholder="Status do Produto"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              >
                <SelectItem className='text-black bg-white' key="DISPONIVEL" value="DISPONIVEL">Disponível</SelectItem>
                <SelectItem className='text-black bg-white' key="INDISPONIVEL" value="INDISPONIVEL">Indisponível</SelectItem>
              </Select>

              <Input
                type="number"
                placeholder="Preço de Venda"
                value={formData.price_per.toString()}
                onChange={(e) => setFormData({ ...formData, price_per: e.target.value })}
                required
              />

              <Input
                type="number"
                placeholder="Preço Original (opcional)"
                value={formData.price_of || ''}
                onChange={(e) => setFormData({ ...formData, price_of: e.target.value })}
              />
            </div>
          </div>

          {/* Seção de Detalhes do Produto */}
          <div className="bg-white p-6 rounded-lg shadow-sm border-2 border-black text-black">
            <h3 className="text-lg font-semibold mb-4">Detalhes do Produto</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Marca"
                value={formData.brand || ''}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              />

              <Input
                placeholder="EAN"
                value={formData.ean || ''}
                onChange={(e) => setFormData({ ...formData, ean: e.target.value })}
              />

              <Input
                type="number"
                placeholder="Peso (kg)"
                value={formData.weight || ''}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              />

              <Input
                type="number"
                placeholder="Comprimento (cm)"
                value={formData.length || ''}
                onChange={(e) => setFormData({ ...formData, length: e.target.value })}
              />

              <Input
                type="number"
                placeholder="Largura (cm)"
                value={formData.width || ''}
                onChange={(e) => setFormData({ ...formData, width: e.target.value })}
              />

              <Input
                type="number"
                placeholder="Altura (cm)"
                value={formData.height || ''}
                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
              />
            </div>
          </div>

          {/* Seção de Descrições */}
          <div className="bg-white p-6 rounded-lg shadow-sm border-2 border-black text-black">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Descrições Detalhadas</h3>
              <Button onClick={addDescription} startContent={<PlusIcon />} size="sm">
                Adicionar Descrição
              </Button>
            </div>

            {formData.productDescriptions.map((desc, index) => (
              <div key={index} className="mb-6 p-4 border rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">Descrição {index + 1}</h4>
                  <Button
                    size="sm"
                    isIconOnly
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      productDescriptions: prev.productDescriptions.filter((_, i) => i !== index)
                    }))}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </div>

                <Input
                  placeholder="Título"
                  value={desc.title}
                  onChange={(e) => {
                    const newDescriptions = [...formData.productDescriptions]
                    newDescriptions[index].title = e.target.value
                    setFormData({ ...formData, productDescriptions: newDescriptions })
                  }}
                  className="mb-4"
                />

                <Editor
                  apiKey={TOKEN_TINY}
                  value={desc.description}
                  onEditorChange={(content) => {
                    const newDescriptions = [...formData.productDescriptions]
                    newDescriptions[index].description = content
                    setFormData({ ...formData, productDescriptions: newDescriptions })
                  }}
                  init={{
                    height: 300,
                    menubar: true,
                    plugins: [
                      'advlist autolink lists link image charmap print preview anchor',
                      'searchreplace visualblocks code fullscreen',
                      'insertdatetime media table paste code help wordcount'
                    ],
                    toolbar: 'undo redo | formatselect | ' +
                      'bold italic backcolor | alignleft aligncenter ' +
                      'alignright alignjustify | bullist numlist outdent indent | ' +
                      'removeformat | help',
                    content_style: 'body { font-family: Arial, sans-serif; font-size:14px }'
                  }}
                />
              </div>
            ))}
          </div>

          {/* Seção de SEO */}
          <div className="bg-white p-6 rounded-lg shadow-sm border-2 border-black text-black">
            <h3 className="text-lg font-semibold mb-4">SEO</h3>

            <div className="grid grid-cols-1 gap-4">
              <Input
                placeholder="Meta Título"
                value={formData.metaTitle || ''}
                onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
              />

              <Textarea
                placeholder="Meta Descrição"
                value={formData.metaDescription || ''}
                onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
              />

              <Input
                placeholder="Palavras-chave (separadas por vírgula)"
                value={formData.keywords || ''}
                onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
              />
            </div>
          </div>

          {/* Seção de Imagens */}
          <div className="bg-white p-6 rounded-lg shadow-sm text-black border-black border-2">
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
          <div className="bg-white p-6 rounded-lg shadow-sm text-black border-black border-2">
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
                      setFormData({ ...formData, categories: newCategories })
                    }}
                    className="form-checkbox h-4 w-4 text-indigo-600"
                  />
                  <span>{category.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Seção de Variantes */}
          <div className="bg-white p-6 rounded-lg shadow-sm text-black border-black border-2">
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
              className="w-full md:w-auto bg-green-500"
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
    accept: { 'image/*': [] },
    onDrop: (acceptedFiles) => {
      const newVariants = [...formData.variants]
      newVariants[index].images = [...newVariants[index].images, ...acceptedFiles]
      setFormData({ ...formData, variants: newVariants })
    }
  })

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-black border-black border-2">
        <Input
          placeholder="SKU"
          value={variant.sku}
          onChange={(e) => {
            const newVariants = [...formData.variants]
            newVariants[index].sku = e.target.value
            setFormData({ ...formData, variants: newVariants })
          }}
          required
        />

        <Input
          type="number"
          placeholder="Preço da Variante"
          value={variant.price_per.toString()}
          onChange={(e) => {
            const newVariants = [...formData.variants]
            newVariants[index].price_per = e.target.value
            setFormData({ ...formData, variants: newVariants })
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
                setFormData({ ...formData, variants: newVariants })
              }}
            />
            <Input
              placeholder="Valor (ex: azul)"
              value={attr.value}
              onChange={(e) => {
                const newVariants = [...formData.variants]
                newVariants[index].variantAttributes[attrIndex].value = e.target.value
                setFormData({ ...formData, variants: newVariants })
              }}
            />
            <Button
              size="sm"
              isIconOnly
              onClick={() => {
                const newVariants = [...formData.variants]
                newVariants[index].variantAttributes.splice(attrIndex, 1)
                setFormData({ ...formData, variants: newVariants })
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
            setFormData({ ...formData, variants: newVariants })
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
                  setFormData({ ...formData, variants: newVariants })
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