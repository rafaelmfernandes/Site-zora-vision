// ============================================================
// ZORAVISION - LOGIN COM SUPABASE AUTH
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {

    const formLogin = document.getElementById('form-login');

    if (!formLogin) {
        console.error(
            'Erro: Formulário com ID "form-login" não foi encontrado no HTML.'
        );
        return;
    }

    // ============================================================
    // CONEXÃO COM SUPABASE
    // ============================================================

    const supabaseConn =
        typeof _supabase !== 'undefined'
            ? _supabase
            : window._supabase;

    if (!supabaseConn) {
        console.error('Cliente Supabase não encontrado.');

        alert(
            'Erro de conexão com o banco de dados. Recarregue a página e tente novamente.'
        );

        return;
    }

    // ============================================================
    // VERIFICAR SE JÁ EXISTE UMA SESSÃO
    // ============================================================

    try {

        const {
            data: {
                session
            },
            error
        } = await supabaseConn.auth.getSession();

        if (error) {
            console.error(
                'Erro ao verificar sessão:',
                error
            );
        }

        if (session?.user) {

            console.log(
                'Sessão Auth encontrada:',
                session.user.id
            );

            await carregarClienteEEntrar(
                session.user.id
            );
        }

    } catch (erro) {

        console.error(
            'Erro ao verificar sessão:',
            erro
        );
    }

    // ============================================================
    // SUBMIT DO LOGIN
    // ============================================================

    formLogin.addEventListener('submit', async (event) => {

        event.preventDefault();

        // ========================================================
        // CAMPOS
        // ========================================================

        const inputEmail =
            document.getElementById('email');

        const inputSenha =
            document.getElementById('senha');

        if (!inputEmail || !inputSenha) {

            alert(
                'Erro: os campos de e-mail ou senha não foram encontrados no HTML.'
            );

            return;
        }

        const email =
            inputEmail.value
                .trim()
                .toLowerCase();

        const senha =
            inputSenha.value;

        if (!email || !senha) {

            alert(
                'Por favor, preencha o e-mail e a senha.'
            );

            return;
        }

        // ========================================================
        // DESABILITAR BOTÃO DURANTE LOGIN
        // ========================================================

        const botaoSubmit =
            formLogin.querySelector(
                'button[type="submit"], input[type="submit"]'
            );

        if (botaoSubmit) {
            botaoSubmit.disabled = true;
        }

        try {

            console.log(
                '🔐 Realizando login pelo Supabase Auth:',
                email
            );

            // ====================================================
            // LOGIN PELO SUPABASE AUTH
            // ====================================================

            const {
                data,
                error
            } = await supabaseConn.auth.signInWithPassword({

                email: email,

                password: senha

            });

            if (error) {

                console.error(
                    'Erro no Supabase Auth:',
                    error
                );

                if (
                    error.message?.toLowerCase().includes(
                        'email not confirmed'
                    )
                ) {

                    alert(
                        'Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada.'
                    );

                } else if (
                    error.message?.toLowerCase().includes(
                        'invalid login credentials'
                    )
                ) {

                    alert(
                        'E-mail ou senha incorretos. Verifique seus dados e tente novamente.'
                    );

                } else {

                    alert(
                        'Não foi possível realizar o login: ' +
                        error.message
                    );
                }

                return;
            }

            // ====================================================
            // VERIFICAR USUÁRIO AUTH
            // ====================================================

            if (!data?.user) {

                alert(
                    'Não foi possível identificar o usuário autenticado.'
                );

                return;
            }

            console.log(
                '✅ Auth realizado com sucesso:',
                data.user.id
            );

            // ====================================================
            // BUSCAR CLIENTE NA TABELA CLIENTES
            // ====================================================

            await carregarClienteEEntrar(
                data.user.id
            );

        } catch (erro) {

            console.error(
                '❌ Erro inesperado durante o login:',
                erro
            );

            alert(
                'Ocorreu um erro inesperado ao tentar fazer login. Tente novamente.'
            );

        } finally {

            if (botaoSubmit) {
                botaoSubmit.disabled = false;
            }
        }

    });


    // ============================================================
    // FUNÇÃO PARA CARREGAR CLIENTE
    // ============================================================

    async function carregarClienteEEntrar(authUserId) {

        try {

            console.log(
                '🔎 Buscando cliente vinculado ao Auth:',
                authUserId
            );

            const {
                data: cliente,
                error
            } = await supabaseConn
                .from('clientes')
                .select(
                    'id,nome,email,telefone,cpf,ativo,auth_user_id'
                )
                .eq(
                    'auth_user_id',
                    authUserId
                )
                .maybeSingle();

            // ====================================================
            // ERRO
            // ====================================================

            if (error) {

                console.error(
                    'Erro ao consultar cliente:',
                    error
                );

                alert(
                    'Não foi possível carregar os dados da sua conta.'
                );

                return;
            }

            // ====================================================
            // CLIENTE NÃO ENCONTRADO
            // ====================================================

            if (!cliente) {

                console.error(
                    'Nenhum cliente vinculado ao Auth:',
                    authUserId
                );

                alert(
                    'Sua conta de autenticação existe, mas seu cadastro de cliente ainda não está vinculado. Entre em contato com a loja.'
                );

                await supabaseConn.auth.signOut();

                return;
            }

            // ====================================================
            // CONTA DESATIVADA
            // ====================================================

            if (cliente.ativo === false) {

                alert(
                    'Esta conta está desativada. Entre em contato com a loja.'
                );

                await supabaseConn.auth.signOut();

                return;
            }

            // ====================================================
            // CRIAR OBJETO DA SESSÃO LOCAL
            // ====================================================

            const usuarioLogado = {

                id:
                    cliente.id,

                auth_user_id:
                    cliente.auth_user_id,

                nome:
                    cliente.nome || '',

                email:
                    cliente.email || '',

                telefone:
                    cliente.telefone || '',

                cpf:
                    cliente.cpf || ''

            };

            // ====================================================
            // SALVAR DADOS DO CLIENTE
            // ====================================================

            localStorage.setItem(
                'usuario_logado',
                JSON.stringify(usuarioLogado)
            );

            // Mantemos essa chave temporariamente para
            // compatibilidade com outras partes antigas do site.

            localStorage.setItem(
                'cliente_supabase_id',
                cliente.id
            );

            // ====================================================
            // LOG
            // ====================================================

            console.log(
                '✅ CLIENTE CARREGADO COM SUCESSO'
            );

            console.log(
                'Cliente ID:',
                cliente.id
            );

            console.log(
                'Auth User ID:',
                cliente.auth_user_id
            );

            console.log(
                'Cliente:',
                cliente.nome
            );

            console.log(
                'E-mail:',
                cliente.email
            );

            // ====================================================
            // AVISO
            // ====================================================

            alert(
                'Login realizado com sucesso! Bem-vindo de volta, ' +
                (cliente.nome || 'cliente') +
                ' 🎉'
            );

            // ====================================================
            // REDIRECIONAMENTO
            // ====================================================

            window.location.href =
                'Meu-perfil.html';

        } catch (erro) {

            console.error(
                'Erro ao carregar cliente:',
                erro
            );

            alert(
                'Não foi possível carregar seu cadastro. Tente novamente.'
            );
        }
    }

});