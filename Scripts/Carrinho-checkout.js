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

    console.error('Supabase não está disponível em window.supabaseClient.');
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
        console.error('Erro ao ler usuário logado:', erro);
        return null;
    }
}


// ============================================================
// 3. CHAVE DO CARRINHO
// ============================================================

function chaveCarrinhoCliente() {

    const usuario = obterUsuarioLogado();

    if (usuario && usuario.email) {
        return 'carrinho_' + usuario.email.toLowerCase();
    }

    return 'carrinho';
}


// ============================================================
// 4. CHAVE DO ENDEREÇO
// ============================================================

function chaveEnderecoCliente() {

    const usuario = obterUsuarioLogado();

    if (usuario && usuario.email) {
        return 'ultimo_endereco_cliente_' +
            usuario.email.toLowerCase();
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

        return JSON.parse(
            localStorage.getItem(
                chaveCarrinhoCliente()
            )
        ) || [];

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

    carrinho:
        carregarCarrinhoStorage(),

    cupomAtivo:
        null,

    descontoPorcentagem:
        0,

    metodoPagamento:
        localStorage.getItem(
            'ultimo_metodo_pagamento'
        ) || 'pix',

    taxaEntrega:
        5.00
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


    adicionarProduto(produto) {

    const usuario = obterUsuarioLogado();

    if (!usuario || !usuario.id) {
        alert('Você precisa estar logado para adicionar produtos ao carrinho.');
        window.location.href = 'Login.html';
        return false;
    }

    if (!produto || !produto.id) {
        console.error('Produto inválido:', produto);
        return false;
    }

    const itemExistente = checkoutState.carrinho.find(
        item => String(item.id) === String(produto.id)
    );

    if (itemExistente) {

        itemExistente.quantidade += 1;

        if (produto.nome) {
            itemExistente.nome = produto.nome;
        }

        if (produto.preco !== undefined && produto.preco !== null) {
            itemExistente.preco = parseFloat(produto.preco) || 0;
        }

        if (produto.imagem) {
            itemExistente.imagem = produto.imagem;
        }

    } else {

        checkoutState.carrinho.push({
            id: produto.id,
            nome: produto.nome || 'Produto',
            preco: parseFloat(produto.preco) || 0,
            imagem:
                produto.imagem ||
                produto.imagem_url ||
                produto.foto ||
                '',
            quantidade: 1,
            estoque:
                produto.estoque !== undefined
                    ? produto.estoque
                    : null,
            sku: produto.sku || '',
            categoria_id: produto.categoria_id || null
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
            item.quantidade + delta;


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
                novaQuantidade > estoque
            ) {

                novaQuantidade =
                    estoque;

                alert(
                    'Quantidade máxima disponível em estoque: ' +
                    estoque
                );
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
                (total, item) => {

                    const preco =
                        parseFloat(
                            item.preco
                        ) || 0;

                    const quantidade =
                        parseInt(
                            item.quantidade
                        ) || 0;

                    return total +
                        (
                            preco *
                            quantidade
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
                ? checkoutState.taxaEntrega
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
            checkoutState.carrinho.map(
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
                                    alt="${item.nome}"
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
                                        ${item.nome}
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
                                            ${item.quantidade}
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
            ).join('');
    },


    atualizarResumoValores() {

        const {
            subtotal
        } = this.calcularValores();


        const elSubtotal =
            document.getElementById(
                'resumo-subtotal'
            );


        if (elSubtotal) {

            elSubtotal.textContent =
                `R$ ${subtotal
                    .toFixed(2)
                    .replace('.', ',')}`;
        }


        const elTotal =
            document.getElementById(
                'valor-total'
            );


        if (elTotal) {

            elTotal.textContent =
                `R$ ${subtotal
                    .toFixed(2)
                    .replace('.', ',')}`;
        }


        const totalItens =
            checkoutState.carrinho.reduce(
                (total, item) =>
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


        if (rua)
            rua.value =
                dados.logradouro || '';


        if (bairro)
            bairro.value =
                dados.bairro || '';


        if (cidade)
            cidade.value =
                dados.localidade || '';


        if (uf)
            uf.value =
                dados.uf || '';


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


        if (numero)
            numero.focus();


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


    let endereco = null;


    try {

        endereco =
            JSON.parse(
                localStorage.getItem(
                    chaveEnderecoCliente()
                )
            );

    } catch (erro) {

        endereco = null;
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


        if (nome)
            nome.textContent =
                endereco.nome || '';


        if (rua)
            rua.textContent =
                `${endereco.rua}, nº ${endereco.numero || ''}` +
                `${endereco.complemento
                    ? ' (' +
                      endereco.complemento +
                      ')'
                    : ''}`;


        if (bairro)
            bairro.textContent =
                `${endereco.bairro || ''} - ` +
                `${endereco.cidade || ''}/` +
                `${endereco.uf
                    ? endereco.uf.toUpperCase()
                    : ''}`;


        if (cep)
            cep.textContent =
                `CEP: ${endereco.cep || ''}`;


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
            (total, item) =>
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
        carrinho.map(
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
                            ${quantidade}x ${item.nome}
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
        ).join('');


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


    if (
        !usuario ||
        !usuario.email
    ) {

        throw new Error(
            'Usuário logado não possui e-mail.'
        );
    }


    const email =
        usuario.email
            .trim()
            .toLowerCase();


    const {
        data,
        error
    } =
        await supabase
            .from('clientes')
            .select(
                'id,nome,email,telefone'
            )
            .eq(
                'email',
                email
            )
            .maybeSingle();


    if (error) {

        console.error(
            'ERRO AO BUSCAR CLIENTE:',
            error
        );

        throw error;
    }


    if (!data) {

        console.error(
            'CLIENTE NÃO ENCONTRADO:',
            email
        );

        throw new Error(
            'Cliente não encontrado no Supabase.'
        );
    }


    console.log(
        'CLIENTE ENCONTRADO:',
        data
    );


    return data;
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


    if (
        !usuario ||
        !usuario.email
    ) {
        return null;
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
                .select('*')
                .eq(
                    'cliente_id',
                    cliente.id
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

            console.warn(
                'Nenhum endereço encontrado para o cliente.'
            );

            return null;
        }


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
                            ).replace(
                                /\D/g,
                                ''
                            );

                        return cepBanco ===
                            cepLocal;
                    }
                );


            if (encontrado) {

                return encontrado;
            }
        }


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

async function salvarPedidoNoSupabase(
    pedidoAtual,
    valores,
    endereco,
    usuario
) {

    try {

        const clienteId =
            usuario?.id || null;


        if (!clienteId) {

            console.error(
                'ERRO: usuário não possui ID.'
            );

            return null;
        }


        let enderecoId = null;


        const {
            data: enderecosCliente,
            error: erroEndereco
        } =
            await window.supabaseClient
                .from('enderecos')
                .select(
                    'id, cliente_id, nome_destinatario, cep, rua, numero, complemento, bairro, cidade, estado, principal'
                )
                .eq(
                    'cliente_id',
                    clienteId
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


        if (erroEndereco) {

            console.error(
                'ERRO AO BUSCAR ENDEREÇO:',
                erroEndereco
            );

        } else if (
            enderecosCliente &&
            enderecosCliente.length > 0
        ) {

            const enderecoPrincipal =
                enderecosCliente.find(
                    item =>
                        item.principal === true
                );


            if (enderecoPrincipal) {

                enderecoId =
                    enderecoPrincipal.id;

            } else {

                enderecoId =
                    enderecosCliente[0].id;
            }

        }


        const pedidoBanco = {

            cliente_id:
                clienteId,

            endereco_id:
                enderecoId,

            status:
                'pendente',

            status_pagamento:
                'pendente',

            forma_pagamento:
                pedidoAtual.pagamento ||
                'PIX',

            subtotal:
                valores.subtotal,

            frete:
                valores.taxaEntrega,

            desconto:
                valores.valorDesconto,

            total:
                valores.total,

            observacoes:
                null
        };


        const {
            data,
            error
        } =
            await window.supabaseClient
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


        if (data.numero_pedido) {

            pedidoAtual.numero =
                '#' +
                data.numero_pedido;

            pedidoAtual.id =
                data.id;
        }


        if (
            Array.isArray(
                pedidoAtual.itens
            ) &&
            pedidoAtual.itens.length > 0
        ) {

            const itensBanco =
                pedidoAtual.itens.map(
                    item => ({

                        pedido_id:
                            data.id,

                        produto_id:
                            item.id ||
                            null,

                        nome_produto:
                            item.nome ||
                            'Produto',

                        quantidade:
                            parseInt(
                                item.quantidade
                            ) || 1,

                        preco_unitario:
                            parseFloat(
                                item.preco
                            ) || 0,

                        subtotal:
                            (
                                parseFloat(
                                    item.preco
                                ) || 0
                            ) *
                            (
                                parseInt(
                                    item.quantidade
                                ) || 1
                            )
                    })
                );


            const {
                data: itensCriados,
                error: erroItens
            } =
                await window.supabaseClient
                    .from('itens_pedido')
                    .insert(
                        itensBanco
                    )
                    .select();


            if (erroItens) {

                console.error(
                    'ERRO AO CRIAR ITENS:',
                    erroItens
                );

            } else {

                console.log(
                    'ITENS CRIADOS COM SUCESSO:',
                    itensCriados
                );
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
    const usuario = obterUsuarioLogado();

    if (!usuario) {
        alert('Você precisa estar logado para continuar.');
        window.location.href = 'Login.html';
        return;
    }

    if (!checkoutState.carrinho || checkoutState.carrinho.length === 0) {
        alert('Seu carrinho está vazio! Volte e adicione algum produto antes de finalizar.');
        return;
    }

    const formulario = document.getElementById('form-endereco');
    const formularioVisivel = formulario && formulario.style.display !== 'none';

    if (formularioVisivel) {
        const nome = document.getElementById('end-nome');
        const cep = document.getElementById('end-cep');
        const rua = document.getElementById('end-rua');
        const numero = document.getElementById('end-numero');
        const bairro = document.getElementById('end-bairro');
        const cidade = document.getElementById('end-cidade');
        const uf = document.getElementById('end-uf');
        const complemento = document.getElementById('end-complemento');

        const obrigatorios = [
            nome,
            cep,
            rua,
            numero,
            bairro,
            cidade,
            uf
        ];

        const vazio = obrigatorios.some(
            campo => !campo || !campo.value.trim()
        );

        if (vazio) {
            alert('Preencha todos os campos obrigatórios do endereço de entrega antes de continuar.');
            return;
        }

        const endereco = {
            nome: nome.value.trim(),
            cep: cep.value.trim(),
            rua: rua.value.trim(),
            numero: numero.value.trim(),
            complemento: complemento ? complemento.value.trim() : '',
            bairro: bairro.value.trim(),
            cidade: cidade.value.trim(),
            uf: uf.value.trim()
        };

        localStorage.setItem(
            chaveEnderecoCliente(),
            JSON.stringify(endereco)
        );

    } else {
        let endereco = null;

        try {
            endereco = JSON.parse(
                localStorage.getItem(chaveEnderecoCliente())
            );
        } catch (erro) {
            endereco = null;
        }

        if (!endereco || !endereco.rua) {
            alert('Informe um endereço de entrega antes de continuar.');
            return;
        }
    }

    const pagamento = document.querySelector(
        'input[name="pagamento"]:checked'
    );

    if (!pagamento) {
        alert('Selecione uma forma de pagamento.');
        return;
    }

    checkoutState.metodoPagamento = pagamento.value;

    localStorage.setItem(
        'ultimo_metodo_pagamento',
        pagamento.value
    );

    if (pagamento.value === 'pix') {
        window.location.href = 'Pagamento-pix.html';
        return;
    }

    alert('Neste momento, o pagamento disponível é PIX.');
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


    let pedidoAtual = null;


    /*
    ============================================================
    1. PRIMEIRO: RECUPERA O PEDIDO GERADO PELO MERCADO PAGO
    ============================================================
    */

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

                numero:
                    pagamentoPix.numero_pedido
                        ? `#${pagamentoPix.numero_pedido}`
                        : `#${pagamentoPix.pedido_id}`,

                pagamento:
                    'PIX (Aprovação Instantânea)',

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


    /*
    ============================================================
    2. SE NÃO ENCONTROU PELO PAGAMENTO PIX,
       TENTA RECUPERAR O ÚLTIMO PEDIDO
    ============================================================
    */

    if (!pedidoAtual) {

        try {

            pedidoAtual =
                JSON.parse(
                    localStorage.getItem(
                        'ultimo_pedido_salvo'
                    )
                );

        } catch (erro) {

            pedidoAtual = null;
        }
    }


    /*
    ============================================================
    3. SE AINDA NÃO EXISTE PEDIDO
    ============================================================
    */

    if (!pedidoAtual) {

        alert(
            'Não foi possível localizar o pedido.'
        );

        return;
    }


    /*
    ============================================================
    4. BUSCAR O PEDIDO REAL NO SUPABASE
    ============================================================
    */

    try {

        const supabase =
            window.supabaseClient;


        if (
            supabase &&
            pedidoAtual.supabase_id
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
                            nome,
                            cep,
                            rua,
                            numero,
                            complemento,
                            bairro,
                            cidade,
                            uf
                        ),
                        itens_pedido (
                            id,
                            produto_id,
                            quantidade,
                            preco_unitario,
                            produtos (
                                id,
                                nome,
                                imagem,
                                preco
                            )
                        )
                    `)
                    .eq(
                        'id',
                        pedidoAtual.supabase_id
                    )
                    .eq(
                        'cliente_id',
                        usuario.id
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


    /*
    ============================================================
    5. NÚMERO DO PEDIDO
    ============================================================
    */

    const numeroPedido =
        pedidoAtual.numero_pedido
            ? `#${pedidoAtual.numero_pedido}`
            : pedidoAtual.numero
                ? pedidoAtual.numero
                : `#${pedidoAtual.id}`;


    /*
    ============================================================
    6. DATA E HORA
    ============================================================
    */

    const dataPedido =
        pedidoAtual.created_at
            ? new Date(
                pedidoAtual.created_at
            ).toLocaleDateString(
                'pt-BR',
                {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                }
            )
            : new Date().toLocaleDateString(
                'pt-BR',
                {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                }
            );


    const horaPedido =
        pedidoAtual.created_at
            ? new Date(
                pedidoAtual.created_at
            ).toLocaleTimeString(
                'pt-BR',
                {
                    hour: '2-digit',
                    minute: '2-digit'
                }
            )
            : new Date().toLocaleTimeString(
                'pt-BR',
                {
                    hour: '2-digit',
                    minute: '2-digit'
                }
            );


    /*
    ============================================================
    7. PREENCHER INFORMAÇÕES PRINCIPAIS
    ============================================================
    */

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


    /*
    ============================================================
    8. MONTAR LISTA DE ITENS
    ============================================================
    */

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

                        const produto =
                            item.produtos || {};

                        const imagem =
                            typeof produto.imagem === 'string'
                                ? produto.imagem
                                : '';


                        const temImagem =
                            imagem.startsWith(
                                'http'
                            ) ||
                            imagem.startsWith(
                                'data:image'
                            ) ||
                            imagem.startsWith(
                                '/'
                            );


                        const quantidade =
                            Number(
                                item.quantidade
                            ) || 1;


                        const preco =
                            Number(
                                item.preco_unitario ||
                                produto.preco ||
                                0
                            );


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

                                        ${
                                            temImagem
                                                ? `
                                                    <img
                                                        src="${imagem}"
                                                        alt="${produto.nome || 'Produto'}"
                                                        style="
                                                            width:100%;
                                                            height:100%;
                                                            object-fit:cover;
                                                        "
                                                    >
                                                `
                                                : '📦'
                                        }

                                    </div>

                                    <span>
                                        ${quantidade}x ${produto.nome || 'Produto'}
                                    </span>

                                </div>

                                <span style="font-weight:600;">
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


    /*
    ============================================================
    9. ENDEREÇO
    ============================================================
    */

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

            enderecoPedido = null;
        }
    }


    if (enderecoEl) {

        if (
            enderecoPedido &&
            enderecoPedido.rua
        ) {

            enderecoEl.innerHTML = `

                <p style="margin:0 0 4px 0;">
                    <strong>Destinatário:</strong>
                    ${enderecoPedido.nome || ''}
                </p>

                <p style="margin:0 0 4px 0;">
                    <strong>Endereço:</strong>
                    ${enderecoPedido.rua},
                    Nº ${enderecoPedido.numero || ''}
                    ${
                        enderecoPedido.complemento
                            ? ' (' +
                              enderecoPedido.complemento +
                              ')'
                            : ''
                    }
                </p>

                <p style="margin:0 0 4px 0;">
                    <strong>Bairro:</strong>
                    ${enderecoPedido.bairro || ''}
                </p>

                <p style="margin:0 0 4px 0;">
                    <strong>Cidade/UF:</strong>
                    ${enderecoPedido.cidade || ''}
                    /
                    ${
                        enderecoPedido.uf
                            ? enderecoPedido.uf.toUpperCase()
                            : ''
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
                <p style="color:#ef4444;margin:0;">
                    Endereço de entrega não informado.
                </p>
            `;
        }
    }


    /*
    ============================================================
    10. SALVAR COMO ÚLTIMO PEDIDO
    ============================================================
    */

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


    let endereco = null;


    try {

        endereco =
            JSON.parse(
                localStorage.getItem(
                    chaveEnderecoCliente()
                )
            );

    } catch (erro) {

        endereco = null;
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
                            ? '(' +
                              endereco.complemento +
                              ')'
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

function excluirEnderecoSalvo() {

    if (
        !confirm(
            'Deseja realmente remover este endereço?'
        )
    ) {
        return;
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


    let endereco = null;


    try {

        endereco =
            JSON.parse(
                localStorage.getItem(
                    chaveEnderecoCliente()
                )
            );

    } catch (erro) {

        endereco = null;
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

        const resposta =
            await fetch(
                `https://viacep.com.br/ws/${cep}/json/`
            );


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


        if (rua)
            rua.value =
                dados.logradouro || '';


        if (bairro)
            bairro.value =
                dados.bairro || '';


        if (cidade)
            cidade.value =
                dados.localidade || '';


        if (uf)
            uf.value =
                dados.uf || '';


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

                const usuario =
                    obterUsuarioLogado();


                if (
                    !usuario ||
                    !usuario.id
                ) {

                    alert(
                        'Você precisa estar logado para cadastrar um endereço.'
                    );

                    return;
                }


                const endereco = {

                    nome:
                        document.getElementById(
                            'nome-destinatario'
                        )?.value.trim() ||
                        '',

                    cep:
                        document.getElementById(
                            'cep'
                        )?.value.trim() ||
                        '',

                    rua:
                        document.getElementById(
                            'rua'
                        )?.value.trim() ||
                        '',

                    numero:
                        document.getElementById(
                            'numero'
                        )?.value.trim() ||
                        '',

                    complemento:
                        document.getElementById(
                            'complemento'
                        )?.value.trim() ||
                        '',

                    bairro:
                        document.getElementById(
                            'bairro'
                        )?.value.trim() ||
                        '',

                    cidade:
                        document.getElementById(
                            'cidade'
                        )?.value.trim() ||
                        '',

                    uf:
                        document.getElementById(
                            'uf'
                        )?.value.trim() ||
                        ''
                };


                if (
                    !window.supabaseClient
                ) {

                    alert(
                        'Erro de conexão com o banco de dados.'
                    );

                    return;
                }


                const dadosSupabase = {

                    cliente_id:
                        usuario.id,

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
                    await window.supabaseClient
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
                    'Ocorreu um erro ao salvar o endereço.'
                );
            }
        }
    );
}


// ============================================================
// 25. ADICIONAR PRODUTO
// ============================================================

document.addEventListener('click', event => {

    const botao = event.target.closest('.btn-adicionar');

    if (!botao) {
        return;
    }

    event.stopPropagation();

    const usuario = obterUsuarioLogado();

    if (!usuario || !usuario.id) {
        alert('Você precisa estar logado para adicionar produtos ao carrinho.');
        window.location.href = 'Login.html';
        return;
    }

    const produto = {
        id: botao.dataset.id,
        nome: botao.dataset.nome || 'Produto',
        preco: parseFloat(botao.dataset.preco) || 0,
        imagem:
            botao.dataset.imagem ||
            botao.dataset.imagemUrl ||
            botao.dataset.foto ||
            '',
        estoque:
            botao.dataset.estoque !== undefined
                ? parseInt(botao.dataset.estoque)
                : null,
        sku: botao.dataset.sku || '',
        categoria_id: botao.dataset.categoriaId || null
    };

    if (!produto.id) {
        console.error('O botão de adicionar não possui data-id.');
        return;
    }

    const adicionado =
        CarrinhoCheckoutModule.adicionarProduto(produto);

    if (!adicionado) {
        return;
    }

    const textoOriginal = botao.textContent;

    botao.textContent = 'Adicionado! ✓';
    botao.style.backgroundColor = '#10b981';

    setTimeout(() => {
        botao.textContent = textoOriginal;
        botao.style.backgroundColor = '';
    }, 1200);
});


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

        }

        else if (
            pagina.includes(
                'pedido-confirmado.html'
            )
        ) {

            carregarPedidoConfirmadoDinamico();

        }

        else if (
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

async function iniciarPagamentoPix() {

    const usuario =
        obterUsuarioLogado();

    if (!usuario || !usuario.id) {

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

    let endereco = null;

    const formulario =
        document.getElementById(
            'form-endereco'
        );

    const formularioVisivel =
        formulario &&
        formulario.style.display !== 'none';

    if (formularioVisivel) {

        const nome =
            document.getElementById('end-nome');

        const cep =
            document.getElementById('end-cep');

        const rua =
            document.getElementById('end-rua');

        const numero =
            document.getElementById('end-numero');

        const complemento =
            document.getElementById('end-complemento');

        const bairro =
            document.getElementById('end-bairro');

        const cidade =
            document.getElementById('end-cidade');

        const uf =
            document.getElementById('end-uf');

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
                uf.value.trim().toUpperCase()
        };

        localStorage.setItem(
            chaveEnderecoCliente(),
            JSON.stringify(endereco)
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

            endereco = null;
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

    if (metodo !== 'pix') {

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

        /*
         * CALCULA OS VALORES DO PEDIDO
         */

        const valores =
            CarrinhoCheckoutModule.calcularValores();

        const valor =
            Number(valores.total);

        if (!valor || valor <= 0) {

            throw new Error(
                'O valor total do pedido é inválido.'
            );
        }

        /*
         * MONTA OS ITENS
         */

        const itens =
            checkoutState.carrinho.map(
                item => ({

                    id:
                        item.id,

                    quantidade:
                        Number(
                            item.quantidade
                        ) || 1
                })
            );

        /*
         * CHAMA A EDGE FUNCTION CORRETA:
         *
         * /functions/v1/criar-pix
         */

        const resposta =
            await fetch(
                'https://ratajxnxkjoiuknamacn.supabase.co/functions/v1/criar-pix',
                {
                    method: 'POST',

                    headers: {

                        'Content-Type':
                            'application/json',

                        'apikey':
                            window.supabaseClient.supabaseKey
                    },

                    body:
                        JSON.stringify({

                            cliente_id:
                                usuario.id,

                            email:
                                usuario.email,

                            nome:
                                usuario.nome ||
                                'Cliente',

                            valor:
                                valor,

                            subtotal:
                                Number(
                                    valores.subtotal
                                ) || valor,

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

        const dados =
            await resposta.json();

        console.log(
            'RESPOSTA DA EDGE FUNCTION CRIAR-PIX:',
            dados
        );

        if (
            !resposta.ok ||
            !dados.sucesso
        ) {

            throw new Error(
                dados.error ||
                dados.erro ||
                'Não foi possível gerar o pagamento PIX.'
            );
        }

        /*
         * SALVA OS DADOS DO PAGAMENTO
         */

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

        /*
         * SALVA O PEDIDO GERADO PELO SUPABASE
         */

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

        /*
         * NÃO LIMPA O CARRINHO AQUI.
         *
         * O pagamento ainda está pendente.
         */

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