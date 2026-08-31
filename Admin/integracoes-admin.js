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
// - Gerar state
// - Salvar dados temporários do OAuth
// - Redirecionar para autorização do Mercado Livre
// - Verificar conexão existente
// ============================================================

// ============================================================
// 1. CONFIGURAÇÕES
// ============================================================

const MERCADO_LIVRE_CLIENT_ID =
'8816875791365432';

// IMPORTANTE:
// O Mercado Livre deve retornar para esta página.
//
// O callback precisa estar na mesma origem do site,
// porque o code_verifier está salvo no sessionStorage.

const MERCADO_LIVRE_REDIRECT_URI =
'https://rafaelmfernandes.github.io/Site-zora-vision/Admin/mercadolivre-callback.html';

const MERCADO_LIVRE_AUTH_URL =
'https://auth.mercadolivre.com.br/authorization';

const CHAVE_PKCE_MERCADO_LIVRE =
'zoravision_ml_code_verifier';

const CHAVE_STATE_MERCADO_LIVRE =
'zoravision_ml_oauth_state';

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

if (
    typeof window.obterSupabase ===
    'function'
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
// 3. BASE64 URL
// ============================================================

function base64UrlEncode(
buffer
) {


let binary = '';

const bytes =
    new Uint8Array(
        buffer
    );

for (
    let i = 0;
    i < bytes.byteLength;
    i++
) {

    binary += String.fromCharCode(
        bytes[i]
    );

}

return btoa(
    binary
)
    .replace(
        /\+/g,
        '-'
    )
    .replace(
        /\//g,
        '_'
    )
    .replace(
        /=+$/,
        ''
    );


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
    new Uint32Array(
        tamanho
    );


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
// 6. GERAR STATE
// ============================================================

function gerarState() {


const stateArray =
    new Uint8Array(
        32
    );


crypto.getRandomValues(
    stateArray
);


return base64UrlEncode(
    stateArray
);


}

// ============================================================
// 7. SALVAR CODE VERIFIER
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
// 8. RECUPERAR CODE VERIFIER
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
// 9. REMOVER CODE VERIFIER
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
// 10. SALVAR STATE
// ============================================================

function salvarState(
state
) {


try {

    sessionStorage.setItem(
        CHAVE_STATE_MERCADO_LIVRE,
        state
    );


    console.log(
        'State OAuth salvo.'
    );


    return true;


} catch (erro) {

    console.error(
        'Erro ao salvar state:',
        erro
    );


    return false;

}


}

// ============================================================
// 11. RECUPERAR STATE
// ============================================================

function obterState() {


try {

    return sessionStorage.getItem(
        CHAVE_STATE_MERCADO_LIVRE
    );

} catch (erro) {

    console.error(
        'Erro ao recuperar state:',
        erro
    );

    return null;

}


}

// ============================================================
// 12. REMOVER STATE
// ============================================================

function removerState() {


try {

    sessionStorage.removeItem(
        CHAVE_STATE_MERCADO_LIVRE
    );

} catch (erro) {

    console.error(
        'Erro ao remover state:',
        erro
    );

}


}

// ============================================================
// 13. ATUALIZAR STATUS MERCADO LIVRE
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
// 14. LIMPAR PARÂMETROS OAUTH
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
// 15. CONECTAR MERCADO LIVRE
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
        'ZoraVision - Mercado Livre'
    );


    console.log(
        'Iniciando OAuth 2.0 + PKCE...'
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
    // GERAR CODE VERIFIER
    // --------------------------------------------------------

    const codeVerifier =
        gerarCodeVerifier();


    console.log(
        'Code verifier gerado.'
    );


    // --------------------------------------------------------
    // GERAR CODE CHALLENGE
    // --------------------------------------------------------

    const codeChallenge =
        await gerarCodeChallenge(
            codeVerifier
        );


    console.log(
        'Code challenge gerado.'
    );


    // --------------------------------------------------------
    // SALVAR CODE VERIFIER
    // --------------------------------------------------------

    const verifierSalvo =
        salvarCodeVerifier(
            codeVerifier
        );


    if (!verifierSalvo) {

        throw new Error(
            'Não foi possível salvar o código de segurança PKCE.'
        );

    }


    // --------------------------------------------------------
    // GERAR STATE
    // --------------------------------------------------------

    const state =
        gerarState();


    const stateSalvo =
        salvarState(
            state
        );


    if (!stateSalvo) {

        removerCodeVerifier();


        throw new Error(
            'Não foi possível iniciar a validação de segurança.'
        );

    }


    // --------------------------------------------------------
    // MONTAR PARÂMETROS
    // --------------------------------------------------------

    const parametros =
        new URLSearchParams();


    parametros.set(
        'response_type',
        'code'
    );


    parametros.set(
        'client_id',
        MERCADO_LIVRE_CLIENT_ID
    );


    parametros.set(
        'redirect_uri',
        MERCADO_LIVRE_REDIRECT_URI
    );


    parametros.set(
        'code_challenge',
        codeChallenge
    );


    parametros.set(
        'code_challenge_method',
        'S256'
    );


    parametros.set(
        'state',
        state
    );


    // --------------------------------------------------------
    // URL FINAL
    // --------------------------------------------------------

    const urlAutorizacao =
        MERCADO_LIVRE_AUTH_URL +
        '?' +
        parametros.toString();


    console.log(
        'URI de redirect:',
        MERCADO_LIVRE_REDIRECT_URI
    );


    console.log(
        'State gerado.'
    );


    console.log(
        'Redirecionando para Mercado Livre...'
    );


    // --------------------------------------------------------
    // REDIRECIONAMENTO
    // --------------------------------------------------------

    window.location.assign(
        urlAutorizacao
    );


} catch (erro) {

    console.error(
        'Erro ao iniciar OAuth:',
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
// 16. PROCESSAR RETORNO CASO A PÁGINA RECEBA CALLBACK
// ============================================================

async function processarRetornoMercadoLivre() {


const url =
    new URL(
        window.location.href
    );


const sucesso =
    url.searchParams.get(
        'mercadolivre'
    );


if (
    sucesso ===
    'conectado'
) {

    atualizarStatusMercadoLivre(
        true
    );


    limparParametrosOAuth();


    return;

}


}

// ============================================================
// 17. VERIFICAR CONEXÃO EXISTENTE
// ============================================================

async function verificarConexaoMercadoLivre() {


/*
 * Neste momento o status ainda será controlado
 * pela tabela de integrações quando a Edge Function
 * estiver salvando a conexão no Supabase.
 *
 * Por enquanto iniciamos como desconectado.
 */

atualizarStatusMercadoLivre(
    false
);


}

// ============================================================
// 18. CONFIGURAR BOTÃO
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
// 19. INICIALIZAÇÃO
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
        'Inicializando painel...'
    );


    console.log(
        'Mercado Livre OAuth 2.0 + PKCE'
    );


    console.log(
        '============================================================'
    );


    configurarBotaoMercadoLivre();


    await verificarConexaoMercadoLivre();


    await processarRetornoMercadoLivre();


    console.log(
        'Inicialização concluída.'
    );

}


);

// ============================================================
// 20. FUNÇÕES GLOBAIS
// ============================================================

window.conectarMercadoLivre =
conectarMercadoLivre;

window.gerarCodeVerifier =
gerarCodeVerifier;

window.gerarCodeChallenge =
gerarCodeChallenge;

window.verificarConexaoMercadoLivre =
verificarConexaoMercadoLivre;
