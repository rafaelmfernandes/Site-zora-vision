
// ============================================================
// ZORAVISION - DADOS PESSOAIS
// SUPABASE AUTH + CLIENTES + CPF + TELEFONE + FOTO
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
    // FOTO DE PERFIL
    // ============================================================

    const inputFoto =
        document.getElementById('foto-perfil');

    const previewFoto =
        document.getElementById('foto-perfil-preview');

    const btnAlterarFoto =
        document.getElementById('btn-alterar-foto');

    const btnRemoverFoto =
        document.getElementById('btn-remover-foto');


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
    // CONEXÃO SUPABASE
    // ============================================================

    const supabaseConn =
        window.supabaseClient ||
        window._supabase;


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
        } =
            await supabaseConn.auth.getSession();


        if (error) {

            console.error(
                '❌ Erro ao verificar sessão Auth:',
                error
            );

            alert(
                'Não foi possível verificar sua sessão. Faça login novamente.'
            );

            window.location.href =
                '02-Login.html';

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
                '02-Login.html';

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


    }
    catch (erro) {

        console.error(
            '❌ Erro inesperado ao verificar sessão:',
            erro
        );

        alert(
            'Ocorreu um erro ao verificar sua sessão.'
        );

        window.location.href =
            '02-Login.html';

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
        } =
            await supabaseConn
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
                '❌ Cliente não encontrado:',
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
                '02-Login.html';

            return;
        }


        // ========================================================
        // CONTA DESATIVADA
        // ========================================================

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
                '02-Login.html';

            return;
        }


        clienteAtual =
            cliente;


        // ========================================================
        // PREENCHER NOME
        // ========================================================

        if (inputNome) {

            inputNome.value =
                cliente.nome || '';

        }


        // ========================================================
        // PREENCHER E-MAIL
        // ========================================================

        if (inputEmail) {

            inputEmail.value =
                cliente.email ||
                usuarioAuth.email ||
                '';

        }


        // ========================================================
        // PREENCHER TELEFONE
        // ========================================================

        if (inputTelefone) {

            inputTelefone.value =
                formatarTelefone(
                    cliente.telefone || ''
                );

        }


        // ========================================================
        // PREENCHER CPF
        // ========================================================

        if (inputCpf) {

            inputCpf.value =
                formatarCPF(
                    cliente.cpf || ''
                );

        }


        // ========================================================
        // CARREGAR FOTO
        // ========================================================

        await carregarFotoPerfil();


        // ========================================================
        // ATUALIZAR LOCALSTORAGE
        // ========================================================

        atualizarLocalStorage();


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
            'Telefone:',
            cliente.telefone
        );

        console.log(
            'CPF:',
            cliente.cpf
        );

        console.log(
            '=========================================='
        );


    }
    catch (erro) {

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
    // MÁSCARA TELEFONE
    // ============================================================

    if (inputTelefone) {

        inputTelefone.addEventListener(
            'input',
            () => {

                inputTelefone.value =
                    formatarTelefone(
                        inputTelefone.value
                    );

            }
        );

    }


    // ============================================================
    // MÁSCARA CPF
    // ============================================================

    if (inputCpf) {

        inputCpf.addEventListener(
            'input',
            () => {

                inputCpf.value =
                    formatarCPF(
                        inputCpf.value
                    );

            }
        );

    }


    // ============================================================
    // BOTÃO ALTERAR FOTO
    // ============================================================

    if (
        btnAlterarFoto &&
        inputFoto
    ) {

        btnAlterarFoto.addEventListener(
            'click',
            () => {

                console.log(
                    '📷 Abrindo seletor de foto...'
                );

                inputFoto.click();

            }
        );

    }
    else {

        console.warn(
            '⚠️ Botão de alterar foto ou input de foto não encontrado.'
        );

    }


    // ============================================================
    // SELECIONAR FOTO
    // ============================================================

    if (inputFoto) {

        inputFoto.addEventListener(
            'change',
            async () => {

                const arquivo =
                    inputFoto.files?.[0];


                if (!arquivo) {

                    return;
                }


                // ================================================
                // TIPO
                // ================================================

                const tiposPermitidos = [
                    'image/jpeg',
                    'image/png',
                    'image/webp'
                ];


                if (
                    !tiposPermitidos.includes(
                        arquivo.type
                    )
                ) {

                    alert(
                        'Escolha uma imagem JPG, PNG ou WEBP.'
                    );

                    inputFoto.value =
                        '';

                    return;
                }


                // ================================================
                // TAMANHO
                // ================================================

                if (
                    arquivo.size >
                    5 * 1024 * 1024
                ) {

                    alert(
                        'A foto deve ter no máximo 5 MB.'
                    );

                    inputFoto.value =
                        '';

                    return;
                }


                // ================================================
                // ENVIAR
                // ================================================

                await enviarFotoPerfil(
                    arquivo
                );

            }
        );

    }


    // ============================================================
    // BOTÃO REMOVER FOTO
    // ============================================================

    if (btnRemoverFoto) {

        btnRemoverFoto.addEventListener(
            'click',
            async () => {

                const confirmar =
                    confirm(
                        'Deseja realmente remover sua foto de perfil?'
                    );


                if (!confirmar) {

                    return;
                }


                await removerFotoPerfil();

            }
        );

    }


    // ============================================================
    // SALVAR DADOS PESSOAIS
    // ============================================================

    formDados.addEventListener(
        'submit',
        async event => {

            event.preventDefault();


            if (!clienteAtual) {

                alert(
                    'Os dados do cliente ainda não foram carregados.'
                );

                return;
            }


            // ====================================================
            // VALORES
            // ====================================================

            const nome =
                inputNome.value.trim();


            const email =
                inputEmail.value
                    .trim()
                    .toLowerCase();


            const telefone =
                removerNaoNumeros(
                    inputTelefone.value
                );


            const cpf =
                removerNaoNumeros(
                    inputCpf.value
                );


            // ====================================================
            // VALIDAR NOME
            // ====================================================

            if (!nome) {

                alert(
                    'Digite seu nome completo.'
                );

                inputNome.focus();

                return;
            }


            // ====================================================
            // VALIDAR E-MAIL
            // ====================================================

            if (!email) {

                alert(
                    'Digite seu e-mail.'
                );

                inputEmail.focus();

                return;
            }


            // ====================================================
            // VALIDAR CPF
            // ============================================================

            if (
                cpf &&
                !validarCPF(cpf)
            ) {

                alert(
                    'O CPF informado é inválido.'
                );

                inputCpf.focus();

                return;
            }


            try {

                // ==================================================
                // VERIFICAR E-MAIL DUPLICADO
                // ==================================================

                const {
                    data: emailExistente,
                    error: erroEmail
                } =
                    await supabaseConn
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
                // VERIFICAR CPF DUPLICADO
                // ==================================================

                if (cpf) {

                    const {
                        data: cpfExistente,
                        error: erroCpf
                    } =
                        await supabaseConn
                            .from('clientes')
                            .select('id')
                            .eq(
                                'cpf',
                                cpf
                            )
                            .neq(
                                'id',
                                clienteAtual.id
                            )
                            .maybeSingle();


                    if (erroCpf) {

                        console.error(
                            '❌ Erro ao verificar CPF:',
                            erroCpf
                        );

                        alert(
                            'Não foi possível verificar o CPF.'
                        );

                        return;
                    }


                    if (cpfExistente) {

                        alert(
                            'Este CPF já está cadastrado em outra conta.'
                        );

                        inputCpf.focus();

                        return;
                    }

                }


                // ==================================================
                // ATUALIZAR CLIENTE
                // ==================================================

                console.log(
                    '💾 Salvando dados pessoais...'
                );


                const {
                    data: clienteAtualizado,
                    error: erroAtualizacao
                } =
                    await supabaseConn
                        .from('clientes')
                        .update({

                            nome:
                                nome,

                            email:
                                email,

                            telefone:
                                telefone ||
                                null,

                            cpf:
                                cpf ||
                                null,

                            updated_at:
                                new Date().toISOString()

                        })
                        .eq(
                            'id',
                            clienteAtual.id
                        )
                        .select(
                            'id,nome,email,telefone,cpf,ativo,auth_user_id'
                        )
                        .single();


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
                // ATUALIZAR CLIENTE LOCAL
                // ==================================================

                clienteAtual =
                    clienteAtualizado;


                // ==================================================
                // ATUALIZAR CAMPOS
                // ==================================================

                inputTelefone.value =
                    formatarTelefone(
                        clienteAtual.telefone || ''
                    );


                inputCpf.value =
                    formatarCPF(
                        clienteAtual.cpf || ''
                    );


                // ==================================================
                // ATUALIZAR E-MAIL AUTH
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
                        '📧 Atualizando e-mail do Auth...'
                    );


                    const {
                        error: erroAuthEmail
                    } =
                        await supabaseConn.auth.updateUser({

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

                    }
                    else {

                        usuarioAuth.email =
                            email;

                    }

                }


                // ==================================================
                // LOCALSTORAGE
                // ==================================================

                atualizarLocalStorage();


                console.log(
                    '=========================================='
                );

                console.log(
                    '✅ DADOS PESSOAIS ATUALIZADOS'
                );

                console.log(
                    'Nome:',
                    clienteAtual.nome
                );

                console.log(
                    'E-mail:',
                    clienteAtual.email
                );

                console.log(
                    'Telefone:',
                    clienteAtual.telefone
                );

                console.log(
                    'CPF:',
                    clienteAtual.cpf
                );

                console.log(
                    '=========================================='
                );


                alert(
                    'Dados pessoais atualizados com sucesso! 🎉'
                );


            }
            catch (erro) {

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
    // ============================================================

    formSenha.addEventListener(
        'submit',
        async event => {

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
                novaSenha !==
                confirmarSenha
            ) {

                alert(
                    'A nova senha e a confirmação não são iguais.'
                );

                return;
            }


            if (
                senhaAtual ===
                novaSenha
            ) {

                alert(
                    'A nova senha precisa ser diferente da senha atual.'
                );

                return;
            }


            try {

                // ==================================================
                // VALIDAR SENHA ATUAL
                // ==================================================

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
                } =
                    await supabaseConn.auth.signInWithPassword({

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
                            ?.toLowerCase() ||
                        '';


                    if (
                        mensagem.includes(
                            'invalid login credentials'
                        )
                    ) {

                        alert(
                            'A senha atual está incorreta.'
                        );

                    }
                    else {

                        alert(
                            'Não foi possível validar sua senha atual: ' +
                            erroLogin.message
                        );

                    }

                    return;
                }


                // ==================================================
                // ATUALIZAR SENHA
                // ==================================================

                const {
                    error: erroNovaSenha
                } =
                    await supabaseConn.auth.updateUser({

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


                console.log(
                    '✅ SENHA ALTERADA COM SUCESSO'
                );


            }
            catch (erro) {

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
    // FORMATAR CPF
    // ============================================================

    function formatarCPF(valor) {

        let cpf =
            removerNaoNumeros(valor)
                .substring(0, 11);


        if (cpf.length > 9) {

            return cpf.replace(
                /^(\d{3})(\d{3})(\d{3})(\d{2}).*/,
                '$1.$2.$3-$4'
            );

        }


        if (cpf.length > 6) {

            return cpf.replace(
                /^(\d{3})(\d{3})(\d{1,3}).*/,
                '$1.$2.$3'
            );

        }


        if (cpf.length > 3) {

            return cpf.replace(
                /^(\d{3})(\d{1,3}).*/,
                '$1.$2'
            );

        }


        return cpf;

    }


    // ============================================================
    // VALIDAR CPF
    // ============================================================

    function validarCPF(cpf) {

        cpf =
            removerNaoNumeros(cpf);


        if (
            cpf.length !== 11
        ) {

            return false;
        }


        if (
            /^(\d)\1{10}$/.test(cpf)
        ) {

            return false;
        }


        let soma =
            0;


        for (
            let i = 0;
            i < 9;
            i++
        ) {

            soma +=
                Number(cpf[i]) *
                (10 - i);

        }


        let resto =
            (soma * 10) %
            11;


        if (
            resto === 10
        ) {

            resto =
                0;

        }


        if (
            resto !==
            Number(cpf[9])
        ) {

            return false;

        }


        soma =
            0;


        for (
            let i = 0;
            i < 10;
            i++
        ) {

            soma +=
                Number(cpf[i]) *
                (11 - i);

        }


        resto =
            (soma * 10) %
            11;


        if (
            resto === 10
        ) {

            resto =
                0;

        }


        return (
            resto ===
            Number(cpf[10])
        );

    }


    // ============================================================
    // FORMATAR TELEFONE
    // ============================================================

    function formatarTelefone(valor) {

        let telefone =
            removerNaoNumeros(valor)
                .substring(0, 11);


        if (
            telefone.length > 10
        ) {

            return telefone.replace(
                /^(\d{2})(\d{5})(\d{4}).*/,
                '($1) $2-$3'
            );

        }


        if (
            telefone.length > 6
        ) {

            return telefone.replace(
                /^(\d{2})(\d{4})(\d{1,4}).*/,
                '($1) $2-$3'
            );

        }


        if (
            telefone.length > 2
        ) {

            return telefone.replace(
                /^(\d{2})(\d{1,5}).*/,
                '($1) $2'
            );

        }


        return telefone;

    }


    // ============================================================
    // REMOVER NÃO NÚMEROS
    // ============================================================

    function removerNaoNumeros(valor) {

        return String(
            valor || ''
        ).replace(
            /\D/g,
            ''
        );

    }


    // ============================================================
    // ATUALIZAR LOCALSTORAGE
    // ============================================================

    function atualizarLocalStorage() {

        if (!clienteAtual) {

            return;
        }


        const usuarioLogado = {

            id:
                clienteAtual.id,

            auth_user_id:
                clienteAtual.auth_user_id,

            nome:
                clienteAtual.nome ||
                '',

            email:
                clienteAtual.email ||
                usuarioAuth.email ||
                '',

            telefone:
                clienteAtual.telefone ||
                '',

            cpf:
                clienteAtual.cpf ||
                ''

        };


        localStorage.setItem(
            'usuario_logado',
            JSON.stringify(
                usuarioLogado
            )
        );


        localStorage.setItem(
            'cliente_supabase_id',
            clienteAtual.id
        );

    }


    // ============================================================
    // FOTO PADRÃO
    // ============================================================

    function colocarFotoPadrao() {

        if (!previewFoto) {

            return;
        }


        previewFoto.innerHTML =
            '👤';

        previewFoto.style.background =
            '#f1f5f9';

        previewFoto.style.color =
            '#64748b';

        previewFoto.style.fontSize =
            '42px';

        previewFoto.style.backgroundImage =
            'none';


        if (btnRemoverFoto) {

            btnRemoverFoto.style.display =
                'none';

        }

    }


    // ============================================================
    // MOSTRAR FOTO
    // ============================================================

    function mostrarFoto(url) {

        if (!previewFoto) {

            return;
        }


        previewFoto.innerHTML =
            '';


        previewFoto.style.background =
            '#f1f5f9';

        previewFoto.style.backgroundImage =
            `url("${url}")`;

        previewFoto.style.backgroundSize =
            'cover';

        previewFoto.style.backgroundPosition =
            'center';

        previewFoto.style.backgroundRepeat =
            'no-repeat';


        if (btnRemoverFoto) {

            btnRemoverFoto.style.display =
                'inline-block';

        }

    }


    // ============================================================
    // CARREGAR FOTO DO PERFIL
    // ============================================================

    async function carregarFotoPerfil() {

        if (
            !previewFoto ||
            !usuarioAuth?.id
        ) {

            return;
        }


        try {

            // ==================================================
            // IMPORTANTE:
            // A POLÍTICA DO STORAGE USA auth.uid()
            // PORTANTO A PASTA DEVE SER usuarioAuth.id
            // ==================================================

            const pastaUsuario =
                usuarioAuth.id;


            console.log(
                '📷 Procurando foto na pasta:',
                pastaUsuario
            );


            const {
                data: arquivos,
                error
            } =
                await supabaseConn
                    .storage
                    .from('fotos-perfil')
                    .list(
                        pastaUsuario,
                        {
                            limit: 100,
                            sortBy: {
                                column: 'updated_at',
                                order: 'desc'
                            }
                        }
                    );


            if (error) {

                console.warn(
                    '⚠️ Não foi possível consultar a foto:',
                    error
                );

                colocarFotoPadrao();

                return;
            }


            if (
                !arquivos ||
                arquivos.length === 0
            ) {

                console.log(
                    'ℹ️ Nenhuma foto de perfil encontrada.'
                );

                colocarFotoPadrao();

                return;
            }


            // ==================================================
            // PEGAR IMAGEM
            // ==================================================

            const imagens =
                arquivos.filter(
                    arquivo =>
                        arquivo.name &&
                        arquivo.id
                );


            if (
                imagens.length === 0
            ) {

                colocarFotoPadrao();

                return;
            }


            const arquivoMaisRecente =
                imagens.sort(
                    (
                        a,
                        b
                    ) =>
                        new Date(
                            b.updated_at ||
                            b.created_at ||
                            0
                        ) -
                        new Date(
                            a.updated_at ||
                            a.created_at ||
                            0
                        )
                )[0];


            const caminho =
                `${pastaUsuario}/${arquivoMaisRecente.name}`;


            const {
                data: urlData
            } =
                supabaseConn
                    .storage
                    .from('fotos-perfil')
                    .getPublicUrl(
                        caminho
                    );


            if (
                urlData?.publicUrl
            ) {

                mostrarFoto(
                    urlData.publicUrl +
                    '?t=' +
                    Date.now()
                );


                console.log(
                    '✅ Foto carregada:',
                    caminho
                );

            }
            else {

                colocarFotoPadrao();

            }

        }
        catch (erro) {

            console.warn(
                '⚠️ Erro ao carregar foto:',
                erro
            );

            colocarFotoPadrao();

        }

    }


    // ============================================================
    // ENVIAR / ATUALIZAR FOTO
    // ============================================================

    async function enviarFotoPerfil(
        arquivo
    ) {

        if (!usuarioAuth?.id) {

            alert(
                'Usuário não autenticado.'
            );

            return;
        }


        if (!inputFoto) {

            return;
        }


        try {

            if (btnAlterarFoto) {

                btnAlterarFoto.disabled =
                    true;

                btnAlterarFoto.textContent =
                    'Enviando...';

            }


            // ==================================================
            // PASTA CORRETA
            // ==================================================

            const pastaUsuario =
                usuarioAuth.id;


            // ==================================================
            // EXTENSÃO
            // ==================================================

            let extensao =
                arquivo.name
                    .split('.')
                    .pop()
                    .toLowerCase();


            if (
                ![
                    'jpg',
                    'jpeg',
                    'png',
                    'webp'
                ].includes(
                    extensao
                )
            ) {

                extensao =
                    'jpg';

            }


            // ==================================================
            // NOME DO ARQUIVO
            // ==================================================

            const nomeArquivo =
                `perfil-${Date.now()}.${extensao}`;


            const caminho =
                `${pastaUsuario}/${nomeArquivo}`;


            console.log(
                '📤 Enviando foto para:',
                caminho
            );


            // ==================================================
            // BUSCAR FOTOS ANTIGAS
            // ==================================================

            const {
                data: arquivosAntigos,
                error: erroLista
            } =
                await supabaseConn
                    .storage
                    .from('fotos-perfil')
                    .list(
                        pastaUsuario,
                        {
                            limit: 100
                        }
                    );


            if (erroLista) {

                console.warn(
                    '⚠️ Não foi possível listar fotos antigas:',
                    erroLista
                );

            }


            // ==================================================
            // EXCLUIR FOTOS ANTIGAS
            // ==================================================

            if (
                arquivosAntigos &&
                arquivosAntigos.length > 0
            ) {

                const caminhosAntigos =
                    arquivosAntigos
                        .filter(
                            arquivo =>
                                arquivo.name
                        )
                        .map(
                            arquivoAntigo =>
                                `${pastaUsuario}/${arquivoAntigo.name}`
                        );


                if (
                    caminhosAntigos.length > 0
                ) {

                    const {
                        error: erroRemocao
                    } =
                        await supabaseConn
                            .storage
                            .from('fotos-perfil')
                            .remove(
                                caminhosAntigos
                            );


                    if (erroRemocao) {

                        console.warn(
                            '⚠️ Não foi possível remover fotos anteriores:',
                            erroRemocao
                        );

                    }

                }

            }


            // ==================================================
            // UPLOAD DA NOVA FOTO
            // ==================================================

            const {
                error: erroUpload
            } =
                await supabaseConn
                    .storage
                    .from('fotos-perfil')
                    .upload(
                        caminho,
                        arquivo,
                        {

                            cacheControl:
                                '3600',

                            upsert:
                                false,

                            contentType:
                                arquivo.type

                        }
                    );


            if (erroUpload) {

                console.error(
                    '❌ Erro no upload:',
                    erroUpload
                );

                alert(
                    'Não foi possível atualizar sua foto: ' +
                    erroUpload.message
                );

                return;
            }


            // ==================================================
            // PEGAR URL PÚBLICA
            // ==================================================

            const {
                data: urlData
            } =
                supabaseConn
                    .storage
                    .from('fotos-perfil')
                    .getPublicUrl(
                        caminho
                    );


            if (
                urlData?.publicUrl
            ) {

                mostrarFoto(
                    urlData.publicUrl +
                    '?t=' +
                    Date.now()
                );

            }


            alert(
                'Foto do perfil atualizada com sucesso! 📸'
            );


            console.log(
                '=========================================='
            );

            console.log(
                '✅ FOTO ATUALIZADA'
            );

            console.log(
                'Caminho:',
                caminho
            );

            console.log(
                '=========================================='
            );


        }
        catch (erro) {

            console.error(
                '❌ Erro inesperado ao atualizar foto:',
                erro
            );

            alert(
                'Ocorreu um erro ao atualizar sua foto.'
            );

        }
        finally {

            if (btnAlterarFoto) {

                btnAlterarFoto.disabled =
                    false;

                btnAlterarFoto.textContent =
                    '📷 Alterar foto';

            }


            inputFoto.value =
                '';

        }

    }


    // ============================================================
    // REMOVER FOTO
    // ============================================================

    async function removerFotoPerfil() {

        if (!usuarioAuth?.id) {

            alert(
                'Usuário não autenticado.'
            );

            return;
        }


        try {

            if (btnRemoverFoto) {

                btnRemoverFoto.disabled =
                    true;

                btnRemoverFoto.textContent =
                    'Removendo...';

            }


            const pastaUsuario =
                usuarioAuth.id;


            // ==================================================
            // LISTAR ARQUIVOS
            // ==================================================

            const {
                data: arquivos,
                error: erroLista
            } =
                await supabaseConn
                    .storage
                    .from('fotos-perfil')
                    .list(
                        pastaUsuario,
                        {
                            limit: 100
                        }
                    );


            if (erroLista) {

                console.error(
                    '❌ Erro ao listar fotos:',
                    erroLista
                );

                alert(
                    'Não foi possível localizar sua foto.'
                );

                return;
            }


            if (
                !arquivos ||
                arquivos.length === 0
            ) {

                colocarFotoPadrao();

                alert(
                    'Você não possui uma foto de perfil.'
                );

                return;
            }


            // ==================================================
            // CAMINHOS
            // ==================================================

            const caminhos =
                arquivos
                    .filter(
                        arquivo =>
                            arquivo.name
                    )
                    .map(
                        arquivo =>
                            `${pastaUsuario}/${arquivo.name}`
                    );


            if (
                caminhos.length === 0
            ) {

                colocarFotoPadrao();

                return;
            }


            // ==================================================
            // REMOVER
            // ==================================================

            const {
                error: erroRemocao
            } =
                await supabaseConn
                    .storage
                    .from('fotos-perfil')
                    .remove(
                        caminhos
                    );


            if (erroRemocao) {

                console.error(
                    '❌ Erro ao remover foto:',
                    erroRemocao
                );

                alert(
                    'Não foi possível remover sua foto: ' +
                    erroRemocao.message
                );

                return;
            }


            colocarFotoPadrao();


            alert(
                'Foto do perfil removida com sucesso! 🗑️'
            );


            console.log(
                '✅ FOTO REMOVIDA'
            );


        }
        catch (erro) {

            console.error(
                '❌ Erro inesperado ao remover foto:',
                erro
            );

            alert(
                'Ocorreu um erro ao remover sua foto.'
            );

        }
        finally {

            if (btnRemoverFoto) {

                btnRemoverFoto.disabled =
                    false;

                btnRemoverFoto.textContent =
                    '🗑️ Remover foto';

            }

        }

    }


    // ============================================================
    // FINAL
    // ============================================================

    console.log(
        '=========================================='
    );

    console.log(
        '✅ Dados-pessoais.js totalmente inicializado.'
    );

    console.log(
        '=========================================='
    );

});
