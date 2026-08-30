/* ============================================================
ZORAVISION - HOME
Produtos + Carrossel
====================

Responsabilidades:

* Carregar produtos do Supabase
* Paginação de produtos
* Categorias
* Cards de produtos
* Carrinho
* Favoritos
* Badge do carrinho
* Carrossel
* Banners personalizados do Supabase
* Imagem de fundo dos banners
* Overlay automático
  ============================================================ */

/* ============================================================
CONFIGURAÇÃO
============================================================ */

const HOME_PRODUTOS_POR_PAGINA = 12;

/* ============================================================
VARIÁVEIS
============================================================ */

let homePaginaAtual = 0;

let homeCarregandoProdutos = false;

let homeTodosProdutosCarregados = false;

/* ============================================================
INICIALIZAÇÃO
============================================================ */

document.addEventListener(
'DOMContentLoaded',
async function () {


    console.log('🏠 ZoraVision Home iniciada.');

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
            '❌ #grid-produtos-home não encontrado.'
        );

        return;
    }


    /* ====================================================
       SUPABASE
       ==================================================== */

    const supabaseAtual =
        window.supabaseClient ||
        window._supabase;

    if (!supabaseAtual) {

        console.error(
            '❌ Supabase não está disponível.'
        );

        gridProdutos.innerHTML = `
            <div style="
                grid-column:1/-1;
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


    console.log(
        '✅ Supabase disponível na Home.'
    );


    /* ====================================================
       CARROSSEL
       ==================================================== */

    await inicializarCarrossel(
        supabaseAtual
    );


    /* ====================================================
       PRODUTOS
       ==================================================== */

    await carregarMaisProdutosHome(
        supabaseAtual,
        gridProdutos,
        contadorProdutos
    );


    /* ====================================================
       BADGE
       ==================================================== */

    atualizarBadgeCarrinhoHome();

}


);

/* ============================================================
CARREGAR PRODUTOS
============================================================ */

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

homeCarregandoProdutos = true;


const botaoCarregarMais =
    document.getElementById(
        'btn-carregar-mais-produtos'
    );


if (botaoCarregarMais) {

    botaoCarregarMais.disabled = true;

    botaoCarregarMais.textContent =
        'Carregando...';

}


try {

    const inicio =
        homePaginaAtual *
        HOME_PRODUTOS_POR_PAGINA;

    const fim =
        inicio +
        HOME_PRODUTOS_POR_PAGINA -
        1;


    console.log(
        '🔎 Buscando produtos:',
        inicio,
        fim
    );


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
                categoria_id,
                created_at
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


    if (
        !produtos ||
        produtos.length === 0
    ) {

        homeTodosProdutosCarregados = true;


        if (
            homePaginaAtual === 0
        ) {

            mostrarNenhumProdutoHome(
                gridProdutos
            );

        }


        removerBotaoCarregarMais();


        atualizarContadorProdutosHome(
            contadorProdutos
        );


        return;
    }


    console.log(
        `✅ ${produtos.length} produto(s) carregado(s).`
    );


    /* ====================================================
       CATEGORIAS
       ==================================================== */

    const categoriaIds =
        [
            ...new Set(
                produtos
                    .map(
                        produto =>
                            produto.categoria_id
                    )
                    .filter(
                        id => id
                    )
            )
        ];


    let categorias = [];


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


    /* ====================================================
       MAPA CATEGORIAS
       ==================================================== */

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


    /* ====================================================
       ADICIONAR CATEGORIA
       ==================================================== */

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


    /* ====================================================
       CRIAR CARDS
       ==================================================== */

    produtos.forEach(
        produto => {

            criarCardProdutoHome(
                produto,
                gridProdutos
            );

        }
    );


    homePaginaAtual++;


    /* ====================================================
       MAIS PRODUTOS?
       ==================================================== */

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


    /* ====================================================
       CONTADOR
       ==================================================== */

    atualizarContadorProdutosHome(
        contadorProdutos
    );


    atualizarBadgeCarrinhoHome();

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

    homeCarregandoProdutos = false;


    const botao =
        document.getElementById(
            'btn-carregar-mais-produtos'
        );


    if (botao) {

        botao.disabled = false;

        botao.textContent =
            'Carregar mais produtos';

    }

}


}

/* ============================================================
CARD PRODUTO
============================================================ */

function criarCardProdutoHome(
produto,
gridProdutos
) {

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


const categoria =
    produto.categorias?.nome ||
    'Geral';


const imagem =
    produto.imagem_url ||
    '';


const vendas = 0;


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


/* ========================================================
   CLIQUE
   ======================================================== */

card.addEventListener(
    'click',
    function (evento) {

        if (
            evento.target.closest(
                '.btn-adicionar'
            )
        ) {

            return;
        }


        if (
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


/* ========================================================
   FAVORITO
   ======================================================== */

let favoritoHtml = '';


if (
    typeof FavoritosModule !== 'undefined'
) {

    favoritoHtml =
        FavoritosModule.botaoHtml(
            produto.id,
            `
            position:absolute;
            top:8px;
            right:8px;
            z-index:5;
            background:rgba(255,255,255,0.9);
            border:none;
            border-radius:50%;
            width:28px;
            height:28px;
            cursor:pointer;
            font-size:14px;
            `
        );

}
else {

    favoritoHtml = `
        <button
            type="button"
            class="btn-favoritar"
            data-id="${produto.id}"
            aria-label="Favoritar"
            style="
                position:absolute;
                top:8px;
                right:8px;
                z-index:5;
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
    `;

}


/* ========================================================
   HTML
   ======================================================== */

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


    ${favoritoHtml}


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
                        alt="${escaparHTMLHome(produto.nome)}"
                        loading="lazy"
                        decoding="async"
                        style="
                            width:100%;
                            height:100%;
                            object-fit:cover;
                        "
                        onerror="
                            this.style.display='none';
                            this.parentElement.innerHTML='<span style=&quot;font-size:3rem;&quot;>📦</span>';
                        "
                    >
                `
                : `
                    <span
                        style="
                            font-size:3rem;
                        "
                    >
                        📦
                    </span>
                `
        }

    </div>


    <div class="card-detalhes">

        <div>

            <span class="tag-categoria">
                ${escaparHTMLHome(categoria)}
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
                    ${escaparHTMLHome(produto.nome)}
                </h3>

            </a>

        </div>


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


    <button
        type="button"
        class="btn-adicionar"
        data-id="${produto.id}"
    >
        🛒 Adicionar
    </button>

`;


gridProdutos.appendChild(
    card
);


/* ========================================================
   BOTÃO CARRINHO
   ======================================================== */

const botaoAdicionar =
    card.querySelector(
        '.btn-adicionar'
    );


if (botaoAdicionar) {

    botaoAdicionar.addEventListener(
        'click',
        function (evento) {

            evento.preventDefault();

            evento.stopPropagation();


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


/* ========================================================
   FAVORITO FALLBACK
   ======================================================== */

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
        function (evento) {

            evento.preventDefault();

            evento.stopPropagation();

            alert(
                'Sistema de favoritos ainda não está disponível.'
            );

        }
    );

}


}

/* ============================================================
BOTÃO CARREGAR MAIS
============================================================ */

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
        function () {

            carregarMaisProdutosHome(
                supabaseAtual,
                gridProdutos,
                contadorProdutos
            );

        }
    );


    if (
        gridProdutos.parentElement
    ) {

        gridProdutos.parentElement.appendChild(
            botao
        );

    }

}


}

/* ============================================================
REMOVER BOTÃO
============================================================ */

function removerBotaoCarregarMais() {


const botao =
    document.getElementById(
        'btn-carregar-mais-produtos'
    );


if (botao) {

    botao.remove();

}


}

/* ============================================================
CONTADOR
============================================================ */

function atualizarContadorProdutosHome(
contadorProdutos
) {


if (!contadorProdutos) {

    return;
}


const cards =
    document.querySelectorAll(
        '#grid-produtos-home .card-produto'
    );


const quantidade =
    cards.length;


contadorProdutos.textContent =
    `${quantidade} ${
        quantidade === 1
            ? 'item'
            : 'itens'
    }`;


}

/* ============================================================
NENHUM PRODUTO
============================================================ */

function mostrarNenhumProdutoHome(
gridProdutos
) {


gridProdutos.innerHTML = `

    <div
        style="
            grid-column:1/-1;
            text-align:center;
            padding:40px 20px;
        "
    >

        <div
            style="
                font-size:40px;
                margin-bottom:10px;
            "
        >
            📦
        </div>

        <p>
            Nenhum produto disponível no momento.
        </p>

    </div>

`;


}

/* ============================================================
ERRO
============================================================ */

function mostrarErroProdutosHome(
gridProdutos
) {


gridProdutos.innerHTML = `

    <div
        style="
            grid-column:1/-1;
            text-align:center;
            padding:40px 20px;
        "
    >

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

/* ============================================================
LOGIN
============================================================ */

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

/* ============================================================
ADICIONAR PRODUTO
============================================================ */

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


/* ========================================================
   CARRINHO PRINCIPAL
   ======================================================== */

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


        return true;

    }
    catch (erro) {

        console.error(
            '❌ Erro no carrinho:',
            erro
        );

    }

}


/* ========================================================
   FALLBACK
   ======================================================== */

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

    usuario = null;

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


return true;


}

/* ============================================================
BADGE CARRINHO
============================================================ */

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

    usuario = null;

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
        function (
            soma,
            item
        ) {

            return soma +
                (
                    Number(
                        item.quantidade
                    ) || 0
                );

        },
        0
    );


badge.textContent =
    total;


}

/* ============================================================
CARROSSEL
============================================================ */

async function inicializarCarrossel(
supabaseAtual
) {


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


/* ========================================================
   BUSCAR BANNERS DO SUPABASE
   ======================================================== */

console.log(
    '🔎 Buscando banners do Supabase...'
);


let banners = [];


try {

    const {
        data,
        error
    } =
        await supabaseAtual
            .from('banners')
            .select(`
                id,
                titulo,
                descricao,
                imagem_url,
                link_url,
                ordem,
                ativo,
                created_at,
                updated_at
            `)
            .eq(
                'ativo',
                true
            )
            .order(
                'ordem',
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(
            '❌ Erro ao buscar banners do Supabase:',
            error
        );

        console.log(
            '🎠 Mantendo banners originais do HTML.'
        );

    }
    else {

        banners =
            data || [];

        console.log(
            '✅ Banners recebidos do Supabase:',
            banners
        );

    }

}
catch (erro) {

    console.error(
        '❌ Erro inesperado ao buscar banners:',
        erro
    );

}


/* ========================================================
   SE NÃO HOUVER BANNER NO SUPABASE
   ======================================================== */

if (
    banners.length === 0
) {

    console.log(
        '🎠 Nenhum banner ativo no Supabase. Usando banners do HTML.'
    );

}
else {

    /* ====================================================
       LIMPAR BANNERS DO HTML
       ==================================================== */

    trilho.innerHTML = '';


    /* ====================================================
       CRIAR BANNERS
       ==================================================== */

    banners.forEach(
        function (
            banner
        ) {

            criarBannerSupabase(
                banner,
                trilho
            );

        }
    );

}


/* ========================================================
   INICIAR CONTROLES
   ======================================================== */

iniciarControlesCarrossel(
    trilho
);


}

/* ============================================================
CRIAR BANNER DO SUPABASE
============================================================ */

function criarBannerSupabase(
banner,
trilho
) {


const slide =
    document.createElement(
        'div'
    );


slide.className =
    'slide';


slide.style.position =
    'relative';


slide.style.overflow =
    'hidden';


/* ========================================================
   IMAGEM DE FUNDO
   ======================================================== */

if (
    banner.imagem_url
) {

    const imagemFundo =
        document.createElement(
            'div'
        );


    imagemFundo.className =
        'banner-imagem-fundo';


    imagemFundo.style.position =
        'absolute';


    imagemFundo.style.inset =
        '0';


    imagemFundo.style.width =
        '100%';


    imagemFundo.style.height =
        '100%';


    imagemFundo.style.backgroundImage =
        `url("${banner.imagem_url}")`;


    imagemFundo.style.backgroundSize =
        'cover';


    imagemFundo.style.backgroundPosition =
        'center';


    imagemFundo.style.backgroundRepeat =
        'no-repeat';


    imagemFundo.style.zIndex =
        '0';


    slide.appendChild(
        imagemFundo
    );


    /* ====================================================
       OVERLAY
       ==================================================== */

    const overlay =
        document.createElement(
            'div'
        );


    overlay.className =
        'banner-overlay';


    overlay.style.position =
        'absolute';


    overlay.style.inset =
        '0';


    overlay.style.width =
        '100%';


    overlay.style.height =
        '100%';


    overlay.style.zIndex =
        '1';


    overlay.style.background =
        'linear-gradient(90deg, rgba(0,0,0,0.68) 0%, rgba(0,0,0,0.45) 45%, rgba(0,0,0,0.15) 100%)';


    slide.appendChild(
        overlay
    );

}
else {

    slide.style.background =
        'linear-gradient(135deg, #2563eb, #1d4ed8)';

}


/* ========================================================
   CONTEÚDO
   ======================================================== */

const conteudo =
    document.createElement(
        'div'
    );


conteudo.className =
    'banner-conteudo';


conteudo.style.position =
    'relative';


conteudo.style.zIndex =
    '2';


conteudo.style.height =
    '100%';


conteudo.style.display =
    'flex';


conteudo.style.flexDirection =
    'column';


conteudo.style.alignItems =
    'flex-start';


conteudo.style.justifyContent =
    'center';


/* ========================================================
   SELO
   ======================================================== */

const badge =
    document.createElement(
        'span'
    );


badge.className =
    'slide-badge';


badge.textContent =
    'Destaque';


conteudo.appendChild(
    badge
);


/* ========================================================
   TÍTULO
   ======================================================== */

const titulo =
    document.createElement(
        'h2'
    );


titulo.className =
    'slide-titulo';


titulo.textContent =
    banner.titulo ||
    '';


titulo.style.color =
    '#ffffff';


titulo.style.textShadow =
    '0 2px 8px rgba(0,0,0,0.55)';


conteudo.appendChild(
    titulo
);


/* ========================================================
   DESCRIÇÃO
   ======================================================== */

if (
    banner.descricao
) {

    const descricao =
        document.createElement(
            'p'
        );


    descricao.className =
        'slide-subtitulo';


    descricao.textContent =
        banner.descricao;


    descricao.style.color =
        '#ffffff';


    descricao.style.textShadow =
        '0 2px 7px rgba(0,0,0,0.55)';


    conteudo.appendChild(
        descricao
    );

}


/* ========================================================
   BOTÃO
   ======================================================== */

if (
    banner.link_url &&
    banner.link_url !== '#'
) {

    const link =
        document.createElement(
            'a'
        );


    link.className =
        'slide-link';


    link.textContent =
        'Saiba mais';


    link.href =
        banner.link_url;


    link.style.position =
        'relative';


    link.style.zIndex =
        '3';


    conteudo.appendChild(
        link
    );

}


/* ========================================================
   FINALIZAR
   ======================================================== */

slide.appendChild(
    conteudo
);


trilho.appendChild(
    slide
);


}

/* ============================================================
CONTROLES DO CARROSSEL
============================================================ */

function iniciarControlesCarrossel(
trilho
) {


const pontosContainer =
    document.getElementById(
        'pontos'
    );


const slides =
    trilho.querySelectorAll(
        '.slide'
    );


const totalSlides =
    slides.length;


if (
    totalSlides === 0
) {

    console.warn(
        '⚠️ Nenhum slide encontrado.'
    );

    return;
}


let indiceAtual = 0;

let autoplayInterval = null;


/* ========================================================
   PONTOS
   ======================================================== */

if (pontosContainer) {

    pontosContainer.innerHTML = '';


    for (
        let i = 0;
        i < totalSlides;
        i++
    ) {

        const ponto =
            document.createElement(
                'button'
            );


        ponto.type =
            'button';


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
            function () {

                irParaSlide(
                    i
                );

            }
        );


        pontosContainer.appendChild(
            ponto
        );

    }

}


/* ========================================================
   IR PARA SLIDE
   ======================================================== */

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


    if (pontosContainer) {

        pontosContainer
            .querySelectorAll(
                '.ponto'
            )
            .forEach(
                function (
                    ponto,
                    indicePonto
                ) {

                    ponto.classList.toggle(
                        'ativo',
                        indicePonto ===
                        indiceAtual
                    );

                }
            );

    }


    reiniciarAutoplay();

}


/* ========================================================
   PRÓXIMO
   ======================================================== */

const btnProximo =
    document.getElementById(
        'btnProximo'
    );


if (btnProximo) {

    btnProximo.addEventListener(
        'click',
        function () {

            irParaSlide(
                indiceAtual + 1
            );

        }
    );

}


/* ========================================================
   ANTERIOR
   ======================================================== */

const btnAnterior =
    document.getElementById(
        'btnAnterior'
    );


if (btnAnterior) {

    btnAnterior.addEventListener(
        'click',
        function () {

            irParaSlide(
                indiceAtual - 1
            );

        }
    );

}


/* ========================================================
   AUTOPLAY
   ======================================================== */

function iniciarAutoplay() {

    if (
        totalSlides <= 1
    ) {

        return;
    }


    autoplayInterval =
        setInterval(
            function () {

                irParaSlide(
                    indiceAtual + 1
                );

            },
            4000
        );

}


function reiniciarAutoplay() {

    if (
        autoplayInterval
    ) {

        clearInterval(
            autoplayInterval
        );

    }


    iniciarAutoplay();

}


/* ========================================================
   SWIPE
   ======================================================== */

let posicaoInicial = null;


trilho.addEventListener(
    'touchstart',
    function (
        evento
    ) {

        if (
            evento.touches.length > 0
        ) {

            posicaoInicial =
                evento.touches[0].clientX;

        }


        if (
            autoplayInterval
        ) {

            clearInterval(
                autoplayInterval
            );

        }

    }
);


trilho.addEventListener(
    'touchend',
    function (
        evento
    ) {

        if (
            posicaoInicial === null
        ) {

            return;
        }


        if (
            evento.changedTouches.length === 0
        ) {

            posicaoInicial = null;

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


        posicaoInicial = null;

    }
);


/* ========================================================
   INICIAR
   ======================================================== */

trilho.style.transform =
    'translateX(0%)';


iniciarAutoplay();


console.log(
    `🎠 Carrossel iniciado com ${totalSlides} banner(s).`
);


}

/* ============================================================
ESCAPAR HTML
============================================================ */

function escaparHTMLHome(
valor
) {


if (
    valor === null ||
    valor === undefined
) {

    return '';
}


return String(valor)
    .replace(
        /&/g,
        '&amp;'
    )
    .replace(
        /</g,
        '&lt;'
    )
    .replace(
        />/g,
        '&gt;'
    )
    .replace(
        /"/g,
        '&quot;'
    )
    .replace(
        /'/g,
        '&#039;'
    );


}

/* ============================================================
FUNÇÕES GLOBAIS
============================================================ */

window.inicializarCarrossel =
inicializarCarrossel;

window.carregarMaisProdutosHome =
carregarMaisProdutosHome;

window.atualizarBadgeCarrinhoHome =
atualizarBadgeCarrinhoHome;
