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
        return JSON.parse(localStorage.getItem('usuario_logado')) || null;
    } catch (erro) {
        console.error('Erro ao ler usuário logado:', erro);
        return null;
    }
}


// ============================================================
// 3. CHAVE DO CARRINHO
// ============================================================

function chaveCarrinhoCliente() {
    return 'carrinho';
}


// ============================================================
// 4. CHAVE DO ENDEREÇO
// ============================================================

function chaveEnderecoCliente() {
    const usuario = obterUsuarioLogado();

    if (usuario && usuario.email) {
        return 'ultimo_endereco_cliente_' + usuario.email.toLowerCase();
    }

    return 'ultimo_endereco_cliente';
}


// ============================================================
// 5. CARREGAR CARRINHO
// ============================================================

function carregarCarrinhoStorage() {
    try {
        return JSON.parse(
            localStorage.getItem(chaveCarrinhoCliente())
        ) || [];
    } catch (erro) {
        console.error('Erro ao carregar carrinho:', erro);
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
        localStorage.getItem('ultimo_metodo_pagamento') || 'pix',

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

        try {

            localStorage.setItem(
                chaveCarrinhoCliente(),
                JSON.stringify(checkoutState.carrinho)
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

        if (!produto || !produto.id) {

            console.error(
                'Produto inválido:',
                produto
            );

            return;
        }

        const itemExistente =
            checkoutState.carrinho.find(
                item =>
                    String(item.id) === String(produto.id)
            );


        if (itemExistente) {

            itemExistente.quantidade += 1;

            if (produto.nome) {
                itemExistente.nome = produto.nome;
            }

            if (
                produto.preco !== undefined &&
                produto.preco !== null
            ) {

                itemExistente.preco =
                    parseFloat(produto.preco) || 0;
            }

            if (produto.imagem) {
                itemExistente.imagem = produto.imagem;
            }

        } else {

            checkoutState.carrinho.push({

                id: produto.id,

                nome: produto.nome || 'Produto',

                preco:
                    parseFloat(produto.preco) || 0,

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

                sku:
                    produto.sku || '',

                categoria_id:
                    produto.categoria_id || null

            });
        }


        this.salvarStorage();

        this.atualizarTudo();
    },


    removerProduto(id) {

        checkoutState.carrinho =
            checkoutState.carrinho.filter(
                item =>
                    String(item.id) !== String(id)
            );

        this.salvarStorage();

        this.atualizarTudo();
    },


    alterarQuantidade(id, delta) {

        const item =
            checkoutState.carrinho.find(
                produto =>
                    String(produto.id) === String(id)
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
                parseInt(item.estoque);

            if (
                !isNaN(estoque) &&
                novaQuantidade > estoque
            ) {

                novaQuantidade = estoque;

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
                        parseFloat(item.preco) || 0;

                    const quantidade =
                        parseInt(item.quantidade) || 0;

                    return total +
                        (preco * quantidade);

                },
                0
            );


        const valorDesconto =
            subtotal *
            (
                checkoutState.descontoPorcentagem / 100
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
            checkoutState.carrinho.map(item => {

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
                    parseFloat(item.preco) || 0;


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

            }).join('');
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
                    (parseInt(item.quantidade) || 0),
                0
            );


        document
            .querySelectorAll(
                '.badge-carrinho, .carrinho-badge, .carrinho-count'
            )
            .forEach(badge => {

                badge.textContent =
                    totalItens;
            });
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
            .forEach(radio => {

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
            });
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
        !anterior.includes('carrinho.html') &&
        !anterior.includes('Checkout.html')
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


    campos.forEach(campo => {

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
    });
}


// ============================================================
// 11. BUSCAR CEP
// ============================================================

async function buscarCEP() {

    const input =
        document.getElementById('end-cep');

    const status =
        document.getElementById('cep-status');


    if (!input) {
        return;
    }


    const cep =
        input.value.replace(/\D/g, '');


    if (cep.length !== 8) {

        if (status) {

            status.style.color = '#ef4444';

            status.textContent =
                'Informe um CEP válido com 8 dígitos.';
        }

        return;
    }


    if (status) {

        status.style.color = '#2563eb';

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

                status.style.color = '#ef4444';

                status.textContent =
                    'CEP não encontrado.';
            }

            return;
        }


        const rua =
            document.getElementById('end-rua');

        const bairro =
            document.getElementById('end-bairro');

        const cidade =
            document.getElementById('end-cidade');

        const uf =
            document.getElementById('end-uf');


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

            status.style.color = '#10b981';

            status.textContent =
                'Endereço localizado!';
        }


        const numero =
            document.getElementById('end-numero');


        if (numero)
            numero.focus();


    } catch (erro) {

        console.error(
            'Erro ao consultar CEP:',
            erro
        );


        if (status) {

            status.style.color = '#ef4444';

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
                    ? ' (' + endereco.complemento + ')'
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


        box.style.display = 'block';

        formulario.style.display = 'none';


    } else {

        box.style.display = 'none';

        formulario.style.display = 'flex';
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

        box.style.display = 'none';

        formulario.style.display = 'flex';

        if (cancelar) {
            cancelar.style.display = 'inline-block';
        }

    } else {

        box.style.display = 'block';

        formulario.style.display = 'none';
    }
}


// ============================================================
// 14. CARREGAR CHECKOUT
// ============================================================

function carregarCheckoutDinamico() {

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
                (parseInt(item.quantidade) || 0),
            0
        );


    if (titulo) {

        titulo.textContent =
            `📦 Itens do Pedido (${quantidadeTotal})`;
    }


    lista.innerHTML =
        carrinho.map(item => {

            const preco =
                parseFloat(item.preco) || 0;

            const quantidade =
                parseInt(item.quantidade) || 0;


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

        }).join('');


    const valores =
        CarrinhoCheckoutModule.calcularValores();


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

    const supabase = obterSupabase();

    if (!supabase) {
        throw new Error(
            'Supabase não está disponível.'
        );
    }


    if (!usuario || !usuario.email) {

        throw new Error(
            'Usuário logado não possui e-mail.'
        );
    }


    const email =
        usuario.email.trim().toLowerCase();


    const {
        data,
        error
    } = await supabase
        .from('clientes')
        .select('id,nome,email,telefone')
        .eq('email', email)
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

    const supabase = obterSupabase();

    if (!supabase) {
        throw new Error(
            'Supabase não está disponível.'
        );
    }


    if (!usuario || !usuario.email) {
        return null;
    }


    try {

        const cliente =
            await buscarClienteNoSupabase(
                usuario
            );


        if (!cliente || !cliente.id) {
            return null;
        }


        const {
            data,
            error
        } = await supabase
            .from('enderecos')
            .select('*')
            .eq('cliente_id', cliente.id);


        if (error) {

            console.error(
                'ERRO AO BUSCAR ENDEREÇOS:',
                error
            );

            return null;
        }


        if (!data || data.length === 0) {

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
                    .replace(/\D/g, '');


            const encontrado =
                data.find(endereco => {

                    const cepBanco =
                        String(
                            endereco.cep || ''
                        ).replace(/\D/g, '');

                    return cepBanco === cepLocal;
                });


            if (encontrado) {

                console.log(
                    'ENDEREÇO ENCONTRADO:',
                    encontrado
                );

                return encontrado;
            }
        }


        console.log(
            'USANDO PRIMEIRO ENDEREÇO:',
            data[0]
        );


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

async function salvarPedidoNoSupabase(pedidoAtual, valores, endereco, usuario) {
    try {

        const clienteId = usuario?.id || null;

        if (!clienteId) {
            console.error('ERRO: usuário não possui ID.');
            return null;
        }

        // ====================================================
        // LOCALIZAR ENDEREÇO DO CLIENTE
        // ====================================================

        let enderecoId = null;

        const { data: enderecosCliente, error: erroEndereco } =
            await window.supabaseClient
                .from('enderecos')
                .select('id, cliente_id, nome_destinatario, cep, rua, numero, complemento, bairro, cidade, estado, principal')
                .eq('cliente_id', clienteId)
                .order('principal', { ascending: false })
                .order('created_at', { ascending: false });

        if (erroEndereco) {

            console.error(
                'ERRO AO BUSCAR ENDEREÇO:',
                erroEndereco
            );

        } else if (enderecosCliente && enderecosCliente.length > 0) {

            // Primeiro endereço principal
            const enderecoPrincipal =
                enderecosCliente.find(
                    item => item.principal === true
                );

            if (enderecoPrincipal) {

                enderecoId =
                    enderecoPrincipal.id;

            } else {

                // Se não existir principal,
                // utiliza o endereço mais recente
                enderecoId =
                    enderecosCliente[0].id;

            }

            console.log(
                'ENDEREÇO ENCONTRADO:',
                enderecosCliente
            );

            console.log(
                'ENDEREÇO ID SELECIONADO:',
                enderecoId
            );

        } else {

            console.warn(
                'Nenhum endereço encontrado para o cliente:',
                clienteId
            );

        }


        // ====================================================
        // CRIAR PEDIDO
        // ====================================================

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
                pedidoAtual.pagamento || 'PIX',

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


        console.log(
            'ENVIANDO PEDIDO:',
            pedidoBanco
        );


        const { data, error } =
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


        console.log(
            'PEDIDO CRIADO COM SUCESSO:',
            data
        );


        // ====================================================
        // ATUALIZAR NÚMERO DO PEDIDO
        // ====================================================

        if (data.numero_pedido) {

            pedidoAtual.numero =
                '#' + data.numero_pedido;

            pedidoAtual.id =
                data.id;

        }


        // ====================================================
        // CRIAR ITENS DO PEDIDO
        // ====================================================

        if (
            Array.isArray(pedidoAtual.itens) &&
            pedidoAtual.itens.length > 0
        ) {

            const itensBanco =
                pedidoAtual.itens.map(
                    item => ({

                        pedido_id:
                            data.id,

                        produto_id:
                            item.id || null,

                        nome_produto:
                            item.nome || 'Produto',

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


            console.log(
                'ENVIANDO ITENS:',
                itensBanco
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


    // --------------------------------------------------------
    // Endereço novo
    // --------------------------------------------------------

    if (formularioVisivel) {

        const nome =
            document.getElementById('end-nome');

        const cep =
            document.getElementById('end-cep');

        const rua =
            document.getElementById('end-rua');

        const numero =
            document.getElementById('end-numero');

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
                'Preencha todos os campos obrigatórios do endereço de entrega antes de continuar.'
            );

            return;
        }


        const complemento =
            document.getElementById(
                'end-complemento'
            );


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
                uf.value.trim()
        };


        localStorage.setItem(
            chaveEnderecoCliente(),
            JSON.stringify(endereco)
        );

    } else {

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
                'Informe um endereço de entrega antes de continuar.'
            );

            return;
        }
    }


    // --------------------------------------------------------
    // Método de pagamento
    // --------------------------------------------------------

    const pagamento =
        document.querySelector(
            'input[name="pagamento"]:checked'
        );


    if (pagamento) {

        checkoutState.metodoPagamento =
            pagamento.value;

        localStorage.setItem(
            'ultimo_metodo_pagamento',
            pagamento.value
        );
    }


    // --------------------------------------------------------
    // Ir para confirmação
    // --------------------------------------------------------

    window.location.href =
        'Pedido-confirmado.html';
}


// ============================================================
// 19. PEDIDO CONFIRMADO
// ============================================================

async function carregarPedidoConfirmadoDinamico() {

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


    let historico = [];

    let pedidosAdmin = [];


    try {

        historico =
            JSON.parse(
                localStorage.getItem(
                    'historico_pedidos_cliente'
                )
            ) || [];

    } catch (erro) {

        historico = [];
    }


    try {

        pedidosAdmin =
            JSON.parse(
                localStorage.getItem(
                    'pedidos_loja'
                )
            ) || [];

    } catch (erro) {

        pedidosAdmin = [];
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


    const usuario =
        obterUsuarioLogado() || {};


    let pedidoAtual = null;


    // ========================================================
    // CRIAR NOVO PEDIDO
    // ========================================================

    if (
        checkoutState.carrinho &&
        checkoutState.carrinho.length > 0
    ) {

        const valores =
            CarrinhoCheckoutModule.calcularValores();


        const numeroRandom =
            Math.floor(
                10000 +
                Math.random() * 90000
            );


        const agora =
            new Date();


        const data =
            agora.toLocaleDateString(
                'pt-BR',
                {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                }
            );


        const hora =
            agora.toLocaleDateString(
                'pt-BR'
            ) +
            ' às ' +
            agora.toLocaleTimeString(
                'pt-BR',
                {
                    hour: '2-digit',
                    minute: '2-digit'
                }
            );


        const metodo =
            localStorage.getItem(
                'ultimo_metodo_pagamento'
            ) || 'pix';


        const nomesMetodos = {

            pix:
                'PIX (Aprovação Instantânea)',

            cartao:
                'Cartão de Crédito',

            boleto:
                'Boleto Bancário'
        };


        pedidoAtual = {

            id:
                numeroRandom,

            numero:
                '#' + numeroRandom,

            data:
                data,

            hora:
                hora,

            pagamento:
                nomesMetodos[metodo] || 'PIX',

            status:
                'pendente',

            cliente: {

                nome:
                    usuario.nome ||
                    (
                        endereco
                            ? endereco.nome
                            : 'Cliente da Loja'
                    ),

                email:
                    usuario.email || '',

                telefone:
                    usuario.telefone || ''
            },

            itens:
                [...checkoutState.carrinho],

            subtotal:
                valores.subtotal,

            desconto:
                valores.valorDesconto,

            frete:
                valores.taxaEntrega,

            total:
                valores.total,

            endereco:
                endereco
        };


        // ====================================================
        // SALVAR NO SUPABASE
        // ====================================================

        try {

            const resultado =
                await salvarPedidoNoSupabase(
                    pedidoAtual,
                    valores,
                    endereco,
                    usuario
                );


            console.log(
                'PEDIDO SALVO NO SUPABASE:',
                resultado
            );


            // Guardar o UUID real do Supabase
            if (
                resultado &&
                resultado.pedido
            ) {

                pedidoAtual.supabase_id =
                    resultado.pedido.id;

                pedidoAtual.cliente_id =
                    resultado.pedido.cliente_id;

                pedidoAtual.endereco_id =
                    resultado.pedido.endereco_id;
            }


        } catch (erroSupabase) {

            console.error(
                'ERRO AO SALVAR PEDIDO NO SUPABASE:',
                erroSupabase
            );


            alert(
                'Não foi possível salvar o pedido no banco de dados. Verifique sua conexão e tente novamente.'
            );


            return;
        }


        // ====================================================
        // SALVAR LOCALMENTE
        // ====================================================

        localStorage.setItem(
            'ultimo_pedido_salvo',
            JSON.stringify(pedidoAtual)
        );


        historico.unshift(
            pedidoAtual
        );


        localStorage.setItem(
            'historico_pedidos_cliente',
            JSON.stringify(historico)
        );


        pedidosAdmin.unshift(
            pedidoAtual
        );


        localStorage.setItem(
            'pedidos_loja',
            JSON.stringify(pedidosAdmin)
        );


        // ====================================================
        // LIMPAR CARRINHO
        // ====================================================

        checkoutState.carrinho = [];

        CarrinhoCheckoutModule.salvarStorage();


    } else {

        // ====================================================
        // RECARREGAMENTO DA CONFIRMAÇÃO
        // ====================================================

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


    if (!pedidoAtual) {
        return;
    }


    // ========================================================
    // PREENCHER CONFIRMAÇÃO
    // ========================================================

    if (numeroEl)
        numeroEl.textContent =
            pedidoAtual.numero;


    if (dataEl)
        dataEl.textContent =
            pedidoAtual.data;


    if (horaEl)
        horaEl.textContent =
            pedidoAtual.hora;


    if (pagamentoEl)
        pagamentoEl.textContent =
            pedidoAtual.pagamento;


    if (totalEl)
        totalEl.textContent =
            `R$ ${Number(pedidoAtual.total || 0)
                .toFixed(2)
                .replace('.', ',')}`;


    // ========================================================
    // ITENS
    // ========================================================

    if (
        listaEl &&
        pedidoAtual.itens
    ) {

        listaEl.innerHTML =
            pedidoAtual.itens
                .map(item => {

                    const imagem =
                        typeof item.imagem === 'string'
                            ? item.imagem
                            : '';


                    const temImagem =
                        imagem.startsWith('http') ||
                        imagem.startsWith('data:image') ||
                        imagem.startsWith('/');


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
                                                    alt="${item.nome}"
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
                                    ${item.quantidade}x ${item.nome}
                                </span>

                            </div>


                            <span style="font-weight:600;">
                                R$
                                ${(
                                    (Number(item.preco) || 0) *
                                    (Number(item.quantidade) || 0)
                                )
                                    .toFixed(2)
                                    .replace('.', ',')}
                            </span>

                        </div>
                    `;

                })
                .join('');
    }


    // ========================================================
    // ENDEREÇO
    // ========================================================

    const enderecoPedido =
        pedidoAtual.endereco ||
        endereco;


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
                            ? '(' +
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

            enderecoEl.innerHTML =
                `<p style="color:#ef4444;margin:0;">
                    Endereço de entrega não informado.
                </p>`;
        }
    }
}


// ============================================================
// 20. LISTA DE ENDEREÇOS
// ============================================================

function carregarPaginaEnderecos() {

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
        document.getElementById('cep');

    const status =
        document.getElementById('cep-status');


    if (!input) {
        return;
    }


    const cep =
        input.value.replace(/\D/g, '');


    if (cep.length !== 8) {

        if (status) {

            status.style.color = '#ef4444';

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

                status.style.color = '#ef4444';

                status.textContent =
                    'CEP não encontrado.';
            }

            return;
        }


        const rua =
            document.getElementById('rua');

        const bairro =
            document.getElementById('bairro');

        const cidade =
            document.getElementById('cidade');

        const uf =
            document.getElementById('uf');


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

            status.style.color = '#10b981';

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
                        .replace(/\D/g, '');

                if (valor.length === 8) {
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

                if (!usuario || !usuario.id) {

                    alert(
                        'Você precisa estar logado para cadastrar um endereço.'
                    );

                    return;

                }

                const endereco = {

                    nome:
                        document.getElementById(
                            'nome-destinatario'
                        )?.value.trim() || '',

                    cep:
                        document.getElementById(
                            'cep'
                        )?.value.trim() || '',

                    rua:
                        document.getElementById(
                            'rua'
                        )?.value.trim() || '',

                    numero:
                        document.getElementById(
                            'numero'
                        )?.value.trim() || '',

                    complemento:
                        document.getElementById(
                            'complemento'
                        )?.value.trim() || '',

                    bairro:
                        document.getElementById(
                            'bairro'
                        )?.value.trim() || '',

                    cidade:
                        document.getElementById(
                            'cidade'
                        )?.value.trim() || '',

                    uf:
                        document.getElementById(
                            'uf'
                        )?.value.trim() || ''

                };


                // ============================================
                // SALVAR NO SUPABASE
                // ============================================

                if (
                    !window.supabaseClient
                ) {

                    console.error(
                        'Supabase não está disponível.'
                    );

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
                        endereco.complemento || null,

                    bairro:
                        endereco.bairro,

                    cidade:
                        endereco.cidade,

                    estado:
                        endereco.uf,

                    principal:
                        true

                };


                console.log(
                    'SALVANDO ENDEREÇO NO SUPABASE:',
                    dadosSupabase
                );


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


                console.log(
                    'ENDEREÇO SALVO COM SUCESSO:',
                    data
                );


                // ============================================
                // SALVAR TAMBÉM NO LOCALSTORAGE
                // ============================================

                localStorage.setItem(
                    chaveEnderecoCliente(),
                    JSON.stringify(endereco)
                );


                alert(
                    'Endereço salvo com sucesso!'
                );


                // ============================================
                // VOLTAR PARA ENDEREÇOS
                // ============================================

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


        const id =
            botao.dataset.id;


        const nome =
            botao.dataset.nome ||
            'Produto';


        const preco =
            parseFloat(
                botao.dataset.preco
            ) || 0;


        const imagem =
            botao.dataset.imagem ||
            botao.dataset.imagemUrl ||
            botao.dataset.foto ||
            '';


        const estoque =
            botao.dataset.estoque !== undefined
                ? parseInt(
                    botao.dataset.estoque
                )
                : null;


        const produto = {

            id,

            nome,

            preco,

            imagem,

            estoque,

            sku:
                botao.dataset.sku || '',

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


        CarrinhoCheckoutModule
            .adicionarProduto(
                produto
            );


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
            event.target.closest('button')
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

    const campo =
        document.getElementById(
            'input-cupom'
        );


    const codigo =
        campo
            ? campo.value.trim().toUpperCase()
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