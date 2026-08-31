// ============================================================
// ZORAVISION - ADMINISTRAÇÃO DE INTEGRAÇÕES
// ============================================================
// Arquivo: Admin/integracoes-admin.js
//
// Responsabilidades:
// - Controlar página de integrações
// - Conectar Mercado Livre
// - OAuth 2.0 com PKCE
// - Gerar code_verifier
// - Gerar code_challenge
// - Redirecionar para autorização do Mercado Livre
// - Detectar retorno OAuth
// - Exibir status da integração
// ============================================================

// ============================================================
// 1. CONFIGURAÇÕES
// ============================================================

const MERCADO_LIVRE_CLIENT_ID =
'8816875791365432';

const MERCADO_LIVRE_REDIRECT_URI =
'https://rafaelmfernandes.github.io/Site-zora-vision/Admin/mercadolivre-callback.html';

const MERCADO_LIVRE_AUTH_URL =
'https://auth.mercadolivre.com.br/authorization';

const CHAVE_PKCE_MERCADO_LIVRE =
'zoravision_ml_code_verifier';

// ============================================================
// 2. SUPABASE
// ============================================================

function obterSupabaseIntegracoes() {


if (window.supabaseClient) {
    return window.supabaseClient;
}

if (window._supabase) {
    return window._supabase;
}

if (typeof window.obterSupabase === 'function') {

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
// 3. BASE64 URL
// ============================================================

function base64UrlEncode(buffer) {


let binary = '';

const bytes =
    new Uint8Array(buffer);

for (
    let i = 0;
    i < bytes.byteLength;
    i++
) {

    binary += String.fromCharCode(
        bytes[i]
    );

}

return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');


}

// ============================================================
// 4. GERAR CODE VERIFIER
// ============================================================

function gerarCodeVerifier() {


const caracteres =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
    'abcdefghijklmnopqrstuvwxyz' +
    '0123456789-._~';

const tamanho = 64;

const valores =
    new Uint32Array(tamanho);

crypto.getRandomValues(
    valores
);

let verifier = '';

for (
    let i = 0;
    i < tamanho;
    i++
) {

    verifier +=
        caracteres[
            valores[i] %
            caracteres.length
        ];

}

return verifier;


}

// ============================================================
// 5. GERAR CODE CHALLENGE
// ============================================================

async function gerarCodeChallenge(
codeVerifier
) {


const encoder =
    new TextEncoder();

const dados =
    encoder.encode(
        codeVerifier
    );

const hash =
    await crypto.subtle.digest(
        'SHA-256',
        dados
    );

return base64UrlEncode(
    hash
);


}

// ============================================================
// 6. SALVAR CODE VERIFIER
// ============================================================

function salvarCodeVerifier(
codeVerifier
) {


try {

    sessionStorage.setItem(
        CHAVE_PKCE_MERCADO_LIVRE,
        codeVerifier
    );

    console.log(
        'Code verifier salvo no sessionStorage.'
    );

    return true;

} catch (erro) {

    console.error(
        'Erro ao salvar code verifier:',
        erro
    );

    return false;

}


}

// ============================================================
// 7. RECUPERAR CODE VERIFIER
// ============================================================

function obterCodeVerifier() {


try {

    return sessionStorage.getItem(
        CHAVE_PKCE_MERCADO_LIVRE
    );

} catch (erro) {

    console.error(
        'Erro ao recuperar code verifier:',
        erro
    );

    return null;

}


}

// ============================================================
// 8. REMOVER CODE VERIFIER
// ============================================================

function removerCodeVerifier() {


try {

    sessionStorage.removeItem(
        CHAVE_PKCE_MERCADO_LIVRE
    );

} catch (erro) {

    console.error(
        'Erro ao remover code verifier:',
        erro
    );

}


}

// ============================================================
// 9. ATUALIZAR STATUS MERCADO LIVRE
// ============================================================

function atualizarStatusMercadoLivre(
conectado
) {


const status =
    document.getElementById(
        'status-mercado-livre'
    );

const botao =
    document.getElementById(
        'btn-conectar-mercado-livre'
    );

if (!status) {
    return;
}

if (conectado) {

    status.textContent =
        'Conectado';

    status.classList.remove(
        'status-desconectado'
    );

    status.classList.add(
        'status-conectado'
    );

    if (botao) {

        botao.textContent =
            'Mercado Livre conectado';

        botao.classList.remove(
            'btn-conectar'
        );

        botao.classList.add(
            'btn-conectado'
        );

    }

} else {

    status.textContent =
        'Desconectado';

    status.classList.remove(
        'status-conectado'
    );

    status.classList.add(
        'status-desconectado'
    );

    if (botao) {

        botao.textContent =
            'Conectar Mercado Livre';

        botao.classList.remove(
            'btn-conectado'
        );

        botao.classList.add(
            'btn-conectar'
        );

    }

}


}

// ============================================================
// 10. VERIFICAR RETORNO DO OAUTH
// ============================================================

function verificarRetornoMercadoLivre() {


const url =
    new URL(
        window.location.href
    );

const code =
    url.searchParams.get(
        'code'
    );

const error =
    url.searchParams.get(
        'error'
    );

const errorDescription =
    url.searchParams.get(
        'error_description'
    );

if (error) {

    console.error(
        'Mercado Livre retornou erro:',
        error,
        errorDescription
    );

    alert(
        'Não foi possível conectar ao Mercado Livre.\n\n' +
        (
            errorDescription ||
            error
        )
    );

    limparParametrosOAuth();

    return false;

}

if (!code) {
    return false;
}

console.log(
    'Código OAuth do Mercado Livre detectado.'
);

console.log(
    'Code recebido com sucesso.'
);

return true;


}

// ============================================================
// 11. LIMPAR PARÂMETROS OAUTH
// ============================================================

function limparParametrosOAuth() {


try {

    const url =
        new URL(
            window.location.href
        );

    url.searchParams.delete(
        'code'
    );

    url.searchParams.delete(
        'error'
    );

    url.searchParams.delete(
        'error_description'
    );

    url.searchParams.delete(
        'state'
    );

    window.history.replaceState(
        {},
        document.title,
        url.pathname +
        url.search +
        url.hash
    );

} catch (erro) {

    console.error(
        'Erro ao limpar URL:',
        erro
    );

}


}

// ============================================================
// 12. CONECTAR MERCADO LIVRE
// ============================================================

async function conectarMercadoLivre() {


const botao =
    document.getElementById(
        'btn-conectar-mercado-livre'
    );

if (
    botao &&
    botao.disabled
) {

    return;

}

try {

    console.log(
        '============================================================'
    );

    console.log(
        'Iniciando conexão com Mercado Livre...'
    );

    console.log(
        'Fluxo OAuth 2.0 + PKCE'
    );

    console.log(
        '============================================================'
    );


    if (botao) {

        botao.disabled =
            true;

        botao.textContent =
            'Preparando conexão...';

    }


    // --------------------------------------------------------
    // GERAR VERIFIER
    // --------------------------------------------------------

    const codeVerifier =
        gerarCodeVerifier();

    console.log(
        'Code verifier gerado.'
    );


    // --------------------------------------------------------
    // GERAR CHALLENGE
    // --------------------------------------------------------

    const codeChallenge =
        await gerarCodeChallenge(
            codeVerifier
        );

    console.log(
        'Code challenge gerado.'
    );


    // --------------------------------------------------------
    // SALVAR VERIFIER
    // --------------------------------------------------------

    const salvo =
        salvarCodeVerifier(
            codeVerifier
        );

    if (!salvo) {

        throw new Error(
            'Não foi possível salvar o code verifier.'
        );

    }


    // --------------------------------------------------------
    // GERAR STATE
    // --------------------------------------------------------

    const stateArray =
        new Uint8Array(32);

    crypto.getRandomValues(
        stateArray
    );

    const state =
        base64UrlEncode(
            stateArray
        );

    sessionStorage.setItem(
        'zoravision_ml_oauth_state',
        state
    );


    // --------------------------------------------------------
    // MONTAR URL DO MERCADO LIVRE
    // --------------------------------------------------------

    const parametros =
        new URLSearchParams({

            response_type:
                'code',

            client_id:
                MERCADO_LIVRE_CLIENT_ID,

            redirect_uri:
                MERCADO_LIVRE_REDIRECT_URI,

            code_challenge:
                codeChallenge,

            code_challenge_method:
                'S256',

            state:
                state

        });


    const urlAutorizacao =
        MERCADO_LIVRE_AUTH_URL +
        '?' +
        parametros.toString();


    console.log(
        'URL de autorização preparada.'
    );

    console.log(
        'Redirecionando para o Mercado Livre...'
    );


    // --------------------------------------------------------
    // REDIRECIONAMENTO REAL
    // --------------------------------------------------------

    window.location.href =
        urlAutorizacao;


} catch (erro) {

    console.error(
        'Erro ao iniciar OAuth do Mercado Livre:',
        erro
    );

    if (botao) {

        botao.disabled =
            false;

        botao.textContent =
            'Conectar Mercado Livre';

    }

    alert(
        'Não foi possível iniciar a conexão com o Mercado Livre.\n\n' +
        (
            erro?.message ||
            'Erro desconhecido.'
        )
    );

}


}

// ============================================================
// 13. PROCESSAR RETORNO
// ============================================================

async function processarRetornoMercadoLivre() {


const url =
    new URL(
        window.location.href
    );

const code =
    url.searchParams.get(
        'code'
    );

const state =
    url.searchParams.get(
        'state'
    );

if (!code) {
    return;
}

console.log(
    'Processando retorno do Mercado Livre...'
);


// --------------------------------------------------------
// VALIDAR STATE
// --------------------------------------------------------

const stateSalvo =
    sessionStorage.getItem(
        'zoravision_ml_oauth_state'
    );

if (
    stateSalvo &&
    state &&
    stateSalvo !== state
) {

    console.error(
        'State OAuth inválido.'
    );

    alert(
        'A validação de segurança da conexão falhou.'
    );

    limparParametrosOAuth();

    return;

}


// --------------------------------------------------------
// RECUPERAR VERIFIER
// --------------------------------------------------------

const codeVerifier =
    obterCodeVerifier();

if (!codeVerifier) {

    console.error(
        'Code verifier não encontrado.'
    );

    alert(
        'Não foi possível concluir a conexão.\n\n' +
        'O código de segurança PKCE não foi encontrado. ' +
        'Tente conectar novamente.'
    );

    limparParametrosOAuth();

    return;

}


console.log(
    'Code verifier recuperado.'
);


// --------------------------------------------------------
// IMPORTANTE
// --------------------------------------------------------
//
// Neste momento NÃO vamos fazer fetch para a Edge Function.
//
// O Mercado Livre deve redirecionar diretamente para:
//
// mercadolivre-oauth
//
// A Edge Function receberá o "code".
//
// O code_verifier precisará ser enviado para o backend
// de forma segura no próximo passo.
//
// --------------------------------------------------------


console.log(
    'Código OAuth recebido.'
);

console.log(
    'PKCE validado no navegador.'
);


}

// ============================================================
// 14. CONFIGURAR BOTÃO MERCADO LIVRE
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
    conectarMercadoLivre
);


}

// ============================================================
// 15. VERIFICAR CONEXÃO EXISTENTE
// ============================================================

async function verificarConexaoMercadoLivre() {


/*
 * Nesta etapa ainda não consultamos tokens.
 *
 * Depois que a Edge Function estiver salvando
 * a conexão no Supabase, esta função passará a
 * consultar a tabela de integrações.
 */

atualizarStatusMercadoLivre(
    false
);


}

// ============================================================
// 16. INICIALIZAÇÃO
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
        'Inicializando integração Mercado Livre...'
    );

    console.log(
        '============================================================'
    );


    configurarBotaoMercadoLivre();


    await verificarConexaoMercadoLivre();


    /*
     * Detecta se esta página recebeu um callback OAuth.
     *
     * Normalmente, com a configuração atual,
     * o Mercado Livre deverá enviar o usuário
     * diretamente para a Edge Function.
     */

    verificarRetornoMercadoLivre();

    processarRetornoMercadoLivre();


    console.log(
        'Inicialização das integrações finalizada.'
    );

}


);

// ============================================================
// 17. FUNÇÕES GLOBAIS
// ============================================================

window.conectarMercadoLivre =
conectarMercadoLivre;

window.gerarCodeVerifier =
gerarCodeVerifier;

window.gerarCodeChallenge =
gerarCodeChallenge;

window.verificarConexaoMercadoLivre =
verificarConexaoMercadoLivre;
