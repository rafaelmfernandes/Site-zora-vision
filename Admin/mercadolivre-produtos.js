// ============================================================
// ZORAVISION - PRODUTOS DO MERCADO LIVRE
// Arquivo:
// Admin/mercadolivre-produtos.js
//
// Responsabilidades:
//
// - Verificar produtos importados do Mercado Livre
// - Mostrar produtos ativos no ZoraVision
// - Mostrar produtos inativos no ZoraVision
// - Mostrar status do Mercado Livre
// - Permitir ativar produto
// - Permitir inativar produto
// - Permitir selecionar produtos
// - Permitir selecionar todos
// - Atualizar produtos
// - Sincronizar produtos
// - Evitar exclusão do produto do banco
// ============================================================


// ============================================================
// 1. CONFIGURAÇÕES
// ============================================================

const EDGE_FUNCTION_IMPORTAR =
    'https://ratajxnxkjoiuknamacn.supabase.co/functions/v1/mercadolivre-importar-produtos';


// ============================================================
// 2. OBTER SUPABASE
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
// 3. ELEMENTOS
// ============================================================

function obterElemento(id) {

    return document.getElementById(id);

}


// ============================================================
// 4. MENSAGEM
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
// 5. ESCONDER MENSAGEM
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
// 6. FORMATAR PREÇO
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
// 7. STATUS DO MERCADO LIVRE
// ============================================================

function obterStatusMercadoLivre(
    produto
) {

    /*
    O status original do Mercado Livre pode não estar
    salvo atualmente na tabela produtos.

    Quando essa informação não existir, usamos
    "Disponível" como estado informativo.
    */

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

    return 'Importado';

}


// ============================================================
// 8. TEXTO DO STATUS MERCADO LIVRE
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

    return 'Importado do Mercado Livre';

}


// ============================================================
// 9. CRIAR BADGE DE STATUS
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
// 10. ALTERAR STATUS DO PRODUTO
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

        console.log(
            'Alterando status do produto:',
            produtoId,
            'Novo status:',
            produtoAtivo
        );

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

            console.error(
                'Erro ao alterar status:',
                resultado.error
            );

            throw resultado.error;

        }

        console.log(
            'Status alterado com sucesso.'
        );

        await carregarProdutosMercadoLivre();

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

        if (botao) {

            botao.disabled =
                false;

            botao.textContent =
                textoOriginal;

        }

    }

}


// ============================================================
// 11. INATIVAR PRODUTO
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
// 12. ATIVAR PRODUTO
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
// 13. CRIAR CARD DO PRODUTO
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
        produto.ativo === false
    ) {

        card.classList.add(
            'produto-inativo'
        );

    } else {

        card.classList.add(
            'produto-ativo'
        );

    }

    card.dataset.produtoId =
        produto.id || '';

    card.dataset.itemId =
        produto.mercado_livre_item_id || '';


    // ========================================================
    // ÁREA DE SELEÇÃO
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
        produto.id || '';

    checkbox.dataset.itemId =
        produto.mercado_livre_item_id || '';


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


    // ========================================================
    // AÇÕES
    // ========================================================

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
// 14. BUSCAR PRODUTOS
// ============================================================

async function carregarProdutosMercadoLivre() {

    console.log(
        '============================================================'
    );

    console.log(
        'ZoraVision - Produtos Mercado Livre'
    );

    console.log(
        'Buscando produtos importados...'
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

            throw resultado.error;

        }


        const produtos =
            resultado.data ||
            [];


        console.log(
            'Produtos encontrados:',
            produtos.length
        );


        atualizarResumoProdutos(
            produtos
        );


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


// ============================================================
// 15. ATUALIZAR RESUMO
// ============================================================

function atualizarResumoProdutos(
    produtos
) {

    const total =
        obterElemento(
            'total-produtos'
        );

    if (total) {

        total.textContent =
            produtos.length;

    }


    const ativos =
        produtos.filter(
            produto =>
                produto.ativo === true
        ).length;


    const inativos =
        produtos.filter(
            produto =>
                produto.ativo !== true
        ).length;


    const totalAtivos =
        obterElemento(
            'total-ativos'
        );

    if (totalAtivos) {

        totalAtivos.textContent =
            ativos;

    }


    const totalInativos =
        obterElemento(
            'total-inativos'
        );

    if (totalInativos) {

        totalInativos.textContent =
            inativos;

    }


    const contador =
        obterElemento(
            'contador-produtos'
        );

    if (contador) {

        if (
            produtos.length === 0
        ) {

            contador.textContent =
                'Nenhum produto';

        } else {

            contador.textContent =
                produtos.length +
                (
                    produtos.length === 1
                        ? ' produto encontrado'
                        : ' produtos encontrados'
                );

        }

    }

}


// ============================================================
// 16. ATUALIZAR CONTADOR DE SELECIONADOS
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


    if (contador) {

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


    if (botao) {

        botao.disabled =
            checkboxes.length === 0;

    }


    atualizarEstadoCheckboxTodos();

}


// ============================================================
// 17. ATUALIZAR CHECKBOX TODOS
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
// 18. SELECIONAR TODOS
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
// 19. DESMARCAR TODOS
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

        checkboxTodos.indeterminate =
            false;

    }


    atualizarContadorSelecionados();

}


// ============================================================
// 20. ALTERNAR SELEÇÃO TODOS
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
// 21. OBTER PRODUTOS SELECIONADOS
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
                    checkbox.value,

                mercado_livre_item_id:
                    checkbox.dataset.itemId

            });

        }
    );


    return produtos;

}


// ============================================================
// 22. SINCRONIZAR PRODUTOS SELECIONADOS
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
            'Deseja atualizar a sincronização do Mercado Livre?'
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
                'Importar selecionados';

        }

        atualizarContadorSelecionados();

    }

}


// ============================================================
// 23. CONFIGURAR BOTÕES
// ============================================================

function configurarBotoesProdutos() {

    // --------------------------------------------------------
    // CHECKBOX SELECIONAR TODOS
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
// 24. INICIALIZAÇÃO
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


// ============================================================
// 25. FUNÇÕES GLOBAIS
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

window.ativarProduto =
    ativarProduto;

window.inativarProduto =
    inativarProduto;

window.alterarStatusProduto =
    alterarStatusProduto;