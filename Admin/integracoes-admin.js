// ============================================================
// ZORAVISION - ADMINISTRAÇÃO DE INTEGRAÇÕES
// ============================================================
// Arquivo: Admin/integracoes-admin.js
//
// Responsabilidades:
// - Gerenciar integração com Mercado Livre
// - Iniciar OAuth 2.0
// - Utilizar PKCE
// - Gerar code_verifier
// - Gerar code_challenge
// - Guardar temporariamente o code_verifier
// - Verificar retorno do OAuth
// - Atualizar status da integração
//
// IMPORTANTE:
// - NÃO colocar Client Secret neste arquivo.
// - O Client Secret permanece somente no Supabase.
// ============================================================

// ============================================================
// 1. CONFIGURAÇÃO DO MERCADO LIVRE
// ============================================================

const CONFIG_MERCADO_LIVRE = {


CLIENT_ID:
    '8816875791365432',

REDIRECT_URI:
    'https://ratajxnxkjoiuknamacn.supabase.co/functions/v1/mercadolivre-oauth',

AUTH_URL:
    'https://auth.mercadolivre.com.br/authorization',

STORAGE_KEY:
    'zoravision_ml_code_verifier'


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
// 4. ELEMENTOS DO MERCADO LIVRE
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
// 6. GERAR CODE VERIFIER
// ============================================================

function gerarCodeVerifier() {


const caracteres =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
    'abcdefghijklmnopqrstuvwxyz' +
    '0123456789-._~';

const tamanho = 64;

const valores =
    new Uint8Array(
        tamanho
    );

crypto.getRandomValues(
    valores
);

let verifier = '';

for (
    let i = 0;
    i < valores.length;
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
// 7. GERAR CODE CHALLENGE
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

const bytes =
    new Uint8Array(
        hash
    );

let resultado = '';

for (
    let i = 0;
    i < bytes.length;
    i++
) {

    resultado +=
        String.fromCharCode(
            bytes[i]
        );

}

return btoa(
    resultado
)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');


}

// ============================================================
// 8. INICIAR OAUTH
// ============================================================

async function conectarMercadoLivre() {


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

    console.log(
        '============================================================'
    );

    console.log(
        'Iniciando OAuth Mercado Livre com PKCE'
    );

    console.log(
        '============================================================'
    );


    // ----------------------------------------------------
    // GERAR CODE VERIFIER
    // ----------------------------------------------------

    const codeVerifier =
        gerarCodeVerifier();

    console.log(
        'Code verifier gerado.'
    );


    // ----------------------------------------------------
    // GERAR CODE CHALLENGE
    // ----------------------------------------------------

    const codeChallenge =
        await gerarCodeChallenge(
            codeVerifier
        );

    console.log(
        'Code challenge gerado.'
    );


    // ----------------------------------------------------
    // GUARDAR CODE VERIFIER
    // ----------------------------------------------------
    //
    // O verifier será necessário quando o Mercado Livre
    // devolver o authorization code.
    //
    // O Client Secret NÃO é armazenado aqui.
    // ----------------------------------------------------

    sessionStorage.setItem(
        CONFIG_MERCADO_LIVRE.STORAGE_KEY,
        codeVerifier
    );


    // ----------------------------------------------------
    // GERAR URL DE AUTORIZAÇÃO
    // ----------------------------------------------------

    const parametros =
        new URLSearchParams();

    parametros.set(
        'response_type',
        'code'
    );

    parametros.set(
        'client_id',
        CONFIG_MERCADO_LIVRE.CLIENT_ID
    );

    parametros.set(
        'redirect_uri',
        CONFIG_MERCADO_LIVRE.REDIRECT_URI
    );

    parametros.set(
        'code_challenge',
        codeChallenge
    );

    parametros.set(
        'code_challenge_method',
        'S256'
    );


    const urlOAuth =
        CONFIG_MERCADO_LIVRE.AUTH_URL +
        '?' +
        parametros.toString();


    console.log(
        'Client ID:',
        CONFIG_MERCADO_LIVRE.CLIENT_ID
    );

    console.log(
        'Redirect URI:',
        CONFIG_MERCADO_LIVRE.REDIRECT_URI
    );

    console.log(
        'PKCE:',
        'S256'
    );

    console.log(
        'Redirecionando para o Mercado Livre...'
    );


    // ----------------------------------------------------
    // REDIRECIONAR
    // ----------------------------------------------------

    window.location.href =
        urlOAuth;

} catch (erro) {

    console.error(
        'Erro ao iniciar OAuth do Mercado Livre:',
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
// 9. RECUPERAR CODE VERIFIER
// ============================================================

function obterCodeVerifier() {


try {

    return sessionStorage.getItem(
        CONFIG_MERCADO_LIVRE.STORAGE_KEY
    );

} catch (erro) {

    console.error(
        'Erro ao recuperar code_verifier:',
        erro
    );

    return null;

}


}

// ============================================================
// 10. LIMPAR CODE VERIFIER
// ============================================================

function limparCodeVerifier() {


try {

    sessionStorage.removeItem(
        CONFIG_MERCADO_LIVRE.STORAGE_KEY
    );

} catch (erro) {

    console.error(
        'Erro ao limpar code_verifier:',
        erro
    );

}


}

// ============================================================
// 11. VERIFICAR CONEXÃO
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

    // ----------------------------------------------------
    // A consulta real será adicionada depois que criarmos
    // a tabela de conexões e concluirmos o armazenamento
    // dos tokens.
    // ----------------------------------------------------

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
// 12. CONFIGURAR BOTÃO
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
    async function() {

        await conectarMercadoLivre();

    }
);


}

// ============================================================
// 13. VERIFICAR RETORNO DO OAUTH
// ============================================================

function verificarRetornoOAuth() {


const parametros =
    new URLSearchParams(
        window.location.search
    );

const code =
    parametros.get(
        'code'
    );

const erro =
    parametros.get(
        'error'
    );

const erroDescricao =
    parametros.get(
        'error_description'
    );


// --------------------------------------------------------
// ERRO
// --------------------------------------------------------

if (erro) {

    console.error(
        'Erro OAuth Mercado Livre:',
        erro,
        erroDescricao
    );

    limparCodeVerifier();

    alert(
        'A autorização do Mercado Livre não foi concluída.\n\n' +
        (
            erroDescricao ||
            erro
        )
    );

    limparParametrosURL();

    return;

}


// --------------------------------------------------------
// CODE
// --------------------------------------------------------

if (code) {

    console.log(
        'Authorization code recebido.'
    );

    const codeVerifier =
        obterCodeVerifier();

    if (!codeVerifier) {

        console.error(
            'Code verifier não encontrado.'
        );

        alert(
            'Não foi possível concluir a autorização do Mercado Livre porque o código PKCE não foi encontrado.'
        );

        limparParametrosURL();

        return;

    }

    console.log(
        'Code verifier encontrado.'
    );

    console.log(
        'Authorization code pronto para ser enviado ao backend.'
    );


    // ----------------------------------------------------
    // IMPORTANTE
    // ----------------------------------------------------
    //
    // O navegador não troca o código diretamente.
    //
    // O próximo passo será enviar:
    //
    // code
    // code_verifier
    //
    // para a Edge Function:
    //
    // mercadolivre-oauth
    //
    // A Edge Function utilizará também o Client Secret.
    // ----------------------------------------------------


    enviarCodigoParaBackend(
        code,
        codeVerifier
    );

}


}

// ============================================================
// 14. ENVIAR CODE PARA BACKEND
// ============================================================

async function enviarCodigoParaBackend(
code,
codeVerifier
) {


console.log(
    'Enviando autorização para o backend...'
);

try {

    const parametros =
        new URLSearchParams();

    parametros.set(
        'code',
        code
    );

    parametros.set(
        'code_verifier',
        codeVerifier
    );


    const urlBackend =
        CONFIG_MERCADO_LIVRE.REDIRECT_URI +
        '?' +
        parametros.toString();


    console.log(
        'Backend OAuth:',
        CONFIG_MERCADO_LIVRE.REDIRECT_URI
    );


    // ----------------------------------------------------
    // REDIRECIONAR PARA A EDGE FUNCTION
    // ----------------------------------------------------
    //
    // A Edge Function receberá:
    //
    // ?code=...
    // &code_verifier=...
    //
    // e fará a troca segura pelo token.
    // ----------------------------------------------------

    window.location.href =
        urlBackend;

} catch (erro) {

    console.error(
        'Erro ao enviar código para backend:',
        erro
    );

    alert(
        'Não foi possível enviar a autorização para o servidor.'
    );

}


}

// ============================================================
// 15. LIMPAR PARÂMETROS DA URL
// ============================================================

function limparParametrosURL() {


try {

    window.history.replaceState(
        {},
        document.title,
        window.location.pathname
    );

} catch (erro) {

    console.error(
        'Erro ao limpar URL:',
        erro
    );

}


}

// ============================================================
// 16. VERIFICAR ADMINISTRADOR
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

        return;

    }

    console.log(
        'Administrador autenticado:',
        session.user?.email ||
        'usuário autenticado'
    );

} catch (erro) {

    console.error(
        'Erro ao verificar sessão:',
        erro
    );

}


}

// ============================================================
// 17. BOTÃO SAIR
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

                await supabaseIntegracoes
                    .auth
                    .signOut();

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
// 18. INICIALIZAÇÃO
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
    // VERIFICAR RETORNO OAUTH
    // ----------------------------------------------------

    verificarRetornoOAuth();


    // ----------------------------------------------------
    // VERIFICAR ADMIN
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
    // STATUS
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
// 19. FUNÇÕES GLOBAIS
// ============================================================

window.conectarMercadoLivre =
conectarMercadoLivre;

window.gerarCodeVerifier =
gerarCodeVerifier;

window.gerarCodeChallenge =
gerarCodeChallenge;

window.obterCodeVerifier =
obterCodeVerifier;

window.limparCodeVerifier =
limparCodeVerifier;

window.verificarConexaoMercadoLivre =
verificarConexaoMercadoLivre;

window.atualizarStatusMercadoLivre =
atualizarStatusMercadoLivre;

window.verificarRetornoOAuth =
verificarRetornoOAuth;
