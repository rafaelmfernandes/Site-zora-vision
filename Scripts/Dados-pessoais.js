// ============================================================
// ZORAVISION - DADOS PESSOAIS
// SUPABASE AUTH + TABELA CLIENTES
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {

    console.log('🔥 ZORAVISION - Dados-pessoais.js carregado');


    // ============================================================
    // ELEMENTOS
    // ============================================================

    const formDados =
        document.getElementById('form-dados');

    const formSenha =
        document.getElementById('form-senha');

    const inputNome =
        document.getElementById('nome');

    const inputEmail =
        document.getElementById('email');

    const inputTelefone =
        document.getElementById('telefone');

    const inputCpf =
        document.getElementById('cpf');

    const inputSenhaAtual =
        document.getElementById('senha-atual');

    const inputNovaSenha =
        document.getElementById('nova-senha');

    const inputConfirmarSenha =
        document.getElementById('confirmar-senha');


    // ============================================================
    // VERIFICAR FORMULÁRIOS
    // ============================================================

    if (!formDados || !formSenha) {

        console.error(
            '❌ Formulários de dados pessoais não encontrados.'
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

        console.error(
            '❌ Cliente Supabase não encontrado.'
        );

        alert(
            'Erro de conexão com o banco de dados. Recarregue a página e tente novamente.'
        );

        return;
    }


    console.log(
        '✅ Cliente Supabase disponível.'
    );


    // ============================================================
    // VERIFICAR SESSÃO AUTH
    // ============================================================

    let sessao = null;
    let usuarioAuth = null;

    try {

        const {
            data,
            error
        } = await supabaseConn.auth.getSession();


        if (error) {

            console.error(
                '❌ Erro ao verificar sessão Auth:',
                error
            );

            alert(
                'Não foi possível verificar sua sessão. Faça login novamente.'
            );

            window.location.href =
                'Login.html';

            return;
        }


        sessao =
            data?.session;


        usuarioAuth =
            sessao?.user;


        if (!usuarioAuth) {

            console.warn(
                '⚠️ Nenhuma sessão Auth encontrada.'
            );

            localStorage.removeItem(
                'usuario_logado'
            );

            localStorage.removeItem(
                'cliente_supabase_id'
            );

            alert(
                'Sua sessão expirou. Faça login novamente.'
            );

            window.location.href =
                'Login.html';

            return;
        }


        console.log(
            '=========================================='
        );

        console.log(
            '✅ SESSÃO AUTH ENCONTRADA'
        );

        console.log(
            'Auth User ID:',
            usuarioAuth.id
        );

        console.log(
            'E-mail Auth:',
            usuarioAuth.email
        );

        console.log(
            '=========================================='
        );


    } catch (erro) {

        console.error(
            '❌ Erro inesperado ao verificar sessão:',
            erro
        );

        alert(
            'Ocorreu um erro ao verificar sua sessão.'
        );

        window.location.href =
            'Login.html';

        return;
    }


    // ============================================================
    // BUSCAR CLIENTE
    // ============================================================

    let clienteAtual = null;

    try {

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
                usuarioAuth.id
            )
            .maybeSingle();


        if (error) {

            console.error(
                '❌ Erro ao buscar cliente:',
                error
            );

            alert(
                'Não foi possível carregar seus dados.'
            );

            return;
        }


        if (!cliente) {

            console.error(
                '❌ Cliente não encontrado para o usuário Auth:',
                usuarioAuth.id
            );

            localStorage.removeItem(
                'usuario_logado'
            );

            localStorage.removeItem(
                'cliente_supabase_id'
            );

            alert(
                'Seu cadastro não foi encontrado. Faça login novamente.'
            );

            window.location.href =
                'Login.html';

            return;
        }


        if (cliente.ativo === false) {

            console.warn(
                '⚠️ Conta desativada.'
            );

            localStorage.removeItem(
                'usuario_logado'
            );

            localStorage.removeItem(
                'cliente_supabase_id'
            );

            await supabaseConn.auth.signOut();

            alert(
                'Sua conta está desativada.'
            );

            window.location.href =
                'Login.html';

            return;
        }


        clienteAtual =
            cliente;


        // ========================================================
        // PREENCHER CAMPOS
        // ========================================================

        if (inputNome) {

            inputNome.value =
                cliente.nome || '';

        }


        if (inputEmail) {

            inputEmail.value =
                cliente.email ||
                usuarioAuth.email ||
                '';

        }


        if (inputTelefone) {

            inputTelefone.value =
                cliente.telefone || '';

        }


        if (inputCpf) {

            inputCpf.value =
                cliente.cpf || '';

        }


        // ========================================================
        // ATUALIZAR LOCALSTORAGE
        // ========================================================

        const usuarioLogadoInicial = {

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


        localStorage.setItem(
            'usuario_logado',
            JSON.stringify(usuarioLogadoInicial)
        );


        localStorage.setItem(
            'cliente_supabase_id',
            cliente.id
        );


        // ========================================================
        // LOGS
        // ========================================================

        console.log(
            '=========================================='
        );

        console.log(
            '✅ DADOS PESSOAIS CARREGADOS'
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
            'Nome:',
            cliente.nome
        );

        console.log(
            'E-mail:',
            cliente.email
        );

        console.log(
            '=========================================='
        );


    } catch (erro) {

        console.error(
            '❌ Erro inesperado ao carregar cliente:',
            erro
        );

        alert(
            'Ocorreu um erro ao carregar seus dados.'
        );

        return;
    }


    // ============================================================
    // SALVAR DADOS PESSOAIS
    // ============================================================

    formDados.addEventListener(
        'submit',
        async (event) => {

            event.preventDefault();


            if (!clienteAtual) {

                alert(
                    'Os dados do cliente ainda não foram carregados.'
                );

                return;
            }


            const nome =
                inputNome.value
                    .trim();


            const email =
                inputEmail.value
                    .trim()
                    .toLowerCase();


            const telefone =
                inputTelefone.value
                    .trim();


            // ====================================================
            // VALIDAÇÕES
            // ====================================================

            if (!nome) {

                alert(
                    'Digite seu nome completo.'
                );

                inputNome.focus();

                return;
            }


            if (!email) {

                alert(
                    'Digite seu e-mail.'
                );

                inputEmail.focus();

                return;
            }


            // ====================================================
            // VERIFICAR SE E-MAIL JÁ EXISTE
            // ====================================================

            try {

                const {
                    data: emailExistente,
                    error: erroEmail
                } = await supabaseConn
                    .from('clientes')
                    .select('id')
                    .eq(
                        'email',
                        email
                    )
                    .neq(
                        'id',
                        clienteAtual.id
                    )
                    .maybeSingle();


                if (erroEmail) {

                    console.error(
                        '❌ Erro ao verificar e-mail:',
                        erroEmail
                    );

                    alert(
                        'Não foi possível verificar o e-mail.'
                    );

                    return;
                }


                if (emailExistente) {

                    alert(
                        'Este e-mail já está cadastrado em outra conta.'
                    );

                    return;
                }


                // ==================================================
                // ATUALIZAR CLIENTE
                // ==================================================

                console.log(
                    '💾 Atualizando dados pessoais...'
                );


                const {
                    error: erroAtualizacao
                } = await supabaseConn
                    .from('clientes')
                    .update({

                        nome:
                            nome,

                        email:
                            email,

                        telefone:
                            telefone,

                        updated_at:
                            new Date().toISOString()

                    })
                    .eq(
                        'id',
                        clienteAtual.id
                    );


                if (erroAtualizacao) {

                    console.error(
                        '❌ Erro ao atualizar cliente:',
                        erroAtualizacao
                    );

                    alert(
                        'Não foi possível salvar suas alterações: ' +
                        erroAtualizacao.message
                    );

                    return;
                }


                // ==================================================
                // ATUALIZAR E-MAIL DO AUTH SE NECESSÁRIO
                // ==================================================

                const emailAuth =
                    usuarioAuth.email
                        ?.trim()
                        .toLowerCase();


                if (
                    email &&
                    email !== emailAuth
                ) {

                    console.log(
                        '📧 Alterando e-mail do Supabase Auth...'
                    );


                    const {
                        error: erroAuthEmail
                    } = await supabaseConn.auth.updateUser({

                        email:
                            email

                    });


                    if (erroAuthEmail) {

                        console.error(
                            '❌ Erro ao atualizar e-mail Auth:',
                            erroAuthEmail
                        );

                        alert(
                            'Os dados foram salvos, mas não foi possível atualizar o e-mail da autenticação: ' +
                            erroAuthEmail.message
                        );

                    } else {

                        console.log(
                            '✅ E-mail Auth atualizado.'
                        );

                    }

                }


                // ==================================================
                // ATUALIZAR OBJETO LOCAL
                // ==================================================

                clienteAtual.nome =
                    nome;

                clienteAtual.email =
                    email;

                clienteAtual.telefone =
                    telefone;


                // ==================================================
                // ATUALIZAR LOCALSTORAGE
                // ==================================================

                const usuarioLogadoAtualizado = {

                    id:
                        clienteAtual.id,

                    auth_user_id:
                        clienteAtual.auth_user_id,

                    nome:
                        nome,

                    email:
                        email,

                    telefone:
                        telefone,

                    cpf:
                        clienteAtual.cpf || ''

                };


                localStorage.setItem(
                    'usuario_logado',
                    JSON.stringify(
                        usuarioLogadoAtualizado
                    )
                );


                localStorage.setItem(
                    'cliente_supabase_id',
                    clienteAtual.id
                );


                console.log(
                    '=========================================='
                );

                console.log(
                    '✅ DADOS PESSOAIS ATUALIZADOS'
                );

                console.log(
                    'Cliente ID:',
                    clienteAtual.id
                );

                console.log(
                    'Nome:',
                    nome
                );

                console.log(
                    'E-mail:',
                    email
                );

                console.log(
                    'Telefone:',
                    telefone
                );

                console.log(
                    '=========================================='
                );


                alert(
                    'Dados pessoais atualizados com sucesso! 🎉'
                );


            } catch (erro) {

                console.error(
                    '❌ Erro inesperado ao atualizar dados:',
                    erro
                );

                alert(
                    'Ocorreu um erro ao salvar seus dados.'
                );

            }

        }
    );


    // ============================================================
    // ALTERAR SENHA
    // SUPABASE AUTH
    // ============================================================

    formSenha.addEventListener(
        'submit',
        async (event) => {

            event.preventDefault();


            if (!clienteAtual) {

                alert(
                    'Os dados do cliente ainda não foram carregados.'
                );

                return;
            }


            const senhaAtual =
                inputSenhaAtual.value;


            const novaSenha =
                inputNovaSenha.value;


            const confirmarSenha =
                inputConfirmarSenha.value;


            // ====================================================
            // VALIDAÇÕES
            // ====================================================

            if (
                !senhaAtual ||
                !novaSenha ||
                !confirmarSenha
            ) {

                alert(
                    'Preencha todos os campos de senha.'
                );

                return;
            }


            if (
                novaSenha.length < 8
            ) {

                alert(
                    'A nova senha precisa ter no mínimo 8 caracteres.'
                );

                return;
            }


            if (
                novaSenha !== confirmarSenha
            ) {

                alert(
                    'A nova senha e a confirmação não são iguais.'
                );

                return;
            }


            if (
                senhaAtual === novaSenha
            ) {

                alert(
                    'A nova senha precisa ser diferente da senha atual.'
                );

                return;
            }


            // ====================================================
            // VERIFICAR SENHA ATUAL PELO AUTH
            // ====================================================

            try {

                console.log(
                    '🔐 Verificando senha atual pelo Supabase Auth...'
                );


                const emailAuth =
                    usuarioAuth.email;


                if (!emailAuth) {

                    alert(
                        'Não foi possível identificar o e-mail da sua conta.'
                    );

                    return;
                }


                const {
                    error: erroLogin
                } = await supabaseConn.auth.signInWithPassword({

                    email:
                        emailAuth,

                    password:
                        senhaAtual

                });


                if (erroLogin) {

                    console.error(
                        '❌ Senha atual incorreta:',
                        erroLogin
                    );


                    const mensagem =
                        erroLogin.message
                            ?.toLowerCase() || '';


                    if (
                        mensagem.includes(
                            'invalid login credentials'
                        )
                    ) {

                        alert(
                            'A senha atual está incorreta.'
                        );

                    } else {

                        alert(
                            'Não foi possível validar sua senha atual: ' +
                            erroLogin.message
                        );

                    }

                    return;
                }


                console.log(
                    '✅ Senha atual confirmada pelo Auth.'
                );


                // ==================================================
                // ATUALIZAR NOVA SENHA
                // ==================================================

                console.log(
                    '🔐 Atualizando nova senha no Supabase Auth...'
                );


                const {
                    data,
                    error: erroNovaSenha
                } = await supabaseConn.auth.updateUser({

                    password:
                        novaSenha

                });


                if (erroNovaSenha) {

                    console.error(
                        '❌ Erro ao atualizar senha:',
                        erroNovaSenha
                    );

                    alert(
                        'Não foi possível atualizar sua senha: ' +
                        erroNovaSenha.message
                    );

                    return;
                }


                console.log(
                    '=========================================='
                );

                console.log(
                    '✅ SENHA ALTERADA COM SUCESSO'
                );

                console.log(
                    'Usuário:',
                    data?.user?.email
                );

                console.log(
                    '=========================================='
                );


                // ==================================================
                // LIMPAR CAMPOS
                // ==================================================

                inputSenhaAtual.value =
                    '';

                inputNovaSenha.value =
                    '';

                inputConfirmarSenha.value =
                    '';


                alert(
                    'Senha atualizada com sucesso! 🔐🎉'
                );


            } catch (erro) {

                console.error(
                    '❌ Erro inesperado ao alterar senha:',
                    erro
                );

                alert(
                    'Ocorreu um erro ao atualizar sua senha.'
                );

            }

        }
    );


    // ============================================================
    // FINAL
    // ============================================================

    console.log(
        '✅ Dados-pessoais.js totalmente inicializado.'
    );

});