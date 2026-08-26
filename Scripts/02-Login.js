// ============================================================
// ZORAVISION - LOGIN
// SUPABASE AUTH + TABELA CLIENTES
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

    const formLogin =
        document.getElementById('form-login');

    if (!formLogin) {

        console.error(
            'Erro: Formulário com ID "form-login" não foi encontrado no HTML.'
        );

        return;
    }


    // ============================================================
    // CONEXÃO COM SUPABASE
    // ============================================================

    const supabaseClient =
        typeof _supabase !== 'undefined'
            ? _supabase
            : window._supabase;


    if (!supabaseClient) {

        console.error(
            '❌ Cliente Supabase não encontrado.'
        );

        alert(
            'Erro de conexão com o banco de dados. Recarregue a página e tente novamente.'
        );

        return;
    }


    console.log(
        '🔥 ZORAVISION - Login.js carregado'
    );

    console.log(
        '✅ Cliente Supabase disponível'
    );


    // ============================================================
    // FORMULÁRIO
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

            console.error(
                '❌ Campos de e-mail ou senha não encontrados.'
            );

            alert(
                'Erro no formulário. Verifique os campos e tente novamente.'
            );

            return;
        }


        // ========================================================
        // VALORES
        // ========================================================

        const email =
            inputEmail.value
                .trim()
                .toLowerCase();

        const senha =
            inputSenha.value;


        // ========================================================
        // VALIDAÇÃO
        // ========================================================

        if (!email || !senha) {

            alert(
                'Por favor, preencha o e-mail e a senha.'
            );

            return;
        }


        // ========================================================
        // BOTÃO
        // ========================================================

        const botaoEntrar =
            formLogin.querySelector(
                'button[type="submit"]'
            );


        if (botaoEntrar) {

            botaoEntrar.disabled = true;

            botaoEntrar.dataset.textoOriginal =
                botaoEntrar.textContent;

            botaoEntrar.textContent =
                'Entrando...';

        }


        try {

            console.log(
                '🔐 Tentando fazer login:',
                email
            );


            // ====================================================
            // 1. LOGIN PELO SUPABASE AUTH
            // ====================================================

            const {
                data: authData,
                error: authError
            } =
                await supabaseClient.auth.signInWithPassword({

                    email:
                        email,

                    password:
                        senha

                });


            // ====================================================
            // ERRO NO AUTH
            // ====================================================

            if (authError) {

                console.error(
                    '❌ Erro no login Auth:',
                    authError
                );


                const mensagem =
                    authError.message?.toLowerCase() || '';


                if (
                    mensagem.includes(
                        'email not confirmed'
                    )
                ) {

                    alert(
                        'Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada e confirme sua conta.'
                    );

                } else if (
                    mensagem.includes(
                        'invalid login credentials'
                    )
                ) {

                    alert(
                        'E-mail ou senha incorretos. Verifique seus dados e tente novamente.'
                    );

                } else if (
                    mensagem.includes(
                        'too many requests'
                    )
                ) {

                    alert(
                        'Muitas tentativas foram realizadas. Aguarde alguns instantes e tente novamente.'
                    );

                } else {

                    alert(
                        'Não foi possível realizar o login: ' +
                        authError.message
                    );

                }

                return;
            }


            // ====================================================
            // 2. VERIFICAR USUÁRIO AUTH
            // ====================================================

            const usuarioAuth =
                authData?.user;


            if (!usuarioAuth) {

                console.error(
                    '❌ Usuário Auth não retornado.'
                );

                alert(
                    'Não foi possível identificar sua conta. Tente novamente.'
                );

                return;
            }


            console.log(
                '✅ Login Auth realizado.'
            );

            console.log(
                'Auth User ID:',
                usuarioAuth.id
            );

            console.log(
                'E-mail:',
                usuarioAuth.email
            );

            console.log(
                'E-mail confirmado:',
                usuarioAuth.email_confirmed_at
            );


            // ====================================================
            // 3. CONFIRMAR SESSÃO
            // ====================================================

            const {
                data: sessionData,
                error: sessionError
            } =
                await supabaseClient.auth.getSession();


            if (sessionError) {

                console.error(
                    '❌ Erro ao verificar sessão:',
                    sessionError
                );

                alert(
                    'Sua autenticação foi realizada, mas não foi possível criar a sessão. Tente novamente.'
                );

                return;
            }


            if (!sessionData?.session) {

                console.error(
                    '❌ Login sem sessão ativa.'
                );

                alert(
                    'Não foi possível criar sua sessão. Tente novamente.'
                );

                return;
            }


            console.log(
                '✅ Sessão Supabase confirmada.'
            );


            // ====================================================
            // 4. BUSCAR CLIENTE
            // ====================================================
            //
            // Relacionamento:
            //
            // clientes.auth_user_id = auth.users.id
            //
            // ====================================================

            const {
                data: cliente,
                error: clienteError
            } =
                await supabaseClient

                    .from('clientes')

                    .select(
                        'id,nome,email,telefone,cpf,ativo,auth_user_id'
                    )

                    .eq(
                        'auth_user_id',
                        usuarioAuth.id
                    )

                    .maybeSingle();


            // ====================================================
            // ERRO AO BUSCAR CLIENTE
            // ====================================================

            if (clienteError) {

                console.error(
                    '❌ Erro ao consultar cliente:',
                    clienteError
                );

                await supabaseClient.auth.signOut();

                alert(
                    'Login realizado, mas não foi possível carregar seu cadastro. Tente novamente.'
                );

                return;
            }


            // ====================================================
            // CLIENTE NÃO ENCONTRADO
            // ====================================================

            if (!cliente) {

                console.error(
                    '❌ Nenhum cliente encontrado para Auth User:',
                    usuarioAuth.id
                );

                await supabaseClient.auth.signOut();

                alert(
                    'Sua conta foi autenticada, mas o cadastro da loja não foi encontrado. Entre em contato com o suporte.'
                );

                return;
            }


            console.log(
                '✅ Cliente encontrado:',
                cliente.id
            );


            // ====================================================
            // 5. VERIFICAR CONTA ATIVA
            // ====================================================

            if (cliente.ativo === false) {

                console.warn(
                    '⚠️ Cliente está desativado.'
                );

                await supabaseClient.auth.signOut();

                alert(
                    'Esta conta está desativada. Entre em contato com a loja.'
                );

                return;
            }


            // ====================================================
            // 6. CRIAR DADOS DO USUÁRIO LOCAL
            // ====================================================

            const usuarioLogado = {

                id:
                    cliente.id,

                auth_user_id:
                    cliente.auth_user_id,

                nome:
                    cliente.nome || '',

                email:
                    cliente.email ||
                    usuarioAuth.email ||
                    '',

                telefone:
                    cliente.telefone || '',

                cpf:
                    cliente.cpf || ''

            };


            // ====================================================
            // 7. SALVAR SESSÃO LOCAL
            // ====================================================

            localStorage.setItem(
                'usuario_logado',
                JSON.stringify(usuarioLogado)
            );


            localStorage.setItem(
                'cliente_supabase_id',
                cliente.id
            );


            // ====================================================
            // 8. LOG DE SUCESSO
            // ====================================================

            console.log(
                '=========================================='
            );

            console.log(
                '✅ LOGIN REALIZADO COM SUCESSO'
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

            console.log(
                'Sessão ativa:',
                true
            );

            console.log(
                '=========================================='
            );


            // ====================================================
            // 9. REDIRECIONAMENTO
            // ====================================================

            alert(
                'Login realizado com sucesso! Bem-vindo de volta, ' +
                (cliente.nome || 'cliente') +
                ' 🎉'
            );


            window.location.href =
                'Meu-perfil.html';


        } catch (erro) {

            console.error(
                '❌ Erro inesperado durante o login:',
                erro
            );

            alert(
                'Ocorreu um erro inesperado ao tentar fazer login. Tente novamente.'
            );

        } finally {

            if (botaoEntrar) {

                botaoEntrar.disabled = false;

                botaoEntrar.textContent =
                    botaoEntrar.dataset.textoOriginal ||
                    'Entrar na minha conta';

            }

        }

    });

});