'use client';

import React, { useRef, useState } from 'react'
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
    const [isSaving, setIsSaving] = useState(false)

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
        status: '',
        cumulative: false,
        priority: 0,
        conditions: [],
        actions: [],
        displays: [],
        badges: []
    })

    // API client estável — criado apenas uma vez
    const apiRef = useRef<any | null>(null)
    if (!apiRef.current) apiRef.current = setupAPIClientEcommerce()

    const handleFinish = async () => {
        if (isSaving) return
        setIsSaving(true)
        try {
            const api = apiRef.current
            const form = new FormData()
            form.append('name', data.name)
            if (data.description) form.append('description', data.description)
            // compensação UTC–3
            const fmt = (dt: Date) => {
                const tzOffsetMs = dt.getTimezoneOffset() * 60000
                return new Date(dt.getTime() - tzOffsetMs)
                    .toISOString()
                    .slice(0, 16)
            }
            form.append('startDate', fmt(data.startDate))
            form.append('endDate', fmt(data.endDate))
            form.append('hasCoupon', String(data.hasCoupon))
            form.append('multipleCoupons', String(data.multipleCoupons))
            form.append('reuseSameCoupon', String(data.reuseSameCoupon))
            if (data.perUserCouponLimit != null)
                form.append('perUserCouponLimit', String(data.perUserCouponLimit))
            if (data.totalCouponCount != null)
                form.append('totalCouponCount', String(data.totalCouponCount))
                    ; (data.coupons ?? []).forEach(c => form.append('coupons', c))

            form.append('status', data.status)
            form.append('cumulative', String(data.cumulative))
            form.append('priority', String(data.priority))

            form.append('conditions', JSON.stringify(data.conditions))
            form.append('actions', JSON.stringify(data.actions))
            form.append('displays', JSON.stringify(data.displays))

                // badges (arquivos)
                ; (data.badges || []).forEach((b: any) => {
                    form.append('badgeTitles', b.title)
                    form.append('badgeFiles', b.file)
                })

            await api.post('/promotions', form)

            // só mostrar toast DEPOIS do POST ter finalizado com sucesso
            toast.success('Promoção criada com sucesso!')
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
                status: '',
                cumulative: false,
                priority: 0,
                conditions: [],
                actions: [],
                displays: [],
                badges: []
            })
        } catch (err) {
            console.error('Erro ao salvar promoção:', err)
            toast.error('Erro ao criar promoção.')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <SidebarAndHeader>
            <Section>
                <TitlePage title="CADASTRAR PROMOÇÃO" />
                <div className="max-w-3xl mx-auto p-6 space-y-6 relative">
                    {isSaving && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40">
                            <div className="w-full max-w-md p-6 bg-white rounded shadow-lg animate-pulse">
                                <div className="h-4 bg-gray-200 rounded mb-3" />
                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-6" />
                                <div className="h-40 bg-gray-200 rounded" />
                                <div className="text-center mt-4 text-gray-700 font-medium">Salvando promoção...</div>
                            </div>
                        </div>
                    )}

                    {step === 1 && (
                        <PromotionStep1
                            data={data}
                            setData={setData}
                            onNext={() => setStep(2)}
                            isSaving={isSaving}
                        />
                    )}
                    {step === 2 && (
                        <PromotionStep2
                            data={data}
                            setData={setData}
                            onNext={() => setStep(3)}
                            onBack={() => setStep(1)}
                            isSaving={isSaving}
                        />
                    )}
                    {step === 3 && (
                        <PromotionStep3
                            data={data}
                            setData={setData}
                            onNext={() => setStep(4)}
                            onBack={() => setStep(2)}
                            isSaving={isSaving}
                        />
                    )}
                    {step === 4 && (
                        <PromotionStep4
                            data={data}
                            setData={setData}
                            onNext={() => setStep(5)}
                            onBack={() => setStep(3)}
                            isSaving={isSaving}
                        />
                    )}
                    {step === 5 && (
                        <PromotionStep5
                            data={data as any}
                            setData={setData as any}
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