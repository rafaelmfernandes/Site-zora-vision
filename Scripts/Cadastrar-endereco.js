// ============================================================
// ZORAVISION - CADASTRO E EDIÇÃO DE ENDEREÇO
// SUPABASE AUTH + TABELA ENDERECOS
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {

    console.log('🔥 ZORAVISION - Cadastrar-endereco.js carregado');

    // ============================================================
    // ELEMENTOS
    // ============================================================

    const formCadEndereco =
        document.getElementById('form-cadastrar-endereco');

    const inputNomeDestinatario =
        document.getElementById('nome-destinatario');

    const inputCep =
        document.getElementById('cep');

    const inputRua =
        document.getElementById('rua');

    const inputNumero =
        document.getElementById('numero');

    const inputComplemento =
        document.getElementById('complemento');

    const inputBairro =
        document.getElementById('bairro');

    const inputCidade =
        document.getElementById('cidade');

    const inputUf =
        document.getElementById('uf');

    const inputReferencia =
        document.getElementById('referencia');

    const checkboxPrincipal =
        document.getElementById('chk-principal');

    const btnSalvar =
        document.querySelector('.btn-salvar');

    const tituloPagina =
        document.querySelector('.header-titulo');


    // ============================================================
    // VERIFICAR FORMULÁRIO
    // ============================================================

    if (!formCadEndereco) {

        console.error(
            '❌ Formulário de endereço não encontrado.'
        );

        return;
    }


    // ============================================================
    // CONEXÃO SUPABASE
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

    let usuarioAuth = null;
    let clienteAtual = null;


    try {

        const {
            data,
            error
        } = await supabaseConn.auth.getSession();


        if (error) {

            console.error(
                '❌ Erro ao verificar sessão:',
                error
            );

            alert(
                'Não foi possível verificar sua sessão. Faça login novamente.'
            );

            window.location.href =
                'Login.html';

            return;
        }


        usuarioAuth =
            data?.session?.user;


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
            'E-mail:',
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
                'Não foi possível localizar seu cadastro.'
            );

            return;
        }


        if (!cliente) {

            console.error(
                '❌ Cliente não encontrado.'
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

            await supabaseConn.auth.signOut();

            localStorage.removeItem(
                'usuario_logado'
            );

            localStorage.removeItem(
                'cliente_supabase_id'
            );

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
        // SALVAR ID CORRETO DO CLIENTE
        // ========================================================

        localStorage.setItem(
            'cliente_supabase_id',
            cliente.id
        );


        console.log(
            '✅ Cliente identificado:',
            cliente.id
        );


    } catch (erro) {

        console.error(
            '❌ Erro ao localizar cliente:',
            erro
        );

        alert(
            'Ocorreu um erro ao localizar seu cadastro.'
        );

        return;
    }


    // ============================================================
    // DETECTAR MODO DE EDIÇÃO
    // ============================================================

    const parametros =
        new URLSearchParams(
            window.location.search
        );


    const enderecoId =
        parametros.get('id');


    const modoEdicao =
        Boolean(enderecoId);


    console.log(
        'Modo:',
        modoEdicao
            ? 'EDIÇÃO'
            : 'NOVO ENDEREÇO'
    );


    console.log(
        'ID do endereço:',
        enderecoId || 'nenhum'
    );


    // ============================================================
    // ALTERAR TÍTULO DA PÁGINA
    // ============================================================

    if (modoEdicao) {

        if (tituloPagina) {

            tituloPagina.textContent =
                'Editar Endereço';

        }

        document.title =
            'Editar Endereço - ZoraVision';


        if (btnSalvar) {

            btnSalvar.textContent =
                'Salvar Alterações';

        }

    }


    // ============================================================
    // BUSCAR ENDEREÇO PARA EDIÇÃO
    // ============================================================

    if (modoEdicao) {

        await carregarEnderecoParaEdicao(
            enderecoId
        );

    }


    // ============================================================
    // EVENTO DO FORMULÁRIO
    // ============================================================

    formCadEndereco.addEventListener(
        'submit',
        async event => {

            event.preventDefault();

            await salvarEndereco();

        }
    );


    // ============================================================
    // EVENTO DO CEP
    // ============================================================

    if (inputCep) {

        inputCep.addEventListener(
            'blur',
            async event => {

                const cepLimpo =
                    event.target.value.replace(
                        /\D/g,
                        ''
                    );


                if (
                    cepLimpo.length === 8
                ) {

                    await buscarCep(
                        cepLimpo
                    );

                }

            }
        );

    }


    // ============================================================
    // FINAL
    // ============================================================

    console.log(
        '=========================================='
    );

    console.log(
        '✅ Cadastrar-endereco.js totalmente inicializado.'
    );

    console.log(
        '=========================================='
    );


    // ============================================================
    // FUNÇÃO - CARREGAR ENDEREÇO PARA EDIÇÃO
    // ============================================================

    async function carregarEnderecoParaEdicao(
        id
    ) {

        console.log(
            '📍 Carregando endereço para edição:',
            id
        );


        try {

            const {
                data: endereco,
                error
            } = await supabaseConn
                .from('enderecos')
                .select(
                    'id,cliente_id,nome_destinatario,cep,rua,numero,complemento,bairro,cidade,estado,principal,created_at,updated_at'
                )
                .eq(
                    'id',
                    id
                )
                .eq(
                    'cliente_id',
                    clienteAtual.id
                )
                .maybeSingle();


            if (error) {

                console.error(
                    '❌ Erro ao buscar endereço:',
                    error
                );

                alert(
                    'Não foi possível carregar este endereço.'
                );

                window.location.href =
                    'Endereços.html';

                return;
            }


            if (!endereco) {

                console.error(
                    '❌ Endereço não encontrado.'
                );

                alert(
                    'Endereço não encontrado ou não pertence à sua conta.'
                );

                window.location.href =
                    'Endereços.html';

                return;
            }


            // ====================================================
            // PREENCHER CAMPOS
            // ====================================================

            if (inputNomeDestinatario) {

                inputNomeDestinatario.value =
                    endereco.nome_destinatario || '';

            }


            if (inputCep) {

                inputCep.value =
                    endereco.cep || '';

            }


            if (inputRua) {

                inputRua.value =
                    endereco.rua || '';

            }


            if (inputNumero) {

                inputNumero.value =
                    endereco.numero || '';

            }


            if (inputComplemento) {

                inputComplemento.value =
                    endereco.complemento || '';

            }


            if (inputBairro) {

                inputBairro.value =
                    endereco.bairro || '';

            }


            if (inputCidade) {

                inputCidade.value =
                    endereco.cidade || '';

            }


            if (inputUf) {

                inputUf.value =
                    endereco.estado || '';

            }


            if (checkboxPrincipal) {

                checkboxPrincipal.checked =
                    endereco.principal === true;

            }


            // ====================================================
            // TIPO
            // ====================================================

            // A tabela atual não possui coluna "tipo".
            // Mantemos Casa como padrão visual.

            const tipoCasa =
                document.querySelector(
                    'input[name="tipo_endereco"][value="casa"]'
                );


            if (tipoCasa) {

                tipoCasa.checked =
                    true;

            }


            // ====================================================
            // REFERÊNCIA
            // ====================================================

            // A tabela atual não possui coluna "referencia".
            // Portanto não existe esse dado no banco para recuperar.

            if (inputReferencia) {

                inputReferencia.value =
                    '';

            }


            console.log(
                '=========================================='
            );

            console.log(
                '✅ ENDEREÇO CARREGADO PARA EDIÇÃO'
            );

            console.log(
                'ID:',
                endereco.id
            );

            console.log(
                'Destinatário:',
                endereco.nome_destinatario
            );

            console.log(
                'CEP:',
                endereco.cep
            );

            console.log(
                'Principal:',
                endereco.principal
            );

            console.log(
                '=========================================='
            );


        } catch (erro) {

            console.error(
                '❌ Erro inesperado ao carregar endereço:',
                erro
            );

            alert(
                'Ocorreu um erro ao carregar o endereço.'
            );

            window.location.href =
                'Endereços.html';

        }

    }


    // ============================================================
    // FUNÇÃO - SALVAR ENDEREÇO
    // ============================================================

    async function salvarEndereco() {

        if (!clienteAtual) {

            alert(
                'Cliente não identificado. Faça login novamente.'
            );

            return;
        }


        // ========================================================
        // LER CAMPOS
        // ========================================================

        const nomeDestinatario =
            inputNomeDestinatario?.value.trim() || '';


        const cep =
            inputCep?.value.trim() || '';


        const rua =
            inputRua?.value.trim() || '';


        const numero =
            inputNumero?.value.trim() || '';


        const complemento =
            inputComplemento?.value.trim() || '';


        const bairro =
            inputBairro?.value.trim() || '';


        const cidade =
            inputCidade?.value.trim() || '';


        const estado =
            inputUf?.value.trim().toUpperCase() || '';


        const ehPrincipal =
            checkboxPrincipal?.checked || false;


        // ========================================================
        // VALIDAÇÕES
        // ========================================================

        if (!nomeDestinatario) {

            alert(
                'Informe o nome de quem vai receber o pedido.'
            );

            inputNomeDestinatario?.focus();

            return;
        }


        if (!cep) {

            alert(
                'Informe o CEP.'
            );

            inputCep?.focus();

            return;
        }


        const cepLimpo =
            cep.replace(
                /\D/g,
                ''
            );


        if (
            cepLimpo.length !== 8
        ) {

            alert(
                'Informe um CEP válido com 8 números.'
            );

            inputCep?.focus();

            return;
        }


        if (!rua) {

            alert(
                'Informe a rua ou avenida.'
            );

            inputRua?.focus();

            return;
        }


        if (!numero) {

            alert(
                'Informe o número do endereço.'
            );

            inputNumero?.focus();

            return;
        }


        if (!bairro) {

            alert(
                'Informe o bairro.'
            );

            inputBairro?.focus();

            return;
        }


        if (!cidade) {

            alert(
                'Informe a cidade.'
            );

            inputCidade?.focus();

            return;
        }


        if (
            estado.length !== 2
        ) {

            alert(
                'Informe uma UF válida com 2 letras.'
            );

            inputUf?.focus();

            return;
        }


        // ========================================================
        // OBJETO DO ENDEREÇO
        // ========================================================

        const dadosEndereco = {

            cliente_id:
                clienteAtual.id,

            nome_destinatario:
                nomeDestinatario,

            cep:
                cep,

            rua:
                rua,

            numero:
                numero,

            complemento:
                complemento || null,

            bairro:
                bairro,

            cidade:
                cidade,

            estado:
                estado,

            principal:
                ehPrincipal,

            updated_at:
                new Date().toISOString()

        };


        console.log(
            '📍 Dados do endereço:',
            dadosEndereco
        );


        // ========================================================
        // DESABILITAR BOTÃO
        // ========================================================

        if (btnSalvar) {

            btnSalvar.disabled =
                true;

            btnSalvar.textContent =
                modoEdicao
                    ? 'Salvando alterações...'
                    : 'Salvando...';

            btnSalvar.style.opacity =
                '0.7';

        }


        try {

            // ====================================================
            // DEFINIR PRINCIPAL
            // ====================================================

            if (ehPrincipal) {

                console.log(
                    '⭐ Removendo endereço principal dos demais...'
                );


                const {
                    error: erroPrincipal
                } = await supabaseConn
                    .from('enderecos')
                    .update({
                        principal: false,
                        updated_at:
                            new Date().toISOString()
                    })
                    .eq(
                        'cliente_id',
                        clienteAtual.id
                    );


                if (erroPrincipal) {

                    console.error(
                        '❌ Erro ao atualizar endereço principal:',
                        erroPrincipal
                    );

                    throw erroPrincipal;
                }

            }


            // ====================================================
            // MODO EDIÇÃO
            // ====================================================

            if (modoEdicao) {

                console.log(
                    '✏️ Atualizando endereço:',
                    enderecoId
                );


                const {
                    error: erroAtualizacao
                } = await supabaseConn
                    .from('enderecos')
                    .update(
                        dadosEndereco
                    )
                    .eq(
                        'id',
                        enderecoId
                    )
                    .eq(
                        'cliente_id',
                        clienteAtual.id
                    );


                if (erroAtualizacao) {

                    console.error(
                        '❌ Erro ao atualizar endereço:',
                        erroAtualizacao
                    );

                    throw erroAtualizacao;
                }


                console.log(
                    '✅ Endereço atualizado com sucesso.'
                );


                // ==================================================
                // ENDEREÇO SELECIONADO
                // ==================================================

                const enderecoSelecionado =
                    localStorage.getItem(
                        'endereco_selecionado_id'
                    );


                if (
                    enderecoSelecionado ===
                    enderecoId
                ) {

                    localStorage.setItem(
                        'endereco_selecionado_id',
                        enderecoId
                    );

                }


                alert(
                    'Endereço atualizado com sucesso! 🎉'
                );


                window.location.href =
                    'Endereços.html';


                return;
            }


            // ====================================================
            // MODO NOVO ENDEREÇO
            // ====================================================

            console.log(
                '➕ Cadastrando novo endereço...'
            );


            const {
                data: novoEndereco,
                error: erroInsercao
            } = await supabaseConn
                .from('enderecos')
                .insert([
                    dadosEndereco
                ])
                .select(
                    'id,cliente_id,nome_destinatario,cep,rua,numero,complemento,bairro,cidade,estado,principal'
                )
                .single();


            if (erroInsercao) {

                console.error(
                    '❌ Erro ao inserir endereço:',
                    erroInsercao
                );

                throw erroInsercao;
            }


            console.log(
                '=========================================='
            );

            console.log(
                '✅ NOVO ENDEREÇO CADASTRADO'
            );

            console.log(
                'ID:',
                novoEndereco.id
            );

            console.log(
                'Cliente:',
                novoEndereco.cliente_id
            );

            console.log(
                'Principal:',
                novoEndereco.principal
            );

            console.log(
                '=========================================='
            );


            // ====================================================
            // SALVAR ENDEREÇO SELECIONADO
            // ====================================================

            if (ehPrincipal) {

                localStorage.setItem(
                    'endereco_selecionado_id',
                    novoEndereco.id
                );

            }


            // ====================================================
            // LOCALSTORAGE - ÚLTIMO ENDEREÇO
            // ====================================================

            const chaveLocal =
                'ultimo_endereco_cliente_' +
                (
                    clienteAtual.email ||
                    usuarioAuth.email ||
                    ''
                ).toLowerCase();


            localStorage.setItem(
                chaveLocal,
                JSON.stringify({

                    id:
                        novoEndereco.id,

                    nome:
                        nomeDestinatario,

                    cep:
                        cep,

                    rua:
                        rua,

                    numero:
                        numero,

                    complemento:
                        complemento,

                    bairro:
                        bairro,

                    cidade:
                        cidade,

                    uf:
                        estado,

                    principal:
                        ehPrincipal

                })
            );


            alert(
                'Endereço cadastrado com sucesso! 🎉'
            );


            window.location.href =
                'Endereços.html';


        } catch (erro) {

            console.error(
                '❌ Erro ao salvar endereço:',
                erro
            );


            let mensagem =
                'Não foi possível salvar o endereço.';


            if (erro?.message) {

                mensagem +=
                    '\n\n' +
                    erro.message;

            }


            alert(
                mensagem
            );


            // ====================================================
            // REATIVAR BOTÃO
            // ====================================================

            if (btnSalvar) {

                btnSalvar.disabled =
                    false;

                btnSalvar.textContent =
                    modoEdicao
                        ? 'Salvar Alterações'
                        : 'Salvar Endereço';

                btnSalvar.style.opacity =
                    '1';

            }

        }

    }


    // ============================================================
    // BUSCAR CEP PELO BOTÃO
    // ============================================================

    window.buscarCepCadastro =
        async function () {

            if (!inputCep) {

                return;
            }


            const cepLimpo =
                inputCep.value.replace(
                    /\D/g,
                    ''
                );


            if (
                cepLimpo.length !== 8
            ) {

                alert(
                    'Digite um CEP válido com 8 números.'
                );

                inputCep.focus();

                return;
            }


            await buscarCep(
                cepLimpo
            );

        };


    // ============================================================
    // BUSCAR CEP
    // ============================================================

    async function buscarCep(
        cep
    ) {

        const statusEl =
            document.getElementById(
                'cep-status'
            );


        try {

            if (statusEl) {

                statusEl.style.color =
                    '#2563eb';

                statusEl.textContent =
                    'Buscando CEP...';

            }


            const response =
                await fetch(
                    `https://viacep.com.br/ws/${cep}/json/`
                );


            if (!response.ok) {

                throw new Error(
                    'Não foi possível consultar o CEP.'
                );

            }


            const data =
                await response.json();


            if (data.erro) {

                if (statusEl) {

                    statusEl.style.color =
                        '#ef4444';

                    statusEl.textContent =
                        'CEP não encontrado.';

                }

                return;
            }


            // ====================================================
            // PREENCHER CAMPOS
            // ====================================================

            if (inputRua) {

                inputRua.value =
                    data.logradouro || '';

            }


            if (inputBairro) {

                inputBairro.value =
                    data.bairro || '';

            }


            if (inputCidade) {

                inputCidade.value =
                    data.localidade || '';

            }


            if (inputUf) {

                inputUf.value =
                    data.uf || '';

            }


            if (statusEl) {

                statusEl.style.color =
                    '#16a34a';

                statusEl.textContent =
                    'CEP encontrado!';

            }


            setTimeout(
                () => {

                    if (statusEl) {

                        statusEl.textContent =
                            '';

                    }

                },
                3000
            );


            if (inputNumero) {

                inputNumero.focus();

            }


            console.log(
                '✅ CEP encontrado:',
                data
            );


        } catch (erro) {

            console.error(
                '❌ Erro ao buscar CEP:',
                erro
            );


            if (statusEl) {

                statusEl.style.color =
                    '#ef4444';

                statusEl.textContent =
                    'Erro ao consultar CEP.';

            }


            alert(
                'Não foi possível consultar o CEP.'
            );

        }

    }

});