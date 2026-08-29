
// ============================================================
// ZORAVISION - CHECKOUT.JS
//
// RESPONSABILIDADES:
// - Controlar a página de checkout
// - Exibir itens do carrinho
// - Exibir resumo dos valores
// - Buscar endereço real do cliente no Supabase
// - Exibir endereço selecionado
// - Permitir cadastrar endereço pelo checkout
// - Garantir que endereço de outro cliente nunca seja usado
// - Garantir que o pedido tenha endereco_id válido
// - Controlar forma de pagamento
// - Criar pedido através da Edge Function criar-pix
// - Criar pagamento PIX através do Mercado Pago
// - Salvar dados do pedido e pagamento no localStorage
// - Redirecionar para a página de pagamento PIX
// - Retornar para o produto que originou o checkout
//
// IMPORTANTE:
// - O pedido NÃO poderá ser criado sem endereço.
// - O endereço deve pertencer ao cliente logado.
// - Endereços antigos do localStorage não serão usados
//   se não puderem ser validados contra o cliente logado.
// ============================================================


// ============================================================
// 1. CONFIGURAÇÃO
// ============================================================

const SUPABASE_URL_CHECKOUT =
    'https://ratajxnxkjoiuknamacn.supabase.co';

const FUNCAO_CRIAR_PIX =
    `${SUPABASE_URL_CHECKOUT}/functions/v1/criar-pix`;


// ============================================================
// 2. USUÁRIO LOGADO
// ============================================================

function obterUsuarioCheckout() {

    try {

        const dadosUsuario =
            localStorage.getItem(
                'usuario_logado'
            );

        if (!dadosUsuario) {
            return null;
        }

        const usuario =
            JSON.parse(
                dadosUsuario
            );

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
            '❌ Erro ao obter usuário do checkout:',
            erro
        );

        return null;
    }
}


// ============================================================
// 3. OBTER CLIENTE ID
// ============================================================

function obterClienteIdCheckout() {

    const usuario =
        obterUsuarioCheckout();

    if (!usuario) {
        return null;
    }

    return (
        usuario.id ||
        localStorage.getItem(
            'cliente_supabase_id'
        ) ||
        null
    );
}


// ============================================================
// 4. CONEXÃO COM SUPABASE
// ============================================================

function obterSupabaseCheckout() {

    if (window.supabaseClient) {
        return window.supabaseClient;
    }

    if (
        typeof _supabase !== 'undefined' &&
        _supabase
    ) {
        return _supabase;
    }

    if (window._supabase) {
        return window._supabase;
    }

    console.error(
        '❌ Cliente Supabase não encontrado.'
    );

    return null;
}


// ============================================================
// 5. CHAVE DO ENDEREÇO LOCAL
// ============================================================

function chaveEnderecoCheckout() {

    const usuario =
        obterUsuarioCheckout();

    if (!usuario || !usuario.email) {

        return 'ultimo_endereco_cliente';
    }

    return (
        'ultimo_endereco_cliente_' +
        usuario.email
            .trim()
            .toLowerCase()
    );
}


// ============================================================
// 6. NORMALIZAR ENDEREÇO
// ============================================================

function normalizarEnderecoCheckout(
    endereco
) {

    if (!endereco) {
        return null;
    }

    return {

        id:
            endereco.id || null,

        cliente_id:
            endereco.cliente_id || null,

        nome:
            endereco.nome ||
            endereco.nome_destinatario ||
            '',

        nome_destinatario:
            endereco.nome_destinatario ||
            endereco.nome ||
            '',

        cep:
            endereco.cep ||
            '',

        rua:
            endereco.rua ||
            '',

        numero:
            endereco.numero !== null &&
            endereco.numero !== undefined
                ? String(endereco.numero)
                : '',

        complemento:
            endereco.complemento ||
            '',

        bairro:
            endereco.bairro ||
            '',

        cidade:
            endereco.cidade ||
            '',

        estado:
            endereco.estado ||
            endereco.uf ||
            '',

        uf:
            endereco.uf ||
            endereco.estado ||
            '',

        principal:
            endereco.principal === true
    };
}


// ============================================================
// 7. CARREGAR ENDEREÇO LOCAL
// ============================================================
//
// IMPORTANTE:
// O endereço local só será aceito se:
// - possuir ID
// - possuir cliente_id
// - pertencer ao cliente atualmente logado
//
// Isso impede que um endereço antigo de outro cliente seja
// reutilizado pelo checkout.
// ============================================================

function obterEnderecoCheckoutLocal() {

    try {

        const clienteId =
            obterClienteIdCheckout();

        if (!clienteId) {

            console.warn(
                '⚠️ Cliente não identificado. Endereço local não será utilizado.'
            );

            return null;
        }

        const dados =
            localStorage.getItem(
                chaveEnderecoCheckout()
            );

        if (!dados) {
            return null;
        }

        const endereco =
            normalizarEnderecoCheckout(
                JSON.parse(dados)
            );

        if (!endereco) {
            return null;
        }

        // --------------------------------------------------------
        // PROTEÇÃO CONTRA ENDEREÇO DE OUTRO CLIENTE
        // --------------------------------------------------------

        if (
            !endereco.cliente_id ||
            String(endereco.cliente_id) !==
            String(clienteId)
        ) {

            console.warn(
                '⚠️ Endereço local não pertence ao cliente logado. Será ignorado.'
            );

            localStorage.removeItem(
                chaveEnderecoCheckout()
            );

            return null;
        }

        return endereco;

    } catch (erro) {

        console.error(
            '❌ Erro ao carregar endereço local:',
            erro
        );

        return null;
    }
}


// ============================================================
// 8. BUSCAR ENDEREÇO DO CLIENTE NO SUPABASE
// ============================================================

async function buscarEnderecoClienteCheckout() {

    const clienteId =
        obterClienteIdCheckout();

    if (!clienteId) {

        console.error(
            '❌ Cliente ID não encontrado.'
        );

        return null;
    }

    const supabase =
        obterSupabaseCheckout();

    if (!supabase) {
        return null;
    }

    try {

        console.log(
            '🔎 Buscando endereço exclusivamente do cliente:',
            clienteId
        );

        // --------------------------------------------------------
        // BUSCAR ENDEREÇO PRINCIPAL
        // --------------------------------------------------------

        const {
            data: enderecoPrincipal,
            error: erroPrincipal
        } = await supabase
            .from('enderecos')
            .select(`
                id,
                cliente_id,
                nome_destinatario,
                cep,
                rua,
                numero,
                complemento,
                bairro,
                cidade,
                estado,
                principal,
                created_at,
                updated_at
            `)
            .eq(
                'cliente_id',
                clienteId
            )
            .eq(
                'principal',
                true
            )
            .order(
                'created_at',
                {
                    ascending: false
                }
            )
            .limit(1)
            .maybeSingle();

        if (erroPrincipal) {

            console.error(
                '❌ Erro ao buscar endereço principal:',
                erroPrincipal
            );
        }

        if (enderecoPrincipal) {

            const endereco =
                normalizarEnderecoCheckout(
                    enderecoPrincipal
                );

            // ----------------------------------------------------
            // PROTEÇÃO FINAL
            // ----------------------------------------------------

            if (
                endereco &&
                String(endereco.cliente_id) ===
                String(clienteId)
            ) {

                console.log(
                    '✅ Endereço principal encontrado para o cliente:',
                    endereco
                );

                return endereco;
            }
        }


        // --------------------------------------------------------
        // SE NÃO HOUVER PRINCIPAL, BUSCAR QUALQUER ENDEREÇO
        // DO CLIENTE LOGADO
        // --------------------------------------------------------

        const {
            data: enderecos,
            error: erroEnderecos
        } = await supabase
            .from('enderecos')
            .select(`
                id,
                cliente_id,
                nome_destinatario,
                cep,
                rua,
                numero,
                complemento,
                bairro,
                cidade,
                estado,
                principal,
                created_at,
                updated_at
            `)
            .eq(
                'cliente_id',
                clienteId
            )
            .order(
                'created_at',
                {
                    ascending: false
                }
            )
            .limit(1);

        if (erroEnderecos) {

            console.error(
                '❌ Erro ao buscar endereços do cliente:',
                erroEnderecos
            );

            return null;
        }

        if (
            !Array.isArray(enderecos) ||
            enderecos.length === 0
        ) {

            console.warn(
                '⚠️ Este cliente não possui endereço cadastrado.'
            );

            // ----------------------------------------------------
            // LIMPAR ENDEREÇO LOCAL INVÁLIDO/ANTIGO
            // ----------------------------------------------------

            localStorage.removeItem(
                chaveEnderecoCheckout()
            );

            return null;
        }

        const endereco =
            normalizarEnderecoCheckout(
                enderecos[0]
            );

        // --------------------------------------------------------
        // PROTEÇÃO FINAL
        // --------------------------------------------------------

        if (
            !endereco ||
            String(endereco.cliente_id) !==
            String(clienteId)
        ) {

            console.error(
                '🚨 PROTEÇÃO: endereço encontrado não pertence ao cliente logado.'
            );

            return null;
        }

        console.log(
            '✅ Endereço encontrado:',
            endereco
        );

        return endereco;

    } catch (erro) {

        console.error(
            '❌ Erro inesperado ao buscar endereço:',
            erro
        );

        return null;
    }
}


// ============================================================
// 9. SALVAR ENDEREÇO LOCALMENTE
// ============================================================

function salvarEnderecoCheckoutLocal(
    endereco
) {

    try {

        const clienteId =
            obterClienteIdCheckout();

        if (
            !clienteId ||
            !endereco ||
            !endereco.id ||
            !endereco.cliente_id
        ) {

            console.warn(
                '⚠️ Endereço inválido. Não será salvo localmente.'
            );

            return;
        }

        // --------------------------------------------------------
        // PROTEÇÃO
        // --------------------------------------------------------

        if (
            String(endereco.cliente_id) !==
            String(clienteId)
        ) {

            console.error(
                '🚨 Tentativa de salvar endereço de outro cliente bloqueada.'
            );

            return;
        }

        const enderecoNormalizado =
            normalizarEnderecoCheckout(
                endereco
            );

        localStorage.setItem(
            chaveEnderecoCheckout(),
            JSON.stringify(
                enderecoNormalizado
            )
        );

        console.log(
            '✅ Endereço salvo localmente:',
            enderecoNormalizado
        );

    } catch (erro) {

        console.warn(
            '⚠️ Não foi possível salvar o endereço local:',
            erro
        );
    }
}


// ============================================================
// 10. OBTER ENDEREÇO DO CHECKOUT
// ============================================================
//
// PRIORIDADE:
// 1. Supabase
// 2. LocalStorage validado
//
// O Supabase é sempre a fonte principal.
// ============================================================

async function obterEnderecoCheckout() {

    const enderecoSupabase =
        await buscarEnderecoClienteCheckout();

    if (
        enderecoSupabase &&
        enderecoSupabase.id
    ) {

        salvarEnderecoCheckoutLocal(
            enderecoSupabase
        );

        return enderecoSupabase;
    }

    // ----------------------------------------------------------
    // NÃO HAVENDO ENDEREÇO NO SUPABASE,
//    TENTAR SOMENTE O LOCAL VALIDADO
    // ----------------------------------------------------------

    const enderecoLocal =
        obterEnderecoCheckoutLocal();

    if (
        enderecoLocal &&
        enderecoLocal.id
    ) {

        console.log(
            'ℹ️ Utilizando endereço local previamente validado.'
        );

        return enderecoLocal;
    }

    return null;
}


// ============================================================
// 11. FORMATAÇÃO DE VALOR
// ============================================================

function formatarValorCheckout(valor) {

    return (
        `R$ ${Number(valor || 0)
            .toFixed(2)
            .replace('.', ',')}`
    );
}


// ============================================================
// 12. CONFIGURAR AUTOCOMPLETE
// ============================================================

function configurarAutocompleteCheckout() {

    const campos = [

        {
            id: 'end-nome',
            autocomplete: 'name',
            name: 'name'
        },

        {
            id: 'end-cep',
            autocomplete: 'postal-code',
            name: 'postal-code'
        },

        {
            id: 'end-rua',
            autocomplete: 'address-line1',
            name: 'address-line1'
        },

        {
            id: 'end-numero',
            autocomplete: 'address-line2',
            name: 'address-line2'
        },

        {
            id: 'end-complemento',
            autocomplete: 'address-line3',
            name: 'address-line3'
        },

        {
            id: 'end-bairro',
            autocomplete: 'address-level3',
            name: 'address-level3'
        },

        {
            id: 'end-cidade',
            autocomplete: 'address-level2',
            name: 'address-level2'
        },

        {
            id: 'end-uf',
            autocomplete: 'address-level1',
            name: 'address-level1'
        }
    ];

    campos.forEach(
        campo => {

            const input =
                document.getElementById(
                    campo.id
                );

            if (!input) {
                return;
            }

            input.setAttribute(
                'autocomplete',
                campo.autocomplete
            );

            input.setAttribute(
                'name',
                campo.name
            );
        }
    );
}


// ============================================================
// 13. PREENCHER FORMULÁRIO
// ============================================================

function preencherFormularioEnderecoCheckout(
    endereco
) {

    if (!endereco) {
        return;
    }

    const campos = {

        'end-nome':
            endereco.nome ||
            endereco.nome_destinatario ||
            '',

        'end-cep':
            endereco.cep ||
            '',

        'end-rua':
            endereco.rua ||
            '',

        'end-numero':
            endereco.numero ||
            '',

        'end-complemento':
            endereco.complemento ||
            '',

        'end-bairro':
            endereco.bairro ||
            '',

        'end-cidade':
            endereco.cidade ||
            '',

        'end-uf':
            (
                endereco.uf ||
                endereco.estado ||
                ''
            ).toUpperCase()
    };

    Object.entries(campos)
        .forEach(
            ([id, valor]) => {

                const elemento =
                    document.getElementById(
                        id
                    );

                if (elemento) {

                    elemento.value =
                        valor;
                }
            }
        );
}


// ============================================================
// 14. LIMPAR FORMULÁRIO
// ============================================================

function limparFormularioEnderecoCheckout() {

    const ids = [

        'end-nome',
        'end-cep',
        'end-rua',
        'end-numero',
        'end-complemento',
        'end-bairro',
        'end-cidade',
        'end-uf'
    ];

    ids.forEach(
        id => {

            const elemento =
                document.getElementById(
                    id
                );

            if (elemento) {
                elemento.value = '';
            }
        }
    );

    const cepStatus =
        document.getElementById(
            'cep-status'
        );

    if (cepStatus) {
        cepStatus.textContent = '';
    }
}


// ============================================================
// 15. RENDERIZAR ENDEREÇO
// ============================================================

async function renderizarEnderecoCheckout() {

    const box =
        document.getElementById(
            'box-endereco-cadastrado'
        );

    const formulario =
        document.getElementById(
            'form-endereco'
        );

    const cancelar =
        document.getElementById(
            'btn-cancelar-alteracao'
        );

    if (
        !box ||
        !formulario
    ) {

        console.warn(
            '⚠️ Elementos de endereço não encontrados.'
        );

        return;
    }

    const endereco =
        await obterEnderecoCheckout();

    // ========================================================
    // EXISTE ENDEREÇO VÁLIDO
    // ========================================================

    if (
        endereco &&
        endereco.id &&
        endereco.cliente_id &&
        endereco.rua &&
        endereco.cep
    ) {

        const nome =
            document.getElementById(
                'card-end-nome'
            );

        const rua =
            document.getElementById(
                'card-end-rua-num'
            );

        const bairro =
            document.getElementById(
                'card-end-bairro-cidade'
            );

        const cep =
            document.getElementById(
                'card-end-cep'
            );

        if (nome) {

            nome.textContent =
                endereco.nome ||
                endereco.nome_destinatario ||
                '';
        }

        if (rua) {

            rua.textContent =
                `${endereco.rua}, nº ${endereco.numero || ''}` +
                (
                    endereco.complemento
                        ? ` (${endereco.complemento})`
                        : ''
                );
        }

        if (bairro) {

            const estado =
                (
                    endereco.estado ||
                    endereco.uf ||
                    ''
                ).toUpperCase();

            bairro.textContent =
                `${endereco.bairro || ''} - ` +
                `${endereco.cidade || ''}/` +
                `${estado}`;
        }

        if (cep) {

            cep.textContent =
                `CEP: ${endereco.cep || ''}`;
        }

        preencherFormularioEnderecoCheckout(
            endereco
        );

        box.style.display =
            'block';

        formulario.style.display =
            'none';

        if (cancelar) {

            cancelar.style.display =
                'none';
        }

        console.log(
            '✅ Card de endereço exibido.'
        );

        return;
    }


    // ========================================================
    // NÃO EXISTE ENDEREÇO
    // ========================================================

    console.log(
        'ℹ️ Cliente sem endereço. Exibindo formulário.'
    );

    box.style.display =
        'none';

    formulario.style.display =
        'flex';

    if (cancelar) {

        // ----------------------------------------------------
        // CORREÇÃO:
        // Se não existe endereço cadastrado, não existe
        // estado anterior para cancelar.
        //
        // Portanto o botão CANCELAR permanece escondido.
        // ----------------------------------------------------

        cancelar.style.display =
            'none';
    }
}


// ============================================================
// 16. ALTERNAR FORMULÁRIO DE ENDEREÇO
// ============================================================
//
// CORREÇÃO PRINCIPAL DO BUG:
//
// true:
//   abre o formulário.
//
// false:
//   somente fecha o formulário se EXISTIR um endereço válido.
//
// Se não existir endereço, o formulário permanece aberto.
// ============================================================

async function alternarFormularioCheckout(
    exibirFormulario
) {

    const box =
        document.getElementById(
            'box-endereco-cadastrado'
        );

    const formulario =
        document.getElementById(
            'form-endereco'
        );

    const cancelar =
        document.getElementById(
            'btn-cancelar-alteracao'
        );

    if (
        !box ||
        !formulario
    ) {
        return;
    }


    // ========================================================
    // ABRIR FORMULÁRIO
    // ========================================================

    if (exibirFormulario === true) {

        box.style.display =
            'none';

        formulario.style.display =
            'flex';


        // ----------------------------------------------------
        // Verificar se existe endereço real
        // ----------------------------------------------------

        const endereco =
            await buscarEnderecoClienteCheckout();


        if (
            endereco &&
            endereco.id
        ) {

            preencherFormularioEnderecoCheckout(
                endereco
            );

            if (cancelar) {

                cancelar.style.display =
                    'inline-block';
            }

        } else {

            // ------------------------------------------------
            // CLIENTE SEM ENDEREÇO
            // ------------------------------------------------

            if (cancelar) {

                cancelar.style.display =
                    'none';
            }

            console.log(
                'ℹ️ Cliente sem endereço. Cancelamento desabilitado.'
            );
        }

        return;
    }


    // ========================================================
    // FECHAR / CANCELAR FORMULÁRIO
    // ========================================================

    if (exibirFormulario === false) {

        // ----------------------------------------------------
        // Verificar se existe endereço válido.
        // ----------------------------------------------------

        const endereco =
            await buscarEnderecoClienteCheckout();


        // ----------------------------------------------------
        // NÃO EXISTE ENDEREÇO
        // ----------------------------------------------------
        //
        // NÃO fechar o formulário.
        // Isso corrige o bug relatado.
        // ----------------------------------------------------

        if (
            !endereco ||
            !endereco.id
        ) {

            box.style.display =
                'none';

            formulario.style.display =
                'flex';

            if (cancelar) {

                cancelar.style.display =
                    'none';
            }

            console.log(
                'ℹ️ Cancelamento ignorado: cliente não possui endereço cadastrado.'
            );

            return;
        }


        // ----------------------------------------------------
        // EXISTE ENDEREÇO
        // ----------------------------------------------------

        preencherFormularioEnderecoCheckout(
            endereco
        );

        box.style.display =
            'block';

        formulario.style.display =
            'none';

        if (cancelar) {

            cancelar.style.display =
                'none';
        }

        console.log(
            '↩️ Retornando para o endereço cadastrado.'
        );
    }
}


// ============================================================
// 17. RENDERIZAR ITENS DO CHECKOUT
// ============================================================

function renderizarItensCheckout() {

    const lista =
        document.getElementById(
            'chk-lista-itens'
        );

    if (!lista) {
        return;
    }

    if (
        typeof CarrinhoModule ===
        'undefined'
    ) {

        console.error(
            '❌ CarrinhoModule não está disponível.'
        );

        return;
    }

    const itens =
        typeof carrinhoState !== 'undefined' &&
        carrinhoState &&
        Array.isArray(
            carrinhoState.itens
        )
            ? carrinhoState.itens
            : [];

    if (
        itens.length === 0
    ) {

        lista.innerHTML = `
            <p
                style="
                    color:#64748b;
                    font-size:13px;
                "
            >
                Seu carrinho está vazio.
            </p>
        `;

        return;
    }

    lista.innerHTML =
        itens
            .map(
                item => {

                    const preco =
                        parseFloat(
                            item.preco
                        ) || 0;

                    const quantidade =
                        parseInt(
                            item.quantidade
                        ) || 0;

                    const subtotal =
                        preco *
                        quantidade;

                    return `
                        <div
                            class="item-linha"
                            style="
                                display:flex;
                                justify-content:space-between;
                                align-items:center;
                                gap:12px;
                                margin-bottom:8px;
                                font-size:14px;
                            "
                        >

                            <span
                                class="item-qtd-nome"
                            >
                                ${quantidade}x
                                ${item.nome || 'Produto'}
                            </span>

                            <span
                                class="item-preco"
                                style="
                                    font-weight:600;
                                    white-space:nowrap;
                                "
                            >
                                ${formatarValorCheckout(
                                    subtotal
                                )}
                            </span>

                        </div>
                    `;
                }
            )
            .join('');
}


// ============================================================
// 18. ATUALIZAR TÍTULO DOS ITENS
// ============================================================

function atualizarTituloItensCheckout() {

    const titulo =
        document.getElementById(
            'chk-titulo-itens'
        );

    if (!titulo) {
        return;
    }

    if (
        typeof CarrinhoModule ===
        'undefined'
    ) {
        return;
    }

    const quantidade =
        CarrinhoModule
            .quantidadeTotal();

    titulo.textContent =
        `📦 Itens do Pedido (${quantidade})`;
}


// ============================================================
// 19. ATUALIZAR RESUMO
// ============================================================

function atualizarResumoCheckout() {

    const subtotalEl =
        document.getElementById(
            'chk-subtotal'
        );

    const freteEl =
        document.getElementById(
            'chk-frete'
        );

    const descontoEl =
        document.getElementById(
            'chk-desconto'
        );

    const totalEl =
        document.getElementById(
            'chk-total'
        );

    if (
        typeof CarrinhoModule ===
        'undefined'
    ) {

        console.error(
            '❌ CarrinhoModule não está disponível.'
        );

        return;
    }

    const valores =
        CarrinhoModule
            .calcularValores();

    if (subtotalEl) {

        subtotalEl.textContent =
            formatarValorCheckout(
                valores.subtotal
            );
    }

    if (freteEl) {

        freteEl.textContent =
            formatarValorCheckout(
                valores.taxaEntrega
            );
    }

    if (descontoEl) {

        descontoEl.textContent =
            formatarValorCheckout(
                valores.valorDesconto
            );
    }

    if (totalEl) {

        totalEl.textContent =
            formatarValorCheckout(
                valores.total
            );
    }
}


// ============================================================
// 20. CONFIGURAR PAGAMENTO
// ============================================================

function configurarPagamentoCheckout() {

    const radios =
        document.querySelectorAll(
            'input[name="pagamento"]'
        );

    if (!radios.length) {
        return;
    }

    const metodoSalvo =
        localStorage.getItem(
            'ultimo_metodo_pagamento'
        );

    const metodoSelecionado =
        metodoSalvo ||
        'pix';

    let encontrouMetodo =
        false;

    radios.forEach(
        radio => {

            if (
                radio.value ===
                metodoSelecionado
            ) {

                radio.checked =
                    true;

                encontrouMetodo =
                    true;
            }

            radio.addEventListener(
                'change',
                event => {

                    const metodo =
                        event.target.value;

                    localStorage.setItem(
                        'ultimo_metodo_pagamento',
                        metodo
                    );
                }
            );
        }
    );

    if (!encontrouMetodo) {

        const primeiro =
            radios[0];

        if (primeiro) {

            primeiro.checked =
                true;

            localStorage.setItem(
                'ultimo_metodo_pagamento',
                primeiro.value
            );
        }
    }
}


// ============================================================
// 21. OBTER DADOS DO FORMULÁRIO
// ============================================================

function obterDadosEnderecoFormularioCheckout() {

    const nome =
        document.getElementById(
            'end-nome'
        )?.value.trim() || '';

    const cep =
        document.getElementById(
            'end-cep'
        )?.value.trim() || '';

    const rua =
        document.getElementById(
            'end-rua'
        )?.value.trim() || '';

    const numero =
        document.getElementById(
            'end-numero'
        )?.value.trim() || '';

    const complemento =
        document.getElementById(
            'end-complemento'
        )?.value.trim() || '';

    const bairro =
        document.getElementById(
            'end-bairro'
        )?.value.trim() || '';

    const cidade =
        document.getElementById(
            'end-cidade'
        )?.value.trim() || '';

    const uf =
        document.getElementById(
            'end-uf'
        )?.value.trim().toUpperCase() || '';

    return {

        nome:
            nome,

        nome_destinatario:
            nome,

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
            uf,

        estado:
            uf
    };
}


// ============================================================
// 22. VALIDAR FORMULÁRIO DE ENDEREÇO
// ============================================================

function validarFormularioEnderecoCheckout() {

    const endereco =
        obterDadosEnderecoFormularioCheckout();

    const camposObrigatorios = [

        {
            valor: endereco.nome,
            nome: 'Nome completo'
        },

        {
            valor: endereco.cep,
            nome: 'CEP'
        },

        {
            valor: endereco.rua,
            nome: 'Rua / Endereço'
        },

        {
            valor: endereco.numero,
            nome: 'Número'
        },

        {
            valor: endereco.bairro,
            nome: 'Bairro'
        },

        {
            valor: endereco.cidade,
            nome: 'Cidade'
        },

        {
            valor: endereco.uf,
            nome: 'UF'
        }
    ];

    for (
        const campo of camposObrigatorios
    ) {

        if (!campo.valor) {

            alert(
                `Preencha o campo "${campo.nome}" antes de continuar.`
            );

            return false;
        }
    }

    return true;
}


// ============================================================
// 23. SALVAR NOVO ENDEREÇO DO CHECKOUT
// ============================================================
//
// Quando o cliente não possui endereço cadastrado e preenche
// o formulário, o endereço precisa ser salvo no Supabase.
//
// Depois disso o ID real do endereço será utilizado no pedido.
// ============================================================

async function salvarNovoEnderecoCheckout() {

    const clienteId =
        obterClienteIdCheckout();

    if (!clienteId) {

        throw new Error(
            'Cliente não identificado.'
        );
    }

    const supabase =
        obterSupabaseCheckout();

    if (!supabase) {

        throw new Error(
            'Conexão com o Supabase não encontrada.'
        );
    }

    if (
        !validarFormularioEnderecoCheckout()
    ) {

        return null;
    }

    const dados =
        obterDadosEnderecoFormularioCheckout();

    console.log(
        '📍 Salvando novo endereço do cliente:',
        clienteId
    );

    const {
        data,
        error
    } = await supabase
        .from('enderecos')
        .insert([

            {
                cliente_id:
                    clienteId,

                nome_destinatario:
                    dados.nome_destinatario,

                cep:
                    dados.cep,

                rua:
                    dados.rua,

                numero:
                    dados.numero,

                complemento:
                    dados.complemento,

                bairro:
                    dados.bairro,

                cidade:
                    dados.cidade,

                estado:
                    dados.estado,

                principal:
                    true
            }

        ])
        .select(`
            id,
            cliente_id,
            nome_destinatario,
            cep,
            rua,
            numero,
            complemento,
            bairro,
            cidade,
            estado,
            principal,
            created_at,
            updated_at
        `)
        .single();

    if (error) {

        console.error(
            '❌ Erro ao salvar endereço:',
            error
        );

        throw new Error(
            error.message ||
            'Não foi possível salvar o endereço.'
        );
    }

    if (
        !data ||
        !data.id
    ) {

        throw new Error(
            'O endereço foi salvo, mas o ID não foi retornado.'
        );
    }

    const endereco =
        normalizarEnderecoCheckout(
            data
        );

    // ----------------------------------------------------------
    // PROTEÇÃO
    // ----------------------------------------------------------

    if (
        String(endereco.cliente_id) !==
        String(clienteId)
    ) {

        throw new Error(
            'Erro de segurança: o endereço retornado não pertence ao cliente logado.'
        );
    }

    salvarEnderecoCheckoutLocal(
        endereco
    );

    console.log(
        '✅ Novo endereço cadastrado:',
        endereco
    );

    return endereco;
}


// ============================================================
// 24. OBTER DADOS DO ENDEREÇO
// ============================================================

async function obterDadosEnderecoCheckout() {

    // ----------------------------------------------------------
    // PRIMEIRO: BUSCAR ENDEREÇO REAL
    // ----------------------------------------------------------

    const endereco =
        await obterEnderecoCheckout();

    if (
        endereco &&
        endereco.id
    ) {

        return endereco;
    }

    // ----------------------------------------------------------
    // SE NÃO EXISTE, CADASTRAR O ENDEREÇO PREENCHIDO
    // ----------------------------------------------------------

    return await salvarNovoEnderecoCheckout();
}


// ============================================================
// 25. VALIDAR CHECKOUT
// ============================================================

async function validarCheckout() {

    const usuario =
        obterUsuarioCheckout();

    if (!usuario) {

        alert(
            'Você precisa estar logado para continuar.'
        );

        window.location.href =
            '02-Login.html';

        return false;
    }

    if (
        typeof CarrinhoModule ===
        'undefined'
    ) {

        alert(
            'O carrinho não foi carregado corretamente.'
        );

        return false;
    }

    if (
        typeof carrinhoState === 'undefined' ||
        !carrinhoState ||
        !Array.isArray(
            carrinhoState.itens
        ) ||
        carrinhoState.itens.length === 0
    ) {

        alert(
            'Seu carrinho está vazio.'
        );

        return false;
    }


    // ========================================================
    // BUSCAR ENDEREÇO DO CLIENTE
    // ========================================================

    let endereco =
        await obterEnderecoCheckout();


    // ========================================================
    // SE NÃO POSSUI ENDEREÇO, TENTAR CADASTRAR O FORMULÁRIO
    // ========================================================

    if (!endereco) {

        console.log(
            'ℹ️ Cliente sem endereço. Verificando formulário...'
        );

        const formulario =
            document.getElementById(
                'form-endereco'
            );

        if (
            formulario &&
            formulario.style.display !== 'none'
        ) {

            endereco =
                await salvarNovoEnderecoCheckout();
        }
    }


    // ========================================================
    // AINDA SEM ENDEREÇO
    // ========================================================

    if (!endereco) {

        alert(
            'Você precisa cadastrar um endereço de entrega antes de continuar.'
        );

        await alternarFormularioCheckout(
            true
        );

        return false;
    }


    // ========================================================
    // ENDEREÇO SEM ID
    // ========================================================

    if (!endereco.id) {

        alert(
            'Não foi possível identificar o endereço de entrega. Cadastre o endereço novamente.'
        );

        await alternarFormularioCheckout(
            true
        );

        return false;
    }


    // ========================================================
    // VALIDAR PROPRIETÁRIO DO ENDEREÇO
    // ========================================================

    const clienteId =
        obterClienteIdCheckout();

    if (
        !endereco.cliente_id ||
        String(endereco.cliente_id) !==
        String(clienteId)
    ) {

        console.error(
            '🚨 ENDEREÇO DE OUTRO CLIENTE BLOQUEADO.',
            {
                endereco_cliente_id:
                    endereco.cliente_id,

                cliente_logado:
                    clienteId
            }
        );

        alert(
            'O endereço de entrega não pertence ao cliente logado. Selecione ou cadastre outro endereço.'
        );

        localStorage.removeItem(
            chaveEnderecoCheckout()
        );

        await alternarFormularioCheckout(
            true
        );

        return false;
    }


    // ========================================================
    // VALIDAR CAMPOS
    // ========================================================

    const estado =
        endereco.estado ||
        endereco.uf ||
        '';

    if (
        !endereco.rua ||
        !endereco.numero ||
        !endereco.bairro ||
        !endereco.cidade ||
        !estado ||
        !endereco.cep
    ) {

        alert(
            'O endereço de entrega está incompleto. Complete o endereço antes de continuar.'
        );

        await alternarFormularioCheckout(
            true
        );

        return false;
    }


    console.log(
        '=========================================='
    );

    console.log(
        '✅ CHECKOUT VALIDADO'
    );

    console.log(
        'CLIENTE:',
        clienteId
    );

    console.log(
        'ENDEREÇO:',
        endereco
    );

    console.log(
        'ENDEREÇO ID:',
        endereco.id
    );

    console.log(
        '=========================================='
    );

    return true;
}


// ============================================================
// 26. PREPARAR DADOS DO PEDIDO PIX
// ============================================================

async function prepararDadosPedidoPix() {

    const usuario =
        obterUsuarioCheckout();

    if (!usuario) {

        throw new Error(
            'Usuário não encontrado.'
        );
    }

    if (
        typeof CarrinhoModule ===
        'undefined'
    ) {

        throw new Error(
            'CarrinhoModule não está disponível.'
        );
    }

    const endereco =
        await obterEnderecoCheckout();

    if (
        !endereco ||
        !endereco.id
    ) {

        throw new Error(
            'Não foi possível identificar o endereço de entrega. O pedido não pode ser criado sem endereço.'
        );
    }


    // ----------------------------------------------------------
    // PROTEÇÃO CONTRA ENDEREÇO DE OUTRO CLIENTE
    // ----------------------------------------------------------

    if (
        !endereco.cliente_id ||
        String(endereco.cliente_id) !==
        String(usuario.id)
    ) {

        throw new Error(
            'Erro de segurança: o endereço não pertence ao cliente logado.'
        );
    }


    const valores =
        CarrinhoModule
            .calcularValores();

    const itens =
        Array.isArray(
            carrinhoState.itens
        )
            ? carrinhoState.itens
            : [];

    if (
        itens.length === 0
    ) {

        throw new Error(
            'O carrinho está vazio.'
        );
    }

    const dadosPedido = {

        cliente_id:
            usuario.id,

        endereco_id:
            endereco.id,

        valor:
            Number(
                valores.total
            ) || 0,

        subtotal:
            Number(
                valores.subtotal
            ) || 0,

        frete:
            Number(
                valores.taxaEntrega
            ) || 0,

        desconto:
            Number(
                valores.valorDesconto
            ) || 0,

        itens:
            itens.map(
                item => ({

                    id:
                        item.id,

                    quantidade:
                        Number(
                            item.quantidade
                        ) || 1
                })
            )
    };


    if (
        !dadosPedido.endereco_id
    ) {

        throw new Error(
            'Erro de segurança: endereco_id não foi definido.'
        );
    }

    console.log(
        '=========================================='
    );

    console.log(
        'DADOS DO PEDIDO PREPARADOS'
    );

    console.log(
        dadosPedido
    );

    console.log(
        'CLIENTE ID:',
        dadosPedido.cliente_id
    );

    console.log(
        'ENDEREÇO ID:',
        dadosPedido.endereco_id
    );

    console.log(
        '=========================================='
    );

    return dadosPedido;
}


// ============================================================
// 27. SALVAR DADOS DO PIX
// ============================================================

function salvarDadosPagamentoPix(
    resultado,
    dadosPedido
) {

    const pedidoLocal = {

        id:
            resultado.pedido_id,

        numero_pedido:
            resultado.numero_pedido,

        cliente_id:
            dadosPedido.cliente_id,

        endereco_id:
            dadosPedido.endereco_id,

        status:
            'pendente',

        status_pagamento:
            'pendente',

        forma_pagamento:
            'PIX',

        subtotal:
            resultado.subtotal ??
            dadosPedido.subtotal,

        frete:
            resultado.frete ??
            dadosPedido.frete,

        desconto:
            resultado.desconto ??
            dadosPedido.desconto,

        total:
            resultado.total ??
            dadosPedido.valor
    };

    const pagamentoLocal = {

        pedido_id:
            resultado.pedido_id,

        numero_pedido:
            resultado.numero_pedido,

        order_id:
            resultado.order_id,

        pagamento_id:
            resultado.pagamento_id,

        status:
            resultado.status,

        status_detail:
            resultado.status_detail,

        total:
            resultado.total,

        qr_code:
            resultado.qr_code,

        qr_code_base64:
            resultado.qr_code_base64,

        ticket_url:
            resultado.ticket_url
    };

    localStorage.setItem(
        'pedido_pix_atual',
        JSON.stringify(
            pedidoLocal
        )
    );

    localStorage.setItem(
        'pedido_atual',
        JSON.stringify(
            pedidoLocal
        )
    );

    localStorage.setItem(
        'pagamento_pix_atual',
        JSON.stringify(
            pagamentoLocal
        )
    );

    localStorage.setItem(
        'pedido_id_pix_verificacao',
        String(
            resultado.pedido_id
        )
    );
}


// ============================================================
// 28. INICIAR PAGAMENTO PIX
// ============================================================

async function iniciarPagamentoPix() {

    const checkoutValido =
        await validarCheckout();

    if (!checkoutValido) {
        return;
    }

    const botao =
        document.querySelector(
            '.btn-finalizar'
        );

    const textoOriginal =
        botao
            ? botao.textContent
            : 'Confirmar e Pagar 🚀';

    try {

        if (botao) {

            botao.disabled =
                true;

            botao.style.opacity =
                '0.7';

            botao.style.cursor =
                'wait';

            botao.textContent =
                'Gerando PIX...';
        }


        // ------------------------------------------------------
        // BUSCAR ENDEREÇO NOVAMENTE
        // ------------------------------------------------------

        const endereco =
            await obterEnderecoCheckout();

        if (
            !endereco ||
            !endereco.id
        ) {

            throw new Error(
                'Endereço de entrega não encontrado. O pedido não será criado.'
            );
        }


        // ------------------------------------------------------
        // VERIFICAR PROPRIETÁRIO
        // ------------------------------------------------------

        const usuario =
            obterUsuarioCheckout();

        if (
            !usuario ||
            !endereco.cliente_id ||
            String(endereco.cliente_id) !==
            String(usuario.id)
        ) {

            throw new Error(
                'Erro de segurança: o endereço não pertence ao cliente logado.'
            );
        }


        salvarEnderecoCheckoutLocal(
            endereco
        );


        // ------------------------------------------------------
        // PREPARAR PEDIDO
        // ------------------------------------------------------

        const dadosPedido =
            await prepararDadosPedidoPix();


        if (
            !dadosPedido.endereco_id
        ) {

            throw new Error(
                'Pedido bloqueado: endereco_id está vazio.'
            );
        }


        console.log(
            '=========================================='
        );

        console.log(
            'ENVIANDO DADOS PARA CRIAR PIX'
        );

        console.log(
            dadosPedido
        );

        console.log(
            'ENDEREÇO ENVIADO:',
            dadosPedido.endereco_id
        );

        console.log(
            '=========================================='
        );


        // ------------------------------------------------------
        // CHAMAR EDGE FUNCTION
        // ------------------------------------------------------

        const resposta =
            await fetch(
                FUNCAO_CRIAR_PIX,
                {

                    method:
                        'POST',

                    headers: {

                        'Content-Type':
                            'application/json',

                        'apikey':
                            window.SUPABASE_ANON_KEY ||
                            ''
                    },

                    body:
                        JSON.stringify(
                            dadosPedido
                        )
                }
            );


        const texto =
            await resposta.text();

        let resultado;

        try {

            resultado =
                JSON.parse(
                    texto
                );

        } catch {

            resultado = {

                sucesso:
                    false,

                error:
                    texto
            };
        }


        console.log(
            'RESPOSTA CRIAR PIX:',
            resultado
        );


        // ------------------------------------------------------
        // ERRO HTTP
        // ------------------------------------------------------

        if (!resposta.ok) {

            throw new Error(
                resultado?.error ||
                `Erro ao criar PIX. HTTP ${resposta.status}`
            );
        }


        // ------------------------------------------------------
        // FUNÇÃO NÃO CONFIRMOU SUCESSO
        // ------------------------------------------------------

        if (
            resultado?.sucesso !== true
        ) {

            throw new Error(
                resultado?.error ||
                'A criação do PIX não foi concluída.'
            );
        }


        // ------------------------------------------------------
        // PEDIDO NÃO RETORNADO
        // ------------------------------------------------------

        if (
            !resultado.pedido_id
        ) {

            throw new Error(
                'O pedido foi criado, mas o ID do pedido não foi retornado.'
            );
        }


        // ------------------------------------------------------
        // QR CODE NÃO RETORNADO
        // ------------------------------------------------------

        if (
            !resultado.qr_code &&
            !resultado.qr_code_base64
        ) {

            throw new Error(
                'O Mercado Pago não retornou os dados do QR Code PIX.'
            );
        }


        // ------------------------------------------------------
        // SALVAR PEDIDO E PAGAMENTO
        // ------------------------------------------------------

        salvarDadosPagamentoPix(
            resultado,
            dadosPedido
        );


        // ------------------------------------------------------
        // REDIRECIONAR
        // ------------------------------------------------------

        window.location.href =
            '04-Pagamento-pix.html';


    } catch (erro) {

        console.error(
            '=========================================='
        );

        console.error(
            '❌ ERRO AO INICIAR PAGAMENTO PIX:',
            erro
        );

        console.error(
            '=========================================='
        );

        alert(
            erro?.message ||
            'Não foi possível gerar o pagamento PIX. Tente novamente.'
        );

        if (botao) {

            botao.disabled =
                false;

            botao.style.opacity =
                '';

            botao.style.cursor =
                'pointer';

            botao.textContent =
                textoOriginal;
        }
    }
}


// ============================================================
// 29. FINALIZAR CHECKOUT
// ============================================================

async function finalizarCheckout() {

    const checkoutValido =
        await validarCheckout();

    if (!checkoutValido) {
        return;
    }

    const pagamento =
        document.querySelector(
            'input[name="pagamento"]:checked'
        );

    const metodo =
        pagamento
            ? pagamento.value
            : 'pix';


    // ========================================================
    // PIX
    // ========================================================

    if (
        metodo === 'pix'
    ) {

        await iniciarPagamentoPix();

        return;
    }


    // ========================================================
    // OUTROS MÉTODOS
    // ========================================================

    alert(
        'Este método de pagamento ainda está em configuração.'
    );
}


// ============================================================
// 30. CONFIGURAR BOTÃO VOLTAR
// ============================================================

function configurarVoltarProdutoCheckout() {

    const botao =
        document.getElementById(
            'btn-voltar-produto'
        );

    if (!botao) {

        console.warn(
            '⚠️ Botão btn-voltar-produto não encontrado.'
        );

        return;
    }

    let produtoOrigem =
        null;

    try {

        const dados =
            localStorage.getItem(
                'produto_origem_checkout'
            );

        if (dados) {

            produtoOrigem =
                JSON.parse(
                    dados
                );
        }

    } catch (erro) {

        console.warn(
            '⚠️ Não foi possível recuperar o produto de origem:',
            erro
        );

        produtoOrigem =
            null;
    }


    if (
        produtoOrigem &&
        produtoOrigem.id
    ) {

        botao.href =
            `01-produtos.html?id=${encodeURIComponent(
                produtoOrigem.id
            )}`;

        console.log(
            '↩️ Botão voltar configurado para o produto:',
            produtoOrigem
        );

        return;
    }


    botao.href =
        '01-produtos.html';

    console.log(
        'ℹ️ Produto de origem não encontrado.'
    );

    console.log(
        '↩️ Voltando para 01-produtos.html.'
    );
}


// ============================================================
// 31. CARREGAR CHECKOUT
// ============================================================

async function carregarCheckout() {

    const usuario =
        obterUsuarioCheckout();

    if (!usuario) {

        alert(
            'Você precisa estar logado para acessar o checkout.'
        );

        window.location.href =
            '02-Login.html';

        return;
    }

    console.log(
        '=========================================='
    );

    console.log(
        '🛒 CHECKOUT INICIADO'
    );

    console.log(
        'CLIENTE LOGADO:',
        usuario
    );

    console.log(
        'CLIENTE ID:',
        usuario.id
    );

    console.log(
        '=========================================='
    );


    configurarAutocompleteCheckout();

    configurarVoltarProdutoCheckout();


    // ----------------------------------------------------------
    // BUSCAR ENDEREÇO
    // ----------------------------------------------------------

    await renderizarEnderecoCheckout();


    // ----------------------------------------------------------
    // RESTANTE DO CHECKOUT
    // ----------------------------------------------------------

    renderizarItensCheckout();

    atualizarTituloItensCheckout();

    atualizarResumoCheckout();

    configurarPagamentoCheckout();
}


// ============================================================
// 32. EVENTOS
// ============================================================

document.addEventListener(
    'DOMContentLoaded',
    () => {

        const pagina =
            window.location.pathname
                .toLowerCase();

        if (
            pagina.includes(
                'checkout'
            )
        ) {

            carregarCheckout();
        }
    }
);


// ============================================================
// 33. EXPORTAÇÕES GLOBAIS
// ============================================================

window.carregarCheckout =
    carregarCheckout;

window.finalizarCheckout =
    finalizarCheckout;

window.iniciarPagamentoPix =
    iniciarPagamentoPix;

window.alternarFormularioEndereco =
    alternarFormularioCheckout;

window.renderizarEnderecoCheckout =
    renderizarEnderecoCheckout;

window.atualizarResumoCheckout =
    atualizarResumoCheckout;

window.obterEnderecoCheckout =
    obterEnderecoCheckout;

window.buscarEnderecoClienteCheckout =
    buscarEnderecoClienteCheckout;

window.configurarVoltarProdutoCheckout =
    configurarVoltarProdutoCheckout;

window.salvarNovoEnderecoCheckout =
    salvarNovoEnderecoCheckout;

window.limparFormularioEnderecoCheckout =
    limparFormularioEnderecoCheckout;


// ============================================================
// 34. COMPATIBILIDADE COM O HTML
// ============================================================

function validarEConfirmarPedido() {

    return finalizarCheckout();
}

window.validarEConfirmarPedido =
    validarEConfirmarPedido;


// ============================================================
// FIM DO 05-CHECKOUT.JS
// ============================================================
