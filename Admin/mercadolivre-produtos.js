// ============================================================
// ZORAVISION - PRODUTOS DO MERCADO LIVRE
// Arquivo:
// Admin/mercadolivre-produtos.js
//
// Responsabilidades:
//
// - Consultar anúncios do Mercado Livre
// - Identificar produtos já importados
// - Identificar produtos ainda não importados
// - Mostrar produtos ativos no ZoraVision
// - Mostrar produtos inativos no ZoraVision
// - Filtrar por status
// - Pesquisar produtos
// - Permitir selecionar produtos
// - Permitir selecionar todos
// - Importar/sincronizar produtos selecionados
// - Ativar produto
// - Inativar produto
// - Atualizar a lista
// - Não excluir produtos do banco
// ============================================================

// ============================================================
// 1. CONFIGURAÇÕES
// ============================================================

const EDGE_FUNCTION_IMPORTAR =
'https://ratajxnxkjoiuknamacn.supabase.co/functions/v1/mercadolivre-importar-produtos';

// ============================================================
// 2. ESTADO DA PÁGINA
// ============================================================

let produtosMercadoLivre = [];

let filtroAtual =
'todos';

let termoBuscaAtual =
'';

// ============================================================
// 3. OBTER SUPABASE
// ============================================================

function obterSupabaseProdutosMercadoLivre() {


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
            'Erro ao obter cliente Supabase:',
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
// 4. ELEMENTOS
// ============================================================

function obterElemento(id) {


return document.getElementById(id);


}

// ============================================================
// 5. MENSAGEM
// ============================================================

function mostrarMensagem(
mensagem,
tipo = 'info'
) {


const elemento =
    obterElemento(
        'mensagem-produtos'
    );

if (!elemento) {

    return;

}

elemento.textContent =
    mensagem;

elemento.className =
    'mensagem-produtos mensagem-' +
    tipo;

elemento.style.display =
    'block';


}

// ============================================================
// 6. ESCONDER MENSAGEM
// ============================================================

function esconderMensagem() {


const elemento =
    obterElemento(
        'mensagem-produtos'
    );

if (!elemento) {

    return;

}

elemento.style.display =
    'none';


}

// ============================================================
// 7. FORMATAR PREÇO
// ============================================================

function formatarPreco(
valor
) {


const numero =
    Number(
        valor || 0
    );

return numero.toLocaleString(
    'pt-BR',
    {
        style: 'currency',
        currency: 'BRL'
    }
);


}

// ============================================================
// 8. STATUS MERCADO LIVRE
// ============================================================

function obterStatusMercadoLivre(
produto
) {


if (
    produto?.status_mercado_livre
) {

    return String(
        produto.status_mercado_livre
    );

}

if (
    produto?.ml_status
) {

    return String(
        produto.ml_status
    );

}

if (
    produto?.status
) {

    return String(
        produto.status
    );

}

return 'active';


}

// ============================================================
// 9. TEXTO STATUS MERCADO LIVRE
// ============================================================

function textoStatusMercadoLivre(
status
) {


const valor =
    String(
        status || ''
    ).toLowerCase();

if (
    valor === 'active' ||
    valor === 'ativo'
) {

    return 'Ativo no Mercado Livre';

}

if (
    valor === 'paused' ||
    valor === 'pausado'
) {

    return 'Pausado no Mercado Livre';

}

if (
    valor === 'closed' ||
    valor === 'fechado'
) {

    return 'Encerrado no Mercado Livre';

}

if (
    valor === 'under_review'
) {

    return 'Em análise no Mercado Livre';

}

return 'Mercado Livre';


}

// ============================================================
// 10. CRIAR BADGE
// ============================================================

function criarBadgeStatus(
texto,
classe
) {


const badge =
    document.createElement(
        'span'
    );

badge.className =
    'produto-status-badge ' +
    classe;

badge.textContent =
    texto;

return badge;


}

// ============================================================
// 11. NORMALIZAR ANÚNCIOS
// ============================================================

function normalizarAnuncios(
resultado
) {


let anuncios = [];

if (
    Array.isArray(
        resultado?.anuncios
    )
) {

    anuncios =
        resultado.anuncios;

} else if (
    Array.isArray(
        resultado?.produtos
    )
) {

    anuncios =
        resultado.produtos;

} else if (
    Array.isArray(
        resultado?.data
    )
) {

    anuncios =
        resultado.data;

}


return anuncios.map(
    function(anuncio) {

        const produto =
            anuncio?.produto ||
            anuncio?.produto_importado ||
            anuncio?.produto_existente ||
            null;

        const importado =
            Boolean(
                anuncio?.importado ??
                anuncio?.ja_importado ??
                anuncio?.produto_id ??
                produto?.id
            );


        return {

            ...anuncio,

            produto:
                produto,

            importado:
                importado,

            produto_id:
                anuncio?.produto_id ||
                produto?.id ||
                null,

            mercado_livre_item_id:
                anuncio?.mercado_livre_item_id ||
                anuncio?.item_id ||
                anuncio?.id ||
                null,

            nome:
                anuncio?.nome ||
                anuncio?.title ||
                produto?.nome ||
                'Produto Mercado Livre',

            descricao:
                anuncio?.descricao ||
                produto?.descricao ||
                '',

            preco:
                anuncio?.preco ??
                anuncio?.price ??
                produto?.preco ??
                0,

            estoque:
                anuncio?.estoque ??
                anuncio?.available_quantity ??
                produto?.estoque ??
                0,

            sku:
                anuncio?.sku ||
                produto?.sku ||
                null,

            imagem_url:
                anuncio?.imagem_url ||
                anuncio?.thumbnail ||
                anuncio?.secure_thumbnail ||
                produto?.imagem_url ||
                null,

            ativo:
                produto
                    ? produto.ativo === true
                    : false,

            status_mercado_livre:
                anuncio?.status_mercado_livre ||
                anuncio?.ml_status ||
                anuncio?.status ||
                'active'

        };

    }
);


}

// ============================================================
// 12. CONSULTAR MERCADO LIVRE
// ============================================================

async function consultarMercadoLivre() {


console.log(
    'Consultando produtos do Mercado Livre...'
);


const resposta =
    await fetch(
        EDGE_FUNCTION_IMPORTAR,
        {

            method:
                'GET',

            headers: {

                'Content-Type':
                    'application/json'

            }

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
        'Resposta inválida da Edge Function:',
        texto
    );

}


if (
    !resposta.ok
) {

    throw new Error(
        resultado?.erro ||
        resultado?.error ||
        'Não foi possível consultar os produtos do Mercado Livre.'
    );

}


if (
    resultado?.sucesso === false
) {

    throw new Error(
        resultado?.erro ||
        'A consulta ao Mercado Livre não foi concluída.'
    );

}


return resultado;


}

// ============================================================
// 13. CARREGAR PRODUTOS
// ============================================================

async function carregarProdutosMercadoLivre() {


console.log(
    '============================================================'
);

console.log(
    'ZoraVision - Produtos Mercado Livre'
);

console.log(
    'Consultando anúncios e produtos importados...'
);

console.log(
    '============================================================'
);


esconderMensagem();


const lista =
    obterElemento(
        'lista-produtos'
    );


if (!lista) {

    console.error(
        'Elemento lista-produtos não encontrado.'
    );

    return;

}


lista.innerHTML =
    `
    <div class="produtos-vazio">

        <div class="produtos-vazio-icone">
            ⏳
        </div>

        <h2>
            Carregando produtos
        </h2>

        <p>
            Consultando os anúncios do Mercado Livre...
        </p>

    </div>
    `;


mostrarMensagem(
    'Consultando produtos do Mercado Livre...',
    'info'
);


try {

    const resultado =
        await consultarMercadoLivre();


    console.log(
        'Resposta da Edge Function:',
        resultado
    );


    produtosMercadoLivre =
        normalizarAnuncios(
            resultado
        );


    console.log(
        'Anúncios normalizados:',
        produtosMercadoLivre
    );


    atualizarResumoProdutos(
        produtosMercadoLivre,
        resultado
    );


    renderizarProdutos();


} catch (erro) {

    console.error(
        'Erro ao carregar produtos:',
        erro
    );


    lista.innerHTML =
        `
        <div class="produtos-vazio">

            <div class="produtos-vazio-icone">
                ⚠️
            </div>

            <h2>
                Não foi possível carregar os produtos
            </h2>

            <p>
                ${
                    erro?.message ||
                    'Erro desconhecido.'
                }
            </p>

        </div>
        `;


    mostrarMensagem(
        erro?.message ||
        'Não foi possível carregar os produtos.',
        'erro'
    );

}


}

// ============================================================
// 14. APLICAR FILTRO
// ============================================================

function aplicarFiltroProdutos(
produtos
) {


const filtro =
    String(
        filtroAtual || 'todos'
    ).toLowerCase();


let resultado =
    [...produtos];


// --------------------------------------------------------
// TODOS
// --------------------------------------------------------

if (
    filtro === 'todos'
) {

    return resultado;

}


// --------------------------------------------------------
// IMPORTADOS
// --------------------------------------------------------

if (
    filtro === 'importados'
) {

    return resultado.filter(
        function(produto) {

            return produto.importado === true;

        }
    );

}


// --------------------------------------------------------
// NÃO IMPORTADOS
// --------------------------------------------------------

if (
    filtro === 'nao-importados' ||
    filtro === 'nao_importados' ||
    filtro === 'naoimportados'
) {

    return resultado.filter(
        function(produto) {

            return produto.importado !== true;

        }
    );

}


// --------------------------------------------------------
// ATIVOS
// --------------------------------------------------------

if (
    filtro === 'ativos'
) {

    return resultado.filter(
        function(produto) {

            return (
                produto.importado === true &&
                produto.ativo === true
            );

        }
    );

}


// --------------------------------------------------------
// INATIVOS
// --------------------------------------------------------

if (
    filtro === 'inativos'
) {

    return resultado.filter(
        function(produto) {

            return (
                produto.importado === true &&
                produto.ativo !== true
            );

        }
    );

}


return resultado;


}

// ============================================================
// 15. APLICAR BUSCA
// ============================================================

function aplicarBuscaProdutos(
produtos
) {


const termo =
    String(
        termoBuscaAtual || ''
    )
    .trim()
    .toLowerCase();


if (!termo) {

    return produtos;

}


return produtos.filter(
    function(produto) {

        const nome =
            String(
                produto.nome || ''
            ).toLowerCase();


        const itemId =
            String(
                produto.mercado_livre_item_id || ''
            ).toLowerCase();


        const sku =
            String(
                produto.sku || ''
            ).toLowerCase();


        return (
            nome.includes(termo) ||
            itemId.includes(termo) ||
            sku.includes(termo)
        );

    }
);


}

// ============================================================
// 16. OBTER PRODUTOS VISÍVEIS
// ============================================================

function obterProdutosVisiveis() {


const filtrados =
    aplicarFiltroProdutos(
        produtosMercadoLivre
    );


return aplicarBuscaProdutos(
    filtrados
);


}

// ============================================================
// 17. RENDERIZAR PRODUTOS
// ============================================================

function renderizarProdutos() {


const lista =
    obterElemento(
        'lista-produtos'
    );


if (!lista) {

    return;

}


const produtos =
    obterProdutosVisiveis();


console.log(
    'Produtos visíveis:',
    produtos.length,
    'Filtro:',
    filtroAtual,
    'Busca:',
    termoBuscaAtual
);


lista.innerHTML =
    '';


if (
    produtos.length === 0
) {

    esconderMensagem();


    let titulo =
        'Nenhum produto encontrado';


    let descricao =
        'Não existem produtos para este filtro.';


    if (
        filtroAtual === 'inativos'
    ) {

        titulo =
            'Nenhum produto inativo';

        descricao =
            'Todos os produtos importados estão ativos no ZoraVision.';

    }


    if (
        filtroAtual === 'ativos'
    ) {

        titulo =
            'Nenhum produto ativo';

        descricao =
            'Não existem produtos importados ativos no ZoraVision.';

    }


    if (
        filtroAtual === 'importados'
    ) {

        titulo =
            'Nenhum produto importado';

        descricao =
            'Nenhum anúncio do Mercado Livre foi importado para o ZoraVision.';

    }


    if (
        filtroAtual === 'nao-importados' ||
        filtroAtual === 'nao_importados'
    ) {

        titulo =
            'Nenhum produto pendente de importação';

        descricao =
            'Todos os anúncios encontrados já foram importados.';

    }


    if (
        termoBuscaAtual
    ) {

        titulo =
            'Nenhum produto encontrado';

        descricao =
            'Nenhum produto corresponde à sua busca.';

    }


    lista.innerHTML =
        `
        <div class="produtos-vazio">

            <div class="produtos-vazio-icone">
                📦
            </div>

            <h2>
                ${titulo}
            </h2>

            <p>
                ${descricao}
            </p>

        </div>
        `;


    atualizarContadorSelecionados();

    return;

}


const fragmento =
    document.createDocumentFragment();


produtos.forEach(
    function(produto) {

        const card =
            criarCardProduto(
                produto
            );


        fragmento.appendChild(
            card
        );

    }
);


lista.appendChild(
    fragmento
);


atualizarContadorSelecionados();


}

// ============================================================
// 18. CRIAR CARD
// ============================================================

function criarCardProduto(
produto
) {


const card =
    document.createElement(
        'article'
    );


card.className =
    'produto-mercado-livre-card';


if (
    produto.importado === true
) {

    card.classList.add(
        'produto-importado'
    );

} else {

    card.classList.add(
        'produto-nao-importado'
    );

}


if (
    produto.ativo === true
) {

    card.classList.add(
        'produto-ativo'
    );

} else if (
    produto.importado === true
) {

    card.classList.add(
        'produto-inativo'
    );

}


card.dataset.produtoId =
    produto.produto_id || '';


card.dataset.itemId =
    produto.mercado_livre_item_id || '';


// ========================================================
// SELEÇÃO
// ========================================================

const areaSelecao =
    document.createElement(
        'div'
    );


areaSelecao.className =
    'produto-selecao';


const checkbox =
    document.createElement(
        'input'
    );


checkbox.type =
    'checkbox';


checkbox.className =
    'produto-checkbox';


checkbox.value =
    produto.produto_id ||
    produto.mercado_livre_item_id ||
    '';


checkbox.dataset.itemId =
    produto.mercado_livre_item_id ||
    '';


checkbox.dataset.produtoId =
    produto.produto_id ||
    '';


areaSelecao.appendChild(
    checkbox
);


// ========================================================
// IMAGEM
// ========================================================

const areaImagem =
    document.createElement(
        'div'
    );


areaImagem.className =
    'produto-imagem';


if (
    produto.imagem_url
) {

    const imagem =
        document.createElement(
            'img'
        );


    imagem.src =
        produto.imagem_url;


    imagem.alt =
        produto.nome ||
        'Produto';


    imagem.loading =
        'lazy';


    imagem.onerror =
        function() {

            areaImagem.innerHTML =
                '<span>Sem imagem</span>';

        };


    areaImagem.appendChild(
        imagem
    );

} else {

    areaImagem.innerHTML =
        '<span>Sem imagem</span>';

}


// ========================================================
// INFORMAÇÕES
// ========================================================

const informacoes =
    document.createElement(
        'div'
    );


informacoes.className =
    'produto-informacoes';


const titulo =
    document.createElement(
        'h3'
    );


titulo.textContent =
    produto.nome ||
    'Produto sem nome';


const itemId =
    document.createElement(
        'p'
    );


itemId.className =
    'produto-item-id';


itemId.textContent =
    'Mercado Livre: ' +
    (
        produto.mercado_livre_item_id ||
        'Não informado'
    );


const sku =
    document.createElement(
        'p'
    );


sku.className =
    'produto-sku';


sku.textContent =
    'SKU: ' +
    (
        produto.sku ||
        'Não informado'
    );


const preco =
    document.createElement(
        'strong'
    );


preco.className =
    'produto-preco';


preco.textContent =
    formatarPreco(
        produto.preco
    );


const estoque =
    document.createElement(
        'span'
    );


estoque.className =
    'produto-estoque';


estoque.textContent =
    'Estoque: ' +
    (
        produto.estoque ??
        0
    );


informacoes.appendChild(
    titulo
);


informacoes.appendChild(
    itemId
);


informacoes.appendChild(
    sku
);


informacoes.appendChild(
    preco
);


informacoes.appendChild(
    estoque
);


// ========================================================
// STATUS
// ========================================================

const areaStatus =
    document.createElement(
        'div'
    );


areaStatus.className =
    'produto-status-area';


// --------------------------------------------------------
// STATUS IMPORTAÇÃO
// --------------------------------------------------------

const statusImportacao =
    document.createElement(
        'div'
    );


statusImportacao.className =
    'produto-status-importacao';


if (
    produto.importado === true
) {

    statusImportacao.appendChild(
        criarBadgeStatus(
            'Importado',
            'status-importado'
        )
    );

} else {

    statusImportacao.appendChild(
        criarBadgeStatus(
            'Não importado',
            'status-nao-importado'
        )
    );

}


// --------------------------------------------------------
// STATUS SITE
// --------------------------------------------------------

const statusSite =
    document.createElement(
        'div'
    );


statusSite.className =
    'produto-status-site';


if (
    produto.importado === true
) {

    if (
        produto.ativo === true
    ) {

        statusSite.appendChild(
            criarBadgeStatus(
                'Ativo no site',
                'status-ativo'
            )
        );

    } else {

        statusSite.appendChild(
            criarBadgeStatus(
                'Inativo no site',
                'status-inativo'
            )
        );

    }

}


// --------------------------------------------------------
// STATUS MERCADO LIVRE
// --------------------------------------------------------

const statusMercadoLivre =
    document.createElement(
        'div'
    );


statusMercadoLivre.className =
    'produto-status-mercado-livre';


statusMercadoLivre.appendChild(
    criarBadgeStatus(
        textoStatusMercadoLivre(
            obterStatusMercadoLivre(
                produto
            )
        ),
        'status-mercado-livre'
    )
);


areaStatus.appendChild(
    statusImportacao
);


areaStatus.appendChild(
    statusSite
);


areaStatus.appendChild(
    statusMercadoLivre
);


// ========================================================
// AÇÕES
// ========================================================

const areaAcoes =
    document.createElement(
        'div'
    );


areaAcoes.className =
    'produto-acoes';


// --------------------------------------------------------
// NÃO IMPORTADO
// --------------------------------------------------------

if (
    produto.importado !== true
) {

    const botaoImportar =
        document.createElement(
            'button'
        );


    botaoImportar.type =
        'button';


    botaoImportar.className =
        'btn-produto-acao btn-importar';


    botaoImportar.textContent =
        'Importar';


    botaoImportar.addEventListener(
        'click',
        function() {

            importarProdutoIndividual(
                produto,
                botaoImportar
            );

        }
    );


    areaAcoes.appendChild(
        botaoImportar
    );

}


// --------------------------------------------------------
// IMPORTADO E ATIVO
// --------------------------------------------------------

if (
    produto.importado === true &&
    produto.ativo === true
) {

    const botaoInativar =
        document.createElement(
            'button'
        );


    botaoInativar.type =
        'button';


    botaoInativar.className =
        'btn-produto-acao btn-inativar';


    botaoInativar.textContent =
        'Inativar';


    botaoInativar.addEventListener(
        'click',
        function() {

            inativarProduto(
                produto.produto_id,
                botaoInativar
            );

        }
    );


    areaAcoes.appendChild(
        botaoInativar
    );

}


// --------------------------------------------------------
// IMPORTADO E INATIVO
// --------------------------------------------------------

if (
    produto.importado === true &&
    produto.ativo !== true
) {

    const botaoAtivar =
        document.createElement(
            'button'
        );


    botaoAtivar.type =
        'button';


    botaoAtivar.className =
        'btn-produto-acao btn-ativar';


    botaoAtivar.textContent =
        'Ativar';


    botaoAtivar.addEventListener(
        'click',
        function() {

            ativarProduto(
                produto.produto_id,
                botaoAtivar
            );

        }
    );


    areaAcoes.appendChild(
        botaoAtivar
    );

}


// ========================================================
// MONTAR CARD
// ========================================================

card.appendChild(
    areaSelecao
);


card.appendChild(
    areaImagem
);


card.appendChild(
    informacoes
);


card.appendChild(
    areaStatus
);


card.appendChild(
    areaAcoes
);


// ========================================================
// SELEÇÃO
// ========================================================

checkbox.addEventListener(
    'change',
    function() {

        if (
            checkbox.checked
        ) {

            card.classList.add(
                'produto-selecionado'
            );

        } else {

            card.classList.remove(
                'produto-selecionado'
            );

        }


        atualizarContadorSelecionados();

    }
);


return card;


}

// ============================================================
// 19. ALTERAR STATUS DO PRODUTO
// ============================================================

async function alterarStatusProduto(
produtoId,
novoStatus,
botao
) {


const supabase =
    obterSupabaseProdutosMercadoLivre();


if (!supabase) {

    alert(
        'Não foi possível conectar ao Supabase.'
    );

    return;

}


if (!produtoId) {

    alert(
        'ID do produto não encontrado.'
    );

    return;

}


const produtoAtivo =
    novoStatus === true;


const textoOriginal =
    botao
        ? botao.textContent
        : '';


try {

    if (botao) {

        botao.disabled =
            true;


        botao.textContent =
            produtoAtivo
                ? 'Ativando...'
                : 'Inativando...';

    }


    const resultado =
        await supabase
            .from('produtos')
            .update({
                ativo:
                    produtoAtivo
            })
            .eq(
                'id',
                produtoId
            );


    if (
        resultado.error
    ) {

        throw resultado.error;

    }


    // Atualizar estado local imediatamente
    produtosMercadoLivre.forEach(
        function(produto) {

            if (
                String(
                    produto.produto_id
                ) === String(
                    produtoId
                )
            ) {

                produto.ativo =
                    produtoAtivo;

            }

        }
    );


    renderizarProdutos();

    atualizarResumoProdutos(
        produtosMercadoLivre
    );


} catch (erro) {

    console.error(
        'Erro ao alterar status:',
        erro
    );


    alert(
        'Não foi possível alterar o status do produto.\n\n' +
        (
            erro?.message ||
            'Erro desconhecido.'
        )
    );


    if (botao) {

        botao.disabled =
            false;


        botao.textContent =
            textoOriginal;

    }

}


}

// ============================================================
// 20. INATIVAR
// ============================================================

async function inativarProduto(
produtoId,
botao
) {


const confirmar =
    confirm(
        'Deseja inativar este produto no ZoraVision?\n\n' +
        'O produto não será excluído. Ele continuará cadastrado e poderá ser ativado novamente.'
    );


if (!confirmar) {

    return;

}


await alterarStatusProduto(
    produtoId,
    false,
    botao
);


}

// ============================================================
// 21. ATIVAR
// ============================================================

async function ativarProduto(
produtoId,
botao
) {


const confirmar =
    confirm(
        'Deseja ativar este produto no ZoraVision?\n\n' +
        'O produto voltará a ficar disponível no site.'
    );


if (!confirmar) {

    return;

}


await alterarStatusProduto(
    produtoId,
    true,
    botao
);


}

// ============================================================
// 22. IMPORTAR PRODUTO INDIVIDUAL
// ============================================================

async function importarProdutoIndividual(
produto,
botao
) {


if (
    !produto.mercado_livre_item_id
) {

    alert(
        'ID do anúncio do Mercado Livre não encontrado.'
    );

    return;

}


const confirmar =
    confirm(
        'Deseja importar este produto para o ZoraVision?\n\n' +
        (
            produto.nome ||
            'Produto'
        )
    );


if (!confirmar) {

    return;

}


const textoOriginal =
    botao.textContent;


try {

    botao.disabled =
        true;


    botao.textContent =
        'Importando...';


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
                    JSON.stringify({

                        produtos: [

                            {

                                produto_id:
                                    produto.produto_id ||
                                    null,

                                mercado_livre_item_id:
                                    produto.mercado_livre_item_id

                            }

                        ]

                    })

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

    } catch {

        resultado =
            null;

    }


    if (
        !resposta.ok
    ) {

        throw new Error(
            resultado?.erro ||
            resultado?.error ||
            'Não foi possível importar o produto.'
        );

    }


    alert(
        'Produto importado com sucesso.'
    );


    await carregarProdutosMercadoLivre();


} catch (erro) {

    console.error(
        'Erro ao importar produto:',
        erro
    );


    alert(
        'Não foi possível importar o produto.\n\n' +
        (
            erro?.message ||
            'Erro desconhecido.'
        )
    );


    botao.disabled =
        false;


    botao.textContent =
        textoOriginal;

}


}

// ============================================================
// 23. ATUALIZAR RESUMO
// ============================================================

function atualizarResumoProdutos(
produtos,
resumoEdge
) {


const total =
    produtos.length;


const importados =
    produtos.filter(
        function(produto) {

            return produto.importado === true;

        }
    ).length;


const naoImportados =
    produtos.filter(
        function(produto) {

            return produto.importado !== true;

        }
    ).length;


const ativos =
    produtos.filter(
        function(produto) {

            return (
                produto.importado === true &&
                produto.ativo === true
            );

        }
    ).length;


const inativos =
    produtos.filter(
        function(produto) {

            return (
                produto.importado === true &&
                produto.ativo !== true
            );

        }
    ).length;


const elementos = {

    total:
        obterElemento(
            'total-produtos'
        ),

    importados:
        obterElemento(
            'total-importados'
        ),

    naoImportados:
        obterElemento(
            'total-nao-importados'
        ),

    ativos:
        obterElemento(
            'total-ativos'
        ),

    inativos:
        obterElemento(
            'total-inativos'
        )

};


if (
    elementos.total
) {

    elementos.total.textContent =
        total;

}


if (
    elementos.importados
) {

    elementos.importados.textContent =
        importados;

}


if (
    elementos.naoImportados
) {

    elementos.naoImportados.textContent =
        naoImportados;

}


if (
    elementos.ativos
) {

    elementos.ativos.textContent =
        ativos;

}


if (
    elementos.inativos
) {

    elementos.inativos.textContent =
        inativos;

}


const contador =
    obterElemento(
        'contador-produtos'
    );


if (
    contador
) {

    if (
        filtroAtual === 'inativos'
    ) {

        contador.textContent =
            inativos +
            (
                inativos === 1
                    ? ' produto inativo'
                    : ' produtos inativos'
            );

    } else if (
        filtroAtual === 'ativos'
    ) {

        contador.textContent =
            ativos +
            (
                ativos === 1
                    ? ' produto ativo'
                    : ' produtos ativos'
            );

    } else if (
        filtroAtual === 'importados'
    ) {

        contador.textContent =
            importados +
            (
                importados === 1
                    ? ' produto importado'
                    : ' produtos importados'
            );

    } else if (
        filtroAtual === 'nao-importados' ||
        filtroAtual === 'nao_importados'
    ) {

        contador.textContent =
            naoImportados +
            (
                naoImportados === 1
                    ? ' produto não importado'
                    : ' produtos não importados'
            );

    } else {

        contador.textContent =
            total +
            (
                total === 1
                    ? ' produto encontrado'
                    : ' produtos encontrados'
            );

    }

}


}

// ============================================================
// 24. CONTADOR SELECIONADOS
// ============================================================

function atualizarContadorSelecionados() {


const checkboxes =
    document.querySelectorAll(
        '.produto-checkbox:checked'
    );


const contador =
    obterElemento(
        'total-selecionados'
    );


if (
    contador
) {

    contador.textContent =
        checkboxes.length;

}


const contadorProdutos =
    obterElemento(
        'contador-produtos'
    );


if (
    contadorProdutos &&
    checkboxes.length > 0
) {

    contadorProdutos.textContent =
        checkboxes.length +
        (
            checkboxes.length === 1
                ? ' produto selecionado'
                : ' produtos selecionados'
        );

}


const botao =
    obterElemento(
        'btn-sincronizar-selecionados'
    ) ||
    obterElemento(
        'btn-importar-selecionados'
    );


if (
    botao
) {

    botao.disabled =
        checkboxes.length === 0;

}


atualizarEstadoCheckboxTodos();


}

// ============================================================
// 25. CHECKBOX TODOS
// ============================================================

function atualizarEstadoCheckboxTodos() {


const checkboxTodos =
    obterElemento(
        'checkbox-selecionar-todos'
    );


if (!checkboxTodos) {

    return;

}


const todos =
    document.querySelectorAll(
        '.produto-checkbox'
    );


const selecionados =
    document.querySelectorAll(
        '.produto-checkbox:checked'
    );


if (
    todos.length === 0
) {

    checkboxTodos.checked =
        false;


    checkboxTodos.indeterminate =
        false;


    return;

}


checkboxTodos.checked =
    selecionados.length === todos.length;


checkboxTodos.indeterminate =
    selecionados.length > 0 &&
    selecionados.length < todos.length;


}

// ============================================================
// 26. SELECIONAR TODOS
// ============================================================

function selecionarTodosProdutos() {


const checkboxes =
    document.querySelectorAll(
        '.produto-checkbox'
    );


checkboxes.forEach(
    function(checkbox) {

        checkbox.checked =
            true;


        const card =
            checkbox.closest(
                '.produto-mercado-livre-card'
            );


        if (card) {

            card.classList.add(
                'produto-selecionado'
            );

        }

    }
);


atualizarContadorSelecionados();


}

// ============================================================
// 27. DESMARCAR TODOS
// ============================================================

function desmarcarTodosProdutos() {


const checkboxes =
    document.querySelectorAll(
        '.produto-checkbox'
    );


checkboxes.forEach(
    function(checkbox) {

        checkbox.checked =
            false;


        const card =
            checkbox.closest(
                '.produto-mercado-livre-card'
            );


        if (card) {

            card.classList.remove(
                'produto-selecionado'
            );

        }

    }
);


const checkboxTodos =
    obterElemento(
        'checkbox-selecionar-todos'
    );


if (
    checkboxTodos
) {

    checkboxTodos.checked =
        false;


    checkboxTodos.indeterminate =
        false;

}


atualizarContadorSelecionados();


}

// ============================================================
// 28. ALTERNAR SELEÇÃO
// ============================================================

function alternarSelecaoTodos() {


const checkboxTodos =
    obterElemento(
        'checkbox-selecionar-todos'
    );


if (!checkboxTodos) {

    return;

}


if (
    checkboxTodos.checked
) {

    selecionarTodosProdutos();

} else {

    desmarcarTodosProdutos();

}


}

// ============================================================
// 29. PRODUTOS SELECIONADOS
// ============================================================

function obterProdutosSelecionados() {


const checkboxes =
    document.querySelectorAll(
        '.produto-checkbox:checked'
    );


const produtos =
    [];


checkboxes.forEach(
    function(checkbox) {

        produtos.push({

            produto_id:
                checkbox.dataset.produtoId ||
                null,

            mercado_livre_item_id:
                checkbox.dataset.itemId ||
                null

        });

    }
);


return produtos;


}

// ============================================================
// 30. SINCRONIZAR PRODUTOS
// ============================================================

async function sincronizarProdutosSelecionados() {


const produtos =
    obterProdutosSelecionados();


if (
    produtos.length === 0
) {

    alert(
        'Selecione pelo menos um produto.'
    );

    return;

}


const confirmar =
    confirm(
        'Você selecionou ' +
        produtos.length +
        ' produto(s).\n\n' +
        'Deseja importar/sincronizar os produtos selecionados?'
    );


if (!confirmar) {

    return;

}


const botao =
    obterElemento(
        'btn-sincronizar-selecionados'
    ) ||
    obterElemento(
        'btn-importar-selecionados'
    );


const textoOriginal =
    botao
        ? botao.textContent
        : '';


try {

    if (botao) {

        botao.disabled =
            true;


        botao.textContent =
            'Sincronizando...';

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
                    JSON.stringify({

                        produtos:
                            produtos

                    })

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

    } catch {

        resultado =
            null;

    }


    if (
        !resposta.ok
    ) {

        throw new Error(
            resultado?.erro ||
            resultado?.error ||
            'Erro ao sincronizar produtos.'
        );

    }


    alert(
        'Sincronização concluída.\n\n' +
        'Encontrados: ' +
        (
            resultado?.total_encontrados ||
            0
        ) +
        '\n' +
        'Criados: ' +
        (
            resultado?.criados ||
            0
        ) +
        '\n' +
        'Atualizados: ' +
        (
            resultado?.atualizados ||
            0
        ) +
        '\n' +
        'Erros: ' +
        (
            resultado?.erros ||
            0
        )
    );


    desmarcarTodosProdutos();


    await carregarProdutosMercadoLivre();


} catch (erro) {

    console.error(
        'Erro na sincronização:',
        erro
    );


    alert(
        'Não foi possível sincronizar os produtos.\n\n' +
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
            textoOriginal ||
            'Importar selecionados';

    }


    atualizarContadorSelecionados();

}


}

// ============================================================
// 31. FILTRO DE STATUS
// ============================================================

function configurarFiltroStatus() {


const filtro =
    obterElemento(
        'filtro-status-produtos'
    );


if (!filtro) {

    console.warn(
        'Filtro filtro-status-produtos não encontrado.'
    );

    return;

}


if (
    filtro.dataset.configurado === 'true'
) {

    return;

}


filtro.dataset.configurado =
    'true';


filtro.addEventListener(
    'change',
    function() {

        filtroAtual =
            String(
                filtro.value ||
                'todos'
            )
            .toLowerCase();


        console.log(
            'Filtro alterado para:',
            filtroAtual
        );


        // ------------------------------------------------
        // IMPORTANTE:
        // Não recarrega a página.
        // Apenas renderiza novamente os produtos
        // já consultados.
        // ------------------------------------------------

        renderizarProdutos();


        atualizarResumoProdutos(
            produtosMercadoLivre
        );


        atualizarContadorSelecionados();

    }
);


filtroAtual =
    String(
        filtro.value ||
        'todos'
    )
    .toLowerCase();


}

// ============================================================
// 32. BUSCA
// ============================================================

function configurarBuscaProdutos() {


const campoBusca =
    obterElemento(
        'campo-busca-produtos'
    );


if (!campoBusca) {

    console.warn(
        'Campo campo-busca-produtos não encontrado.'
    );

    return;

}


if (
    campoBusca.dataset.configurado === 'true'
) {

    return;

}


campoBusca.dataset.configurado =
    'true';


campoBusca.addEventListener(
    'input',
    function() {

        termoBuscaAtual =
            String(
                campoBusca.value ||
                ''
            );


        renderizarProdutos();

    }
);


}

// ============================================================
// 33. BOTÕES
// ============================================================

function configurarBotoesProdutos() {


// --------------------------------------------------------
// CHECKBOX TODOS
// --------------------------------------------------------

const checkboxTodos =
    obterElemento(
        'checkbox-selecionar-todos'
    );


if (
    checkboxTodos &&
    checkboxTodos.dataset.configurado !== 'true'
) {

    checkboxTodos.dataset.configurado =
        'true';


    checkboxTodos.addEventListener(
        'change',
        alternarSelecaoTodos
    );

}


// --------------------------------------------------------
// BOTÃO SELECIONAR TODOS
// --------------------------------------------------------

const botaoSelecionarTodos =
    obterElemento(
        'btn-selecionar-todos'
    );


if (
    botaoSelecionarTodos &&
    botaoSelecionarTodos.dataset.configurado !== 'true'
) {

    botaoSelecionarTodos.dataset.configurado =
        'true';


    botaoSelecionarTodos.addEventListener(
        'click',
        selecionarTodosProdutos
    );

}


// --------------------------------------------------------
// BOTÃO DESMARCAR TODOS
// --------------------------------------------------------

const botaoDesmarcarTodos =
    obterElemento(
        'btn-desmarcar-todos'
    );


if (
    botaoDesmarcarTodos &&
    botaoDesmarcarTodos.dataset.configurado !== 'true'
) {

    botaoDesmarcarTodos.dataset.configurado =
        'true';


    botaoDesmarcarTodos.addEventListener(
        'click',
        desmarcarTodosProdutos
    );

}


// --------------------------------------------------------
// BOTÃO IMPORTAR/SINCRONIZAR
// --------------------------------------------------------

const botaoSincronizar =
    obterElemento(
        'btn-sincronizar-selecionados'
    ) ||
    obterElemento(
        'btn-importar-selecionados'
    );


if (
    botaoSincronizar &&
    botaoSincronizar.dataset.configurado !== 'true'
) {

    botaoSincronizar.dataset.configurado =
        'true';


    botaoSincronizar.addEventListener(
        'click',
        sincronizarProdutosSelecionados
    );


    botaoSincronizar.disabled =
        true;

}


// --------------------------------------------------------
// BOTÃO ATUALIZAR
// --------------------------------------------------------

const botaoAtualizar =
    obterElemento(
        'btn-atualizar-produtos'
    );


if (
    botaoAtualizar &&
    botaoAtualizar.dataset.configurado !== 'true'
) {

    botaoAtualizar.dataset.configurado =
        'true';


    botaoAtualizar.addEventListener(
        'click',
        carregarProdutosMercadoLivre
    );

}


}

// ============================================================
// 34. INICIALIZAÇÃO
// ============================================================

document.addEventListener(
'DOMContentLoaded',
async function() {


    console.log(
        '============================================================'
    );


    console.log(
        'ZoraVision - Página de produtos Mercado Livre'
    );


    console.log(
        'Inicializando painel administrativo...'
    );


    console.log(
        '============================================================'
    );


    configurarFiltroStatus();


    configurarBuscaProdutos();


    configurarBotoesProdutos();


    await carregarProdutosMercadoLivre();


    console.log(
        'Inicialização concluída.'
    );

}


);

// ============================================================
// 35. FUNÇÕES GLOBAIS
// ============================================================

window.carregarProdutosMercadoLivre =
carregarProdutosMercadoLivre;

window.renderizarProdutos =
renderizarProdutos;

window.selecionarTodosProdutos =
selecionarTodosProdutos;

window.desmarcarTodosProdutos =
desmarcarTodosProdutos;

window.obterProdutosSelecionados =
obterProdutosSelecionados;

window.sincronizarProdutosSelecionados =
sincronizarProdutosSelecionados;

window.importarProdutoIndividual =
importarProdutoIndividual;

window.ativarProduto =
ativarProduto;

window.inativarProduto =
inativarProduto;

window.alterarStatusProduto =
alterarStatusProduto;
