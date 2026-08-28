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
// - Verificação da sessão
//
// IMPORTANTE:
// - usuario.id = ID da tabela clientes
// - usuario.auth_user_id = ID do Supabase Auth
// - Logout direciona para 02-Login.html
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
            '❌ Erro ao ler usuário logado:',
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
            '❌ Usuário inválido para salvar.'
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
            '❌ Erro ao salvar usuário logado:',
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


    localStorage.removeItem(
        'cliente_supabase_id'
    );


    console.log(
        '🧹 Dados locais de autenticação removidos.'
    );
}


// ============================================================
// 4. LIMPAR DADOS DA SESSÃO
// ============================================================

function limparDadosSessaoCliente() {

    const chaves = [

        'usuario_logado',

        'cliente_supabase_id',

        'pedido_atual',

        'pedido_pix_atual',

        'pagamento_pix_atual',

        'pedido_id_pix_verificacao',

        'produto_origem_checkout'
    ];


    chaves.forEach(
        chave => {

            localStorage.removeItem(
                chave
            );

        }
    );


    console.log(
        '🧹 Dados da sessão do cliente removidos.'
    );
}


// ============================================================
// 5. BUSCAR CLIENTE NO SUPABASE
// ============================================================

async function buscarClienteNoSupabase(
    usuario
) {

    if (!usuario) {
        return null;
    }


    const supabase =
        obterSupabase();


    if (!supabase) {

        console.error(
            '❌ Supabase não está disponível.'
        );

        return null;
    }


    try {

        // ========================================================
        // 5.1 - TENTAR PELO AUTH USER ID
        // ========================================================

        if (
            usuario.auth_user_id
        ) {

            const respostaAuth =
                await supabase
                    .from('clientes')
                    .select('*')
                    .eq(
                        'auth_user_id',
                        usuario.auth_user_id
                    )
                    .maybeSingle();


            if (respostaAuth.error) {

                console.error(
                    '❌ Erro ao buscar cliente pelo auth_user_id:',
                    respostaAuth.error
                );

                return null;
            }


            if (respostaAuth.data) {

                return respostaAuth.data;
            }
        }


        // ========================================================
        // 5.2 - TENTAR PELO ID DO CLIENTE
        // ========================================================

        if (
            usuario.id
        ) {

            const respostaCliente =
                await supabase
                    .from('clientes')
                    .select('*')
                    .eq(
                        'id',
                        usuario.id
                    )
                    .maybeSingle();


            if (respostaCliente.error) {

                console.error(
                    '❌ Erro ao buscar cliente pelo ID:',
                    respostaCliente.error
                );

                return null;
            }


            if (respostaCliente.data) {

                return respostaCliente.data;
            }
        }


        // ========================================================
        // 5.3 - TENTAR PELO E-MAIL
        // ========================================================

        if (
            usuario.email
        ) {

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
                    '❌ Erro ao buscar cliente pelo e-mail:',
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
            '❌ Erro inesperado ao buscar cliente:',
            erro
        );

        return null;
    }
}


// ============================================================
// 6. CADASTRAR USUÁRIO
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


    if (
        senha.length < 6
    ) {

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

            password:
                senha,

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
            '❌ Erro ao cadastrar usuário no Auth:',
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
            '❌ Erro ao criar cliente:',
            erroCliente
        );

        throw new Error(
            'A conta foi criada no sistema de autenticação, mas não foi possível criar o cadastro do cliente.'
        );
    }


    // ========================================================
    // USUÁRIO LOCAL
    // ========================================================

    const usuarioLocal = {

        id:
            cliente.id,

        auth_user_id:
            cliente.auth_user_id,

        nome:
            cliente.nome || '',

        email:
            cliente.email ||
            authUser.email ||
            '',

        telefone:
            cliente.telefone || '',

        cpf:
            cliente.cpf || ''
    };


    salvarUsuarioLogado(
        usuarioLocal
    );


    localStorage.setItem(
        'cliente_supabase_id',
        cliente.id
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
// 7. LOGIN
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


    // ========================================================
    // LOGIN PELO SUPABASE AUTH
    // ========================================================

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
            '❌ Erro ao fazer login:',
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
                null,

            auth_user_id:
                authUser.id,

            email:
                authUser.email
        });


    // ========================================================
    // CASO CLIENTE EXISTA SEM auth_user_id
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


        if (
            !erroAtualizacao &&
            clienteAtualizado
        ) {

            cliente =
                clienteAtualizado;
        }
    }


    // ========================================================
    // CLIENTE NÃO ENCONTRADO
    // ========================================================

    if (!cliente) {

        console.warn(
            '⚠️ Usuário autenticado, mas cliente não encontrado.'
        );


        await supabase.auth.signOut();


        throw new Error(
            'Sua conta foi autenticada, mas o cadastro da loja não foi encontrado.'
        );
    }


    // ========================================================
    // CONTA DESATIVADA
    // ========================================================

    if (
        cliente.ativo === false
    ) {

        await supabase.auth.signOut();


        throw new Error(
            'Esta conta está desativada. Entre em contato com a loja.'
        );
    }


    // ========================================================
    // CRIAR USUÁRIO LOCAL
    // ========================================================

    const usuarioLocal = {

        // ID DA TABELA clientes
        id:
            cliente.id,

        // ID DO SUPABASE AUTH
        auth_user_id:
            cliente.auth_user_id,

        nome:
            cliente.nome ||
            authUser.user_metadata?.nome ||
            '',

        email:
            cliente.email ||
            authUser.email ||
            '',

        telefone:
            cliente.telefone ||
            '',

        cpf:
            cliente.cpf ||
            ''
    };


    // ========================================================
    // SALVAR LOGIN
    // ========================================================

    salvarUsuarioLogado(
        usuarioLocal
    );


    localStorage.setItem(
        'cliente_supabase_id',
        cliente.id
    );


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
        '=========================================='
    );


    return {

        authUser,

        cliente,

        usuario:
            usuarioLocal
    };
}


// ============================================================
// 8. LOGOUT
// ============================================================
//
// IMPORTANTE:
// O logout:
// 1. encerra a sessão do Supabase;
// 2. remove usuario_logado;
// 3. remove cliente_supabase_id;
// 4. remove dados temporários do pedido/pagamento;
// 5. manda o usuário para 02-Login.html.
//
// O carrinho NÃO é apagado.
// ============================================================

async function fazerLogout() {

    const supabase =
        obterSupabase();


    console.log(
        '🚪 Iniciando logout...'
    );


    try {

        if (supabase) {

            const {
                error
            } =
                await supabase.auth.signOut();


            if (error) {

                console.error(
                    '❌ Erro ao sair do Supabase:',
                    error
                );

            } else {

                console.log(
                    '✅ Sessão Supabase encerrada.'
                );
            }
        }

    } catch (erro) {

        console.error(
            '❌ Erro inesperado ao fazer logout:',
            erro
        );

    } finally {

        // ====================================================
        // LIMPAR DADOS LOCAIS
        // ====================================================

        limparDadosSessaoCliente();


        // ====================================================
        // REDIRECIONAR PARA LOGIN
        // ====================================================
        //
        // replace() é utilizado em vez de href para evitar
        // criar uma nova entrada de logout no histórico.
        //
        // Assim o usuário é enviado diretamente para:
        //
        // 02-Login.html
        //
        // ====================================================

        window.location.replace(
            '02-Login.html'
        );
    }
}


// ============================================================
// 9. VERIFICAR SESSÃO DO SUPABASE
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
                '❌ Erro ao verificar sessão:',
                error
            );


            limparDadosSessaoCliente();


            return null;
        }


        // ====================================================
        // NÃO EXISTE SESSÃO
        // ====================================================

        if (
            !data ||
            !data.session ||
            !data.session.user
        ) {

            limparDadosSessaoCliente();


            return null;
        }


        const authUser =
            data.session.user;


        // ====================================================
        // BUSCAR CLIENTE
        // ====================================================

        const cliente =
            await buscarClienteNoSupabase({

                id:
                    null,

                auth_user_id:
                    authUser.id,

                email:
                    authUser.email
            });


        // ====================================================
        // CLIENTE NÃO EXISTE
        // ====================================================

        if (
            !cliente ||
            !cliente.id
        ) {

            await supabase.auth.signOut();


            limparDadosSessaoCliente();


            return null;
        }


        // ====================================================
        // CONTA DESATIVADA
        // ====================================================

        if (
            cliente.ativo === false
        ) {

            await supabase.auth.signOut();


            limparDadosSessaoCliente();


            return null;
        }


        // ====================================================
        // RECONSTRUIR USUÁRIO LOCAL
        // ====================================================

        const usuarioLocal = {

            id:
                cliente.id,

            auth_user_id:
                cliente.auth_user_id,

            nome:
                cliente.nome ||
                authUser.user_metadata?.nome ||
                '',

            email:
                cliente.email ||
                authUser.email ||
                '',

            telefone:
                cliente.telefone ||
                '',

            cpf:
                cliente.cpf ||
                ''
        };


        salvarUsuarioLogado(
            usuarioLocal
        );


        localStorage.setItem(
            'cliente_supabase_id',
            cliente.id
        );


        return {

            authUser,

            cliente,

            usuario:
                usuarioLocal
        };

    } catch (erro) {

        console.error(
            '❌ Erro ao verificar sessão:',
            erro
        );


        limparDadosSessaoCliente();


        return null;
    }
}


// ============================================================
// 10. ATUALIZAR PERFIL
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
            '❌ Erro ao atualizar perfil:',
            error
        );

        throw new Error(
            'Não foi possível atualizar seus dados.'
        );
    }


    const usuarioAtualizado = {

        id:
            data.id,

        auth_user_id:
            data.auth_user_id,

        nome:
            data.nome,

        email:
            data.email,

        telefone:
            data.telefone || '',

        cpf:
            data.cpf || ''
    };


    salvarUsuarioLogado(
        usuarioAtualizado
    );


    localStorage.setItem(
        'cliente_supabase_id',
        data.id
    );


    return data;
}


// ============================================================
// 11. RECUPERAR SENHA
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
            '❌ Erro ao solicitar recuperação:',
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
// 12. ALTERAR SENHA
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


    if (
        novaSenha.length < 6
    ) {

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
            '❌ Erro ao alterar senha:',
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
// 13. VERIFICAR SE ESTÁ LOGADO
// ============================================================
//
// Esta função verifica apenas a existência dos dados locais.
//
// Para verificar a sessão REAL do Supabase, utilize:
// verificarSessaoUsuario()
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
// 14. EXIGIR LOGIN
// ============================================================
//
// Se o usuário não estiver logado, vai para:
//
// 02-Login.html
//
// ============================================================

function exigirLogin(
    pagina = '02-Login.html'
) {

    if (
        usuarioEstaLogado()
    ) {

        return true;
    }


    removerUsuarioLogado();


    window.location.replace(
        pagina
    );


    return false;
}


// ============================================================
// 15. EXPORTAÇÕES GLOBAIS
// ============================================================

window.obterUsuarioLogado =
    obterUsuarioLogado;


window.salvarUsuarioLogado =
    salvarUsuarioLogado;


window.removerUsuarioLogado =
    removerUsuarioLogado;


window.limparDadosSessaoCliente =
    limparDadosSessaoCliente;


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


// ============================================================
// FIM DO 02-USUARIOS.JS
// ============================================================