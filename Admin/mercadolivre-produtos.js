/* ============================================================
ZORAVISION - PRODUTOS DO MERCADO LIVRE
Arquivo:
Admin/mercadolivre-produtos.js

Responsabilidades:

* Verificar acesso administrativo
* Buscar produtos importados do Mercado Livre
* Exibir produtos na tela
* Identificar produtos já importados
* Permitir seleção individual
* Permitir selecionar todos
* Evitar duplicação visual
* Mostrar quantidade encontrada
* Preparado para sincronização futura
  ============================================================ */

/* ============================================================

1. CONFIGURAÇÕES
   ============================================================ */

const EDGE_FUNCTION_IMPORTAR =
'https://ratajxnxkjoiuknamacn.supabase.co/functions/v1/mercadolivre-importar-produtos';

/* ============================================================
2. OBTER SUPABASE
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
3. ELEMENTOS DA PÁGINA
============================================================ */

function obterElemento(id) {


return document.getElementById(id);


}

/* ============================================================
4. MENSAGEM
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

/* ============================================================
5. LIMPAR MENSAGEM
============================================================ */

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
6. FORMATAR PREÇO
============================================================ */

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

/* ============================================================
7. CRIAR CARD DO PRODUTO
============================================================ */

function criarCardProduto(
produto
) {


const card =
    document.createElement(
        'article'
    );

card.className =
    'produto-mercado-livre-card';

card.dataset.produtoId =
    produto.id || '';

card.dataset.itemId =
    produto.mercado_livre_item_id || '';


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

checkbox.dataset.itemId =
    produto.mercado_livre_item_id || '';


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


/* --------------------------------------------------------
MONTAR CARD
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


/* --------------------------------------------------------
SELEÇÃO DO CARD
-------------------------------------------------------- */

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
8. BUSCAR PRODUTOS
============================================================ */

async function carregarProdutosMercadoLivre() {


console.log(
    '============================================================'
);

console.log(
    'ZoraVision - Produtos Mercado Livre'
);

console.log(
    'Buscando produtos...'
);

console.log(
    '============================================================'
);


esconderMensagem();


const supabase =
    obterSupabaseProdutosMercadoLivre();


if (!supabase) {

    mostrarMensagem(
        'Não foi possível conectar ao Supabase.',
        'erro'
    );

    return;

}


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
    '';


mostrarMensagem(
    'Carregando produtos...',
    'info'
);


try {

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


    console.log(
        'Resultado produtos:',
        resultado
    );


    if (
        resultado.error
    ) {

        console.error(
            'Erro ao buscar produtos:',
            resultado.error
        );

        throw resultado.error;

    }


    const produtos =
        resultado.data ||
        [];


    console.log(
        'Produtos encontrados:',
        produtos.length
    );


    const total =
        obterElemento(
            'total-produtos'
        );


    if (total) {

        total.textContent =
            produtos.length;

    }


    const selecionados =
        obterElemento(
            'total-selecionados'
        );


    if (selecionados) {

        selecionados.textContent =
            '0';

    }


    if (
        produtos.length === 0
    ) {

        esconderMensagem();

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
                    Nenhum produto importado do Mercado Livre
                    foi encontrado no catálogo.
                </p>
            </div>
            `;

        return;

    }


    esconderMensagem();


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

}


}

/* ============================================================
9. ATUALIZAR CONTADOR DE SELECIONADOS
============================================================ */

function atualizarContadorSelecionados() {


const checkboxes =
    document.querySelectorAll(
        '.produto-checkbox:checked'
    );


const contador =
    obterElemento(
        'total-selecionados'
    );


if (contador) {

    contador.textContent =
        checkboxes.length;

}


const botao =
    obterElemento(
        'btn-sincronizar-selecionados'
    );


if (botao) {

    botao.disabled =
        checkboxes.length === 0;

}


}

/* ============================================================
10. SELECIONAR TODOS
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


const checkboxTodos =
    obterElemento(
        'checkbox-selecionar-todos'
    );


if (checkboxTodos) {

    checkboxTodos.checked =
        true;

}


atualizarContadorSelecionados();


}

/* ============================================================
11. DESMARCAR TODOS
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


const checkboxTodos =
    obterElemento(
        'checkbox-selecionar-todos'
    );


if (checkboxTodos) {

    checkboxTodos.checked =
        false;

}


atualizarContadorSelecionados();


}

/* ============================================================
12. ALTERNAR SELEÇÃO
============================================================ */

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

/* ============================================================
13. OBTER PRODUTOS SELECIONADOS
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
14. SINCRONIZAR SELECIONADOS
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


console.log(
    'Produtos selecionados:',
    produtos
);


/*
============================================================
IMPORTANTE

A Edge Function atual de importação já possui proteção
contra duplicação.

Por enquanto, esta ação solicita uma nova importação.
Os produtos existentes serão atualizados em vez de
duplicados.

A seleção individual ficará preparada para uma futura
Edge Function específica de sincronização.
============================================================
*/


const confirmar =
    confirm(
        'Você selecionou ' +
        produtos.length +
        ' produto(s).\n\n' +
        'Deseja atualizar a sincronização do Mercado Livre?'
    );


if (!confirmar) {

    return;

}


const botao =
    obterElemento(
        'btn-sincronizar-selecionados'
    );


if (botao) {

    botao.disabled =
        true;

    botao.textContent =
        'Sincronizando...';

}


try {

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

    } catch (erro) {

        console.error(
            'Resposta inválida:',
            texto
        );

    }


    console.log(
        'Resposta da sincronização:',
        resultado
    );


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
            'Sincronizar selecionados';

    }

}


}

/* ============================================================
15. CONFIGURAR BOTÕES
============================================================ */

function configurarBotoesProdutos() {


const checkboxTodos =
    obterElemento(
        'checkbox-selecionar-todos'
    );


if (checkboxTodos) {

    if (
        checkboxTodos.dataset.configurado !== 'true'
    ) {

        checkboxTodos.dataset.configurado =
            'true';

        checkboxTodos.addEventListener(
            'change',
            alternarSelecaoTodos
        );

    }

}


const botaoSelecionarTodos =
    obterElemento(
        'btn-selecionar-todos'
    );


if (botaoSelecionarTodos) {

    if (
        botaoSelecionarTodos.dataset.configurado !== 'true'
    ) {

        botaoSelecionarTodos.dataset.configurado =
            'true';

        botaoSelecionarTodos.addEventListener(
            'click',
            selecionarTodosProdutos
        );

    }

}


const botaoDesmarcarTodos =
    obterElemento(
        'btn-desmarcar-todos'
    );


if (botaoDesmarcarTodos) {

    if (
        botaoDesmarcarTodos.dataset.configurado !== 'true'
    ) {

        botaoDesmarcarTodos.dataset.configurado =
            'true';

        botaoDesmarcarTodos.addEventListener(
            'click',
            desmarcarTodosProdutos
        );

    }

}


const botaoSincronizar =
    obterElemento(
        'btn-sincronizar-selecionados'
    );


if (botaoSincronizar) {

    if (
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

}


const botaoAtualizar =
    obterElemento(
        'btn-atualizar-produtos'
    );


if (botaoAtualizar) {

    if (
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


}

/* ============================================================
16. INICIALIZAÇÃO
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


    configurarBotoesProdutos();


    await carregarProdutosMercadoLivre();


    console.log(
        'Inicialização concluída.'
    );

}


);

/* ============================================================
17. FUNÇÕES GLOBAIS
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
