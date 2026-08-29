// ============================================================
// ZORAVISION - HOME
// Produtos + Carrossel
// ============================================================
// Estrutura preparada para muitos produtos:
//
// - Carregamento inicial limitado
// - Paginação através de range()
// - Botão "Carregar mais"
// - Imagens com lazy loading
// - Busca somente dos campos necessários
// - Compatível com FavoritosModule
// - Compatível com CarrinhoCheckoutModule
// - Categorias carregadas separadamente
// ============================================================


// ============================================================
// CONFIGURAÇÃO
// ============================================================

const HOME_PRODUTOS_POR_PAGINA = 12;


// ============================================================
// VARIÁVEIS DA HOME
// ============================================================

let homePaginaAtual = 0;

let homeCarregandoProdutos = false;

let homeTodosProdutosCarregados = false;


// ============================================================
// INICIALIZAÇÃO
// ============================================================

document.addEventListener(
    'DOMContentLoaded',
    async () => {

        console.log(
            '🏠 Home iniciada.'
        );


        // ====================================================
        // ELEMENTOS
        // ====================================================

        const gridProdutos =
            document.getElementById(
                'grid-produtos-home'
            );


        const contadorProdutos =
            document.getElementById(
                'contador-produtos'
            );


        if (!gridProdutos) {

            console.error(
                '❌ Elemento #grid-produtos-home não encontrado.'
            );

            return;
        }


        // ====================================================
        // VERIFICAR SUPABASE
        // ====================================================

        const supabaseAtual =
            window.supabaseClient ||
            window._supabase;


        if (!supabaseAtual) {

            console.error(
                '❌ Supabase não está disponível na Home.'
            );


            gridProdutos.innerHTML = `
                <div style="
                    grid-column: 1 / -1;
                    text-align:center;
                    padding:40px 20px;
                ">
                    <p>
                        Não foi possível conectar ao sistema.
                    </p>
                </div>
            `;

            return;
        }


        // ====================================================
        // CARROSSEL
        // ====================================================

        inicializarCarrossel();


        // ====================================================
        // PRIMEIRA CARGA
        // ====================================================

        await carregarMaisProdutosHome(
            supabaseAtual,
            gridProdutos,
            contadorProdutos
        );

    }
);


// ============================================================
// CARREGAR MAIS PRODUTOS
// ============================================================

async function carregarMaisProdutosHome(
    supabaseAtual,
    gridProdutos,
    contadorProdutos
) {

    if (
        homeCarregandoProdutos ||
        homeTodosProdutosCarregados
    ) {

        return;
    }


    homeCarregandoProdutos =
        true;


    // ========================================================
    // BOTÃO
    // ========================================================

    const botaoCarregarMais =
        document.getElementById(
            'btn-carregar-mais-produtos'
        );


    if (botaoCarregarMais) {

        botaoCarregarMais.disabled =
            true;

        botaoCarregarMais.textContent =
            'Carregando...';
    }


    try {

        console.log(
            `🔎 Buscando produtos da página ${homePaginaAtual + 1}...`
        );


        // ====================================================
        // CALCULAR RANGE
        // ====================================================

        const inicio =
            homePaginaAtual *
            HOME_PRODUTOS_POR_PAGINA;


        const fim =
            inicio +
            HOME_PRODUTOS_POR_PAGINA -
            1;


        // ====================================================
        // BUSCAR PRODUTOS
        // ====================================================

        const {
            data: produtos,
            error
        } =
            await supabaseAtual
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
                    categoria_id
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
                )
                .range(
                    inicio,
                    fim
                );


        // ====================================================
        // ERRO PRODUTOS
        // ====================================================

        if (error) {

            console.error(
                '❌ Erro ao buscar produtos:',
                error
            );


            mostrarErroProdutosHome(
                gridProdutos
            );


            return;
        }


        console.log(
            `✅ ${produtos?.length || 0} produto(s) recebidos.`
        );


        // ====================================================
        // NENHUM PRODUTO
        // ====================================================

        if (
            !produtos ||
            produtos.length === 0
        ) {

            homeTodosProdutosCarregados =
                true;


            if (
                homePaginaAtual === 0
            ) {

                mostrarNenhumProdutoHome(
                    gridProdutos
                );

            }


            removerBotaoCarregarMais();


            atualizarContadorProdutosHome(
                contadorProdutos,
                0
            );


            return;
        }


        // ====================================================
        // BUSCAR CATEGORIAS
        // ====================================================

        const categoriaIds =
            [
                ...new Set(
                    produtos
                        .map(
                            produto =>
                                produto.categoria_id
                        )
                        .filter(
                            categoriaId =>
                                categoriaId
                        )
                )
            ];


        let categorias =
            [];


        if (
            categoriaIds.length > 0
        ) {

            const {
                data: categoriasRecebidas,
                error: erroCategorias
            } =
                await supabaseAtual
                    .from('categorias')
                    .select(`
                        id,
                        nome
                    `)
                    .in(
                        'id',
                        categoriaIds
                    )
                    .eq(
                        'ativo',
                        true
                    );


            if (erroCategorias) {

                console.error(
                    '❌ Erro ao buscar categorias:',
                    erroCategorias
                );

            }
            else {

                categorias =
                    categoriasRecebidas || [];

            }

        }


        // ====================================================
        // MAPA DE CATEGORIAS
        // ====================================================

        const mapaCategorias =
            new Map();


        categorias.forEach(
            categoria => {

                mapaCategorias.set(
                    String(
                        categoria.id
                    ),
                    categoria.nome
                );

            }
        );


        // ====================================================
        // ADICIONAR CATEGORIA AOS PRODUTOS
        // ====================================================

        produtos.forEach(
            produto => {

                const nomeCategoria =
                    mapaCategorias.get(
                        String(
                            produto.categoria_id
                        )
                    );


                produto.categorias =
                    nomeCategoria
                        ? {
                            id:
                                produto.categoria_id,

                            nome:
                                nomeCategoria
                        }
                        : null;

            }
        );


        // ====================================================
        // CRIAR CARDS
        // ====================================================

        produtos.forEach(
            produto => {

                criarCardProdutoHome(
                    produto,
                    gridProdutos
                );

            }
        );


        // ====================================================
        // ATUALIZAR PÁGINA
        // ====================================================

        homePaginaAtual++;


        // ====================================================
        // VERIFICAR SE EXISTEM MAIS
        // ====================================================

        if (
            produtos.length <
            HOME_PRODUTOS_POR_PAGINA
        ) {

            homeTodosProdutosCarregados =
                true;


            removerBotaoCarregarMais();

        }
        else {

            criarOuAtualizarBotaoCarregarMais(
                supabaseAtual,
                gridProdutos,
                contadorProdutos
            );

        }


        // ====================================================
        // CONTADOR
        // ====================================================

        atualizarContadorProdutosHome(
            contadorProdutos
        );


        // ====================================================
        // BADGE
        // ====================================================

        atualizarBadgeCarrinhoHome();


        console.log(
            '🎉 Produtos carregados na Home.'
        );


    }
    catch (erro) {

        console.error(
            '❌ Erro inesperado ao carregar produtos:',
            erro
        );


        mostrarErroProdutosHome(
            gridProdutos
        );

    }
    finally {

        homeCarregandoProdutos =
            false;


        const botao =
            document.getElementById(
                'btn-carregar-mais-produtos'
            );


        if (botao) {

            botao.disabled =
                false;

            botao.textContent =
                'Carregar mais produtos';
        }

    }
}


// ============================================================
// CRIAR CARD DO PRODUTO
// ============================================================

function criarCardProdutoHome(
    produto,
    gridProdutos
) {

    // ========================================================
    // PREÇOS
    // ========================================================

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


    // ========================================================
    // FORMATAÇÃO
    // ========================================================

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


    // ========================================================
    // CATEGORIA
    // ========================================================

    const categoria =
        produto.categorias?.nome ||
        'Geral';


    // ========================================================
    // IMAGEM
    // ========================================================

    const imagem =
        produto.imagem_url ||
        '';


    // ========================================================
    // VENDAS
    // ========================================================

    const vendas =
        0;


    // ========================================================
    // CARD
    // ========================================================

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


    // ========================================================
    // CLIQUE NO CARD
    // ========================================================

    card.addEventListener(
        'click',
        evento => {

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


    // ========================================================
    // HTML
    // ========================================================

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
                            decoding="async"
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


    // ========================================================
    // ADICIONAR AO GRID
    // ========================================================

    gridProdutos.appendChild(
        card
    );


    // ========================================================
    // BOTÃO ADICIONAR
    // ========================================================

    const botaoAdicionar =
        card.querySelector(
            '.btn-adicionar'
        );


    if (botaoAdicionar) {

        botaoAdicionar.addEventListener(
            'click',
            evento => {

                evento.preventDefault();

                evento.stopPropagation();


                // ============================================
                // LOGIN
                // ============================================

                if (
                    !usuarioEstaLogadoHome()
                ) {

                    alert(
                        'Você precisa estar logado para adicionar produtos ao carrinho.'
                    );


                    window.location.href =
                        '02-Login.html';


                    return;
                }


                // ============================================
                // ESTOQUE
                // ============================================

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


                // ============================================
                // ADICIONAR
                // ============================================

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


    // ========================================================
    // FAVORITO FALLBACK
    // ========================================================

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


// ============================================================
// BOTÃO CARREGAR MAIS
// ============================================================

function criarOuAtualizarBotaoCarregarMais(
    supabaseAtual,
    gridProdutos,
    contadorProdutos
) {

    let botao =
        document.getElementById(
            'btn-carregar-mais-produtos'
        );


    if (!botao) {

        botao =
            document.createElement(
                'button'
            );


        botao.id =
            'btn-carregar-mais-produtos';


        botao.type =
            'button';


        botao.textContent =
            'Carregar mais produtos';


        botao.style.display =
            'block';


        botao.style.margin =
            '30px auto';


        botao.style.padding =
            '12px 24px';


        botao.style.border =
            'none';


        botao.style.borderRadius =
            '8px';


        botao.style.cursor =
            'pointer';


        botao.style.fontSize =
            '16px';


        botao.style.fontWeight =
            '600';


        botao.style.background =
            '#111827';


        botao.style.color =
            '#ffffff';


        botao.addEventListener(
            'click',
            () => {

                carregarMaisProdutosHome(
                    supabaseAtual,
                    gridProdutos,
                    contadorProdutos
                );

            }
        );


        gridProdutos.parentElement.appendChild(
            botao
        );

    }

}


// ============================================================
// REMOVER BOTÃO
// ============================================================

function removerBotaoCarregarMais() {

    const botao =
        document.getElementById(
            'btn-carregar-mais-produtos'
        );


    if (botao) {

        botao.remove();

    }

}


// ============================================================
// CONTADOR
// ============================================================

function atualizarContadorProdutosHome(
    contadorProdutos,
    quantidadeAtual = null
) {

    if (!contadorProdutos) {

        return;
    }


    const cards =
        document.querySelectorAll(
            '#grid-produtos-home .card-produto'
        );


    const quantidade =
        quantidadeAtual !== null
            ? quantidadeAtual
            : cards.length;


    contadorProdutos.textContent =
        `${quantidade} ${
            quantidade === 1
                ? 'item'
                : 'itens'
        }`;

}


// ============================================================
// NENHUM PRODUTO
// ============================================================

function mostrarNenhumProdutoHome(
    gridProdutos
) {

    gridProdutos.innerHTML = `

        <div style="
            grid-column:1 / -1;
            text-align:center;
            padding:40px 20px;
        ">

            <div style="
                font-size:40px;
                margin-bottom:10px;
            ">
                📦
            </div>

            <p>
                Nenhum produto disponível no momento.
            </p>

        </div>

    `;

}


// ============================================================
// ERRO
// ============================================================

function mostrarErroProdutosHome(
    gridProdutos
) {

    gridProdutos.innerHTML = `

        <div style="
            grid-column:1 / -1;
            text-align:center;
            padding:40px 20px;
        ">

            <p>
                Não foi possível carregar os produtos.
            </p>

            <button
                type="button"
                onclick="location.reload()"
                style="
                    margin-top:15px;
                    padding:10px 18px;
                    border:none;
                    border-radius:8px;
                    cursor:pointer;
                "
            >
                Tentar novamente
            </button>

        </div>

    `;

}


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


    }
    catch (erro) {

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
    // MÓDULO PRINCIPAL
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


            const quantidadeFinal =
                Math.max(
                    1,
                    Number(
                        quantidade
                    ) || 1
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

        }
        catch (erro) {

            console.error(
                '❌ Erro no CarrinhoCheckoutModule:',
                erro
            );

        }

    }


    // ========================================================
    // FALLBACK LOCALSTORAGE
    // ========================================================

    let usuario = null;


    try {

        usuario =
            JSON.parse(
                localStorage.getItem(
                    'usuario_logado'
                )
            );

    }
    catch (erro) {

        usuario =
            null;

    }


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
            !Array.isArray(
                carrinho
            )
        ) {

            carrinho = [];

        }

    }
    catch (erro) {

        console.warn(
            '⚠️ Carrinho inválido no localStorage. Será recriado.'
        );


        carrinho = [];

    }


    const quantidadeFinal =
        Math.max(
            1,
            Math.min(
                Number(
                    quantidade
                ) || 1,
                Number(
                    produto.estoque
                ) || 1
            )
        );


    const existente =
        carrinho.find(
            item =>
                String(
                    item.id
                ) ===
                String(
                    produto.id
                )
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
                ) ||
                quantidadeFinal

            );

    }
    else {

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


    let usuario = null;


    try {

        usuario =
            JSON.parse(
                localStorage.getItem(
                    'usuario_logado'
                )
            );

    }
    catch (erro) {

        usuario =
            null;

    }


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
            !Array.isArray(
                carrinho
            )
        ) {

            carrinho = [];

        }

    }
    catch (erro) {

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
// CARROSSEL
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
    // BANNERS
    // ========================================================

    let bannersSalvos = [];


    try {

        bannersSalvos =
            JSON.parse(
                localStorage.getItem(
                    'banners_loja'
                )
            ) || [];

    }
    catch (erro) {

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
                (
                    a,
                    b
                ) =>
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
    // BANNERS PERSONALIZADOS
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
                                ? `background-image:url(${banner.imagem});background-size:cover;background-position:center;`
                                : `background:${CORES_BANNER[banner.cor] || CORES_BANNER.azul};`;


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
    // ELEMENTOS
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


    let indiceAtual =
        0;


    let autoplayInterval;


    // ========================================================
    // PONTOS
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

    function irParaSlide(
        indice
    ) {

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
    // PRÓXIMO
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
    // ANTERIOR
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
    // SWIPE
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