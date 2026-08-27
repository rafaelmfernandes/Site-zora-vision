// ============================================================
// ZORAVISION - DETALHES DO PRODUTO
// Busca o produto diretamente do Supabase
// Compatível com UUID e SKU
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {

    console.log('📦 Página de produto iniciada.');

    // ========================================================
    // ELEMENTOS DA PÁGINA
    // ========================================================

    const imagemProduto =
        document.getElementById('prod-img');

    const tituloProduto =
        document.getElementById('prod-titulo');

    const precoProduto =
        document.getElementById('prod-preco');

    const precoAntigo =
        document.getElementById('prod-preco-antigo');

    const estoqueTag =
        document.getElementById('prod-estoque-tag');

    const descricaoProduto =
        document.getElementById('prod-descricao');

    const btnFavorito =
        document.getElementById('btn-favoritar-produto');

    const btnCarrinho =
        document.querySelector('.btn-carrinho');

    const btnComprar =
        document.querySelector('.btn-comprar');

    const inputQuantidade =
        document.querySelector('.input-qtd');

    const botoesQuantidade =
        document.querySelectorAll('.btn-qtd');

    const produtosRelacionados =
        document.getElementById('prod-relacionados');


    // ========================================================
    // PEGAR ID / SKU DO PRODUTO NA URL
    // ========================================================

    const parametros =
        new URLSearchParams(
            window.location.search
        );

    const identificadorProduto =
        parametros.get('id');

    console.log(
        '🔎 Identificador do produto:',
        identificadorProduto
    );


    if (!identificadorProduto) {

        console.error(
            '❌ Nenhum ID ou SKU de produto foi informado.'
        );

        mostrarErroProduto(
            'Produto não encontrado.'
        );

        return;
    }


    // ========================================================
    // SUPABASE
    // ========================================================

    const supabase =
        window.supabaseClient;

    if (!supabase) {

        console.error(
            '❌ Supabase não está disponível.'
        );

        mostrarErroProduto(
            'Erro de conexão com o banco de dados.'
        );

        return;
    }


    // ========================================================
    // IDENTIFICAR SE É UUID OU SKU
    // ========================================================

    const uuidValido =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
            .test(
                identificadorProduto
            );


    // ========================================================
    // BUSCAR PRODUTO
    // ========================================================

    let produto = null;

    try {

        console.log(
            '🔎 Buscando produto no Supabase...'
        );


        let consulta =
            supabase
                .from('produtos')
                .select(`
                    id,
                    nome,
                    descricao,
                    preco,
                    preco_promocional,
                    estoque,
                    sku,
                    imagem_url,
                    ativo,
                    destaque,
                    categoria_id,
                    categorias (
                        id,
                        nome
                    )
                `)
                .eq(
                    'ativo',
                    true
                );


        // ----------------------------------------------------
        // SE FOR UUID
        // ----------------------------------------------------

        if (uuidValido) {

            console.log(
                '🔐 Identificador reconhecido como UUID.'
            );

            consulta =
                consulta.eq(
                    'id',
                    identificadorProduto
                );

        }

        // ----------------------------------------------------
        // SE NÃO FOR UUID, TRATAR COMO SKU
        // ----------------------------------------------------

        else {

            console.log(
                '🏷️ Identificador reconhecido como SKU:',
                identificadorProduto
            );

            consulta =
                consulta.eq(
                    'sku',
                    identificadorProduto
                );
        }


        const resultado =
            await consulta.single();


        produto =
            resultado.data;


        const error =
            resultado.error;


        // ====================================================
        // ERRO
        // ====================================================

        if (error) {

            console.error(
                '❌ Erro ao buscar produto:',
                error
            );

            mostrarErroProduto(
                'Não foi possível carregar este produto.'
            );

            return;
        }


        // ====================================================
        // PRODUTO NÃO ENCONTRADO
        // ====================================================

        if (!produto) {

            console.error(
                '❌ Produto não encontrado.'
            );

            mostrarErroProduto(
                'Produto não encontrado.'
            );

            return;
        }


        console.log(
            '✅ Produto recebido:',
            produto
        );


        // ====================================================
        // DADOS DO PRODUTO
        // ====================================================

        const preco =
            Number(
                produto.preco
            ) || 0;


        const precoPromocional =
            Number(
                produto.preco_promocional
            ) || 0;


        const temPromocao =
            precoPromocional > 0 &&
            precoPromocional < preco;


        const precoAtual =
            temPromocao
                ? precoPromocional
                : preco;


        const estoque =
            Number(
                produto.estoque
            ) || 0;


        const categoria =
            produto.categorias?.nome ||
            'Geral';


        // ====================================================
        // TÍTULO
        // ====================================================

        if (tituloProduto) {

            tituloProduto.textContent =
                produto.nome;
        }


        // ====================================================
        // TÍTULO DA ABA
        // ====================================================

        document.title =
            `${produto.nome} - ZoraVision`;


        // ====================================================
        // IMAGEM
        // ====================================================

        if (imagemProduto) {

            if (produto.imagem_url) {

                imagemProduto.innerHTML = `
                    <img
                        src="${produto.imagem_url}"
                        alt="${produto.nome}"
                        style="
                            width:100%;
                            height:100%;
                            object-fit:contain;
                        "
                        onerror="
                            this.style.display='none';
                            this.parentElement.innerHTML='<span style=\\'font-size:5rem;\\'>📦</span>';
                        "
                    >
                `;

            } else {

                imagemProduto.innerHTML = `
                    <span style="
                        font-size:5rem;
                    ">
                        📦
                    </span>
                `;
            }
        }


        // ====================================================
        // PREÇO
        // ====================================================

        if (precoProduto) {

            precoProduto.textContent =
                formatarPreco(
                    precoAtual
                );
        }


        if (precoAntigo) {

            if (temPromocao) {

                precoAntigo.textContent =
                    formatarPreco(
                        preco
                    );

                precoAntigo.style.display =
                    'block';

            } else {

                precoAntigo.style.display =
                    'none';
            }
        }


        // ====================================================
        // ESTOQUE
        // ====================================================

        atualizarEstoque(
            estoque,
            estoqueTag
        );


        // ====================================================
        // QUANTIDADE MÁXIMA
        // ====================================================

        if (inputQuantidade) {

            inputQuantidade.min =
                estoque > 0
                    ? 1
                    : 0;

            inputQuantidade.max =
                Math.max(
                    estoque,
                    1
                );

            inputQuantidade.value =
                estoque > 0
                    ? 1
                    : 0;
        }


        // ====================================================
        // DESCRIÇÃO
        // ====================================================

        if (descricaoProduto) {

            descricaoProduto.textContent =
                produto.descricao ||
                'Este produto ainda não possui uma descrição.';
        }


        // ====================================================
        // CATEGORIA
        // ====================================================

        console.log(
            '📂 Categoria:',
            categoria
        );


        // ====================================================
        // QUANTIDADE + E -
        // ====================================================

        botoesQuantidade.forEach(
            (
                botao,
                indice
            ) => {

                botao.addEventListener(
                    'click',
                    () => {

                        if (!inputQuantidade) {
                            return;
                        }


                        let quantidade =
                            Number(
                                inputQuantidade.value
                            ) || 1;


                        if (indice === 0) {

                            quantidade =
                                Math.max(
                                    1,
                                    quantidade - 1
                                );

                        } else {

                            quantidade =
                                Math.min(
                                    estoque,
                                    quantidade + 1
                                );
                        }


                        inputQuantidade.value =
                            quantidade;
                    }
                );
            }
        );


        // ====================================================
        // FAVORITO
        // ====================================================

        if (btnFavorito) {

            btnFavorito.dataset.id =
                produto.id;


            if (
                typeof FavoritosModule !==
                'undefined'
            ) {

                try {

                    if (
                        typeof FavoritosModule.inicializarBotao ===
                        'function'
                    ) {

                        FavoritosModule.inicializarBotao(
                            btnFavorito,
                            produto.id
                        );
                    }

                } catch (erroFavorito) {

                    console.warn(
                        '⚠️ Não foi possível inicializar o favorito:',
                        erroFavorito
                    );
                }
            }
        }


        // ====================================================
        // ADICIONAR AO CARRINHO
        // ====================================================

        if (btnCarrinho) {

            btnCarrinho.addEventListener(
                'click',
                () => {

                    if (!usuarioEstaLogado()) {

                        alert(
                            'Você precisa estar logado para adicionar produtos ao carrinho.'
                        );

                        window.location.href =
                            'Login.html';

                        return;
                    }


                    const quantidade =
                        Number(
                            inputQuantidade?.value
                        ) || 1;


                    if (estoque <= 0) {

                        alert(
                            'Este produto está sem estoque.'
                        );

                        return;
                    }


                    adicionarAoCarrinho(
                        produto,
                        precoAtual,
                        quantidade
                    );
                }
            );
        }


        // ====================================================
        // COMPRAR AGORA
        // ====================================================

        if (btnComprar) {

            btnComprar.addEventListener(
                'click',
                () => {

                    if (!usuarioEstaLogado()) {

                        alert(
                            'Você precisa estar logado para comprar.'
                        );

                        window.location.href =
                            'Login.html';

                        return;
                    }


                    const quantidade =
                        Number(
                            inputQuantidade?.value
                        ) || 1;


                    if (estoque <= 0) {

                        alert(
                            'Este produto está sem estoque.'
                        );

                        return;
                    }


                    const adicionado =
                        adicionarAoCarrinho(
                            produto,
                            precoAtual,
                            quantidade
                        );


                    if (adicionado) {

                        window.location.href =
                            '04-Checkout.html';
                    }
                }
            );
        }


        // ====================================================
        // PRODUTOS RELACIONADOS
        // ====================================================

        carregarProdutosRelacionados(
            produto,
            produtosRelacionados,
            supabase
        );


        // ====================================================
        // ATUALIZAR BADGE
        // ====================================================

        atualizarBadgeCarrinho();


        console.log(
            '🎉 Página do produto carregada com sucesso!'
        );


    } catch (erro) {

        console.error(
            '❌ Erro inesperado:',
            erro
        );

        mostrarErroProduto(
            'Ocorreu um erro ao carregar o produto.'
        );
    }


    // ========================================================
    // VERIFICAR LOGIN
    // ========================================================

    function usuarioEstaLogado() {

        const usuarioLogado =
            localStorage.getItem(
                'usuario_logado'
            );


        if (
            !usuarioLogado ||
            usuarioLogado === 'null' ||
            usuarioLogado === 'undefined' ||
            usuarioLogado === ''
        ) {

            return false;
        }


        try {

            const usuario =
                JSON.parse(
                    usuarioLogado
                );


            return !!(
                usuario &&
                usuario.id &&
                usuario.email
            );

        } catch (erro) {

            return false;
        }
    }


    // ========================================================
    // FORMATAR PREÇO
    // ========================================================

    function formatarPreco(valor) {

        return `R$ ${Number(
            valor
        )
            .toFixed(2)
            .replace(
                '.',
                ','
            )}`;
    }


    // ========================================================
    // ATUALIZAR ESTOQUE
    // ========================================================

    function atualizarEstoque(
        quantidade,
        elemento
    ) {

        if (!elemento) {
            return;
        }


        if (quantidade <= 0) {

            elemento.innerHTML = `
                <span
                    class="dot"
                    style="background:#ef4444;"
                >
                </span>
                Fora de estoque
            `;

            return;
        }


        if (quantidade <= 5) {

            elemento.innerHTML = `
                <span
                    class="dot"
                    style="background:#f59e0b;"
                >
                </span>
                Últimas ${quantidade} unidades
            `;

            return;
        }


        elemento.innerHTML = `
            <span class="dot"></span>
            Em estoque
        `;
    }


    // ========================================================
    // MOSTRAR ERRO
    // ========================================================

    function mostrarErroProduto(
        mensagem
    ) {

        const titulo =
            document.getElementById(
                'prod-titulo'
            );

        const descricao =
            document.getElementById(
                'prod-descricao'
            );

        const imagem =
            document.getElementById(
                'prod-img'
            );

        const botaoCarrinho =
            document.querySelector(
                '.btn-carrinho'
            );

        const botaoComprar =
            document.querySelector(
                '.btn-comprar'
            );


        if (titulo) {

            titulo.textContent =
                mensagem;
        }


        if (descricao) {

            descricao.textContent =
                'Volte para a página inicial e tente novamente.';
        }


        if (imagem) {

            imagem.innerHTML = `
                <span style="
                    font-size:4rem;
                ">
                    😕
                </span>
            `;
        }


        if (botaoCarrinho) {

            botaoCarrinho.disabled =
                true;
        }


        if (botaoComprar) {

            botaoComprar.disabled =
                true;
        }
    }


    // ========================================================
    // CARRINHO
    // ========================================================

    function adicionarAoCarrinho(
        produto,
        preco,
        quantidade
    ) {

        if (!usuarioEstaLogado()) {

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
                '❌ Produto inválido para o carrinho:',
                produto
            );

            return false;
        }


        const quantidadeFinal =
            Math.max(
                1,
                Math.min(
                    Number(quantidade) || 1,
                    Number(produto.estoque) || 1
                )
            );


        // ----------------------------------------------------
        // USAR O MÓDULO REAL DO CHECKOUT
        // ----------------------------------------------------

        if (
            typeof CarrinhoCheckoutModule !==
            'undefined' &&
            typeof CarrinhoCheckoutModule.adicionarProduto ===
            'function'
        ) {

            try {

                // Adiciona a primeira unidade.
                const resultado =
                    CarrinhoCheckoutModule.adicionarProduto({
                        id:
                            produto.id,

                        nome:
                            produto.nome,

                        preco:
                            preco,

                        imagem:
                            produto.imagem_url ||
                            '',

                        estoque:
                            produto.estoque,

                        sku:
                            produto.sku ||
                            '',

                        categoria_id:
                            produto.categoria_id ||
                            null
                    });


                if (!resultado) {

                    return false;
                }


                // ------------------------------------------------
                // ADICIONAR UNIDADES EXTRAS
                // ------------------------------------------------

                for (
                    let i = 1;
                    i < quantidadeFinal;
                    i++
                ) {

                    CarrinhoCheckoutModule.alterarQuantidade(
                        produto.id,
                        1
                    );
                }


                atualizarBadgeCarrinho();


                alert(
                    quantidadeFinal > 1
                        ? `${quantidadeFinal} unidades adicionadas ao carrinho! 🛒`
                        : 'Produto adicionado ao carrinho! 🛒'
                );


                return true;


            } catch (erroCarrinho) {

                console.error(
                    '❌ Erro no CarrinhoCheckoutModule:',
                    erroCarrinho
                );
            }
        }


        // ----------------------------------------------------
        // FALLBACK
        // ----------------------------------------------------

        const usuario =
            JSON.parse(
                localStorage.getItem(
                    'usuario_logado'
                )
            );


        const chave =
            usuario &&
            usuario.email
                ? 'carrinho_' +
                  usuario.email
                      .toLowerCase()
                : 'carrinho';


        let carrinho = [];


        try {

            carrinho =
                JSON.parse(
                    localStorage.getItem(
                        chave
                    )
                ) || [];

        } catch (erro) {

            console.warn(
                '⚠️ Carrinho inválido no localStorage.'
            );

            carrinho = [];
        }


        const existente =
            carrinho.find(
                item =>
                    String(item.id) ===
                    String(produto.id)
            );


        if (existente) {

            existente.quantidade =
                Math.min(
                    (
                        Number(
                            existente.quantidade
                        ) || 0
                    ) +
                    quantidadeFinal,

                    Number(
                        produto.estoque
                    ) || quantidadeFinal
                );

        } else {

            carrinho.push({

                id:
                    produto.id,

                nome:
                    produto.nome,

                preco:
                    preco,

                quantidade:
                    quantidadeFinal,

                imagem:
                    produto.imagem_url ||
                    '',

                estoque:
                    produto.estoque,

                sku:
                    produto.sku ||
                    '',

                categoria_id:
                    produto.categoria_id ||
                    null
            });
        }


        localStorage.setItem(
            chave,
            JSON.stringify(
                carrinho
            )
        );


        atualizarBadgeCarrinho();


        alert(
            quantidadeFinal > 1
                ? `${quantidadeFinal} unidades adicionadas ao carrinho! 🛒`
                : 'Produto adicionado ao carrinho! 🛒'
        );


        return true;
    }


    // ========================================================
    // BADGE DO CARRINHO
    // ========================================================

    function atualizarBadgeCarrinho() {

        const badge =
            document.querySelector(
                '.carrinho-badge'
            );


        if (!badge) {
            return;
        }


        if (!usuarioEstaLogado()) {

            badge.textContent =
                '0';

            return;
        }


        const usuario =
            JSON.parse(
                localStorage.getItem(
                    'usuario_logado'
                )
            );


        const chave =
            usuario &&
            usuario.email
                ? 'carrinho_' +
                  usuario.email
                      .toLowerCase()
                : 'carrinho';


        let carrinho = [];


        try {

            carrinho =
                JSON.parse(
                    localStorage.getItem(
                        chave
                    )
                ) || [];

        } catch (erro) {

            carrinho = [];
        }


        const total =
            carrinho.reduce(
                (
                    soma,
                    item
                ) =>
                    soma +
                    (
                        Number(
                            item.quantidade
                        ) || 0
                    ),
                0
            );


        badge.textContent =
            total;
    }


    // ========================================================
    // PRODUTOS RELACIONADOS
    // ========================================================

    async function carregarProdutosRelacionados(
        produtoAtual,
        container,
        supabase
    ) {

        if (!container) {
            return;
        }


        try {

            const {
                data,
                error
            } =
                await supabase
                    .from('produtos')
                    .select(`
                        id,
                        nome,
                        preco,
                        preco_promocional,
                        imagem_url,
                        estoque,
                        categoria_id,
                        categorias (
                            id,
                            nome
                        )
                    `)
                    .eq(
                        'ativo',
                        true
                    )
                    .eq(
                        'categoria_id',
                        produtoAtual.categoria_id
                    )
                    .neq(
                        'id',
                        produtoAtual.id
                    )
                    .limit(4);


            if (error) {

                console.warn(
                    '⚠️ Erro nos produtos relacionados:',
                    error
                );

                return;
            }


            if (
                !data ||
                data.length === 0
            ) {

                container.innerHTML =
                    '';

                return;
            }


            container.innerHTML =
                '';


            data.forEach(
                relacionado => {

                    const preco =
                        Number(
                            relacionado.preco
                        ) || 0;


                    const promocional =
                        Number(
                            relacionado.preco_promocional
                        ) || 0;


                    const precoAtual =
                        promocional > 0 &&
                        promocional < preco
                            ? promocional
                            : preco;


                    const categoriaRelacionado =
                        relacionado.categorias?.nome ||
                        produtoAtual.categorias?.nome ||
                        'Geral';


                    const card =
                        document.createElement(
                            'div'
                        );


                    card.className =
                        'card-produto';


                    card.innerHTML = `

                        <a
                            href="Produtos.html?id=${encodeURIComponent(relacionado.id)}"
                            style="
                                text-decoration:none;
                                color:inherit;
                            "
                        >

                            <div
                                class="card-img-box"
                                style="
                                    padding:0;
                                    overflow:hidden;
                                "
                            >

                                ${
                                    relacionado.imagem_url
                                        ? `
                                            <img
                                                src="${relacionado.imagem_url}"
                                                alt="${relacionado.nome}"
                                                style="
                                                    width:100%;
                                                    height:100%;
                                                    object-fit:cover;
                                                "
                                            >
                                        `
                                        : `
                                            <span
                                                style="
                                                    font-size:2.5rem;
                                                "
                                            >
                                                📦
                                            </span>
                                        `
                                }

                            </div>

                            <div class="card-detalhes">

                                <span class="tag-categoria">
                                    ${categoriaRelacionado}
                                </span>

                                <h3>
                                    ${relacionado.nome}
                                </h3>

                                <span class="preco">
                                    ${formatarPreco(
                                        precoAtual
                                    )}
                                </span>

                            </div>

                        </a>

                    `;


                    container.appendChild(
                        card
                    );
                }
            );


        } catch (erro) {

            console.warn(
                '⚠️ Erro inesperado nos relacionados:',
                erro
            );
        }
    }

});