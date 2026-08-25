// ============================================================
// ZORAVISION - RECUPERAÇÃO DE SENHA
// SUPABASE AUTH
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

    const form =
        document.getElementById(
            'form-recuperar-senha'
        );


    // ============================================================
    // VERIFICAR FORMULÁRIO
    // ============================================================

    if (!form) {

        console.error(
            'Erro: formulário de recuperação de senha não encontrado.'
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
        '🔥 ZORAVISION - Recuperar-senha.js carregado'
    );


    // ============================================================
    // ENVIO DO FORMULÁRIO
    // ============================================================

    form.addEventListener(
        'submit',
        async (event) => {

            event.preventDefault();


            // ====================================================
            // CAMPO DE E-MAIL
            // ====================================================

            const inputEmail =
                document.getElementById(
                    'email-recuperacao'
                );


            if (!inputEmail) {

                alert(
                    'Erro: campo de e-mail não encontrado.'
                );

                return;
            }


            const email =
                inputEmail.value
                    .trim()
                    .toLowerCase();


            // ====================================================
            // VALIDAR E-MAIL
            // ====================================================

            if (!email) {

                alert(
                    'Digite seu e-mail.'
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
                    'Enviando...';

            }


            try {

                console.log(
                    '📧 Solicitando recuperação para:',
                    email
                );


                // =================================================
                // SOLICITAR RECUPERAÇÃO
                // =================================================

                const {
                    error
                } =
                    await supabaseClient.auth
                        .resetPasswordForEmail(
                            email,
                            {
                                redirectTo:
                                    window.location.origin +
                                    '/Redefinir-senha.html'
                            }
                        );


                // =================================================
                // ERRO
                // =================================================

                if (error) {

                    console.error(
                        '❌ Erro ao solicitar recuperação:',
                        error
                    );


                    if (
                        error.message
                            ?.toLowerCase()
                            .includes(
                                'rate limit'
                            )
                    ) {

                        alert(
                            'O limite de envio de e-mails foi atingido temporariamente. Aguarde alguns minutos e tente novamente.'
                        );

                    } else {

                        alert(
                            'Não foi possível enviar o e-mail de recuperação: ' +
                            error.message
                        );

                    }

                    return;
                }


                // =================================================
                // SUCESSO
                // =================================================

                console.log(
                    '✅ E-mail de recuperação solicitado.'
                );


                alert(
                    'Se este e-mail estiver cadastrado, você receberá um link para redefinir sua senha. 📧'
                );


                // =================================================
                // LIMPAR FORMULÁRIO
                // =================================================

                form.reset();


            } catch (erro) {

                console.error(
                    '❌ Erro inesperado:',
                    erro
                );


                alert(
                    'Ocorreu um erro inesperado. Tente novamente mais tarde.'
                );


            } finally {

                if (botao) {

                    botao.disabled = false;

                    botao.textContent =
                        botao.dataset.textoOriginal ||
                        'Enviar link de recuperação';

                }

            }

        }
    );

});