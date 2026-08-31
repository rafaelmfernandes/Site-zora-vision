/* ============================================================
ZORAVISION - PRODUTOS DO MERCADO LIVRE

Arquivo:
Admin/mercadolivre-produtos.js

Compatível com:
Admin/mercadolivre-produtos.html

IMPORTANTE:
Esta versão utiliza somente campos existentes/conhecidos
da tabela produtos.

Não utiliza:

* status_mercado_livre
* ml_status

Responsabilidades:

* Buscar produtos importados
* Mostrar produtos do Mercado Livre
* Filtrar ativos/inativos
* Pesquisar produtos
* Selecionar produtos
* Ativar produto
* Inativar produto
* Sincronizar produtos selecionados
* Atualizar lista
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
3. SUPABASE
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

        if (cliente) {

            return cliente;

        }

    } catch (erro) {

        console.error(
            'Erro ao executar obterSupabase():',
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
5. MENSAGENS
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


elemento.textContent =
    '';


elemento.style.display =
    'none';


}

/* ============================================================
6. UTILITÁRIOS
============================================================ */

function normalizarTexto(
texto
) {


return String(
    texto ?? ''
)
    .normalize('NFD')
    .replace(
        /[\u0300-\u036f]/g,
        ''
    )
    .toLowerCase()
    .trim();


}

function escaparHTML(
texto
) {


const elemento =
    document.createElement(
        'div'
    );


elemento.textContent =
    String(
        texto ?? ''
    );


return elemento.innerHTML;


}

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
7. IDENTIFICAR ID MERCADO LIVRE
============================================================ */

function obterIdMercadoLivre(
produto
) {


return (
    produto.mercado_livre_item_id ||
    produto.mercadolivre_item_id ||
    produto.ml_item_id ||
    ''
);


}

/* ============================================================
8. BUSCAR PRODUTOS
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


/*
   IMPORTANTE:

   A consulta utiliza somente colunas que já estavam
   sendo utilizadas pela tabela produtos.

   Foram removidos:
   - status_mercado_livre
   - ml_status
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


if (
    resultado.error
) {

    console.error(
        'Erro retornado pelo Supabase:',
        resultado.error
    );


    throw resultado.error;

}


return (
    resultado.data ||
    []
);


}

/* ============================================================
9. ATUALIZAR RESUMO
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


const selecionados =
    document.querySelectorAll(
        '.produto-checkbox:checked'
    ).length;


const totalElemento =
    obterElemento(
        'total-produtos'
    );


if (totalElemento) {

    totalElemento.textContent =
        total;

}


const importadosElemento =
    obterElemento(
        'total-importados'
    );


if (importadosElemento) {

    importadosElemento.textContent =
        importados;

}


const ativosElemento =
    obterElemento(
        'total-ativos'
    );


if (ativosElemento) {

    ativosElemento.textContent =
        ativos;

}


const inativosElemento =
    obterElemento(
        'total-inativos'
    );


if (inativosElemento) {

    inativosElemento.textContent =
        inativos;

}


const selecionadosElemento =
    obterElemento(
        'total-selecionados'
    );


if (selecionadosElemento) {

    selecionadosElemento.textContent =
        selecionados;

}


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


const ativo =
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
            ativo
                ? 'Ativando...'
                : 'Inativando...';

    }


    console.log(
        'Alterando produto:',
        produtoId,
        'ativo:',
        ativo
    );


    /*
       Atualiza somente o campo ativo.

       Não enviamos updated_at porque queremos evitar
       depender de outra coluna que possa não existir.
    */

    const resultado =
        await supabase
            .from('produtos')
            .update({
                ativo: ativo
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


    if (produtoLocal) {

        produtoLocal.ativo =
            ativo;

    }


    mostrarMensagem(
        ativo
            ? 'Produto ativado com sucesso.'
            : 'Produto inativado com sucesso.',
        'sucesso'
    );


    aplicarFiltros();


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

/* ============================================================
11. INATIVAR
============================================================ */

async function inativarProduto(
produtoId,
botao
) {


const confirmar =
    window.confirm(
        'Deseja inativar este produto no ZoraVision?\n\n' +
        'O produto não será excluído. Ele continuará no banco de dados e poderá ser ativado novamente.'
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
12. ATIVAR
============================================================ */

async function ativarProduto(
produtoId,
botao
) {


const confirmar =
    window.confirm(
        'Deseja ativar este produto no ZoraVision?\n\n' +
        'O produto ficará novamente disponível no site.'
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
13. CRIAR CARD
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


const idMercadoLivre =
    obterIdMercadoLivre(
        produto
    );


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
    idMercadoLivre;


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
        idMercadoLivre ||
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
        'span'
    );


statusSite.className =
    'produto-status-badge ' +
    (
        produto.ativo === true
            ? 'status-ativo'
            : 'status-inativo'
    );


statusSite.textContent =
    produto.ativo === true
        ? 'Ativo no site'
        : 'Inativo no site';


const statusMercadoLivre =
    document.createElement(
        'span'
    );


statusMercadoLivre.className =
    'produto-status-badge status-mercado-livre';


statusMercadoLivre.textContent =
    'Mercado Livre';


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


const botao =
    document.createElement(
        'button'
    );


botao.type =
    'button';


botao.className =
    'btn-produto-acao';


if (
    produto.ativo === true
) {

    botao.classList.add(
        'btn-inativar'
    );


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

} else {

    botao.classList.add(
        'btn-ativar'
    );


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
   CHECKBOX
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
14. APLICAR FILTROS
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

            /* --------------------------------------------
               STATUS
            -------------------------------------------- */

            if (
                valorFiltro === 'ativos' &&
                produto.ativo !== true
            ) {

                return false;

            }


            if (
                valorFiltro === 'inativos' &&
                produto.ativo === true
            ) {

                return false;

            }


            /* --------------------------------------------
               PESQUISA
            -------------------------------------------- */

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
                    obterIdMercadoLivre(
                        produto
                    )
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
        'Não existem produtos correspondentes aos filtros selecionados.';


    if (
        valorFiltro === 'ativos'
    ) {

        titulo =
            'Nenhum produto ativo';


        descricao =
            'Não existem produtos ativos no ZoraVision.';

    }


    if (
        valorFiltro === 'inativos'
    ) {

        titulo =
            'Nenhum produto inativo';


        descricao =
            'Não existem produtos inativos no ZoraVision.';

    }


    const vazio =
        document.createElement(
            'div'
        );


    vazio.className =
        'produtos-vazio';


    vazio.innerHTML =
        `
            <div class="produtos-vazio-icone">
                📦
            </div>

            <h2>
                ${escaparHTML(titulo)}
            </h2>

            <p>
                ${escaparHTML(descricao)}
            </p>
        `;


    lista.appendChild(
        vazio
    );


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
16. CONTADOR
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


const quantidade =
    selecionados.length;


const contador =
    obterElemento(
        'contador-produtos'
    );


if (contador) {

    if (
        quantidade === 0
    ) {

        contador.textContent =
            produtosFiltrados.length +
            (
                produtosFiltrados.length === 1
                    ? ' produto'
                    : ' produtos'
            );

    } else {

        contador.textContent =
            quantidade +
            (
                quantidade === 1
                    ? ' produto selecionado'
                    : ' produtos selecionados'
            );

    }

}


const totalSelecionados =
    obterElemento(
        'total-selecionados'
    );


if (totalSelecionados) {

    totalSelecionados.textContent =
        quantidade;

}


const botaoSincronizar =
    obterElemento(
        'btn-sincronizar-selecionados'
    );


if (botaoSincronizar) {

    botaoSincronizar.disabled =
        quantidade === 0;

}


atualizarEstadoCheckboxTodos();

atualizarResumoProdutos();


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

    checkboxTodos.checked =
        false;

    checkboxTodos.indeterminate =
        false;

    return;

}


checkboxTodos.checked =
    selecionados.length ===
    checkboxes.length;


checkboxTodos.indeterminate =
    selecionados.length > 0 &&
    selecionados.length < checkboxes.length;


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


if (
    checkboxTodos.checked
) {

    selecionarTodosProdutos();

} else {

    desmarcarTodosProdutos();

}


}

/* ============================================================
21. OBTER SELECIONADOS
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
                checkbox.dataset.itemId || null

        });

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


if (
    produtos.length === 0
) {

    alert(
        'Selecione pelo menos um produto.'
    );

    return;

}


const confirmar =
    window.confirm(
        'Você selecionou ' +
        produtos.length +
        ' produto(s).\n\n' +
        'Deseja sincronizar esses produtos com o Mercado Livre?'
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


    if (texto) {

        try {

            resultado =
                JSON.parse(
                    texto
                );

        } catch {

            resultado =
                null;

        }

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


    let mensagem =
        'Sincronização concluída.';


    if (
        resultado
    ) {

        mensagem +=
            '\n\n';


        if (
            resultado.total_encontrados !== undefined
        ) {

            mensagem +=
                'Encontrados: ' +
                resultado.total_encontrados +
                '\n';

        }


        if (
            resultado.criados !== undefined
        ) {

            mensagem +=
                'Criados: ' +
                resultado.criados +
                '\n';

        }


        if (
            resultado.atualizados !== undefined
        ) {

            mensagem +=
                'Atualizados: ' +
                resultado.atualizados +
                '\n';

        }


        if (
            resultado.erros !== undefined
        ) {

            mensagem +=
                'Erros: ' +
                resultado.erros;

        }

    }


    alert(
        mensagem
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


if (!lista) {

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
            Consultando os produtos importados do Mercado Livre...
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
        'Não foi possível carregar os produtos. ' +
        (
            erro?.message ||
            ''
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
                Não foi possível consultar a tabela
                produtos do Supabase.
                Verifique o erro no console.
            </p>

        </div>
        `;

} finally {

    carregandoProdutos =
        false;

}


}

/* ============================================================
24. CONFIGURAR FILTRO
============================================================ */

function configurarFiltroStatus() {


const filtro =
    obterElemento(
        'filtro-status'
    );


if (!filtro) {

    console.error(
        'Elemento filtro-status não encontrado.'
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

        aplicarFiltros();

    }
);


}

/* ============================================================
25. CONFIGURAR PESQUISA
============================================================ */

function configurarBuscaProdutos() {


const campo =
    obterElemento(
        'campo-pesquisa'
    );


if (!campo) {

    console.error(
        'Elemento campo-pesquisa não encontrado.'
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


}

/* ============================================================
26. CONFIGURAR BOTÕES
============================================================ */

function configurarBotoesProdutos() {


/* --------------------------------------------------------
   CHECKBOX TODOS
-------------------------------------------------------- */

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


/* --------------------------------------------------------
   SELECIONAR TODOS
-------------------------------------------------------- */

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


/* --------------------------------------------------------
   DESMARCAR TODOS
-------------------------------------------------------- */

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


/* --------------------------------------------------------
   SINCRONIZAR
-------------------------------------------------------- */

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


/* --------------------------------------------------------
   ATUALIZAR
-------------------------------------------------------- */

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
27. INICIALIZAÇÃO
============================================================ */

function inicializarPaginaProdutosMercadoLivre() {


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


configurarFiltroStatus();


configurarBuscaProdutos();


configurarBotoesProdutos();


carregarProdutosMercadoLivre();


console.log(
    'Inicialização iniciada.'
);


}

/* ============================================================
28. DOM READY
============================================================ */

if (
document.readyState === 'loading'
) {


document.addEventListener(
    'DOMContentLoaded',
    inicializarPaginaProdutosMercadoLivre
);


} else {


inicializarPaginaProdutosMercadoLivre();


}

/* ============================================================
29. FUNÇÕES GLOBAIS
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
