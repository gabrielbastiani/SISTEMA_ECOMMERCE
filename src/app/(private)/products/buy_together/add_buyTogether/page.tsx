'use client';

import { useState, useEffect } from "react";
import { SidebarAndHeader } from "@/app/components/sidebarAndHeader";
import { Section } from "@/app/components/section";
import { TitlePage } from "@/app/components/section/titlePage";
import { setupAPIClientEcommerce } from "@/app/services/apiEcommerce";
import Select, {
    components,
    OptionProps,
    MultiValueProps,
    StylesConfig,
    GroupBase,
    OnChangeValue,
    ActionMeta
} from "react-select";
import { toast } from "react-toastify";
import Image from "next/image";
import { Tooltip } from "@nextui-org/react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface RawProduct {
    id: string;
    name: string;
    price_per: number;
    images: { url: string }[];
}

interface OptionType {
    value: string;
    label: string;
    price: number;
    imageUrl: string;
}

export default function AddBuyTogether() {

    const api = setupAPIClientEcommerce();

    const [options, setOptions] = useState<OptionType[]>([]);
    const [selected, setSelected] = useState<OptionType[]>([]);
    const [groupName, setGroupName] = useState("");

    useEffect(() => {
        async function load() {
            try {
                const res = await api.get("/get/products");
                const prods = res.data.allow_products as RawProduct[];
                setOptions(
                    prods.map(p => ({
                        value: p.id,
                        label: p.name,
                        price: p.price_per,
                        imageUrl: p.images?.[0]?.url,
                    }))
                );
            } catch {
                toast.error("Não foi possível carregar produtos.");
            }
        }
        load();
    }, []);

    async function handleSubmit() {
        if (!groupName.trim()) {
            return toast.warn("Preencha o nome do grupo.");
        }
        if (selected.length === 0) {
            return toast.warn("Selecione ao menos um produto.");
        }
        try {
            await api.post("/buy_together/create", {
                name_group: groupName,
                products: selected.map(o => o.value),
            });
            toast.success("Grupo ‘Compre Junto’ criado com sucesso!");
            setGroupName("");
            setSelected([]);
        } catch {
            toast.error("Erro ao criar grupo.");
        }
    }

    // Custom Option: exibe thumb + nome + preço
    const Option = (props: OptionProps<OptionType, true, GroupBase<OptionType>>) => (
        <components.Option {...props}>
            <div className="flex items-center space-x-3">
                <Image
                    src={`${API_URL}/files/${props.data.imageUrl}`}
                    alt={props.data.label}
                    width={40}
                    height={40}
                    className="rounded object-contain"
                />
                <div>
                    <div className="font-medium text-gray-900">{props.data.label}</div>
                    <div className="text-sm text-gray-500">
                        R$ {props.data.price.toFixed(2).replace(".", ",")}
                    </div>
                </div>
            </div>
        </components.Option>
    );

    // Custom MultiValue: exibe thumb + nome
    const MultiValue: React.FC<
        MultiValueProps<OptionType, true, GroupBase<OptionType>>
    > = (props) => (
        <components.MultiValue {...props}>
            <div className="flex items-center space-x-1">
                <Image
                    src={`${API_URL}/files/${props.data.imageUrl}`}
                    alt={props.data.label}
                    height={30}
                    width={30}
                    className="rounded object-contain"
                />
                <span>{props.data.label}</span>
            </div>
        </components.MultiValue>
    );

    // Estilos para ajustar tamanho do menu e scrolling
    const customStyles: StylesConfig<OptionType, true> = {
        menu: (provided) => ({
            ...provided,
            maxHeight: 300,
        }),
    };

    return (
        <SidebarAndHeader>
            <Section>
                <TitlePage title="CADASTRAR COMPRE JUNTO" />

                <div className="bg-white p-6 grid grid-cols-1 gap-4">
                    {/* Nome do grupo */}
                    <div>
                        <Tooltip
                            content="De um nome para esse grupo de produtos que servirá para expor junto a uma pagina de produto."
                            placement="top-start"
                            className="bg-white text-red-500 border border-gray-200 p-2"
                        >
                            <input
                                type="text"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                className="bg-white border border-gray-200 rounded-md text-black p-2 w-full"
                                placeholder="Ex: Kit Verão"
                            />
                        </Tooltip>
                    </div>

                    {/* Select de produtos */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Selecione Produtos
                        </label>
                        <Select<OptionType, true, GroupBase<OptionType>>
                            isMulti
                            options={options}
                            value={selected}
                            onChange={(
                                newValue: OnChangeValue<OptionType, true>,
                                actionMeta: ActionMeta<OptionType>
                            ) => {
                                setSelected(Array.isArray(newValue) ? [...newValue] : []);
                            }}
                            placeholder="Busque por nome..."
                            styles={customStyles}
                            filterOption={(candidate, input) =>
                                candidate.label.toLowerCase().includes(input.toLowerCase())
                            }
                            components={{ Option, MultiValue }}
                            className="text-black"
                        />
                    </div>

                    {/* Preview dos selecionados em grid */}
                    {selected.length > 0 && (
                        <div>
                            <h4 className="font-medium text-gray-800 mb-2">
                                Itens Selecionados
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {selected.map(item => (
                                    <div
                                        key={item.value}
                                        className="flex flex-col items-center bg-gray-50 p-3 rounded-lg border"
                                    >
                                        <Image
                                            src={`${API_URL}/files/${item.imageUrl}`}
                                            alt={item.label}
                                            height={100}
                                            width={100}
                                            className="object-contain mb-2 rounded"
                                        />
                                        <div className="text-sm font-medium text-gray-900">
                                            {item.label}
                                        </div>
                                        <div className="text-xs text-gray-600">
                                            R$ {item.price.toFixed(2).replace(".", ",")}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Botão */}
                    <button
                        onClick={handleSubmit}
                        className="w-full py-3 rounded-2xl bg-green-600 text-white font-semibold hover:bg-green-700 transition"
                    >
                        Criar Grupo
                    </button>
                </div>
            </Section>
        </SidebarAndHeader>
    );
}