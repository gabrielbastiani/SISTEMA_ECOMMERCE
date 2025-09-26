'use client'

import { useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import { setupAPIClientEcommerce } from '@/app/services/apiEcommerce'
import { SidebarAndHeader } from '@/app/components/sidebarAndHeader'
import { Section } from '@/app/components/section'
import { TitlePage } from '@/app/components/section/titlePage'
import PromotionStep1Edit, { Step1Values } from '@/app/components/promotions/update/PromotionStep1Edit'
import { usePromotionForm } from '@/hooks/usePromotionForm'
import PromotionStep2Edit from '@/app/components/promotions/update/PromotionStep2Edit'
import PromotionStep3Edit from '@/app/components/promotions/update/PromotionStep3Edit'
import PromotionStep4Edit from '@/app/components/promotions/update/PromotionStep4Edit'
import PromotionStep5Edit from '@/app/components/promotions/update/PromotionStep5Edit'

const API_URL = process.env.NEXT_PUBLIC_API_URL!

export default function UpdatePromotionPage() {
  
  const router = useRouter()
  const { promotion_id } = useParams<{ promotion_id: string }>()
  // apiRef estável
  const apiRef = useRef<any | null>(null)
  if (!apiRef.current) apiRef.current = setupAPIClientEcommerce()

  const { data, setData, loading } = usePromotionForm(promotion_id)
  const [step, setStep] = useState(1)
  const [isSaving, setIsSaving] = useState(false)

  // Skeleton while initial data carga
  if (loading) {
    return (
      <SidebarAndHeader>
        <Section>
          <TitlePage title="ATUALIZAR PROMOÇÃO" />
          <div className="max-w-3xl mx-auto p-6 space-y-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/3" />
              <div className="h-6 bg-gray-200 rounded w-full" />
              <div className="h-48 bg-gray-200 rounded w-full" />
              <div className="grid grid-cols-2 gap-4">
                <div className="h-10 bg-gray-200 rounded" />
                <div className="h-10 bg-gray-200 rounded" />
              </div>
            </div>
          </div>
        </Section>
      </SidebarAndHeader>
    )
  }

  // Handlers wrapper que controlam isSaving e toasts
  const handleSaveStep1 = async (values: Step1Values) => {
    if (isSaving) return
    setIsSaving(true)
    try {
      const api = apiRef.current
      const form = new FormData()
      form.append('name', values.name)
      if (values.description) form.append('description', values.description)

      if (values.startDate) {
        const tzOffsetMs = values.startDate.getTimezoneOffset() * 60000
        const localISO = new Date(values.startDate.getTime() - tzOffsetMs).toISOString().slice(0, 16)
        form.append('startDate', localISO)
      } else {
        form.append('startDate', '')
      }

      if (values.endDate) {
        const tzOffsetMs = values.endDate.getTimezoneOffset() * 60000
        const localISO = new Date(values.endDate.getTime() - tzOffsetMs).toISOString().slice(0, 16)
        form.append('endDate', localISO)
      } else {
        form.append('endDate', '')
      }

      form.append('hasCoupon', String(values.hasCoupon))
      form.append('multipleCoupons', String(values.multipleCoupons))
      form.append('reuseSameCoupon', String(values.reuseSameCoupon))
      form.append('perUserCouponLimit', values.perUserCouponLimit != null ? String(values.perUserCouponLimit) : '')
      form.append('totalCouponCount', values.totalCouponCount != null ? String(values.totalCouponCount) : '')

      values.coupons.forEach(c => form.append('coupons', c))
      if (values.status) form.append('status', values.status)
      form.append('cumulative', String(values.cumulative))
      form.append('priority', String(values.priority))

      await api.put(`/promotions/${promotion_id}`, form)
      setData(d => ({ ...d, ...values }))
      toast.success('Passo 1 salvo com sucesso!')
    } catch (err: any) {
      console.error('Erro ao salvar passo 1', err)
      toast.error('Falha ao salvar Passo 1.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveStep2 = async (conds: any[]) => {
    if (isSaving) return
    setIsSaving(true)
    try {
      const api = apiRef.current
      const form = new FormData()
      form.append('conditions', JSON.stringify(conds))
      await api.put(`/promotions/${promotion_id}`, form)
      setData(d => ({ ...d, conditions: conds }))
      toast.success('Passo 2 salvo!')
    } catch (err: any) {
      console.error('Erro ao salvar passo 2', err)
      toast.error('Falha ao salvar Passo 2.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveStep3 = async (actions: any[]) => {
    if (isSaving) return
    setIsSaving(true)
    try {
      const api = apiRef.current
      const form = new FormData()
      form.append('conditions', JSON.stringify(data.conditions || []))
      form.append('actions', JSON.stringify(actions))
      await api.put(`/promotions/${promotion_id}`, form)
      setData(d => ({ ...d, actions }))
      toast.success('Passo 3 salvo!')
    } catch (err: any) {
      console.error('Erro ao salvar passo 3', err)
      toast.error('Falha ao salvar Passo 3.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveStep4 = async (displays: any[]) => {
    if (isSaving) return
    setIsSaving(true)
    try {
      const api = apiRef.current
      const form = new FormData()
      form.append('displays', JSON.stringify(displays))
      await api.put(`/promotions/${promotion_id}`, form)
      setData(d => ({ ...d, displays }))
      toast.success('Passo 4 salvo com sucesso!')
    } catch (err: any) {
      console.error('Erro ao salvar passo 4', err)
      toast.error('Falha ao salvar Passo 4.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveStep5 = async (badges: any[]) => {
    if (isSaving) return
    setIsSaving(true)
    try {
      const api = apiRef.current
      const form = new FormData()
      form.append('badges', JSON.stringify(badges.map(b => ({ title: b.title, imageUrl: b.imageUrl }))))
      badges.forEach(b => b.file && form.append('badgeFiles', b.file))
      const resp = await api.put(`/promotions/${promotion_id}`, form)
      const updated = resp.data as { badges: { title: string; imageUrl: string }[] }
      setData((d: any) => ({ ...d, badges: updated.badges }))
      toast.success('Passo 5 salvo com sucesso!')
    } catch (err: any) {
      console.error('Erro ao salvar passo 5', err)
      toast.error('Falha ao salvar Passo 5.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleFinish = async () => {
    // só navega/mostra mensagem (já salvo anteriormente) — protege a navegação com overlay
    if (isSaving) return
    setIsSaving(true)
    try {
      // opcional: poderia garantir que o servidor esteja consistente antes de navegar
      toast.success('Promoção atualizada com sucesso!')
      router.push('/promotions/all_promotions')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <SidebarAndHeader>
      <Section>
        <TitlePage title="ATUALIZAR PROMOÇÃO" />
        <div className="max-w-3xl mx-auto p-6 space-y-6 relative">
          {/* overlay de saving */}
          {isSaving && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="w-full max-w-lg p-6 bg-white rounded shadow-lg animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-3" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-6" />
                <div className="h-36 bg-gray-200 rounded" />
                <div className="text-center mt-4 text-gray-700 font-medium">Salvando alterações...</div>
              </div>
            </div>
          )}

          {step === 1 && (
            <PromotionStep1Edit
              initial={{
                name: data.name,
                description: data.description || '',
                startDate: data.startDate ? new Date(data.startDate) : undefined,
                endDate: data.endDate ? new Date(data.endDate) : undefined,
                hasCoupon: data.hasCoupon,
                multipleCoupons: data.multipleCoupons,
                reuseSameCoupon: data.reuseSameCoupon,
                coupons: data.coupons || [],
                perUserCouponLimit: data.perUserCouponLimit,
                totalCouponCount: data.totalCouponCount,
                status: (['Disponivel', 'Indisponivel', 'Programado'] as const).includes(data.status as any)
                  ? data.status as Step1Values['status']
                  : '',
                cumulative: data.cumulative,
                priority: data.priority
              }}
              onSave={handleSaveStep1}
              onNext={() => setStep(2)}
              isSaving={isSaving}
            />
          )}
          {step === 2 && (
            <PromotionStep2Edit
              initialConditions={data.conditions || []}
              onSave={handleSaveStep2}
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
              isSaving={isSaving}
            />
          )}
          {step === 3 && (
            <PromotionStep3Edit
              initialActions={data.actions || []}
              onSave={handleSaveStep3}
              onBack={() => setStep(2)}
              onNext={() => setStep(4)}
              isSaving={isSaving}
            />
          )}
          {step === 4 && (
            <PromotionStep4Edit
              initialDisplays={data.displays || []}
              onSave={handleSaveStep4}
              onBack={() => setStep(3)}
              onNext={() => setStep(5)}
              isSaving={isSaving}
            />
          )}
          {step === 5 && (
            <PromotionStep5Edit
              initialBadges={data.badges.map(b => ({
                title: b.title,
                imageUrl: b.imageUrl,
                previewUrl: `${API_URL}/files/${b.imageUrl}`
              }))}
              onSave={handleSaveStep5}
              onBack={() => setStep(4)}
              onFinish={handleFinish}
              isSaving={isSaving}
            />
          )}
        </div>
      </Section>
    </SidebarAndHeader>
  )
}