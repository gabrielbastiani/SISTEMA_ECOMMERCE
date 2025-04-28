'use client'

import React, { useEffect, useState } from 'react';
import { setupAPIClientEcommerce } from '@/app/services/apiEcommerce';
import ColorPicker from '@/app/components/colorPicker';
import { SidebarAndHeader } from '@/app/components/sidebarAndHeader';
import { Section } from '@/app/components/section';
import { TitlePage } from '@/app/components/section/titlePage';
import { toast } from 'react-toastify';

type CategoryItem = { key: string; label: string; };

const colorsCategories: Record<string, CategoryItem[]> = {
    "Menu e Navegação": [
        { key: 'textos_menu', label: 'Texto do Menu' },
        { key: 'fundo_do_menu', label: 'Fundo do Menu' },
        { key: 'icone_login_menu', label: 'Ícone de Login no Menu' },
        { key: 'icone_usuario_menu', label: 'Ícone de Usuário no Menu' },
    ],
    "Rodapé": [
        { key: 'fundo_rodape', label: 'Fundo do Rodapé' },
        { key: 'texto_rodape', label: 'Texto do Rodapé' },
    ],
    "Botões e Interações": [
        { key: 'textos_botoes', label: 'Textos dos Botões' },
        { key: 'fundo_botao_validar', label: 'Fundo Botão Validar' },
        { key: 'fundo_botao_newslatter', label: 'Fundo Botão Newsletter' },
        { key: 'texto_botao_newslatter', label: 'Texto Botão Newsletter' },
        { key: 'fundo_botao_login_usuario', label: 'Fundo Botão Login Usuário' },
        { key: 'texto_botao_login_usuario', label: 'Texto Botão Login Usuário' },
        { key: 'botao_like_dislike', label: 'Botão Like/Dislike' },
        { key: 'fundo_botao_slides_banner', label: 'Fundo Botão Slides Banner' },
        { key: 'botao_texto_slides_banner', label: 'Texto Botão Slides Banner' },
        { key: 'fundo_botao_popup_marketing', label: 'Fundo Botão Popup Marketing' },
        { key: 'texto_botao_popup_marketing', label: 'Texto Botão Popup Marketing' },
        { key: 'fundo_botao_publicidades_sidebar', label: 'Fundo Botão Publicidades Sidebar' },
        { key: 'texto_botao_publicidades_sidebar', label: 'Texto Botão Publicidades Sidebar' },
        { key: 'leia_mais_post_blocos_todos_posts', label: 'Leia Mais (Posts)' },
        { key: 'fundo_botao_enviar_comentario_e_cadastrar', label: 'Fundo Botão Comentário/Cadastro' },
        { key: 'texto_botao_enviar_comentario_e_cadastrar', label: 'Texto Botão Comentário/Cadastro' },
    ],
    "Newsletter e Popups": [
        { key: 'fundo_newslatter', label: 'Fundo Newsletter' },
        { key: 'texto_newslatter', label: 'Texto Newsletter' },
        { key: 'titulo_newslatter', label: 'Título Newsletter' },
        { key: 'fundo_popup_login', label: 'Fundo Popup Login' },
        { key: 'textos_popup_login', label: 'Texto Popup Login' },
        { key: 'fundo_popup_marketing', label: 'Fundo Popup Marketing' },
        { key: 'texto_popup_marketing', label: 'Texto Popup Marketing' },
    ],
    "Posts, Categorias e Blocos": [
        { key: 'fundo_blocos_sobre', label: 'Fundo Blocos Sobre' },
        { key: 'fundo_blocos_todos_posts', label: 'Fundo Blocos Todos Posts' },
        { key: 'dados_post_blocos_todos_posts', label: 'Dados Posts' },
        { key: 'fundo_blocos_todas_categorias', label: 'Fundo Blocos Categorias' },
        { key: 'nome_categoria_blocos_todas_categorias', label: 'Nome Categoria (Blocos)' },
        { key: 'descricao_categoria_blocos_todas_categorias', label: 'Descrição Categoria (Blocos)' },
        { key: 'subcategoria_categoria_blocos_todas_categorias', label: 'Subcategoria (Blocos)' },
        { key: 'nome_subcategoria_blocos_todas_categorias', label: 'Nome Subcategoria (Blocos)' },
        { key: 'fundo_categoria_no_bloco_do_post', label: 'Fundo Categoria no Bloco' },
        { key: 'texto_nome_categoria_no_bloco_do_post', label: 'Texto Nome Categoria no Bloco' },
        { key: 'mini_descricao_post_blocos_todos_posts', label: 'Mini Descrição dos Posts' },
        { key: 'nome_usuario_comentario', label: 'Nome Usuário Comentário' },
        { key: 'dados_usuario_comentario', label: 'Dados Usuário Comentário' },
        { key: 'likes_e_dislike_usuario_comentario', label: 'Like/Dislike Comentário' },
    ],
    "Slides e Banners": [
        { key: 'setas_slides', label: 'Setas Slides' },
        { key: 'fundo_setas_slides', label: 'Fundo Setas Slides' },
        { key: 'texto_chamada_para_acao_slides', label: 'Texto Chamada para Ação Slides' },
    ],
    "Sidebar e Publicidades": [
        { key: 'fundo_sidebar_site', label: 'Fundo Sidebar' },
        { key: 'texto_publicidades_sidebar', label: 'Texto Publicidades Sidebar' },
        { key: 'titulo_compartilhar_artigo', label: 'Título Compartilhar Artigo' },
    ],
    "Páginas e Seções": [
        { key: 'titulo_pagina_sobre', label: 'Título Página Sobre' },
        { key: 'titulo_pagina_contato', label: 'Título Página Contato' },
        { key: 'titulo_ultimos_posts', label: 'Título Últimos Posts' },
        { key: 'titulo_secoes_titulo_paginas', label: 'Título Seções Páginas' },
        { key: 'fundo_secoes_titulo_paginas', label: 'Fundo Seções Páginas' },
        { key: 'descricoes_secoes_titulo_paginas', label: 'Descrição Seções Páginas' },
        { key: 'titulo_sobre_pagina_sobre', label: 'Título Página Sobre (Sobre)' },
        { key: 'texto_sobre_pagina', label: 'Texto Página Sobre' },
    ],
    "Posts Mais Visualizados": [
        { key: 'fundo_posts_mais_vizualizados', label: 'Fundo Posts Mais Visualizados' },
        { key: 'texto_posts_mais_vizualizados', label: 'Texto Posts Mais Visualizados' },
        { key: 'titulo_post_blocos_todos_posts', label: 'Título Post (Blocos)' },
        { key: 'titulo_posts_mais_vizualizados', label: 'Título Posts Mais Visualizados' },
        { key: 'vizualizacoes_posts_mais_vizualizados', label: 'Visualizações em Posts' },
    ],
    "Contatos e Formulários": [
        { key: 'campos_inputs_formulario_contato', label: 'Campos Inputs (Contato)' },
        { key: 'fundo_botao_formulario_contato', label: 'Fundo Botão Formulário Contato' },
    ],
    "Layout Geral / Fundos": [
        { key: 'segundo_fundo_layout_site', label: 'Segundo Fundo Layout' },
        { key: 'terceiro_fundo_layout_site', label: 'Terceiro Fundo Layout' },
    ],
};

const Colors = () => {

    const [colors, setColors] = useState<Record<string, string>>({});
    const api = setupAPIClientEcommerce();

    const loadColors = async () => {
        try {
            const response = await api.get<{ colors: Record<string, string> }>('/colors');
            setColors(response.data.colors || {});
        } catch (error) {
            console.error('Erro ao carregar cores:', error);
        }
    };

    useEffect(() => {
        loadColors();
        const interval = setInterval(loadColors, 10000);

        return () => {
            clearInterval(interval);
        };
    }, []);

    const categoryNames = Object.keys(colorsCategories);
    const [activeCategory, setActiveCategory] = useState(categoryNames[0]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.put('/colors', { colors });
            toast.success('Cores salvas com sucesso!');
        } catch (error) {
            toast.error('Erro ao salvar cores');
        }
    };

    return (
        <SidebarAndHeader>
            <Section>
                <TitlePage title="Personalização de Cores" />

                <form onSubmit={handleSubmit} className="max-w-7xl mx-auto px-4">
                    {/* Container Flex responsivo: vertical em mobile e horizontal em desktop */}
                    <div className="flex flex-col md:flex-row gap-8">
                        {/* Coluna Esquerda: Lista de Categorias */}
                        <div className="w-full md:w-64 bg-gray-800 text-white rounded-lg p-4 h-auto">
                            <h2 className="text-lg font-bold mb-2">Categorias</h2>
                            <ul className="space-y-2">
                                {categoryNames.map((name) => (
                                    <li key={name}>
                                        <button
                                            type="button"
                                            onClick={() => setActiveCategory(name)}
                                            className={`block w-full text-left px-3 py-2 rounded
                        ${activeCategory === name
                                                    ? 'bg-gray-700 font-semibold'
                                                    : 'hover:bg-gray-700'
                                                }`}
                                        >
                                            {name}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Área Direita: Formulário das cores da categoria ativa */}
                        <div className="flex-1">
                            <h3 className="text-xl font-bold mb-4">{activeCategory}</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {colorsCategories[activeCategory].map(({ key, label }) => (
                                    <ColorPicker
                                        key={key}
                                        name={label}
                                        value={colors[key]}
                                        onChange={(color) => setColors({ ...colors, [key]: color })}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="mt-8 w-full md:w-48 px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                        Salvar configurações
                    </button>
                </form>
            </Section>
        </SidebarAndHeader>
    );
};

export default Colors;