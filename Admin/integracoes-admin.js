// ============================================================
// ZORAVISION - ADMINISTRAÇÃO DE INTEGRAÇÕES
// ============================================================
// Arquivo:
// Admin/integracoes-admin.js
//
// Responsabilidades:
// - Controlar página de integrações
// - Conectar Mercado Livre
// - OAuth 2.0 com PKCE
// - Gerar code_verifier
// - Gerar code_challenge
// - Verificar conexão na tabela integracoes
// - Mostrar botão Importar produtos automaticamente
// - Importar produtos do Mercado Livre
// - Evitar produtos duplicados
// - Mostrar resultado da importação
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

const EDGE_FUNCTION_OAUTH =
'https://ratajxnxkjoiuknamacn.supabase.co/functions/v1/mercadolivre-oauth';

const EDGE_FUNCTION_IMPORTAR =
'https://ratajxnxkjoiuknamacn.supabase.co/functions/v1/mercadolivre-importar-produtos';

const CHAVE_PKCE_MERCADO_LIVRE =
'zoravision_ml_code_verifier';

const CHAVE_STATE_MERCADO_LIVRE =
'zoravision_ml_oauth_state';

const PAGINA_INTEGRACOES =
'https://rafaelmfernandes.github.io/Site-zora-vision/Admin/admin-integracoes.html';

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
// 9. GERAR STATE
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
// 10. ATUALIZAR STATUS MERCADO LIVRE
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

const botaoImportar =
    document.getElementById(
        'btn-importar-produtos'
    );

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

if (botao) {

    if (conectado) {

        botao.textContent =
            'Mercado Livre conectado';

        botao.classList.remove(
            'btn-conectar'
        );

        botao.classList.add(
            'btn-conectado'
        );

    } else {

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

if (botaoImportar) {

    if (conectado) {

        botaoImportar.style.display =
            '';

        botaoImportar.disabled =
            false;

    } else {

        botaoImportar.style.display =
            'none';

    }

}


}

// ============================================================
// 11. VERIFICAR RETORNO OAUTH
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
// 12. LIMPAR PARÂMETROS OAUTH
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
// 13. CONECTAR MERCADO LIVRE
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
        'Iniciando conexão Mercado Livre...'
    );

    console.log(
        'OAuth 2.0 + PKCE'
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

    const codeVerifier =
        gerarCodeVerifier();

    const codeChallenge =
        await gerarCodeChallenge(
            codeVerifier
        );

    const verifierSalvo =
        salvarCodeVerifier(
            codeVerifier
        );

    if (!verifierSalvo) {

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

    const urlAutorizacao =
        MERCADO_LIVRE_AUTH_URL +
        '?' +
        parametros.toString();

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
// 14. CONSULTAR CONEXÃO NO SUPABASE
// ============================================================

async function verificarConexaoMercadoLivre() {


console.log(
    'Verificando conexão do Mercado Livre no Supabase...'
);

const supabase =
    obterSupabaseIntegracoes();

if (!supabase) {

    console.error(
        'Supabase não disponível.'
    );

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

    console.log(
        'Resultado da consulta integracoes:',
        resultado.data
    );

    if (
        resultado.data &&
        resultado.data.length > 0
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
// 15. IMPORTAR PRODUTOS
// ============================================================

async function importarProdutosMercadoLivre() {


const botao =
    document.getElementById(
        'btn-importar-produtos'
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

    let resultado =
        null;

    const textoResposta =
        await resposta.text();

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

        resultado =
            null;

    }

    console.log(
        'Status da importação:',
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
            resultado.total_encontrados ||
            0
        );

    const criados =
        Number(
            resultado.criados ||
            0
        );

    const atualizados =
        Number(
            resultado.atualizados ||
            0
        );

    const erros =
        Number(
            resultado.erros ||
            0
        );

    console.log(
        'Total encontrados:',
        totalEncontrados
    );

    console.log(
        'Criados:',
        criados
    );

    console.log(
        'Atualizados:',
        atualizados
    );

    console.log(
        'Erros:',
        erros
    );


    // --------------------------------------------------------
    // MOSTRAR RESULTADO
    // --------------------------------------------------------

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


    // --------------------------------------------------------
    // ATUALIZAR STATUS
    // --------------------------------------------------------

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
            'Importar produtos';

    }

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

function configurarBotaoImportarProdutos() {


const botao =
    document.getElementById(
        'btn-importar-produtos'
    );

if (!botao) {

    console.warn(
        'Botão importar produtos não encontrado no HTML.'
    );

    return;

}

botao.addEventListener(
    'click',
    importarProdutosMercadoLivre
);


}

// ============================================================
// 18. PROCESSAR RETORNO DA PÁGINA
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
        '============================================================'
    );


    // --------------------------------------------------------
    // ESTADO INICIAL
    // --------------------------------------------------------

    atualizarStatusMercadoLivre(
        false
    );


    // --------------------------------------------------------
    // CONFIGURAR BOTÕES
    // --------------------------------------------------------

    configurarBotaoMercadoLivre();

    configurarBotaoImportarProdutos();


    // --------------------------------------------------------
    // VERIFICAR RETORNO OAUTH
    // --------------------------------------------------------

    verificarRetornoMercadoLivre();

    processarRetornoPagina();


    // --------------------------------------------------------
    // CONSULTAR BANCO
    // --------------------------------------------------------

    await verificarConexaoMercadoLivre();


    console.log(
        'Inicialização concluída.'
    );

}


);
// ============================================================
// BOTÃO - GERENCIAR PRODUTOS MERCADO LIVRE
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

    // Evita adicionar o evento mais de uma vez
    if (botao.dataset.configurado === 'true') {
        return;
    }

    botao.dataset.configurado = 'true';

    botao.addEventListener(
        'click',
        function() {

            window.location.href =
                'mercadolivre-produtos.html';

        }
    );

}

// ============================================================
// ABRIR GERENCIAMENTO DE PRODUTOS DO MERCADO LIVRE
// ============================================================

function abrirProdutosMercadoLivre() {

    console.log(
        'Abrindo gerenciamento de produtos do Mercado Livre...'
    );

    window.location.href =
        'https://rafaelmfernandes.github.io/Site-zora-vision/Admin/mercadolivre-produtos.html';

}

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

window.importarProdutosMercadoLivre =
importarProdutosMercadoLivre;
