// ============================================================
// ZORAVISION - DASHBOARD ADMINISTRATIVO
// ============================================================
// Arquivo: Admin/dashboard-admin.js
//
// Responsabilidades:
// - Buscar quantidade de pedidos pendentes
// - Buscar quantidade de pedidos a caminho
// - Buscar quantidade de pedidos entregues
// - Calcular valor faturado
// - Buscar quantidade de produtos
// - Buscar quantidade de banners
// - Buscar quantidade de integrações
// - Atualizar os números do Dashboard
// ============================================================

// ============================================================
// 1. OBTER SUPABASE
// ============================================================

function obterSupabaseDashboard() {


if (window.supabaseClient) {
    return window.supabaseClient;
}

if (window._supabase) {
    return window._supabase;
}

if (typeof window.obterSupabase === 'function') {
    return window.obterSupabase();
}

console.error('Cliente Supabase não encontrado.');

return null;


}

// ============================================================
// 2. ATUALIZAR ELEMENTO
// ============================================================

function atualizarElemento(id, valor) {


const elemento =
    document.getElementById(id);

if (!elemento) {

    console.warn(
        'Elemento não encontrado:',
        id
    );

    return;
}

elemento.textContent = valor;


}

// ============================================================
// 3. FORMATAR VALOR EM REAIS
// ============================================================

function formatarMoeda(valor) {


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
// 4. BUSCAR PEDIDOS
// ============================================================

async function buscarDadosPedidos(supabase) {

const resultado =
    await supabase
        .from('pedidos')
        .select(
            'status,total'
        );

if (resultado.error) {

    console.error(
        'Erro ao buscar pedidos:',
        resultado.error
    );

    throw resultado.error;
}

const pedidos =
    resultado.data || [];

let pedidosPendentes = 0;
let pedidosACaminho = 0;
let pedidosEntregues = 0;
let valorFaturado = 0;

pedidos.forEach(
    pedido => {

        const status =
            String(
                pedido.status || ''
            )
                .trim()
                .toLowerCase();

        const total =
            Number(
                pedido.total
            ) || 0;


        // ------------------------------------------------
        // PEDIDOS PENDENTES
        // ------------------------------------------------

        if (
            status === 'pendente' ||
            status === 'pendente pagamento' ||
            status === 'processando'
        ) {

            pedidosPendentes++;
        }


        // ------------------------------------------------
        // PEDIDOS A CAMINHO
        // ------------------------------------------------

        if (
            status === 'a caminho' ||
            status === 'em trânsito' ||
            status === 'enviado' ||
            status === 'saiu para entrega'
        ) {

            pedidosACaminho++;
        }


        // ------------------------------------------------
        // PEDIDOS ENTREGUES
        // ------------------------------------------------

        if (
            status === 'entregue' ||
            status === 'finalizado' ||
            status === 'concluido' ||
            status === 'concluído'
        ) {

            pedidosEntregues++;

            valorFaturado += total;
        }

    }
);

return {
    pedidosPendentes,
    pedidosACaminho,
    pedidosEntregues,
    valorFaturado
};


}

// ============================================================
// 5. BUSCAR QUANTIDADE DE PRODUTOS
// ============================================================

async function buscarTotalProdutos(supabase) {


const resultado =
    await supabase
        .from('produtos')
        .select(
            'id',
            {
                count: 'exact',
                head: true
            }
        );

if (resultado.error) {

    console.error(
        'Erro ao buscar produtos:',
        resultado.error
    );

    throw resultado.error;
}

return resultado.count || 0;


}

// ============================================================
// 6. BUSCAR QUANTIDADE DE BANNERS
// ============================================================

async function buscarTotalBanners(supabase) {

const resultado =
    await supabase
        .from('banners')
        .select(
            'id',
            {
                count: 'exact',
                head: true
            }
        );

if (resultado.error) {

    console.error(
        'Erro ao buscar banners:',
        resultado.error
    );

    throw resultado.error;
}

return resultado.count || 0;


}

// ============================================================
// 7. BUSCAR INTEGRAÇÕES
// ============================================================

async function buscarTotalIntegracoes(supabase) {

try {

    const resultado =
        await supabase
            .from('integracoes')
            .select(
                'id',
                {
                    count: 'exact',
                    head: true
                }
            );

    if (resultado.error) {

        console.warn(
            'Tabela integracoes ainda não disponível:',
            resultado.error.message
        );

        return 0;
    }

    return resultado.count || 0;

} catch (erro) {

    console.warn(
        'Não foi possível consultar integrações:',
        erro
    );

    return 0;
}


}

// ============================================================
// 8. CARREGAR DASHBOARD
// ============================================================

async function carregarDadosDashboard() {


console.log(
    'Carregando dados do Dashboard...'
);

const supabase =
    obterSupabaseDashboard();

if (!supabase) {

    console.error(
        'Supabase não disponível para o Dashboard.'
    );

    return;
}

try {

    const dadosPedidos =
        await buscarDadosPedidos(
            supabase
        );

    const totalProdutos =
        await buscarTotalProdutos(
            supabase
        );

    const totalBanners =
        await buscarTotalBanners(
            supabase
        );

    const totalIntegracoes =
        await buscarTotalIntegracoes(
            supabase
        );


    // ====================================================
    // ATUALIZAR DASHBOARD
    // ====================================================

    atualizarElemento(
        'total-pedidos-pendentes',
        dadosPedidos.pedidosPendentes
    );

    atualizarElemento(
        'total-pedidos-caminho',
        dadosPedidos.pedidosACaminho
    );

    atualizarElemento(
        'total-pedidos-entregues',
        dadosPedidos.pedidosEntregues
    );

    atualizarElemento(
        'valor-faturado',
        formatarMoeda(
            dadosPedidos.valorFaturado
        )
    );


    // ====================================================
    // ATUALIZAR RESUMO
    // ====================================================

    atualizarElemento(
        'total-produtos',
        totalProdutos
    );

    atualizarElemento(
        'total-banners',
        totalBanners
    );

    atualizarElemento(
        'total-integracoes',
        totalIntegracoes
    );


    console.log(
        'Dashboard carregado:',
        {
            pedidosPendentes:
                dadosPedidos.pedidosPendentes,

            pedidosACaminho:
                dadosPedidos.pedidosACaminho,

            pedidosEntregues:
                dadosPedidos.pedidosEntregues,

            valorFaturado:
                dadosPedidos.valorFaturado,

            totalProdutos:
                totalProdutos,

            totalBanners:
                totalBanners,

            totalIntegracoes:
                totalIntegracoes
        }
    );

} catch (erro) {

    console.error(
        'Erro ao carregar Dashboard:',
        erro
    );

}


}

// ============================================================
// 9. BOTÃO ATUALIZAR
// ============================================================

function configurarBotaoAtualizarDashboard() {

const botao =
    document.getElementById(
        'btn-atualizar-dashboard'
    );

if (!botao) {
    return;
}

botao.addEventListener(
    'click',
    async () => {

        const textoOriginal =
            botao.textContent;

        botao.disabled = true;

        botao.textContent =
            'Atualizando...';

        try {

            await carregarDadosDashboard();

        } finally {

            botao.disabled = false;

            botao.textContent =
                textoOriginal;
        }

    }
);


}

// ============================================================
// 10. INICIALIZAÇÃO
// ============================================================

document.addEventListener(
'DOMContentLoaded',
async () => {

    await carregarDadosDashboard();

    configurarBotaoAtualizarDashboard();

}


);

// ============================================================
// 11. FUNÇÕES GLOBAIS
// ============================================================

window.carregarDadosDashboard =
carregarDadosDashboard;

window.buscarDadosPedidos =
buscarDadosPedidos;

window.buscarTotalProdutos =
buscarTotalProdutos;

window.buscarTotalBanners =
buscarTotalBanners;

window.buscarTotalIntegracoes =
buscarTotalIntegracoes;
