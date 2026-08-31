// ============================================================
// ZORAVISION - CALLBACK MERCADO LIVRE
// Arquivo: Admin/mercadolivre-callback.js
// ============================================================
//
// Responsabilidades:
// - Receber o retorno OAuth do Mercado Livre
// - Ler o authorization code
// - Recuperar o code_verifier do PKCE
// - Validar o state
// - Enviar code + code_verifier para a Edge Function
// - Exibir sucesso ou erro
// - Retornar para o painel de integrações
// ============================================================

// ============================================================
// 1. CONFIGURAÇÕES
// ============================================================

const MERCADO_LIVRE_OAUTH_FUNCTION =
'https://ratajxnxkjoiuknamacn.supabase.co/functions/v1/mercadolivre-oauth';

const CHAVE_PKCE_MERCADO_LIVRE =
'zoravision_ml_code_verifier';

const CHAVE_STATE_MERCADO_LIVRE =
'zoravision_ml_oauth_state';

const PAGINA_INTEGRACOES =
'integracoes-admin.html';

// ============================================================
// 2. ELEMENTOS
// ============================================================

const estadoCarregando =
document.getElementById(
'estado-carregando'
);

const estadoSucesso =
document.getElementById(
'estado-sucesso'
);

const estadoErro =
document.getElementById(
'estado-erro'
);

const mensagemErro =
document.getElementById(
'mensagem-erro'
);

const botaoVoltar =
document.getElementById(
'btn-voltar'
);

// ============================================================
// 3. MOSTRAR CARREGANDO
// ============================================================

function mostrarCarregando() {


if (estadoCarregando) {

    estadoCarregando.style.display =
        'block';

}

if (estadoSucesso) {

    estadoSucesso.style.display =
        'none';

}

if (estadoErro) {

    estadoErro.style.display =
        'none';

}

if (botaoVoltar) {

    botaoVoltar.style.display =
        'none';

}


}

// ============================================================
// 4. MOSTRAR SUCESSO
// ============================================================

function mostrarSucesso() {


if (estadoCarregando) {

    estadoCarregando.style.display =
        'none';

}

if (estadoErro) {

    estadoErro.style.display =
        'none';

}

if (estadoSucesso) {

    estadoSucesso.style.display =
        'block';

}

if (botaoVoltar) {

    botaoVoltar.style.display =
        'inline-flex';

}


}

// ============================================================
// 5. MOSTRAR ERRO
// ============================================================

function mostrarErro(
mensagem
) {


if (estadoCarregando) {

    estadoCarregando.style.display =
        'none';

}

if (estadoSucesso) {

    estadoSucesso.style.display =
        'none';

}

if (estadoErro) {

    estadoErro.style.display =
        'block';

}

if (mensagemErro) {

    mensagemErro.textContent =
        mensagem ||
        'Ocorreu um erro ao concluir a conexão com o Mercado Livre.';

}

if (botaoVoltar) {

    botaoVoltar.style.display =
        'inline-flex';

}


}

// ============================================================
// 6. LIMPAR DADOS PKCE
// ============================================================

function limparDadosPKCE() {


try {

    sessionStorage.removeItem(
        CHAVE_PKCE_MERCADO_LIVRE
    );

    sessionStorage.removeItem(
        CHAVE_STATE_MERCADO_LIVRE
    );

} catch (erro) {

    console.warn(
        'Não foi possível limpar os dados PKCE:',
        erro
    );

}


}

// ============================================================
// 7. LIMPAR CÓDIGO DA URL
// ============================================================

function limparURL() {


try {

    const url =
        new URL(
            window.location.href
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
        url.pathname
    );

} catch (erro) {

    console.warn(
        'Não foi possível limpar a URL:',
        erro
    );

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
        'Erro ao recuperar code_verifier:',
        erro
    );

    return null;

}


}

// ============================================================
// 9. RECUPERAR STATE SALVO
// ============================================================

function obterStateSalvo() {


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
// 10. OBTER PARÂMETROS DA URL
// ============================================================

function obterParametrosOAuth() {


const parametros =
    new URLSearchParams(
        window.location.search
    );

return {

    code:
        parametros.get(
            'code'
        ),

    state:
        parametros.get(
            'state'
        ),

    error:
        parametros.get(
            'error'
        ),

    errorDescription:
        parametros.get(
            'error_description'
        )

};


}

// ============================================================
// 11. VALIDAR STATE
// ============================================================

function validarState(
stateRecebido
) {


const stateSalvo =
    obterStateSalvo();

if (!stateRecebido) {

    console.error(
        'State não recebido pelo Mercado Livre.'
    );

    return false;

}

if (!stateSalvo) {

    console.error(
        'State salvo não encontrado.'
    );

    return false;

}

if (
    stateRecebido !==
    stateSalvo
) {

    console.error(
        'State recebido é diferente do state salvo.'
    );

    return false;

}

return true;


}

// ============================================================
// 12. ENVIAR DADOS PARA EDGE FUNCTION
// ============================================================

async function enviarParaEdgeFunction(
code,
codeVerifier,
state
) {


console.log(
    'Enviando autorização para Edge Function...'
);

const resposta =
    await fetch(
        MERCADO_LIVRE_OAUTH_FUNCTION,
        {

            method: 'POST',

            headers: {

                'Content-Type':
                    'application/json'

            },

            body: JSON.stringify({

                code:
                    code,

                code_verifier:
                    codeVerifier,

                state:
                    state

            })

        }
    );


const texto =
    await resposta.text();


let dados;

try {

    dados =
        JSON.parse(
            texto
        );

} catch {

    dados = {

        sucesso:
            resposta.ok,

        mensagem:
            texto

    };

}


console.log(
    'Resposta da Edge Function:',
    dados
);


if (!resposta.ok) {

    throw new Error(

        dados?.erro ||

        dados?.mensagem ||

        `Erro HTTP ${resposta.status}`

    );

}


if (
    dados &&
    dados.sucesso === false
) {

    throw new Error(

        dados.erro ||

        dados.mensagem ||

        'A Edge Function recusou a autorização.'

    );

}


return dados;


}

// ============================================================
// 13. PROCESSAR OAUTH
// ============================================================

async function processarOAuth() {


mostrarCarregando();


try {

    console.log(
        '============================================================'
    );

    console.log(
        'ZoraVision - Callback Mercado Livre'
    );

    console.log(
        'Processando OAuth 2.0 + PKCE'
    );

    console.log(
        '============================================================'
    );


    // ----------------------------------------------------
    // PARÂMETROS
    // ----------------------------------------------------

    const parametros =
        obterParametrosOAuth();


    console.log(
        'Authorization code:',
        parametros.code
            ? 'RECEBIDO'
            : 'NÃO RECEBIDO'
    );


    // ----------------------------------------------------
    // VERIFICAR ERRO
    // ----------------------------------------------------

    if (parametros.error) {

        console.error(
            'Mercado Livre retornou erro:',
            parametros.error,
            parametros.errorDescription
        );

        throw new Error(

            parametros.errorDescription ||

            parametros.error ||

            'O Mercado Livre recusou a autorização.'

        );

    }


    // ----------------------------------------------------
    // VERIFICAR CODE
    // ----------------------------------------------------

    if (!parametros.code) {

        throw new Error(
            'Nenhum código de autorização foi recebido do Mercado Livre.'
        );

    }


    // ----------------------------------------------------
    // VALIDAR STATE
    // ----------------------------------------------------

    if (
        !validarState(
            parametros.state
        )
    ) {

        throw new Error(
            'Falha na validação de segurança OAuth (state inválido).'
        );

    }

    console.log(
        'State validado com sucesso.'
    );


    // ----------------------------------------------------
    // RECUPERAR VERIFIER
    // ----------------------------------------------------

    const codeVerifier =
        obterCodeVerifier();


    if (!codeVerifier) {

        throw new Error(

            'O código de segurança PKCE não foi encontrado. ' +
            'Volte para Integrações e tente conectar novamente.'

        );

    }

    console.log(
        'Code verifier recuperado com sucesso.'
    );


    // ----------------------------------------------------
    // ENVIAR PARA BACKEND
    // ----------------------------------------------------

    const resultado =
        await enviarParaEdgeFunction(

            parametros.code,

            codeVerifier,

            parametros.state

        );


    console.log(
        'OAuth processado com sucesso:',
        resultado
    );


    // ----------------------------------------------------
    // LIMPAR PKCE
    // ----------------------------------------------------

    limparDadosPKCE();

    limparURL();


    // ----------------------------------------------------
    // SUCESSO
    // ----------------------------------------------------

    mostrarSucesso();


    // ----------------------------------------------------
    // RETORNO AUTOMÁTICO
    // ----------------------------------------------------

    setTimeout(
        function() {

            window.location.href =
                PAGINA_INTEGRACOES;

        },
        2500
    );


} catch (erro) {

    console.error(
        'Erro ao processar OAuth:',
        erro
    );


    mostrarErro(

        erro?.message ||

        'Não foi possível concluir a conexão com o Mercado Livre.'

    );

}


}

// ============================================================
// 14. BOTÃO VOLTAR
// ============================================================

function configurarBotaoVoltar() {


if (!botaoVoltar) {
    return;
}

botaoVoltar.addEventListener(
    'click',
    function() {

        window.location.href =
            PAGINA_INTEGRACOES;

    }
);


}

// ============================================================
// 15. INICIALIZAÇÃO
// ============================================================

document.addEventListener(
'DOMContentLoaded',
function() {


    configurarBotaoVoltar();

    processarOAuth();

}


);

// ============================================================
// FIM
// ============================================================
