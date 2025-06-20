'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { toast } from 'react-toastify'
import { setupAPIClientEcommerce } from '@/app/services/apiEcommerce'
import { SidebarAndHeader } from '@/app/components/sidebarAndHeader'
import { Section } from '@/app/components/section'
import { TitlePage } from '@/app/components/section/titlePage'
import PromotionStep2 from '@/app/components/promotions/PromotionStep2'
import PromotionStep3 from '@/app/components/promotions/PromotionStep3'
import PromotionStep4 from '@/app/components/promotions/PromotionStep4'
import PromotionStep5 from '@/app/components/promotions/PromotionStep5'
import { usePromotionForm } from '@/hooks/usePromotionForm'
import PromotionStep1Edit, { Step1Values } from '@/app/components/promotions/update/PromotionStep1Edit'

export default function UpdatePromotionPage() {

  const { promotion_id } = useParams<{ promotion_id: string }>()
  const api = setupAPIClientEcommerce()

  const {
    data,
    setData,
    loading,
  } = usePromotionForm(promotion_id)

  const [step, setStep] = useState(1)

  const handleSaveStep1 = async (vals: Step1Values) => {
    try {
      const form = new FormData()
      Object.entries(vals).forEach(([k, v]) => {
        if (v != null) form.append(k, String(v))
      })
      // cupons repetido:
      vals.coupons.forEach(c => form.append('coupons', c))
      // NÃO setar headers, axios cuida do multipart boundary
      await api.put(`/promotions/${promotion_id}`, form)
      toast.success('Passo 1 salvo com sucesso!')
      // atualiza estado pai para manter wizard consistente
      setData(d => ({
        ...d,
        name: vals.name,
        description: vals.description,
        startDate: new Date(vals.startDate),
        endDate: new Date(vals.endDate),
        hasCoupon: vals.hasCoupon,
        multipleCoupons: vals.multipleCoupons,
        reuseSameCoupon: vals.reuseSameCoupon,
        perUserCouponLimit: vals.perUserCouponLimit,
        totalCouponCount: vals.totalCouponCount,
        coupons: vals.coupons,
        active: d.active,
        cumulative: d.cumulative,
        priority: vals.priority
      }))
    } catch (err) {
      console.error(err)
      toast.error('Falha ao salvar Passo 1.')
    }
  }

  // quando concluir, envia PUT
  const handleUpdate = async () => {
    try {
      const form = new FormData()

      // campos simples
      form.append('name', data.name)
      if (data.description) form.append('description', data.description)
      form.append('startDate', data.startDate.toISOString())
      form.append('endDate', data.endDate.toISOString())

      form.append('hasCoupon', String(data.hasCoupon))
      form.append('multipleCoupons', String(data.multipleCoupons))
      form.append('reuseSameCoupon', String(data.reuseSameCoupon))
      if (data.perUserCouponLimit != null)
        form.append('perUserCouponLimit', String(data.perUserCouponLimit))
      if (data.totalCouponCount != null) {
        form.append(
          'totalCouponCount',
          data.totalCouponCount.toString()
        )
      }

      // cupons
      (data.coupons || [])
        .map((c: string) => c.trim())
        .filter((c: string | any[]) => c.length > 0)
        .forEach((c: string | Blob) => form.append('coupons', c))

      form.append('active', String(data.active))
      form.append('cumulative', String(data.cumulative))
      form.append('priority', String(data.priority))

      // relacionamentos JSON
      form.append('conditions', JSON.stringify(data.conditions))
      form.append('actions', JSON.stringify(data.actions))
      form.append('displays', JSON.stringify(data.displays))

      // badges — serializa ids e titles e depois anexa arquivos novos
      // badgeInputs = [{ id?, title, file? }]
      const badgeMeta = data.badges.map(b => ({
        id: b.id,
        title: b.title
      }))
      form.append('badges', JSON.stringify(badgeMeta))
      data.badges.forEach(b => {
        if (b.file) {
          form.append('badgeFiles', b.file)
        }
      })

      await api.put(`/promotions/${promotion_id}`, form)

      toast.success('Promoção atualizada com sucesso!')

    } catch (err) {
      console.error(err)
      toast.error('Erro ao atualizar promoção.')
    }
  }

  if (loading) {
    return (
      <SidebarAndHeader>
        <section className="text-center py-20">Carregando...</section>
      </SidebarAndHeader>
    )
  }

  return (
    <SidebarAndHeader>
      <Section>
        <TitlePage title="ATUALIZAR PROMOÇÃO" />
        <div className="max-w-3xl mx-auto p-6 space-y-6">
          {step === 1 && (
            <PromotionStep1Edit
              initialValues={{
                name: data.name,
                description: data.description || '',
                startDate: data.startDate.toISOString().slice(0, 16),
                endDate: data.endDate.toISOString().slice(0, 16),
                hasCoupon: data.hasCoupon,
                multipleCoupons: data.multipleCoupons,
                reuseSameCoupon: data.reuseSameCoupon,
                perUserCouponLimit: data.perUserCouponLimit,
                totalCouponCount: data.totalCouponCount,
                coupons: data.coupons || [],
                active: data.active,
                cumulative: data.cumulative,
                priority: data.priority
              }}
              onSaveStep1={handleSaveStep1}
              onNext={() => setStep(2)}
            />
          )}
          {step === 2 && (
            <PromotionStep2
              data={data}
              setData={setData}
              onNext={() => setStep(3)}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && (
            <PromotionStep3
              data={data}
              setData={setData}
              onNext={() => setStep(4)}
              onBack={() => setStep(2)}
            />
          )}
          {step === 4 && (
            <PromotionStep4
              data={data}
              setData={setData}
              onNext={() => setStep(5)}
              onBack={() => setStep(3)}
            />
          )}
          {step === 5 && (
            <PromotionStep5
              data={data}
              setData={setData}
              onBack={() => setStep(4)}
              onFinish={handleUpdate}
            />
          )}
        </div>
      </Section>
    </SidebarAndHeader>
  )
}