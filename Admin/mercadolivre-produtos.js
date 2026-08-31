/* ============================================================
ZORAVISION
PRODUTOS DO MERCADO LIVRE

Arquivo:
Admin/mercadolivre-produtos.js

Compatível com:
Admin/mercadolivre-produtos.html

IMPORTANTE:
Este arquivo utiliza somente colunas existentes em produtos:
id
nome
descricao
preco
preco_promocional
estoque
sku
imagem_url
ativo
destaque
created_at
updated_at
mercado_livre_item_id
============================================================ */

/* ============================================================

1. CONFIGURAÇÃO
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
3. SUPABASE
============================================================ */

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

/* ============================================================
4. ELEMENTOS
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

/* ============================================================
6. FORMATAÇÃO
============================================================ */

function formatarPreco(valor) {


const numero =
    Number(valor || 0);

return numero.toLocaleString(
    'pt-BR',
    {
        style: 'currency',
        currency: 'BRL'
    }
);


}

function normalizarTexto(texto) {


return String(texto || '')
    .normalize('NFD')
    .replace(
        /[\u0300-\u036f]/g,
        ''
    )
    .toLowerCase()
    .trim();


}

/* ============================================================
7. CARREGAR PRODUTOS
============================================================ */

async function buscarProdutosImportados() {


const supabase =
    obterSupabaseProdutosMercadoLivre();

if (!supabase) {
    throw new Error(
        'Cliente Supabase não encontrado.'
    );
}

console.log(
    'Consultando produtos importados...'
);

const resultado =
    await supabase
        .from('produtos')
        .select(
            'id,nome,descricao,preco,preco_promocional,estoque,sku,imagem_url,ativo,destaque,created_at,updated_at,mercado_livre_item_id'
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
    throw resultado.error;
}

return resultado.data || [];


}

/* ============================================================
8. RESUMO
============================================================ */

function atualizarResumoProdutos() {


const total =
    produtosMercadoLivre.length;

const importados =
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


const totalElemento =
    obterElemento(
        'total-produtos'
    );

const importadosElemento =
    obterElemento(
        'total-importados'
    );

const ativosElemento =
    obterElemento(
        'total-ativos'
    );

const inativosElemento =
    obterElemento(
        'total-inativos'
    );


if (totalElemento) {
    totalElemento.textContent =
        total;
}

if (importadosElemento) {
    importadosElemento.textContent =
        importados;
}

if (ativosElemento) {
    ativosElemento.textContent =
        ativos;
}

if (inativosElemento) {
    inativosElemento.textContent =
        inativos;
}


}

/* ============================================================
9. STATUS
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
10. ALTERAR STATUS
============================================================ */

async function alterarStatusProduto(
produtoId,
novoStatus,
botao
) {


const supabase =
    obterSupabaseProdutosMercadoLivre();

if (!supabase) {

    alert(
        'Supabase não está disponível.'
    );

    return;
}

if (!produtoId) {

    alert(
        'ID do produto não encontrado.'
    );

    return;
}


const textoOriginal =
    botao
        ? botao.textContent
        : '';


try {

    if (botao) {

        botao.disabled =
            true;

        botao.textContent =
            novoStatus
                ? 'Ativando...'
                : 'Inativando...';
    }


    const resultado =
        await supabase
            .from('produtos')
            .update({
                ativo: novoStatus,
                updated_at:
                    new Date().toISOString()
            })
            .eq(
                'id',
                produtoId
            );


    if (resultado.error) {
        throw resultado.error;
    }


    const produto =
        produtosMercadoLivre.find(
            item =>
                String(item.id) ===
                String(produtoId)
        );


    if (produto) {
        produto.ativo =
            novoStatus;
    }


    atualizarResumoProdutos();

    aplicarFiltros();


    mostrarMensagem(
        novoStatus
            ? 'Produto ativado com sucesso.'
            : 'Produto inativado com sucesso.',
        'sucesso'
    );


} catch (erro) {

    console.error(
        'Erro ao alterar status:',
        erro
    );


    alert(
        'Não foi possível alterar o status.\n\n' +
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

/* ============================================================
11. ATIVAR
============================================================ */

async function ativarProduto(
produtoId,
botao
) {


const confirmar =
    confirm(
        'Deseja ativar este produto no ZoraVision?'
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

/* ============================================================
12. INATIVAR
============================================================ */

async function inativarProduto(
produtoId,
botao
) {


const confirmar =
    confirm(
        'Deseja inativar este produto no ZoraVision?\n\nO produto não será excluído.'
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

/* ============================================================
13. CARD
============================================================ */

function criarCardProduto(produto) {


const card =
    document.createElement(
        'article'
    );

card.className =
    'produto-mercado-livre-card';


if (produto.ativo === true) {

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


/* --------------------------------------------------------
   CHECKBOX
-------------------------------------------------------- */

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


areaSelecao.appendChild(
    checkbox
);


/* --------------------------------------------------------
   IMAGEM
-------------------------------------------------------- */

const areaImagem =
    document.createElement(
        'div'
    );

areaImagem.className =
    'produto-imagem';


if (produto.imagem_url) {

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


/* --------------------------------------------------------
   INFORMAÇÕES
-------------------------------------------------------- */

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
        produto.preco_promocional ||
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


/* --------------------------------------------------------
   STATUS
-------------------------------------------------------- */

const areaStatus =
    document.createElement(
        'div'
    );

areaStatus.className =
    'produto-status-area';


if (produto.ativo === true) {

    areaStatus.appendChild(
        criarBadgeStatus(
            'Ativo no site',
            'status-ativo'
        )
    );

} else {

    areaStatus.appendChild(
        criarBadgeStatus(
            'Inativo no site',
            'status-inativo'
        )
    );
}


if (produto.mercado_livre_item_id) {

    areaStatus.appendChild(
        criarBadgeStatus(
            'Mercado Livre',
            'status-mercado-livre'
        )
    );
}


/* --------------------------------------------------------
   AÇÕES
-------------------------------------------------------- */

const areaAcoes =
    document.createElement(
        'div'
    );

areaAcoes.className =
    'produto-acoes';


if (produto.ativo === true) {

    const botao =
        document.createElement(
            'button'
        );

    botao.type =
        'button';

    botao.className =
        'btn-produto-acao btn-inativar';

    botao.textContent =
        'Inativar';


    botao.addEventListener(
        'click',
        function() {

            inativarProduto(
                produto.id,
                botao
            );

        }
    );


    areaAcoes.appendChild(
        botao
    );

} else {

    const botao =
        document.createElement(
            'button'
        );

    botao.type =
        'button';

    botao.className =
        'btn-produto-acao btn-ativar';

    botao.textContent =
        'Ativar';


    botao.addEventListener(
        'click',
        function() {

            ativarProduto(
                produto.id,
                botao
            );

        }
    );


    areaAcoes.appendChild(
        botao
    );
}


/* --------------------------------------------------------
   MONTAGEM
-------------------------------------------------------- */

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


/* --------------------------------------------------------
   CHECKBOX
-------------------------------------------------------- */

checkbox.addEventListener(
    'change',
    function() {

        card.classList.toggle(
            'produto-selecionado',
            checkbox.checked
        );

        atualizarContadorSelecionados();

    }
);


return card;


}

/* ============================================================
14. FILTROS
============================================================ */

function aplicarFiltros() {


const filtro =
    obterElemento(
        'filtro-status'
    );

const campo =
    obterElemento(
        'campo-pesquisa'
    );


const status =
    filtro
        ? filtro.value
        : 'todos';


const pesquisa =
    campo
        ? normalizarTexto(
            campo.value
        )
        : '';


produtosFiltrados =
    produtosMercadoLivre.filter(
        function(produto) {

            let passaStatus =
                true;


            if (
                status === 'ativos'
            ) {

                passaStatus =
                    produto.ativo === true;

            }


            if (
                status === 'inativos'
            ) {

                passaStatus =
                    produto.ativo !== true;

            }


            if (!passaStatus) {
                return false;
            }


            if (!pesquisa) {
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
15. RENDERIZAR
============================================================ */

function renderizarProdutos() {


const lista =
    obterElemento(
        'lista-produtos'
    );

if (!lista) {
    return;
}


lista.innerHTML =
    '';


if (
    produtosFiltrados.length === 0
) {

    lista.innerHTML = `
        <div class="produtos-vazio">

            <div class="produtos-vazio-icone">
                📦
            </div>

            <h2>
                Nenhum produto encontrado
            </h2>

            <p>
                Não existem produtos para os filtros selecionados.
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

        fragmento.appendChild(
            criarCardProduto(
                produto
            )
        );

    }
);


lista.appendChild(
    fragmento
);


atualizarContadorSelecionados();


}

/* ============================================================
16. CONTADOR
============================================================ */

function atualizarContadorSelecionados() {


const selecionados =
    document.querySelectorAll(
        '.produto-checkbox:checked'
    );


const quantidade =
    selecionados.length;


const contador =
    obterElemento(
        'contador-produtos'
    );


if (contador) {

    contador.textContent =
        quantidade === 0
            ? '0 produtos selecionados'
            : quantidade +
                (
                    quantidade === 1
                        ? ' produto selecionado'
                        : ' produtos selecionados'
                );
}


const botao =
    obterElemento(
        'btn-sincronizar-selecionados'
    );


if (botao) {

    botao.disabled =
        quantidade === 0;
}


atualizarEstadoCheckboxTodos();


}

/* ============================================================
17. CHECKBOX TODOS
============================================================ */

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


if (todos.length === 0) {

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
18. SELECIONAR TODOS
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


        if (card) {

            card.classList.add(
                'produto-selecionado'
            );
        }

    }
);


atualizarContadorSelecionados();


}

/* ============================================================
19. DESMARCAR TODOS
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


        if (card) {

            card.classList.remove(
                'produto-selecionado'
            );
        }

    }
);


atualizarContadorSelecionados();


}

/* ============================================================
20. ALTERNAR TODOS
============================================================ */

function alternarSelecaoTodos() {


const checkboxTodos =
    obterElemento(
        'checkbox-selecionar-todos'
    );


if (!checkboxTodos) {
    return;
}


if (checkboxTodos.checked) {

    selecionarTodosProdutos();

} else {

    desmarcarTodosProdutos();
}


}

/* ============================================================
21. PRODUTOS SELECIONADOS
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

        const produto =
            produtosMercadoLivre.find(
                item =>
                    String(item.id) ===
                    String(checkbox.value)
            );


        if (produto) {

            produtos.push({
                produto_id:
                    produto.id,

                mercado_livre_item_id:
                    produto.mercado_livre_item_id
            });

        }

    }
);


return produtos;


}

/* ============================================================
22. SINCRONIZAR
============================================================ */

async function sincronizarProdutosSelecionados() {


const produtos =
    obterProdutosSelecionados();


if (produtos.length === 0) {

    alert(
        'Selecione pelo menos um produto.'
    );

    return;
}


const confirmar =
    confirm(
        'Deseja sincronizar ' +
        produtos.length +
        ' produto(s) com o Mercado Livre?'
    );


if (!confirmar) {
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
                method: 'POST',

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
                ? JSON.parse(texto)
                : null;

    } catch {

        resultado =
            null;
    }


    if (!resposta.ok) {

        throw new Error(
            resultado?.erro ||
            resultado?.error ||
            'Erro ao sincronizar produtos.'
        );
    }


    alert(
        'Sincronização concluída.'
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
            textoOriginal;
    }

    atualizarContadorSelecionados();
}


}

/* ============================================================
23. CARREGAR
============================================================ */

async function carregarProdutosMercadoLivre() {


if (carregandoProdutos) {
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


if (!lista) {

    console.error(
        'Elemento lista-produtos não encontrado.'
    );

    carregandoProdutos =
        false;

    return;
}


lista.innerHTML = `
    <div class="produtos-vazio">

        <div class="produtos-vazio-icone">
            ⏳
        </div>

        <h2>
            Carregando produtos
        </h2>

        <p>
            Consultando os produtos do Mercado Livre...
        </p>

    </div>
`;


try {

    produtosMercadoLivre =
        await buscarProdutosImportados();


    console.log(
        'Produtos encontrados:',
        produtosMercadoLivre.length
    );


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


    lista.innerHTML = `
        <div class="produtos-vazio">

            <div class="produtos-vazio-icone">
                ⚠️
            </div>

            <h2>
                Erro ao carregar produtos
            </h2>

            <p>
                Verifique a conexão com o Supabase e tente novamente.
            </p>

        </div>
    `;

} finally {

    carregandoProdutos =
        false;
}


}

/* ============================================================
24. EVENTOS
============================================================ */

function configurarEventos() {


const filtro =
    obterElemento(
        'filtro-status'
    );


if (filtro) {

    filtro.addEventListener(
        'change',
        aplicarFiltros
    );

}


const campo =
    obterElemento(
        'campo-pesquisa'
    );


if (campo) {

    campo.addEventListener(
        'input',
        aplicarFiltros
    );

}


const checkboxTodos =
    obterElemento(
        'checkbox-selecionar-todos'
    );


if (checkboxTodos) {

    checkboxTodos.addEventListener(
        'change',
        alternarSelecaoTodos
    );

}


const botaoSelecionar =
    obterElemento(
        'btn-selecionar-todos'
    );


if (botaoSelecionar) {

    botaoSelecionar.addEventListener(
        'click',
        selecionarTodosProdutos
    );

}


const botaoDesmarcar =
    obterElemento(
        'btn-desmarcar-todos'
    );


if (botaoDesmarcar) {

    botaoDesmarcar.addEventListener(
        'click',
        desmarcarTodosProdutos
    );

}


const botaoSincronizar =
    obterElemento(
        'btn-sincronizar-selecionados'
    );


if (botaoSincronizar) {

    botaoSincronizar.addEventListener(
        'click',
        sincronizarProdutosSelecionados
    );

}


const botaoAtualizar =
    obterElemento(
        'btn-atualizar-produtos'
    );


if (botaoAtualizar) {

    botaoAtualizar.addEventListener(
        'click',
        carregarProdutosMercadoLivre
    );

}


}

/* ============================================================
25. INICIALIZAÇÃO
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
        'Inicializando...'
    );

    console.log(
        '============================================================'
    );


    configurarEventos();


    await carregarProdutosMercadoLivre();


    console.log(
        'Inicialização concluída.'
    );

}


);

/* ============================================================
26. FUNÇÕES GLOBAIS
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
