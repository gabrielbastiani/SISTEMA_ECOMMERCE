'use client'

import { useState } from 'react'
import { toast } from 'react-toastify'
import { SidebarAndHeader } from '@/app/components/sidebarAndHeader'
import { Section } from '@/app/components/section'
import { TitlePage } from '@/app/components/section/titlePage'
import PromotionStep1 from '@/app/components/promotions/PromotionStep1'
import PromotionStep2 from '@/app/components/promotions/PromotionStep2'
import PromotionStep3 from '@/app/components/promotions/PromotionStep3'
import PromotionStep4 from '@/app/components/promotions/PromotionStep4'
import PromotionStep5 from '@/app/components/promotions/PromotionStep5'
import { setupAPIClientEcommerce } from '@/app/services/apiEcommerce'
import { PromotionWizardDto } from 'Types/types'

export default function AddPromotion() {
    const [step, setStep] = useState(1)
    const [data, setData] = useState<PromotionWizardDto>({
        name: '',
        description: '',
        startDate: new Date(),
        endDate: new Date(),
        hasCoupon: true,
        multipleCoupons: false,
        reuseSameCoupon: false,
        perUserCouponLimit: undefined,
        totalCouponCount: undefined,
        coupons: [],
        active: false,
        cumulative: false,
        priority: 0,
        conditions: [],
        actions: [],
        displays: [],
        badges: []
    })

    const api = setupAPIClientEcommerce()

    const handleFinish = async () => {
        try {
            const form = new FormData()

            // campos textuais tradicionais
            form.append('name', data.name)
            if (data.description) form.append('description', data.description)
            form.append('startDate', data.startDate.toISOString())
            form.append('endDate', data.endDate.toISOString())

            form.append('hasCoupon', String(data.hasCoupon))
            form.append('multipleCoupons', String(data.multipleCoupons))
            form.append('reuseSameCoupon', String(data.reuseSameCoupon))
            if (data.perUserCouponLimit != null)
                form.append('perUserCouponLimit', String(data.perUserCouponLimit))
            if (data.totalCouponCount != null)
                form.append('totalCouponCount', String(data.totalCouponCount))

            // array de cupons
            data.coupons?.forEach(c => form.append('coupons', c))

            form.append('active', String(data.active))
            form.append('cumulative', String(data.cumulative))
            form.append('priority', String(data.priority))

            // enviamos como JSON e deixamos o controller desserializar
            form.append('conditions', JSON.stringify(data.conditions))
            form.append('actions', JSON.stringify(data.actions))
            form.append('displays', JSON.stringify(data.displays))

            // badges: título + arquivo
            data.badges.forEach(b => {
                form.append('badgeTitles', b.title)
                form.append('badgeFiles', b.file)
            })

            // **Não setar Content-Type**: deixa Axios incluir o boundary
            await api.post('/promotions', form)

            toast.success('Promoção criada com sucesso!')
            // reset wizard
            setStep(1)
            setData({
                name: '',
                description: '',
                startDate: new Date(),
                endDate: new Date(),
                hasCoupon: true,
                multipleCoupons: false,
                reuseSameCoupon: false,
                perUserCouponLimit: undefined,
                totalCouponCount: undefined,
                coupons: [],
                active: false,
                cumulative: false,
                priority: 0,
                conditions: [],
                actions: [],
                displays: [],
                badges: []
            })
        } catch (err) {
            console.error(err)
            toast.error('Erro ao criar promoção.')
        }
    }

    return (
        <SidebarAndHeader>
            <Section>
                <TitlePage title="CADASTRAR PROMOÇÃO" />
                <div className="max-w-3xl mx-auto p-6 space-y-6">
                    {step === 1 && <PromotionStep1 data={data} setData={setData} onNext={() => setStep(2)} />}
                    {step === 2 && <PromotionStep2 data={data} setData={setData} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
                    {step === 3 && <PromotionStep3 data={data} setData={setData} onNext={() => setStep(4)} onBack={() => setStep(2)} />}
                    {step === 4 && <PromotionStep4 data={data} setData={setData} onNext={() => setStep(5)} onBack={() => setStep(3)} />}
                    {step === 5 && <PromotionStep5 data={data} setData={setData} onBack={() => setStep(4)} onFinish={handleFinish} />}
                </div>
            </Section>
        </SidebarAndHeader>
    )
}