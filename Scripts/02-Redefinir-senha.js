// ============================================================
// ZORAVISION - REDEFINIÇÃO DE SENHA
// SUPABASE AUTH
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {

    const form =
        document.getElementById(
            'form-redefinir-senha'
        );

    if (!form) {

        console.error(
            'Formulário de redefinição de senha não encontrado.'
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


    console.log(
        '🔥 ZORAVISION - Redefinir-senha.js carregado'
    );


    // ============================================================
    // VERIFICAR SESSÃO DE RECUPERAÇÃO
    // ============================================================

    const {
        data: sessionData,
        error: sessionError
    } = await supabaseClient.auth.getSession();


    if (sessionError) {

        console.error(
            'Erro ao verificar sessão:',
            sessionError
        );

    }


    console.log(
        'Sessão disponível:',
        !!sessionData?.session
    );


    // ============================================================
    // ESCUTAR EVENTOS DO SUPABASE AUTH
    // ============================================================

    supabaseClient.auth.onAuthStateChange(
        async (event, session) => {

            console.log(
                'Evento Auth:',
                event
            );


            if (event === 'PASSWORD_RECOVERY') {

                console.log(
                    '🔐 Sessão de recuperação de senha detectada.'
                );

                console.log(
                    'Usuário:',
                    session?.user?.email
                );

            }

        }
    );


    // ============================================================
    // SUBMIT
    // ============================================================

    form.addEventListener(
        'submit',
        async (event) => {

            event.preventDefault();


            // ====================================================
            // CAMPOS
            // ====================================================

            const inputNovaSenha =
                document.getElementById(
                    'nova-senha'
                );

            const inputConfirmarSenha =
                document.getElementById(
                    'confirmar-nova-senha'
                );


            if (
                !inputNovaSenha ||
                !inputConfirmarSenha
            ) {

                alert(
                    'Erro: campos de senha não encontrados.'
                );

                return;
            }


            const novaSenha =
                inputNovaSenha.value;

            const confirmarSenha =
                inputConfirmarSenha.value;


            // ====================================================
            // VALIDAÇÕES
            // ====================================================

            if (
                !novaSenha ||
                !confirmarSenha
            ) {

                alert(
                    'Preencha os dois campos de senha.'
                );

                return;
            }


            if (
                novaSenha.length < 6
            ) {

                alert(
                    'A nova senha deve possuir pelo menos 6 caracteres.'
                );

                return;
            }


            if (
                novaSenha !== confirmarSenha
            ) {

                alert(
                    'As senhas não coincidem.'
                );

                return;
            }


            // ====================================================
            // BOTÃO
            // ====================================================

            const botao =
                form.querySelector(
                    'button[type="submit"]'
                );


            if (botao) {

                botao.disabled = true;

                botao.dataset.textoOriginal =
                    botao.textContent;

                botao.textContent =
                    'Salvando...';

            }


            try {

                console.log(
                    '🔐 Atualizando senha no Supabase Auth...'
                );


                // =================================================
                // ATUALIZAR SENHA
                // =================================================

                const {
                    data,
                    error
                } = await supabaseClient.auth.updateUser({

                    password:
                        novaSenha

                });


                // =================================================
                // ERRO
                // =================================================

                if (error) {

                    console.error(
                        '❌ Erro ao atualizar senha:',
                        error
                    );


                    alert(
                        'Não foi possível alterar sua senha: ' +
                        error.message
                    );

                    return;
                }


                // =================================================
                // SUCESSO
                // =================================================

                console.log(
                    '✅ Senha atualizada com sucesso.'
                );


                console.log(
                    'Usuário:',
                    data?.user?.email
                );


                alert(
                    'Sua senha foi alterada com sucesso! 🎉'
                );


                // =================================================
                // ENCERRAR SESSÃO
                // =================================================

                await supabaseClient.auth.signOut();


                // =================================================
                // VOLTAR PARA LOGIN
                // =================================================

                window.location.href =
                    '02-Login.html';


            } catch (erro) {

                console.error(
                    '❌ Erro inesperado:',
                    erro
                );


                alert(
                    'Ocorreu um erro inesperado ao redefinir sua senha.'
                );

            } finally {

                if (botao) {

                    botao.disabled = false;

                    botao.textContent =
                        botao.dataset.textoOriginal ||
                        'Salvar nova senha';

                }

            }

        }
    );

});