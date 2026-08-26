// ============================================================
// ZORAVISION - HOME
// Carregamento dos produtos diretamente do Supabase
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {

    console.log('🏠 Home iniciada.');

    const gridProdutos = document.getElementById('grid-produtos-home');
    const contadorProdutos = document.getElementById('contador-produtos');

    if (!gridProdutos) {
        console.error('❌ Elemento #grid-produtos-home não encontrado.');
        return;
    }

    // ========================================================
    // BUSCAR PRODUTOS
    // ========================================================

    try {

        console.log('🔎 Buscando produtos no Supabase...');

        const { data: produtos, error } = await supabaseClient
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
            .eq('ativo', true)
            .order('created_at', {
                ascending: false
            });


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

        if (!produtos || produtos.length === 0) {

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
                contadorProdutos.textContent = '0 itens';
            }

            return;
        }


        // ====================================================
        // CONTADOR DE PRODUTOS
        // ====================================================

        if (contadorProdutos) {

            const quantidade = produtos.length;

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

        produtos.forEach(produto => {

            // ------------------------------------------------
            // PREÇOS
            // ------------------------------------------------

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


            const percentualDesconto =
                temPromocao
                    ? Math.round(
                        ((preco - precoPromocional) / preco) * 100
                    )
                    : 0;


            // ------------------------------------------------
            // FORMATAÇÃO DOS PREÇOS
            // ------------------------------------------------

            const precoAtualFormatado =
                precoAtual
                    .toFixed(2)
                    .replace('.', ',');


            const precoOriginalFormatado =
                preco
                    .toFixed(2)
                    .replace('.', ',');


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
                produto.imagem_url || '';


            // ------------------------------------------------
            // VENDAS
            // ------------------------------------------------

            const vendas = 0;


            // =================================================
            // CRIAR CARD
            // =================================================

            const card =
                document.createElement('div');

            card.className =
                'card-produto';

            card.style.position =
                'relative';


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
                            href="Produtos.html?id=${produto.id}"
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

            gridProdutos.appendChild(card);

        });


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