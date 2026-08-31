/* ============================================================
ZORAVISION
PRODUTOS DO MERCADO LIVRE

IMPORTANTE:
Este arquivo utiliza somente colunas existentes na tabela produtos.

Não utiliza:

* ml_status
* status_mercado_livre
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

function obterSupabaseProdutos() {


if (window.supabaseClient) {
    return window.supabaseClient;
}

if (window._supabase) {
    return window._supabase;
}

if (typeof window.obterSupabase === 'function') {

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
4. ELEMENTO
============================================================ */

function elemento(id) {
return document.getElementById(id);
}

/* ============================================================
5. NORMALIZAR TEXTO
============================================================ */

function normalizarTexto(texto) {


return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();


}

/* ============================================================
6. PREÇO
============================================================ */

function formatarPreco(valor) {


const numero = Number(valor || 0);

return numero.toLocaleString(
    'pt-BR',
    {
        style: 'currency',
        currency: 'BRL'
    }
);


}

/* ============================================================
7. MENSAGEM
============================================================ */

function mostrarMensagem(
texto,
tipo = 'info'
) {


const campo =
    elemento('mensagem-produtos');

if (!campo) {
    return;
}

campo.textContent = texto;

campo.className =
    'mensagem-produtos mensagem-' + tipo;

campo.style.display = 'block';


}

/* ============================================================
8. ESCONDER MENSAGEM
============================================================ */

function esconderMensagem() {


const campo =
    elemento('mensagem-produtos');

if (!campo) {
    return;
}

campo.style.display = 'none';


}

/* ============================================================
9. BUSCAR PRODUTOS IMPORTADOS
============================================================ */

async function buscarProdutosImportados() {


const supabase =
    obterSupabaseProdutos();

if (!supabase) {

    throw new Error(
        'Cliente Supabase não encontrado.'
    );
}

console.log(
    'Consultando produtos importados...'
);


/*
 * ATENÇÃO:
 *
 * Aqui estão SOMENTE colunas existentes
 * na tabela produtos.
 *
 * Não colocar:
 * ml_status
 * status_mercado_livre
 */

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
10. ATUALIZAR DASHBOARD
============================================================ */

function atualizarDashboard() {


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

/*
 * A página consulta somente produtos
 * que já possuem mercado_livre_item_id.
 *
 * Portanto, pendentes = 0.
 */

const pendentes = 0;


const totalElemento =
    elemento('total-produtos');

const importadosElemento =
    elemento('total-importados');

const ativosElemento =
    elemento('total-ativos');

const inativosElemento =
    elemento('total-inativos');

const pendentesElemento =
    elemento('total-nao-importados');


if (totalElemento) {
    totalElemento.textContent = total;
}

if (importadosElemento) {
    importadosElemento.textContent = importados;
}

if (ativosElemento) {
    ativosElemento.textContent = ativos;
}

if (inativosElemento) {
    inativosElemento.textContent = inativos;
}

if (pendentesElemento) {
    pendentesElemento.textContent = pendentes;
}


}

/* ============================================================
11. CRIAR BADGE
============================================================ */

function criarBadge(
texto,
classe
) {


const badge =
    document.createElement('span');

badge.className =
    'produto-status-badge ' + classe;

badge.textContent = texto;

return badge;


}

/* ============================================================
12. CRIAR CARD
============================================================ */

function criarCardProduto(produto) {


const card =
    document.createElement('article');

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


/* ========================================================
   CHECKBOX
======================================================== */

const areaSelecao =
    document.createElement('div');

areaSelecao.className =
    'produto-selecao';


const checkbox =
    document.createElement('input');

checkbox.type = 'checkbox';

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
    document.createElement('div');

areaImagem.className =
    'produto-imagem';


if (produto.imagem_url) {

    const imagem =
        document.createElement('img');

    imagem.src =
        produto.imagem_url;

    imagem.alt =
        produto.nome || 'Produto';

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
    document.createElement('div');

informacoes.className =
    'produto-informacoes';


const titulo =
    document.createElement('h3');

titulo.textContent =
    produto.nome ||
    'Produto sem nome';


const itemId =
    document.createElement('p');

itemId.className =
    'produto-item-id';

itemId.textContent =
    'Mercado Livre: ' +
    (
        produto.mercado_livre_item_id ||
        'Não informado'
    );


const sku =
    document.createElement('p');

sku.className =
    'produto-sku';

sku.textContent =
    'SKU: ' +
    (
        produto.sku ||
        'Não informado'
    );


const preco =
    document.createElement('strong');

preco.className =
    'produto-preco';

preco.textContent =
    formatarPreco(
        produto.preco
    );


const estoque =
    document.createElement('span');

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
    document.createElement('div');

areaStatus.className =
    'produto-status-area';


if (produto.ativo === true) {

    areaStatus.appendChild(
        criarBadge(
            'Ativo no site',
            'status-ativo'
        )
    );

} else {

    areaStatus.appendChild(
        criarBadge(
            'Inativo no site',
            'status-inativo'
        )
    );
}


/*
 * Como ml_status não existe,
 * mostramos apenas que o produto
 * foi importado do Mercado Livre.
 */

areaStatus.appendChild(
    criarBadge(
        'Importado do Mercado Livre',
        'status-mercado-livre'
    )
);


/* ========================================================
   AÇÕES
======================================================== */

const areaAcoes =
    document.createElement('div');

areaAcoes.className =
    'produto-acoes';


const botao =
    document.createElement('button');

botao.type = 'button';

botao.className =
    'btn-produto-acao';


if (produto.ativo === true) {

    botao.textContent =
        'Inativar';

    botao.classList.add(
        'btn-inativar'
    );


    botao.addEventListener(
        'click',
        function() {

            inativarProduto(
                produto.id,
                botao
            );

        }
    );

} else {

    botao.textContent =
        'Ativar';

    botao.classList.add(
        'btn-ativar'
    );


    botao.addEventListener(
        'click',
        function() {

            ativarProduto(
                produto.id,
                botao
            );

        }
    );
}


areaAcoes.appendChild(
    botao
);


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
   SELEÇÃO
======================================================== */

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
13. RENDERIZAR PRODUTOS
============================================================ */

function renderizarProdutos() {


const lista =
    elemento('lista-produtos');


if (!lista) {

    console.error(
        'lista-produtos não encontrado.'
    );

    return;
}


lista.innerHTML = '';


if (
    produtosFiltrados.length === 0
) {

    lista.innerHTML =
        `
        <div class="produtos-vazio">

            <div class="produtos-vazio-icone">
                📦
            </div>

            <h2>
                Nenhum produto encontrado
            </h2>

            <p>
                Não existem produtos correspondentes
                aos filtros selecionados.
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
            criarCardProduto(produto)
        );

    }
);


lista.appendChild(
    fragmento
);


atualizarContadorSelecionados();


}

/* ============================================================
14. APLICAR FILTROS
============================================================ */

function aplicarFiltros() {


const filtro =
    elemento('filtro-status');

const pesquisaCampo =
    elemento('campo-pesquisa');


const valorFiltro =
    filtro
        ? filtro.value
        : 'todos';


const pesquisa =
    pesquisaCampo
        ? normalizarTexto(
            pesquisaCampo.value
        )
        : '';


produtosFiltrados =
    produtosMercadoLivre.filter(
        function(produto) {

            let passaStatus = true;


            if (
                valorFiltro === 'ativos'
            ) {

                passaStatus =
                    produto.ativo === true;
            }


            else if (
                valorFiltro === 'inativos'
            ) {

                passaStatus =
                    produto.ativo !== true;
            }


            else if (
                valorFiltro === 'importados'
            ) {

                passaStatus = true;
            }


            else if (
                valorFiltro === 'nao-importados'
            ) {

                passaStatus = false;
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
15. CONTADOR
============================================================ */

function atualizarContadorSelecionados() {


const selecionados =
    document.querySelectorAll(
        '.produto-checkbox:checked'
    );


const quantidade =
    selecionados.length;


const contador =
    elemento('contador-produtos');


if (contador) {

    if (quantidade > 0) {

        contador.textContent =
            quantidade +
            (
                quantidade === 1
                    ? ' produto selecionado'
                    : ' produtos selecionados'
            );

    } else {

        contador.textContent =
            produtosFiltrados.length +
            (
                produtosFiltrados.length === 1
                    ? ' produto encontrado'
                    : ' produtos encontrados'
            );

    }
}


const botao =
    elemento(
        'btn-sincronizar-selecionados'
    );


if (botao) {

    botao.disabled =
        quantidade === 0;
}


atualizarCheckboxTodos();


}

/* ============================================================
16. CHECKBOX TODOS
============================================================ */

function atualizarCheckboxTodos() {


const principal =
    elemento(
        'checkbox-selecionar-todos'
    );


if (!principal) {
    return;
}


const checkboxes =
    document.querySelectorAll(
        '.produto-checkbox'
    );


const selecionados =
    document.querySelectorAll(
        '.produto-checkbox:checked'
    );


if (
    checkboxes.length === 0
) {

    principal.checked = false;

    principal.indeterminate = false;

    return;
}


principal.checked =
    selecionados.length ===
    checkboxes.length;


principal.indeterminate =
    selecionados.length > 0 &&
    selecionados.length <
    checkboxes.length;


}

/* ============================================================
17. SELECIONAR TODOS
============================================================ */

function selecionarTodosProdutos() {


document
    .querySelectorAll(
        '.produto-checkbox'
    )
    .forEach(
        function(checkbox) {

            checkbox.checked = true;


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
18. DESMARCAR TODOS
============================================================ */

function desmarcarTodosProdutos() {


document
    .querySelectorAll(
        '.produto-checkbox'
    )
    .forEach(
        function(checkbox) {

            checkbox.checked = false;


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


const principal =
    elemento(
        'checkbox-selecionar-todos'
    );


if (principal) {

    principal.checked = false;

    principal.indeterminate = false;
}


atualizarContadorSelecionados();


}

/* ============================================================
19. PRODUTOS SELECIONADOS
============================================================ */

function obterProdutosSelecionados() {


const produtos = [];


document
    .querySelectorAll(
        '.produto-checkbox:checked'
    )
    .forEach(
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
20. ALTERAR STATUS
============================================================ */

async function alterarStatusProduto(
produtoId,
ativo,
botao
) {


const supabase =
    obterSupabaseProdutos();


if (!supabase) {

    alert(
        'Cliente Supabase não encontrado.'
    );

    return;
}


const textoOriginal =
    botao
        ? botao.textContent
        : '';


try {

    if (botao) {

        botao.disabled = true;

        botao.textContent =
            ativo
                ? 'Ativando...'
                : 'Inativando...';
    }


    const resultado =
        await supabase
            .from('produtos')
            .update({

                ativo: ativo,

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
            ativo;
    }


    atualizarDashboard();

    aplicarFiltros();


} catch (erro) {

    console.error(
        'Erro ao alterar status:',
        erro
    );


    alert(
        'Não foi possível alterar o status.\n\n' +
        (
            erro.message ||
            'Erro desconhecido.'
        )
    );


    if (botao) {

        botao.disabled = false;

        botao.textContent =
            textoOriginal;
    }
}


}

/* ============================================================
21. INATIVAR
============================================================ */

async function inativarProduto(
produtoId,
botao
) {


const confirmar =
    confirm(
        'Deseja inativar este produto no ZoraVision?\n\n' +
        'O produto não será excluído.'
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
22. ATIVAR
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
23. CARREGAR
============================================================ */

async function carregarProdutosMercadoLivre() {


if (carregandoProdutos) {
    return;
}


carregandoProdutos = true;


esconderMensagem();


const lista =
    elemento('lista-produtos');


if (!lista) {

    carregandoProdutos = false;

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
            Consultando produtos do Mercado Livre...
        </p>

    </div>
    `;


try {

    produtosMercadoLivre =
        await buscarProdutosImportados();


    produtosFiltrados =
        [...produtosMercadoLivre];


    atualizarDashboard();

    aplicarFiltros();


    console.log(
        'Produtos carregados:',
        produtosMercadoLivre.length
    );


} catch (erro) {

    console.error(
        'Erro ao carregar produtos:',
        erro
    );


    mostrarMensagem(
        'Não foi possível carregar os produtos: ' +
        (
            erro.message ||
            'erro desconhecido'
        ),
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

    carregandoProdutos = false;

}


}

/* ============================================================
24. SINCRONIZAR
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
        'Deseja sincronizar ' +
        produtos.length +
        ' produto(s)?'
    );


if (!confirmar) {
    return;
}


const botao =
    elemento(
        'btn-sincronizar-selecionados'
    );


const textoOriginal =
    botao
        ? botao.textContent
        : 'Sincronizar selecionados';


try {

    if (botao) {

        botao.disabled = true;

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


    let resultado = null;


    try {

        resultado =
            texto
                ? JSON.parse(texto)
                : null;

    } catch {

        resultado = null;
    }


    if (!resposta.ok) {

        throw new Error(
            resultado?.erro ||
            resultado?.error ||
            'Erro na sincronização.'
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


    await carregarProdutosMercadoLivre();


} catch (erro) {

    console.error(
        'Erro na sincronização:',
        erro
    );


    alert(
        'Não foi possível sincronizar os produtos.\n\n' +
        (
            erro.message ||
            'Erro desconhecido.'
        )
    );


} finally {

    if (botao) {

        botao.textContent =
            textoOriginal;
    }


    atualizarContadorSelecionados();
}


}

/* ============================================================
25. INICIALIZAÇÃO
============================================================ */

document.addEventListener(
'DOMContentLoaded',
function() {


    console.log(
        '============================================================'
    );

    console.log(
        'ZoraVision - Produtos Mercado Livre'
    );

    console.log(
        'Inicializando página...'
    );

    console.log(
        '============================================================'
    );


    /* FILTRO */

    const filtro =
        elemento('filtro-status');


    if (filtro) {

        filtro.addEventListener(
            'change',
            aplicarFiltros
        );
    }


    /* PESQUISA */

    const pesquisa =
        elemento('campo-pesquisa');


    if (pesquisa) {

        pesquisa.addEventListener(
            'input',
            aplicarFiltros
        );
    }


    /* CHECKBOX PRINCIPAL */

    const checkboxTodos =
        elemento(
            'checkbox-selecionar-todos'
        );


    if (checkboxTodos) {

        checkboxTodos.addEventListener(
            'change',
            function() {

                if (
                    checkboxTodos.checked
                ) {

                    selecionarTodosProdutos();

                } else {

                    desmarcarTodosProdutos();

                }

            }
        );
    }


    /* SELECIONAR */

    const selecionar =
        elemento(
            'btn-selecionar-todos'
        );


    if (selecionar) {

        selecionar.addEventListener(
            'click',
            selecionarTodosProdutos
        );
    }


    /* DESMARCAR */

    const desmarcar =
        elemento(
            'btn-desmarcar-todos'
        );


    if (desmarcar) {

        desmarcar.addEventListener(
            'click',
            desmarcarTodosProdutos
        );
    }


    /* SINCRONIZAR */

    const sincronizar =
        elemento(
            'btn-sincronizar-selecionados'
        );


    if (sincronizar) {

        sincronizar.addEventListener(
            'click',
            sincronizarProdutosSelecionados
        );
    }


    /* ATUALIZAR */

    const atualizar =
        elemento(
            'btn-atualizar-produtos'
        );


    if (atualizar) {

        atualizar.addEventListener(
            'click',
            carregarProdutosMercadoLivre
        );
    }


    /* CARREGAR */

    carregarProdutosMercadoLivre();

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
