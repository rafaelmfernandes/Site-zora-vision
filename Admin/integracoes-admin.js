// ============================================================
// ZORAVISION - ADMINISTRAÇÃO DE INTEGRAÇÕES
// ============================================================
// Arquivo: Admin/integracoes-admin.js
//
// Responsabilidades:
// - Verificar acesso ao painel administrativo
// - Verificar conexão com Mercado Livre
// - Iniciar OAuth do Mercado Livre
// - Atualizar status da integração
// - Preparar estrutura para futuras integrações
//
// IMPORTANTE:
// - NÃO colocar Client Secret neste arquivo.
// - O Client Secret fica somente no Supabase Edge Function.
// ============================================================

// ============================================================
// 1. CONFIGURAÇÕES
// ============================================================

const CONFIG_MERCADO_LIVRE = {


CLIENT_ID:
    '8816875791365432',

REDIRECT_URI:
    'https://ratajxnxkjoiuknamacn.supabase.co/functions/v1/mercadolivre-oauth',

AUTH_URL:
    'https://auth.mercadolivre.com.br/authorization'


};

// ============================================================
// 2. VARIÁVEIS
// ============================================================

let supabaseIntegracoes = null;

// ============================================================
// 3. SUPABASE
// ============================================================

function obterSupabaseIntegracoes() {


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

// ============================================================
// 4. ELEMENTOS
// ============================================================

function obterElementosMercadoLivre() {


return {

    botao:
        document.getElementById(
            'btn-conectar-mercado-livre'
        ),

    status:
        document.getElementById(
            'status-mercado-livre'
        )

};


}

// ============================================================
// 5. ATUALIZAR STATUS
// ============================================================

function atualizarStatusMercadoLivre(
conectado
) {


const elementos =
    obterElementosMercadoLivre();

if (!elementos.status) {
    return;
}

if (conectado) {

    elementos.status.textContent =
        'Conectado';

    elementos.status.classList.remove(
        'status-desconectado'
    );

    elementos.status.classList.add(
        'status-conectado'
    );

} else {

    elementos.status.textContent =
        'Desconectado';

    elementos.status.classList.remove(
        'status-conectado'
    );

    elementos.status.classList.add(
        'status-desconectado'
    );

}


}

// ============================================================
// 6. VERIFICAR CONEXÃO
// ============================================================
//
// Nesta primeira etapa verificamos se existe uma conexão
// salva futuramente no Supabase.
//
// A tabela será utilizada quando concluirmos o OAuth.
//
// Caso a tabela ainda não exista, mantemos o status
// como "Desconectado" sem quebrar a página.
// ============================================================

async function verificarConexaoMercadoLivre() {


const supabase =
    obterSupabaseIntegracoes();

if (!supabase) {

    atualizarStatusMercadoLivre(
        false
    );

    return false;

}

try {

    // ====================================================
    // FUTURA CONSULTA DA CONEXÃO
    // ====================================================
    //
    // Quando criarmos a tabela de integrações,
    // esta parte será ativada.
    //
    // Por enquanto não fazemos uma consulta que possa
    // gerar erro caso a tabela ainda não exista.
    // ====================================================

    atualizarStatusMercadoLivre(
        false
    );

    return false;

} catch (erro) {

    console.error(
        'Erro ao verificar conexão do Mercado Livre:',
        erro
    );

    atualizarStatusMercadoLivre(
        false
    );

    return false;

}


}

// ============================================================
// 7. GERAR URL DO OAUTH
// ============================================================

function gerarUrlOAuthMercadoLivre() {


const parametros =
    new URLSearchParams({

        response_type:
            'code',

        client_id:
            CONFIG_MERCADO_LIVRE.CLIENT_ID,

        redirect_uri:
            CONFIG_MERCADO_LIVRE.REDIRECT_URI

    });

return (
    CONFIG_MERCADO_LIVRE.AUTH_URL +
    '?' +
    parametros.toString()
);


}

// ============================================================
// 8. CONECTAR MERCADO LIVRE
// ============================================================

function conectarMercadoLivre() {


const botao =
    document.getElementById(
        'btn-conectar-mercado-livre'
    );

if (botao) {

    botao.disabled = true;

    botao.textContent =
        'Conectando...';

}

try {

    const url =
        gerarUrlOAuthMercadoLivre();

    console.log(
        'Iniciando OAuth do Mercado Livre.'
    );

    console.log(
        'Client ID:',
        CONFIG_MERCADO_LIVRE.CLIENT_ID
    );

    console.log(
        'Redirect URI:',
        CONFIG_MERCADO_LIVRE.REDIRECT_URI
    );

    window.location.href =
        url;

} catch (erro) {

    console.error(
        'Erro ao iniciar OAuth:',
        erro
    );

    alert(
        'Não foi possível iniciar a conexão com o Mercado Livre.'
    );

    if (botao) {

        botao.disabled = false;

        botao.textContent =
            'Conectar Mercado Livre';

    }

}


}

// ============================================================
// 9. CONFIGURAR BOTÃO DO MERCADO LIVRE
// ============================================================

function configurarBotaoMercadoLivre() {


const botao =
    document.getElementById(
        'btn-conectar-mercado-livre'
    );

if (!botao) {

    console.warn(
        'Botão do Mercado Livre não encontrado.'
    );

    return;

}

botao.addEventListener(
    'click',
    function() {

        conectarMercadoLivre();

    }
);


}

// ============================================================
// 10. VERIFICAR RETORNO DO OAUTH
// ============================================================

function verificarRetornoOAuth() {


const parametros =
    new URLSearchParams(
        window.location.search
    );

const conectado =
    parametros.get(
        'mercadolivre'
    );

const erro =
    parametros.get(
        'erro'
    );

if (conectado === 'sucesso') {

    atualizarStatusMercadoLivre(
        true
    );

    alert(
        'Mercado Livre conectado com sucesso!'
    );

    window.history.replaceState(
        {},
        document.title,
        window.location.pathname
    );

    return;

}

if (erro) {

    console.error(
        'Erro recebido no retorno do Mercado Livre:',
        erro
    );

    alert(
        'Não foi possível conectar ao Mercado Livre.'
    );

    window.history.replaceState(
        {},
        document.title,
        window.location.pathname
    );

}


}

// ============================================================
// 11. BOTÃO SAIR
// ============================================================

function configurarBotaoSairAdmin() {


const botao =
    document.getElementById(
        'btn-sair-admin'
    );

if (!botao) {
    return;
}

botao.addEventListener(
    'click',
    async function() {

        if (supabaseIntegracoes) {

            try {

                await supabaseIntegracoes.auth.signOut();

            } catch (erro) {

                console.error(
                    'Erro ao sair:',
                    erro
                );

            }

        }

        window.location.href =
            '05-admin.html';

    }
);


}

// ============================================================
// 12. VERIFICAR ADMINISTRADOR
// ============================================================

async function verificarAdministradorIntegracoes() {


const supabase =
    obterSupabaseIntegracoes();

if (!supabase) {

    console.warn(
        'Supabase não disponível para verificar administrador.'
    );

    return;

}

try {

    const resultado =
        await supabase.auth.getSession();

    const session =
        resultado?.data?.session;

    if (!session) {

        console.warn(
            'Nenhuma sessão encontrada.'
        );

        // Não redirecionamos nesta etapa para evitar
        // interferir no fluxo atual do painel.

        return;

    }

    console.log(
        'Administrador autenticado:',
        session.user?.email || 'usuário autenticado'
    );

} catch (erro) {

    console.error(
        'Erro ao verificar sessão:',
        erro
    );

}


}

// ============================================================
// 13. INICIALIZAÇÃO
// ============================================================

document.addEventListener(
'DOMContentLoaded',
async function() {


    console.log(
        '============================================================'
    );

    console.log(
        'ZoraVision - Integrações'
    );

    console.log(
        'Inicializando painel de integrações...'
    );

    console.log(
        '============================================================'
    );


    // ----------------------------------------------------
    // SUPABASE
    // ----------------------------------------------------

    supabaseIntegracoes =
        obterSupabaseIntegracoes();


    // ----------------------------------------------------
    // RETORNO OAUTH
    // ----------------------------------------------------

    verificarRetornoOAuth();


    // ----------------------------------------------------
    // ADMIN
    // ----------------------------------------------------

    await verificarAdministradorIntegracoes();


    // ----------------------------------------------------
    // BOTÃO MERCADO LIVRE
    // ----------------------------------------------------

    configurarBotaoMercadoLivre();


    // ----------------------------------------------------
    // BOTÃO SAIR
    // ----------------------------------------------------

    configurarBotaoSairAdmin();


    // ----------------------------------------------------
    // STATUS MERCADO LIVRE
    // ----------------------------------------------------

    await verificarConexaoMercadoLivre();


    console.log(
        '============================================================'
    );

    console.log(
        'Painel de integrações inicializado.'
    );

    console.log(
        '============================================================'
    );

}


);

// ============================================================
// 14. FUNÇÕES GLOBAIS
// ============================================================

window.conectarMercadoLivre =
conectarMercadoLivre;

window.gerarUrlOAuthMercadoLivre =
gerarUrlOAuthMercadoLivre;

window.verificarConexaoMercadoLivre =
verificarConexaoMercadoLivre;

window.atualizarStatusMercadoLivre =
atualizarStatusMercadoLivre;
