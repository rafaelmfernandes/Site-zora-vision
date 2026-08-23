
// ============================================================
// ZORAVISION - LOGIN INTEGRADO AO SUPABASE
// Tabela: clientes
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

    const formLogin = document.getElementById('form-login');

    if (!formLogin) {
        console.error(
            'Erro: Formulário com ID "form-login" não foi encontrado no HTML.'
        );
        return;
    }

    formLogin.addEventListener('submit', async (event) => {

        event.preventDefault();

        // ====================================================
        // 1. CAMPOS DO FORMULÁRIO
        // ====================================================

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
            inputSenha.value.trim();

        if (!email || !senha) {

            alert(
                'Por favor, preencha o e-mail e a senha.'
            );

            return;
        }


        // ====================================================
        // 2. CONEXÃO COM SUPABASE
        // ====================================================

        const supabaseConn =
            typeof _supabase !== 'undefined'
                ? _supabase
                : window._supabase;

        if (!supabaseConn) {

            console.error(
                'Cliente Supabase não encontrado.'
            );

            alert(
                'Erro de conexão com o banco de dados. Recarregue a página e tente novamente.'
            );

            return;
        }


        // ====================================================
        // 3. BUSCAR CLIENTE
        // ====================================================

        try {

            console.log(
                '🔎 Verificando login:',
                email
            );


            const {
                data: cliente,
                error
            } = await supabaseConn

                .from('clientes')

                .select(
                    'id,nome,email,telefone,cpf,senha_hash,ativo'
                )

                .eq(
                    'email',
                    email
                )

                .maybeSingle();


            // =================================================
            // 4. ERRO DE CONSULTA
            // =================================================

            if (error) {

                console.error(
                    'Erro ao consultar cliente:',
                    error
                );

                alert(
                    'Não foi possível verificar seus dados. Tente novamente.'
                );

                return;
            }


            // =================================================
            // 5. CLIENTE NÃO ENCONTRADO
            // =================================================

            if (!cliente) {

                console.warn(
                    'Cliente não encontrado:',
                    email
                );

                alert(
                    'E-mail ou senha incorretos. Verifique e tente novamente.'
                );

                return;
            }


            // =================================================
            // 6. VERIFICAR SENHA
            // =================================================

            if (
                cliente.senha_hash !== senha
            ) {

                console.warn(
                    'Senha incorreta para:',
                    email
                );

                alert(
                    'E-mail ou senha incorretos. Verifique e tente novamente.'
                );

                return;
            }


            // =================================================
            // 7. VERIFICAR CONTA ATIVA
            // =================================================

            if (
                cliente.ativo === false
            ) {

                alert(
                    'Esta conta está desativada. Entre em contato com a loja.'
                );

                return;
            }


            // =================================================
            // 8. CRIAR SESSÃO LOCAL
            // =================================================
            //
            // IMPORTANTE:
            // Nunca salvamos senha/senha_hash no localStorage.
            //

            const usuarioLogado = {

                id:
                    cliente.id,

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


            // Mantém também o ID separado porque
            // o restante da loja utiliza essa chave.

            localStorage.setItem(
                'cliente_supabase_id',
                cliente.id
            );


            // =================================================
            // 9. LOG DE SUCESSO
            // =================================================

            console.log(
                '✅ LOGIN REALIZADO COM SUCESSO'
            );

            console.log(
                'Cliente ID:',
                cliente.id
            );

            console.log(
                'Cliente:',
                cliente.nome
            );

            console.log(
                'E-mail:',
                cliente.email
            );


            // =================================================
            // 10. AVISO AO USUÁRIO
            // =================================================

            alert(
                'Login realizado com sucesso! Bem-vindo de volta, ' +
                (cliente.nome || 'cliente') +
                ' 🎉'
            );


            // =================================================
            // 11. REDIRECIONAMENTO
            // =================================================

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

        }

    });

});
