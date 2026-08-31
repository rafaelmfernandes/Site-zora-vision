// ============================================================
// ZORAVISION - ADMINISTRAÇÃO DE INTEGRAÇÕES
// ============================================================
// Arquivo:
// Admin/integracoes-admin.js
//
// Responsabilidades:
// - Controlar página de integrações
// - Conectar Mercado Livre
// - OAuth 2.0 + PKCE
// - Gerar code_verifier
// - Gerar code_challenge
// - Gerar state
// - Consultar conexão real no Supabase
// - Mostrar status da integração
// - Importar produtos do Mercado Livre
// ============================================================

// ============================================================
// 1. CONFIGURAÇÕES
// ============================================================

const MERCADO_LIVRE_CLIENT_ID =
'8816875791365432';

const MERCADO_LIVRE_AUTH_URL =
'https://auth.mercadolivre.com.br/authorization';

const MERCADO_LIVRE_REDIRECT_URI =
'https://rafaelmfernandes.github.io/Site-zora-vision/Admin/mercadolivre-callback.html';

const EDGE_FUNCTION_IMPORTAR =
'https://ratajxnxkjoiuknamacn.supabase.co/functions/v1/mercadolivre-importar-produtos';

const CHAVE_PKCE_MERCADO_LIVRE =
'zoravision_ml_code_verifier';

const CHAVE_STATE_MERCADO_LIVRE =
'zoravision_ml_oauth_state';

// ============================================================
// 2. SUPABASE
// ============================================================

function obterSupabaseIntegracoes() {


if (
    window.supabaseClient &&
    typeof window.supabaseClient
        .from === 'function'
) {

    return window.supabaseClient;

}

if (
    window._supabase &&
    typeof window._supabase
        .from === 'function'
) {

    return window._supabase;

}

if (
    typeof window.obterSupabase ===
    'function'
) {

    try {

        const cliente =
            window.obterSupabase();

        if (
            cliente &&
            typeof cliente.from ===
            'function'
        ) {

            return cliente;

        }

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
        'Code verifier salvo.'
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
// 8. REMOVER DADOS PKCE
// ============================================================

function removerDadosPKCE() {


try {

    sessionStorage.removeItem(
        CHAVE_PKCE_MERCADO_LIVRE
    );

    sessionStorage.removeItem(
        CHAVE_STATE_MERCADO_LIVRE
    );

} catch (erro) {

    console.warn(
        'Erro ao remover dados PKCE:',
        erro
    );

}


}

// ============================================================
// 9. ATUALIZAR STATUS VISUAL
// ============================================================

function atualizarStatusMercadoLivre(
conectado
) {


const status =
    document.getElementById(
        'status-mercado-livre'
    );

const botaoConectar =
    document.getElementById(
        'btn-conectar-mercado-livre'
    );

const botaoImportar =
    document.getElementById(
        'btn-importar-mercado-livre'
    );

if (!status) {

    console.warn(
        'Elemento status-mercado-livre não encontrado.'
    );

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


    if (botaoConectar) {

        botaoConectar.textContent =
            'Mercado Livre conectado';

        botaoConectar.classList.remove(
            'btn-conectar'
        );

        botaoConectar.classList.add(
            'btn-conectado'
        );

    }


    if (botaoImportar) {

        botaoImportar.style.display =
            'inline-flex';

        botaoImportar.disabled =
            false;

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


    if (botaoConectar) {

        botaoConectar.textContent =
            'Conectar Mercado Livre';

        botaoConectar.classList.remove(
            'btn-conectado'
        );

        botaoConectar.classList.add(
            'btn-conectar'
        );

        botaoConectar.disabled =
            false;

    }


    if (botaoImportar) {

        botaoImportar.style.display =
            'none';

    }

}


}

// ============================================================
// 10. RESULTADO DA IMPORTAÇÃO
// ============================================================

function mostrarResultadoImportacao(
tipo,
mensagem
) {


const elemento =
    document.getElementById(
        'resultado-importacao-mercado-livre'
    );

if (!elemento) {

    return;

}

elemento.style.display =
    'block';

elemento.textContent =
    mensagem;


elemento.classList.remove(
    'importacao-sucesso',
    'importacao-erro',
    'importacao-carregando'
);


if (tipo === 'sucesso') {

    elemento.classList.add(
        'importacao-sucesso'
    );

}


if (tipo === 'erro') {

    elemento.classList.add(
        'importacao-erro'
    );

}


if (tipo === 'carregando') {

    elemento.classList.add(
        'importacao-carregando'
    );

}


}

// ============================================================
// 11. VERIFICAR CONEXÃO REAL NO SUPABASE
// ============================================================

async function verificarConexaoMercadoLivre() {


console.log(
    'Verificando conexão do Mercado Livre no Supabase...'
);


const supabase =
    obterSupabaseIntegracoes();


if (!supabase) {

    console.error(
        'Não foi possível acessar o Supabase.'
    );

    atualizarStatusMercadoLivre(
        false
    );

    return false;

}


try {

    const {
        data,
        error
    } =
        await supabase
            .from('integracoes')
            .select(
                'id,plataforma,usuario_id,expires_at,criado_em,atualizado_em'
            )
            .eq(
                'plataforma',
                'mercado_livre'
            )
            .limit(1);


    if (error) {

        console.error(
            'Erro ao consultar tabela integracoes:',
            error
        );

        atualizarStatusMercadoLivre(
            false
        );

        return false;

    }


    console.log(
        'Resultado da consulta integracoes:',
        data
    );


    if (
        Array.isArray(data) &&
        data.length > 0
    ) {

        console.log(
            'Conexão Mercado Livre encontrada.'
        );

        atualizarStatusMercadoLivre(
            true
        );

        return true;

    }


    console.log(
        'Nenhuma conexão Mercado Livre encontrada.'
    );

    atualizarStatusMercadoLivre(
        false
    );

    return false;


} catch (erro) {

    console.error(
        'Erro inesperado ao verificar conexão:',
        erro
    );

    atualizarStatusMercadoLivre(
        false
    );

    return false;

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
    // CODE VERIFIER
    // --------------------------------------------------------

    const codeVerifier =
        gerarCodeVerifier();


    console.log(
        'Code verifier gerado.'
    );


    // --------------------------------------------------------
    // CODE CHALLENGE
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
            'Não foi possível salvar o code_verifier.'
        );

    }


    // --------------------------------------------------------
    // STATE
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
        CHAVE_STATE_MERCADO_LIVRE,
        state
    );


    console.log(
        'State OAuth gerado.'
    );


    // --------------------------------------------------------
    // PARÂMETROS
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
        'Redirect URI:',
        MERCADO_LIVRE_REDIRECT_URI
    );


    console.log(
        'Redirecionando para Mercado Livre...'
    );


    window.location.href =
        urlAutorizacao;


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
// 13. IMPORTAR PRODUTOS DO MERCADO LIVRE
// ============================================================

async function importarProdutosMercadoLivre() {


const botao =
    document.getElementById(
        'btn-importar-mercado-livre'
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
        'ZoraVision - Importação Mercado Livre'
    );

    console.log(
        'Iniciando importação...'
    );

    console.log(
        '============================================================'
    );


    if (botao) {

        botao.disabled =
            true;

        botao.textContent =
            '⏳ Importando produtos...';

    }


    mostrarResultadoImportacao(
        'carregando',
        'Consultando seus produtos no Mercado Livre...'
    );


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
                    JSON.stringify({})

            }
        );


    let resultado = null;


    try {

        resultado =
            await resposta.json();

    } catch (erro) {

        console.error(
            'Erro ao interpretar resposta:',
            erro
        );

    }


    console.log(
        'Status da Edge Function:',
        resposta.status
    );


    console.log(
        'Resultado da importação:',
        resultado
    );


    if (!resposta.ok) {

        throw new Error(
            resultado?.erro ||
            resultado?.error ||
            'A importação não foi concluída.'
        );

    }


    const encontrados =
        Number(
            resultado?.total_encontrados ||
            0
        );


    const criados =
        Number(
            resultado?.criados ||
            0
        );


    const atualizados =
        Number(
            resultado?.atualizados ||
            0
        );


    const erros =
        Number(
            resultado?.erros ||
            0
        );


    mostrarResultadoImportacao(
        'sucesso',
        'Importação concluída! ' +
        encontrados +
        ' produtos encontrados, ' +
        criados +
        ' criados, ' +
        atualizados +
        ' atualizados e ' +
        erros +
        ' erros.'
    );


    if (botao) {

        botao.disabled =
            false;

        botao.textContent =
            '📥 Importar produtos novamente';

    }


    console.log(
        'Importação concluída.'
    );


    return resultado;


} catch (erro) {

    console.error(
        'Erro ao importar produtos:',
        erro
    );


    mostrarResultadoImportacao(
        'erro',
        'Não foi possível importar os produtos. ' +
        (
            erro?.message ||
            'Erro desconhecido.'
        )
    );


    if (botao) {

        botao.disabled =
            false;

        botao.textContent =
            '📥 Tentar importar novamente';

    }

}


}

// ============================================================
// 14. VERIFICAR RETORNO DO OAUTH
// ============================================================

function verificarRetornoMercadoLivre() {


try {

    const url =
        new URL(
            window.location.href
        );


    const conectado =
        url.searchParams.get(
            'mercadolivre'
        );


    const erro =
        url.searchParams.get(
            'erro'
        );


    if (
        conectado ===
        'conectado'
    ) {

        console.log(
            'Retorno OAuth: Mercado Livre conectado.'
        );


        atualizarStatusMercadoLivre(
            true
        );


        mostrarResultadoImportacao(
            'sucesso',
            'Mercado Livre conectado com sucesso. Agora você pode importar seus produtos.'
        );


        limparParametrosURL();


        return true;

    }


    if (erro) {

        mostrarResultadoImportacao(
            'erro',
            decodeURIComponent(
                erro
            )
        );


        limparParametrosURL();


        return false;

    }


} catch (erro) {

    console.error(
        'Erro ao verificar retorno OAuth:',
        erro
    );

}


return false;


}

// ============================================================
// 15. LIMPAR PARÂMETROS DA URL
// ============================================================

function limparParametrosURL() {


try {

    const url =
        new URL(
            window.location.href
        );


    url.searchParams.delete(
        'mercadolivre'
    );


    url.searchParams.delete(
        'erro'
    );


    window.history.replaceState(
        {},
        document.title,
        url.pathname +
        url.search +
        url.hash
    );


} catch (erro) {

    console.warn(
        'Erro ao limpar parâmetros:',
        erro
    );

}


}

// ============================================================
// 16. CONFIGURAR BOTÃO CONECTAR
// ============================================================

function configurarBotaoMercadoLivre() {


const botao =
    document.getElementById(
        'btn-conectar-mercado-livre'
    );


if (!botao) {

    console.warn(
        'Botão conectar Mercado Livre não encontrado.'
    );

    return;

}


botao.addEventListener(
    'click',
    conectarMercadoLivre
);


}

// ============================================================
// 17. CONFIGURAR BOTÃO IMPORTAR
// ============================================================

function configurarBotaoImportar() {


const botao =
    document.getElementById(
        'btn-importar-mercado-livre'
    );


if (!botao) {

    console.warn(
        'Botão importar Mercado Livre não encontrado.'
    );

    return;

}


botao.addEventListener(
    'click',
    importarProdutosMercadoLivre
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
        'Inicializando painel...'
    );

    console.log(
        '============================================================'
    );


    configurarBotaoMercadoLivre();

    configurarBotaoImportar();


    /*
     * Primeiro verificamos se a página acabou
     * de voltar do OAuth.
     */

    verificarRetornoMercadoLivre();


    /*
     * Depois consultamos a tabela integracoes.
     *
     * Isso garante que o estado continue correto
     * mesmo quando o administrador abrir a página
     * diretamente.
     */

    await verificarConexaoMercadoLivre();


    console.log(
        'Inicialização concluída.'
    );

}


);

// ============================================================
// 19. FUNÇÕES GLOBAIS
// ============================================================

window.conectarMercadoLivre =
conectarMercadoLivre;

window.importarProdutosMercadoLivre =
importarProdutosMercadoLivre;

window.verificarConexaoMercadoLivre =
verificarConexaoMercadoLivre;

window.gerarCodeVerifier =
gerarCodeVerifier;

window.gerarCodeChallenge =
gerarCodeChallenge;
