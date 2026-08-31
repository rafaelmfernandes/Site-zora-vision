/* ============================================================
ZORAVISION - PRODUTOS DO MERCADO LIVRE
Arquivo:
Admin/mercadolivre-produtos.js

Compatível com:
Admin/mercadolivre-produtos.html

IMPORTANTE:
Os IDs utilizados neste JavaScript são exatamente os IDs
existentes no HTML:

filtro-status
campo-pesquisa
lista-produtos
total-produtos
total-importados
total-ativos
total-inativos
total-nao-importados
mensagem-produtos
checkbox-selecionar-todos
contador-produtos
btn-selecionar-todos
btn-desmarcar-todos
btn-sincronizar-selecionados
btn-atualizar-produtos
============================================================ */

/* ============================================================

1. CONFIGURAÇÕES
   ============================================================ */

const EDGE_FUNCTION_IMPORTAR =
'https://ratajxnxkjoiuknamacn.supabase.co/functions/v1/mercadolivre-importar-produtos';

/* ============================================================
2. ESTADO
============================================================ */

let produtosMercadoLivre = [];

let produtosFiltrados = [];

let carregandoProdutos = false;

/* ============================================================
3. OBTER SUPABASE
============================================================ */

function obterSupabaseProdutosMercadoLivre() {


if (
    window.supabaseClient
) {

    return window.supabaseClient;

}

if (
    window._supabase
) {

    return window._supabase;

}

if (
    typeof window.obterSupabase === 'function'
) {

    try {

        const cliente =
            window.obterSupabase();

        if (
            cliente
        ) {

            return cliente;

        }

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

/* ============================================================
4. OBTER ELEMENTO
============================================================ */

function obterElemento(id) {


return document.getElementById(id);


}

/* ============================================================
5. MENSAGEM
============================================================ */

function mostrarMensagem(
mensagem,
tipo = 'info'
) {


const elemento =
    obterElemento(
        'mensagem-produtos'
    );

if (
    !elemento
) {

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

/* ============================================================
6. ESCONDER MENSAGEM
============================================================ */

function esconderMensagem() {


const elemento =
    obterElemento(
        'mensagem-produtos'
    );

if (
    !elemento
) {

    return;

}

elemento.style.display =
    'none';


}

/* ============================================================
7. FORMATAR PREÇO
============================================================ */

function formatarPreco(valor) {


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

/* ============================================================
8. NORMALIZAR TEXTO
============================================================ */

function normalizarTexto(texto) {


return String(
    texto || ''
)
    .normalize('NFD')
    .replace(
        /[\u0300-\u036f]/g,
        ''
    )
    .toLowerCase()
    .trim();


}

/* ============================================================
9. STATUS MERCADO LIVRE
============================================================ */

function obterStatusMercadoLivre(produto) {


if (
    produto.status_mercado_livre
) {

    return String(
        produto.status_mercado_livre
    );

}

if (
    produto.ml_status
) {

    return String(
        produto.ml_status
    );

}

return 'importado';


}

/* ============================================================
10. TEXTO STATUS MERCADO LIVRE
============================================================ */

function textoStatusMercadoLivre(status) {


const valor =
    normalizarTexto(
        status
    );

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

return 'Importado do Mercado Livre';


}

/* ============================================================
11. CRIAR BADGE
============================================================ */

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

/* ============================================================
12. ALTERAR STATUS DO PRODUTO
============================================================ */

async function alterarStatusProduto(
produtoId,
novoStatus,
botao
) {


const supabase =
    obterSupabaseProdutosMercadoLivre();

if (
    !supabase
) {

    alert(
        'Não foi possível conectar ao Supabase.'
    );

    return;

}

if (
    !produtoId
) {

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

    if (
        botao
    ) {

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
                    produtoAtivo,

                updated_at:
                    new Date().toISOString()
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

    const produtoLocal =
        produtosMercadoLivre.find(
            produto =>
                String(produto.id) ===
                String(produtoId)
        );

    if (
        produtoLocal
    ) {

        produtoLocal.ativo =
            produtoAtivo;

    }

    mostrarMensagem(
        produtoAtivo
            ? 'Produto ativado com sucesso.'
            : 'Produto inativado com sucesso.',
        'sucesso'
    );

    aplicarFiltros();

} catch (erro) {

    console.error(
        'Erro ao alterar status do produto:',
        erro
    );

    alert(
        'Não foi possível alterar o status do produto.\n\n' +
        (
            erro?.message ||
            'Erro desconhecido.'
        )
    );

    if (
        botao
    ) {

        botao.disabled =
            false;

        botao.textContent =
            textoOriginal;

    }

}


}

/* ============================================================
13. INATIVAR PRODUTO
============================================================ */

async function inativarProduto(
produtoId,
botao
) {


const confirmar =
    confirm(
        'Deseja inativar este produto no ZoraVision?\n\n' +
        'O produto não será excluído. Ele continuará cadastrado no banco de dados e poderá ser ativado novamente.'
    );

if (
    !confirmar
) {

    return;

}

await alterarStatusProduto(
    produtoId,
    false,
    botao
);


}

/* ============================================================
14. ATIVAR PRODUTO
============================================================ */

async function ativarProduto(
produtoId,
botao
) {


const confirmar =
    confirm(
        'Deseja ativar este produto no ZoraVision?\n\n' +
        'O produto voltará a ficar disponível no site.'
    );

if (
    !confirmar
) {

    return;

}

await alterarStatusProduto(
    produtoId,
    true,
    botao
);


}

/* ============================================================
15. CRIAR CARD
============================================================ */

function criarCardProduto(produto) {


const card =
    document.createElement(
        'article'
    );

card.className =
    'produto-mercado-livre-card';

if (
    produto.ativo === true
) {

    card.classList.add(
        'produto-ativo'
    );

} else {

    card.classList.add(
        'produto-inativo'
    );

}

card.dataset.produtoId =
    produto.id || '';

card.dataset.itemId =
    produto.mercado_livre_item_id || '';


/* ========================================================
   SELEÇÃO
======================================================== */

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
    produto.id || '';

checkbox.dataset.itemId =
    produto.mercado_livre_item_id || '';

areaSelecao.appendChild(
    checkbox
);


/* ========================================================
   IMAGEM
======================================================== */

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


/* ========================================================
   INFORMAÇÕES
======================================================== */

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
        produto.estoque ?? 0
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


/* ========================================================
   STATUS
======================================================== */

const areaStatus =
    document.createElement(
        'div'
    );

areaStatus.className =
    'produto-status-area';

const statusSite =
    document.createElement(
        'div'
    );

statusSite.className =
    'produto-status-site';

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
    statusSite
);

areaStatus.appendChild(
    statusMercadoLivre
);


/* ========================================================
   AÇÕES
======================================================== */

const areaAcoes =
    document.createElement(
        'div'
    );

areaAcoes.className =
    'produto-acoes';

if (
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
                produto.id,
                botaoInativar
            );

        }
    );

    areaAcoes.appendChild(
        botaoInativar
    );

} else {

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
                produto.id,
                botaoAtivar
            );

        }
    );

    areaAcoes.appendChild(
        botaoAtivar
    );

}


/* ========================================================
   MONTAR CARD
======================================================== */

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


/* ========================================================
   CHECKBOX
======================================================== */

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

/* ============================================================
16. BUSCAR PRODUTOS IMPORTADOS
============================================================ */

async function buscarProdutosImportados() {


const supabase =
    obterSupabaseProdutosMercadoLivre();

if (
    !supabase
) {

    throw new Error(
        'Cliente Supabase não encontrado.'
    );

}

console.log(
    'Consultando produtos do Mercado Livre...'
);

const resultado =
    await supabase
        .from('produtos')
        .select(
            'id,nome,descricao,preco,preco_promocional,estoque,sku,imagem_url,ativo,destaque,created_at,updated_at,mercado_livre_item_id,status_mercado_livre,ml_status'
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

if (
    resultado.error
) {

    throw resultado.error;

}

return (
    resultado.data ||
    []
);


}

/* ============================================================
17. ATUALIZAR RESUMO
============================================================ */

function atualizarResumoProdutos() {


const totalImportados =
    produtosMercadoLivre.length;

const ativos =
    produtosMercadoLivre.filter(
        produto =>
            produto.ativo === true
    ).length;

const inativos =
    produtosMercadoLivre.filter(
        produto =>
            produto.ativo !== true
    ).length;

const naoImportados =
    Number(
        window.totalProdutosNaoImportados || 0
    );

const totalEncontrados =
    totalImportados +
    naoImportados;


const elementoTotal =
    obterElemento(
        'total-produtos'
    );

if (
    elementoTotal
) {

    elementoTotal.textContent =
        totalEncontrados;

}


const elementoImportados =
    obterElemento(
        'total-importados'
    );

if (
    elementoImportados
) {

    elementoImportados.textContent =
        totalImportados;

}


const elementoAtivos =
    obterElemento(
        'total-ativos'
    );

if (
    elementoAtivos
) {

    elementoAtivos.textContent =
        ativos;

}


const elementoInativos =
    obterElemento(
        'total-inativos'
    );

if (
    elementoInativos
) {

    elementoInativos.textContent =
        inativos;

}


const elementoNaoImportados =
    obterElemento(
        'total-nao-importados'
    );

if (
    elementoNaoImportados
) {

    elementoNaoImportados.textContent =
        naoImportados;

}


}

/* ============================================================
18. CONTADOR DE SELECIONADOS
============================================================ */

function atualizarContadorSelecionados() {


const checkboxes =
    document.querySelectorAll(
        '.produto-checkbox'
    );

const selecionados =
    document.querySelectorAll(
        '.produto-checkbox:checked'
    );

const quantidadeSelecionada =
    selecionados.length;

const contador =
    obterElemento(
        'contador-produtos'
    );

if (
    contador
) {

    if (
        quantidadeSelecionada === 0
    ) {

        contador.textContent =
            produtosFiltrados.length +
            (
                produtosFiltrados.length === 1
                    ? ' produto encontrado'
                    : ' produtos encontrados'
            );

    } else {

        contador.textContent =
            quantidadeSelecionada +
            (
                quantidadeSelecionada === 1
                    ? ' produto selecionado'
                    : ' produtos selecionados'
            );

    }

}

const botao =
    obterElemento(
        'btn-sincronizar-selecionados'
    );

if (
    botao
) {

    botao.disabled =
        quantidadeSelecionada === 0;

}

atualizarEstadoCheckboxTodos();


}

/* ============================================================
19. ESTADO DO CHECKBOX TODOS
============================================================ */

function atualizarEstadoCheckboxTodos() {


const checkboxTodos =
    obterElemento(
        'checkbox-selecionar-todos'
    );

if (
    !checkboxTodos
) {

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
    selecionados.length ===
    todos.length;

checkboxTodos.indeterminate =
    selecionados.length > 0 &&
    selecionados.length < todos.length;


}

/* ============================================================
20. SELECIONAR TODOS
============================================================ */

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

        if (
            card
        ) {

            card.classList.add(
                'produto-selecionado'
            );

        }

    }
);

atualizarContadorSelecionados();


}

/* ============================================================
21. DESMARCAR TODOS
============================================================ */

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

        if (
            card
        ) {

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

/* ============================================================
22. ALTERNAR SELEÇÃO TODOS
============================================================ */

function alternarSelecaoTodos() {


const checkboxTodos =
    obterElemento(
        'checkbox-selecionar-todos'
    );

if (
    !checkboxTodos
) {

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

/* ============================================================
23. OBTER PRODUTOS SELECIONADOS
============================================================ */

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
                checkbox.value,

            mercado_livre_item_id:
                checkbox.dataset.itemId

        });

    }
);

return produtos;


}

/* ============================================================
24. APLICAR FILTROS
============================================================ */

function aplicarFiltros() {


const filtro =
    obterElemento(
        'filtro-status'
    );

const campoPesquisa =
    obterElemento(
        'campo-pesquisa'
    );

const valorFiltro =
    filtro
        ? filtro.value
        : 'todos';

const pesquisa =
    campoPesquisa
        ? normalizarTexto(
            campoPesquisa.value
        )
        : '';

produtosFiltrados =
    produtosMercadoLivre.filter(
        function(produto) {

            let passaStatus =
                true;


            /* =================================================
               STATUS
            ================================================= */

            if (
                valorFiltro === 'todos'
            ) {

                passaStatus =
                    true;

            } else if (
                valorFiltro === 'importados'
            ) {

                passaStatus =
                    true;

            } else if (
                valorFiltro === 'ativos'
            ) {

                passaStatus =
                    produto.ativo === true;

            } else if (
                valorFiltro === 'inativos'
            ) {

                passaStatus =
                    produto.ativo !== true;

            } else if (
                valorFiltro === 'nao-importados'
            ) {

                passaStatus =
                    produto.__nao_importado === true;

            }


            if (
                !passaStatus
            ) {

                return false;

            }


            /* =================================================
               PESQUISA
            ================================================= */

            if (
                !pesquisa
            ) {

                return true;

            }

            const nome =
                normalizarTexto(
                    produto.nome
                );

            const sku =
                normalizarTexto(
                    produto.sku
                );

            const itemId =
                normalizarTexto(
                    produto.mercado_livre_item_id
                );

            return (
                nome.includes(pesquisa) ||
                sku.includes(pesquisa) ||
                itemId.includes(pesquisa)
            );

        }
    );


renderizarProdutos();


}

/* ============================================================
25. RENDERIZAR PRODUTOS
============================================================ */

function renderizarProdutos() {


const lista =
    obterElemento(
        'lista-produtos'
    );

if (
    !lista
) {

    console.error(
        'Elemento lista-produtos não encontrado.'
    );

    return;

}

lista.innerHTML =
    '';


if (
    produtosFiltrados.length === 0
) {

    const filtro =
        obterElemento(
            'filtro-status'
        );

    const valorFiltro =
        filtro
            ? filtro.value
            : 'todos';

    let titulo =
        'Nenhum produto encontrado';

    let descricao =
        'Não existem produtos correspondentes ao filtro selecionado.';


    if (
        valorFiltro === 'inativos'
    ) {

        titulo =
            'Nenhum produto inativo';

        descricao =
            'Todos os produtos importados estão ativos no ZoraVision.';

    }


    if (
        valorFiltro === 'ativos'
    ) {

        titulo =
            'Nenhum produto ativo';

        descricao =
            'Não existem produtos ativos no ZoraVision.';

    }


    if (
        valorFiltro === 'nao-importados'
    ) {

        titulo =
            'Nenhum produto pendente';

        descricao =
            'Todos os anúncios encontrados já foram importados.';

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

produtosFiltrados.forEach(
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

/* ============================================================
26. CARREGAR PRODUTOS
============================================================ */

async function carregarProdutosMercadoLivre() {


if (
    carregandoProdutos
) {

    return;

}

carregandoProdutos =
    true;

console.log(
    '============================================================'
);

console.log(
    'ZoraVision - Produtos Mercado Livre'
);

console.log(
    'Consultando produtos importados...'
);

console.log(
    '============================================================'
);


esconderMensagem();


const lista =
    obterElemento(
        'lista-produtos'
    );

if (
    !lista
) {

    console.error(
        'Elemento lista-produtos não encontrado.'
    );

    carregandoProdutos =
        false;

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
            Consultando os produtos importados...
        </p>

    </div>
    `;


try {

    produtosMercadoLivre =
        await buscarProdutosImportados();


    console.log(
        'Produtos importados encontrados:',
        produtosMercadoLivre.length
    );


    /*
     * Neste momento não existe uma consulta separada
     * aos anúncios do Mercado Livre para descobrir
     * pendentes.
     *
     * Portanto, os produtos pendentes ficam em zero
     * até que a integração de anúncios seja implementada.
     */

    window.totalProdutosNaoImportados =
        0;


    atualizarResumoProdutos();

    aplicarFiltros();


    console.log(
        'Produtos exibidos com sucesso.'
    );

} catch (erro) {

    console.error(
        'Erro ao carregar produtos:',
        erro
    );

    mostrarMensagem(
        'Não foi possível carregar os produtos.',
        'erro'
    );

    lista.innerHTML =
        `
        <div class="produtos-vazio">

            <div class="produtos-vazio-icone">
                ⚠️
            </div>

            <h2>
                Erro ao carregar produtos
            </h2>

            <p>
                Verifique a conexão com o Supabase
                e tente novamente.
            </p>

        </div>
        `;

} finally {

    carregandoProdutos =
        false;

}


}

/* ============================================================
27. SINCRONIZAR PRODUTOS SELECIONADOS
============================================================ */

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
        'Deseja sincronizar esses produtos com o Mercado Livre?'
    );

if (
    !confirmar
) {

    return;

}

const botao =
    obterElemento(
        'btn-sincronizar-selecionados'
    );

const textoOriginal =
    botao
        ? botao.textContent
        : 'Sincronizar selecionados';


try {

    if (
        botao
    ) {

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

    if (
        botao
    ) {

        botao.disabled =
            false;

        botao.textContent =
            textoOriginal;

    }

    atualizarContadorSelecionados();

}


}

/* ============================================================
28. CONFIGURAR FILTRO
============================================================ */

function configurarFiltroStatus() {


const filtro =
    obterElemento(
        'filtro-status'
    );

if (
    !filtro
) {

    console.error(
        'Elemento #filtro-status não encontrado no HTML.'
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

        console.log(
            'Filtro alterado:',
            filtro.value
        );

        aplicarFiltros();

    }
);

console.log(
    'Filtro #filtro-status configurado com sucesso.'
);


}

/* ============================================================
29. CONFIGURAR PESQUISA
============================================================ */

function configurarBuscaProdutos() {


const campo =
    obterElemento(
        'campo-pesquisa'
    );

if (
    !campo
) {

    console.error(
        'Elemento #campo-pesquisa não encontrado no HTML.'
    );

    return;

}

if (
    campo.dataset.configurado === 'true'
) {

    return;

}

campo.dataset.configurado =
    'true';

campo.addEventListener(
    'input',
    function() {

        aplicarFiltros();

    }
);

console.log(
    'Campo #campo-pesquisa configurado com sucesso.'
);


}

/* ============================================================
30. CONFIGURAR BOTÕES
============================================================ */

function configurarBotoesProdutos() {


/* ========================================================
   CHECKBOX SELECIONAR TODOS
======================================================== */

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


/* ========================================================
   BOTÃO SELECIONAR TODOS
======================================================== */

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


/* ========================================================
   BOTÃO DESMARCAR TODOS
======================================================== */

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


/* ========================================================
   BOTÃO SINCRONIZAR
======================================================== */

const botaoSincronizar =
    obterElemento(
        'btn-sincronizar-selecionados'
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


/* ========================================================
   BOTÃO ATUALIZAR
======================================================== */

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
        async function() {

            await carregarProdutosMercadoLivre();

        }
    );

}


}

/* ============================================================
31. INICIALIZAÇÃO
============================================================ */

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

/* ============================================================
32. FUNÇÕES GLOBAIS
============================================================ */

window.carregarProdutosMercadoLivre =
carregarProdutosMercadoLivre;

window.selecionarTodosProdutos =
selecionarTodosProdutos;

window.desmarcarTodosProdutos =
desmarcarTodosProdutos;

window.obterProdutosSelecionados =
obterProdutosSelecionados;

window.sincronizarProdutosSelecionados =
sincronizarProdutosSelecionados;

window.ativarProduto =
ativarProduto;

window.inativarProduto =
inativarProduto;

window.alterarStatusProduto =
alterarStatusProduto;

window.aplicarFiltros =
aplicarFiltros;

/* ============================================================
FIM DO ARQUIVO
============================================================ */
