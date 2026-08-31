// ============================================================
// ZORAVISION - PAINEL ADMINISTRATIVO
// ============================================================
// Arquivo: Admin/Painel-admin.js
//
// Responsabilidades:
// - Verificar acesso do administrador
// - Verificar sessão atual do Supabase
// - Proteger as páginas administrativas
// - Botão Sair apenas retorna para a página inicial
// ============================================================

// ============================================================
// 1. CONFIGURAÇÃO DO ADMINISTRADOR
// ============================================================

const EMAIL_ADMIN = 'rafaelmelo116@gmail.com';

// ============================================================
// 2. OBTER CLIENTE SUPABASE
// ============================================================

function obterSupabaseAdmin() {


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
// 3. VERIFICAR ACESSO ADMINISTRATIVO
// ============================================================

async function verificarAcessoAdmin() {


const supabase = obterSupabaseAdmin();

if (!supabase) {

    console.error(
        'Supabase não está disponível.'
    );

    window.location.href = '../index.html';

    return false;
}

try {

    console.log(
        'Verificando sessão do administrador...'
    );

    const resultado =
        await supabase.auth.getUser();

    const usuario =
        resultado?.data?.user;

    const erro =
        resultado?.error;


    if (erro) {

        console.error(
            'Erro ao verificar usuário:',
            erro
        );

        window.location.href =
            '../index.html';

        return false;
    }


    if (!usuario) {

        console.warn(
            'Nenhum usuário autenticado.'
        );

        alert(
            'Faça login para acessar o painel administrativo.'
        );

        window.location.href =
            '../index.html';

        return false;
    }


    const emailUsuario =
        String(
            usuario.email || ''
        )
        .trim()
        .toLowerCase();


    const emailAdministrador =
        String(
            EMAIL_ADMIN
        )
        .trim()
        .toLowerCase();


    console.log(
        'Usuário conectado:',
        emailUsuario
    );

    console.log(
        'E-mail administrativo:',
        emailAdministrador
    );

    console.log(
        'Comparação dos e-mails:',
        emailUsuario === emailAdministrador
    );


    // ====================================================
    // VERIFICAR ADMINISTRADOR
    // ====================================================

    if (
        emailUsuario !==
        emailAdministrador
    ) {

        console.warn(
            'Usuário sem permissão administrativa:',
            emailUsuario
        );

        alert(
            'Você não possui permissão para acessar o painel administrativo.'
        );

        window.location.href =
            '../index.html';

        return false;
    }


    // ====================================================
    // ACESSO AUTORIZADO
    // ====================================================

    console.log(
        'Acesso administrativo autorizado.'
    );


    atualizarInformacoesAdmin(
        usuario
    );


    return true;


} catch (erro) {

    console.error(
        'Erro inesperado ao verificar acesso:',
        erro
    );

    window.location.href =
        '../index.html';

    return false;
}


}

// ============================================================
// 4. ATUALIZAR INFORMAÇÕES DO ADMINISTRADOR
// ============================================================

function atualizarInformacoesAdmin(
usuario
) {


if (!usuario) {
    return;
}


const elementoEmail =
    document.getElementById(
        'admin-email'
    );


if (elementoEmail) {

    elementoEmail.textContent =
        usuario.email || '';
}


const elementoNome =
    document.getElementById(
        'admin-nome'
    );


if (elementoNome) {

    const metadata =
        usuario.user_metadata || {};


    const nome =
        metadata.nome ||
        metadata.name ||
        'Administrador';


    elementoNome.textContent =
        nome;
}


}

// ============================================================
// 5. BOTÃO SAIR
// ============================================================
// IMPORTANTE:
// O botão NÃO faz signOut.
// Ele apenas volta para a página inicial.
// ============================================================

function sairPainelAdmin() {


console.log(
    'Saindo do painel administrativo e retornando para a página inicial.'
);

window.location.href =
    '../index.html';


}

// ============================================================
// 6. CONFIGURAR BOTÃO SAIR
// ============================================================

function configurarBotaoSair() {


const botaoSair =
    document.getElementById(
        'btn-sair-admin'
    );


if (!botaoSair) {

    console.log(
        'Botão de sair não encontrado nesta página.'
    );

    return;
}


// Evita adicionar o evento mais de uma vez

if (
    botaoSair.dataset.adminConfigurado ===
    'true'
) {
    return;
}


botaoSair.dataset.adminConfigurado =
    'true';


botaoSair.addEventListener(
    'click',
    function(event) {

        event.preventDefault();

        sairPainelAdmin();

    }
);


}

// ============================================================
// 7. PROTEGER LINKS ADMINISTRATIVOS
// ============================================================

function configurarLinksAdmin() {


const links =
    document.querySelectorAll(
        'a[href]'
    );


links.forEach(
    link => {

        const destino =
            link.getAttribute(
                'href'
            );


        if (!destino) {
            return;
        }


        if (
            destino.startsWith('http://') ||
            destino.startsWith('https://') ||
            destino.startsWith('mailto:') ||
            destino.startsWith('#')
        ) {

            return;
        }

    }
);


}

// ============================================================
// 8. MONITORAR AUTENTICAÇÃO
// ============================================================

function monitorarAutenticacao() {


const supabase =
    obterSupabaseAdmin();


if (!supabase) {
    return;
}


supabase.auth.onAuthStateChange(
    function(
        evento,
        sessao
    ) {

        console.log(
            'Evento de autenticação:',
            evento
        );


        if (
            evento ===
            'SIGNED_OUT'
        ) {

            console.log(
                'Sessão encerrada. Retornando para a página inicial.'
            );

            window.location.href =
                '../index.html';

            return;
        }


        if (
            evento ===
            'TOKEN_REFRESHED'
        ) {

            console.log(
                'Sessão administrativa atualizada.'
            );

            return;
        }


        if (
            evento ===
            'USER_UPDATED'
        ) {

            console.log(
                'Usuário administrativo atualizado.'
            );

            return;
        }

    }
);


}

// ============================================================
// 9. MARCAR PAINEL COMO CARREGADO
// ============================================================

function marcarPainelCarregado() {


if (!document.body) {
    return;
}


document.body.classList.add(
    'admin-carregado'
);


}

// ============================================================
// 10. INICIALIZAÇÃO
// ============================================================

document.addEventListener(
'DOMContentLoaded',
async function() {


    console.log(
        '============================================================'
    );

    console.log(
        'ZoraVision - Painel Administrativo'
    );

    console.log(
        'Inicializando painel...'
    );

    console.log(
        '============================================================'
    );


    const autorizado =
        await verificarAcessoAdmin();


    if (!autorizado) {
        return;
    }


    configurarBotaoSair();

    configurarLinksAdmin();

    monitorarAutenticacao();

    marcarPainelCarregado();


    console.log(
        'Painel administrativo carregado com sucesso.'
    );

}


);

// ============================================================
// 11. FUNÇÕES DISPONÍVEIS GLOBALMENTE
// ============================================================

window.obterSupabaseAdmin =
obterSupabaseAdmin;

window.verificarAcessoAdmin =
verificarAcessoAdmin;

window.sairPainelAdmin =
sairPainelAdmin;

window.atualizarInformacoesAdmin =
atualizarInformacoesAdmin;
