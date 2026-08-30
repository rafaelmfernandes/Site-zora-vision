// ============================================================
// ZORAVISION - PAINEL ADMINISTRATIVO
// ============================================================
// Arquivo: Admin/Painel-admin.js
//
// Responsabilidades:
// - Verificar acesso do administrador
// - Verificar sessão atual do Supabase
// - Controlar saída do administrador
// - Proteger as páginas administrativas
// - Inicializar o painel
// ============================================================


// ============================================================
// 1. CONFIGURAÇÃO DO ADMINISTRADOR
// ============================================================

const EMAIL_ADMIN =
    'rafaelmelo116@gmail.com';


// ============================================================
// 2. OBTER CLIENTE SUPABASE
// ============================================================

function obterSupabaseAdmin() {

    if (
        window.supabaseClient
    ) {

        return window.supabaseClient;

    }


    if (
        window._supabase
    ) {

        return window._supabase;

    }


    if (
        typeof window.obterSupabase === 'function'
    ) {

        return window.obterSupabase();

    }


    console.error(
        'Cliente Supabase não encontrado.'
    );

    return null;

}


// ============================================================
// 3. VERIFICAR ACESSO ADMINISTRATIVO
// ============================================================

async function verificarAcessoAdmin() {

    const supabase =
        obterSupabaseAdmin();


    if (!supabase) {

        console.error(
            'Supabase não está disponível.'
        );

        alert(
            'Não foi possível conectar ao sistema.'
        );

        window.location.href =
            '../index.html';

        return false;

    }


    try {

        console.log(
            'Verificando sessão do administrador...'
        );


        const {
            data,
            error
        } =
            await supabase.auth.getUser();


        if (error) {

            console.error(
                'Erro ao verificar usuário:',
                error
            );

            alert(
                'Não foi possível verificar sua sessão.'
            );

            window.location.href =
                '../index.html';

            return false;

        }


        const usuario =
            data?.user;


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
            (
                usuario.email ||
                ''
            )
            .trim()
            .toLowerCase();


        const emailAdministrador =
            EMAIL_ADMIN
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


        // ====================================================
        // VERIFICAR SE É O ADMINISTRADOR
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


            try {

                await supabase.auth.signOut();

            } catch (erroLogout) {

                console.error(
                    'Erro ao encerrar sessão:',
                    erroLogout
                );

            }


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


        alert(
            'Não foi possível verificar seu acesso.'
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
// 5. SAIR DO PAINEL
// ============================================================

async function sairPainelAdmin() {

    const supabase =
        obterSupabaseAdmin();


    if (!supabase) {

        window.location.href =
            '../index.html';

        return;

    }


    const confirmar =
        window.confirm(
            'Deseja realmente sair do painel administrativo?'
        );


    if (!confirmar) {
        return;
    }


    try {

        const botaoSair =
            document.getElementById(
                'btn-sair-admin'
            );


        if (botaoSair) {

            botaoSair.disabled =
                true;

            botaoSair.textContent =
                'Saindo...';

        }


        const {
            error
        } =
            await supabase.auth.signOut();


        if (error) {

            console.error(
                'Erro ao sair:',
                error
            );


            alert(
                'Não foi possível sair do painel.\n\n' +
                error.message
            );


            if (botaoSair) {

                botaoSair.disabled =
                    false;

                botaoSair.textContent =
                    'Sair';

            }


            return;

        }


        window.location.href =
            '../index.html';


    } catch (erro) {

        console.error(
            'Erro inesperado ao sair:',
            erro
        );


        window.location.href =
            '../index.html';

    }

}


// ============================================================
// 6. PROTEGER LINKS ADMINISTRATIVOS
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


            // Não interceptar links externos

            if (
                destino.startsWith(
                    'http://'
                ) ||
                destino.startsWith(
                    'https://'
                ) ||
                destino.startsWith(
                    'mailto:'
                ) ||
                destino.startsWith(
                    '#'
                )
            ) {

                return;

            }


            // Links internos do painel
            // já estão protegidos pela verificação
            // inicial da página.

        }
    );

}


// ============================================================
// 7. BOTÃO SAIR
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


    botaoSair.addEventListener(
        'click',
        sairPainelAdmin
    );

}


// ============================================================
// 8. MONITORAR ALTERAÇÕES DE AUTENTICAÇÃO
// ============================================================

function monitorarAutenticacao() {

    const supabase =
        obterSupabaseAdmin();


    if (!supabase) {
        return;
    }


    supabase.auth.onAuthStateChange(
        (
            evento,
            sessao
        ) => {

            console.log(
                'Evento de autenticação:',
                evento
            );


            if (
                evento ===
                'SIGNED_OUT'
            ) {

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

            }


            if (
                evento ===
                'USER_UPDATED'
            ) {

                console.log(
                    'Usuário administrativo atualizado.'
                );

            }


            if (
                !sessao &&
                evento !==
                'INITIAL_SESSION'
            ) {

                window.location.href =
                    '../index.html';

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
    async () => {

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