
// ============================================================
// ZORAVISION - HOME
// Carregamento dos produtos e controle do carrossel
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {

    console.log('🏠 Home iniciada.');

    // ========================================================
    // ELEMENTOS DA HOME
    // ========================================================

    const gridProdutos =
        document.getElementById('grid-produtos-home');

    const contadorProdutos =
        document.getElementById('contador-produtos');


    if (!gridProdutos) {

        console.error(
            '❌ Elemento #grid-produtos-home não encontrado.'
        );

        return;
    }


    // ========================================================
    // CARROSSEL
    // ========================================================

    inicializarCarrossel();


    // ========================================================
    // BUSCAR PRODUTOS
    // ========================================================

    try {

        console.log(
            '🔎 Buscando produtos no Supabase...'
        );


        const { data: produtos, error } =
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
                .eq(
                    'ativo',
                    true
                )
                .order(
                    'created_at',
                    {
                        ascending: false
                    }
                );


        // ====================================================
        // ERRO NA CONSULTA
        // ====================================================

        if (error) {

            console.error(
                '❌ Erro ao buscar produtos:',
                error
            );


            gridProdutos.innerHTML = `
                <div style="
                    grid-column: 1 / -1;
                    text-align: center;
                    padding: 40px 20px;
                ">
                    <p>
                        Não foi possível carregar os produtos.
                    </p>
                </div>
            `;

            return;
        }


        console.log(
            '✅ Produtos recebidos do Supabase:',
            produtos
        );


        // ====================================================
        // NENHUM PRODUTO
        // ====================================================

        if (
            !produtos ||
            produtos.length === 0
        ) {

            gridProdutos.innerHTML = `
                <div style="
                    grid-column: 1 / -1;
                    text-align: center;
                    padding: 40px 20px;
                ">
                    <div style="
                        font-size: 40px;
                        margin-bottom: 10px;
                    ">
                        📦
                    </div>

                    <p>
                        Nenhum produto disponível no momento.
                    </p>
                </div>
            `;


            if (contadorProdutos) {

                contadorProdutos.textContent =
                    '0 itens';
            }


            return;
        }


        // ====================================================
        // CONTADOR DE PRODUTOS
        // ====================================================

        if (contadorProdutos) {

            const quantidade =
                produtos.length;


            contadorProdutos.textContent =
                `${quantidade} ${
                    quantidade === 1
                        ? 'item'
                        : 'itens'
                }`;
        }


        // ====================================================
        // LIMPAR PRODUTOS DE EXEMPLO
        // ====================================================

        gridProdutos.innerHTML = '';


        // ====================================================
        // CRIAR OS CARDS
        // ====================================================

        produtos.forEach(
            produto => {

                // ------------------------------------------------
                // PREÇOS
                // ------------------------------------------------

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


                const percentualDesconto =
                    temPromocao
                        ? Math.round(
                            (
                                (
                                    preco -
                                    precoPromocional
                                ) /
                                preco
                            ) *
                            100
                        )
                        : 0;


                // ------------------------------------------------
                // FORMATAÇÃO DOS PREÇOS
                // ------------------------------------------------

                const precoAtualFormatado =
                    precoAtual
                        .toFixed(2)
                        .replace(
                            '.',
                            ','
                        );


                const precoOriginalFormatado =
                    preco
                        .toFixed(2)
                        .replace(
                            '.',
                            ','
                        );


                // ------------------------------------------------
                // CATEGORIA
                // ------------------------------------------------

                const categoria =
                    produto.categorias?.nome ||
                    'Geral';


                // ------------------------------------------------
                // IMAGEM
                // ------------------------------------------------

                const imagem =
                    produto.imagem_url ||
                    '';


                // ------------------------------------------------
                // VENDAS
                // ------------------------------------------------

                const vendas = 0;


                // =================================================
                // CRIAR CARD
                // =================================================

                const card =
                    document.createElement(
                        'div'
                    );


                card.className =
                    'card-produto';


                card.style.cursor =
                    'pointer';


                card.style.position =
                    'relative';


                // =================================================
                // CLIQUE NO CARD
                // =================================================

                card.addEventListener(
                    'click',
                    evento => {

                        /*
                         * Se o clique foi no botão de adicionar
                         * ou no botão de favorito, não abrir o produto.
                         */

                        if (
                            evento.target.closest(
                                '.btn-adicionar'
                            ) ||
                            evento.target.closest(
                                '.btn-favoritar'
                            )
                        ) {

                            return;
                        }


                        /*
                         * Se o clique foi em qualquer elemento
                         * dentro de um link, deixa o link funcionar.
                         */

                        if (
                            evento.target.closest(
                                'a'
                            )
                        ) {

                            return;
                        }


                        window.location.href =
                            `01-produtos.html?id=${encodeURIComponent(
                                produto.id
                            )}`;
                    }
                );


                // =================================================
                // HTML DO CARD
                // =================================================

                card.innerHTML = `

                    ${
                        temPromocao
                            ? `
                                <div class="badge-desconto">
                                    -${percentualDesconto}%
                                </div>
                              `
                            : ''
                    }


                    ${
                        typeof FavoritosModule !== 'undefined'
                            ? FavoritosModule.botaoHtml(
                                produto.id,
                                `
                                position:absolute;
                                top:8px;
                                right:8px;
                                z-index:2;
                                background:rgba(255,255,255,0.9);
                                border:none;
                                border-radius:50%;
                                width:28px;
                                height:28px;
                                cursor:pointer;
                                font-size:14px;
                                `
                            )
                            : `
                                <button
                                    type="button"
                                    class="btn-favoritar"
                                    data-id="${produto.id}"
                                    aria-label="Favoritar"
                                    style="
                                        position:absolute;
                                        top:8px;
                                        right:8px;
                                        z-index:2;
                                        background:rgba(255,255,255,0.9);
                                        border:none;
                                        border-radius:50%;
                                        width:28px;
                                        height:28px;
                                        cursor:pointer;
                                        font-size:14px;
                                    "
                                >
                                    🤍
                                </button>
                              `
                    }


                    <!-- IMAGEM -->

                    <div
                        class="card-img-box"
                        style="
                            padding:0;
                            overflow:hidden;
                            display:flex;
                            align-items:center;
                            justify-content:center;
                        "
                    >

                        ${
                            imagem
                                ? `
                                    <img
                                        src="${imagem}"
                                        alt="${produto.nome}"
                                        loading="lazy"
                                        style="
                                            width:100%;
                                            height:100%;
                                            object-fit:cover;
                                        "
                                        onerror="
                                            this.style.display='none';
                                            this.parentElement.innerHTML='<span style=\\'font-size:3rem;\\'>📦</span>';
                                        "
                                    >
                                  `
                                : `
                                    <span style="font-size:3rem;">
                                        📦
                                    </span>
                                  `
                        }

                    </div>


                    <!-- INFORMAÇÕES -->

                    <div class="card-detalhes">

                        <div>

                            <span class="tag-categoria">
                                ${categoria}
                            </span>


                            <a
                                href="01-produtos.html?id=${encodeURIComponent(
                                    produto.id
                                )}"
                                style="
                                    text-decoration:none;
                                    color:inherit;
                                "
                            >

                                <h3>
                                    ${produto.nome}
                                </h3>

                            </a>

                        </div>


                        <!-- PREÇO -->

                        <div class="card-rodape-info">

                            <div class="preco-linha">

                                ${
                                    temPromocao
                                        ? `
                                            <span class="preco-antigo">
                                                R$ ${precoOriginalFormatado}
                                            </span>
                                          `
                                        : ''
                                }


                                <span class="preco">
                                    R$ ${precoAtualFormatado}
                                </span>

                            </div>


                            <div class="card-meta-info">

                                <span>
                                    ${vendas} vendidos
                                </span>

                            </div>

                        </div>

                    </div>


                    <!-- BOTÃO CARRINHO -->

                    <button
                        type="button"
                        class="btn-adicionar"
                        data-id="${produto.id}"
                        data-nome="${produto.nome}"
                        data-preco="${precoAtual}"
                        data-imagem="${imagem}"
                    >
                        🛒 Adicionar
                    </button>

                `;


                // ------------------------------------------------
                // ADICIONAR CARD AO GRID
                // ------------------------------------------------

                gridProdutos.appendChild(
                    card
                );


                // =================================================
                // CONFIGURAR BOTÃO ADICIONAR
                // =================================================

                const botaoAdicionar =
                    card.querySelector(
                        '.btn-adicionar'
                    );


                if (botaoAdicionar) {

                    botaoAdicionar.addEventListener(
                        'click',
                        evento => {

                            /*
                             * Impede o clique de subir para
                             * o card.
                             */

                            evento.preventDefault();

                            evento.stopPropagation();


                            // ------------------------------------
                            // VERIFICAR LOGIN
                            // ------------------------------------

                            if (
                                !usuarioEstaLogadoHome()
                            ) {

                                alert(
                                    'Você precisa estar logado para adicionar produtos ao carrinho.'
                                );


                                window.location.href =
                                    'Login.html';


                                return;
                            }


                            // ------------------------------------
                            // VERIFICAR ESTOQUE
                            // ------------------------------------

                            const estoque =
                                Number(
                                    produto.estoque
                                ) || 0;


                            if (
                                estoque <= 0
                            ) {

                                alert(
                                    'Este produto está sem estoque.'
                                );

                                return;
                            }


                            // ------------------------------------
                            // ADICIONAR PRODUTO
                            // ------------------------------------

                            const adicionado =
                                adicionarProdutoHome(
                                    produto,
                                    precoAtual,
                                    1
                                );


                            if (
                                adicionado
                            ) {

                                atualizarBadgeCarrinhoHome();

                            }

                        }
                    );
                }


                // =================================================
                // FAVORITO FALLBACK
                // =================================================

                const botaoFavorito =
                    card.querySelector(
                        '.btn-favoritar'
                    );


                if (
                    botaoFavorito &&
                    typeof FavoritosModule === 'undefined'
                ) {

                    botaoFavorito.addEventListener(
                        'click',
                        evento => {

                            evento.preventDefault();

                            evento.stopPropagation();


                            alert(
                                'Sistema de favoritos ainda não está disponível.'
                            );
                        }
                    );
                }

            }
        );


        // ====================================================
        // ATUALIZAR BADGE
        // ====================================================

        atualizarBadgeCarrinhoHome();


        // ====================================================
        // FINALIZAÇÃO
        // ====================================================

        console.log(
            `🎉 ${produtos.length} produto(s) carregado(s) na Home.`
        );


    } catch (erro) {

        console.error(
            '❌ Erro inesperado ao carregar a Home:',
            erro
        );


        gridProdutos.innerHTML = `
            <div style="
                grid-column: 1 / -1;
                text-align: center;
                padding: 40px 20px;
            ">
                <p>
                    Ocorreu um erro ao carregar os produtos.
                </p>
            </div>
        `;
    }

});


// ============================================================
// VERIFICAR LOGIN
// ============================================================

function usuarioEstaLogadoHome() {

    const usuarioSalvo =
        localStorage.getItem(
            'usuario_logado'
        );


    if (
        !usuarioSalvo ||
        usuarioSalvo === 'null' ||
        usuarioSalvo === 'undefined'
    ) {

        return false;
    }


    try {

        const usuario =
            JSON.parse(
                usuarioSalvo
            );


        return !!(
            usuario &&
            usuario.id &&
            usuario.email
        );


    } catch (erro) {

        console.error(
            '❌ Erro ao verificar usuário:',
            erro
        );

        return false;
    }
}


// ============================================================
// ADICIONAR PRODUTO AO CARRINHO
// ============================================================

function adicionarProdutoHome(
    produto,
    preco,
    quantidade
) {

    if (
        !produto ||
        !produto.id
    ) {

        console.error(
            '❌ Produto inválido:',
            produto
        );

        return false;
    }


    // ========================================================
    // USAR O MÓDULO PRINCIPAL DO CARRINHO
    // ========================================================

    if (
        typeof CarrinhoCheckoutModule !== 'undefined' &&
        typeof CarrinhoCheckoutModule.adicionarProduto ===
            'function'
    ) {

        try {

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

                console.warn(
                    '⚠️ O módulo do carrinho recusou o produto.'
                );

                return false;
            }


            // ------------------------------------------------
            // ADICIONAR UNIDADES EXTRAS
            // ------------------------------------------------

            const quantidadeFinal =
                Math.max(
                    1,
                    Number(quantidade) || 1
                );


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


            alert(
                quantidadeFinal > 1
                    ? `${quantidadeFinal} unidades adicionadas ao carrinho! 🛒`
                    : 'Produto adicionado ao carrinho! 🛒'
            );


            console.log(
                '✅ Produto adicionado pelo CarrinhoCheckoutModule:',
                produto.id
            );


            return true;


        } catch (erro) {

            console.error(
                '❌ Erro no CarrinhoCheckoutModule:',
                erro
            );
        }
    }


    // ========================================================
    // FALLBACK LOCALSTORAGE
    // ========================================================

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
                  .trim()
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


        if (
            !Array.isArray(carrinho)
        ) {

            carrinho = [];
        }


    } catch (erro) {

        console.warn(
            '⚠️ Carrinho inválido no localStorage. Será recriado.'
        );

        carrinho = [];
    }


    const quantidadeFinal =
        Math.max(
            1,
            Math.min(
                Number(quantidade) || 1,
                Number(produto.estoque) || 1
            )
        );


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


    alert(
        quantidadeFinal > 1
            ? `${quantidadeFinal} unidades adicionadas ao carrinho! 🛒`
            : 'Produto adicionado ao carrinho! 🛒'
    );


    console.log(
        '✅ Produto adicionado ao carrinho pelo fallback:',
        produto.id
    );


    return true;
}


// ============================================================
// ATUALIZAR BADGE DO CARRINHO
// ============================================================

function atualizarBadgeCarrinhoHome() {

    const badge =
        document.querySelector(
            '.carrinho-badge'
        );


    if (!badge) {
        return;
    }


    if (
        !usuarioEstaLogadoHome()
    ) {

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
                  .trim()
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


        if (
            !Array.isArray(carrinho)
        ) {

            carrinho = [];
        }


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


// ============================================================
// FUNÇÃO DO CARROSSEL
// ============================================================

function inicializarCarrossel() {

    const trilho =
        document.getElementById(
            'trilho'
        );


    if (!trilho) {

        console.warn(
            '⚠️ Trilho do carrossel não encontrado.'
        );

        return;
    }


    // ========================================================
    // BANNERS DO LOCALSTORAGE
    // ========================================================

    let bannersSalvos = [];


    try {

        bannersSalvos =
            JSON.parse(
                localStorage.getItem(
                    'banners_loja'
                )
            ) || [];


    } catch (erro) {

        console.warn(
            '⚠️ Banners salvos inválidos.'
        );

        bannersSalvos = [];
    }


    const bannersAtivos =
        bannersSalvos
            .filter(
                banner =>
                    banner.ativo !== false
            )
            .sort(
                (a, b) =>
                    (
                        a.ordem ||
                        1
                    ) -
                    (
                        b.ordem ||
                        1
                    )
            );


    const CORES_BANNER = {

        azul:
            'linear-gradient(135deg, #2563eb, #1d4ed8)',

        laranja:
            'linear-gradient(135deg, #d85a30, #b8451f)',

        escuro:
            'linear-gradient(135deg, #0f172a, #334155)'

    };


    // ========================================================
    // SUBSTITUIR BANNERS PADRÃO
    // ========================================================

    if (
        bannersAtivos.length > 0
    ) {

        trilho.innerHTML =
            bannersAtivos
                .map(
                    banner => {

                        const fundo =
                            banner.imagem

                                ? `background-image: url(${banner.imagem}); background-size: cover; background-position: center;`

                                : `background: ${
                                    CORES_BANNER[
                                        banner.cor
                                    ] ||
                                    CORES_BANNER.azul
                                  };`;


                        return `

                            <div
                                class="slide"
                                style="${fundo}"
                            >

                                ${
                                    banner.badge
                                        ? `
                                            <span class="slide-badge">
                                                ${banner.badge}
                                            </span>
                                          `
                                        : ''
                                }


                                <h2 class="slide-titulo">
                                    ${banner.titulo}
                                </h2>


                                ${
                                    banner.subtitulo
                                        ? `
                                            <p class="slide-subtitulo">
                                                ${banner.subtitulo}
                                            </p>
                                          `
                                        : ''
                                }


                                ${
                                    banner.textoLink
                                        ? `
                                            <a
                                                href="${
                                                    banner.linkDestino ||
                                                    '#'
                                                }"
                                                class="slide-link"
                                            >

                                                ${banner.textoLink}

                                            </a>
                                          `
                                        : ''
                                }

                            </div>

                        `;

                    }
                )
                .join('');

    }


    // ========================================================
    // CONFIGURAÇÃO DO CARROSSEL
    // ========================================================

    const pontosContainer =
        document.getElementById(
            'pontos'
        );


    const totalSlides =
        document.querySelectorAll(
            '#carrossel .slide'
        ).length;


    if (
        !pontosContainer ||
        totalSlides === 0
    ) {

        console.warn(
            '⚠️ Nenhum slide encontrado.'
        );

        return;
    }


    let indiceAtual = 0;

    let autoplayInterval;


    // ========================================================
    // CRIAR PONTOS
    // ========================================================

    pontosContainer.innerHTML =
        '';


    for (
        let i = 0;
        i < totalSlides;
        i++
    ) {

        const ponto =
            document.createElement(
                'button'
            );


        ponto.className =
            'ponto' +
            (
                i === 0
                    ? ' ativo'
                    : ''
            );


        ponto.setAttribute(
            'aria-label',
            `Ir para o slide ${i + 1}`
        );


        ponto.addEventListener(
            'click',
            () =>
                irParaSlide(i)
        );


        pontosContainer.appendChild(
            ponto
        );
    }


    // ========================================================
    // IR PARA SLIDE
    // ========================================================

    function irParaSlide(indice) {

        indiceAtual =
            (
                indice +
                totalSlides
            ) %
            totalSlides;


        trilho.style.transform =
            `translateX(-${indiceAtual * 100}%)`;


        document
            .querySelectorAll(
                '#pontos .ponto'
            )
            .forEach(
                (
                    ponto,
                    indicePonto
                ) => {

                    ponto.classList.toggle(
                        'ativo',
                        indicePonto ===
                        indiceAtual
                    );

                }
            );


        reiniciarAutoplay();
    }


    // ========================================================
    // BOTÃO PRÓXIMO
    // ========================================================

    const btnProximo =
        document.getElementById(
            'btnProximo'
        );


    if (btnProximo) {

        btnProximo.addEventListener(
            'click',
            () =>
                irParaSlide(
                    indiceAtual + 1
                )
        );
    }


    // ========================================================
    // BOTÃO ANTERIOR
    // ========================================================

    const btnAnterior =
        document.getElementById(
            'btnAnterior'
        );


    if (btnAnterior) {

        btnAnterior.addEventListener(
            'click',
            () =>
                irParaSlide(
                    indiceAtual - 1
                )
        );
    }


    // ========================================================
    // AUTOPLAY
    // ========================================================

    function iniciarAutoplay() {

        if (
            totalSlides <= 1
        ) {

            return;
        }


        autoplayInterval =
            setInterval(
                () =>
                    irParaSlide(
                        indiceAtual + 1
                    ),
                4000
            );
    }


    function reiniciarAutoplay() {

        clearInterval(
            autoplayInterval
        );


        iniciarAutoplay();
    }


    // ========================================================
    // SWIPE NO CELULAR
    // ========================================================

    let posicaoInicial =
        null;


    trilho.addEventListener(
        'touchstart',
        evento => {

            posicaoInicial =
                evento.touches[0].clientX;


            clearInterval(
                autoplayInterval
            );
        }
    );


    trilho.addEventListener(
        'touchend',
        evento => {

            if (
                posicaoInicial ===
                null
            ) {

                return;
            }


            const posicaoFinal =
                evento.changedTouches[0].clientX;


            const diferenca =
                posicaoInicial -
                posicaoFinal;


            if (
                diferenca > 40
            ) {

                irParaSlide(
                    indiceAtual + 1
                );

            }
            else if (
                diferenca < -40
            ) {

                irParaSlide(
                    indiceAtual - 1
                );

            }
            else {

                reiniciarAutoplay();
            }


            posicaoInicial =
                null;
        }
    );


    // ========================================================
    // INICIAR
    // ========================================================

    iniciarAutoplay();


    console.log(
        '🎠 Carrossel iniciado.'
    );
}
