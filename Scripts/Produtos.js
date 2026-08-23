// ============================================================
// ZORAVISION - DETALHES DO PRODUTO
// Busca o produto diretamente do Supabase
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {

    console.log('📦 Página de produto iniciada.');

    // ========================================================
    // PEGAR ID DO PRODUTO NA URL
    // ========================================================

    const parametros = new URLSearchParams(window.location.search);

    const produtoId = parametros.get('id');

    console.log('🔎 ID do produto:', produtoId);


    if (!produtoId) {

        console.error('❌ Nenhum ID de produto foi informado.');

        mostrarErroProduto(
            'Produto não encontrado.'
        );

        return;
    }


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
    // BUSCAR PRODUTO
    // ========================================================

    try {

        console.log(
            '🔎 Buscando produto no Supabase...'
        );


        const { data: produto, error } =
            await supabaseClient

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

                .eq('id', produtoId)

                .eq('ativo', true)

                .single();


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
        // DADOS
        // ====================================================

        const preco =
            Number(produto.preco) || 0;

        const precoPromocional =
            Number(produto.preco_promocional) || 0;

        const temPromocao =
            precoPromocional > 0 &&
            precoPromocional < preco;

        const precoAtual =
            temPromocao
                ? precoPromocional
                : preco;


        const estoque =
            Number(produto.estoque) || 0;


        const categoria =
            produto.categorias?.nome ||
            'Geral';


        // ====================================================
        // TÍTULO
        // ====================================================

        tituloProduto.textContent =
            produto.nome;


        // ====================================================
        // TÍTULO DA ABA
        // ====================================================

        document.title =
            `${produto.nome} - ZoraVision`;


        // ====================================================
        // IMAGEM
        // ====================================================

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


        // ====================================================
        // PREÇO
        // ====================================================

        precoProduto.textContent =
            formatarPreco(precoAtual);


        if (temPromocao) {

            precoAntigo.textContent =
                formatarPreco(preco);

            precoAntigo.style.display =
                'block';

        } else {

            precoAntigo.style.display =
                'none';
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

            inputQuantidade.min = 1;

            inputQuantidade.max =
                Math.max(estoque, 1);

            inputQuantidade.value =
                estoque > 0 ? 1 : 0;
        }


        // ====================================================
        // DESCRIÇÃO
        // ====================================================

        descricaoProduto.textContent =
            produto.descricao ||
            'Este produto ainda não possui uma descrição.';


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
            (botao, indice) => {

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


                        // BOTÃO MENOS
                        if (indice === 0) {

                            quantidade =
                                Math.max(
                                    1,
                                    quantidade - 1
                                );
                        }


                        // BOTÃO MAIS
                        else {

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


            // Se o módulo de favoritos existir,
            // tenta inicializar o botão.

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


                    window.location.href =
                        'Checkout.html';
                }
            );
        }


        // ====================================================
        // PRODUTOS RELACIONADOS
        // ====================================================

        carregarProdutosRelacionados(
            produto,
            produtosRelacionados
        );


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
    // FUNÇÕES
    // ========================================================


    function formatarPreco(valor) {

        return `R$ ${Number(valor)
            .toFixed(2)
            .replace('.', ',')}`;
    }


    function atualizarEstoque(
        quantidade,
        elemento
    ) {

        if (!elemento) {
            return;
        }


        if (quantidade <= 0) {

            elemento.innerHTML = `
                <span class="dot"
                    style="background:#ef4444;">
                </span>
                Fora de estoque
            `;

            return;
        }


        if (quantidade <= 5) {

            elemento.innerHTML = `
                <span class="dot"
                    style="background:#f59e0b;">
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


    function mostrarErroProduto(
        mensagem
    ) {

        if (tituloProduto) {

            tituloProduto.textContent =
                mensagem;
        }


        if (descricaoProduto) {

            descricaoProduto.textContent =
                'Volte para a página inicial e tente novamente.';
        }


        if (imagemProduto) {

            imagemProduto.innerHTML = `
                <span style="
                    font-size:4rem;
                ">
                    😕
                </span>
            `;
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

        const item = {

            id: produto.id,

            nome: produto.nome,

            preco: preco,

            quantidade: quantidade,

            imagem: produto.imagem_url || '',

            estoque: produto.estoque
        };


        // ----------------------------------------------------
        // Tentar utilizar o módulo existente
        // ----------------------------------------------------

        if (
            typeof CarrinhoModule !==
            'undefined'
        ) {

            try {

                if (
                    typeof CarrinhoModule.adicionar ===
                    'function'
                ) {

                    CarrinhoModule.adicionar(
                        item
                    );

                    alert(
                        'Produto adicionado ao carrinho! 🛒'
                    );

                    return;
                }

            } catch (erroCarrinho) {

                console.warn(
                    '⚠️ Erro no módulo do carrinho:',
                    erroCarrinho
                );
            }
        }


        // ----------------------------------------------------
        // Fallback usando localStorage
        // ----------------------------------------------------

        let carrinho =
            JSON.parse(
                localStorage.getItem(
                    'carrinho'
                )
            ) || [];


        const existente =
            carrinho.find(
                itemCarrinho =>
                    itemCarrinho.id === produto.id
            );


        if (existente) {

            existente.quantidade +=
                quantidade;

        } else {

            carrinho.push(item);
        }


        localStorage.setItem(
            'carrinho',
            JSON.stringify(carrinho)
        );


        atualizarBadgeCarrinho();


        alert(
            'Produto adicionado ao carrinho! 🛒'
        );
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


        const carrinho =
            JSON.parse(
                localStorage.getItem(
                    'carrinho'
                )
            ) || [];


        const total =
            carrinho.reduce(
                (soma, item) =>
                    soma +
                    (
                        Number(item.quantidade) ||
                        0
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
        container
    ) {

        if (!container) {
            return;
        }


        try {

            const { data, error } =
                await supabaseClient

                    .from('produtos')

                    .select(`
                        id,
                        nome,
                        preco,
                        preco_promocional,
                        imagem_url,
                        estoque,
                        categoria_id
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


            if (!data || data.length === 0) {

                container.innerHTML = '';

                return;
            }


            container.innerHTML = '';


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


                    const card =
                        document.createElement(
                            'div'
                        );


                    card.className =
                        'card-produto';


                    card.innerHTML = `

                        <a
                            href="Produtos.html?id=${relacionado.id}"
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
                                    ${produtoAtual.categorias?.nome || 'Geral'}
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