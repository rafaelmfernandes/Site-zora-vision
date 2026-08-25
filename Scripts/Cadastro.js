// ============================================================
// ZORAVISION - CADASTRO DE CLIENTES COM SUPABASE AUTH
// ============================================================

console.log('🔥 CADASTRO NOVO - SUPABASE AUTH - VERSÃO 2');

document.addEventListener('DOMContentLoaded', () => {

    const formCadastro =
        document.getElementById('form-cadastro');

    if (!formCadastro) {

        console.error(
            'Erro: Formulário com ID "form-cadastro" não foi encontrado no HTML.'
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
            'Cliente Supabase não encontrado.'
        );

        alert(
            'Erro de conexão com o banco de dados. Recarregue a página e tente novamente.'
        );

        return;
    }

    // ============================================================
    // SUBMIT DO FORMULÁRIO
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

            alert(
                'Erro: algum campo do formulário não foi encontrado no HTML.'
            );

            return;
        }

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
                'Por favor, preencha todos os campos!'
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
        // DESABILITAR BOTÃO
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
                '📝 Criando usuário no Supabase Auth:',
                email
            );

            // ====================================================
            // 1. CRIAR USUÁRIO NO SUPABASE AUTH
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
            // ERRO NO AUTH
            // ====================================================

            if (authError) {

                console.error(
                    'Erro ao criar usuário no Auth:',
                    authError
                );

                if (
                    authError.message
                        ?.toLowerCase()
                        .includes('already registered')
                ) {

                    alert(
                        'Este e-mail já está cadastrado!'
                    );

                } else if (
                    authError.message
                        ?.toLowerCase()
                        .includes('rate limit')
                ) {

                    alert(
                        'O limite de tentativas de cadastro foi atingido. Aguarde alguns minutos e tente novamente.'
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
            // VERIFICAR USUÁRIO AUTH
            // ====================================================

            const authUser =
                authData?.user;

            if (!authUser) {

                console.error(
                    'Usuário Auth não foi retornado.'
                );

                alert(
                    'A conta não pôde ser criada. Tente novamente.'
                );

                return;
            }

            console.log(
                '✅ Usuário Auth criado:',
                authUser.id
            );

            // ====================================================
            // 2. CRIAR CLIENTE VINCULADO AO AUTH
            // ====================================================

            const {
                data: cliente,
                error: clienteError
            } = await supabaseClient
                .from('clientes')
                .insert([
                    {
                        nome: nome,
                        email: email,
                        ativo: true,
                        auth_user_id: authUser.id
                    }
                ])
                .select(
                    'id,nome,email,telefone,cpf,ativo,auth_user_id'
                )
                .single();

            // ====================================================
            // ERRO AO CRIAR CLIENTE
            // ====================================================

            if (clienteError) {

                console.error(
                    'Erro ao criar cliente:',
                    clienteError
                );

                // ==================================================
                // IMPORTANTE
                // ==================================================
                //
                // O usuário Auth já foi criado.
                //
                // Não tentamos apagar o usuário Auth pelo navegador,
                // pois isso exige privilégios administrativos.
                //
                // O erro será informado ao usuário.
                //

                if (clienteError.code === '23505') {

                    alert(
                        'Este e-mail já possui um cadastro de cliente.'
                    );

                } else {

                    alert(
                        'O usuário foi criado na autenticação, mas houve um problema ao criar o cadastro do cliente. Entre em contato com a loja.'
                    );
                }

                return;
            }

            // ====================================================
            // VERIFICAR CLIENTE
            // ====================================================

            if (!cliente) {

                alert(
                    'A conta foi criada, mas não foi possível finalizar seu cadastro.'
                );

                return;
            }

            console.log(
                '✅ Cliente criado com sucesso:',
                cliente.id
            );

            console.log(
                'Auth User ID:',
                cliente.auth_user_id
            );

            // ====================================================
            // 3. SALVAR DADOS LOCAIS
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

            localStorage.setItem(
                'usuario_logado',
                JSON.stringify(usuarioLogado)
            );

            localStorage.setItem(
                'cliente_supabase_id',
                cliente.id
            );

            // ====================================================
            // 4. VERIFICAR SE EXISTE SESSÃO
            // ====================================================

            if (authData.session) {

                console.log(
                    '✅ Sessão criada automaticamente.'
                );

                alert(
                    'Conta criada com sucesso! 🎉 Bem-vindo, ' +
                    (cliente.nome || 'cliente') +
                    '!'
                );

                window.location.href =
                    'Meu-perfil.html';

            } else {

                console.log(
                    '📧 Usuário criado, aguardando confirmação de e-mail.'
                );

                alert(
                    'Conta criada com sucesso! 🎉 Verifique seu e-mail para confirmar sua conta antes de fazer login.'
                );

                window.location.href =
                    'Login.html';
            }

        } catch (erroExcecao) {

            console.error(
                '❌ Exceção durante o cadastro:',
                erroExcecao
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