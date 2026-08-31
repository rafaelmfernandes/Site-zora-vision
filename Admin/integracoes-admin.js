// ============================================================
// ZORAVISION - ADMINISTRAÇÃO DE INTEGRAÇÕES
// Arquivo: Admin/integracoes-admin.js
// ============================================================

const MERCADO_LIVRE_CLIENT_ID =
'8816875791365432';

const MERCADO_LIVRE_REDIRECT_URI =
'https://rafaelmfernandes.github.io/Site-zora-vision/Admin/mercadolivre-callback.html';

const MERCADO_LIVRE_AUTH_URL =
'https://auth.mercadolivre.com.br/authorization';

const EDGE_FUNCTION_IMPORTAR =
'https://ratajxnxkjoiuknamacn.supabase.co/functions/v1/mercadolivre-importar-produtos';

const CHAVE_PKCE_MERCADO_LIVRE =
'zoravision_ml_code_verifier';

const CHAVE_STATE_MERCADO_LIVRE =
'zoravision_ml_oauth_state';

const PAGINA_PRODUTOS_MERCADO_LIVRE =
'mercadolivre-produtos.html';

// ============================================================
// SUPABASE
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
// BASE64 URL
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
// CODE VERIFIER
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
// CODE CHALLENGE
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
// PKCE
// ============================================================

function salvarCodeVerifier(
codeVerifier
) {


try {

    sessionStorage.setItem(
        CHAVE_PKCE_MERCADO_LIVRE,
        codeVerifier
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
// STATE
// ============================================================

function gerarStateOAuth() {


const stateArray =
    new Uint8Array(32);

crypto.getRandomValues(
    stateArray
);

return base64UrlEncode(
    stateArray
);


}

// ============================================================
// ATUALIZAR STATUS
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

const botaoGerenciar =
    document.getElementById(
        'btn-gerenciar-produtos-mercado-livre'
    );


// STATUS

if (status) {

    if (conectado) {

        status.textContent =
            'Conectado';

        status.classList.remove(
            'status-desconectado'
        );

        status.classList.add(
            'status-conectado'
        );

    } else {

        status.textContent =
            'Desconectado';

        status.classList.remove(
            'status-conectado'
        );

        status.classList.add(
            'status-desconectado'
        );

    }

}


// BOTÃO CONECTAR

if (botaoConectar) {

    if (conectado) {

        botaoConectar.textContent =
            '✓ Mercado Livre conectado';

        botaoConectar.classList.remove(
            'btn-conectar'
        );

        botaoConectar.classList.add(
            'btn-conectado'
        );

        botaoConectar.disabled =
            true;

    } else {

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

}


// BOTÃO IMPORTAR

if (botaoImportar) {

    if (conectado) {

        botaoImportar.style.display =
            'inline-flex';

        botaoImportar.disabled =
            false;

    } else {

        botaoImportar.style.display =
            'none';

    }

}


// BOTÃO GERENCIAR

if (botaoGerenciar) {

    if (conectado) {

        botaoGerenciar.style.display =
            'inline-flex';

        botaoGerenciar.disabled =
            false;

    } else {

        botaoGerenciar.style.display =
            'none';

    }

}


}

// ============================================================
// RETORNO OAUTH
// ============================================================

function verificarRetornoMercadoLivre() {


const url =
    new URL(
        window.location.href
    );

const conectado =
    url.searchParams.get(
        'mercadolivre'
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

    setTimeout(
        limparParametrosOAuth,
        500
    );

    return true;
}

return false;


}

// ============================================================
// LIMPAR OAUTH
// ============================================================

function limparParametrosOAuth() {


try {

    const url =
        new URL(
            window.location.href
        );

    url.searchParams.delete(
        'mercadolivre'
    );

    url.searchParams.delete(
        'code'
    );

    url.searchParams.delete(
        'state'
    );

    url.searchParams.delete(
        'error'
    );

    url.searchParams.delete(
        'error_description'
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
        'Erro ao limpar parâmetros OAuth:',
        erro
    );
}


}

// ============================================================
// CONECTAR MERCADO LIVRE
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

    if (botao) {

        botao.disabled =
            true;

        botao.textContent =
            'Preparando conexão...';

    }

    const codeVerifier =
        gerarCodeVerifier();

    const codeChallenge =
        await gerarCodeChallenge(
            codeVerifier
        );

    if (
        !salvarCodeVerifier(
            codeVerifier
        )
    ) {

        throw new Error(
            'Não foi possível salvar o código PKCE.'
        );

    }

    const state =
        gerarStateOAuth();

    sessionStorage.setItem(
        CHAVE_STATE_MERCADO_LIVRE,
        state
    );

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

    window.location.href =
        MERCADO_LIVRE_AUTH_URL +
        '?' +
        parametros.toString();

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
// CONSULTAR CONEXÃO
// ============================================================

async function verificarConexaoMercadoLivre() {


console.log(
    'Verificando conexão do Mercado Livre no Supabase...'
);

const supabase =
    obterSupabaseIntegracoes();

if (!supabase) {

    atualizarStatusMercadoLivre(
        false
    );

    return false;
}

try {

    const resultado =
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

    console.log(
        'Resultado da consulta integracoes:',
        resultado.data
    );

    if (resultado.error) {

        console.error(
            'Erro ao consultar integracoes:',
            resultado.error
        );

        atualizarStatusMercadoLivre(
            false
        );

        return false;
    }

    const conectado =
        Array.isArray(resultado.data) &&
        resultado.data.length > 0;

    if (conectado) {

        console.log(
            'Conexão Mercado Livre encontrada.'
        );

    } else {

        console.log(
            'Nenhuma conexão Mercado Livre encontrada.'
        );

    }

    atualizarStatusMercadoLivre(
        conectado
    );

    return conectado;

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
// IMPORTAR PRODUTOS
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
        'Iniciando importação de produtos Mercado Livre...'
    );

    console.log(
        '============================================================'
    );


    if (botao) {

        botao.disabled =
            true;

        botao.textContent =
            'Importando produtos...';

    }


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


    const textoResposta =
        await resposta.text();

    let resultado =
        null;

    try {

        resultado =
            textoResposta
                ? JSON.parse(
                    textoResposta
                )
                : null;

    } catch (erro) {

        console.error(
            'Resposta não é JSON válido:',
            textoResposta
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
            'A importação dos produtos falhou.'
        );

    }


    if (
        !resultado ||
        resultado.sucesso !== true
    ) {

        throw new Error(
            resultado?.erro ||
            resultado?.mensagem ||
            'A Edge Function não confirmou a importação.'
        );

    }


    const totalEncontrados =
        Number(
            resultado.total_encontrados || 0
        );

    const criados =
        Number(
            resultado.criados || 0
        );

    const atualizados =
        Number(
            resultado.atualizados || 0
        );

    const erros =
        Number(
            resultado.erros || 0
        );


    let mensagem =
        'Importação concluída com sucesso!\n\n';

    mensagem +=
        'Produtos encontrados: ' +
        totalEncontrados +
        '\n';

    mensagem +=
        'Produtos criados: ' +
        criados +
        '\n';

    mensagem +=
        'Produtos atualizados: ' +
        atualizados +
        '\n';

    mensagem +=
        'Erros: ' +
        erros;


    if (
        Array.isArray(
            resultado.detalhes_erros
        ) &&
        resultado.detalhes_erros.length > 0
    ) {

        mensagem +=
            '\n\nAlguns produtos apresentaram erros.';

        console.warn(
            'Detalhes dos erros:',
            resultado.detalhes_erros
        );

    }


    alert(
        mensagem
    );


    atualizarStatusMercadoLivre(
        true
    );


} catch (erro) {

    console.error(
        'Erro ao importar produtos:',
        erro
    );

    alert(
        'Não foi possível importar os produtos do Mercado Livre.\n\n' +
        (
            erro?.message ||
            'Erro desconhecido.'
        )
    );

} finally {

    if (botao) {

        botao.disabled =
            false;

        botao.textContent =
            '📥 Importar produtos';

    }

}


}

// ============================================================
// GERENCIAR PRODUTOS
// ============================================================

function abrirProdutosMercadoLivre() {


console.log(
    'Abrindo gerenciamento de produtos do Mercado Livre...'
);

window.location.href =
    PAGINA_PRODUTOS_MERCADO_LIVRE;


}

// ============================================================
// CONFIGURAR BOTÃO CONECTAR
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

if (
    botao.dataset.configurado ===
    'true'
) {
    return;
}

botao.dataset.configurado =
    'true';

botao.addEventListener(
    'click',
    conectarMercadoLivre
);


}

// ============================================================
// CONFIGURAR BOTÃO IMPORTAR
// ============================================================

function configurarBotaoImportarProdutos() {


const botao =
    document.getElementById(
        'btn-importar-mercado-livre'
    );

if (!botao) {

    console.warn(
        'Botão importar produtos não encontrado no HTML.'
    );

    return;
}

if (
    botao.dataset.configurado ===
    'true'
) {
    return;
}

botao.dataset.configurado =
    'true';

botao.addEventListener(
    'click',
    importarProdutosMercadoLivre
);


}

// ============================================================
// CONFIGURAR BOTÃO GERENCIAR
// ============================================================

function configurarBotaoGerenciarProdutosMercadoLivre() {


const botao =
    document.getElementById(
        'btn-gerenciar-produtos-mercado-livre'
    );

if (!botao) {

    console.warn(
        'Botão Gerenciar produtos do Mercado Livre não encontrado.'
    );

    return;
}

if (
    botao.dataset.configurado ===
    'true'
) {
    return;
}

botao.dataset.configurado =
    'true';

botao.addEventListener(
    'click',
    abrirProdutosMercadoLivre
);


}

// ============================================================
// PROCESSAR RETORNO DA PÁGINA
// ============================================================

function processarRetornoPagina() {


const url =
    new URL(
        window.location.href
    );

const mercadoLivre =
    url.searchParams.get(
        'mercadolivre'
    );

if (
    mercadoLivre ===
    'conectado'
) {

    console.log(
        'Mercado Livre retornou como conectado.'
    );

    atualizarStatusMercadoLivre(
        true
    );

    setTimeout(
        async function() {

            await verificarConexaoMercadoLivre();

        },
        300
    );
}


}

// ============================================================
// INICIALIZAÇÃO
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


    atualizarStatusMercadoLivre(
        false
    );


    configurarBotaoMercadoLivre();

    configurarBotaoImportarProdutos();

    configurarBotaoGerenciarProdutosMercadoLivre();


    verificarRetornoMercadoLivre();

    processarRetornoPagina();


    await verificarConexaoMercadoLivre();


    console.log(
        'Inicialização concluída.'
    );

}


);

// ============================================================
// FUNÇÕES GLOBAIS
// ============================================================

window.conectarMercadoLivre =
conectarMercadoLivre;

window.gerarCodeVerifier =
gerarCodeVerifier;

window.gerarCodeChallenge =
gerarCodeChallenge;

window.verificarConexaoMercadoLivre =
verificarConexaoMercadoLivre;

window.importarProdutosMercadoLivre =
importarProdutosMercadoLivre;

window.abrirProdutosMercadoLivre =
abrirProdutosMercadoLivre;
