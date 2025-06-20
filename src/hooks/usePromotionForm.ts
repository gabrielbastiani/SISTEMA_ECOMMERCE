'use client'

import { useState, useEffect } from 'react'
import { setupAPIClientEcommerce } from '@/app/services/apiEcommerce'
import { BadgeWizardDto, PromotionWizardDto } from 'Types/types'

export function usePromotionForm(promotion_id: string) {

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
    const [loading, setLoading] = useState(true)
    const api = setupAPIClientEcommerce()

    useEffect(() => {
        async function load() {
            try {
                const resp = await api.get(`/promotions/unique_promotion?promotion_id=${promotion_id}`)
                const p = resp.data

                setData({
                    name: p.name,
                    description: p.description || '',
                    startDate: new Date(p.startDate),
                    endDate: new Date(p.endDate),
                    hasCoupon: p.hasCoupon,
                    multipleCoupons: p.multipleCoupons,
                    reuseSameCoupon: p.reuseSameCoupon,
                    perUserCouponLimit: p.perUserCouponLimit ?? undefined,
                    totalCouponCount: p.totalCouponCount ?? undefined,
                    coupons: p.coupons.map((c: any) => c.code),
                    active: p.active,
                    cumulative: p.cumulative,
                    priority: p.priority,
                    conditions: p.conditions.map((c: any) => ({
                        id: c.id,
                        type: c.type,
                        operator: c.operator,
                        value: c.value
                    })),
                    actions: p.actions.map((a: any) => ({
                        id: a.id,
                        type: a.type,
                        params: a.params
                    })),
                    displays: p.displays.map((d: any) => ({
                        id: d.id,
                        title: d.title,
                        type: d.type,
                        content: d.content
                    })),
                    badges: p.badges.map((b: any): BadgeWizardDto => ({
                        id: b.id,
                        title: b.title,
                        imageUrl: b.imageUrl,
                        file: undefined
                    }))
                })
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [promotion_id, api])

    return { data, setData, loading }
}