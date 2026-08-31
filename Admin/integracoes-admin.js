/* ============================================================
ZORAVISION - INTEGRAÇÕES ADMINISTRATIVAS
Arquivo: Admin/integracoes-admin.js

Responsabilidades:

* Gerenciar integrações do painel administrativo
* Iniciar OAuth do Mercado Livre
* Utilizar PKCE
* Gerar code_verifier
* Gerar code_challenge
* Redirecionar para autorização do Mercado Livre
  ============================================================ */

/* ============================================================

1. CONFIGURAÇÃO DO MERCADO LIVRE
   ============================================================ */

const MERCADO_LIVRE_CLIENT_ID =
'8816875791365432';

const MERCADO_LIVRE_REDIRECT_URI =
'https://ratajxnxkjoiuknamacn.supabase.co/functions/v1/mercadolivre-oauth';

const MERCADO_LIVRE_AUTH_URL =
'https://auth.mercadolivre.com.br/authorization';

/* ============================================================
2. GERAR STRING ALEATÓRIA SEGURA
============================================================ */

function gerarStringAleatoriaMercadoLivre(tamanho = 64) {


const caracteres =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';

const valores =
    new Uint8Array(tamanho);

crypto.getRandomValues(valores);

let resultado = '';

for (let i = 0; i < valores.length; i++) {

    resultado +=
        caracteres[
            valores[i] % caracteres.length
        ];

}

return resultado;


}

/* ============================================================
3. BASE64 URL SAFE
============================================================ */

function base64UrlEncodeMercadoLivre(buffer) {


const bytes =
    new Uint8Array(buffer);

let stringBinaria = '';

bytes.forEach(
    byte => {

        stringBinaria +=
            String.fromCharCode(byte);

    }
);

return btoa(stringBinaria)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');


}

/* ============================================================
4. GERAR CODE CHALLENGE
============================================================ */

async function gerarCodeChallengeMercadoLivre(
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

return base64UrlEncodeMercadoLivre(
    hash
);


}

/* ============================================================
5. INICIAR OAUTH MERCADO LIVRE
============================================================ */

async function conectarMercadoLivre() {


console.log(
    '============================================================'
);

console.log(
    'ZoraVision - Iniciando conexão com Mercado Livre'
);

console.log(
    '============================================================'
);


try {

    if (
        !window.crypto ||
        !window.crypto.subtle
    ) {

        throw new Error(
            'Seu navegador não suporta os recursos de segurança necessários para o OAuth PKCE.'
        );

    }


    /* ====================================================
    GERAR CODE VERIFIER
    ==================================================== */

    const codeVerifier =
        gerarStringAleatoriaMercadoLivre(
            64
        );


    console.log(
        'Code verifier gerado.'
    );


    /* ====================================================
    GERAR CODE CHALLENGE
    ==================================================== */

    const codeChallenge =
        await gerarCodeChallengeMercadoLivre(
            codeVerifier
        );


    console.log(
        'Code challenge gerado.'
    );


    /* ====================================================
    SALVAR CODE VERIFIER TEMPORARIAMENTE
    ==================================================== */

    sessionStorage.setItem(
        'mercado_livre_code_verifier',
        codeVerifier
    );


    /* ====================================================
    SALVAR MOMENTO DA AUTORIZAÇÃO
    ==================================================== */

    sessionStorage.setItem(
        'mercado_livre_oauth_inicio',
        String(
            Date.now()
        )
    );


    /* ====================================================
    MONTAR URL DE AUTORIZAÇÃO
    ==================================================== */

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


    const urlAutorizacao =
        MERCADO_LIVRE_AUTH_URL +
        '?' +
        parametros.toString();


    console.log(
        'Redirecionando para autorização do Mercado Livre...'
    );


    console.log(
        'Redirect URI:',
        MERCADO_LIVRE_REDIRECT_URI
    );


    /* ====================================================
    REDIRECIONAR
    ==================================================== */

    window.location.href =
        urlAutorizacao;


} catch (erro) {

    console.error(
        'Erro ao iniciar OAuth do Mercado Livre:',
        erro
    );


    alert(
        'Não foi possível iniciar a conexão com o Mercado Livre.\n\n' +
        (
            erro?.message ||
            'Erro desconhecido.'
        )
    );

}


}

/* ============================================================
6. CONFIGURAR BOTÃO MERCADO LIVRE
============================================================ */

function configurarBotaoMercadoLivre() {


const botao =
    document.getElementById(
        'btn-conectar-mercado-livre'
    );


if (!botao) {

    console.warn(
        'Botão btn-conectar-mercado-livre não encontrado.'
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
    async function(event) {

        event.preventDefault();


        if (
            botao.disabled
        ) {

            return;

        }


        botao.disabled =
            true;


        const textoOriginal =
            botao.textContent;


        botao.textContent =
            'Conectando...';


        try {

            await conectarMercadoLivre();

        } catch (erro) {

            console.error(
                'Erro ao conectar Mercado Livre:',
                erro
            );

            botao.disabled =
                false;

            botao.textContent =
                textoOriginal ||
                'Conectar Mercado Livre';

        }

    }
);


}

/* ============================================================
7. INICIALIZAÇÃO
============================================================ */

document.addEventListener(
'DOMContentLoaded',
function() {


    console.log(
        '============================================================'
    );

    console.log(
        'ZoraVision - Integrações'
    );

    console.log(
        'Inicializando integrações administrativas...'
    );

    console.log(
        '============================================================'
    );


    configurarBotaoMercadoLivre();


    console.log(
        'Integrações administrativas inicializadas.'
    );

}


);

/* ============================================================
8. FUNÇÕES GLOBAIS
============================================================ */

window.conectarMercadoLivre =
conectarMercadoLivre;

window.gerarCodeChallengeMercadoLivre =
gerarCodeChallengeMercadoLivre;
