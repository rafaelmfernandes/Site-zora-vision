
// ============================================================
// ZORAVISION - 05-PEDIDO-CONFIRMADO.JS
//
// Responsabilidades:
// - Carregar o pedido confirmado
// - Buscar o pedido atualizado no Supabase
// - Exibir número do pedido
// - Exibir data
// - Exibir forma de pagamento
// - Exibir itens comprados
// - Exibir subtotal, frete, desconto e total
// - Exibir hora da aprovação
// - Exibir endereço de entrega
// - Atualizar status visual
//
// Compatível com:
// 04-pedido-confirmado.html
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

        const dados =
            localStorage.getItem('usuario_logado');

        if (!dados) {
            return null;
        }

        const usuario =
            JSON.parse(dados);

        if (!usuario) {
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
// 3. ELEMENTO
// ============================================================

function obterElementoPedidoConfirmado(id) {

    return document.getElementById(id);
}


// ============================================================
// 4. FORMATAR VALOR
// ============================================================

function formatarValorPedidoConfirmado(valor) {

    const numero =
        Number(valor) || 0;

    return numero.toLocaleString(
        'pt-BR',
        {
            style: 'currency',
            currency: 'BRL'
        }
    );
}


// ============================================================
// 5. FORMATAR DATA
// ============================================================

function formatarDataPedidoConfirmado(data) {

    if (!data) {
        return '-';
    }

    const dataFormatada =
        new Date(data);

    if (
        Number.isNaN(
            dataFormatada.getTime()
        )
    ) {
        return '-';
    }

    return dataFormatada.toLocaleDateString(
        'pt-BR'
    );
}


// ============================================================
// 6. FORMATAR HORA
// ============================================================

function formatarHoraPedidoConfirmado(data) {

    if (!data) {
        return '-';
    }

    const dataFormatada =
        new Date(data);

    if (
        Number.isNaN(
            dataFormatada.getTime()
        )
    ) {
        return '-';
    }

    return dataFormatada.toLocaleTimeString(
        'pt-BR',
        {
            hour: '2-digit',
            minute: '2-digit'
        }
    );
}


// ============================================================
// 7. OBTER PEDIDO SALVO LOCALMENTE
// ============================================================

function obterPedidoLocalConfirmado() {

    const chaves = [

        'pedido_pix_atual',

        'pedido_atual',

        'pedido_confirmado'

    ];


    for (
        const chave
        of chaves
    ) {

        try {

            const dados =
                localStorage.getItem(chave);

            if (!dados) {
                continue;
            }

            const pedido =
                JSON.parse(dados);

            if (
                pedido &&
                pedido.id
            ) {

                return pedido;
            }

        } catch (erro) {

            console.warn(
                `Erro ao ler ${chave}:`,
                erro
            );
        }
    }

    return null;
}


// ============================================================
// 8. OBTER ID DO PEDIDO
// ============================================================

function obterIdPedidoConfirmado() {

    const pedidoLocal =
        obterPedidoLocalConfirmado();


    if (
        pedidoLocal &&
        pedidoLocal.id
    ) {

        return pedidoLocal.id;
    }


    const chaves = [

        'pedido_id_pix_verificacao',

        'pedido_id',

        'pedido_confirmado_id'

    ];


    for (
        const chave
        of chaves
    ) {

        const valor =
            localStorage.getItem(chave);

        if (valor) {

            return valor;
        }
    }


    return null;
}


// ============================================================
// 9. BUSCAR PEDIDO NO SUPABASE
// ============================================================

async function buscarPedidoConfirmadoNoSupabase(
    pedidoId
) {

    if (!pedidoId) {

        console.warn(
            'ID do pedido não informado.'
        );

        return null;
    }


    const supabase =
        obterSupabasePedidoConfirmado();


    if (!supabase) {
        return null;
    }


    try {

        console.log(
            'Buscando pedido no Supabase:',
            pedidoId
        );


        // ----------------------------------------------------
        // BUSCA O PEDIDO
        // ----------------------------------------------------

        const {
            data: pedido,
            error: erroPedido
        } =
            await supabase
                .from('pedidos')
                .select('*')
                .eq('id', pedidoId)
                .maybeSingle();


        if (erroPedido) {

            console.error(
                'Erro ao buscar pedido:',
                erroPedido
            );

            return null;
        }


        if (!pedido) {

            console.warn(
                'Pedido não encontrado:',
                pedidoId
            );

            return null;
        }


        console.log(
            'Pedido encontrado:',
            pedido
        );


        // ----------------------------------------------------
        // BUSCA OS ITENS
        // ----------------------------------------------------

        const {
            data: itens,
            error: erroItens
        } =
            await supabase
                .from('itens_pedido')
                .select(`
                    id,
                    pedido_id,
                    produto_id,
                    nome_produto,
                    quantidade,
                    preco_unitario,
                    subtotal,
                    created_at
                `)
                .eq(
                    'pedido_id',
                    pedido.id
                )
                .order(
                    'id',
                    {
                        ascending: true
                    }
                );


        if (erroItens) {

            console.error(
                'Erro ao buscar itens do pedido:',
                erroItens
            );

            pedido.itens_pedido = [];

        } else {

            pedido.itens_pedido =
                itens || [];
        }


        // ----------------------------------------------------
        // BUSCA O ENDEREÇO
        // ----------------------------------------------------

        pedido.enderecos = null;


        if (
            pedido.endereco_id
        ) {

            const {
                data: endereco,
                error: erroEndereco
            } =
                await supabase
                    .from('enderecos')
                    .select(`
                        id,
                        cliente_id,
                        nome_destinatario,
                        cep,
                        rua,
                        numero,
                        complemento,
                        bairro,
                        cidade,
                        estado,
                        principal,
                        created_at,
                        updated_at
                    `)
                    .eq(
                        'id',
                        pedido.endereco_id
                    )
                    .maybeSingle();


            if (erroEndereco) {

                console.error(
                    'Erro ao buscar endereço:',
                    erroEndereco
                );

            } else {

                pedido.enderecos =
                    endereco || null;
            }
        }


        console.log(
            'Pedido completo:',
            pedido
        );


        return pedido;

    } catch (erro) {

        console.error(
            'Erro inesperado ao buscar pedido:',
            erro
        );

        return null;
    }
}


// ============================================================
// 10. SALVAR PEDIDO ATUALIZADO
// ============================================================

function salvarPedidoConfirmadoLocal(
    pedido
) {

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


        localStorage.setItem(
            'pedido_confirmado',
            JSON.stringify(pedido)
        );


        if (pedido.id) {

            localStorage.setItem(
                'pedido_id_pix_verificacao',
                String(pedido.id)
            );

            localStorage.setItem(
                'pedido_id',
                String(pedido.id)
            );

            localStorage.setItem(
                'pedido_confirmado_id',
                String(pedido.id)
            );
        }

    } catch (erro) {

        console.warn(
            'Não foi possível salvar o pedido:',
            erro
        );
    }
}


// ============================================================
// 11. NÚMERO DO PEDIDO
// ============================================================

function renderizarNumeroPedidoConfirmado(
    pedido
) {

    const elemento =
        obterElementoPedidoConfirmado(
            'conf-numero-pedido'
        );


    if (!elemento) {
        return;
    }


    const numero =
        pedido.numero_pedido ||
        pedido.numero ||
        pedido.id ||
        '-';


    const texto =
        String(numero).startsWith('#')
            ? String(numero)
            : `#${numero}`;


    elemento.textContent =
        texto;
}


// ============================================================
// 12. DATA
// ============================================================

function renderizarDataPedidoConfirmado(
    pedido
) {

    const elemento =
        obterElementoPedidoConfirmado(
            'conf-data-pedido'
        );


    if (!elemento) {
        return;
    }


    elemento.textContent =
        formatarDataPedidoConfirmado(
            pedido.created_at
        );
}


// ============================================================
// 13. FORMA DE PAGAMENTO
// ============================================================

function renderizarPagamentoPedidoConfirmado(
    pedido
) {

    const elemento =
        obterElementoPedidoConfirmado(
            'conf-pagamento'
        );


    if (!elemento) {
        return;
    }


    let pagamento =
        pedido.forma_pagamento ||
        'PIX';


    pagamento =
        String(pagamento)
            .replaceAll('_', ' ')
            .toUpperCase();


    elemento.textContent =
        pagamento;
}


// ============================================================
// 14. SUBTOTAL
// ============================================================

function renderizarSubtotalPedidoConfirmado(
    pedido
) {

    const elemento =
        obterElementoPedidoConfirmado(
            'conf-subtotal'
        );


    if (!elemento) {
        return;
    }


    elemento.textContent =
        formatarValorPedidoConfirmado(
            pedido.subtotal
        );
}


// ============================================================
// 15. FRETE
// ============================================================

function renderizarFretePedidoConfirmado(
    pedido
) {

    const elemento =
        obterElementoPedidoConfirmado(
            'conf-frete'
        );


    if (!elemento) {
        return;
    }


    elemento.textContent =
        formatarValorPedidoConfirmado(
            pedido.frete
        );
}


// ============================================================
// 16. DESCONTO
// ============================================================

function renderizarDescontoPedidoConfirmado(
    pedido
) {

    const elemento =
        obterElementoPedidoConfirmado(
            'conf-desconto'
        );


    if (!elemento) {
        return;
    }


    elemento.textContent =
        formatarValorPedidoConfirmado(
            pedido.desconto
        );
}


// ============================================================
// 17. TOTAL
// ============================================================

function renderizarTotalPedidoConfirmado(
    pedido
) {

    const elemento =
        obterElementoPedidoConfirmado(
            'conf-total-pago'
        );


    if (!elemento) {
        return;
    }


    elemento.textContent =
        formatarValorPedidoConfirmado(
            pedido.total
        );
}


// ============================================================
// 18. ITENS
// ============================================================

function renderizarItensPedidoConfirmado(
    pedido
) {

    const container =
        obterElementoPedidoConfirmado(
            'conf-lista-itens'
        );


    if (!container) {
        return;
    }


    const itens =
        Array.isArray(
            pedido.itens_pedido
        )
            ? pedido.itens_pedido
            : [];


    if (
        itens.length === 0
    ) {

        container.innerHTML = `
            <p style="
                color:#64748b;
                margin:0;
                font-size:14px;
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

                    const nome =
                        item.nome_produto ||
                        'Produto';


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
                        (
                            preco *
                            quantidade
                        );


                    return `
                        <div
                            style="
                                display:flex;
                                justify-content:space-between;
                                align-items:center;
                                gap:10px;
                                padding:8px 0;
                                border-bottom:1px solid #f1f5f9;
                            "
                        >

                            <div
                                style="
                                    display:flex;
                                    flex-direction:column;
                                    gap:3px;
                                "
                            >

                                <strong
                                    style="
                                        color:#0f172a;
                                        font-size:14px;
                                    "
                                >
                                    ${escaparHTMLPedidoConfirmado(nome)}
                                </strong>

                                <span
                                    style="
                                        color:#64748b;
                                        font-size:12px;
                                    "
                                >
                                    ${quantidade}x
                                    ${formatarValorPedidoConfirmado(preco)}
                                </span>

                            </div>

                            <strong
                                style="
                                    color:#0f172a;
                                    font-size:14px;
                                    white-space:nowrap;
                                "
                            >
                                ${formatarValorPedidoConfirmado(subtotal)}
                            </strong>

                        </div>
                    `;
                }
            )
            .join('');
}


// ============================================================
// 19. ESCAPAR HTML
// ============================================================

function escaparHTMLPedidoConfirmado(
    valor
) {

    return String(valor)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}


// ============================================================
// 20. HORA DA APROVAÇÃO
// ============================================================

function renderizarHoraAprovadoPedidoConfirmado(
    pedido
) {

    const elemento =
        obterElementoPedidoConfirmado(
            'conf-hora-aprovado'
        );


    if (!elemento) {
        return;
    }


    const statusPagamento =
        String(
            pedido.status_pagamento ||
            ''
        ).toLowerCase();


    let dataAprovacao;


    if (
        statusPagamento === 'aprovado' ||
        statusPagamento === 'pago' ||
        statusPagamento === 'approved'
    ) {

        dataAprovacao =
            pedido.updated_at ||
            pedido.created_at;

    } else {

        dataAprovacao =
            pedido.created_at;
    }


    elemento.textContent =
        formatarHoraPedidoConfirmado(
            dataAprovacao
        );
}


// ============================================================
// 21. ENDEREÇO
// ============================================================

function renderizarEnderecoPedidoConfirmado(
    pedido
) {

    const container =
        obterElementoPedidoConfirmado(
            'conf-container-endereco'
        );


    if (!container) {
        return;
    }


    let endereco =
        null;


    // --------------------------------------------------------
    // ENDEREÇO VINDO DO BANCO
    // --------------------------------------------------------

    if (
        pedido.enderecos
    ) {

        if (
            Array.isArray(
                pedido.enderecos
            )
        ) {

            endereco =
                pedido.enderecos[0] ||
                null;

        } else {

            endereco =
                pedido.enderecos;
        }
    }


    // --------------------------------------------------------
    // FALLBACK LOCALSTORAGE
    // --------------------------------------------------------

    if (!endereco) {

        try {

            const usuario =
                obterUsuarioPedidoConfirmado();


            const chaves = [];


            if (
                usuario &&
                usuario.email
            ) {

                chaves.push(
                    'ultimo_endereco_cliente_' +
                    String(
                        usuario.email
                    )
                        .trim()
                        .toLowerCase()
                );
            }


            chaves.push(
                'ultimo_endereco_cliente'
            );


            for (
                const chave
                of chaves
            ) {

                const dados =
                    localStorage.getItem(
                        chave
                    );


                if (!dados) {
                    continue;
                }


                const enderecoLocal =
                    JSON.parse(
                        dados
                    );


                if (
                    enderecoLocal &&
                    (
                        enderecoLocal.rua ||
                        enderecoLocal.cep
                    )
                ) {

                    endereco =
                        enderecoLocal;

                    break;
                }
            }

        } catch (erro) {

            console.warn(
                'Erro ao obter endereço local:',
                erro
            );
        }
    }


    // --------------------------------------------------------
    // SEM ENDEREÇO
    // --------------------------------------------------------

    if (!endereco) {

        container.innerHTML = `
            <p style="
                color:#64748b;
                margin:0;
            ">
                Endereço de entrega não encontrado.
            </p>
        `;

        return;
    }


    const nome =
        endereco.nome_destinatario ||
        endereco.nome ||
        '';


    const rua =
        endereco.rua ||
        '';


    const numero =
        endereco.numero ||
        '';


    const complemento =
        endereco.complemento ||
        '';


    const bairro =
        endereco.bairro ||
        '';


    const cidade =
        endereco.cidade ||
        '';


    const estado =
        endereco.estado ||
        endereco.uf ||
        '';


    const cep =
        endereco.cep ||
        '';


    container.innerHTML = `

        ${
            nome
                ? `
                    <strong
                        style="
                            display:block;
                            color:#0f172a;
                            margin-bottom:4px;
                        "
                    >
                        ${escaparHTMLPedidoConfirmado(nome)}
                    </strong>
                `
                : ''
        }

        ${
            rua
                ? `
                    <div>
                        ${escaparHTMLPedidoConfirmado(rua)}
                        ${
                            numero
                                ? `, nº ${escaparHTMLPedidoConfirmado(numero)}`
                                : ''
                        }
                    </div>
                `
                : ''
        }

        ${
            complemento
                ? `
                    <div>
                        ${escaparHTMLPedidoConfirmado(complemento)}
                    </div>
                `
                : ''
        }

        ${
            bairro
                ? `
                    <div>
                        ${escaparHTMLPedidoConfirmado(bairro)}
                    </div>
                `
                : ''
        }

        ${
            cidade
                ? `
                    <div>
                        ${escaparHTMLPedidoConfirmado(cidade)}
                        ${
                            estado
                                ? `/${escaparHTMLPedidoConfirmado(String(estado).toUpperCase())}`
                                : ''
                        }
                    </div>
                `
                : ''
        }

        ${
            cep
                ? `
                    <div
                        style="
                            margin-top:4px;
                            color:#2563eb;
                            font-weight:600;
                        "
                    >
                        CEP:
                        ${escaparHTMLPedidoConfirmado(cep)}
                    </div>
                `
                : ''
        }
    `;
}


// ============================================================
// 22. STATUS VISUAL
// ============================================================

function atualizarStatusVisualPedidoConfirmado(
    pedido
) {

    if (!pedido) {
        return;
    }


    const passos =
        document.querySelectorAll(
            '.status-passo'
        );


    if (!passos.length) {
        return;
    }


    const statusPagamento =
        String(
            pedido.status_pagamento ||
            ''
        )
            .trim()
            .toLowerCase();


    const statusPedido =
        String(
            pedido.status ||
            ''
        )
            .trim()
            .toLowerCase();


    // --------------------------------------------------------
    // RESET
    // --------------------------------------------------------

    passos.forEach(
        passo => {

            passo.classList.remove(
                'concluido'
            );

            passo.classList.remove(
                'ativo'
            );
        }
    );


    // --------------------------------------------------------
    // PAGAMENTO
    // --------------------------------------------------------

    if (
        statusPagamento === 'aprovado' ||
        statusPagamento === 'pago' ||
        statusPagamento === 'approved'
    ) {

        if (passos[0]) {

            passos[0]
                .classList.add(
                    'concluido'
                );
        }

    } else {

        if (passos[0]) {

            passos[0]
                .classList.add(
                    'ativo'
                );
        }
    }


    // --------------------------------------------------------
    // SEPARAÇÃO
    // --------------------------------------------------------

    if (
        statusPedido === 'processando' ||
        statusPedido === 'separando' ||
        statusPedido === 'separacao'
    ) {

        if (passos[1]) {

            passos[1]
                .classList.add(
                    'ativo'
                );
        }

    } else if (
        statusPedido === 'enviado' ||
        statusPedido === 'entregue' ||
        statusPedido === 'concluido' ||
        statusPedido === 'finalizado'
    ) {

        if (passos[1]) {

            passos[1]
                .classList.add(
                    'concluido'
                );
        }
    }


    // --------------------------------------------------------
    // TRANSPORTE
    // --------------------------------------------------------

    if (
        statusPedido === 'enviado' ||
        statusPedido === 'em_transporte' ||
        statusPedido === 'transporte' ||
        statusPedido === 'entregue' ||
        statusPedido === 'concluido' ||
        statusPedido === 'finalizado'
    ) {

        if (passos[2]) {

            passos[2]
                .classList.add(
                    'concluido'
                );
        }
    }
}


// ============================================================
// 23. RENDERIZAR PEDIDO COMPLETO
// ============================================================

function renderizarPedidoConfirmado(
    pedido
) {

    if (!pedido) {
        return;
    }


    console.log(
        'Renderizando pedido confirmado:',
        pedido
    );


    renderizarNumeroPedidoConfirmado(
        pedido
    );


    renderizarDataPedidoConfirmado(
        pedido
    );


    renderizarPagamentoPedidoConfirmado(
        pedido
    );


    renderizarSubtotalPedidoConfirmado(
        pedido
    );


    renderizarFretePedidoConfirmado(
        pedido
    );


    renderizarDescontoPedidoConfirmado(
        pedido
    );


    renderizarTotalPedidoConfirmado(
        pedido
    );


    renderizarItensPedidoConfirmado(
        pedido
    );


    renderizarHoraAprovadoPedidoConfirmado(
        pedido
    );


    renderizarEnderecoPedidoConfirmado(
        pedido
    );


    atualizarStatusVisualPedidoConfirmado(
        pedido
    );
}


// ============================================================
// 24. CARREGAR PEDIDO
// ============================================================

async function carregarPedidoConfirmado() {

    console.log(
        '=========================================='
    );

    console.log(
        'ZORAVISION - PEDIDO CONFIRMADO'
    );

    console.log(
        '=========================================='
    );


    const pedidoLocal =
        obterPedidoLocalConfirmado();


    const pedidoId =
        obterIdPedidoConfirmado();


    console.log(
        'Pedido salvo localmente:',
        pedidoLocal
    );


    console.log(
        'ID do pedido:',
        pedidoId
    );


    // --------------------------------------------------------
    // RENDERIZAÇÃO LOCAL INICIAL
    // --------------------------------------------------------

    if (pedidoLocal) {

        renderizarPedidoConfirmado(
            pedidoLocal
        );
    }


    // --------------------------------------------------------
    // SEM ID
    // --------------------------------------------------------

    if (!pedidoId) {

        console.warn(
            'ID do pedido não encontrado no localStorage.'
        );


        const numero =
            obterElementoPedidoConfirmado(
                'conf-numero-pedido'
            );


        if (numero) {

            numero.textContent =
                'Pedido não identificado';
        }


        return;
    }


    // --------------------------------------------------------
    // BUSCA NO SUPABASE
    // --------------------------------------------------------

    const pedidoAtualizado =
        await buscarPedidoConfirmadoNoSupabase(
            pedidoId
        );


    if (!pedidoAtualizado) {

        console.warn(
            'Não foi possível atualizar o pedido pelo Supabase.'
        );

        return;
    }


    // --------------------------------------------------------
    // RENDERIZAÇÃO FINAL
    // --------------------------------------------------------

    renderizarPedidoConfirmado(
        pedidoAtualizado
    );


    // --------------------------------------------------------
    // SALVA NOVAMENTE
    // --------------------------------------------------------

    salvarPedidoConfirmadoLocal(
        pedidoAtualizado
    );


    console.log(
        'Pedido confirmado carregado com sucesso.'
    );
}


// ============================================================
// 25. VOLTAR PARA A LOJA
// ============================================================

function voltarParaLoja() {

    window.location.href =
        'index.html';
}


// ============================================================
// 26. IR PARA MEUS PEDIDOS
// ============================================================

function irParaMeusPedidos() {

    window.location.href =
        '03-Meus-pedidos.html';
}


// ============================================================
// 27. INICIALIZAÇÃO
// ============================================================

document.addEventListener(
    'DOMContentLoaded',
    () => {

        carregarPedidoConfirmado();

    }
);


// ============================================================
// 28. EXPORTAÇÕES GLOBAIS
// ============================================================

window.carregarPedidoConfirmado =
    carregarPedidoConfirmado;

window.voltarParaLoja =
    voltarParaLoja;

window.irParaMeusPedidos =
    irParaMeusPedidos;

window.formatarValorPedidoConfirmado =
    formatarValorPedidoConfirmado;

window.renderizarPedidoConfirmado =
    renderizarPedidoConfirmado;

