
// ============================================================
// ZORAVISION - GERENCIAMENTO DE PRODUTOS MERCADO LIVRE
// ============================================================
// Arquivo:
// Admin/mercadolivre-produtos.js
//
// Responsabilidades:
//
// - Verificar acesso administrativo através do Painel-admin.js
// - Buscar produtos já importados no Supabase
// - Identificar produtos importados
// - Identificar produtos ainda não importados
// - Identificar produtos ativos no ZoraVision
// - Identificar produtos inativos no ZoraVision
// - Exibir resumo administrativo
// - Exibir produtos separados por situação
// - Selecionar produtos
// - Selecionar todos
// - Importar / atualizar produtos selecionados
// - Evitar duplicação visual
// - Atualizar a página após sincronização
//
// IMPORTANTE:
// Este arquivo NÃO cria outro cliente Supabase.
// Ele utiliza o cliente criado por:
// ../Supabase/supabase.js
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

let produtosImportados = [];

let produtosNaoImportados = [];

let produtosAtivos = [];

let produtosInativos = [];

let filtroAtual = 'todos';


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
// 8. ESCAPAR TEXTO
// ============================================================

function escaparTexto(
    valor
) {

    return String(
        valor || ''
    )
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

}


// ============================================================
// 9. ATUALIZAR RESUMO ADMINISTRATIVO
// ============================================================

function atualizarResumo() {

    const total =
        obterElemento(
            'total-produtos'
        );

    const importados =
        obterElemento(
            'total-importados'
        );

    const naoImportados =
        obterElemento(
            'total-nao-importados'
        );

    const ativos =
        obterElemento(
            'total-ativos'
        );

    const inativos =
        obterElemento(
            'total-inativos'
        );

    const selecionados =
        obterElemento(
            'total-selecionados'
        );


    if (total) {

        total.textContent =
            produtosMercadoLivre.length;

    }


    if (importados) {

        importados.textContent =
            produtosImportados.length;

    }


    if (naoImportados) {

        naoImportados.textContent =
            produtosNaoImportados.length;

    }


    if (ativos) {

        ativos.textContent =
            produtosAtivos.length;

    }


    if (inativos) {

        inativos.textContent =
            produtosInativos.length;

    }


    if (selecionados) {

        selecionados.textContent =
            obterProdutosSelecionados().length;

    }

}


// ============================================================
// 10. DETERMINAR SITUAÇÃO DO PRODUTO
// ============================================================

function determinarSituacao(
    produto
) {

    const importado =
        Boolean(
            produto.produto_id
        );

    if (!importado) {

        return 'nao-importado';

    }

    if (
        produto.ativo === true
    ) {

        return 'ativo';

    }

    return 'inativo';

}


// ============================================================
// 11. CRIAR CARD
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

    card.dataset.itemId =
        produto.item_id || '';

    card.dataset.produtoId =
        produto.produto_id || '';

    card.dataset.situacao =
        produto.situacao || '';


    // --------------------------------------------------------
    // CHECKBOX
    // --------------------------------------------------------

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
        produto.item_id || '';

    checkbox.dataset.itemId =
        produto.item_id || '';

    checkbox.dataset.produtoId =
        produto.produto_id || '';


    areaSelecao.appendChild(
        checkbox
    );


    // --------------------------------------------------------
    // IMAGEM
    // --------------------------------------------------------

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
            'Produto Mercado Livre';

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


    // --------------------------------------------------------
    // INFORMAÇÕES
    // --------------------------------------------------------

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
        'ML: ' +
        (
            produto.item_id ||
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


    // --------------------------------------------------------
    // STATUS
    // --------------------------------------------------------

    const status =
        document.createElement(
            'span'
        );

    status.className =
        'produto-status';


    if (
        produto.situacao ===
        'nao-importado'
    ) {

        status.classList.add(
            'status-nao-importado'
        );

        status.textContent =
            'Ainda não importado';

    } else if (
        produto.situacao ===
        'ativo'
    ) {

        status.classList.add(
            'status-ativo'
        );

        status.textContent =
            'Ativo no ZoraVision';

    } else {

        status.classList.add(
            'status-inativo'
        );

        status.textContent =
            'Importado / inativo';

    }


    // --------------------------------------------------------
    // AÇÃO
    // --------------------------------------------------------

    const acao =
        document.createElement(
            'span'
        );

    acao.className =
        'produto-acao';


    if (
        produto.situacao ===
        'nao-importado'
    ) {

        acao.textContent =
            'Disponível para importação';

    } else {

        acao.textContent =
            'Já existe no catálogo';

    }


    // --------------------------------------------------------
    // MONTAR INFORMAÇÕES
    // --------------------------------------------------------

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

    informacoes.appendChild(
        status
    );

    informacoes.appendChild(
        acao
    );


    // --------------------------------------------------------
    // MONTAR CARD
    // --------------------------------------------------------

    card.appendChild(
        areaSelecao
    );

    card.appendChild(
        areaImagem
    );

    card.appendChild(
        informacoes
    );


    // --------------------------------------------------------
    // SELEÇÃO
    // --------------------------------------------------------

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

            atualizarEstadoCheckboxTodos();

        }
    );


    return card;

}


// ============================================================
// 12. MONTAR DADOS DO MERCADO LIVRE
// ============================================================
//
// A Edge Function de importação trabalha com todos os anúncios
// do vendedor. Para a tela administrativa, usamos a tabela
// produtos para identificar o que já entrou no catálogo.
//
// ============================================================

async function carregarProdutosMercadoLivre() {

    console.log(
        '============================================================'
    );

    console.log(
        'ZoraVision - Gerenciamento Mercado Livre'
    );

    console.log(
        'Carregando catálogo...'
    );

    console.log(
        '============================================================'
    );


    mostrarMensagem(
        'Consultando produtos do Mercado Livre e do catálogo...',
        'info'
    );


    const supabase =
        obterSupabaseProdutosMercadoLivre();


    if (!supabase) {

        mostrarMensagem(
            'Não foi possível conectar ao Supabase.',
            'erro'
        );

        return;

    }


    try {

        // ----------------------------------------------------
        // BUSCAR PRODUTOS DO CATÁLOGO
        // ----------------------------------------------------

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

            throw resultado.error;

        }


        const produtos =
            resultado.data ||
            [];


        console.log(
            'Produtos importados encontrados:',
            produtos.length
        );


        // ----------------------------------------------------
        // TRANSFORMAR PRODUTOS
        // ----------------------------------------------------

        produtosImportados =
            produtos.map(
                function(produto) {

                    return {

                        produto_id:
                            produto.id,

                        item_id:
                            produto.mercado_livre_item_id,

                        nome:
                            produto.nome,

                        descricao:
                            produto.descricao,

                        preco:
                            produto.preco,

                        preco_promocional:
                            produto.preco_promocional,

                        estoque:
                            produto.estoque,

                        sku:
                            produto.sku,

                        imagem_url:
                            produto.imagem_url,

                        ativo:
                            produto.ativo === true,

                        destaque:
                            produto.destaque === true,

                        created_at:
                            produto.created_at,

                        updated_at:
                            produto.updated_at,

                        situacao:
                            produto.ativo === true
                                ? 'ativo'
                                : 'inativo'

                    };

                }
            );


        produtosAtivos =
            produtosImportados.filter(
                produto =>
                    produto.ativo === true
            );


        produtosInativos =
            produtosImportados.filter(
                produto =>
                    produto.ativo !== true
            );


        // ----------------------------------------------------
        // PRODUTOS NÃO IMPORTADOS
        // ----------------------------------------------------
        //
        // Neste momento a Edge Function é responsável por
        // descobrir os anúncios reais do Mercado Livre.
        //
        // Para que a página mostre anúncios "não importados"
        // individualmente, a Edge Function precisará devolver
        // os anúncios encontrados sem obrigatoriamente gravá-los.
        //
        // Enquanto isso, mantemos a lista preparada.
        //
        // ----------------------------------------------------

        produtosNaoImportados = [];


        // ----------------------------------------------------
        // CATÁLOGO PRINCIPAL
        // ----------------------------------------------------

        produtosMercadoLivre =
            [
                ...produtosImportados
            ];


        atualizarResumo();


        renderizarProdutos();


        esconderMensagem();


        console.log(
            'Catálogo carregado.'
        );


    } catch (erro) {

        console.error(
            'Erro ao carregar produtos:',
            erro
        );

        mostrarMensagem(
            'Não foi possível carregar os produtos do Mercado Livre.',
            'erro'
        );

    }

}


// ============================================================
// 13. RENDERIZAR PRODUTOS
// ============================================================

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


    let produtos =
        produtosMercadoLivre;


    // --------------------------------------------------------
    // FILTRO
    // --------------------------------------------------------

    if (
        filtroAtual ===
        'importados'
    ) {

        produtos =
            produtosImportados;

    }


    if (
        filtroAtual ===
        'nao-importados'
    ) {

        produtos =
            produtosNaoImportados;

    }


    if (
        filtroAtual ===
        'ativos'
    ) {

        produtos =
            produtosAtivos;

    }


    if (
        filtroAtual ===
        'inativos'
    ) {

        produtos =
            produtosInativos;

    }


    // --------------------------------------------------------
    // NENHUM PRODUTO
    // --------------------------------------------------------

    if (
        produtos.length === 0
    ) {

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
                Nenhum produto nesta categoria
            </h2>

            <p>
                Não existem produtos para o filtro selecionado.
            </p>
            `;


        lista.appendChild(
            vazio
        );

        atualizarEstadoCheckboxTodos();

        return;

    }


    // --------------------------------------------------------
    // FRAGMENT
    // --------------------------------------------------------

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

    atualizarEstadoCheckboxTodos();

}


// ============================================================
// 14. ATUALIZAR CONTADOR
// ============================================================

function atualizarContadorSelecionados() {

    const selecionados =
        obterProdutosSelecionados();


    const contador =
        obterElemento(
            'total-selecionados'
        );


    if (contador) {

        contador.textContent =
            selecionados.length;

    }


    const textoContador =
        obterElemento(
            'contador-produtos'
        );


    if (textoContador) {

        if (
            selecionados.length === 0
        ) {

            textoContador.textContent =
                'Nenhum produto selecionado';

        } else {

            textoContador.textContent =
                selecionados.length +
                (
                    selecionados.length === 1
                        ? ' produto selecionado'
                        : ' produtos selecionados'
                );

        }

    }


    atualizarResumo();


    const botao =
        obterElemento(
            'btn-importar-selecionados'
        );


    if (botao) {

        botao.disabled =
            selecionados.length === 0;

    }


    const botaoSincronizar =
        obterElemento(
            'btn-sincronizar-selecionados'
        );


    if (botaoSincronizar) {

        botaoSincronizar.disabled =
            selecionados.length === 0;

    }

}


// ============================================================
// 15. ATUALIZAR CHECKBOX "TODOS"
// ============================================================

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


    const marcados =
        document.querySelectorAll(
            '.produto-checkbox:checked'
        );


    checkboxTodos.checked =
        checkboxes.length > 0 &&
        marcados.length === checkboxes.length;

}


// ============================================================
// 16. SELECIONAR TODOS
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


// ============================================================
// 17. DESMARCAR TODOS
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


    if (checkboxTodos) {

        checkboxTodos.checked =
            false;

    }


    atualizarContadorSelecionados();

}


// ============================================================
// 18. ALTERNAR TODOS
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
// 19. OBTER SELECIONADOS
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

                item_id:
                    checkbox.dataset.itemId ||
                    checkbox.value,

                produto_id:
                    checkbox.dataset.produtoId ||
                    null

            });

        }
    );


    return produtos;

}


// ============================================================
// 20. FILTRAR PRODUTOS
// ============================================================

function aplicarFiltro(
    filtro
) {

    filtroAtual =
        filtro ||
        'todos';


    document
        .querySelectorAll(
            '[data-filtro]'
        )
        .forEach(
            function(botao) {

                botao.classList.remove(
                    'filtro-ativo'
                );

                if (
                    botao.dataset.filtro ===
                    filtroAtual
                ) {

                    botao.classList.add(
                        'filtro-ativo'
                    );

                }

            }
        );


    desmarcarTodosProdutos();

    renderizarProdutos();

}


// ============================================================
// 21. IMPORTAR / SINCRONIZAR SELECIONADOS
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
            'Deseja importar ou atualizar esses produtos no ZoraVision?'
        );


    if (!confirmar) {

        return;

    }


    const botao =
        obterElemento(
            'btn-importar-selecionados'
        );


    const botaoSincronizar =
        obterElemento(
            'btn-sincronizar-selecionados'
        );


    if (botao) {

        botao.disabled =
            true;

        botao.textContent =
            'Processando...';

    }


    if (botaoSincronizar) {

        botaoSincronizar.disabled =
            true;

        botaoSincronizar.textContent =
            'Processando...';

    }


    mostrarMensagem(
        'Importando e atualizando produtos...',
        'info'
    );


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

        } catch {

            resultado =
                null;

        }


        console.log(
            'Resultado da sincronização:',
            resultado
        );


        if (
            !resposta.ok
        ) {

            throw new Error(
                resultado?.erro ||
                resultado?.error ||
                'A importação falhou.'
            );

        }


        if (
            resultado &&
            resultado.sucesso === false
        ) {

            throw new Error(
                resultado.erro ||
                'A Edge Function não conseguiu concluir a operação.'
            );

        }


        const encontrados =
            Number(
                resultado?.total_encontrados ||
                0
            );


        const criados =
            Number(
                resultado?.criados ||
                0
            );


        const atualizados =
            Number(
                resultado?.atualizados ||
                0
            );


        const erros =
            Number(
                resultado?.erros ||
                0
            );


        let mensagem =
            'Operação concluída!\n\n';


        mensagem +=
            'Encontrados: ' +
            encontrados +
            '\n';


        mensagem +=
            'Criados: ' +
            criados +
            '\n';


        mensagem +=
            'Atualizados: ' +
            atualizados +
            '\n';


        mensagem +=
            'Erros: ' +
            erros;


        alert(
            mensagem
        );


        desmarcarTodosProdutos();


        await carregarProdutosMercadoLivre();


    } catch (erro) {

        console.error(
            'Erro ao sincronizar produtos:',
            erro
        );


        mostrarMensagem(
            erro?.message ||
            'Não foi possível sincronizar os produtos.',
            'erro'
        );


        alert(
            'Não foi possível concluir a operação.\n\n' +
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
                'Importar selecionados';

        }


        if (botaoSincronizar) {

            botaoSincronizar.disabled =
                false;

            botaoSincronizar.textContent =
                'Sincronizar selecionados';

        }


        atualizarContadorSelecionados();

    }

}


// ============================================================
// 22. ATUALIZAR PRODUTOS
// ============================================================

async function atualizarProdutos() {

    const botao =
        obterElemento(
            'btn-atualizar-produtos'
        );


    if (botao) {

        botao.disabled =
            true;

        botao.textContent =
            'Atualizando...';

    }


    try {

        await carregarProdutosMercadoLivre();

    } finally {

        if (botao) {

            botao.disabled =
                false;

            botao.textContent =
                'Atualizar';

        }

    }

}


// ============================================================
// 23. CONFIGURAR FILTROS
// ============================================================

function configurarFiltros() {

    document
        .querySelectorAll(
            '[data-filtro]'
        )
        .forEach(
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
                    function() {

                        aplicarFiltro(
                            botao.dataset.filtro
                        );

                    }
                );

            }
        );

}


// ============================================================
// 24. CONFIGURAR BOTÕES
// ============================================================

function configurarBotoesProdutos() {

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


    const botaoImportar =
        obterElemento(
            'btn-importar-selecionados'
        );


    if (
        botaoImportar &&
        botaoImportar.dataset.configurado !== 'true'
    ) {

        botaoImportar.dataset.configurado =
            'true';


        botaoImportar.addEventListener(
            'click',
            sincronizarProdutosSelecionados
        );


        botaoImportar.disabled =
            true;

    }


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
            atualizarProdutos
        );

    }


    configurarFiltros();

}


// ============================================================
// 25. INICIALIZAÇÃO
// ============================================================

document.addEventListener(
    'DOMContentLoaded',
    async function() {

        console.log(
            '============================================================'
        );

        console.log(
            'ZoraVision - Produtos Mercado Livre'
        );

        console.log(
            'Inicializando gerenciamento administrativo...'
        );

        console.log(
            '============================================================'
        );


        configurarBotoesProdutos();


        atualizarResumo();


        await carregarProdutosMercadoLivre();


        console.log(
            'Inicialização concluída.'
        );

    }
);


// ============================================================
// 26. FUNÇÕES GLOBAIS
// ============================================================

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

window.atualizarProdutos =
    atualizarProdutos;

window.aplicarFiltro =
    aplicarFiltro;

