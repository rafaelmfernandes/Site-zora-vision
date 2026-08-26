// ============================================================
// ZORAVISION - USUÁRIO / CLIENTE
// ============================================================
//
// Responsabilidades deste arquivo:
// - Cadastro
// - Login
// - Logout
// - Usuário logado
// - Consulta do cliente
// - Atualização do perfil
// - Recuperação de senha
// - Alteração de senha
//
// A conexão com o Supabase fica exclusivamente em supabase.js.
// ============================================================


// ============================================================
// 1. OBTER USUÁRIO LOGADO
// ============================================================

function obterUsuarioLogado() {

    try {

        const dados =
            localStorage.getItem(
                'usuario_logado'
            );


        if (!dados) {
            return null;
        }


        const usuario =
            JSON.parse(dados);


        if (
            !usuario ||
            !usuario.id ||
            !usuario.email
        ) {
            return null;
        }


        return usuario;

    } catch (erro) {

        console.error(
            'Erro ao ler usuário logado:',
            erro
        );

        return null;
    }
}


// ============================================================
// 2. SALVAR USUÁRIO LOGADO
// ============================================================

function salvarUsuarioLogado(usuario) {

    if (
        !usuario ||
        !usuario.id ||
        !usuario.email
    ) {

        console.error(
            'Usuário inválido para salvar.'
        );

        return false;
    }


    try {

        localStorage.setItem(
            'usuario_logado',
            JSON.stringify(usuario)
        );

        return true;

    } catch (erro) {

        console.error(
            'Erro ao salvar usuário logado:',
            erro
        );

        return false;
    }
}


// ============================================================
// 3. REMOVER USUÁRIO LOGADO
// ============================================================

function removerUsuarioLogado() {

    localStorage.removeItem(
        'usuario_logado'
    );
}


// ============================================================
// 4. BUSCAR CLIENTE NO SUPABASE
// ============================================================

async function buscarClienteNoSupabase(
    usuario
) {

    if (
        !usuario ||
        !usuario.id
    ) {
        return null;
    }


    const supabase =
        obterSupabase();


    if (!supabase) {

        console.error(
            'Supabase não está disponível.'
        );

        return null;
    }


    try {

        // Primeiro tenta localizar pelo auth_user_id.
        const respostaAuth =
            await supabase
                .from('clientes')
                .select('*')
                .eq(
                    'auth_user_id',
                    usuario.id
                )
                .maybeSingle();


        if (respostaAuth.error) {

            console.error(
                'Erro ao buscar cliente pelo auth_user_id:',
                respostaAuth.error
            );

            return null;
        }


        if (respostaAuth.data) {

            return respostaAuth.data;
        }


        // Caso não encontre pelo auth_user_id,
        // tenta pelo e-mail.
        if (usuario.email) {

            const respostaEmail =
                await supabase
                    .from('clientes')
                    .select('*')
                    .eq(
                        'email',
                        usuario.email
                    )
                    .maybeSingle();


            if (respostaEmail.error) {

                console.error(
                    'Erro ao buscar cliente pelo e-mail:',
                    respostaEmail.error
                );

                return null;
            }


            if (respostaEmail.data) {

                return respostaEmail.data;
            }
        }


        return null;

    } catch (erro) {

        console.error(
            'Erro inesperado ao buscar cliente:',
            erro
        );

        return null;
    }
}


// ============================================================
// 5. CADASTRAR USUÁRIO
// ============================================================

async function cadastrarUsuario({
    nome,
    email,
    telefone,
    cpf,
    senha
}) {

    const supabase =
        obterSupabase();


    if (!supabase) {

        throw new Error(
            'Supabase não está disponível.'
        );
    }


    nome =
        String(nome || '')
            .trim();


    email =
        String(email || '')
            .trim()
            .toLowerCase();


    telefone =
        String(telefone || '')
            .trim();


    cpf =
        String(cpf || '')
            .trim();


    senha =
        String(senha || '');


    if (
        !nome ||
        !email ||
        !senha
    ) {

        throw new Error(
            'Preencha os campos obrigatórios.'
        );
    }


    if (senha.length < 6) {

        throw new Error(
            'A senha deve possuir pelo menos 6 caracteres.'
        );
    }


    // ========================================================
    // CRIAR USUÁRIO NO SUPABASE AUTH
    // ========================================================

    const {
        data: dadosAuth,
        error: erroAuth
    } =
        await supabase.auth.signUp({

            email,
            password: senha,

            options: {

                data: {
                    nome,
                    telefone,
                    cpf
                }
            }
        });


    if (erroAuth) {

        console.error(
            'Erro ao cadastrar usuário no Auth:',
            erroAuth
        );

        throw new Error(
            erroAuth.message ||
            'Não foi possível criar a conta.'
        );
    }


    if (
        !dadosAuth ||
        !dadosAuth.user
    ) {

        throw new Error(
            'O Supabase não retornou o usuário criado.'
        );
    }


    const authUser =
        dadosAuth.user;


    // ========================================================
    // CRIAR CLIENTE NA TABELA clientes
    // ========================================================

    const dadosCliente = {

        nome,

        email,

        telefone:
            telefone || null,

        cpf:
            cpf || null,

        auth_user_id:
            authUser.id,

        ativo:
            true
    };


    const {
        data: cliente,
        error: erroCliente
    } =
        await supabase
            .from('clientes')
            .insert([
                dadosCliente
            ])
            .select()
            .single();


    if (erroCliente) {

        console.error(
            'Erro ao criar cliente na tabela clientes:',
            erroCliente
        );

        throw new Error(
            'A conta foi criada no sistema de autenticação, mas não foi possível criar o cadastro do cliente.'
        );
    }


    // ========================================================
    // SALVAR USUÁRIO LOCALMENTE
    // ========================================================

    const usuarioLocal = {

        id:
            authUser.id,

        email:
            authUser.email,

        nome:
            cliente.nome,

        cliente_id:
            cliente.id
    };


    salvarUsuarioLogado(
        usuarioLocal
    );


    return {

        authUser,

        cliente,

        usuario:
            usuarioLocal,

        emailConfirmacaoNecessaria:
            !dadosAuth.session
    };
}


// ============================================================
// 6. LOGIN
// ============================================================

async function fazerLogin(
    email,
    senha
) {

    const supabase =
        obterSupabase();


    if (!supabase) {

        throw new Error(
            'Supabase não está disponível.'
        );
    }


    email =
        String(email || '')
            .trim()
            .toLowerCase();


    senha =
        String(senha || '');


    if (
        !email ||
        !senha
    ) {

        throw new Error(
            'Informe seu e-mail e sua senha.'
        );
    }


    const {
        data,
        error
    } =
        await supabase.auth.signInWithPassword({

            email,

            password:
                senha
        });


    if (error) {

        console.error(
            'Erro ao fazer login:',
            error
        );

        throw new Error(
            error.message ||
            'E-mail ou senha inválidos.'
        );
    }


    if (
        !data ||
        !data.user
    ) {

        throw new Error(
            'Não foi possível identificar o usuário.'
        );
    }


    const authUser =
        data.user;


    // ========================================================
    // BUSCAR CLIENTE
    // ========================================================

    let cliente =
        await buscarClienteNoSupabase({

            id:
                authUser.id,

            email:
                authUser.email
        });


    // ========================================================
    // CASO O CLIENTE EXISTE, MAS AINDA NÃO POSSUI
    // auth_user_id, TENTA VINCULAR
    // ========================================================

    if (
        cliente &&
        cliente.id &&
        !cliente.auth_user_id
    ) {

        const {
            data: clienteAtualizado,
            error: erroAtualizacao
        } =
            await supabase
                .from('clientes')
                .update({

                    auth_user_id:
                        authUser.id
                })
                .eq(
                    'id',
                    cliente.id
                )
                .select()
                .single();


        if (!erroAtualizacao) {

            cliente =
                clienteAtualizado;
        }
    }


    if (!cliente) {

        console.warn(
            'Usuário autenticado, mas cliente não encontrado na tabela clientes.'
        );
    }


    const usuarioLocal = {

        id:
            authUser.id,

        email:
            authUser.email,

        nome:
            cliente?.nome ||
            authUser.user_metadata?.nome ||
            '',

        cliente_id:
            cliente?.id ||
            null
    };


    salvarUsuarioLogado(
        usuarioLocal
    );


    return {

        authUser,

        cliente,

        usuario:
            usuarioLocal
    };
}


// ============================================================
// 7. LOGOUT
// ============================================================

async function fazerLogout() {

    const supabase =
        obterSupabase();


    try {

        if (supabase) {

            const {
                error
            } =
                await supabase.auth.signOut();


            if (error) {

                console.error(
                    'Erro ao sair do Supabase:',
                    error
                );
            }
        }

    } catch (erro) {

        console.error(
            'Erro inesperado ao fazer logout:',
            erro
        );

    } finally {

        removerUsuarioLogado();
    }
}


// ============================================================
// 8. VERIFICAR SESSÃO DO SUPABASE
// ============================================================

async function verificarSessaoUsuario() {

    const supabase =
        obterSupabase();


    if (!supabase) {
        return null;
    }


    try {

        const {
            data,
            error
        } =
            await supabase.auth.getSession();


        if (error) {

            console.error(
                'Erro ao verificar sessão:',
                error
            );

            return null;
        }


        if (
            !data ||
            !data.session ||
            !data.session.user
        ) {

            return null;
        }


        const authUser =
            data.session.user;


        const cliente =
            await buscarClienteNoSupabase({

                id:
                    authUser.id,

                email:
                    authUser.email
            });


        const usuarioLocal = {

            id:
                authUser.id,

            email:
                authUser.email,

            nome:
                cliente?.nome ||
                authUser.user_metadata?.nome ||
                '',

            cliente_id:
                cliente?.id ||
                null
        };


        salvarUsuarioLogado(
            usuarioLocal
        );


        return {

            authUser,

            cliente,

            usuario:
                usuarioLocal
        };

    } catch (erro) {

        console.error(
            'Erro ao verificar sessão:',
            erro
        );

        return null;
    }
}


// ============================================================
// 9. ATUALIZAR PERFIL
// ============================================================

async function atualizarPerfilUsuario({
    nome,
    telefone,
    cpf
}) {

    const usuario =
        obterUsuarioLogado();


    if (!usuario) {

        throw new Error(
            'Usuário não está logado.'
        );
    }


    const supabase =
        obterSupabase();


    if (!supabase) {

        throw new Error(
            'Supabase não está disponível.'
        );
    }


    const cliente =
        await buscarClienteNoSupabase(
            usuario
        );


    if (
        !cliente ||
        !cliente.id
    ) {

        throw new Error(
            'Cliente não encontrado.'
        );
    }


    const dados = {

        nome:
            String(nome || '')
                .trim(),

        telefone:
            String(telefone || '')
                .trim() || null,

        cpf:
            String(cpf || '')
                .trim() || null
    };


    if (!dados.nome) {

        throw new Error(
            'O nome é obrigatório.'
        );
    }


    const {
        data,
        error
    } =
        await supabase
            .from('clientes')
            .update(dados)
            .eq(
                'id',
                cliente.id
            )
            .select()
            .single();


    if (error) {

        console.error(
            'Erro ao atualizar perfil:',
            error
        );

        throw new Error(
            'Não foi possível atualizar seus dados.'
        );
    }


    const usuarioAtualizado = {

        ...usuario,

        nome:
            data.nome,

        cliente_id:
            data.id
    };


    salvarUsuarioLogado(
        usuarioAtualizado
    );


    return data;
}


// ============================================================
// 10. RECUPERAR SENHA
// ============================================================

async function recuperarSenha(
    email
) {

    const supabase =
        obterSupabase();


    if (!supabase) {

        throw new Error(
            'Supabase não está disponível.'
        );
    }


    email =
        String(email || '')
            .trim()
            .toLowerCase();


    if (!email) {

        throw new Error(
            'Informe seu e-mail.'
        );
    }


    const {
        error
    } =
        await supabase.auth.resetPasswordForEmail(
            email,
            {
                redirectTo:
                    `${window.location.origin}/Redefinir-senha.html`
            }
        );


    if (error) {

        console.error(
            'Erro ao solicitar recuperação de senha:',
            error
        );

        throw new Error(
            error.message ||
            'Não foi possível enviar o e-mail de recuperação.'
        );
    }


    return true;
}


// ============================================================
// 11. ALTERAR SENHA
// ============================================================

async function alterarSenha(
    novaSenha
) {

    const supabase =
        obterSupabase();


    if (!supabase) {

        throw new Error(
            'Supabase não está disponível.'
        );
    }


    novaSenha =
        String(novaSenha || '');


    if (novaSenha.length < 6) {

        throw new Error(
            'A nova senha deve possuir pelo menos 6 caracteres.'
        );
    }


    const {
        data,
        error
    } =
        await supabase.auth.updateUser({

            password:
                novaSenha
        });


    if (error) {

        console.error(
            'Erro ao alterar senha:',
            error
        );

        throw new Error(
            error.message ||
            'Não foi possível alterar a senha.'
        );
    }


    return data;
}


// ============================================================
// 12. VERIFICAR SE ESTÁ LOGADO
// ============================================================

function usuarioEstaLogado() {

    const usuario =
        obterUsuarioLogado();


    return !!(
        usuario &&
        usuario.id &&
        usuario.email
    );
}


// ============================================================
// 13. REDIRECIONAR SE NÃO ESTIVER LOGADO
// ============================================================

function exigirLogin(
    pagina = 'Login.html'
) {

    if (usuarioEstaLogado()) {
        return true;
    }


    window.location.href =
        pagina;


    return false;
}


// ============================================================
// 14. EXPORTAÇÕES GLOBAIS
// ============================================================

window.obterUsuarioLogado =
    obterUsuarioLogado;

window.salvarUsuarioLogado =
    salvarUsuarioLogado;

window.removerUsuarioLogado =
    removerUsuarioLogado;

window.buscarClienteNoSupabase =
    buscarClienteNoSupabase;

window.cadastrarUsuario =
    cadastrarUsuario;

window.fazerLogin =
    fazerLogin;

window.fazerLogout =
    fazerLogout;

window.verificarSessaoUsuario =
    verificarSessaoUsuario;

window.atualizarPerfilUsuario =
    atualizarPerfilUsuario;

window.recuperarSenha =
    recuperarSenha;

window.alterarSenha =
    alterarSenha;

window.usuarioEstaLogado =
    usuarioEstaLogado;

window.exigirLogin =
    exigirLogin;