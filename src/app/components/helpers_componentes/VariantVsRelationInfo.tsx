import React from 'react';

/**
 * Painel de comparação detalhada entre Variantes Técnicas e Relações de Produto
 */
export function VariantVsRelationInfo() {
    return (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded mb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Guia Completo: Variantes Técnicas vs Relações de Produto</h3>
            <div className="space-y-4 text-gray-700 text-sm">
                <section>
                    <h4 className="font-semibold mb-1">1. Variantes Técnicas</h4>
                    <p>
                        • <strong>SKU próprio</strong>, controle de estoque e preço independentes.<br />
                        • Use quando cada opção (cor, tamanho, modelo) precisa de registro detalhado:<br />
                        &emsp;– Atributos finos via <code>VariantAttribute</code>.<br />
                        &emsp;– Imagens e vídeos específicos.<br />
                        • Exemplo: "Camiseta Azul M" e "Camiseta Azul G" são variantes técnicas.
                    </p>
                </section>

                <section>
                    <h4 className="font-semibold mb-1">2. Relações de Produto</h4>
                    <p>
                        Agrupa produtos existentes no catálogo para exibição conjunta, sem duplicar estoque.
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                        <li>
                            <strong>Cadastrar COMO FILHO</strong>: o produto atual torna-se <em>filho</em> de outro <strong>pai</strong> já cadastrado.<br />
                            Ideal para adicionar uma opção à coleção de variantes relacionadas.
                        </li>
                        <li>
                            <strong>Cadastrar COMO PAI</strong>: o produto atual torna-se <em>pai</em> de um ou mais produtos <strong>filhos</strong> existentes.<br />
                            Use quando o novo produto é o principal, e as opções derivadas já existem.
                        </li>
                    </ul>
                </section>

                <section>
                    <h4 className="font-semibold mb-1">3. Campos de Relação</h4>
                    <ul className="list-disc list-inside space-y-1">
                        <li>
                            <strong>Tipo de Relação (relationType)</strong>:<br />
                            &nbsp;• <code>VARIANT</code>: opções alternativas (Standard vs Pro).<br />
                            &nbsp;• <code>SIMPLE</code>: agrupar cores/tamanhos sem registro extra.<br />
                        </li>
                        <li>
                            <strong>Ordem (sortOrder)</strong>: define a sequência de exibição.<br />
                            Menores valores aparecem primeiro na galeria de variantes.
                        </li>
                        <li>
                            <strong>Obrigatório (isRequired)</strong>: se marcado, a seleção dessa relação é <em>obrigatória</em> em fluxos de compra conjunta.
                        </li>
                    </ul>
                </section>

                <section>
                    <h4 className="font-semibold mb-1">4. Quando usar cada abordagem</h4>
                    <ul className="list-disc list-inside space-y-1">
                        <li><strong>Variantes Técnicas:</strong> quando precisar de controle completo de estoque e atributos diferenciados.</li>
                        <li><strong>Relações VARIANT:</strong> exibir opções de produto "primo" (Standard vs Pro) no site sem criar variantes técnicas.</li>
                        <li><strong>Relações SIMPLE:</strong> agrupar rapidamente produtos de cor/tamanho para oferta conjunta.</li>
                    </ul>
                </section>
            </div>
        </div>
    );
}