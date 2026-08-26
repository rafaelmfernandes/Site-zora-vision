
// ============================================================
// ZORAVISION - PEDIDO.JS
// Responsável pelas operações relacionadas aos pedidos
// ============================================================


// ============================================================
// 1. SUPABASE
// ============================================================

function obterSupabasePedido() {

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

function obterUsuarioPedido() {

    try {

        const usuario =
            JSON.parse(
                localStorage.getItem(
                    'usuario_logado'
                )
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
// 3. BUSCAR CLIENTE
// ============================================================

async function buscarClientePedido() {

    const usuario =
        obterUsuarioPedido();

    if (!usuario) {
        return null;
    }

    const supabase =
        obterSupabasePedido();

    if (!supabase) {
        return null;
    }

    try {

        // Primeiro tenta localizar pelo auth_user_id
        const respostaAuth =
            await supabase
                .from('clientes')
                .select('*')
                .eq(
                    'auth_user_id',
                    usuario.id
                )
                .maybeSingle();

        if (
            respostaAuth.data &&
            !respostaAuth.error
        ) {
            return respostaAuth.data;
        }


        // Caso não encontre, tenta pelo e-mail
        const respostaEmail =
            await supabase
                .from('clientes')
                .select('*')
                .eq(
                    'email',
                    usuario.email
                )
                .maybeSingle();

        if (
            respostaEmail.data &&
            !respostaEmail.error
        ) {
            return respostaEmail.data;
        }


        console.error(
            'Cliente não encontrado:',
            respostaAuth.error ||
            respostaEmail.error
        );

        return null;

    } catch (erro) {

        console.error(
            'Erro ao buscar cliente:',
            erro
        );

        return null;
    }
}


// ============================================================
// 4. BUSCAR PEDIDO POR ID
// ============================================================

async function buscarPedidoPorId(
    pedidoId
) {

    if (!pedidoId) {
        return null;
    }

    const supabase =
        obterSupabasePedido();

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
                'Erro ao buscar pedido:',
                error
            );

            return null;
        }


        return data;

    } catch (erro) {

        console.error(
            'Erro inesperado ao buscar pedido:',
            erro
        );

        return null;
    }
}


// ============================================================
// 5. BUSCAR PEDIDO POR NÚMERO
// ============================================================

async function buscarPedidoPorNumero(
    numeroPedido
) {

    if (!numeroPedido) {
        return null;
    }

    const supabase =
        obterSupabasePedido();

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
                    'numero_pedido',
                    numeroPedido
                )
                .maybeSingle();


        if (error) {

            console.error(
                'Erro ao buscar pedido pelo número:',
                error
            );

            return null;
        }


        return data;

    } catch (erro) {

        console.error(
            'Erro inesperado ao buscar pedido:',
            erro
        );

        return null;
    }
}


// ============================================================
// 6. LISTAR PEDIDOS DO CLIENTE
// ============================================================

async function listarPedidosCliente() {

    const cliente =
        await buscarClientePedido();

    if (
        !cliente ||
        !cliente.id
    ) {
        return [];
    }

    const supabase =
        obterSupabasePedido();

    if (!supabase) {
        return [];
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
                        produto_id,
                        nome_produto,
                        quantidade,
                        preco_unitario,
                        subtotal
                    )
                `)
                .eq(
                    'cliente_id',
                    cliente.id
                )
                .order(
                    'created_at',
                    {
                        ascending: false
                    }
                );


        if (error) {

            console.error(
                'Erro ao listar pedidos:',
                error
            );

            return [];
        }


        return Array.isArray(data)
            ? data
            : [];

    } catch (erro) {

        console.error(
            'Erro inesperado ao listar pedidos:',
            erro
        );

        return [];
    }
}


// ============================================================
// 7. ATUALIZAR STATUS DO PEDIDO
// ============================================================

async function atualizarStatusPedido(
    pedidoId,
    novoStatus
) {

    if (
        !pedidoId ||
        !novoStatus
    ) {
        return false;
    }

    const supabase =
        obterSupabasePedido();

    if (!supabase) {
        return false;
    }

    try {

        const {
            data,
            error
        } =
            await supabase
                .from('pedidos')
                .update({
                    status: novoStatus,
                    updated_at:
                        new Date().toISOString()
                })
                .eq(
                    'id',
                    pedidoId
                )
                .select()
                .maybeSingle();


        if (error) {

            console.error(
                'Erro ao atualizar status do pedido:',
                error
            );

            return false;
        }


        console.log(
            'Status do pedido atualizado:',
            data
        );

        return true;

    } catch (erro) {

        console.error(
            'Erro inesperado ao atualizar pedido:',
            erro
        );

        return false;
    }
}


// ============================================================
// 8. ATUALIZAR STATUS DO PAGAMENTO
// ============================================================

async function atualizarStatusPagamentoPedido(
    pedidoId,
    novoStatus
) {

    if (
        !pedidoId ||
        !novoStatus
    ) {
        return false;
    }

    const supabase =
        obterSupabasePedido();

    if (!supabase) {
        return false;
    }

    try {

        const {
            data,
            error
        } =
            await supabase
                .from('pedidos')
                .update({
                    status_pagamento:
                        novoStatus,

                    updated_at:
                        new Date().toISOString()
                })
                .eq(
                    'id',
                    pedidoId
                )
                .select()
                .maybeSingle();


        if (error) {

            console.error(
                'Erro ao atualizar status do pagamento:',
                error
            );

            return false;
        }


        console.log(
            'Status do pagamento atualizado:',
            data
        );

        return true;

    } catch (erro) {

        console.error(
            'Erro inesperado ao atualizar pagamento:',
            erro
        );

        return false;
    }
}


// ============================================================
// 9. SALVAR PEDIDO ATUAL NO LOCALSTORAGE
// ============================================================

function salvarPedidoAtual(
    pedido
) {

    if (!pedido) {
        return;
    }

    try {

        localStorage.setItem(
            'pedido_atual',
            JSON.stringify(
                pedido
            )
        );

    } catch (erro) {

        console.error(
            'Erro ao salvar pedido atual:',
            erro
        );
    }
}


// ============================================================
// 10. RECUPERAR PEDIDO ATUAL
// ============================================================

function obterPedidoAtual() {

    try {

        const pedido =
            JSON.parse(
                localStorage.getItem(
                    'pedido_atual'
                )
            );

        return pedido || null;

    } catch (erro) {

        console.error(
            'Erro ao recuperar pedido atual:',
            erro
        );

        return null;
    }
}


// ============================================================
// 11. LIMPAR PEDIDO ATUAL
// ============================================================

function limparPedidoAtual() {

    localStorage.removeItem(
        'pedido_atual'
    );

    localStorage.removeItem(
        'pedido_pix_atual'
    );
}


// ============================================================
// 12. FORMATAR STATUS DO PEDIDO
// ============================================================

function formatarStatusPedido(
    status
) {

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
// 13. FORMATAR STATUS DO PAGAMENTO
// ============================================================

function formatarStatusPagamento(
    status
) {

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
// 14. FORMATAR VALOR DO PEDIDO
// ============================================================

function formatarValorPedido(
    valor
) {

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
// 15. EXPORTAÇÕES GLOBAIS
// ============================================================

window.buscarClientePedido =
    buscarClientePedido;

window.buscarPedidoPorId =
    buscarPedidoPorId;

window.buscarPedidoPorNumero =
    buscarPedidoPorNumero;

window.listarPedidosCliente =
    listarPedidosCliente;

window.atualizarStatusPedido =
    atualizarStatusPedido;

window.atualizarStatusPagamentoPedido =
    atualizarStatusPagamentoPedido;

window.salvarPedidoAtual =
    salvarPedidoAtual;

window.obterPedidoAtual =
    obterPedidoAtual;

window.limparPedidoAtual =
    limparPedidoAtual;

window.formatarStatusPedido =
    formatarStatusPedido;

window.formatarStatusPagamento =
    formatarStatusPagamento;

window.formatarValorPedido =
    formatarValorPedido;

