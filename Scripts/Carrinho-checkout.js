
// ============================================================
// ZORAVISION - CARRINHO / CHECKOUT
// Integração com Supabase
// ============================================================


// ============================================================
// 1. SUPABASE
// ============================================================

function obterSupabase() {
    if (window.supabaseClient) {
        return window.supabaseClient;
    }

    console.error(
        'Supabase não está disponível em window.supabaseClient.'
    );

    return null;
}


// ============================================================
// 2. USUÁRIO LOGADO
// ============================================================

function obterUsuarioLogado() {
    try {
        const usuario = JSON.parse(
            localStorage.getItem('usuario_logado')
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
            'Erro ao ler usuário logado:',
            erro
        );

        return null;
    }
}


// ============================================================
// 3. CHAVE DO CARRINHO
// ============================================================

function chaveCarrinhoCliente() {
    const usuario = obterUsuarioLogado();

    if (usuario && usuario.email) {
        return (
            'carrinho_' +
            usuario.email
                .trim()
                .toLowerCase()
        );
    }

    return 'carrinho';
}


// ============================================================
// 4. CHAVE DO ENDEREÇO
// ============================================================

function chaveEnderecoCliente() {
    const usuario = obterUsuarioLogado();

    if (usuario && usuario.email) {
        return (
            'ultimo_endereco_cliente_' +
            usuario.email
                .trim()
                .toLowerCase()
        );
    }

    return 'ultimo_endereco_cliente';
}


// ============================================================
// 5. CARREGAR CARRINHO
// ============================================================

function carregarCarrinhoStorage() {
    const usuario = obterUsuarioLogado();

    if (!usuario) {
        return [];
    }

    try {
        const dados = JSON.parse(
            localStorage.getItem(
                chaveCarrinhoCliente()
            )
        );

        return Array.isArray(dados)
            ? dados
            : [];

    } catch (erro) {
        console.error(
            'Erro ao carregar carrinho:',
            erro
        );

        return [];
    }
}


// ============================================================
// 6. ESTADO GLOBAL
// ============================================================

const checkoutState = {
    carrinho: carregarCarrinhoStorage(),

    cupomAtivo: null,

    descontoPorcentagem: 0,

    metodoPagamento:
        localStorage.getItem(
            'ultimo_metodo_pagamento'
        ) || 'pix',

    taxaEntrega: 5.00
};


// ============================================================
// 7. MÓDULO DO CARRINHO
// ============================================================

const CarrinhoCheckoutModule = {

    init() {
        this.bindEvents();
        this.atualizarTudo();
    },


    salvarStorage() {
        const usuario =
            obterUsuarioLogado();

        if (!usuario) {
            console.warn(
                'Carrinho não salvo: usuário não está logado.'
            );

            return;
        }

        try {
            localStorage.setItem(
                chaveCarrinhoCliente(),
                JSON.stringify(
                    checkoutState.carrinho
                )
            );

        } catch (erro) {
            console.error(
                'Erro ao salvar carrinho:',
                erro
            );

            alert(
                'Não foi possível salvar o carrinho.'
            );
        }
    },


    limparCarrinho() {
        checkoutState.carrinho = [];

        const usuario =
            obterUsuarioLogado();

        if (usuario) {
            localStorage.removeItem(
                chaveCarrinhoCliente()
            );
        }

        this.atualizarTudo();
    },


    adicionarProduto(produto) {

        const usuario =
            obterUsuarioLogado();

        if (
            !usuario ||
            !usuario.id
        ) {
            alert(
                'Você precisa estar logado para adicionar produtos ao carrinho.'
            );

            window.location.href =
                'Login.html';

            return false;
        }


        if (
            !produto ||
            !produto.id
        ) {
            console.error(
                'Produto inválido:',
                produto
            );

            return false;
        }


        const itemExistente =
            checkoutState.carrinho.find(
                item =>
                    String(item.id) ===
                    String(produto.id)
            );


        if (itemExistente) {

            itemExistente.quantidade =
                (
                    parseInt(
                        itemExistente.quantidade
                    ) || 0
                ) + 1;


            if (produto.nome) {
                itemExistente.nome =
                    produto.nome;
            }


            if (
                produto.preco !== undefined &&
                produto.preco !== null
            ) {
                itemExistente.preco =
                    parseFloat(
                        produto.preco
                    ) || 0;
            }


            if (
                produto.imagem ||
                produto.imagem_url
            ) {
                itemExistente.imagem =
                    produto.imagem ||
                    produto.imagem_url;
            }


            if (
                produto.estoque !== undefined &&
                produto.estoque !== null
            ) {
                itemExistente.estoque =
                    parseInt(
                        produto.estoque
                    );
            }

        } else {

            checkoutState.carrinho.push({

                id:
                    produto.id,

                nome:
                    produto.nome ||
                    'Produto',

                preco:
                    parseFloat(
                        produto.preco
                    ) || 0,

                imagem:
                    produto.imagem ||
                    produto.imagem_url ||
                    produto.foto ||
                    '',

                quantidade:
                    1,

                estoque:
                    produto.estoque !== undefined &&
                    produto.estoque !== null
                        ? parseInt(
                            produto.estoque
                        )
                        : null,

                sku:
                    produto.sku ||
                    '',

                categoria_id:
                    produto.categoria_id ||
                    null
            });
        }


        this.salvarStorage();

        this.atualizarTudo();

        return true;
    },


    removerProduto(id) {

        checkoutState.carrinho =
            checkoutState.carrinho.filter(
                item =>
                    String(item.id) !==
                    String(id)
            );

        this.salvarStorage();

        this.atualizarTudo();
    },


    alterarQuantidade(id, delta) {

        const usuario =
            obterUsuarioLogado();

        if (!usuario) {

            alert(
                'Faça login para alterar o carrinho.'
            );

            return;
        }


        const item =
            checkoutState.carrinho.find(
                produto =>
                    String(produto.id) ===
                    String(id)
            );


        if (!item) {
            return;
        }


        let novaQuantidade =
            (
                parseInt(
                    item.quantidade
                ) || 0
            ) + delta;


        if (
            item.estoque !== null &&
            item.estoque !== undefined
        ) {

            const estoque =
                parseInt(
                    item.estoque
                );


            if (
                !isNaN(estoque) &&
                estoque > 0 &&
                novaQuantidade > estoque
            ) {

                novaQuantidade =
                    estoque;

                alert(
                    'Quantidade máxima disponível em estoque: ' +
                    estoque
                );
            }


            if (
                !isNaN(estoque) &&
                estoque <= 0
            ) {
                novaQuantidade = 0;
            }
        }


        if (novaQuantidade <= 0) {

            this.removerProduto(id);

            return;
        }


        item.quantidade =
            novaQuantidade;


        this.salvarStorage();

        this.atualizarTudo();
    },


    calcularValores() {

        const subtotal =
            checkoutState.carrinho.reduce(
                (
                    total,
                    item
                ) => {

                    const preco =
                        parseFloat(
                            item.preco
                        ) || 0;

                    const quantidade =
                        parseInt(
                            item.quantidade
                        ) || 0;

                    return (
                        total +
                        (
                            preco *
                            quantidade
                        )
                    );
                },
                0
            );


        const valorDesconto =
            subtotal *
            (
                checkoutState
                    .descontoPorcentagem /
                100
            );


        const taxaEntrega =
            subtotal > 0
                ? Number(
                    checkoutState.taxaEntrega
                ) || 0
                : 0;


        const total =
            Math.max(
                0,
                subtotal -
                valorDesconto +
                taxaEntrega
            );


        return {
            subtotal,
            valorDesconto,
            taxaEntrega,
            total
        };
    },


    renderizarCarrinho() {

        const container =
            document.getElementById(
                'lista-carrinho'
            );


        if (!container) {
            return;
        }


        if (
            checkoutState.carrinho.length === 0
        ) {

            container.innerHTML = `
                <div style="
                    text-align:center;
                    padding:2rem 1rem;
                    color:#64748b;
                ">
                    <div style="
                        font-size:42px;
                        margin-bottom:10px;
                    ">
                        🛒
                    </div>

                    <p style="
                        font-size:0.95rem;
                        margin-bottom:0.5rem;
                    ">
                        Seu carrinho está vazio
                    </p>

                    <small>
                        Adicione produtos para começar.
                    </small>
                </div>
            `;

            return;
        }


        const iconeLixeira = `
            <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                style="width:18px;height:18px;"
            >
                <polyline points="3 6 5 6 21 6"></polyline>

                <path d="
                    M19 6v14
                    a2 2 0 0 1-2 2H7
                    a2 2 0 0 1-2-2V6
                    m3 0V4
                    a2 2 0 0 1 2-2h4
                    a2 2 0 0 1 2 2v2
                "></path>
            </svg>
        `;


        container.innerHTML =
            checkoutState.carrinho
                .map(
                    item => {

                        const imagem =
                            item.imagem &&
                            typeof item.imagem === 'string'
                                ? item.imagem.trim()
                                : '';


                        const temImagem =
                            imagem !== '' &&
                            (
                                imagem.startsWith('http') ||
                                imagem.startsWith('data:image') ||
                                imagem.startsWith('/')
                            );


                        const visual =
                            temImagem
                                ? `
                                    <img
                                        src="${imagem}"
                                        alt="${item.nome || 'Produto'}"
                                        style="
                                            width:100%;
                                            height:100%;
                                            object-fit:cover;
                                        "
                                        onerror="
                                            this.style.display='none';
                                            this.nextElementSibling.style.display='flex';
                                        "
                                    >

                                    <span style="
                                        display:none;
                                        width:100%;
                                        height:100%;
                                        align-items:center;
                                        justify-content:center;
                                        font-size:30px;
                                    ">
                                        📦
                                    </span>
                                `
                                : `
                                    <span style="
                                        display:flex;
                                        width:100%;
                                        height:100%;
                                        align-items:center;
                                        justify-content:center;
                                        font-size:30px;
                                    ">
                                        📦
                                    </span>
                                `;


                        const preco =
                            parseFloat(
                                item.preco
                            ) || 0;


                        const quantidade =
                            parseInt(
                                item.quantidade
                            ) || 0;


                        return `
                            <div
                                class="carrinho-item"
                                data-id="${item.id}"
                            >

                                <div
                                    class="item-img-box"
                                    style="
                                        overflow:hidden;
                                        display:flex;
                                        align-items:center;
                                        justify-content:center;
                                    "
                                >
                                    ${visual}
                                </div>


                                <div class="item-detalhes">

                                    <div>

                                        <p class="item-titulo">
                                            ${item.nome || 'Produto'}
                                        </p>

                                        <p class="item-preco">
                                            R$
                                            ${preco
                                                .toFixed(2)
                                                .replace('.', ',')}
                                        </p>

                                    </div>


                                    <div class="item-rodape">

                                        <div class="qtd-controles">

                                            <button
                                                type="button"
                                                class="btn-qtd"
                                                onclick="
                                                    CarrinhoCheckoutModule.alterarQuantidade(
                                                        '${item.id}',
                                                        -1
                                                    )
                                                "
                                            >
                                                −
                                            </button>


                                            <span class="qtd-num">
                                                ${quantidade}
                                            </span>


                                            <button
                                                type="button"
                                                class="btn-qtd"
                                                onclick="
                                                    CarrinhoCheckoutModule.alterarQuantidade(
                                                        '${item.id}',
                                                        1
                                                    )
                                                "
                                            >
                                                +
                                            </button>

                                        </div>


                                        <button
                                            type="button"
                                            class="btn-remover"
                                            onclick="
                                                CarrinhoCheckoutModule.removerProduto(
                                                    '${item.id}'
                                                )
                                            "
                                        >
                                            ${iconeLixeira}
                                        </button>

                                    </div>

                                </div>

                            </div>
                        `;
                    }
                )
                .join('');
    },


    atualizarResumoValores() {

        const valores =
            this.calcularValores();


        const elSubtotal =
            document.getElementById(
                'resumo-subtotal'
            );


        if (elSubtotal) {

            elSubtotal.textContent =
                `R$ ${valores.subtotal
                    .toFixed(2)
                    .replace('.', ',')}`;
        }


        const elTotal =
            document.getElementById(
                'valor-total'
            );


        if (elTotal) {

            elTotal.textContent =
                `R$ ${valores.total
                    .toFixed(2)
                    .replace('.', ',')}`;
        }


        const totalItens =
            checkoutState.carrinho.reduce(
                (
                    total,
                    item
                ) =>
                    total +
                    (
                        parseInt(
                            item.quantidade
                        ) || 0
                    ),
                0
            );


        document
            .querySelectorAll(
                '.badge-carrinho, .carrinho-badge, .carrinho-count'
            )
            .forEach(
                badge => {
                    badge.textContent =
                        totalItens;
                }
            );
    },


    atualizarTudo() {

        this.renderizarCarrinho();

        this.atualizarResumoValores();
    },


    bindEvents() {

        document
            .querySelectorAll(
                'input[name="pagamento"]'
            )
            .forEach(
                radio => {

                    radio.addEventListener(
                        'change',
                        event => {

                            checkoutState.metodoPagamento =
                                event.target.value;


                            localStorage.setItem(
                                'ultimo_metodo_pagamento',
                                event.target.value
                            );
                        }
                    );
                }
            );
    }
};


// ============================================================
// 8. NAVEGAÇÃO
// ============================================================

function voltarPaginaAnterior() {

    const anterior =
        document.referrer;


    if (
        anterior &&
        !anterior.includes(
            'carrinho.html'
        ) &&
        !anterior.includes(
            'Checkout.html'
        )
    ) {

        window.history.back();

    } else {

        window.location.href =
            'index.html';
    }
}


// ============================================================
// 9. FINALIZAR PEDIDO
// ============================================================

function finalizarPedido() {

    const usuario =
        obterUsuarioLogado();


    if (!usuario) {

        alert(
            'Faça login para finalizar seu pedido.'
        );

        window.location.href =
            'Login.html';

        return;
    }


    if (
        !checkoutState.carrinho ||
        checkoutState.carrinho.length === 0
    ) {

        alert(
            'Seu carrinho está vazio! Adicione algum produto antes de finalizar.'
        );

        return;
    }


    window.location.href =
        'Checkout.html';
}


// ============================================================
// 10. AUTOCOMPLETE
// ============================================================

function configurarCamposAutocomplete() {

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


            if (input) {

                input.setAttribute(
                    'autocomplete',
                    campo.autocomplete
                );

                input.setAttribute(
                    'name',
                    campo.name
                );
            }
        }
    );
}


// ============================================================
// 11. BUSCAR CEP
// ============================================================

async function buscarCEP() {

    const input =
        document.getElementById(
            'end-cep'
        );


    const status =
        document.getElementById(
            'cep-status'
        );


    if (!input) {
        return;
    }


    const cep =
        input.value.replace(
            /\D/g,
            ''
        );


    if (cep.length !== 8) {

        if (status) {

            status.style.color =
                '#ef4444';

            status.textContent =
                'Informe um CEP válido com 8 dígitos.';
        }

        return;
    }


    if (status) {

        status.style.color =
            '#2563eb';

        status.textContent =
            'Buscando endereço...';
    }


    try {

        const resposta =
            await fetch(
                `https://viacep.com.br/ws/${cep}/json/`
            );


        if (!resposta.ok) {
            throw new Error(
                'Falha ao consultar o ViaCEP.'
            );
        }


        const dados =
            await resposta.json();


        if (dados.erro) {

            if (status) {

                status.style.color =
                    '#ef4444';

                status.textContent =
                    'CEP não encontrado.';
            }

            return;
        }


        const rua =
            document.getElementById(
                'end-rua'
            );


        const bairro =
            document.getElementById(
                'end-bairro'
            );


        const cidade =
            document.getElementById(
                'end-cidade'
            );


        const uf =
            document.getElementById(
                'end-uf'
            );


        if (rua) {
            rua.value =
                dados.logradouro || '';
        }


        if (bairro) {
            bairro.value =
                dados.bairro || '';
        }


        if (cidade) {
            cidade.value =
                dados.localidade || '';
        }


        if (uf) {
            uf.value =
                dados.uf || '';
        }


        if (status) {

            status.style.color =
                '#10b981';

            status.textContent =
                'Endereço localizado!';
        }


        const numero =
            document.getElementById(
                'end-numero'
            );


        if (numero) {
            numero.focus();
        }


    } catch (erro) {

        console.error(
            'Erro ao consultar CEP:',
            erro
        );


        if (status) {

            status.style.color =
                '#ef4444';

            status.textContent =
                'Erro ao consultar CEP.';
        }
    }
}


// ============================================================
// 12. ENDEREÇO SALVO
// ============================================================

function checarEnderecoSalvo() {

    const box =
        document.getElementById(
            'box-endereco-cadastrado'
        );


    const formulario =
        document.getElementById(
            'form-endereco'
        );


    if (!box || !formulario) {
        return;
    }


    let endereco =
        null;


    try {

        endereco =
            JSON.parse(
                localStorage.getItem(
                    chaveEnderecoCliente()
                )
            );

    } catch (erro) {

        endereco =
            null;
    }


    if (
        endereco &&
        endereco.rua
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
                endereco.nome || '';
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

            bairro.textContent =
                `${endereco.bairro || ''} - ` +
                `${endereco.cidade || ''}/` +
                `${endereco.uf
                    ? endereco.uf.toUpperCase()
                    : ''}`;
        }


        if (cep) {

            cep.textContent =
                `CEP: ${endereco.cep || ''}`;
        }


        box.style.display =
            'block';


        formulario.style.display =
            'none';


    } else {

        box.style.display =
            'none';


        formulario.style.display =
            'flex';
    }
}


// ============================================================
// 13. ALTERNAR ENDEREÇO
// ============================================================

function alternarFormularioEndereco(
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


    if (!box || !formulario) {
        return;
    }


    if (exibirFormulario) {

        box.style.display =
            'none';


        formulario.style.display =
            'flex';


        if (cancelar) {

            cancelar.style.display =
                'inline-block';
        }

    } else {

        box.style.display =
            'block';


        formulario.style.display =
            'none';


        if (cancelar) {

            cancelar.style.display =
                'none';
        }
    }
}


// ============================================================
// 14. CARREGAR CHECKOUT
// ============================================================

function carregarCheckoutDinamico() {

    const usuario =
        obterUsuarioLogado();


    if (!usuario) {

        alert(
            'Você precisa estar logado para acessar o checkout.'
        );

        window.location.href =
            'Login.html';

        return;
    }


    configurarCamposAutocomplete();

    checarEnderecoSalvo();


    const lista =
        document.getElementById(
            'chk-lista-itens'
        );


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


    const titulo =
        document.getElementById(
            'chk-titulo-itens'
        );


    if (!lista) {
        return;
    }


    const carrinho =
        checkoutState.carrinho;


    if (carrinho.length === 0) {

        lista.innerHTML =
            '<p style="color:#64748b;font-size:13px;">Seu carrinho está vazio.</p>';

        return;
    }


    const quantidadeTotal =
        carrinho.reduce(
            (
                total,
                item
            ) =>
                total +
                (
                    parseInt(
                        item.quantidade
                    ) || 0
                ),
            0
        );


    if (titulo) {

        titulo.textContent =
            `📦 Itens do Pedido (${quantidadeTotal})`;
    }


    lista.innerHTML =
        carrinho
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


                    return `
                        <div
                            class="item-linha"
                            style="
                                display:flex;
                                justify-content:space-between;
                                margin-bottom:8px;
                                font-size:14px;
                            "
                        >

                            <span class="item-qtd-nome">
                                ${quantidade}x ${item.nome || 'Produto'}
                            </span>

                            <span
                                class="item-preco"
                                style="font-weight:600;"
                            >
                                R$
                                ${(preco * quantidade)
                                    .toFixed(2)
                                    .replace('.', ',')}
                            </span>

                        </div>
                    `;
                }
            )
            .join('');


    const valores =
        CarrinhoCheckoutModule
            .calcularValores();


    if (subtotalEl) {

        subtotalEl.textContent =
            `R$ ${valores.subtotal
                .toFixed(2)
                .replace('.', ',')}`;
    }


    if (freteEl) {

        freteEl.textContent =
            `R$ ${valores.taxaEntrega
                .toFixed(2)
                .replace('.', ',')}`;
    }


    if (descontoEl) {

        descontoEl.textContent =
            `R$ ${valores.valorDesconto
                .toFixed(2)
                .replace('.', ',')}`;
    }


    if (totalEl) {

        totalEl.textContent =
            `R$ ${valores.total
                .toFixed(2)
                .replace('.', ',')}`;
    }
}


// ============================================================
// 15. BUSCAR CLIENTE NO SUPABASE
// ============================================================

async function buscarClienteNoSupabase(usuario) {

    const supabase =
        obterSupabase();


    if (!supabase) {

        throw new Error(
            'Supabase não está disponível.'
        );
    }


    if (!usuario) {

        throw new Error(
            'Usuário não informado.'
        );
    }


    /*
     * PRIMEIRO TENTA PELO auth_user_id.
     *
     * Isso é importante porque:
     *
     * clientes.id
     *
     * pode ser diferente do:
     *
     * auth.users.id
     */

    if (usuario.id) {

        const {
            data: clientePorAuth,
            error: erroAuth
        } =
            await supabase
                .from('clientes')
                .select(
                    'id,nome,email,telefone,auth_user_id'
                )
                .eq(
                    'auth_user_id',
                    usuario.id
                )
                .maybeSingle();


        if (
            !erroAuth &&
            clientePorAuth
        ) {

            return clientePorAuth;
        }
    }


    /*
     * SEGUNDO: tenta pelo e-mail.
     */

    if (usuario.email) {

        const email =
            usuario.email
                .trim()
                .toLowerCase();


        const {
            data: clientePorEmail,
            error: erroEmail
        } =
            await supabase
                .from('clientes')
                .select(
                    'id,nome,email,telefone,auth_user_id'
                )
                .eq(
                    'email',
                    email
                )
                .maybeSingle();


        if (erroEmail) {

            console.error(
                'ERRO AO BUSCAR CLIENTE POR E-MAIL:',
                erroEmail
            );

            throw erroEmail;
        }


        if (clientePorEmail) {

            return clientePorEmail;
        }
    }


    throw new Error(
        'Cliente não encontrado no Supabase.'
    );
}


// ============================================================
// 16. BUSCAR ENDEREÇO NO SUPABASE
// ============================================================

async function buscarEnderecoNoSupabase(
    usuario,
    enderecoLocal
) {

    const supabase =
        obterSupabase();


    if (!supabase) {

        throw new Error(
            'Supabase não está disponível.'
        );
    }


    try {

        const cliente =
            await buscarClienteNoSupabase(
                usuario
            );


        if (
            !cliente ||
            !cliente.id
        ) {
            return null;
        }


        const {
            data,
            error
        } =
            await supabase
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
                    cliente.id
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
                'ERRO AO BUSCAR ENDEREÇOS:',
                error
            );

            return null;
        }


        if (
            !data ||
            data.length === 0
        ) {

            return null;
        }


        /*
         * TENTA ENCONTRAR O MESMO CEP
         * DO ENDEREÇO LOCAL.
         */

        if (
            enderecoLocal &&
            enderecoLocal.cep
        ) {

            const cepLocal =
                enderecoLocal.cep
                    .replace(
                        /\D/g,
                        ''
                    );


            const encontrado =
                data.find(
                    endereco => {

                        const cepBanco =
                            String(
                                endereco.cep ||
                                ''
                            )
                                .replace(
                                    /\D/g,
                                    ''
                                );


                        return (
                            cepBanco ===
                            cepLocal
                        );
                    }
                );


            if (encontrado) {
                return encontrado;
            }
        }


        /*
         * CASO NÃO ENCONTRE PELO CEP,
         * RETORNA O PRINCIPAL.
         */

        return data[0];

    } catch (erro) {

        console.error(
            'ERRO AO BUSCAR ENDEREÇO:',
            erro
        );

        return null;
    }
}


// ============================================================
// 17. CRIAR PEDIDO NO SUPABASE
// ============================================================
//
// IMPORTANTE:
//
// Esta função fica disponível para outros fluxos,
// mas NÃO é chamada diretamente pelo fluxo PIX.
//
// O fluxo PIX utiliza a Edge Function criar-pix,
// evitando pedido duplicado.
//
// ============================================================

async function salvarPedidoNoSupabase(
    pedidoAtual,
    valores,
    endereco,
    usuario
) {

    const supabase =
        obterSupabase();


    if (!supabase) {
        return null;
    }


    try {

        /*
         * Busca o cliente real da tabela clientes.
         */

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


        /*
         * Busca o endereço real.
         */

        const enderecoBanco =
            await buscarEnderecoNoSupabase(
                usuario,
                endereco
            );


        const pedidoBanco = {

            cliente_id:
                cliente.id,

            endereco_id:
                enderecoBanco
                    ? enderecoBanco.id
                    : null,

            status:
                'pendente',

            status_pagamento:
                'pendente',

            forma_pagamento:
                pedidoAtual.pagamento ||
                'PIX',

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

            total:
                Number(
                    valores.total
                ) || 0,

            observacoes:
                null
        };


        const {
            data,
            error
        } =
            await supabase
                .from('pedidos')
                .insert([
                    pedidoBanco
                ])
                .select()
                .single();


        if (error) {

            console.error(
                'ERRO AO CRIAR PEDIDO:',
                error
            );

            return null;
        }


        /*
         * Atualiza dados locais.
         */

        if (data) {

            pedidoAtual.id =
                data.id;

            pedidoAtual.supabase_id =
                data.id;

            pedidoAtual.numero_pedido =
                data.numero_pedido;


            /*
             * Cria os itens.
             */

            if (
                Array.isArray(
                    pedidoAtual.itens
                ) &&
                pedidoAtual.itens.length > 0
            ) {

                const itensBanco =
                    pedidoAtual.itens.map(
                        item => {

                            const preco =
                                Number(
                                    item.preco
                                ) || 0;


                            const quantidade =
                                parseInt(
                                    item.quantidade
                                ) || 1;


                            return {

                                pedido_id:
                                    data.id,

                                produto_id:
                                    item.id ||
                                    null,

                                nome_produto:
                                    item.nome ||
                                    'Produto',

                                quantidade:
                                    quantidade,

                                preco_unitario:
                                    preco,

                                subtotal:
                                    preco *
                                    quantidade
                            };
                        }
                    );


                const {
                    error: erroItens
                } =
                    await supabase
                        .from('itens_pedido')
                        .insert(
                            itensBanco
                        );


                if (erroItens) {

                    console.error(
                        'ERRO AO CRIAR ITENS DO PEDIDO:',
                        erroItens
                    );

                    return null;
                }
            }
        }


        return data;

    } catch (erro) {

        console.error(
            'ERRO GERAL AO SALVAR PEDIDO:',
            erro
        );

        return null;
    }
}


// ============================================================
// 18. VALIDAR PEDIDO
// ============================================================

async function validarEConfirmarPedido() {

    const usuario =
        obterUsuarioLogado();


    if (!usuario) {

        alert(
            'Você precisa estar logado para continuar.'
        );

        window.location.href =
            'Login.html';

        return;
    }


    if (
        !checkoutState.carrinho ||
        checkoutState.carrinho.length === 0
    ) {

        alert(
            'Seu carrinho está vazio! Volte e adicione algum produto antes de finalizar.'
        );

        return;
    }


    const formulario =
        document.getElementById(
            'form-endereco'
        );


    const formularioVisivel =
        formulario &&
        formulario.style.display !== 'none';


    if (formularioVisivel) {

        const nome =
            document.getElementById(
                'end-nome'
            );


        const cep =
            document.getElementById(
                'end-cep'
            );


        const rua =
            document.getElementById(
                'end-rua'
            );


        const numero =
            document.getElementById(
                'end-numero'
            );


        const bairro =
            document.getElementById(
                'end-bairro'
            );


        const cidade =
            document.getElementById(
                'end-cidade'
            );


        const uf =
            document.getElementById(
                'end-uf'
            );


        const complemento =
            document.getElementById(
                'end-complemento'
            );


        const obrigatorios = [
            nome,
            cep,
            rua,
            numero,
            bairro,
            cidade,
            uf
        ];


        const vazio =
            obrigatorios.some(
                campo =>
                    !campo ||
                    !campo.value.trim()
            );


        if (vazio) {

            alert(
                'Preencha todos os campos obrigatórios do endereço de entrega antes de continuar.'
            );

            return;
        }


        const endereco = {

            nome:
                nome.value.trim(),

            cep:
                cep.value.trim(),

            rua:
                rua.value.trim(),

            numero:
                numero.value.trim(),

            complemento:
                complemento
                    ? complemento.value.trim()
                    : '',

            bairro:
                bairro.value.trim(),

            cidade:
                cidade.value.trim(),

            uf:
                uf.value
                    .trim()
                    .toUpperCase()
        };


        localStorage.setItem(
            chaveEnderecoCliente(),
            JSON.stringify(
                endereco
            )
        );

    } else {

        let endereco =
            null;


        try {

            endereco =
                JSON.parse(
                    localStorage.getItem(
                        chaveEnderecoCliente()
                    )
                );

        } catch (erro) {

            endereco =
                null;
        }


        if (
            !endereco ||
            !endereco.rua
        ) {

            alert(
                'Informe um endereço de entrega antes de continuar.'
            );

            return;
        }
    }


    const pagamento =
        document.querySelector(
            'input[name="pagamento"]:checked'
        );


    if (!pagamento) {

        alert(
            'Selecione uma forma de pagamento.'
        );

        return;
    }


    checkoutState.metodoPagamento =
        pagamento.value;


    localStorage.setItem(
        'ultimo_metodo_pagamento',
        pagamento.value
    );


    if (
        pagamento.value === 'pix'
    ) {

        await iniciarPagamentoPix();

        return;
    }


    alert(
        'Neste momento, o pagamento disponível é PIX.'
    );
}


// ============================================================
// 19. PEDIDO CONFIRMADO
// ============================================================

async function carregarPedidoConfirmadoDinamico() {

    const usuario =
        obterUsuarioLogado();


    if (!usuario) {

        alert(
            'Você precisa estar logado para acessar seus pedidos.'
        );

        window.location.href =
            'Login.html';

        return;
    }


    const numeroEl =
        document.getElementById(
            'conf-numero-pedido'
        );


    const dataEl =
        document.getElementById(
            'conf-data-pedido'
        );


    const horaEl =
        document.getElementById(
            'conf-hora-aprovado'
        );


    const pagamentoEl =
        document.getElementById(
            'conf-pagamento'
        );


    const listaEl =
        document.getElementById(
            'conf-lista-itens'
        );


    const totalEl =
        document.getElementById(
            'conf-total-pago'
        );


    const enderecoEl =
        document.getElementById(
            'conf-container-endereco'
        );


    let pedidoAtual =
        null;


    // ========================================================
    // 1. RECUPERAR PAGAMENTO PIX
    // ========================================================

    try {

        const pagamentoPix =
            JSON.parse(
                localStorage.getItem(
                    'pagamento_pix_atual'
                )
            );


        if (
            pagamentoPix &&
            pagamentoPix.pedido_id
        ) {

            pedidoAtual = {

                supabase_id:
                    pagamentoPix.pedido_id,

                id:
                    pagamentoPix.pedido_id,

                numero_pedido:
                    pagamentoPix.numero_pedido ||
                    null,

                pagamento:
                    'PIX',

                status:
                    pagamentoPix.status ||
                    'pendente',

                pagamento_id:
                    pagamentoPix.pagamento_id,

                total:
                    Number(
                        pagamentoPix.valor ||
                        pagamentoPix.total ||
                        0
                    )
            };
        }

    } catch (erro) {

        console.error(
            'ERRO AO RECUPERAR PAGAMENTO PIX:',
            erro
        );
    }


    // ========================================================
    // 2. RECUPERAR ÚLTIMO PEDIDO
    // ========================================================

    if (!pedidoAtual) {

        try {

            pedidoAtual =
                JSON.parse(
                    localStorage.getItem(
                        'ultimo_pedido_salvo'
                    )
                );

        } catch (erro) {

            pedidoAtual =
                null;
        }
    }


    // ========================================================
    // 3. SE NÃO EXISTIR
    // ========================================================

    if (!pedidoAtual) {

        alert(
            'Não foi possível localizar o pedido.'
        );

        return;
    }


    // ========================================================
    // 4. BUSCAR PEDIDO REAL NO SUPABASE
    // ========================================================

    try {

        const supabase =
            obterSupabase();


        /*
         * Primeiro descobrimos o cliente real.
         */

        const cliente =
            await buscarClienteNoSupabase(
                usuario
            );


        if (
            supabase &&
            pedidoAtual.supabase_id &&
            cliente &&
            cliente.id
        ) {

            const {
                data: pedidoBanco,
                error
            } =
                await supabase
                    .from('pedidos')
                    .select(`
                        *,
                        enderecos (
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
                            principal
                        ),
                        itens_pedido (
                            id,
                            pedido_id,
                            produto_id,
                            nome_produto,
                            quantidade,
                            preco_unitario,
                            subtotal,
                            created_at
                        )
                    `)
                    .eq(
                        'id',
                        pedidoAtual.supabase_id
                    )
                    .eq(
                        'cliente_id',
                        cliente.id
                    )
                    .maybeSingle();


            if (error) {

                console.error(
                    'ERRO AO BUSCAR PEDIDO:',
                    error
                );

            } else if (pedidoBanco) {

                pedidoAtual =
                    pedidoBanco;
            }
        }

    } catch (erro) {

        console.error(
            'ERRO AO CONSULTAR PEDIDO:',
            erro
        );
    }


    // ========================================================
    // 5. NÚMERO DO PEDIDO
    // ========================================================

    const numeroPedido =
        pedidoAtual.numero_pedido
            ? `#${pedidoAtual.numero_pedido}`
            : pedidoAtual.numero
                ? pedidoAtual.numero
                : `#${pedidoAtual.id}`;


    // ========================================================
    // 6. DATA E HORA
    // ========================================================

    const dataBase =
        pedidoAtual.created_at
            ? new Date(
                pedidoAtual.created_at
            )
            : new Date();


    const dataPedido =
        dataBase.toLocaleDateString(
            'pt-BR',
            {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            }
        );


    const horaPedido =
        dataBase.toLocaleTimeString(
            'pt-BR',
            {
                hour: '2-digit',
                minute: '2-digit'
            }
        );


    // ========================================================
    // 7. PREENCHER INFORMAÇÕES
    // ========================================================

    if (numeroEl) {
        numeroEl.textContent =
            numeroPedido;
    }


    if (dataEl) {
        dataEl.textContent =
            dataPedido;
    }


    if (horaEl) {
        horaEl.textContent =
            horaPedido;
    }


    if (pagamentoEl) {

        pagamentoEl.textContent =
            'PIX (Aprovação Instantânea)';
    }


    if (totalEl) {

        const total =
            Number(
                pedidoAtual.total ||
                pedidoAtual.valor ||
                0
            );


        totalEl.textContent =
            `R$ ${total
                .toFixed(2)
                .replace('.', ',')}`;
    }


    // ========================================================
    // 8. MONTAR LISTA DE ITENS
    // ========================================================

    if (
        listaEl &&
        Array.isArray(
            pedidoAtual.itens_pedido
        )
    ) {

        listaEl.innerHTML =
            pedidoAtual.itens_pedido
                .map(
                    item => {

                        const quantidade =
                            Number(
                                item.quantidade
                            ) || 1;


                        const preco =
                            Number(
                                item.preco_unitario
                            ) || 0;


                        return `
                            <div style="
                                display:flex;
                                align-items:center;
                                justify-content:space-between;
                                margin-bottom:8px;
                                color:#334155;
                            ">

                                <div style="
                                    display:flex;
                                    align-items:center;
                                    gap:10px;
                                ">

                                    <div style="
                                        width:32px;
                                        height:32px;
                                        border-radius:6px;
                                        background:#f1f5f9;
                                        display:flex;
                                        align-items:center;
                                        justify-content:center;
                                        overflow:hidden;
                                        flex-shrink:0;
                                    ">
                                        📦
                                    </div>

                                    <span>
                                        ${quantidade}x
                                        ${item.nome_produto || 'Produto'}
                                    </span>

                                </div>


                                <span style="
                                    font-weight:600;
                                ">
                                    R$
                                    ${(preco * quantidade)
                                        .toFixed(2)
                                        .replace('.', ',')}
                                </span>

                            </div>
                        `;
                    }
                )
                .join('');

    } else if (listaEl) {

        listaEl.innerHTML = `
            <p style="color:#64748b;">
                Itens do pedido não encontrados.
            </p>
        `;
    }


    // ========================================================
    // 9. ENDEREÇO
    // ========================================================

    let enderecoPedido =
        pedidoAtual.enderecos ||
        null;


    if (!enderecoPedido) {

        try {

            enderecoPedido =
                JSON.parse(
                    localStorage.getItem(
                        'endereco_pagamento_atual'
                    )
                );

        } catch (erro) {

            enderecoPedido =
                null;
        }
    }


    if (enderecoEl) {

        if (
            enderecoPedido &&
            enderecoPedido.rua
        ) {

            enderecoEl.innerHTML = `

                <p style="
                    margin:0 0 4px 0;
                ">
                    <strong>Destinatário:</strong>
                    ${
                        enderecoPedido.nome_destinatario ||
                        enderecoPedido.nome ||
                        ''
                    }
                </p>

                <p style="
                    margin:0 0 4px 0;
                ">
                    <strong>Endereço:</strong>
                    ${enderecoPedido.rua},
                    Nº ${enderecoPedido.numero || ''}
                    ${
                        enderecoPedido.complemento
                            ? ` (${enderecoPedido.complemento})`
                            : ''
                    }
                </p>

                <p style="
                    margin:0 0 4px 0;
                ">
                    <strong>Bairro:</strong>
                    ${enderecoPedido.bairro || ''}
                </p>

                <p style="
                    margin:0 0 4px 0;
                ">
                    <strong>Cidade/UF:</strong>
                    ${enderecoPedido.cidade || ''}
                    /
                    ${
                        enderecoPedido.estado ||
                        enderecoPedido.uf ||
                        ''
                    }
                </p>

                <p style="
                    margin:0;
                    color:#2563eb;
                    font-weight:bold;
                ">
                    <strong>CEP:</strong>
                    ${enderecoPedido.cep || ''}
                </p>

            `;

        } else {

            enderecoEl.innerHTML = `
                <p style="
                    color:#ef4444;
                    margin:0;
                ">
                    Endereço de entrega não informado.
                </p>
            `;
        }
    }


    // ========================================================
    // 10. SALVAR ÚLTIMO PEDIDO
    // ========================================================

    localStorage.setItem(
        'ultimo_pedido_salvo',
        JSON.stringify(
            pedidoAtual
        )
    );
}


// ============================================================
// 20. LISTA DE ENDEREÇOS
// ============================================================

function carregarPaginaEnderecos() {

    const usuario =
        obterUsuarioLogado();


    if (!usuario) {

        alert(
            'Faça login para acessar seus endereços.'
        );

        window.location.href =
            'Login.html';

        return;
    }


    const container =
        document.getElementById(
            'lista-enderecos-container'
        );


    if (!container) {
        return;
    }


    let endereco =
        null;


    try {

        endereco =
            JSON.parse(
                localStorage.getItem(
                    chaveEnderecoCliente()
                )
            );

    } catch (erro) {

        endereco =
            null;
    }


    if (
        !endereco ||
        !endereco.rua
    ) {

        container.innerHTML = `

            <div style="
                text-align:center;
                padding:2rem 1rem;
                color:#64748b;
                background:#fff;
                border-radius:12px;
                border:1px dashed #cbd5e1;
            ">

                <p style="
                    font-size:0.95rem;
                    margin-bottom:0.5rem;
                    font-weight:500;
                ">
                    Nenhum endereço cadastrado 📍
                </p>

                <small>
                    Cadastre um endereço de entrega.
                </small>

            </div>
        `;

        return;
    }


    container.innerHTML = `

        <label
            class="endereco-item ativo"
            style="
                display:flex;
                gap:12px;
                cursor:pointer;
            "
        >

            <input
                type="radio"
                name="endereco_selecionado"
                value="principal"
                checked
                style="margin-top:4px;"
            >


            <div
                class="endereco-info"
                style="width:100%;"
            >

                <div
                    class="endereco-topo-info"
                    style="
                        display:flex;
                        gap:8px;
                        margin-bottom:6px;
                    "
                >

                    <span
                        class="tipo-tag"
                        style="
                            background:#e0e7ff;
                            color:#3730a3;
                            padding:2px 8px;
                            border-radius:4px;
                            font-size:11px;
                            font-weight:bold;
                        "
                    >
                        Entrega
                    </span>


                    <span
                        class="badge-principal"
                        style="
                            background:#d1fae5;
                            color:#065f46;
                            padding:2px 8px;
                            border-radius:4px;
                            font-size:11px;
                            font-weight:bold;
                        "
                    >
                        Principal
                    </span>

                </div>


                <p
                    class="nome-destinatario"
                    style="
                        font-weight:bold;
                        color:#1e293b;
                        margin:0 0 4px 0;
                    "
                >
                    ${endereco.nome || ''}
                </p>


                <p
                    class="rua-numero"
                    style="
                        margin:0 0 2px 0;
                        color:#475569;
                        font-size:13px;
                    "
                >
                    ${endereco.rua || ''},
                    nº ${endereco.numero || ''}
                    ${
                        endereco.complemento
                            ? ` (${endereco.complemento})`
                            : ''
                    }
                </p>


                <p
                    class="bairro-cidade"
                    style="
                        margin:0 0 2px 0;
                        color:#475569;
                        font-size:13px;
                    "
                >
                    ${endereco.bairro || ''}
                    -
                    ${endereco.cidade || ''}
                    /
                    ${
                        endereco.uf
                            ? endereco.uf.toUpperCase()
                            : ''
                    }
                </p>


                <p
                    class="cep"
                    style="
                        margin:0 0 8px 0;
                        color:#2563eb;
                        font-weight:bold;
                        font-size:13px;
                    "
                >
                    CEP: ${endereco.cep || ''}
                </p>


                <div
                    class="acoes-endereco"
                    style="
                        display:flex;
                        gap:12px;
                        border-top:1px solid #f1f5f9;
                        padding-top:8px;
                    "
                >

                    <a
                        href="Cadastrar-endereço.html"
                        style="
                            color:#2563eb;
                            font-size:13px;
                            text-decoration:none;
                            font-weight:500;
                        "
                    >
                        Editar
                    </a>


                    <button
                        type="button"
                        onclick="excluirEnderecoSalvo()"
                        style="
                            background:none;
                            border:none;
                            color:#ef4444;
                            font-size:13px;
                            cursor:pointer;
                            font-weight:500;
                            padding:0;
                        "
                    >
                        Excluir
                    </button>

                </div>

            </div>

        </label>
    `;
}


// ============================================================
// 21. EXCLUIR ENDEREÇO
// ============================================================

async function excluirEnderecoSalvo() {

    if (
        !confirm(
            'Deseja realmente remover este endereço?'
        )
    ) {
        return;
    }


    const usuario =
        obterUsuarioLogado();


    if (!usuario) {
        return;
    }


    try {

        const supabase =
            obterSupabase();


        if (supabase) {

            const cliente =
                await buscarClienteNoSupabase(
                    usuario
                );


            if (
                cliente &&
                cliente.id
            ) {

                const enderecoLocal =
                    JSON.parse(
                        localStorage.getItem(
                            chaveEnderecoCliente()
                        )
                    );


                if (
                    enderecoLocal &&
                    enderecoLocal.cep
                ) {

                    const cep =
                        enderecoLocal.cep
                            .replace(
                                /\D/g,
                                ''
                            );


                    await supabase
                        .from('enderecos')
                        .delete()
                        .eq(
                            'cliente_id',
                            cliente.id
                        )
                        .eq(
                            'cep',
                            enderecoLocal.cep
                        );
                }
            }
        }

    } catch (erro) {

        console.error(
            'Erro ao excluir endereço do Supabase:',
            erro
        );
    }


    localStorage.removeItem(
        chaveEnderecoCliente()
    );


    carregarPaginaEnderecos();
}


// ============================================================
// 22. CONFIRMAR ENDEREÇO
// ============================================================

function confirmarSelecaoEndereco() {

    const usuario =
        obterUsuarioLogado();


    if (!usuario) {

        alert(
            'Faça login para continuar.'
        );

        return;
    }


    let endereco =
        null;


    try {

        endereco =
            JSON.parse(
                localStorage.getItem(
                    chaveEnderecoCliente()
                )
            );

    } catch (erro) {

        endereco =
            null;
    }


    if (
        !endereco ||
        !endereco.rua
    ) {

        alert(
            'Cadastre um endereço antes de continuar.'
        );

        return;
    }


    window.history.back();
}


// ============================================================
// 23. BUSCAR CEP CADASTRO
// ============================================================

async function buscarCepCadastro() {

    const input =
        document.getElementById(
            'cep'
        );


    const status =
        document.getElementById(
            'cep-status'
        );


    if (!input) {
        return;
    }


    const cep =
        input.value.replace(
            /\D/g,
            ''
        );


    if (cep.length !== 8) {

        if (status) {

            status.style.color =
                '#ef4444';

            status.textContent =
                'Digite um CEP válido com 8 números.';
        }

        return;
    }


    try {

        if (status) {

            status.style.color =
                '#2563eb';

            status.textContent =
                'Buscando endereço...';
        }


        const resposta =
            await fetch(
                `https://viacep.com.br/ws/${cep}/json/`
            );


        if (!resposta.ok) {
            throw new Error(
                'Falha ao consultar o CEP.'
            );
        }


        const dados =
            await resposta.json();


        if (dados.erro) {

            if (status) {

                status.style.color =
                    '#ef4444';

                status.textContent =
                    'CEP não encontrado.';
            }

            return;
        }


        const rua =
            document.getElementById(
                'rua'
            );


        const bairro =
            document.getElementById(
                'bairro'
            );


        const cidade =
            document.getElementById(
                'cidade'
            );


        const uf =
            document.getElementById(
                'uf'
            );


        if (rua) {
            rua.value =
                dados.logradouro || '';
        }


        if (bairro) {
            bairro.value =
                dados.bairro || '';
        }


        if (cidade) {
            cidade.value =
                dados.localidade || '';
        }


        if (uf) {
            uf.value =
                dados.uf || '';
        }


        if (status) {

            status.style.color =
                '#10b981';

            status.textContent =
                'Endereço localizado!';
        }


    } catch (erro) {

        console.error(
            'Erro ao buscar CEP:',
            erro
        );


        if (status) {

            status.style.color =
                '#ef4444';

            status.textContent =
                'Erro ao consultar CEP.';
        }
    }
}


// ============================================================
// 24. FORMULÁRIO DE ENDEREÇO
// ============================================================

function carregarDadosFormularioEndereco() {

    const usuario =
        obterUsuarioLogado();


    if (!usuario) {

        alert(
            'Você precisa estar logado para cadastrar um endereço.'
        );

        window.location.href =
            'Login.html';

        return;
    }


    const form =
        document.getElementById(
            'form-cadastrar-endereco'
        );


    const cep =
        document.getElementById(
            'cep'
        );


    if (cep) {

        cep.addEventListener(
            'input',
            event => {

                const valor =
                    event.target.value
                        .replace(
                            /\D/g,
                            ''
                        );


                if (
                    valor.length === 8
                ) {

                    buscarCepCadastro();
                }
            }
        );
    }


    if (!form) {
        return;
    }


    form.addEventListener(
        'submit',
        async event => {

            event.preventDefault();


            try {

                const usuarioAtual =
                    obterUsuarioLogado();


                if (
                    !usuarioAtual ||
                    !usuarioAtual.id
                ) {

                    alert(
                        'Você precisa estar logado para cadastrar um endereço.'
                    );

                    return;
                }


                const endereco = {

                    nome:
                        document
                            .getElementById(
                                'nome-destinatario'
                            )
                            ?.value
                            .trim() ||
                        '',

                    cep:
                        document
                            .getElementById(
                                'cep'
                            )
                            ?.value
                            .trim() ||
                        '',

                    rua:
                        document
                            .getElementById(
                                'rua'
                            )
                            ?.value
                            .trim() ||
                        '',

                    numero:
                        document
                            .getElementById(
                                'numero'
                            )
                            ?.value
                            .trim() ||
                        '',

                    complemento:
                        document
                            .getElementById(
                                'complemento'
                            )
                            ?.value
                            .trim() ||
                        '',

                    bairro:
                        document
                            .getElementById(
                                'bairro'
                            )
                            ?.value
                            .trim() ||
                        '',

                    cidade:
                        document
                            .getElementById(
                                'cidade'
                            )
                            ?.value
                            .trim() ||
                        '',

                    uf:
                        document
                            .getElementById(
                                'uf'
                            )
                            ?.value
                            .trim()
                            .toUpperCase() ||
                        ''
                };


                if (
                    !endereco.nome ||
                    !endereco.cep ||
                    !endereco.rua ||
                    !endereco.numero ||
                    !endereco.bairro ||
                    !endereco.cidade ||
                    !endereco.uf
                ) {

                    alert(
                        'Preencha todos os campos obrigatórios.'
                    );

                    return;
                }


                const supabase =
                    obterSupabase();


                if (!supabase) {

                    alert(
                        'Erro de conexão com o banco de dados.'
                    );

                    return;
                }


                /*
                 * Busca o cliente real.
                 */

                const cliente =
                    await buscarClienteNoSupabase(
                        usuarioAtual
                    );


                if (
                    !cliente ||
                    !cliente.id
                ) {

                    alert(
                        'Cliente não encontrado no sistema.'
                    );

                    return;
                }


                /*
                 * Antes de criar o novo principal,
                 * retira o principal dos anteriores.
                 */

                const {
                    error: erroPrincipal
                } =
                    await supabase
                        .from('enderecos')
                        .update({
                            principal: false
                        })
                        .eq(
                            'cliente_id',
                            cliente.id
                        );


                if (erroPrincipal) {

                    console.error(
                        'ERRO AO ATUALIZAR ENDEREÇOS ANTERIORES:',
                        erroPrincipal
                    );
                }


                const dadosSupabase = {

                    cliente_id:
                        cliente.id,

                    nome_destinatario:
                        endereco.nome,

                    cep:
                        endereco.cep,

                    rua:
                        endereco.rua,

                    numero:
                        endereco.numero,

                    complemento:
                        endereco.complemento ||
                        null,

                    bairro:
                        endereco.bairro,

                    cidade:
                        endereco.cidade,

                    estado:
                        endereco.uf,

                    principal:
                        true
                };


                const {
                    data,
                    error
                } =
                    await supabase
                        .from('enderecos')
                        .insert([
                            dadosSupabase
                        ])
                        .select()
                        .single();


                if (error) {

                    console.error(
                        'ERRO AO SALVAR ENDEREÇO:',
                        error
                    );

                    alert(
                        'Não foi possível salvar o endereço.'
                    );

                    return;
                }


                console.log(
                    'ENDEREÇO SALVO NO SUPABASE:',
                    data
                );


                localStorage.setItem(
                    chaveEnderecoCliente(),
                    JSON.stringify(
                        endereco
                    )
                );


                alert(
                    'Endereço salvo com sucesso!'
                );


                window.location.href =
                    'Endereços.html';


            } catch (erro) {

                console.error(
                    'ERRO AO CADASTRAR ENDEREÇO:',
                    erro
                );

                alert(
                    erro.message ||
                    'Ocorreu um erro ao salvar o endereço.'
                );
            }
        }
    );
}


// ============================================================
// 25. ADICIONAR PRODUTO
// ============================================================

document.addEventListener(
    'click',
    event => {

        const botao =
            event.target.closest(
                '.btn-adicionar'
            );


        if (!botao) {
            return;
        }


        event.stopPropagation();


        const usuario =
            obterUsuarioLogado();


        if (
            !usuario ||
            !usuario.id
        ) {

            alert(
                'Você precisa estar logado para adicionar produtos ao carrinho.'
            );

            window.location.href =
                'Login.html';

            return;
        }


        const produto = {

            id:
                botao.dataset.id,

            nome:
                botao.dataset.nome ||
                'Produto',

            preco:
                parseFloat(
                    botao.dataset.preco
                ) || 0,

            imagem:
                botao.dataset.imagem ||
                botao.dataset.imagemUrl ||
                botao.dataset.foto ||
                '',

            estoque:
                botao.dataset.estoque !== undefined &&
                botao.dataset.estoque !== ''
                    ? parseInt(
                        botao.dataset.estoque
                    )
                    : null,

            sku:
                botao.dataset.sku ||
                '',

            categoria_id:
                botao.dataset.categoriaId ||
                null
        };


        if (!produto.id) {

            console.error(
                'O botão de adicionar não possui data-id.'
            );

            return;
        }


        const adicionado =
            CarrinhoCheckoutModule
                .adicionarProduto(
                    produto
                );


        if (!adicionado) {
            return;
        }


        const textoOriginal =
            botao.textContent;


        botao.textContent =
            'Adicionado! ✓';


        botao.style.backgroundColor =
            '#10b981';


        setTimeout(
            () => {

                botao.textContent =
                    textoOriginal;

                botao.style.backgroundColor =
                    '';

            },
            1200
        );
    }
);


// ============================================================
// 26. CLIQUE CARD PRODUTO
// ============================================================

document.addEventListener(
    'click',
    event => {

        const card =
            event.target.closest(
                '.card-produto, .card'
            );


        if (
            !card ||
            event.target.closest(
                'button'
            )
        ) {
            return;
        }


        const botao =
            card.querySelector(
                '.btn-adicionar'
            );


        if (!botao) {
            return;
        }


        const id =
            botao.dataset.id;


        if (!id) {
            return;
        }


        window.location.href =
            `Produtos.html?id=${encodeURIComponent(id)}`;
    }
);


// ============================================================
// 27. CUPOM
// ============================================================

function aplicarCupomCarrinho() {

    const usuario =
        obterUsuarioLogado();


    if (!usuario) {

        alert(
            'Faça login para utilizar cupons.'
        );

        return;
    }


    const campo =
        document.getElementById(
            'input-cupom'
        );


    const codigo =
        campo
            ? campo.value
                .trim()
                .toUpperCase()
            : '';


    if (!codigo) {

        alert(
            'Digite um código de cupom.'
        );

        return;
    }


    /*
     * Neste momento o cupom é apenas armazenado.
     *
     * Quando criarmos a tabela de cupons,
     * esta função poderá validar o código
     * diretamente no Supabase.
     */

    checkoutState.cupomAtivo =
        codigo;


    alert(
        `Cupom "${codigo}" recebido.`
    );
}


// ============================================================
// 28. INICIALIZAÇÃO
// ============================================================

document.addEventListener(
    'DOMContentLoaded',
    () => {

        CarrinhoCheckoutModule.init();


        const pagina =
            decodeURIComponent(
                window.location.pathname
            ).toLowerCase();


        if (
            pagina.includes(
                'checkout.html'
            )
        ) {

            carregarCheckoutDinamico();

        } else if (
            pagina.includes(
                'pedido-confirmado.html'
            )
        ) {

            carregarPedidoConfirmadoDinamico();

        } else if (
            pagina.includes(
                'endere'
            )
        ) {

            if (
                pagina.includes(
                    'cadastrar'
                )
            ) {

                carregarDadosFormularioEndereco();

            } else {

                carregarPaginaEnderecos();
            }
        }
    }
);


// ============================================================
// 29. INICIAR PAGAMENTO PIX
// ============================================================

async function iniciarPagamentoPix() {

    const usuario =
        obterUsuarioLogado();


    if (
        !usuario ||
        !usuario.id
    ) {

        alert(
            'Você precisa estar logado para realizar o pagamento.'
        );

        window.location.href =
            'Login.html';

        return;
    }


    if (
        !checkoutState.carrinho ||
        checkoutState.carrinho.length === 0
    ) {

        alert(
            'Seu carrinho está vazio.'
        );

        return;
    }


    let endereco =
        null;


    const formulario =
        document.getElementById(
            'form-endereco'
        );


    const formularioVisivel =
        formulario &&
        formulario.style.display !== 'none';


    if (formularioVisivel) {

        const nome =
            document.getElementById(
                'end-nome'
            );


        const cep =
            document.getElementById(
                'end-cep'
            );


        const rua =
            document.getElementById(
                'end-rua'
            );


        const numero =
            document.getElementById(
                'end-numero'
            );


        const complemento =
            document.getElementById(
                'end-complemento'
            );


        const bairro =
            document.getElementById(
                'end-bairro'
            );


        const cidade =
            document.getElementById(
                'end-cidade'
            );


        const uf =
            document.getElementById(
                'end-uf'
            );


        const obrigatorios = [
            nome,
            cep,
            rua,
            numero,
            bairro,
            cidade,
            uf
        ];


        const vazio =
            obrigatorios.some(
                campo =>
                    !campo ||
                    !campo.value.trim()
            );


        if (vazio) {

            alert(
                'Preencha todos os campos obrigatórios do endereço.'
            );

            return;
        }


        endereco = {

            nome:
                nome.value.trim(),

            cep:
                cep.value.trim(),

            rua:
                rua.value.trim(),

            numero:
                numero.value.trim(),

            complemento:
                complemento
                    ? complemento.value.trim()
                    : '',

            bairro:
                bairro.value.trim(),

            cidade:
                cidade.value.trim(),

            uf:
                uf.value
                    .trim()
                    .toUpperCase()
        };


        localStorage.setItem(
            chaveEnderecoCliente(),
            JSON.stringify(
                endereco
            )
        );

    } else {

        try {

            endereco =
                JSON.parse(
                    localStorage.getItem(
                        chaveEnderecoCliente()
                    )
                );

        } catch (erro) {

            endereco =
                null;
        }
    }


    if (
        !endereco ||
        !endereco.rua
    ) {

        alert(
            'Informe um endereço de entrega antes de continuar.'
        );

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


    if (
        metodo !== 'pix'
    ) {

        alert(
            'Nesta primeira etapa estamos configurando somente o PIX.'
        );

        return;
    }


    const botao =
        document.querySelector(
            '.btn-finalizar'
        );


    if (botao) {

        botao.disabled =
            true;

        botao.textContent =
            'Gerando PIX...';

        botao.style.opacity =
            '0.7';

        botao.style.cursor =
            'wait';
    }


    try {

        // ====================================================
        // 1. BUSCAR CLIENTE REAL
        // ====================================================

        const cliente =
            await buscarClienteNoSupabase(
                usuario
            );


        if (
            !cliente ||
            !cliente.id
        ) {

            throw new Error(
                'Cliente não encontrado no banco de dados.'
            );
        }


        // ====================================================
        // 2. CALCULAR VALORES
        // ====================================================

        const valores =
            CarrinhoCheckoutModule
                .calcularValores();


        const valor =
            Number(
                valores.total
            );


        if (
            !valor ||
            valor <= 0
        ) {

            throw new Error(
                'O valor total do pedido é inválido.'
            );
        }


        // ====================================================
        // 3. MONTAR ITENS
        // ====================================================

        const itens =
            checkoutState.carrinho.map(
                item => ({

                    id:
                        item.id,

                    nome:
                        item.nome ||
                        'Produto',

                    preco:
                        Number(
                            item.preco
                        ) || 0,

                    quantidade:
                        Number(
                            item.quantidade
                        ) || 1,

                    sku:
                        item.sku ||
                        ''
                })
            );


        // ====================================================
        // 4. CHAMAR EDGE FUNCTION
        // ====================================================

        const supabase =
            obterSupabase();


        if (!supabase) {

            throw new Error(
                'Supabase não está disponível.'
            );
        }


        const resposta =
            await fetch(
                'https://ratajxnxkjoiuknamacn.supabase.co/functions/v1/criar-pix',
                {
                    method: 'POST',

                    headers: {

                        'Content-Type':
                            'application/json',

                        'apikey':
                            supabase.supabaseKey,

                        'Authorization':
                            `Bearer ${supabase.supabaseKey}`
                    },

                    body:
                        JSON.stringify({

                            /*
                             * ID REAL DA TABELA clientes
                             */

                            cliente_id:
                                cliente.id,

                            /*
                             * ID DO AUTH
                             */

                            auth_user_id:
                                usuario.id,

                            email:
                                cliente.email ||
                                usuario.email,

                            nome:
                                cliente.nome ||
                                usuario.nome ||
                                'Cliente',

                            valor:
                                valor,

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

                            endereco_id:
                                null,

                            itens:
                                itens,

                            endereco:
                                endereco
                        })
                }
            );


        let dados;


        try {

            dados =
                await resposta.json();

        } catch (erro) {

            throw new Error(
                'A Edge Function retornou uma resposta inválida.'
            );
        }


        console.log(
            'RESPOSTA DA EDGE FUNCTION criar-pix:',
            dados
        );


        if (
            !resposta.ok ||
            !dados ||
            !dados.sucesso
        ) {

            throw new Error(
                dados?.error ||
                dados?.erro ||
                'Não foi possível gerar o pagamento PIX.'
            );
        }


        // ====================================================
        // 5. SALVAR PAGAMENTO PIX
        // ====================================================

        localStorage.setItem(
            'pagamento_pix_atual',
            JSON.stringify(
                dados
            )
        );


        localStorage.setItem(
            'endereco_pagamento_atual',
            JSON.stringify(
                endereco
            )
        );


        // ====================================================
        // 6. SALVAR PEDIDO PIX
        // ====================================================

        localStorage.setItem(
            'pedido_pix_atual',
            JSON.stringify({

                pedido_id:
                    dados.pedido_id,

                numero_pedido:
                    dados.numero_pedido,

                pagamento_id:
                    dados.pagamento_id,

                status:
                    dados.status,

                total:
                    valor,

                endereco:
                    endereco
            })
        );


        // ====================================================
        // 7. NÃO LIMPAR CARRINHO
        // ====================================================
        //
        // O pagamento ainda pode estar pendente.
        //
        // O carrinho deve ser limpo somente depois
        // da confirmação do pagamento.
        //


        // ====================================================
        // 8. IR PARA PIX
        // ====================================================

        window.location.href =
            'Pagamento-pix.html';


    } catch (erro) {

        console.error(
            'ERRO AO GERAR PIX:',
            erro
        );


        alert(
            erro.message ||
            'Não foi possível gerar o PIX.'
        );


        if (botao) {

            botao.disabled =
                false;

            botao.textContent =
                'Confirmar e Pagar 🚀';

            botao.style.opacity =
                '1';

            botao.style.cursor =
                'pointer';
        }
    }
}


// ============================================================
// 30. EXPORTAÇÕES GLOBAIS
// ============================================================
//
// Mantém as funções disponíveis para os atributos
// onclick existentes no HTML.
// ============================================================

window.CarrinhoCheckoutModule =
    CarrinhoCheckoutModule;

window.finalizarPedido =
    finalizarPedido;

window.voltarPaginaAnterior =
    voltarPaginaAnterior;

window.validarEConfirmarPedido =
    validarEConfirmarPedido;

window.iniciarPagamentoPix =
    iniciarPagamentoPix;

window.buscarCEP =
    buscarCEP;

window.buscarCepCadastro =
    buscarCepCadastro;

window.alternarFormularioEndereco =
    alternarFormularioEndereco;

window.checarEnderecoSalvo =
    checarEnderecoSalvo;

window.carregarPaginaEnderecos =
    carregarPaginaEnderecos;

window.excluirEnderecoSalvo =
    excluirEnderecoSalvo;

window.confirmarSelecaoEndereco =
    confirmarSelecaoEndereco;

window.aplicarCupomCarrinho =
    aplicarCupomCarrinho;

