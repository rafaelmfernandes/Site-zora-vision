// ============================================================
// ZORAVISION - CADASTRO DE CLIENTES
// SUPABASE AUTH + TRIGGER AUTOMÁTICO
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

    const formCadastro =
        document.getElementById('form-cadastro');

    if (!formCadastro) {

        console.error(
            'Erro: Formulário com ID "form-cadastro" não foi encontrado no HTML.'
        );

        return;
    }

    console.log(
        '🔥 ZORAVISION - Cadastro.js carregado'
    );

    // ============================================================
    // CONEXÃO COM SUPABASE
    // ============================================================

    const supabaseClient =
        typeof _supabase !== 'undefined'
            ? _supabase
            : window._supabase;

    if (!supabaseClient) {

        console.error(
            'Cliente Supabase não encontrado.'
        );

        alert(
            'Erro de conexão com o banco de dados. Recarregue a página e tente novamente.'
        );

        return;
    }

    // ============================================================
    // FORMULÁRIO
    // ============================================================

    formCadastro.addEventListener('submit', async (event) => {

        event.preventDefault();

        // ========================================================
        // CAMPOS
        // ========================================================

        const inputNome =
            document.getElementById('nome');

        const inputEmail =
            document.getElementById('email-cadastro');

        const inputSenha =
            document.getElementById('senha-cadastro');

        const inputConfirmarSenha =
            document.getElementById('confirmar-senha');

        if (
            !inputNome ||
            !inputEmail ||
            !inputSenha ||
            !inputConfirmarSenha
        ) {

            console.error(
                'Um ou mais campos do formulário não foram encontrados.'
            );

            alert(
                'Erro no formulário. Verifique os campos e tente novamente.'
            );

            return;
        }

        // ========================================================
        // VALORES
        // ========================================================

        const nome =
            inputNome.value.trim();

        const email =
            inputEmail.value
                .trim()
                .toLowerCase();

        const password =
            inputSenha.value;

        const confirmarPassword =
            inputConfirmarSenha.value;

        // ========================================================
        // VALIDAÇÕES
        // ========================================================

        if (
            !nome ||
            !email ||
            !password ||
            !confirmarPassword
        ) {

            alert(
                'Por favor, preencha todos os campos.'
            );

            return;
        }

        if (password.length < 6) {

            alert(
                'A senha deve possuir pelo menos 6 caracteres.'
            );

            return;
        }

        if (password !== confirmarPassword) {

            alert(
                'As senhas não coincidem. Verifique e tente novamente.'
            );

            return;
        }

        // ========================================================
        // BOTÃO
        // ========================================================

        const botaoSubmit =
            formCadastro.querySelector(
                'button[type="submit"], input[type="submit"]'
            );

        if (botaoSubmit) {
            botaoSubmit.disabled = true;
        }

        try {

            console.log(
                '📝 Criando usuário no Supabase Auth...'
            );

            console.log(
                'E-mail:',
                email
            );

            // ====================================================
            // CRIAR USUÁRIO NO SUPABASE AUTH
            // ====================================================

            const {
                data: authData,
                error: authError
            } = await supabaseClient.auth.signUp({

                email: email,

                password: password,

                options: {

                    data: {
                        nome: nome
                    }

                }

            });

            // ====================================================
            // TRATAR ERRO DO AUTH
            // ====================================================

            if (authError) {

                console.error(
                    '❌ Erro ao criar usuário no Auth:',
                    authError
                );

                const mensagem =
                    authError.message?.toLowerCase() || '';

                if (
                    mensagem.includes(
                        'already registered'
                    )
                ) {

                    alert(
                        'Este e-mail já está cadastrado!'
                    );

                } else if (
                    mensagem.includes(
                        'rate limit'
                    )
                ) {

                    alert(
                        'Muitas tentativas de cadastro. Aguarde alguns minutos e tente novamente.'
                    );

                } else {

                    alert(
                        'Erro ao criar conta: ' +
                        authError.message
                    );
                }

                return;
            }

            // ====================================================
            // VERIFICAR USUÁRIO
            // ====================================================

            const usuarioAuth =
                authData?.user;

            if (!usuarioAuth) {

                console.error(
                    'Usuário Auth não foi retornado.'
                );

                alert(
                    'Não foi possível criar sua conta. Tente novamente.'
                );

                return;
            }

            console.log(
                '✅ Usuário Auth criado:',
                usuarioAuth.id
            );

            console.log(
                'E-mail:',
                usuarioAuth.email
            );

            // ====================================================
            // IMPORTANTE
            // ====================================================
            //
            // NÃO fazemos INSERT em clientes aqui.
            //
            // O trigger:
            //
            // criar_cliente_apos_auth_trigger
            //
            // cria automaticamente o registro na tabela clientes.
            //
            // ====================================================

            console.log(
                '⏳ O trigger do banco criará o cliente automaticamente.'
            );

            // ====================================================
            // USUÁRIO COM SESSÃO
            // ====================================================

            if (authData.session) {

                console.log(
                    '✅ Sessão criada automaticamente.'
                );

                // ==================================================
                // BUSCAR CLIENTE CRIADO PELO TRIGGER
                // ==================================================

                const {
                    data: cliente,
                    error: clienteError
                } = await supabaseClient
                    .from('clientes')
                    .select(
                        'id,nome,email,telefone,cpf,ativo,auth_user_id'
                    )
                    .eq(
                        'auth_user_id',
                        usuarioAuth.id
                    )
                    .maybeSingle();

                if (clienteError) {

                    console.error(
                        'Erro ao consultar cliente:',
                        clienteError
                    );

                    alert(
                        'Sua conta foi criada, mas não foi possível carregar seu cadastro. Tente fazer login novamente.'
                    );

                    window.location.href =
                        '02-Login.html';

                    return;
                }

                if (cliente) {

                    const usuarioLogado = {

                        id:
                            cliente.id,

                        auth_user_id:
                            cliente.auth_user_id,

                        nome:
                            cliente.nome || nome,

                        email:
                            cliente.email || email,

                        telefone:
                            cliente.telefone || '',

                        cpf:
                            cliente.cpf || ''

                    };

                    localStorage.setItem(
                        'usuario_logado',
                        JSON.stringify(usuarioLogado)
                    );

                    localStorage.setItem(
                        'cliente_supabase_id',
                        cliente.id
                    );

                    console.log(
                        '✅ Cliente encontrado:',
                        cliente.id
                    );
                }

                alert(
                    'Conta criada com sucesso! 🎉'
                );

                window.location.href =
                    '03-Meus-pedidos.html';

                return;
            }

            // ====================================================
            // SEM SESSÃO
            // ====================================================
            //
            // Isso normalmente acontece quando a confirmação
            // de e-mail está habilitada.
            //
            // ====================================================

            console.log(
                '📧 Confirmação de e-mail necessária.'
            );

            console.log(
                'Auth User ID:',
                usuarioAuth.id
            );

            alert(
                'Conta criada com sucesso! 🎉\n\nVerifique seu e-mail para confirmar sua conta. Depois, volte à loja e faça login.'
            );

            window.location.href =
                '02-Login.html';

        } catch (erro) {

            console.error(
                '❌ Erro inesperado no cadastro:',
                erro
            );

            alert(
                'Ocorreu um erro inesperado ao realizar o cadastro. Tente novamente.'
            );

        } finally {

            if (botaoSubmit) {
                botaoSubmit.disabled = false;
            }

        }

    });

});