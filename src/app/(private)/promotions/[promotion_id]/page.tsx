'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import { setupAPIClientEcommerce } from '@/app/services/apiEcommerce'
import { SidebarAndHeader } from '@/app/components/sidebarAndHeader'
import { Section } from '@/app/components/section'
import { TitlePage } from '@/app/components/section/titlePage'
import PromotionStep1Edit from '@/app/components/promotions/update/PromotionStep1Edit'
import { usePromotionForm } from '@/hooks/usePromotionForm'
import PromotionStep2Edit from '@/app/components/promotions/update/PromotionStep2Edit'
import PromotionStep3Edit from '@/app/components/promotions/update/PromotionStep3Edit'
import PromotionStep4Edit from '@/app/components/promotions/update/PromotionStep4Edit'
import PromotionStep5Edit, { BadgeWithFile } from '@/app/components/promotions/update/PromotionStep5Edit'

const API_URL = process.env.NEXT_PUBLIC_API_URL!

export default function UpdatePromotionPage() {

  const router = useRouter();

  const { promotion_id } = useParams<{ promotion_id: string }>()
  const api = setupAPIClientEcommerce()
  const { data, setData, loading } = usePromotionForm(promotion_id)
  const [step, setStep] = useState(1)

  if (loading) {
    return (
      <SidebarAndHeader>
        <section className="text-center py-20">Carregando…</section>
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
              initial={{
                name: data.name,
                description: data.description || '',
                startDate: data.startDate,
                endDate: data.endDate,
                hasCoupon: data.hasCoupon,
                multipleCoupons: data.multipleCoupons,
                reuseSameCoupon: data.reuseSameCoupon,
                coupons: data.coupons || [],
                perUserCouponLimit: data.perUserCouponLimit,
                totalCouponCount: data.totalCouponCount,
                active: data.active,
                cumulative: data.cumulative,
                priority: data.priority
              }}
              onSave={async values => {
                const form = new FormData()
                form.append('name', values.name)
                if (values.description) form.append('description', values.description)
                form.append('startDate', values.startDate.toISOString())
                form.append('endDate', values.endDate.toISOString())
                form.append('hasCoupon', String(values.hasCoupon))
                form.append('multipleCoupons', String(values.multipleCoupons))
                form.append('reuseSameCoupon', String(values.reuseSameCoupon))
                if (values.perUserCouponLimit != null)
                  form.append('perUserCouponLimit', String(values.perUserCouponLimit))
                if (values.totalCouponCount != null)
                  form.append('totalCouponCount', String(values.totalCouponCount))
                values.coupons.forEach(c => form.append('coupons', c))
                form.append('active', String(values.active))
                form.append('cumulative', String(values.cumulative))
                form.append('priority', String(values.priority))

                await api.put(`/promotions/${promotion_id}`, form)
                setData(d => ({
                  ...d,
                  ...values
                }))
                toast.success('Passo 1 salvo com sucesso!')
              }}
              onNext={() => setStep(2)}
            />
          )}
          {step === 2 && (
            <PromotionStep2Edit
              initialConditions={data.conditions || []}
              onSave={async conds => {
                const form = new FormData()
                form.append('conditions', JSON.stringify(conds))
                await api.put(`/promotions/${promotion_id}`, form)
                setData(d => ({ ...d, conditions: conds }))
                toast.success('Passo 2 salvo!')
              }}
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
            />
          )}
          {step === 3 && (
            <PromotionStep3Edit
              initialActions={data.actions || []}
              onSave={async actions => {
                const form = new FormData()
                form.append('conditions', JSON.stringify(data.conditions))
                form.append('actions', JSON.stringify(actions))
                await api.put(`/promotions/${promotion_id}`, form)
                toast.success('Passo 3 salvo!')
                setData(d => ({ ...d, actions }))
              }}
              onBack={() => setStep(2)}
              onNext={() => setStep(4)}
            />
          )}
          {step === 4 && (
            <PromotionStep4Edit
              initialDisplays={data.displays || []}
              onSave={async (displays) => {
                const form = new FormData()
                form.append('displays', JSON.stringify(displays))
                await api.put(`/promotions/${promotion_id}`, form)
                toast.success('Passo 4 salvo com sucesso!')
                setData(d => ({ ...d, displays }))
              }}
              onBack={() => setStep(3)}
              onNext={() => setStep(5)}
            />
          )}
          {step === 5 && (
            <PromotionStep5Edit
              initialBadges={data.badges.map(b => ({
                title: b.title,
                imageUrl: b.imageUrl,
                previewUrl: `${API_URL}/files/${b.imageUrl}`
              }))}
              onSave={async badges => {
                // 1) Prepara FormData
                const form = new FormData()
                form.append('badges', JSON.stringify(
                  badges.map(b => ({ title: b.title, imageUrl: b.imageUrl }))
                ))
                badges.forEach(b => b.file && form.append('badgeFiles', b.file))

                // 2) Chama API e recebe o objeto completo atualizado
                const resp = await api.put(`/promotions/${promotion_id}`, form)
                const updated = resp.data as { badges: { title: string; imageUrl: string }[] }

                // 3) Atualiza apenas o estado global de data.badges
                setData((d: any) => ({ ...d, badges: updated.badges }))

                toast.success('Passo 5 salvo com sucesso!')
              }}
              onBack={() => setStep(4)}
              onFinish={() => {
                toast.success('Promoção atualizada com sucesso!')
                router.push('/promotions/all_promotions')
              }}
            />
          )}
        </div>
      </Section>
    </SidebarAndHeader>
  )
}