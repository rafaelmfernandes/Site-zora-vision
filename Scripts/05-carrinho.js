// ============================================================
// ZORAVISION - CARRINHO
// Responsabilidade:
// - Gerenciar produtos do carrinho
// - Salvar e carregar carrinho
// - Alterar quantidades
// - Calcular valores
// - Atualizar interface do carrinho
// ============================================================


// ============================================================
// 1. USUÁRIO LOGADO
// ============================================================

function obterUsuarioCarrinho() {
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
            'Erro ao obter usuário do carrinho:',
            erro
        );

        return null;
    }
}


// ============================================================
// 2. CHAVE DO CARRINHO
// ============================================================

function chaveCarrinhoCliente() {
    const usuario = obterUsuarioCarrinho();

    if (!usuario) {
        return 'carrinho';
    }

    return (
        'carrinho_' +
        usuario.email
            .trim()
            .toLowerCase()
    );
}


// ============================================================
// 3. CARREGAR CARRINHO DO LOCALSTORAGE
// ============================================================

function carregarCarrinhoStorage() {
    const usuario = obterUsuarioCarrinho();

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
// 4. ESTADO DO CARRINHO
// ============================================================

const carrinhoState = {

    itens:
        carregarCarrinhoStorage(),

    descontoPorcentagem:
        0,

    taxaEntrega:
        5.00
};


// ============================================================
// 5. MÓDULO DO CARRINHO
// ============================================================

const CarrinhoModule = {

    // ========================================================
    // INICIALIZAÇÃO
    // ========================================================

    init() {
        this.atualizarTudo();
    },


    // ========================================================
    // SALVAR CARRINHO
    // ========================================================

    salvar() {
        const usuario =
            obterUsuarioCarrinho();

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
                    carrinhoState.itens
                )
            );

        } catch (erro) {
            console.error(
                'Erro ao salvar carrinho:',
                erro
            );
        }
    },


    // ========================================================
    // LIMPAR CARRINHO
    // ========================================================

    limpar() {
        carrinhoState.itens = [];

        const usuario =
            obterUsuarioCarrinho();

        if (usuario) {
            localStorage.removeItem(
                chaveCarrinhoCliente()
            );
        }

        this.atualizarTudo();
    },


    // ========================================================
    // ADICIONAR PRODUTO
    // ========================================================

    adicionarProduto(produto) {

        const usuario =
            obterUsuarioCarrinho();

        if (
            !usuario ||
            !usuario.id
        ) {
            alert(
                'Você precisa estar logado para adicionar produtos ao carrinho.'
            );

            window.location.href =
                '02-Login.html';

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
            carrinhoState.itens.find(
                item =>
                    String(item.id) ===
                    String(produto.id)
            );


        // ====================================================
        // PRODUTO JÁ EXISTE
        // ====================================================

        if (itemExistente) {

            const quantidadeAtual =
                parseInt(
                    itemExistente.quantidade
                ) || 0;

            const estoque =
                produto.estoque !== undefined &&
                produto.estoque !== null
                    ? parseInt(
                        produto.estoque
                    )
                    : itemExistente.estoque;


            if (
                estoque !== null &&
                estoque !== undefined &&
                !isNaN(estoque) &&
                estoque <= quantidadeAtual
            ) {
                alert(
                    'A quantidade máxima disponível deste produto já está no carrinho.'
                );

                return false;
            }


            itemExistente.quantidade =
                quantidadeAtual + 1;


            this.atualizarDadosProduto(
                itemExistente,
                produto
            );

        } else {

            // ================================================
            // NOVO PRODUTO
            // ================================================

            const estoque =
                produto.estoque !== undefined &&
                produto.estoque !== null &&
                produto.estoque !== ''
                    ? parseInt(
                        produto.estoque
                    )
                    : null;


            if (
                estoque !== null &&
                !isNaN(estoque) &&
                estoque <= 0
            ) {
                alert(
                    'Este produto está sem estoque.'
                );

                return false;
            }


            carrinhoState.itens.push({

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
                    estoque,

                sku:
                    produto.sku ||
                    '',

                categoria_id:
                    produto.categoria_id ||
                    null
            });
        }


        this.salvar();

        this.atualizarTudo();

        return true;
    },


    // ========================================================
    // ATUALIZAR DADOS DO PRODUTO
    // ========================================================

    atualizarDadosProduto(
        item,
        produto
    ) {

        if (produto.nome) {
            item.nome =
                produto.nome;
        }


        if (
            produto.preco !== undefined &&
            produto.preco !== null
        ) {
            item.preco =
                parseFloat(
                    produto.preco
                ) || 0;
        }


        if (
            produto.imagem ||
            produto.imagem_url ||
            produto.foto
        ) {
            item.imagem =
                produto.imagem ||
                produto.imagem_url ||
                produto.foto;
        }


        if (
            produto.estoque !== undefined &&
            produto.estoque !== null &&
            produto.estoque !== ''
        ) {
            item.estoque =
                parseInt(
                    produto.estoque
                );
        }


        if (produto.sku) {
            item.sku =
                produto.sku;
        }


        if (produto.categoria_id) {
            item.categoria_id =
                produto.categoria_id;
        }
    },


    // ========================================================
    // REMOVER PRODUTO
    // ========================================================

    removerProduto(id) {

        carrinhoState.itens =
            carrinhoState.itens.filter(
                item =>
                    String(item.id) !==
                    String(id)
            );

        this.salvar();

        this.atualizarTudo();
    },


    // ========================================================
    // ALTERAR QUANTIDADE
    // ========================================================

    alterarQuantidade(
        id,
        delta
    ) {

        const usuario =
            obterUsuarioCarrinho();

        if (!usuario) {

            alert(
                'Faça login para alterar o carrinho.'
            );

            window.location.href =
                '02-Login.html';

            return;
        }


        const item =
            carrinhoState.itens.find(
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


        // ====================================================
        // VERIFICAR ESTOQUE
        // ====================================================

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


        // ====================================================
        // QUANTIDADE ZERO = REMOVER
        // ====================================================

        if (
            novaQuantidade <= 0
        ) {

            this.removerProduto(id);

            return;
        }


        item.quantidade =
            novaQuantidade;


        this.salvar();

        this.atualizarTudo();
    },


    // ========================================================
    // CALCULAR SUBTOTAL
    // ========================================================

    calcularSubtotal() {

        return carrinhoState.itens.reduce(
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
    },


    // ========================================================
    // CALCULAR VALORES
    // ========================================================

    calcularValores() {

        const subtotal =
            this.calcularSubtotal();


        const valorDesconto =
            subtotal *
            (
                carrinhoState
                    .descontoPorcentagem /
                100
            );


        const taxaEntrega =
            subtotal > 0
                ? Number(
                    carrinhoState.taxaEntrega
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


    // ========================================================
    // QUANTIDADE TOTAL DE ITENS
    // ========================================================

    quantidadeTotal() {

        return carrinhoState.itens.reduce(
            (
                total,
                item
            ) => {

                return (
                    total +
                    (
                        parseInt(
                            item.quantidade
                        ) || 0
                    )
                );
            },
            0
        );
    },


    // ========================================================
    // RENDERIZAR CARRINHO
    // ========================================================

    renderizar() {

        const container =
            document.getElementById(
                'lista-carrinho'
            );


        if (!container) {
            return;
        }


        // ====================================================
        // CARRINHO VAZIO
        // ====================================================

        if (
            carrinhoState.itens.length === 0
        ) {

            container.innerHTML = `
                <div
                    style="
                        text-align:center;
                        padding:2rem 1rem;
                        color:#64748b;
                    "
                >

                    <div
                        style="
                            font-size:42px;
                            margin-bottom:10px;
                        "
                    >
                        🛒
                    </div>

                    <p
                        style="
                            font-size:0.95rem;
                            margin-bottom:0.5rem;
                        "
                    >
                        Seu carrinho está vazio
                    </p>

                    <small>
                        Adicione produtos para começar.
                    </small>

                </div>
            `;

            return;
        }


        // ====================================================
        // ÍCONE DA LIXEIRA
        // ====================================================

        const iconeLixeira = `
            <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                style="
                    width:18px;
                    height:18px;
                "
            >

                <polyline
                    points="3 6 5 6 21 6"
                ></polyline>

                <path
                    d="
                        M19 6v14
                        a2 2 0 0 1-2 2H7
                        a2 2 0 0 1-2-2V6
                        m3 0V4
                        a2 2 0 0 1 2-2h4
                        a2 2 0 0 1 2 2v2
                    "
                ></path>

            </svg>
        `;


        // ====================================================
        // RENDERIZAR PRODUTOS
        // ====================================================

        container.innerHTML =
            carrinhoState.itens
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

                                    <span
                                        style="
                                            display:none;
                                            width:100%;
                                            height:100%;
                                            align-items:center;
                                            justify-content:center;
                                            font-size:30px;
                                        "
                                    >
                                        📦
                                    </span>
                                `
                                : `
                                    <span
                                        style="
                                            display:flex;
                                            width:100%;
                                            height:100%;
                                            align-items:center;
                                            justify-content:center;
                                            font-size:30px;
                                        "
                                    >
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


                                <div
                                    class="item-detalhes"
                                >

                                    <div>

                                        <p
                                            class="item-titulo"
                                        >
                                            ${item.nome || 'Produto'}
                                        </p>

                                        <p
                                            class="item-preco"
                                        >
                                            R$
                                            ${preco
                                                .toFixed(2)
                                                .replace('.', ',')}
                                        </p>

                                    </div>


                                    <div
                                        class="item-rodape"
                                    >

                                        <div
                                            class="qtd-controles"
                                        >

                                            <button
                                                type="button"
                                                class="btn-qtd"
                                                onclick="
                                                    CarrinhoModule.alterarQuantidade(
                                                        '${item.id}',
                                                        -1
                                                    )
                                                "
                                            >
                                                −
                                            </button>


                                            <span
                                                class="qtd-num"
                                            >
                                                ${quantidade}
                                            </span>


                                            <button
                                                type="button"
                                                class="btn-qtd"
                                                onclick="
                                                    CarrinhoModule.alterarQuantidade(
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
                                                CarrinhoModule.removerProduto(
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


    // ========================================================
    // ATUALIZAR RESUMO
    // ========================================================

    atualizarResumo() {

        const valores =
            this.calcularValores();


        const subtotal =
            document.getElementById(
                'resumo-subtotal'
            );


        if (subtotal) {

            subtotal.textContent =
                `R$ ${valores.subtotal
                    .toFixed(2)
                    .replace('.', ',')}`;
        }


        const total =
            document.getElementById(
                'valor-total'
            );


        if (total) {

            total.textContent =
                `R$ ${valores.total
                    .toFixed(2)
                    .replace('.', ',')}`;
        }


        // ====================================================
        // BADGES DO CARRINHO
        // ====================================================

        const quantidade =
            this.quantidadeTotal();


        document
            .querySelectorAll(
                '.badge-carrinho, .carrinho-badge, .carrinho-count'
            )
            .forEach(
                badge => {

                    badge.textContent =
                        quantidade;
                }
            );
    },


    // ========================================================
    // ATUALIZAR TUDO
    // ========================================================

    atualizarTudo() {

        this.renderizar();

        this.atualizarResumo();
    }
};


// ============================================================
// 6. FINALIZAR COMPRA
// ============================================================

function finalizarPedido() {

    const usuario =
        obterUsuarioCarrinho();


    if (!usuario) {

        alert(
            'Faça login para finalizar seu pedido.'
        );

        window.location.href =
            '02-Login.html';

        return;
    }


    if (
        !carrinhoState.itens ||
        carrinhoState.itens.length === 0
    ) {

        alert(
            'Seu carrinho está vazio! Adicione algum produto antes de finalizar.'
        );

        return;
    }


    window.location.href =
        '04-Checkout.html';
}


// ============================================================
// 7. VOLTAR
// ============================================================

function voltarPaginaAnterior() {

    const anterior =
        document.referrer;


    if (
        anterior &&
        !anterior.includes(
            '04-carrinho.html'
        ) &&
        !anterior.includes(
            '04-Checkout.html'
        )
    ) {

        window.history.back();

    } else {

        window.location.href =
            'index.html';
    }
}


// ============================================================
// 8. INICIALIZAÇÃO
// ============================================================

document.addEventListener(
    'DOMContentLoaded',
    () => {

        CarrinhoModule.init();
    }
);


// ============================================================
// 9. COMPATIBILIDADE COM CÓDIGO EXISTENTE
// ============================================================

window.CarrinhoModule =
    CarrinhoModule;

window.finalizarPedido =
    finalizarPedido;

window.voltarPaginaAnterior =
    voltarPaginaAnterior;