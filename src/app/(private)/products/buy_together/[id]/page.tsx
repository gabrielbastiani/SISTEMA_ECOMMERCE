'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Select, {
    components,
    OptionProps,
    MultiValueProps,
    StylesConfig,
    GroupBase,
    OnChangeValue
} from 'react-select';
import Image from 'next/image';
import { SidebarAndHeader } from '@/app/components/sidebarAndHeader';
import { Section } from '@/app/components/section';
import { TitlePage } from '@/app/components/section/titlePage';
import { setupAPIClientEcommerce } from '@/app/services/apiEcommerce';
import { toast } from 'react-toastify';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

interface ProductOption {
    value: string;
    label: string;
    price: number;
    imageUrl: string;
}

interface BuyTogetherDetail {
    id: string;
    name: string;
    status: 'SIM' | 'NAO';
    products: Array<{
        id: string;
        name: string;
        price_per: number;
        imageUrl: string;
    }>;
    created_at: string;
}

export default function UpdateBuyTogetherPage() {

    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const api = setupAPIClientEcommerce();

    const [groupName, setGroupName] = useState('');
    const [allOptions, setAllOptions] = useState<ProductOption[]>([]);
    const [selected, setSelected] = useState<ProductOption[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        async function load() {
            if (!id) {
                toast.error('ID do grupo não fornecido.');
                router.back();
                return;
            }

            try {
                // 1) Carrega todos os produtos para o select
                const prodRes = await api.get('/get/products');
                const rawProds = prodRes.data.allow_products as any[];
                const opts: ProductOption[] = rawProds.map(p => ({
                    value: p.id,
                    label: p.name,
                    price: p.price_per,
                    imageUrl:
                        // prefixa com a base completa
                        `${API_URL}/files/product/${p.images.find((i: any) => i.isPrimary)?.url ||
                        p.images[0]?.url ||
                        '/public/no-image.png'
                        }`
                }));
                setAllOptions(opts);

                // 2) Carrega detalhes do grupo pelo ID
                const grpRes = await api.get<BuyTogetherDetail>(`/buy_together/${id}`);
                const bt = grpRes.data;
                setGroupName(bt.name ?? '');

                // 3) Inicializa seleção pelos IDs do JSON `products`
                const initial = opts.filter(o => bt.products.some(p => p.id === o.value));
                setSelected(initial);
            } catch (err: any) {
                console.error('Erro ao carregar grupo:', err);
                toast.error(err.response?.data?.error || 'Erro ao carregar grupo');
                router.back();
            }
        }
        load();
    }, [id]);

    // Custom components do react-select (imagem + preço)
    const Option = (props: OptionProps<ProductOption, true>) => (
        <components.Option {...props}>
            <div className="flex items-center space-x-2">
                <Image src={props.data.imageUrl} width={32} height={32} alt="" className="rounded object-cover" />
                <div>
                    <div className="font-medium">{props.data.label}</div>
                    <div className="text-xs text-gray-500">
                        R$ {props.data.price.toFixed(2).replace('.', ',')}
                    </div>
                </div>
            </div>
        </components.Option>
    );
    const MultiValue = (props: MultiValueProps<ProductOption, true>) => (
        <components.MultiValue {...props}>
            <div className="flex items-center space-x-1">
                <Image src={props.data.imageUrl} width={20} height={20} alt="" className="rounded object-cover" />
                <span className="text-xs truncate max-w-[100px] text-black">{props.data.label}</span>
            </div>
        </components.MultiValue>
    );

    const styles: StylesConfig<ProductOption, true> = {
        menu: prov => ({ ...prov, maxHeight: 200, color: "black" })
    };

    // Envia atualização
    const handleSubmit = async () => {
        if (!id) return;
        if (!groupName.trim()) return toast.warn('Informe o nome');
        if (!selected.length) return toast.warn('Selecione ao menos um produto');

        setLoading(true);
        // dentro do seu handleSubmit
        try {
            await api.put(`/buy_together/${id}`,
                {
                    name: groupName,
                    products: selected.map(o => o.value)
                }
            );
            toast.success('Atualizado!');
            router.back();
        } catch (e: any) {
            console.error('Erro ao salvar:', e);
            toast.error(e.response?.data?.error || 'Erro ao salvar');
        } finally {
            setLoading(false);
        }

    };

    return (
        <SidebarAndHeader>
            <Section>
                <TitlePage title="ATUALIZAR GRUPO COMPRE JUNTO" />
                <div className="mx-auto bg-white p-6 shadow space-y-6">
                    {/* Nome */}
                    <div>
                        <label className="block text-sm text-black">Nome do Grupo</label>
                        <input
                            type="text"
                            value={groupName}
                            onChange={e => setGroupName(e.target.value)}
                            className="mt-1 w-full p-2 border rounded text-black"
                        />
                    </div>

                    {/* Produtos */}
                    <div>
                        <label className="block text-sm mb-1 text-black">Produtos</label>
                        <Select<ProductOption, true, GroupBase<ProductOption>>
                            isMulti
                            options={allOptions}
                            value={selected}
                            onChange={v => setSelected(Array.isArray(v) ? v : [])}
                            components={{ Option, MultiValue }}
                            styles={styles}
                            placeholder="Busque..."
                        />
                    </div>

                    {/* Preview */}
                    {selected.length > 0 && (
                        <ul className="space-y-2">
                            {selected.map(o => (
                                <li key={o.value} className="flex items-center space-x-3">
                                    <Image src={o.imageUrl} width={32} height={32} alt="" className="rounded" />
                                    <span className='text-black'>{o.label}</span>
                                    <span className="text-gray-400 text-xs">R$ {o.price.toFixed(2).replace('.', ',')}</span>
                                </li>
                            ))}
                        </ul>
                    )}

                    {/* Botão */}
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full py-3 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                        {loading ? 'Atualizando...' : 'Atualizar'}
                    </button>
                </div>
            </Section>
        </SidebarAndHeader>
    );
}