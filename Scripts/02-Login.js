
// ============================================================
// ZORAVISION - LOGIN
// SUPABASE AUTH + TABELA CLIENTES + GOOGLE
// ============================================================


// ============================================================
// 1. INICIALIZAÇÃO
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {

    const formLogin =
        document.getElementById('form-login');

    const btnGoogle =
        document.getElementById('btn-login-google');


    // ========================================================
    // CONEXÃO COM SUPABASE
    // ========================================================

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
        '🔥 ZORAVISION - 02-Login.js carregado'
    );

    console.log(
        '✅ Cliente Supabase disponível'
    );


    // ========================================================
    // 2. PROCESSAR RETORNO DO GOOGLE
    // ========================================================
    //
    // Quando o Google autenticar o usuário, o Supabase
    // retorna para:
    //
    // 02-Login.html
    //
    // Neste momento verificamos se existe uma sessão real.
    //
    // ========================================================

    try {

        const {
            data: sessionData,
            error: sessionError
        } =
            await supabaseClient.auth.getSession();


        if (sessionError) {

            console.error(
                '❌ Erro ao verificar sessão inicial:',
                sessionError
            );

        } else {

            const session =
                sessionData?.session;


            if (session?.user) {

                console.log(
                    '🔐 Sessão Supabase encontrada.'
                );

                console.log(
                    '👤 Usuário:',
                    session.user.email
                );


                // ==================================================
                // PROCESSAR USUÁRIO AUTENTICADO
                // ==================================================

                const resultado =
                    await processarUsuarioAutenticado(
                        supabaseClient,
                        session.user
                    );


                if (
                    resultado &&
                    resultado.sucesso
                ) {

                    console.log(
                        '✅ Usuário OAuth processado com sucesso.'
                    );


                    // ==================================================
                    // REDIRECIONAR PARA O PERFIL
                    // ==================================================

                    window.location.replace(
                        '03-Meu-perfil.html'
                    );

                    return;
                }

            }

        }

    } catch (erro) {

        console.error(
            '❌ Erro ao processar sessão inicial:',
            erro
        );

    }


    // ========================================================
    // 3. LOGIN COM GOOGLE
    // ========================================================

    if (btnGoogle) {

        btnGoogle.addEventListener(
            'click',
            async () => {

                console.log(
                    '🔵 Iniciando login com Google...'
                );


                // ==============================================
                // DESABILITAR BOTÃO
                // ==============================================

                btnGoogle.disabled =
                    true;

                btnGoogle.style.opacity =
                    '0.6';

                btnGoogle.style.pointerEvents =
                    'none';


                try {

                    const {
                        data,
                        error
                    } =
                        await supabaseClient.auth.signInWithOAuth({

                            provider:
                                'google',

                            options: {

                                redirectTo:
                                    `${window.location.origin}/02-Login.html`

                            }

                        });


                    if (error) {

                        console.error(
                            '❌ Erro no login com Google:',
                            error
                        );

                        alert(
                            'Não foi possível entrar com o Google: ' +
                            error.message
                        );


                        btnGoogle.disabled =
                            false;

                        btnGoogle.style.opacity =
                            '1';

                        btnGoogle.style.pointerEvents =
                            'auto';

                        return;
                    }


                    console.log(
                        '✅ Redirecionamento para o Google iniciado.'
                    );

                    console.log(
                        'Dados OAuth:',
                        data
                    );


                    // O Supabase fará o redirecionamento
                    // automaticamente para o Google.


                } catch (erro) {

                    console.error(
                        '❌ Erro inesperado no login Google:',
                        erro
                    );

                    alert(
                        'Ocorreu um erro ao tentar entrar com o Google.'
                    );


                    btnGoogle.disabled =
                        false;

                    btnGoogle.style.opacity =
                        '1';

                    btnGoogle.style.pointerEvents =
                        'auto';

                }

            }
        );

    } else {

        console.warn(
            '⚠️ Botão "btn-login-google" não encontrado.'
        );

    }


    // ========================================================
    // 4. LOGIN NORMAL
    // ========================================================

    if (!formLogin) {

        console.warn(
            '⚠️ Formulário "form-login" não encontrado.'
        );

        return;
    }


    formLogin.addEventListener(
        'submit',
        async (event) => {

            event.preventDefault();


            // ==================================================
            // CAMPOS
            // ==================================================

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


            // ==================================================
            // VALORES
            // ==================================================

            const email =
                inputEmail.value
                    .trim()
                    .toLowerCase();


            const senha =
                inputSenha.value;


            // ==================================================
            // VALIDAÇÃO
            // ==================================================

            if (!email || !senha) {

                alert(
                    'Por favor, preencha o e-mail e a senha.'
                );

                return;
            }


            // ==================================================
            // BOTÃO ENTRAR
            // ==================================================

            const botaoEntrar =
                formLogin.querySelector(
                    'button[type="submit"]'
                );


            if (botaoEntrar) {

                botaoEntrar.disabled =
                    true;

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


                // ==============================================
                // LOGIN SUPABASE AUTH
                // ==============================================

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


                // ==============================================
                // ERRO AUTH
                // ==============================================

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


                // ==============================================
                // USUÁRIO AUTH
                // ==============================================

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


                // ==============================================
                // CONFIRMAR SESSÃO
                // ==============================================

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

                    await supabaseClient.auth.signOut();

                    alert(
                        'Sua autenticação foi realizada, mas não foi possível confirmar a sessão.'
                    );

                    return;
                }


                if (!sessionData?.session) {

                    console.error(
                        '❌ Login sem sessão ativa.'
                    );

                    await supabaseClient.auth.signOut();

                    alert(
                        'Não foi possível criar sua sessão. Tente novamente.'
                    );

                    return;
                }


                console.log(
                    '✅ Sessão Supabase confirmada.'
                );


                // ==============================================
                // PROCESSAR CLIENTE
                // ==============================================

                const resultado =
                    await processarUsuarioAutenticado(
                        supabaseClient,
                        usuarioAuth
                    );


                if (
                    !resultado ||
                    !resultado.sucesso
                ) {

                    return;
                }


                // ==============================================
                // SUCESSO
                // ==============================================

                alert(
                    'Login realizado com sucesso! Bem-vindo de volta, ' +
                    (resultado.cliente.nome || 'cliente') +
                    ' 🎉'
                );


                // ==============================================
                // REDIRECIONAMENTO
                // ==============================================

                window.location.replace(
                    '03-Meu-perfil.html'
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

                if (botaoEntrar) {

                    botaoEntrar.disabled =
                        false;

                    botaoEntrar.textContent =
                        botaoEntrar.dataset.textoOriginal ||
                        'Entrar na minha conta';

                }

            }

        }
    );

});


// ============================================================
// 5. PROCESSAR USUÁRIO AUTENTICADO
// ============================================================
//
// Esta função é utilizada tanto pelo:
//
// - Login por e-mail/senha
// - Login com Google
//
// ============================================================

async function processarUsuarioAutenticado(
    supabaseClient,
    usuarioAuth
) {

    try {

        if (!usuarioAuth) {

            console.error(
                '❌ Usuário Auth inválido.'
            );

            return {
                sucesso: false
            };
        }


        console.log(
            '🔎 Procurando cliente:',
            usuarioAuth.id
        );


        // ======================================================
        // BUSCAR CLIENTE PELO AUTH_USER_ID
        // ======================================================

        let {
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


        if (clienteError) {

            console.error(
                '❌ Erro ao buscar cliente pelo auth_user_id:',
                clienteError
            );

            await supabaseClient.auth.signOut();

            localStorage.removeItem(
                'usuario_logado'
            );

            localStorage.removeItem(
                'cliente_supabase_id'
            );

            alert(
                'Não foi possível consultar seu cadastro.'
            );

            return {
                sucesso: false
            };
        }


        // ======================================================
        // SE NÃO ENCONTROU, BUSCAR PELO E-MAIL
        // ======================================================

        if (
            !cliente &&
            usuarioAuth.email
        ) {

            console.log(
                '🔎 Cliente não encontrado pelo Auth ID. Procurando pelo e-mail...'
            );


            const respostaEmail =
                await supabaseClient
                    .from('clientes')
                    .select(
                        'id,nome,email,telefone,cpf,ativo,auth_user_id'
                    )
                    .eq(
                        'email',
                        usuarioAuth.email.toLowerCase()
                    )
                    .maybeSingle();


            if (respostaEmail.error) {

                console.error(
                    '❌ Erro ao buscar cliente pelo e-mail:',
                    respostaEmail.error
                );

                await supabaseClient.auth.signOut();

                localStorage.removeItem(
                    'usuario_logado'
                );

                localStorage.removeItem(
                    'cliente_supabase_id'
                );

                alert(
                    'Não foi possível consultar seu cadastro.'
                );

                return {
                    sucesso: false
                };
            }


            if (respostaEmail.data) {

                cliente =
                    respostaEmail.data;


                // ==================================================
                // VINCULAR AUTH_USER_ID
                // ==================================================

                if (!cliente.auth_user_id) {

                    console.log(
                        '🔗 Vinculando cliente ao Auth User...'
                    );


                    const {
                        data: clienteAtualizado,
                        error: erroAtualizacao
                    } =
                        await supabaseClient
                            .from('clientes')
                            .update({

                                auth_user_id:
                                    usuarioAuth.id

                            })
                            .eq(
                                'id',
                                cliente.id
                            )
                            .select(
                                'id,nome,email,telefone,cpf,ativo,auth_user_id'
                            )
                            .single();


                    if (erroAtualizacao) {

                        console.error(
                            '❌ Erro ao vincular cliente:',
                            erroAtualizacao
                        );

                    } else {

                        cliente =
                            clienteAtualizado;

                    }

                }

            }

        }


        // ======================================================
        // CLIENTE NÃO EXISTE
        // ======================================================

        if (!cliente) {

            console.warn(
                '⚠️ Nenhum cliente encontrado.'
            );


            // ==================================================
            // GOOGLE NOVO
            // ==================================================
            //
            // Para um usuário novo do Google, criamos o cadastro
            // automaticamente na tabela clientes.
            //
            // ==================================================

            const nomeGoogle =
                usuarioAuth.user_metadata?.full_name ||
                usuarioAuth.user_metadata?.name ||
                usuarioAuth.email?.split('@')[0] ||
                'Cliente';


            const emailGoogle =
                usuarioAuth.email ||
                '';


            const dadosNovoCliente = {

                nome:
                    nomeGoogle,

                email:
                    emailGoogle,

                telefone:
                    null,

                cpf:
                    null,

                auth_user_id:
                    usuarioAuth.id,

                ativo:
                    true

            };


            console.log(
                '🆕 Criando cliente para usuário Google...'
            );


            const {
                data: novoCliente,
                error: erroNovoCliente
            } =
                await supabaseClient
                    .from('clientes')
                    .insert([
                        dadosNovoCliente
                    ])
                    .select()
                    .single();


            if (erroNovoCliente) {

                console.error(
                    '❌ Erro ao criar cliente Google:',
                    erroNovoCliente
                );

                await supabaseClient.auth.signOut();

                localStorage.removeItem(
                    'usuario_logado'
                );

                localStorage.removeItem(
                    'cliente_supabase_id'
                );

                alert(
                    'Sua conta Google foi autenticada, mas não foi possível criar seu cadastro na loja.'
                );

                return {
                    sucesso: false
                };
            }


            cliente =
                novoCliente;


            console.log(
                '✅ Cliente Google criado:',
                cliente.id
            );

        }


        // ======================================================
        // CONTA DESATIVADA
        // ======================================================

        if (cliente.ativo === false) {

            console.warn(
                '⚠️ Cliente desativado.'
            );

            await supabaseClient.auth.signOut();

            localStorage.removeItem(
                'usuario_logado'
            );

            localStorage.removeItem(
                'cliente_supabase_id'
            );

            alert(
                'Esta conta está desativada. Entre em contato com a loja.'
            );

            return {
                sucesso: false
            };
        }


        // ======================================================
        // CRIAR USUÁRIO LOCAL
        // ======================================================

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


        // ======================================================
        // SALVAR LOCALSTORAGE
        // ======================================================

        localStorage.setItem(
            'usuario_logado',
            JSON.stringify(
                usuarioLogado
            )
        );


        localStorage.setItem(
            'cliente_supabase_id',
            cliente.id
        );


        // ======================================================
        // LOG
        // ======================================================

        console.log(
            '=========================================='
        );

        console.log(
            '✅ USUÁRIO AUTENTICADO COM SUCESSO'
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
            '=========================================='
        );


        return {

            sucesso:
                true,

            cliente,

            usuario:
                usuarioLogado,

            authUser:
                usuarioAuth

        };

    } catch (erro) {

        console.error(
            '❌ Erro ao processar usuário autenticado:',
            erro
        );

        await supabaseClient.auth.signOut();

        localStorage.removeItem(
            'usuario_logado'
        );

        localStorage.removeItem(
            'cliente_supabase_id'
        );

        alert(
            'Ocorreu um erro ao carregar sua conta.'
        );

        return {
            sucesso: false
        };

    }

}

