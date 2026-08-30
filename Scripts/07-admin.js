
// ============================================================
// ZORAVISION - PAINEL ADMINISTRATIVO
// ============================================================
// Responsabilidades:
// - Buscar pedidos reais do Supabase
// - Buscar cliente relacionado ao pedido
// - Buscar endereço relacionado ao pedido
// - Buscar itens do pedido
// - Alterar status real do pedido
// - Exibir somente 2 pedidos na lista
// - Mostrar pedidos mais antigos primeiro
// - Busca e filtros
// - Paginação
// - Modal de detalhes
// - Buscar produtos reais
// - Buscar banners
// ============================================================


// ============================================================
// CONFIGURAÇÕES
// ============================================================

const EMAIL_ADMIN = 'rafaelmelo116@gmail.com';

const PEDIDOS_POR_PAGINA = 2;

let pedidosAdmin = [];

let paginaAtualPedidos = 1;

let pedidoSelecionadoAdmin = null;


// ============================================================
// INICIALIZAÇÃO
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {

    console.log('==========================================');
    console.log('🟢 ADMIN ZORAVISION INICIADO');
    console.log('==========================================');

    await verificarAdmin();

    criarModalDetalhesPedido();

    criarControlesBuscaPedidos();

    await carregarDashboardAdmin();

    await carregarProdutosAdmin();

    await carregarBannersAdmin();

    iniciarEventosPedidos();

});


// ============================================================
// SUPABASE
// ============================================================

function obterSupabaseAdmin() {

    const conexao =
        typeof _supabase !== 'undefined'
            ? _supabase
            : window._supabase;

    if (!conexao) {

        console.error(
            '❌ Cliente Supabase não encontrado.'
        );

        return null;
    }

    return conexao;
}


// ============================================================
// VERIFICAR ADMIN
// ============================================================

async function verificarAdmin() {

    const supabase = obterSupabaseAdmin();

    if (!supabase) {
        return false;
    }

    try {

        const {
            data,
            error
        } = await supabase.auth.getSession();

        if (error) {

            console.error(
                '❌ Erro ao verificar sessão:',
                error
            );

            return false;
        }

        const session = data?.session;

        if (!session || !session.user) {

            console.warn(
                '⚠️ Usuário não possui sessão.'
            );

            window.location.replace(
                '02-Login.html'
            );

            return false;
        }

        const email =
            session.user.email || '';

        if (
            email.toLowerCase() !==
            EMAIL_ADMIN.toLowerCase()
        ) {

            console.warn(
                '⚠️ Usuário não possui permissão administrativa.'
            );

            await supabase.auth.signOut();

            window.location.replace(
                '02-Login.html'
            );

            return false;
        }

        console.log(
            '✅ Acesso administrativo confirmado.'
        );

        return true;

    }
    catch (erro) {

        console.error(
            '❌ Erro ao verificar administrador:',
            erro
        );

        return false;
    }

}


// ============================================================
// DASHBOARD
// ============================================================

async function carregarDashboardAdmin() {

    const supabase = obterSupabaseAdmin();

    if (!supabase) {
        return;
    }

    try {

        console.log(
            '📦 Buscando pedidos reais no Supabase...'
        );

        const {
            data: pedidos,
            error
        } = await supabase
            .from('pedidos')
            .select(`
                id,
                cliente_id,
                endereco_id,
                numero_pedido,
                status,
                status_pagamento,
                forma_pagamento,
                subtotal,
                frete,
                desconto,
                total,
                observacoes,
                created_at,
                updated_at
            `)
            .order(
                'created_at',
                {
                    ascending: true
                }
            );

        if (error) {

            console.error(
                '❌ Erro ao buscar pedidos:',
                error
            );

            pedidosAdmin = [];

            atualizarDashboardVazio();

            return;
        }

        pedidosAdmin =
            Array.isArray(pedidos)
                ? pedidos
                : [];

        console.log(
            '✅ Pedidos encontrados:',
            pedidosAdmin.length
        );

        console.log(
            '📋 Pedidos brutos:',
            pedidosAdmin
        );

        await carregarDadosComplementaresPedidos();

        atualizarIndicadoresDashboard();

        renderizarPedidos();

    }
    catch (erro) {

        console.error(
            '❌ Erro inesperado ao carregar dashboard:',
            erro
        );

    }

}


// ============================================================
// CARREGAR CLIENTES, ENDEREÇOS E ITENS
// ============================================================

async function carregarDadosComplementaresPedidos() {

    const supabase = obterSupabaseAdmin();

    if (!supabase || pedidosAdmin.length === 0) {
        return;
    }

    try {

        console.log(
            '🔎 Carregando dados complementares dos pedidos...'
        );


        // ======================================================
        // CLIENTES
        // ======================================================

        const clientesIds = [
            ...new Set(
                pedidosAdmin
                    .map(pedido => pedido.cliente_id)
                    .filter(id => id)
                    .map(id => String(id))
            )
        ];


        console.log(
            '👤 IDs dos clientes:',
            clientesIds
        );


        let clientes = [];


        if (clientesIds.length > 0) {

            const {
                data,
                error
            } = await supabase
                .from('clientes')
                .select(`
                    id,
                    nome,
                    email,
                    telefone,
                    cpf
                `)
                .in(
                    'id',
                    clientesIds
                );


            if (error) {

                console.error(
                    '❌ Erro ao buscar clientes:',
                    error
                );

            }
            else {

                clientes =
                    Array.isArray(data)
                        ? data
                        : [];

                console.log(
                    '✅ Clientes encontrados:',
                    clientes
                );

            }

        }


        // ======================================================
        // ENDEREÇOS
        // ======================================================

        const enderecosIds = [
            ...new Set(
                pedidosAdmin
                    .map(pedido => pedido.endereco_id)
                    .filter(id => id)
                    .map(id => String(id))
            )
        ];


        console.log(
            '📍 IDs dos endereços:',
            enderecosIds
        );


        let enderecos = [];


        if (enderecosIds.length > 0) {

            const {
                data,
                error
            } = await supabase
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
                    principal
                `)
                .in(
                    'id',
                    enderecosIds
                );


            if (error) {

                console.error(
                    '❌ Erro ao buscar endereços:',
                    error
                );

            }
            else {

                enderecos =
                    Array.isArray(data)
                        ? data
                        : [];

                console.log(
                    '✅ Endereços encontrados:',
                    enderecos
                );

            }

        }


        // ======================================================
        // ITENS
        // ======================================================

        const pedidosIds = [
            ...new Set(
                pedidosAdmin
                    .map(pedido => pedido.id)
                    .filter(id => id)
                    .map(id => String(id))
            )
        ];


        console.log(
            '🛒 IDs dos pedidos:',
            pedidosIds
        );


        let itens = [];


        if (pedidosIds.length > 0) {

            const {
                data,
                error
            } = await supabase
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
                .in(
                    'pedido_id',
                    pedidosIds
                );


            if (error) {

                console.error(
                    '❌ Erro ao buscar itens:',
                    error
                );

            }
            else {

                itens =
                    Array.isArray(data)
                        ? data
                        : [];

                console.log(
                    '✅ Itens encontrados:',
                    itens
                );

            }

        }


        // ======================================================
        // VINCULAR OS DADOS
        // ======================================================

        pedidosAdmin =
            pedidosAdmin.map(pedido => {

                const cliente =
                    clientes.find(
                        item =>
                            String(item.id) ===
                            String(pedido.cliente_id)
                    );


                const endereco =
                    enderecos.find(
                        item =>
                            String(item.id) ===
                            String(pedido.endereco_id)
                    );


                const itensPedido =
                    itens.filter(
                        item =>
                            String(item.pedido_id) ===
                            String(pedido.id)
                    );


                console.log(
                    '🔗 Pedido vinculado:',
                    pedido.numero_pedido,
                    {
                        cliente,
                        endereco,
                        itens: itensPedido
                    }
                );


                return {

                    ...pedido,

                    cliente:
                        cliente || {

                            id: pedido.cliente_id,
                            nome: '',
                            email: '',
                            telefone: '',
                            cpf: ''

                        },

                    endereco:
                        endereco || null,

                    itens:
                        itensPedido

                };

            });


        console.log(
            '✅ Dados complementares vinculados:',
            pedidosAdmin
        );

    }
    catch (erro) {

        console.error(
            '❌ Erro ao carregar dados complementares:',
            erro
        );

    }

}


// ============================================================
// INDICADORES
// ============================================================

function atualizarIndicadoresDashboard() {

    let faturamentoHoje = 0;

    let pedidosPendentes = 0;

    let pedidosACaminho = 0;

    let pedidosEntregues = 0;


    const hoje = new Date();

    const anoHoje = hoje.getFullYear();

    const mesHoje = hoje.getMonth();

    const diaHoje = hoje.getDate();


    pedidosAdmin.forEach(pedido => {

        const status = String(
            pedido.status || ''
        )
            .trim()
            .toLowerCase();


        console.log(
            '📊 Contando pedido:',
            pedido.numero_pedido || pedido.id,
            'Status:',
            status
        );


        // ====================================================
        // FATURAMENTO DE HOJE
        // ====================================================

        if (status !== 'cancelado') {

            const dataPedido = new Date(
                pedido.created_at
            );


            if (
                !Number.isNaN(dataPedido.getTime()) &&
                dataPedido.getFullYear() === anoHoje &&
                dataPedido.getMonth() === mesHoje &&
                dataPedido.getDate() === diaHoje
            ) {

                faturamentoHoje += Number(
                    pedido.total || 0
                );

            }

        }


        // ====================================================
        // PEDIDOS PENDENTES
        // ====================================================

        if (
            status === 'pendente' ||
            status === 'confirmado' ||
            status === 'processando'
        ) {

            pedidosPendentes++;

        }


        // ====================================================
        // PEDIDOS A CAMINHO
        // ====================================================

        if (
            status === 'enviado'
        ) {

            pedidosACaminho++;

        }


        // ====================================================
        // PEDIDOS ENTREGUES
        // ====================================================

        if (
            status === 'entregue'
        ) {

            pedidosEntregues++;

        }

    });


    console.log(
        '=========================================='
    );

    console.log(
        '📊 CONTADORES DO DASHBOARD'
    );

    console.log(
        '💰 Faturamento hoje:',
        faturamentoHoje
    );

    console.log(
        '⏳ Pedidos pendentes:',
        pedidosPendentes
    );

    console.log(
        '🚚 Pedidos a caminho:',
        pedidosACaminho
    );

    console.log(
        '✅ Pedidos entregues:',
        pedidosEntregues
    );

    console.log(
        '=========================================='
    );


    // ========================================================
    // FATURAMENTO
    // ========================================================

    const elFaturamento =
        document.querySelector(
            '.card-kpi.destaque-financeiro .kpi-valor'
        );


    if (elFaturamento) {

        elFaturamento.textContent =
            formatarMoeda(
                faturamentoHoje
            );

    }


    // ========================================================
    // PEDIDOS PENDENTES
    // ========================================================

    const elPedidosPendentes =
        document.querySelector(
            '.card-kpi:nth-child(2) .kpi-valor'
        );


    const elSubtextoPendentes =
        document.querySelector(
            '.card-kpi:nth-child(2) .kpi-subtexto'
        );


    if (elPedidosPendentes) {

        elPedidosPendentes.textContent =
            `${pedidosPendentes} Pendentes`;

    }


    if (elSubtextoPendentes) {

        elSubtextoPendentes.textContent =
            `📦 ${pedidosPendentes} pendentes • 🚚 ${pedidosACaminho} a caminho • ✅ ${pedidosEntregues} entregues`;

    }


    // ========================================================
    // BADGE DE PEDIDOS PARA SEPARAR
    // ========================================================

    const badgeContador =
        document.querySelector(
            '.contador-badge'
        );


    if (badgeContador) {

        badgeContador.textContent =
            `${pedidosPendentes} para separar`;

    }


    // ========================================================
    // ENCONTRAR CARD DE PEDIDOS ENTREGUES
    // ========================================================

    const cardsKpi =
        document.querySelectorAll(
            '.card-kpi'
        );


    cardsKpi.forEach(card => {

        const textoCard =
            String(
                card.textContent || ''
            )
                .toLowerCase()
                .trim();


        // ----------------------------------------------------
        // CARD DE ENTREGUES
        // ----------------------------------------------------

        if (
            textoCard.includes('pedidos entregues') ||
            textoCard.includes('pedido entregue') ||
            textoCard.includes('entregues')
        ) {

            const valor =
                card.querySelector(
                    '.kpi-valor'
                );


            const subtexto =
                card.querySelector(
                    '.kpi-subtexto'
                );


            if (valor) {

                valor.textContent =
                    pedidosEntregues;

            }


            if (subtexto) {

                subtexto.textContent =
                    pedidosEntregues === 1
                        ? '1 pedido entregue'
                        : `${pedidosEntregues} pedidos entregues`;

            }

        }


        // ----------------------------------------------------
        // CARD DE PEDIDOS A CAMINHO
        // ----------------------------------------------------

        if (
            textoCard.includes('a caminho') ||
            textoCard.includes('em transporte') ||
            textoCard.includes('enviados')
        ) {

            const valor =
                card.querySelector(
                    '.kpi-valor'
                );


            const subtexto =
                card.querySelector(
                    '.kpi-subtexto'
                );


            if (valor) {

                valor.textContent =
                    pedidosACaminho;

            }


            if (subtexto) {

                subtexto.textContent =
                    pedidosACaminho === 1
                        ? '1 pedido a caminho'
                        : `${pedidosACaminho} pedidos a caminho`;

            }

        }

    });


    // ========================================================
    // CONTADORES COM IDs - CASO EXISTAM NO HTML
    // ========================================================

    const possiveisIdsEntregues = [

        'pedidos-entregues',

        'contador-entregues',

        'total-entregues',

        'kpi-entregues',

        'pedidosEntregues'

    ];


    possiveisIdsEntregues.forEach(id => {

        const elemento =
            document.getElementById(id);


        if (elemento) {

            elemento.textContent =
                pedidosEntregues;

        }

    });


    const possiveisIdsCaminho = [

        'pedidos-a-caminho',

        'contador-a-caminho',

        'total-a-caminho',

        'kpi-a-caminho',

        'pedidosACaminho'

    ];


    possiveisIdsCaminho.forEach(id => {

        const elemento =
            document.getElementById(id);


        if (elemento) {

            elemento.textContent =
                pedidosACaminho;

        }

    });


    const possiveisIdsPendentes = [

        'pedidos-pendentes',

        'contador-pendentes',

        'total-pendentes',

        'kpi-pendentes',

        'pedidosPendentes'

    ];


    possiveisIdsPendentes.forEach(id => {

        const elemento =
            document.getElementById(id);


        if (elemento) {

            elemento.textContent =
                pedidosPendentes;

        }

    });

}

// ============================================================
// DASHBOARD VAZIO
// ============================================================

function atualizarIndicadoresDashboard() {

    let faturamentoHoje = 0;

    let pedidosPendentes = 0;

    let pedidosACaminho = 0;

    let pedidosEntregues = 0;


    const hoje = new Date();

    const anoHoje = hoje.getFullYear();

    const mesHoje = hoje.getMonth();

    const diaHoje = hoje.getDate();


    pedidosAdmin.forEach(pedido => {

        const status = String(
            pedido.status || ''
        ).trim().toLowerCase();


        // ================================================
        // FATURAMENTO DE HOJE
        // ================================================

        if (status !== 'cancelado') {

            const dataPedido = new Date(
                pedido.created_at
            );


            if (
                !Number.isNaN(dataPedido.getTime()) &&
                dataPedido.getFullYear() === anoHoje &&
                dataPedido.getMonth() === mesHoje &&
                dataPedido.getDate() === diaHoje
            ) {

                faturamentoHoje += Number(
                    pedido.total || 0
                );

            }

        }


        // ================================================
        // PEDIDOS PENDENTES
        // ================================================

        if (
            status === 'pendente' ||
            status === 'confirmado' ||
            status === 'processando'
        ) {

            pedidosPendentes++;

        }


        // ================================================
        // PEDIDOS A CAMINHO
        // ================================================

        if (
            status === 'enviado'
        ) {

            pedidosACaminho++;

        }


        // ================================================
        // PEDIDOS ENTREGUES
        // ================================================

        if (
            status === 'entregue'
        ) {

            pedidosEntregues++;

        }

    });


    // ================================================
    // ELEMENTOS DO HTML
    // ================================================

    const elFaturamento =
        document.getElementById(
            'admin-faturamento'
        );


    const elPedidosPendentes =
        document.getElementById(
            'admin-pedidos-pendentes'
        );


    const elPedidosACaminho =
        document.getElementById(
            'admin-pedidos-caminho'
        );


    const elPedidosEntregues =
        document.getElementById(
            'admin-pedidos-entregues'
        );


    const elResumoStatus =
        document.getElementById(
            'admin-resumo-status'
        );


    const badgeContador =
        document.getElementById(
            'contador-pedidos'
        );


    // ================================================
    // ATUALIZAR FATURAMENTO
    // ================================================

    if (elFaturamento) {

        elFaturamento.textContent =
            formatarMoeda(
                faturamentoHoje
            );

    }


    // ================================================
    // ATUALIZAR PENDENTES
    // ================================================

    if (elPedidosPendentes) {

        elPedidosPendentes.textContent =
            `${pedidosPendentes} Pedidos`;

    }


    // ================================================
    // ATUALIZAR A CAMINHO
    // ================================================

    if (elPedidosACaminho) {

        elPedidosACaminho.textContent =
            `${pedidosACaminho} Pedidos`;

    }


    // ================================================
    // ATUALIZAR ENTREGUES
    // ================================================

    if (elPedidosEntregues) {

        elPedidosEntregues.textContent =
            `${pedidosEntregues} Pedidos`;

    }


    // ================================================
    // RESUMO DO CARD DE PENDENTES
    // ================================================

    if (elResumoStatus) {

        elResumoStatus.textContent =
            `📦 ${pedidosPendentes} pendentes • 🚚 ${pedidosACaminho} a caminho • ✅ ${pedidosEntregues} entregues`;

    }


    // ================================================
    // BADGE DOS PEDIDOS
    // ================================================

    if (badgeContador) {

        badgeContador.textContent =
            `${pedidosAdmin.length} pedidos`;

    }


    // ================================================
    // DEBUG
    // ================================================

    console.log(
        '📊 CONTADORES DO DASHBOARD:',
        {
            faturamentoHoje,
            pedidosPendentes,
            pedidosACaminho,
            pedidosEntregues,
            totalPedidos: pedidosAdmin.length
        }
    );

}


// ============================================================
// RENDERIZAR PEDIDOS
// ============================================================

function renderizarPedidos() {

    const container =
        document.querySelector(
            '.lista-pedidos'
        );

    if (!container) {
        return;
    }


    const busca =
        (
            document.getElementById(
                'busca-pedidos-admin'
            )?.value || ''
        )
            .toLowerCase()
            .trim();


    const filtroStatus =
        document.getElementById(
            'filtro-status-admin'
        )?.value || '';


    let pedidosFiltrados =
        pedidosAdmin.filter(
            pedido => {

                const numero =
                    String(
                        pedido.numero_pedido ||
                        pedido.id ||
                        ''
                    ).toLowerCase();


                const nome =
                    String(
                        pedido.cliente?.nome ||
                        ''
                    ).toLowerCase();


                const email =
                    String(
                        pedido.cliente?.email ||
                        ''
                    ).toLowerCase();


                const status =
                    String(
                        pedido.status ||
                        ''
                    ).toLowerCase();


                const correspondeBusca =
                    !busca ||
                    numero.includes(busca) ||
                    nome.includes(busca) ||
                    email.includes(busca);


                const correspondeStatus =
                    !filtroStatus ||
                    status ===
                    filtroStatus.toLowerCase();


                return (
                    correspondeBusca &&
                    correspondeStatus
                );

            }
        );


    pedidosFiltrados.sort(
        (a, b) =>
            new Date(a.created_at) -
            new Date(b.created_at)
    );


    const totalPaginas =
        Math.max(
            1,
            Math.ceil(
                pedidosFiltrados.length /
                PEDIDOS_POR_PAGINA
            )
        );


    if (
        paginaAtualPedidos >
        totalPaginas
    ) {

        paginaAtualPedidos =
            totalPaginas;

    }


    const inicio =
        (
            paginaAtualPedidos - 1
        ) *
        PEDIDOS_POR_PAGINA;


    const pedidosPagina =
        pedidosFiltrados.slice(
            inicio,
            inicio +
            PEDIDOS_POR_PAGINA
        );


    if (
        pedidosFiltrados.length === 0
    ) {

        container.innerHTML = `
            <div style="
                text-align:center;
                padding:30px 20px;
                color:#64748b;
            ">
                <div style="
                    font-size:32px;
                    margin-bottom:8px;
                ">
                    📦
                </div>

                <p>
                    Nenhum pedido encontrado.
                </p>
            </div>
        `;

        atualizarPaginacao(
            1,
            1
        );

        return;

    }


    container.innerHTML = '';


    pedidosPagina.forEach(
        pedido => {

            container.appendChild(
                criarCardPedido(
                    pedido
                )
            );

        }
    );


    atualizarPaginacao(
        paginaAtualPedidos,
        totalPaginas
    );

}


// ============================================================
// CRIAR CARD DO PEDIDO
// ============================================================

function criarCardPedido(pedido) {

    const article =
        document.createElement(
            'article'
        );


    article.className =
        'pedido-card-admin';


    const numeroPedido =
        pedido.numero_pedido ||
        pedido.id;


    const nomeCliente =
        pedido.cliente?.nome ||
        'Cliente não identificado';


    const status =
        pedido.status ||
        'pendente';


    const total =
        Number(
            pedido.total || 0
        );


    const data =
        formatarData(
            pedido.created_at
        );


    const quantidadeItens =
        Array.isArray(pedido.itens)
            ? pedido.itens.reduce(
                (
                    totalQuantidade,
                    item
                ) =>
                    totalQuantidade +
                    Number(
                        item.quantidade || 0
                    ),
                0
            )
            : 0;


    article.innerHTML = `

        <div class="pedido-header">

            <div class="pedido-id-box">

                <span class="pedido-numero">

                    Pedido #${escaparHTML(
                        numeroPedido
                    )}

                </span>

                <span class="pedido-data">

                    ${data}

                </span>

            </div>


            <span class="status-pill ${obterClasseStatus(status)}">

                ${formatarStatus(status)}

            </span>

        </div>


        <div class="pedido-corpo-grid">

            <div class="bloco-info cliente-box">

                <h3 class="bloco-titulo">

                    👤 Cliente

                </h3>


                <p class="cliente-nome">

                    ${escaparHTML(
                        nomeCliente
                    )}

                </p>


                <p class="cliente-contato">

                    ${escaparHTML(
                        pedido.cliente?.email ||
                        'E-mail não informado'
                    )}

                </p>


                <p class="cliente-contato">

                    ${escaparHTML(
                        pedido.cliente?.telefone ||
                        'Telefone não informado'
                    )}

                </p>

            </div>


            <div class="bloco-info produtos-box">

                <h3 class="bloco-titulo">

                    🛒 Pedido

                </h3>


                <p>

                    ${quantidadeItens}
                    item(ns)

                </p>


                ${
                    pedido.itens?.length
                        ? `
                            <div style="
                                margin-top:8px;
                                font-size:.85rem;
                                color:#475569;
                            ">

                                ${pedido.itens
                                    .map(
                                        item =>
                                            `${escaparHTML(
                                                item.nome_produto ||
                                                'Produto'
                                            )} (${Number(
                                                item.quantidade || 0
                                            )}x)`
                                    )
                                    .join('<br>')}

                            </div>
                        `
                        : ''
                }


                <div class="resumo-financeiro-pedido">

                    <span>

                        Total:

                    </span>


                    <span class="valor-total-pedido">

                        ${formatarMoeda(total)}

                    </span>

                </div>

            </div>

        </div>


        <div class="pedido-rodape-acoes">

            <button
                type="button"
                class="btn-acao btn-imprimir-etiqueta"
                data-pedido-detalhes="${escaparHTML(pedido.id)}"
            >

                🔎 Ver detalhes

            </button>


            <div class="select-status-container">

                <label>

                    Alterar Status:

                </label>


                <select
                    class="select-status"
                    data-pedido-status="${escaparHTML(pedido.id)}"
                >

                    ${gerarOpcoesStatus(
                        status
                    )}

                </select>

            </div>

        </div>

    `;


    return article;

}


// ============================================================
// OPÇÕES DE STATUS
// ============================================================

function gerarOpcoesStatus(statusAtual) {

    const status =
        String(
            statusAtual || ''
        ).toLowerCase();


    const opcoes = [

        {
            valor: 'pendente',
            nome: 'Pendente'
        },

        {
            valor: 'confirmado',
            nome: 'Confirmado'
        },

        {
            valor: 'processando',
            nome: 'Processando'
        },

        {
            valor: 'enviado',
            nome: 'Enviado / A Caminho'
        },

        {
            valor: 'entregue',
            nome: 'Entregue'
        },

        {
            valor: 'cancelado',
            nome: 'Cancelado'
        }

    ];


    return opcoes
        .map(
            opcao => `

                <option
                    value="${opcao.valor}"
                    ${status === opcao.valor ? 'selected' : ''}
                >

                    ${opcao.nome}

                </option>

            `
        )
        .join('');

}


// ============================================================
// EVENTOS DOS PEDIDOS
// ============================================================

function iniciarEventosPedidos() {

    const container =
        document.querySelector(
            '.lista-pedidos'
        );


    if (!container) {
        return;
    }


    container.addEventListener(
        'click',
        event => {

            const botao =
                event.target.closest(
                    '[data-pedido-detalhes]'
                );


            if (!botao) {
                return;
            }


            const id =
                botao.dataset.pedidoDetalhes;


            abrirDetalhesPedido(
                id
            );

        }
    );


    container.addEventListener(
        'change',
        async event => {

            const select =
                event.target.closest(
                    '[data-pedido-status]'
                );


            if (!select) {
                return;
            }


            const pedidoId =
                select.dataset.pedidoStatus;


            const novoStatus =
                select.value;


            await alterarStatusPedido(
                pedidoId,
                novoStatus,
                select
            );

        }
    );

}


// ============================================================
// ALTERAR STATUS REAL
// ============================================================

async function alterarStatusPedido(
    pedidoId,
    novoStatus,
    select
) {

    const supabase =
        obterSupabaseAdmin();


    if (!supabase) {
        return;
    }


    const pedido =
        pedidosAdmin.find(
            item =>
                String(item.id) ===
                String(pedidoId)
        );


    if (!pedido) {

        console.error(
            '❌ Pedido não encontrado:',
            pedidoId
        );

        return;

    }


    const statusAnterior =
        pedido.status;


    if (
        !confirm(
            `Alterar o status do pedido #${pedido.numero_pedido || pedido.id} para "${formatarStatus(novoStatus)}"?`
        )
    ) {

        select.value =
            statusAnterior;

        return;

    }


    select.disabled =
        true;


    try {

        const {
            data,
            error
        } =
            await supabase
                .from('pedidos')
                .update({

                    status:
                        novoStatus,

                    updated_at:
                        new Date().toISOString()

                })
                .eq(
                    'id',
                    pedidoId
                )
                .select()
                .single();


        if (error) {

            console.error(
                '❌ Erro ao atualizar status:',
                error
            );


            alert(
                'Não foi possível atualizar o status do pedido.'
            );


            select.value =
                statusAnterior;


            return;

        }


        pedido.status =
            data.status;


        pedido.updated_at =
            data.updated_at;


        renderizarPedidos();

        atualizarIndicadoresDashboard();


        if (
            pedidoSelecionadoAdmin &&
            String(
                pedidoSelecionadoAdmin.id
            ) ===
            String(pedidoId)
        ) {

            pedidoSelecionadoAdmin =
                pedido;

            atualizarModalDetalhes();

        }

    }
    catch (erro) {

        console.error(
            '❌ Erro inesperado:',
            erro
        );


        alert(
            'Ocorreu um erro ao alterar o status.'
        );


        select.value =
            statusAnterior;

    }
    finally {

        select.disabled =
            false;

    }

}


// ============================================================
// MODAL
// ============================================================

function criarModalDetalhesPedido() {

    if (
        document.getElementById(
            'modal-detalhes-pedido-admin'
        )
    ) {
        return;
    }


    const modal =
        document.createElement(
            'div'
        );


    modal.id =
        'modal-detalhes-pedido-admin';


    modal.style.cssText = `

        display:none;
        position:fixed;
        inset:0;
        background:rgba(15,23,42,0.65);
        z-index:99999;
        padding:20px;
        overflow-y:auto;

    `;


    modal.innerHTML = `

        <div style="
            max-width:900px;
            margin:30px auto;
            background:#ffffff;
            border-radius:16px;
            overflow:hidden;
            box-shadow:0 20px 50px rgba(0,0,0,0.2);
        ">

            <div style="
                display:flex;
                justify-content:space-between;
                align-items:center;
                padding:18px 22px;
                border-bottom:1px solid #e2e8f0;
            ">

                <div>

                    <h2
                        id="modal-pedido-titulo"
                        style="
                            margin:0;
                            font-size:1.2rem;
                            color:#0f172a;
                        "
                    >
                        Detalhes do Pedido
                    </h2>

                    <p
                        id="modal-pedido-status"
                        style="
                            margin:5px 0 0;
                            color:#64748b;
                            font-size:.9rem;
                        "
                    >
                    </p>

                </div>


                <button
                    type="button"
                    id="fechar-modal-pedido"
                    style="
                        border:0;
                        background:#f1f5f9;
                        width:38px;
                        height:38px;
                        border-radius:8px;
                        cursor:pointer;
                        font-size:20px;
                    "
                >
                    ×
                </button>

            </div>


            <div
                id="modal-pedido-conteudo"
                style="
                    padding:22px;
                "
            >
            </div>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    document
        .getElementById(
            'fechar-modal-pedido'
        )
        .addEventListener(
            'click',
            fecharModalDetalhes
        );


    modal.addEventListener(
        'click',
        event => {

            if (
                event.target ===
                modal
            ) {

                fecharModalDetalhes();

            }

        }
    );

}


// ============================================================
// ABRIR DETALHES
// ============================================================

function abrirDetalhesPedido(
    pedidoId
) {

    const pedido =
        pedidosAdmin.find(
            item =>
                String(item.id) ===
                String(pedidoId)
        );


    if (!pedido) {

        alert(
            'Não foi possível encontrar os detalhes deste pedido.'
        );

        return;

    }


    pedidoSelecionadoAdmin =
        pedido;


    atualizarModalDetalhes();


    const modal =
        document.getElementById(
            'modal-detalhes-pedido-admin'
        );


    if (modal) {

        modal.style.display =
            'block';

        document.body.style.overflow =
            'hidden';

    }

}


// ============================================================
// ATUALIZAR MODAL
// ============================================================

function atualizarModalDetalhes() {

    const pedido =
        pedidoSelecionadoAdmin;


    if (!pedido) {
        return;
    }


    const titulo =
        document.getElementById(
            'modal-pedido-titulo'
        );


    const status =
        document.getElementById(
            'modal-pedido-status'
        );


    const conteudo =
        document.getElementById(
            'modal-pedido-conteudo'
        );


    if (!titulo || !status || !conteudo) {
        return;
    }


    titulo.textContent =
        `Pedido #${pedido.numero_pedido || pedido.id}`;


    status.textContent =
        `Status: ${formatarStatus(pedido.status)}`;


    const cliente =
        pedido.cliente || {};


    const endereco =
        pedido.endereco || {};


    const itens =
        Array.isArray(
            pedido.itens
        )
            ? pedido.itens
            : [];


    const observacoes =
        pedido.observacoes;


    conteudo.innerHTML = `

        <div style="
            display:grid;
            grid-template-columns:repeat(auto-fit,minmax(260px,1fr));
            gap:16px;
            margin-bottom:20px;
        ">

            <div style="
                border:1px solid #e2e8f0;
                border-radius:12px;
                padding:16px;
            ">

                <h3 style="
                    margin:0 0 12px;
                    color:#0f172a;
                ">
                    👤 Cliente
                </h3>


                <p style="margin:6px 0;">
                    <strong>Nome:</strong>
                    ${escaparHTML(
                        cliente.nome ||
                        'Não informado'
                    )}
                </p>


                <p style="margin:6px 0;">
                    <strong>E-mail:</strong>
                    ${escaparHTML(
                        cliente.email ||
                        'Não informado'
                    )}
                </p>


                <p style="margin:6px 0;">
                    <strong>Telefone:</strong>
                    ${escaparHTML(
                        cliente.telefone ||
                        'Não informado'
                    )}
                </p>


                <p style="margin:6px 0;">
                    <strong>CPF:</strong>
                    ${escaparHTML(
                        cliente.cpf ||
                        'Não informado'
                    )}
                </p>

            </div>


            <div style="
                border:1px solid #e2e8f0;
                border-radius:12px;
                padding:16px;
            ">

                <h3 style="
                    margin:0 0 12px;
                    color:#0f172a;
                ">
                    📍 Entrega
                </h3>


                ${
                    endereco.id
                        ? `

                            <p style="margin:6px 0;">
                                <strong>Destinatário:</strong>
                                ${escaparHTML(
                                    endereco.nome_destinatario ||
                                    cliente.nome ||
                                    'Não informado'
                                )}
                            </p>

                            <p style="margin:6px 0;">
                                ${escaparHTML(
                                    endereco.rua ||
                                    ''
                                )},
                                ${escaparHTML(
                                    endereco.numero ||
                                    ''
                                )}
                            </p>

                            ${
                                endereco.complemento
                                    ? `
                                        <p style="margin:6px 0;">
                                            ${escaparHTML(
                                                endereco.complemento
                                            )}
                                        </p>
                                    `
                                    : ''
                            }

                            <p style="margin:6px 0;">
                                ${escaparHTML(
                                    endereco.bairro ||
                                    ''
                                )}
                                -
                                ${escaparHTML(
                                    endereco.cidade ||
                                    ''
                                )}
                                /
                                ${escaparHTML(
                                    endereco.estado ||
                                    ''
                                )}
                            </p>

                            <p style="margin:6px 0;">
                                CEP:
                                ${escaparHTML(
                                    endereco.cep ||
                                    ''
                                )}
                            </p>

                        `
                        : `

                            <p style="
                                color:#64748b;
                            ">
                                Endereço não encontrado.
                            </p>

                        `
                }

            </div>

        </div>


        <div style="
            border:1px solid #e2e8f0;
            border-radius:12px;
            padding:16px;
            margin-bottom:16px;
        ">

            <h3 style="
                margin:0 0 12px;
                color:#0f172a;
            ">
                🛒 Itens do Pedido
            </h3>


            ${
                itens.length > 0
                    ? `

                        <div style="
                            display:flex;
                            flex-direction:column;
                            gap:10px;
                        ">

                            ${itens.map(
                                item => `

                                    <div style="
                                        display:flex;
                                        justify-content:space-between;
                                        gap:15px;
                                        padding:10px 0;
                                        border-bottom:1px solid #f1f5f9;
                                    ">

                                        <div>

                                            <strong>
                                                ${escaparHTML(
                                                    item.nome_produto ||
                                                    'Produto'
                                                )}
                                            </strong>

                                            <div style="
                                                font-size:.85rem;
                                                color:#64748b;
                                                margin-top:3px;
                                            ">

                                                ${item.quantidade || 0}
                                                x
                                                ${formatarMoeda(
                                                    item.preco_unitario
                                                )}

                                            </div>

                                        </div>


                                        <strong>

                                            ${formatarMoeda(
                                                item.subtotal
                                            )}

                                        </strong>

                                    </div>

                                `
                            ).join('')}

                        </div>

                    `
                    : `

                        <p style="
                            color:#64748b;
                        ">
                            Nenhum item encontrado.
                        </p>

                    `
            }

        </div>


        <div style="
            border:1px solid #e2e8f0;
            border-radius:12px;
            padding:16px;
            margin-bottom:16px;
        ">

            <h3 style="
                margin:0 0 12px;
                color:#0f172a;
            ">
                💰 Resumo Financeiro
            </h3>


            <div style="
                display:flex;
                flex-direction:column;
                gap:7px;
            ">

                <div style="
                    display:flex;
                    justify-content:space-between;
                ">

                    <span>
                        Subtotal
                    </span>

                    <strong>
                        ${formatarMoeda(
                            pedido.subtotal
                        )}
                    </strong>

                </div>


                <div style="
                    display:flex;
                    justify-content:space-between;
                ">

                    <span>
                        Frete
                    </span>

                    <strong>
                        ${formatarMoeda(
                            pedido.frete
                        )}
                    </strong>

                </div>


                <div style="
                    display:flex;
                    justify-content:space-between;
                ">

                    <span>
                        Desconto
                    </span>

                    <strong>
                        ${formatarMoeda(
                            pedido.desconto
                        )}
                    </strong>

                </div>


                <div style="
                    display:flex;
                    justify-content:space-between;
                    padding-top:10px;
                    margin-top:5px;
                    border-top:1px solid #e2e8f0;
                    font-size:1.05rem;
                ">

                    <strong>
                        Total
                    </strong>

                    <strong>
                        ${formatarMoeda(
                            pedido.total
                        )}
                    </strong>

                </div>

            </div>

        </div>


        <div style="
            border:1px solid #e2e8f0;
            border-radius:12px;
            padding:16px;
        ">

            <h3 style="
                margin:0 0 12px;
                color:#0f172a;
            ">
                📋 Informações
            </h3>


            <p style="margin:7px 0;">

                <strong>
                    Forma de pagamento:
                </strong>

                ${escaparHTML(
                    pedido.forma_pagamento ||
                    'Não informado'
                )}

            </p>


            <p style="margin:7px 0;">

                <strong>
                    Status do pagamento:
                </strong>

                ${escaparHTML(
                    pedido.status_pagamento ||
                    'Não informado'
                )}

            </p>


            <p style="margin:7px 0;">

                <strong>
                    Observações:
                </strong>

                ${
                    observacoes
                        ? `
                            <span style="
                                white-space:pre-wrap;
                                word-break:break-word;
                            ">
                                ${escaparHTML(
                                    observacoes
                                )}
                            </span>
                        `
                        : `
                            <span style="
                                color:#64748b;
                            ">
                                Nenhuma observação.
                            </span>
                        `
                }

            </p>


            <p style="margin:7px 0;">

                <strong>
                    Criado em:
                </strong>

                ${formatarData(
                    pedido.created_at
                )}

            </p>

        </div>

    `;

}


// ============================================================
// FECHAR MODAL
// ============================================================

function fecharModalDetalhes() {

    const modal =
        document.getElementById(
            'modal-detalhes-pedido-admin'
        );


    if (modal) {

        modal.style.display =
            'none';

    }


    document.body.style.overflow =
        '';


    pedidoSelecionadoAdmin =
        null;

}


// ============================================================
// PAGINAÇÃO
// ============================================================

function atualizarPaginacao(
    pagina,
    totalPaginas
) {

    let paginacao =
        document.getElementById(
            'paginacao-pedidos-admin'
        );


    if (!paginacao) {

        const container =
            document.querySelector(
                '.lista-pedidos'
            );


        if (!container) {
            return;
        }


        paginacao =
            document.createElement(
                'div'
            );


        paginacao.id =
            'paginacao-pedidos-admin';


        paginacao.style.cssText = `

            display:flex;
            justify-content:center;
            align-items:center;
            gap:12px;
            margin:15px 0 5px;

        `;


        container.parentNode.appendChild(
            paginacao
        );

    }


    if (
        totalPaginas <= 1
    ) {

        paginacao.innerHTML =
            '';

        return;

    }


    paginacao.innerHTML = `

        <button
            type="button"
            id="pagina-anterior-admin"
            style="
                padding:8px 12px;
                border:1px solid #cbd5e1;
                background:#ffffff;
                border-radius:7px;
                cursor:pointer;
            "
            ${pagina <= 1 ? 'disabled' : ''}
        >
            ← Anterior
        </button>


        <span style="
            font-size:.9rem;
            color:#475569;
        ">

            Página
            ${pagina}
            de
            ${totalPaginas}

        </span>


        <button
            type="button"
            id="pagina-proxima-admin"
            style="
                padding:8px 12px;
                border:1px solid #cbd5e1;
                background:#ffffff;
                border-radius:7px;
                cursor:pointer;
            "
            ${pagina >= totalPaginas ? 'disabled' : ''}
        >
            Próxima →
        </button>

    `;


    document
        .getElementById(
            'pagina-anterior-admin'
        )
        ?.addEventListener(
            'click',
            () => {

                if (
                    paginaAtualPedidos > 1
                ) {

                    paginaAtualPedidos--;

                    renderizarPedidos();

                }

            }
        );


    document
        .getElementById(
            'pagina-proxima-admin'
        )
        ?.addEventListener(
            'click',
            () => {

                if (
                    paginaAtualPedidos <
                    totalPaginas
                ) {

                    paginaAtualPedidos++;

                    renderizarPedidos();

                }

            }
        );

}


// ============================================================
// BUSCA E FILTROS
// ============================================================

function criarControlesBuscaPedidos() {

    const lista =
        document.querySelector(
            '.lista-pedidos'
        );


    if (!lista) {
        return;
    }


    if (
        document.getElementById(
            'controles-pedidos-admin'
        )
    ) {
        return;
    }


    const controles =
        document.createElement(
            'div'
        );


    controles.id =
        'controles-pedidos-admin';


    controles.style.cssText = `

        display:flex;
        gap:10px;
        flex-wrap:wrap;
        margin-bottom:15px;

    `;


    controles.innerHTML = `

        <input
            type="search"
            id="busca-pedidos-admin"
            placeholder="Buscar pedido, cliente ou e-mail..."
            style="
                flex:1;
                min-width:220px;
                padding:10px 12px;
                border:1px solid #cbd5e1;
                border-radius:8px;
                outline:none;
            "
        >


        <select
            id="filtro-status-admin"
            style="
                padding:10px 12px;
                border:1px solid #cbd5e1;
                border-radius:8px;
                background:#ffffff;
            "
        >

            <option value="">
                Todos os status
            </option>

            <option value="pendente">
                Pendente
            </option>

            <option value="confirmado">
                Confirmado
            </option>

            <option value="processando">
                Processando
            </option>

            <option value="enviado">
                Enviado / A Caminho
            </option>

            <option value="entregue">
                Entregue
            </option>

            <option value="cancelado">
                Cancelado
            </option>

        </select>

    `;


    lista.parentNode.insertBefore(
        controles,
        lista
    );


    document
        .getElementById(
            'busca-pedidos-admin'
        )
        ?.addEventListener(
            'input',
            () => {

                paginaAtualPedidos =
                    1;

                renderizarPedidos();

            }
        );


    document
        .getElementById(
            'filtro-status-admin'
        )
        ?.addEventListener(
            'change',
            () => {

                paginaAtualPedidos =
                    1;

                renderizarPedidos();

            }
        );

}


// ============================================================
// PRODUTOS
// ============================================================

async function carregarProdutosAdmin() {

    const tabela =
        document.getElementById(
            'tabela-produtos-corpo'
        );


    if (!tabela) {
        return;
    }


    const supabase =
        obterSupabaseAdmin();


    if (!supabase) {
        return;
    }


    try {

        const {
            data: produtos,
            error
        } =
            await supabase
                .from('produtos')
                .select(`
                    id,
                    categoria_id,
                    nome,
                    slug,
                    descricao,
                    preco,
                    preco_promocional,
                    estoque,
                    sku,
                    imagem_url,
                    ativo,
                    destaque,
                    created_at,
                    updated_at
                `)
                .order(
                    'created_at',
                    {
                        ascending: false
                    }
                )
                .limit(3);


        if (error) {

            console.error(
                '❌ Erro ao carregar produtos:',
                error
            );

            return;

        }


        if (
            !produtos ||
            produtos.length === 0
        ) {

            tabela.innerHTML = `
                <tr>
                    <td colspan="6"
                        style="
                            text-align:center;
                            padding:25px;
                            color:#64748b;
                        "
                    >
                        Nenhum produto cadastrado.
                    </td>
                </tr>
            `;

            return;

        }


        tabela.innerHTML =
            produtos
                .map(
                    produto => `

                        <tr>

                            <td>

                                <div style="
                                    display:flex;
                                    align-items:center;
                                    gap:10px;
                                ">

                                    ${
                                        produto.imagem_url
                                            ? `
                                                <img
                                                    src="${escaparHTML(
                                                        produto.imagem_url
                                                    )}"
                                                    alt=""
                                                    style="
                                                        width:40px;
                                                        height:40px;
                                                        object-fit:cover;
                                                        border-radius:6px;
                                                    "
                                                >
                                            `
                                            : `
                                                <span
                                                    style="
                                                        font-size:1.5rem;
                                                    "
                                                >
                                                    📦
                                                </span>
                                            `
                                    }


                                    <strong>

                                        ${escaparHTML(
                                            produto.nome ||
                                            'Produto sem nome'
                                        )}

                                    </strong>

                                </div>

                            </td>


                            <td>

                                <strong>

                                    ${formatarMoeda(
                                        produto.preco_promocional ?? 
                                        produto.preco
                                    )}

                                </strong>

                            </td>


                            <td>

                                ${produto.estoque ?? 0}

                            </td>


                            <td>
                                0
                            </td>


                            <td>
                                0
                            </td>


                            <td class="text-right">

                                <button
                                    type="button"
                                    class="btn-tb-acao btn-tb-editar"
                                    onclick="editarProduto('${produto.id}')"
                                >
                                    ✏️ Editar
                                </button>


                                <button
                                    type="button"
                                    class="btn-tb-acao btn-tb-excluir"
                                    onclick="excluirProduto('${produto.id}')"
                                >
                                    🗑️
                                </button>

                            </td>

                        </tr>

                    `
                )
                .join('');

    }
    catch (erro) {

        console.error(
            '❌ Erro ao carregar produtos:',
            erro
        );

    }

}


// ============================================================
// EDITAR PRODUTO
// ============================================================

function editarProduto(id) {

    window.location.href =
        `05-cadastro-produto.html?id=${encodeURIComponent(id)}`;

}


// ============================================================
// EXCLUIR PRODUTO
// ============================================================

async function excluirProduto(id) {

    if (
        !confirm(
            'Tem certeza que deseja excluir este produto?'
        )
    ) {
        return;
    }


    const supabase =
        obterSupabaseAdmin();


    if (!supabase) {
        return;
    }


    try {

        const {
            error
        } =
            await supabase
                .from('produtos')
                .delete()
                .eq(
                    'id',
                    id
                );


        if (error) {

            console.error(
                '❌ Erro ao excluir produto:',
                error
            );


            alert(
                'Não foi possível excluir o produto.'
            );


            return;

        }


        alert(
            'Produto excluído com sucesso.'
        );


        await carregarProdutosAdmin();

    }
    catch (erro) {

        console.error(
            '❌ Erro inesperado:',
            erro
        );

    }

}


// ============================================================
// BANNERS
// ============================================================

async function carregarBannersAdmin() {

    const container =
        document.getElementById(
            'lista-banners-admin'
        );


    if (!container) {
        return;
    }


    const supabase =
        obterSupabaseAdmin();


    if (!supabase) {
        return;
    }


    try {

        const {
            data: banners,
            error
        } =
            await supabase
                .from('banners')
                .select('*')
                .order(
                    'ordem',
                    {
                        ascending: true
                    }
                );


        if (error) {

            console.warn(
                '⚠️ Não foi possível buscar banners:',
                error
            );


            container.innerHTML = `

                <p style="
                    text-align:center;
                    padding:20px;
                    color:#64748b;
                ">
                    Nenhum banner cadastrado.
                </p>

            `;

            return;

        }


        if (
            !banners ||
            banners.length === 0
        ) {

            container.innerHTML = `

                <p style="
                    text-align:center;
                    padding:20px;
                    color:#64748b;
                ">
                    Nenhum banner cadastrado.
                </p>

            `;

            return;

        }


        container.innerHTML =
            banners
                .map(
                    banner => `

                        <div style="
                            display:flex;
                            align-items:center;
                            gap:12px;
                            border:1px solid #e2e8f0;
                            border-radius:10px;
                            padding:10px 12px;
                        ">

                            <div style="
                                width:70px;
                                height:45px;
                                border-radius:6px;
                                background:#f1f5f9;
                                background-image:url('${escaparHTML(
                                    banner.imagem_url || ''
                                )}');
                                background-size:cover;
                                background-position:center;
                                flex-shrink:0;
                            "></div>


                            <div style="
                                flex:1;
                            ">

                                <strong>

                                    ${escaparHTML(
                                        banner.titulo ||
                                        'Sem título'
                                    )}

                                </strong>


                                <div style="
                                    font-size:.75rem;
                                    color:#64748b;
                                ">

                                    ${
                                        banner.ativo === false
                                            ? 'Inativo'
                                            : 'Ativo'
                                    }

                                </div>

                            </div>

                        </div>

                    `
                )
                .join('');

    }
    catch (erro) {

        console.error(
            '❌ Erro ao carregar banners:',
            erro
        );

    }

}


// ============================================================
// FORMATAR STATUS
// ============================================================

function formatarStatus(status) {

    const mapa = {

        pendente:
            'Pendente',

        confirmado:
            'Confirmado',

        processando:
            'Processando',

        enviado:
            'A Caminho',

        entregue:
            'Entregue',

        cancelado:
            'Cancelado'

    };


    return (
        mapa[
            String(
                status || ''
            ).toLowerCase()
        ] ||
        status ||
        'Pendente'
    );

}


// ============================================================
// CLASSE STATUS
// ============================================================

function obterClasseStatus(status) {

    const valor =
        String(
            status || ''
        ).toLowerCase();


    if (
        valor === 'entregue'
    ) {

        return 'status-concluido';

    }


    if (
        valor === 'cancelado'
    ) {

        return 'status-cancelado';

    }


    if (
        valor === 'enviado'
    ) {

        return 'status-transporte';

    }


    return 'status-separacao';

}


// ============================================================
// FORMATAR MOEDA
// ============================================================

function formatarMoeda(valor) {

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


// ============================================================
// FORMATAR DATA
// ============================================================

function formatarData(data) {

    if (!data) {

        return 'Data não informada';

    }


    const dataObj =
        new Date(data);


    if (
        Number.isNaN(
            dataObj.getTime()
        )
    ) {

        return 'Data inválida';

    }


    return dataObj.toLocaleString(
        'pt-BR',
        {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }
    );

}


// ============================================================
// ESCAPAR HTML
// ============================================================

function escaparHTML(valor) {

    if (
        valor === null ||
        valor === undefined
    ) {

        return '';

    }


    return String(valor)
        .replace(
            /&/g,
            '&amp;'
        )
        .replace(
            /</g,
            '&lt;'
        )
        .replace(
            />/g,
            '&gt;'
        )
        .replace(
            /"/g,
            '&quot;'
        )
        .replace(
            /'/g,
            '&#039;'
        );

}


// ============================================================
// DISPONIBILIZAR FUNÇÕES GLOBALMENTE
// ============================================================

window.carregarDashboardAdmin =
    carregarDashboardAdmin;

window.carregarProdutosAdmin =
    carregarProdutosAdmin;

window.carregarBannersAdmin =
    carregarBannersAdmin;

window.editarProduto =
    editarProduto;

window.excluirProduto =
    excluirProduto;

window.abrirDetalhesPedido =
    abrirDetalhesPedido;

window.fecharModalDetalhes =
    fecharModalDetalhes;
