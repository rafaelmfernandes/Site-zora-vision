
// ============================================================
// ZORAVISION - PRODUTOS DO MERCADO LIVRE
// ============================================================
// Arquivo:
// Admin/mercadolivre-produtos.js
//
// Responsabilidades:
// - Verificar conexão do Mercado Livre
// - Buscar produtos importados do Mercado Livre
// - Mostrar produtos na página
// - Pesquisar produtos
// - Identificar produtos pelo mercado_livre_item_id
// - Evitar duplicação na tela
// - Mostrar quantidade encontrada
// - Preparar gerenciamento futuro
// ============================================================


// ============================================================
// 1. CONFIGURAÇÕES
// ============================================================

const EDGE_FUNCTION_IMPORTAR =
    'https://ratajxnxkjoiuknamacn.supabase.co/functions/v1/mercadolivre-importar-produtos';

const PAGINA_INTEGRACOES =
    'admin-integracoes.html';


// ============================================================
// 2. ESTADO
// ============================================================

let produtosMercadoLivre = [];

let produtosFiltrados = [];


// ============================================================
// 3. SUPABASE
// ============================================================

function obterSupabaseMercadoLivreProdutos() {

    if (window.supabaseClient) {

        return window.supabaseClient;

    }

    if (window._supabase) {

        return window._supabase;

    }

    if (
        typeof window.obterSupabase === 'function'
    ) {

        try {

            return window.obterSupabase();

        } catch (erro) {

            console.error(
                'Erro ao obter Supabase:',
                erro
            );

        }

    }

    console.error(
        'Cliente Supabase não encontrado.'
    );

    return null;
}


// ============================================================
// 4. ELEMENTOS DA PÁGINA
// ============================================================

function obterElemento(id) {

    return document.getElementById(id);

}


// ============================================================
// 5. MOSTRAR CARREGAMENTO
// ============================================================

function mostrarCarregamento() {

    const container =
        obterElemento(
            'lista-produtos-mercado-livre'
        );

    if (!container) {

        return;

    }

    container.innerHTML = `
        <div class="ml-produtos-carregando">
            <div class="ml-spinner"></div>
            <p>Carregando produtos do Mercado Livre...</p>
        </div>
    `;

}


// ============================================================
// 6. MOSTRAR ERRO
// ============================================================

function mostrarErro(mensagem) {

    const container =
        obterElemento(
            'lista-produtos-mercado-livre'
        );

    if (!container) {

        return;

    }

    container.innerHTML = `
        <div class="ml-produtos-erro">
            <strong>Não foi possível carregar os produtos.</strong>
            <p>${escaparHTML(mensagem)}</p>
            <button
                type="button"
                id="btn-tentar-novamente-ml"
            >
                Tentar novamente
            </button>
        </div>
    `;

    const botao =
        obterElemento(
            'btn-tentar-novamente-ml'
        );

    if (botao) {

        botao.addEventListener(
            'click',
            carregarProdutosMercadoLivre
        );

    }

}


// ============================================================
// 7. ESCAPAR HTML
// ============================================================

function escaparHTML(valor) {

    if (
        valor === null ||
        valor === undefined
    ) {

        return '';

    }

    return String(valor)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

}


// ============================================================
// 8. FORMATAR PREÇO
// ============================================================

function formatarPreco(valor) {

    const numero =
        Number(valor);

    if (
        Number.isNaN(numero)
    ) {

        return 'R$ 0,00';

    }

    return numero.toLocaleString(
        'pt-BR',
        {
            style: 'currency',
            currency: 'BRL'
        }
    );

}


// ============================================================
// 9. FORMATAR DATA
// ============================================================

function formatarData(valor) {

    if (!valor) {

        return 'Não informado';

    }

    const data =
        new Date(valor);

    if (
        Number.isNaN(
            data.getTime()
        )
    ) {

        return 'Não informado';

    }

    return data.toLocaleString(
        'pt-BR',
        {
            dateStyle: 'short',
            timeStyle: 'short'
        }
    );

}


// ============================================================
// 10. OBTER IMAGEM
// ============================================================

function obterImagemProduto(produto) {

    if (
        produto &&
        produto.imagem_url
    ) {

        return produto.imagem_url;

    }

    return '';

}


// ============================================================
// 11. CARREGAR PRODUTOS
// ============================================================

async function carregarProdutosMercadoLivre() {

    console.log(
        '============================================================'
    );

    console.log(
        'ZoraVision - Produtos Mercado Livre'
    );

    console.log(
        'Carregando produtos...'
    );

    console.log(
        '============================================================'
    );

    mostrarCarregamento();

    const supabase =
        obterSupabaseMercadoLivreProdutos();

    if (!supabase) {

        mostrarErro(
            'O cliente Supabase não está disponível.'
        );

        return;

    }

    try {

        const resultado =
            await supabase
                .from('produtos')
                .select(
                    'id,categoria_id,nome,slug,descricao,preco,preco_promocional,estoque,sku,imagem_url,ativo,destaque,created_at,updated_at,mercado_livre_item_id'
                )
                .not(
                    'mercado_livre_item_id',
                    'is',
                    null
                )
                .order(
                    'created_at',
                    {
                        ascending: false
                    }
                );

        if (resultado.error) {

            console.error(
                'Erro ao buscar produtos:',
                resultado.error
            );

            mostrarErro(
                resultado.error.message ||
                'Erro ao consultar os produtos.'
            );

            return;

        }

        produtosMercadoLivre =
            Array.isArray(
                resultado.data
            )
                ? resultado.data
                : [];

        console.log(
            'Produtos encontrados:',
            produtosMercadoLivre.length
        );

        // ----------------------------------------------------
        // PROTEÇÃO CONTRA DUPLICAÇÃO
        // ----------------------------------------------------

        const mapa =
            new Map();

        produtosMercadoLivre.forEach(
            function(produto) {

                const itemId =
                    produto.mercado_livre_item_id;

                if (!itemId) {

                    return;

                }

                if (
                    !mapa.has(itemId)
                ) {

                    mapa.set(
                        itemId,
                        produto
                    );

                }

            }
        );

        produtosMercadoLivre =
            Array.from(
                mapa.values()
            );

        console.log(
            'Produtos únicos:',
            produtosMercadoLivre.length
        );

        produtosFiltrados =
            [...produtosMercadoLivre];

        atualizarResumo();

        renderizarProdutos();

    } catch (erro) {

        console.error(
            'Erro inesperado ao carregar produtos:',
            erro
        );

        mostrarErro(
            erro?.message ||
            'Erro inesperado ao carregar os produtos.'
        );

    }

}


// ============================================================
// 12. ATUALIZAR RESUMO
// ============================================================

function atualizarResumo() {

    const total =
        produtosMercadoLivre.length;

    const encontrados =
        obterElemento(
            'total-produtos-mercado-livre'
        );

    if (encontrados) {

        encontrados.textContent =
            total;

    }

    const exibidos =
        obterElemento(
            'produtos-exibidos-mercado-livre'
        );

    if (exibidos) {

        exibidos.textContent =
            produtosFiltrados.length;

    }

}


// ============================================================
// 13. RENDERIZAR PRODUTOS
// ============================================================

function renderizarProdutos() {

    const container =
        obterElemento(
            'lista-produtos-mercado-livre'
        );

    if (!container) {

        console.warn(
            'Container lista-produtos-mercado-livre não encontrado.'
        );

        return;

    }

    if (
        produtosFiltrados.length === 0
    ) {

        container.innerHTML = `
            <div class="ml-produtos-vazio">
                <div class="ml-produtos-vazio-icone">
                    📦
                </div>

                <h3>
                    Nenhum produto encontrado
                </h3>

                <p>
                    Nenhum produto do Mercado Livre foi importado para o ZoraVision.
                </p>

                <button
                    type="button"
                    id="btn-ir-integracoes"
                >
                    Voltar para integrações
                </button>
            </div>
        `;

        const botao =
            obterElemento(
                'btn-ir-integracoes'
            );

        if (botao) {

            botao.addEventListener(
                'click',
                voltarIntegracoes
            );

        }

        atualizarResumo();

        return;

    }

    container.innerHTML =
        produtosFiltrados
            .map(
                criarCardProduto
            )
            .join('');

    atualizarResumo();

}


// ============================================================
// 14. CRIAR CARD DO PRODUTO
// ============================================================

function criarCardProduto(produto) {

    const imagem =
        obterImagemProduto(
            produto
        );

    const nome =
        escaparHTML(
            produto.nome ||
            'Produto sem nome'
        );

    const itemId =
        escaparHTML(
            produto.mercado_livre_item_id ||
            ''
        );

    const sku =
        escaparHTML(
            produto.sku ||
            'Não informado'
        );

    const estoque =
        Number(
            produto.estoque || 0
        );

    const preco =
        formatarPreco(
            produto.preco
        );

    const precoPromocional =
        produto.preco_promocional !== null &&
        produto.preco_promocional !== undefined
            ? formatarPreco(
                produto.preco_promocional
            )
            : null;

    const ativo =
        produto.ativo === true;

    const statusTexto =
        ativo
            ? 'Ativo'
            : 'Inativo';

    const statusClasse =
        ativo
            ? 'produto-status-ativo'
            : 'produto-status-inativo';

    const imagemHTML =
        imagem
            ? `
                <img
                    src="${escaparHTML(imagem)}"
                    alt="${nome}"
                    loading="lazy"
                    onerror="this.style.display='none'; this.parentElement.classList.add('sem-imagem');"
                >
            `
            : `
                <div class="produto-sem-imagem">
                    📦
                </div>
            `;

    return `
        <article
            class="produto-mercado-livre-card"
            data-item-id="${itemId}"
        >

            <div class="produto-mercado-livre-imagem">

                ${imagemHTML}

            </div>

            <div class="produto-mercado-livre-conteudo">

                <div class="produto-mercado-livre-topo">

                    <span class="produto-plataforma">
                        Mercado Livre
                    </span>

                    <span
                        class="produto-status ${statusClasse}"
                    >
                        ${statusTexto}
                    </span>

                </div>

                <h3>
                    ${nome}
                </h3>

                <div class="produto-mercado-livre-dados">

                    <div>
                        <small>
                            ID Mercado Livre
                        </small>

                        <strong>
                            ${itemId || 'Não informado'}
                        </strong>
                    </div>

                    <div>
                        <small>
                            SKU
                        </small>

                        <strong>
                            ${sku}
                        </strong>
                    </div>

                    <div>
                        <small>
                            Estoque
                        </small>

                        <strong>
                            ${estoque}
                        </strong>
                    </div>

                </div>

                <div class="produto-mercado-livre-precos">

                    <div>

                        <small>
                            Preço
                        </small>

                        <strong>
                            ${preco}
                        </strong>

                    </div>

                    ${
                        precoPromocional
                            ? `
                                <div>

                                    <small>
                                        Preço promocional
                                    </small>

                                    <strong>
                                        ${precoPromocional}
                                    </strong>

                                </div>
                            `
                            : ''
                    }

                </div>

                <div class="produto-mercado-livre-meta">

                    <span>
                        Importado em:
                        ${formatarData(produto.created_at)}
                    </span>

                    <span>
                        Atualizado em:
                        ${formatarData(produto.updated_at)}
                    </span>

                </div>

            </div>

        </article>
    `;

}


// ============================================================
// 15. PESQUISAR PRODUTOS
// ============================================================

function pesquisarProdutosMercadoLivre() {

    const campo =
        obterElemento(
            'buscar-produtos-mercado-livre'
        );

    if (!campo) {

        return;

    }

    const termo =
        campo.value
            .trim()
            .toLowerCase();

    if (!termo) {

        produtosFiltrados =
            [...produtosMercadoLivre];

        renderizarProdutos();

        return;

    }

    produtosFiltrados =
        produtosMercadoLivre.filter(
            function(produto) {

                const nome =
                    String(
                        produto.nome ||
                        ''
                    ).toLowerCase();

                const itemId =
                    String(
                        produto.mercado_livre_item_id ||
                        ''
                    ).toLowerCase();

                const sku =
                    String(
                        produto.sku ||
                        ''
                    ).toLowerCase();

                return (
                    nome.includes(termo) ||
                    itemId.includes(termo) ||
                    sku.includes(termo)
                );

            }
        );

    renderizarProdutos();

}


// ============================================================
// 16. CONFIGURAR PESQUISA
// ============================================================

function configurarPesquisa() {

    const campo =
        obterElemento(
            'buscar-produtos-mercado-livre'
        );

    if (!campo) {

        console.warn(
            'Campo de busca não encontrado.'
        );

        return;

    }

    if (
        campo.dataset.configurado ===
        'true'
    ) {

        return;

    }

    campo.dataset.configurado =
        'true';

    campo.addEventListener(
        'input',
        pesquisarProdutosMercadoLivre
    );

}


// ============================================================
// 17. VOLTAR PARA INTEGRAÇÕES
// ============================================================

function voltarIntegracoes() {

    window.location.href =
        PAGINA_INTEGRACOES;

}


// ============================================================
// 18. CONFIGURAR BOTÃO VOLTAR
// ============================================================

function configurarBotaoVoltar() {

    const botoes =
        document.querySelectorAll(
            '[data-voltar-integracoes]'
        );

    botoes.forEach(
        function(botao) {

            if (
                botao.dataset.configurado ===
                'true'
            ) {

                return;

            }

            botao.dataset.configurado =
                'true';

            botao.addEventListener(
                'click',
                voltarIntegracoes
            );

        }
    );

}


// ============================================================
// 19. CONFIGURAR BOTÃO ATUALIZAR
// ============================================================

function configurarBotaoAtualizar() {

    const botao =
        obterElemento(
            'btn-atualizar-produtos-mercado-livre'
        );

    if (!botao) {

        return;

    }

    if (
        botao.dataset.configurado ===
        'true'
    ) {

        return;

    }

    botao.dataset.configurado =
        'true';

    botao.addEventListener(
        'click',
        async function() {

            if (
                botao.disabled
            ) {

                return;

            }

            botao.disabled =
                true;

            botao.textContent =
                'Atualizando...';

            try {

                await carregarProdutosMercadoLivre();

            } finally {

                botao.disabled =
                    false;

                botao.textContent =
                    'Atualizar';

            }

        }
    );

}


// ============================================================
// 20. CONFIGURAR BOTÃO IMPORTAR
// ============================================================

function configurarBotaoImportar() {

    const botao =
        obterElemento(
            'btn-importar-produtos-mercado-livre'
        );

    if (!botao) {

        return;

    }

    if (
        botao.dataset.configurado ===
        'true'
    ) {

        return;

    }

    botao.dataset.configurado =
        'true';

    botao.addEventListener(
        'click',
        importarProdutos
    );

}


// ============================================================
// 21. IMPORTAR NOVAMENTE
// ============================================================

async function importarProdutos() {

    const botao =
        obterElemento(
            'btn-importar-produtos-mercado-livre'
        );

    if (
        botao &&
        botao.disabled
    ) {

        return;

    }

    try {

        if (botao) {

            botao.disabled =
                true;

            botao.textContent =
                'Importando...';

        }

        const resposta =
            await fetch(
                EDGE_FUNCTION_IMPORTAR,
                {

                    method:
                        'POST',

                    headers: {

                        'Content-Type':
                            'application/json'

                    },

                    body:
                        JSON.stringify({})

                }
            );

        const texto =
            await resposta.text();

        let resultado =
            null;

        try {

            resultado =
                texto
                    ? JSON.parse(
                        texto
                    )
                    : null;

        } catch (erro) {

            console.error(
                'Resposta inválida:',
                texto
            );

        }

        if (!resposta.ok) {

            throw new Error(
                resultado?.erro ||
                resultado?.error ||
                'Falha na importação.'
            );

        }

        if (
            !resultado ||
            resultado.sucesso !== true
        ) {

            throw new Error(
                resultado?.erro ||
                resultado?.mensagem ||
                'A importação não foi confirmada.'
            );

        }

        console.log(
            'Resultado da nova importação:',
            resultado
        );

        alert(
            'Importação concluída!\n\n' +
            'Encontrados: ' +
            Number(
                resultado.total_encontrados || 0
            ) +
            '\n' +
            'Criados: ' +
            Number(
                resultado.criados || 0
            ) +
            '\n' +
            'Atualizados: ' +
            Number(
                resultado.atualizados || 0
            ) +
            '\n' +
            'Erros: ' +
            Number(
                resultado.erros || 0
            )
        );

        await carregarProdutosMercadoLivre();

    } catch (erro) {

        console.error(
            'Erro ao importar produtos:',
            erro
        );

        alert(
            'Não foi possível importar os produtos.\n\n' +
            (
                erro?.message ||
                'Erro desconhecido.'
            )
        );

    } finally {

        if (botao) {

            botao.disabled =
                false;

            botao.textContent =
                'Importar produtos';

        }

    }

}


// ============================================================
// 22. INICIALIZAÇÃO
// ============================================================

document.addEventListener(
    'DOMContentLoaded',
    async function() {

        console.log(
            '============================================================'
        );

        console.log(
            'ZoraVision - Mercado Livre Produtos'
        );

        console.log(
            'Inicializando página...'
        );

        console.log(
            '============================================================'
        );

        configurarPesquisa();

        configurarBotaoVoltar();

        configurarBotaoAtualizar();

        configurarBotaoImportar();

        await carregarProdutosMercadoLivre();

        console.log(
            'Página de produtos Mercado Livre carregada.'
        );

    }
);


// ============================================================
// 23. FUNÇÕES GLOBAIS
// ============================================================

window.carregarProdutosMercadoLivre =
    carregarProdutosMercadoLivre;

window.pesquisarProdutosMercadoLivre =
    pesquisarProdutosMercadoLivre;

window.importarProdutos =
    importarProdutos;

window.voltarIntegracoes =
    voltarIntegracoes;

