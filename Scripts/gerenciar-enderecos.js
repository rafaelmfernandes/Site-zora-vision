// ============================================================
// ZORAVISION - GERENCIAR ENDEREÇOS
// SUPABASE AUTH + TABELA ENDERECOS
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {

    console.log('🔥 ZORAVISION - gerenciar-enderecos.js carregado');


    // ============================================================
    // ELEMENTOS
    // ============================================================

    const listaEnderecos =
        document.getElementById('lista-enderecos-container');


    if (!listaEnderecos) {

        console.error(
            '❌ Elemento "lista-enderecos-container" não encontrado.'
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

        listaEnderecos.innerHTML = `
            <p>
                Erro de conexão com o banco de dados.
                Recarregue a página e tente novamente.
            </p>
        `;

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
    // BUSCAR CLIENTE PELO AUTH USER ID
    // ============================================================

    let clienteAtual = null;


    try {

        const {
            data: cliente,
            error
        } = await supabaseConn
            .from('clientes')
            .select(
                'id,nome,email,ativo,auth_user_id'
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

            listaEnderecos.innerHTML = `
                <p>
                    Não foi possível carregar seu cadastro.
                </p>
            `;

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
        // SALVAR ID DO CLIENTE
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
            '❌ Erro inesperado ao buscar cliente:',
            erro
        );

        listaEnderecos.innerHTML = `
            <p>
                Ocorreu um erro ao carregar seu cadastro.
            </p>
        `;

        return;
    }


    // ============================================================
    // CARREGAR ENDEREÇOS
    // ============================================================

    async function carregarEnderecos() {

        console.log(
            '📍 Carregando endereços...'
        );


        listaEnderecos.innerHTML = `
            <p>
                Carregando seus endereços...
            </p>
        `;


        try {

            const {
                data: enderecos,
                error
            } = await supabaseConn

                .from('enderecos')

                .select(
                    'id,cliente_id,nome_destinatario,cep,rua,numero,complemento,bairro,cidade,estado,principal,created_at,updated_at'
                )

                .eq(
                    'cliente_id',
                    clienteAtual.id
                )

                .order(
                    'principal',
                    {
                        ascending: false
                    }
                )

                .order(
                    'created_at',
                    {
                        ascending: false
                    }
                );


            if (error) {

                console.error(
                    '❌ Erro ao carregar endereços:',
                    error
                );


                listaEnderecos.innerHTML = `
                    <p>
                        Não foi possível carregar seus endereços.
                    </p>
                `;

                return;
            }


            console.log(
                '✅ Endereços encontrados:',
                enderecos
            );


            // ====================================================
            // NENHUM ENDEREÇO
            // ====================================================

            if (!enderecos || enderecos.length === 0) {

                listaEnderecos.innerHTML = `
                    <div class="sem-enderecos">
                        <p>📍 Você ainda não possui endereços cadastrados.</p>
                        <p>Adicione um endereço para facilitar suas compras.</p>
                    </div>
                `;

                return;
            }


            // ====================================================
            // RENDERIZAR ENDEREÇOS
            // ====================================================

            listaEnderecos.innerHTML = '';


            enderecos.forEach(
                (endereco) => {

                    const card =
                        document.createElement('div');


                    card.className =
                        'endereco-card';


                    if (endereco.principal) {

                        card.classList.add(
                            'endereco-principal'
                        );

                    }


                    card.dataset.enderecoId =
                        endereco.id;


                    // ==================================================
                    // FORMATAÇÃO
                    // ==================================================

                    const complemento =
                        endereco.complemento
                            ? `, ${endereco.complemento}`
                            : '';


                    const cep =
                        endereco.cep
                            ? `CEP: ${endereco.cep}`
                            : '';


                    const cidadeEstado =
                        [
                            endereco.cidade,
                            endereco.estado
                        ]
                            .filter(Boolean)
                            .join(' - ');


                    card.innerHTML = `

                        <div class="endereco-selecao">

                            <label class="endereco-radio">

                                <input
                                    type="radio"
                                    name="endereco-selecionado"
                                    value="${endereco.id}"
                                    ${endereco.principal ? 'checked' : ''}
                                >

                                <span class="radio-custom"></span>

                            </label>

                        </div>


                        <div class="endereco-conteudo">

                            <div class="endereco-topo">

                                <strong>
                                    ${escaparHTML(
                                        endereco.nome_destinatario ||
                                        'Destinatário'
                                    )}
                                </strong>

                                ${
                                    endereco.principal
                                        ? `
                                            <span class="badge-principal">
                                                Principal
                                            </span>
                                          `
                                        : ''
                                }

                            </div>


                            <div class="endereco-texto">

                                <p>
                                    ${escaparHTML(
                                        endereco.rua || ''
                                    )},
                                    ${escaparHTML(
                                        endereco.numero || ''
                                    )}
                                    ${escaparHTML(
                                        complemento
                                    )}
                                </p>

                                <p>
                                    ${escaparHTML(
                                        endereco.bairro || ''
                                    )}
                                </p>

                                <p>
                                    ${escaparHTML(
                                        cidadeEstado
                                    )}
                                </p>

                                <p>
                                    ${escaparHTML(
                                        cep
                                    )}
                                </p>

                            </div>


                            <div class="endereco-acoes">

                                <button
                                    type="button"
                                    class="btn-editar-endereco"
                                    data-id="${endereco.id}"
                                >
                                    Editar
                                </button>


                                <button
                                    type="button"
                                    class="btn-excluir-endereco"
                                    data-id="${endereco.id}"
                                >
                                    Excluir
                                </button>


                                ${
                                    !endereco.principal
                                        ? `
                                            <button
                                                type="button"
                                                class="btn-principal-endereco"
                                                data-id="${endereco.id}"
                                            >
                                                Tornar principal
                                            </button>
                                          `
                                        : ''
                                }

                            </div>

                        </div>

                    `;


                    listaEnderecos.appendChild(
                        card
                    );

                }
            );


            console.log(
                '✅ Lista de endereços renderizada.'
            );


            adicionarEventosEnderecos();

        } catch (erro) {

            console.error(
                '❌ Erro inesperado ao carregar endereços:',
                erro
            );


            listaEnderecos.innerHTML = `
                <p>
                    Ocorreu um erro ao carregar seus endereços.
                </p>
            `;

        }

    }


    // ============================================================
    // ESCAPAR HTML
    // ============================================================

    function escaparHTML(valor) {

        const div =
            document.createElement('div');


        div.textContent =
            valor ?? '';


        return div.innerHTML;

    }


    // ============================================================
    // EVENTOS DOS ENDEREÇOS
    // ============================================================

    function adicionarEventosEnderecos() {


        // ========================================================
        // EDITAR
        // ========================================================

        const botoesEditar =
            document.querySelectorAll(
                '.btn-editar-endereco'
            );


        botoesEditar.forEach(
            (botao) => {

                botao.addEventListener(
                    'click',
                    () => {

                        const id =
                            botao.dataset.id;


                        console.log(
                            '✏️ Editar endereço:',
                            id
                        );


                        window.location.href =
                            `Cadastrar-endereço.html?id=${encodeURIComponent(id)}`;

                    }
                );

            }
        );


        // ========================================================
        // EXCLUIR
        // ========================================================

        const botoesExcluir =
            document.querySelectorAll(
                '.btn-excluir-endereco'
            );


        botoesExcluir.forEach(
            (botao) => {

                botao.addEventListener(
                    'click',
                    async () => {

                        const id =
                            botao.dataset.id;


                        const confirmar =
                            confirm(
                                'Tem certeza que deseja excluir este endereço?'
                            );


                        if (!confirmar) {

                            return;

                        }


                        await excluirEndereco(
                            id
                        );

                    }
                );

            }
        );


        // ========================================================
        // TORNAR PRINCIPAL
        // ========================================================

        const botoesPrincipal =
            document.querySelectorAll(
                '.btn-principal-endereco'
            );


        botoesPrincipal.forEach(
            (botao) => {

                botao.addEventListener(
                    'click',
                    async () => {

                        const id =
                            botao.dataset.id;


                        await definirEnderecoPrincipal(
                            id
                        );

                    }
                );

            }
        );

    }


    // ============================================================
    // EXCLUIR ENDEREÇO
    // ============================================================

    async function excluirEndereco(
        enderecoId
    ) {

        console.log(
            '🗑️ Excluindo endereço:',
            enderecoId
        );


        try {

            const {
                error
            } = await supabaseConn

                .from('enderecos')

                .delete()

                .eq(
                    'id',
                    enderecoId
                )

                .eq(
                    'cliente_id',
                    clienteAtual.id
                );


            if (error) {

                console.error(
                    '❌ Erro ao excluir endereço:',
                    error
                );


                alert(
                    'Não foi possível excluir o endereço: ' +
                    error.message
                );


                return;

            }


            console.log(
                '✅ Endereço excluído.'
            );


            alert(
                'Endereço excluído com sucesso!'
            );


            await carregarEnderecos();


        } catch (erro) {

            console.error(
                '❌ Erro inesperado ao excluir:',
                erro
            );


            alert(
                'Ocorreu um erro ao excluir o endereço.'
            );

        }

    }


    // ============================================================
    // DEFINIR ENDEREÇO PRINCIPAL
    // ============================================================

    async function definirEnderecoPrincipal(
        enderecoId
    ) {

        console.log(
            '⭐ Definindo endereço principal:',
            enderecoId
        );


        try {

            // ====================================================
            // PRIMEIRO:
            // REMOVER PRINCIPAL DOS ENDEREÇOS DO CLIENTE
            // ====================================================

            const {
                error: erroRemover
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


            if (erroRemover) {

                console.error(
                    '❌ Erro ao remover endereço principal:',
                    erroRemover
                );


                alert(
                    'Não foi possível alterar o endereço principal.'
                );


                return;

            }


            // ====================================================
            // SEGUNDO:
            // DEFINIR NOVO PRINCIPAL
            // ====================================================

            const {
                error: erroDefinir
            } = await supabaseConn

                .from('enderecos')

                .update({
                    principal: true,
                    updated_at:
                        new Date().toISOString()
                })

                .eq(
                    'id',
                    enderecoId
                )

                .eq(
                    'cliente_id',
                    clienteAtual.id
                );


            if (erroDefinir) {

                console.error(
                    '❌ Erro ao definir principal:',
                    erroDefinir
                );


                alert(
                    'Não foi possível definir este endereço como principal.'
                );


                return;

            }


            console.log(
                '✅ Endereço definido como principal.'
            );


            alert(
                'Endereço principal atualizado!'
            );


            await carregarEnderecos();


        } catch (erro) {

            console.error(
                '❌ Erro inesperado ao definir principal:',
                erro
            );


            alert(
                'Ocorreu um erro ao alterar o endereço principal.'
            );

        }

    }


    // ============================================================
    // USAR ENDEREÇO SELECIONADO
    // ============================================================

    window.confirmarSelecaoEndereco =
        function () {

            const selecionado =
                document.querySelector(
                    'input[name="endereco-selecionado"]:checked'
                );


            if (!selecionado) {

                alert(
                    'Selecione um endereço primeiro.'
                );

                return;

            }


            const enderecoId =
                selecionado.value;


            console.log(
                '📍 Endereço selecionado:',
                enderecoId
            );


            // Salva temporariamente o endereço escolhido
            // para ser utilizado posteriormente no checkout.

            localStorage.setItem(
                'endereco_selecionado_id',
                enderecoId
            );


            alert(
                'Endereço selecionado com sucesso!'
            );


            console.log(
                '✅ endereco_selecionado_id:',
                enderecoId
            );

        };


    // ============================================================
    // INICIALIZAR
    // ============================================================

    await carregarEnderecos();


    console.log(
        '=========================================='
    );

    console.log(
        '✅ gerenciar-enderecos.js totalmente inicializado.'
    );

    console.log(
        '=========================================='
    );

});