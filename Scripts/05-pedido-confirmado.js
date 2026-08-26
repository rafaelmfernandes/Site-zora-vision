// ============================================================
// ZORAVISION - PEDIDO-CONFIRMADO.JS
//
// RESPONSABILIDADES DESTE ARQUIVO:
// - Carregar o pedido confirmado salvo no navegador.
// - Buscar o pedido atualizado no Supabase quando possível.
// - Exibir o número do pedido.
// - Exibir o status do pedido.
// - Exibir o status do pagamento.
// - Exibir subtotal, frete, desconto e total.
// - Exibir os produtos que fazem parte do pedido.
// - Exibir quantidade e preço dos produtos.
// - Formatar valores em Real brasileiro.
// - Formatar os status do pedido e do pagamento.
// - Permitir voltar para a loja.
// - Permitir acessar a área de pedidos do cliente.
// - Exibir mensagens de erro caso o pedido não seja encontrado.
//
// NÃO É RESPONSABILIDADE DESTE ARQUIVO:
// - Criar pedidos.
// - Alterar o carrinho.
// - Processar pagamentos PIX.
// - Verificar pagamento PIX.
// - Cadastrar ou alterar endereço.
// - Fazer login ou cadastro de usuário.
// - Aplicar cupons.
//
// ARQUIVO:
// Scripts/pedido-confirmado.js
// ============================================================


// ============================================================
// 1. SUPABASE
// ============================================================

function obterSupabasePedidoConfirmado() {

    if (window.supabaseClient) {
        return window.supabaseClient;
    }

    console.error(
        'Supabase não está disponível em window.supabaseClient.'
    );

    return null;
}


// ============================================================
// 2. USUÁRIO LOGADO
// ============================================================

function obterUsuarioPedidoConfirmado() {

    try {

        const usuario =
            JSON.parse(
                localStorage.getItem('usuario_logado')
            );

        if (
            !usuario ||
            !usuario.id ||
            !usuario.email
        ) {
            return null;
        }

        return usuario;

    } catch (erro) {

        console.error(
            'Erro ao obter usuário logado:',
            erro
        );

        return null;
    }
}


// ============================================================
// 3. ELEMENTOS DA PÁGINA
// ============================================================

function obterElemento(id) {

    return document.getElementById(id);
}


// ============================================================
// 4. FORMATAR VALOR
// ============================================================

function formatarValor(valor) {

    const numero =
        Number(valor) || 0;

    return (
        'R$ ' +
        numero
            .toFixed(2)
            .replace('.', ',')
    );
}


// ============================================================
// 5. FORMATAR STATUS DO PEDIDO
// ============================================================

function formatarStatusPedidoConfirmado(status) {

    const statusMap = {

        pendente:
            'Pendente',

        confirmado:
            'Confirmado',

        processando:
            'Processando',

        enviado:
            'Enviado',

        entregue:
            'Entregue',

        cancelado:
            'Cancelado',

        concluido:
            'Concluído'
    };

    return (
        statusMap[status] ||
        status ||
        'Pendente'
    );
}


// ============================================================
// 6. FORMATAR STATUS DO PAGAMENTO
// ============================================================

function formatarStatusPagamentoConfirmado(status) {

    const statusMap = {

        pendente:
            'Pendente',

        aprovado:
            'Aprovado',

        pago:
            'Pago',

        rejeitado:
            'Rejeitado',

        cancelado:
            'Cancelado',

        expirado:
            'Expirado'
    };

    return (
        statusMap[status] ||
        status ||
        'Pendente'
    );
}


// ============================================================
// 7. RECUPERAR PEDIDO DO LOCALSTORAGE
// ============================================================

function obterPedidoLocal() {

    const chaves = [
        'pedido_pix_atual',
        'pedido_atual'
    ];

    for (const chave of chaves) {

        try {

            const dados =
                localStorage.getItem(chave);

            if (!dados) {
                continue;
            }

            const pedido =
                JSON.parse(dados);

            if (pedido && pedido.id) {
                return pedido;
            }

        } catch (erro) {

            console.warn(
                `Não foi possível ler ${chave}:`,
                erro
            );
        }
    }

    return null;
}


// ============================================================
// 8. BUSCAR PEDIDO NO SUPABASE
// ============================================================

async function buscarPedidoAtualizado(pedidoId) {

    if (!pedidoId) {
        return null;
    }

    const supabase =
        obterSupabasePedidoConfirmado();

    if (!supabase) {
        return null;
    }

    try {

        const {
            data,
            error
        } =
            await supabase
                .from('pedidos')
                .select(`
                    *,
                    itens_pedido (
                        id,
                        pedido_id,
                        produto_id,
                        nome_produto,
                        quantidade,
                        preco_unitario,
                        subtotal,
                        created_at
                    )
                `)
                .eq(
                    'id',
                    pedidoId
                )
                .maybeSingle();

        if (error) {

            console.error(
                'Erro ao buscar pedido confirmado:',
                error
            );

            return null;
        }

        return data || null;

    } catch (erro) {

        console.error(
            'Erro inesperado ao buscar pedido:',
            erro
        );

        return null;
    }
}


// ============================================================
// 9. SALVAR PEDIDO ATUALIZADO
// ============================================================

function salvarPedidoConfirmado(pedido) {

    if (!pedido) {
        return;
    }

    try {

        localStorage.setItem(
            'pedido_atual',
            JSON.stringify(pedido)
        );

        localStorage.setItem(
            'pedido_pix_atual',
            JSON.stringify(pedido)
        );

    } catch (erro) {

        console.warn(
            'Não foi possível salvar o pedido atualizado:',
            erro
        );
    }
}


// ============================================================
// 10. EXIBIR NÚMERO DO PEDIDO
// ============================================================

function renderizarNumeroPedido(pedido) {

    const elemento =
        obterElemento('numero-pedido');

    if (!elemento) {
        return;
    }

    const numero =
        pedido.numero_pedido ||
        pedido.numero ||
        pedido.id ||
        '-';

    const textoNumero =
        String(numero).startsWith('#')
            ? String(numero)
            : `#${numero}`;

    elemento.textContent =
        textoNumero;
}


// ============================================================
// 11. EXIBIR STATUS DO PEDIDO
// ============================================================

function renderizarStatusPedido(pedido) {

    const elementos =
        document.querySelectorAll(
            '#status-pedido, .status-pedido'
        );

    if (!elementos.length) {
        return;
    }

    const status =
        formatarStatusPedidoConfirmado(
            pedido.status
        );

    elementos.forEach(
        elemento => {

            elemento.textContent =
                status;

            elemento.dataset.status =
                pedido.status || 'pendente';
        }
    );
}


// ============================================================
// 12. EXIBIR STATUS DO PAGAMENTO
// ============================================================

function renderizarStatusPagamento(pedido) {

    const elementos =
        document.querySelectorAll(
            '#status-pagamento, .status-pagamento'
        );

    if (!elementos.length) {
        return;
    }

    const status =
        formatarStatusPagamentoConfirmado(
            pedido.status_pagamento
        );

    elementos.forEach(
        elemento => {

            elemento.textContent =
                status;

            elemento.dataset.status =
                pedido.status_pagamento ||
                'pendente';
        }
    );
}


// ============================================================
// 13. EXIBIR VALORES DO PEDIDO
// ============================================================

function renderizarValores(pedido) {

    const subtotal =
        formatarValor(
            pedido.subtotal
        );

    const frete =
        formatarValor(
            pedido.frete
        );

    const desconto =
        formatarValor(
            pedido.desconto
        );

    const total =
        formatarValor(
            pedido.total
        );


    const campos = {

        'pedido-subtotal':
            subtotal,

        'resumo-subtotal':
            subtotal,

        'pedido-frete':
            frete,

        'resumo-frete':
            frete,

        'pedido-desconto':
            desconto,

        'resumo-desconto':
            desconto,

        'pedido-total':
            total,

        'resumo-total':
            total,

        'valor-total':
            total
    };


    Object.entries(campos)
        .forEach(
            ([id, valor]) => {

                const elemento =
                    obterElemento(id);

                if (elemento) {
                    elemento.textContent =
                        valor;
                }
            }
        );
}


// ============================================================
// 14. RENDERIZAR ITENS DO PEDIDO
// ============================================================

function renderizarItensPedido(pedido) {

    const container =
        obterElemento('lista-itens-pedido');

    if (!container) {
        return;
    }

    const itens =
        Array.isArray(
            pedido.itens_pedido
        )
            ? pedido.itens_pedido
            : [];


    if (itens.length === 0) {

        container.innerHTML = `
            <p style="
                color:#64748b;
                font-size:14px;
                margin:0;
            ">
                Nenhum item encontrado neste pedido.
            </p>
        `;

        return;
    }


    container.innerHTML =
        itens
            .map(
                item => {

                    const quantidade =
                        Number(
                            item.quantidade
                        ) || 0;

                    const preco =
                        Number(
                            item.preco_unitario
                        ) || 0;

                    const subtotal =
                        Number(
                            item.subtotal
                        ) ||
                        preco * quantidade;


                    return `
                        <div
                            class="pedido-item"
                            data-item-id="${item.id || ''}"
                        >

                            <div class="pedido-item-info">

                                <strong>
                                    ${item.nome_produto || 'Produto'}
                                </strong>

                                <span>
                                    ${quantidade}x
                                </span>

                            </div>

                            <div class="pedido-item-preco">
                                ${formatarValor(subtotal)}
                            </div>

                        </div>
                    `;
                }
            )
            .join('');
}


// ============================================================
// 15. EXIBIR DATA DO PEDIDO
// ============================================================

function renderizarDataPedido(pedido) {

    const elemento =
        document.querySelector(
            '#data-pedido, .data-pedido'
        );

    if (!elemento) {
        return;
    }

    if (!pedido.created_at) {

        elemento.textContent =
            '-';

        return;
    }

    try {

        const data =
            new Date(
                pedido.created_at
            );

        elemento.textContent =
            data.toLocaleString(
                'pt-BR',
                {
                    dateStyle:
                        'short',

                    timeStyle:
                        'short'
                }
            );

    } catch (erro) {

        elemento.textContent =
            '-';
    }
}


// ============================================================
// 16. RENDERIZAR TODAS AS INFORMAÇÕES
// ============================================================

function renderizarPedidoConfirmado(pedido) {

    if (!pedido) {
        return;
    }

    renderizarNumeroPedido(
        pedido
    );

    renderizarStatusPedido(
        pedido
    );

    renderizarStatusPagamento(
        pedido
    );

    renderizarValores(
        pedido
    );

    renderizarItensPedido(
        pedido
    );

    renderizarDataPedido(
        pedido
    );
}


// ============================================================
// 17. MOSTRAR ERRO
// ============================================================

function mostrarErroPedidoConfirmado(mensagem) {

    const elementos =
        document.querySelectorAll(
            '#erro-pedido, .erro-pedido'
        );

    if (!elementos.length) {

        console.error(
            mensagem
        );

        return;
    }

    elementos.forEach(
        elemento => {

            elemento.textContent =
                mensagem;

            elemento.style.display =
                'block';
        }
    );
}


// ============================================================
// 18. CARREGAR PEDIDO CONFIRMADO
// ============================================================

async function carregarPedidoConfirmado() {

    const usuario =
        obterUsuarioPedidoConfirmado();

    if (!usuario) {

        mostrarErroPedidoConfirmado(
            'Você precisa estar logado para visualizar este pedido.'
        );

        return;
    }


    let pedido =
        obterPedidoLocal();


    if (!pedido) {

        mostrarErroPedidoConfirmado(
            'Não foi possível encontrar os dados deste pedido.'
        );

        return;
    }


    /*
    ------------------------------------------------------------
    EXIBE PRIMEIRO OS DADOS LOCAIS
    ------------------------------------------------------------
    */

    renderizarPedidoConfirmado(
        pedido
    );


    /*
    ------------------------------------------------------------
    BUSCA DADOS ATUALIZADOS NO SUPABASE
    ------------------------------------------------------------
    */

    const pedidoAtualizado =
        await buscarPedidoAtualizado(
            pedido.id
        );


    if (pedidoAtualizado) {

        pedido =
            pedidoAtualizado;

        renderizarPedidoConfirmado(
            pedido
        );

        salvarPedidoConfirmado(
            pedido
        );
    }
}


// ============================================================
// 19. IR PARA A LOJA
// ============================================================

function voltarParaLoja() {

    window.location.href =
        'index.html';
}


// ============================================================
// 20. IR PARA MEUS PEDIDOS
// ============================================================

function irParaMeusPedidos() {

    /*
     * Ajuste o nome do arquivo abaixo caso sua página
     * de pedidos tenha outro nome.
     */

    window.location.href =
        'Pedidos.html';
}


// ============================================================
// 21. INICIALIZAÇÃO
// ============================================================

document.addEventListener(
    'DOMContentLoaded',
    () => {

        carregarPedidoConfirmado();

    }
);


// ============================================================
// 22. EXPORTAÇÕES GLOBAIS
// ============================================================

window.carregarPedidoConfirmado =
    carregarPedidoConfirmado;

window.voltarParaLoja =
    voltarParaLoja;

window.irParaMeusPedidos =
    irParaMeusPedidos;

window.formatarValor =
    formatarValor;

window.formatarStatusPedidoConfirmado =
    formatarStatusPedidoConfirmado;

window.formatarStatusPagamentoConfirmado =
    formatarStatusPagamentoConfirmado;