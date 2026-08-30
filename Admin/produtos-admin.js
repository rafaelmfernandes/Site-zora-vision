// ============================================================
// ZORAVISION - ADMINISTRAÇÃO DE PRODUTOS
// ============================================================
// Arquivo: Admin/produtos-admin.js
// ============================================================


// ============================================================
// 1. VARIÁVEIS
// ============================================================

let produtosAdmin = [];


// ============================================================
// 2. SUPABASE
// ============================================================

function obterSupabaseProdutosAdmin() {

    if (window.supabaseClient) {
        return window.supabaseClient;
    }

    if (window._supabase) {
        return window._supabase;
    }

    if (typeof window.obterSupabase === 'function') {
        return window.obterSupabase();
    }

    console.error(
        'Cliente Supabase não encontrado.'
    );

    return null;
}


// ============================================================
// 3. ESCAPAR HTML
// ============================================================

function escaparHTMLProduto(valor) {

    if (
        valor === null ||
        valor === undefined
    ) {
        return '';
    }

    return String(valor)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}


// ============================================================
// 4. FORMATAR PREÇO
// ============================================================

function formatarPrecoProduto(valor) {

    const numero = Number(valor);

    if (Number.isNaN(numero)) {
        return 'R$ 0,00';
    }

    return numero.toLocaleString(
        'pt-BR',
        {
            style: 'currency',
            currency: 'BRL'
        }
    );
}


// ============================================================
// 5. OBTER IMAGEM
// ============================================================

function obterImagemProduto(produto) {

    if (!produto) {
        return '';
    }

    return (
        produto.imagem_url ||
        produto.imagem ||
        produto.foto_url ||
        produto.url_imagem ||
        ''
    );
}


// ============================================================
// 6. CONTROLE DOS ESTADOS DA PÁGINA
// ============================================================

function esconderEstadosProdutos() {

    const carregando =
        document.getElementById(
            'produtos-carregando'
        );

    const vazio =
        document.getElementById(
            'produtos-vazio'
        );

    const erro =
        document.getElementById(
            'produtos-erro'
        );

    if (carregando) {
        carregando.hidden = true;
    }

    if (vazio) {
        vazio.hidden = true;
    }

    if (erro) {
        erro.hidden = true;
    }
}


function mostrarCarregandoProdutos() {

    esconderEstadosProdutos();

    const carregando =
        document.getElementById(
            'produtos-carregando'
        );

    const lista =
        document.getElementById(
            'lista-produtos'
        );

    if (carregando) {
        carregando.hidden = false;
    }

    if (lista) {
        lista.innerHTML = '';
    }
}


function mostrarProdutosVazios() {

    esconderEstadosProdutos();

    const vazio =
        document.getElementById(
            'produtos-vazio'
        );

    const lista =
        document.getElementById(
            'lista-produtos'
        );

    if (lista) {
        lista.innerHTML = '';
    }

    if (vazio) {
        vazio.hidden = false;
    }
}


function mostrarErroProdutos(
    mensagem
) {

    esconderEstadosProdutos();

    const erro =
        document.getElementById(
            'produtos-erro'
        );

    const lista =
        document.getElementById(
            'lista-produtos'
        );

    const mensagemErro =
        document.getElementById(
            'mensagem-erro-produtos'
        );

    if (lista) {
        lista.innerHTML = '';
    }

    if (mensagemErro) {
        mensagemErro.textContent =
            mensagem ||
            'Tente novamente.';
    }

    if (erro) {
        erro.hidden = false;
    }
}


// ============================================================
// 7. CARREGAR PRODUTOS
// ============================================================

async function carregarProdutosAdmin() {

    console.log(
        'Iniciando carregamento dos produtos...'
    );

    const lista =
        document.getElementById(
            'lista-produtos'
        );

    if (!lista) {

        console.error(
            'Elemento lista-produtos não encontrado.'
        );

        return;
    }

    mostrarCarregandoProdutos();

    const supabase =
        obterSupabaseProdutosAdmin();

    if (!supabase) {

        console.error(
            'Supabase não disponível.'
        );

        mostrarErroProdutos(
            'Não foi possível conectar ao Supabase.'
        );

        return;
    }

    try {

        console.log(
            'Consultando tabela produtos...'
        );

        const resultado =
            await supabase
                .from('produtos')
                .select('*')
                .order(
                    'id',
                    {
                        ascending: false
                    }
                );

        console.log(
            'Resposta da tabela produtos:',
            resultado
        );

        if (resultado.error) {

            console.error(
                'Erro Supabase:',
                resultado.error
            );

            mostrarErroProdutos(
                resultado.error.message ||
                'Não foi possível carregar os produtos.'
            );

            return;
        }

        produtosAdmin =
            Array.isArray(
                resultado.data
            )
                ? resultado.data
                : [];

        console.log(
            'Quantidade de produtos:',
            produtosAdmin.length
        );

        atualizarQuantidadeProdutos();

        atualizarQuantidadeProdutosAtivos();

        if (
            produtosAdmin.length === 0
        ) {

            mostrarProdutosVazios();

            return;
        }

        renderizarProdutosAdmin();

        esconderEstadosProdutos();

        console.log(
            'Produtos carregados com sucesso.'
        );

    } catch (erro) {

        console.error(
            'Erro inesperado ao carregar produtos:',
            erro
        );

        mostrarErroProdutos(
            erro.message ||
            'Ocorreu um erro ao carregar os produtos.'
        );
    }
}


// ============================================================
// 8. QUANTIDADES
// ============================================================

function atualizarQuantidadeProdutos() {

    const elemento =
        document.getElementById(
            'total-produtos-admin'
        );

    if (!elemento) {
        return;
    }

    elemento.textContent =
        produtosAdmin.length;
}


function atualizarQuantidadeProdutosAtivos() {

    const elemento =
        document.getElementById(
            'total-produtos-ativos'
        );

    if (!elemento) {
        return;
    }

    const ativos =
        produtosAdmin.filter(
            produto =>
                produto.ativo !== false
        );

    elemento.textContent =
        ativos.length;
}


// ============================================================
// 9. RENDERIZAR PRODUTOS
// ============================================================

function renderizarProdutosAdmin() {

    const lista =
        document.getElementById(
            'lista-produtos'
        );

    if (!lista) {

        console.error(
            'Elemento lista-produtos não encontrado.'
        );

        return;
    }

    const campoBusca =
        document.getElementById(
            'campo-busca-produto'
        );

    const termoBusca =
        campoBusca
            ? campoBusca.value
                .trim()
                .toLowerCase()
            : '';

    let produtosFiltrados =
        produtosAdmin.filter(
            produto => {

                const nome =
                    String(
                        produto.nome ||
                        ''
                    ).toLowerCase();

                const descricao =
                    String(
                        produto.descricao ||
                        ''
                    ).toLowerCase();

                if (
                    termoBusca &&
                    !nome.includes(
                        termoBusca
                    ) &&
                    !descricao.includes(
                        termoBusca
                    )
                ) {
                    return false;
                }

                return true;
            }
        );

    if (
        produtosFiltrados.length === 0
    ) {

        lista.innerHTML =
            '<div class="admin-empty">' +
                '<div class="admin-empty-icon">📦</div>' +
                '<strong>Nenhum produto encontrado</strong>' +
            '</div>';

        return;
    }

    lista.innerHTML =
        produtosFiltrados
            .map(
                produto =>
                    criarCardProduto(
                        produto
                    )
            )
            .join('');
}


// ============================================================
// 10. CARD DO PRODUTO
// ============================================================

function criarCardProduto(produto) {

    const id =
        produto.id;

    const nome =
        escaparHTMLProduto(
            produto.nome ||
            'Produto sem nome'
        );

    const descricao =
        escaparHTMLProduto(
            produto.descricao ||
            ''
        );

    const imagem =
        obterImagemProduto(
            produto
        );

    const preco =
        formatarPrecoProduto(
            produto.preco
        );

    const estoque =
        Number(
            produto.estoque || 0
        );

    const ativo =
        produto.ativo !== false;

    let imagemHTML;

    if (imagem) {

        imagemHTML =
            '<img ' +
                'class="produto-admin-imagem" ' +
                'src="' +
                    escaparHTMLProduto(
                        imagem
                    ) +
                '" ' +
                'alt="' +
                    nome +
                '" ' +
                'loading="lazy"' +
            '>';

    } else {

        imagemHTML =
            '<div class="produto-admin-sem-imagem">' +
                '📦' +
            '</div>';
    }


    const statusHTML =
        ativo
            ? '<span class="produto-status produto-ativo">Ativo</span>'
            : '<span class="produto-status produto-inativo">Inativo</span>';


    let estoqueClasse =
        'estoque-normal';

    if (estoque <= 0) {

        estoqueClasse =
            'estoque-esgotado';

    } else if (estoque <= 5) {

        estoqueClasse =
            'estoque-baixo';
    }


    return (

        '<article class="produto-admin-card">' +

            '<div class="produto-admin-topo">' +

                '<div class="produto-admin-foto">' +
                    imagemHTML +
                '</div>' +

                '<div class="produto-admin-info">' +

                    '<div class="produto-admin-status">' +
                        statusHTML +
                    '</div>' +

                    '<h3>' +
                        nome +
                    '</h3>' +

                    (
                        descricao
                            ? '<p>' +
                                descricao +
                              '</p>'
                            : ''
                    ) +

                    '<div class="produto-precos">' +

                        '<strong>' +
                            preco +
                        '</strong>' +

                    '</div>' +

                    '<span class="produto-estoque ' +
                        estoqueClasse +
                    '">' +

                        (
                            estoque > 0
                                ? estoque +
                                  ' em estoque'
                                : 'Sem estoque'
                        ) +

                    '</span>' +

                '</div>' +

            '</div>' +

            '<div class="produto-admin-acoes">' +

                '<button ' +
                    'type="button" ' +
                    'class="btn-editar-produto" ' +
                    'data-id="' +
                        escaparHTMLProduto(id) +
                    '">' +
                    'Editar' +
                '</button>' +

                '<button ' +
                    'type="button" ' +
                    'class="btn-excluir-produto" ' +
                    'data-id="' +
                        escaparHTMLProduto(id) +
                    '">' +
                    'Excluir' +
                '</button>' +

            '</div>' +

        '</article>'
    );
}


// ============================================================
// 11. EDITAR
// ============================================================

function editarProdutoAdmin(id) {

    if (
        id === null ||
        id === undefined ||
        id === ''
    ) {
        return;
    }

    window.location.href =
        'cadastro-produto.html?id=' +
        encodeURIComponent(id);
}


// ============================================================
// 12. EXCLUIR
// ============================================================

async function excluirProdutoAdmin(id) {

    const supabase =
        obterSupabaseProdutosAdmin();

    if (!supabase) {

        alert(
            'Supabase não disponível.'
        );

        return;
    }

    const produto =
        produtosAdmin.find(
            item =>
                String(item.id) ===
                String(id)
        );

    if (!produto) {

        alert(
            'Produto não encontrado.'
        );

        return;
    }

    const confirmar =
        window.confirm(
            'Deseja excluir o produto "' +
            (
                produto.nome ||
                'este produto'
            ) +
            '"?'
        );

    if (!confirmar) {
        return;
    }

    try {

        const resultado =
            await supabase
                .from('produtos')
                .delete()
                .eq(
                    'id',
                    id
                );

        if (resultado.error) {

            console.error(
                'Erro ao excluir:',
                resultado.error
            );

            alert(
                'Não foi possível excluir o produto.\n\n' +
                resultado.error.message
            );

            return;
        }

        alert(
            'Produto excluído com sucesso!'
        );

        await carregarProdutosAdmin();

    } catch (erro) {

        console.error(
            'Erro ao excluir produto:',
            erro
        );

        alert(
            'Ocorreu um erro ao excluir o produto.'
        );
    }
}


// ============================================================
// 13. BUSCA
// ============================================================

function configurarBuscaProdutos() {

    const campo =
        document.getElementById(
            'campo-busca-produto'
        );

    if (!campo) {

        console.warn(
            'Campo campo-busca-produto não encontrado.'
        );

        return;
    }

    campo.addEventListener(
        'input',
        function() {

            renderizarProdutosAdmin();

        }
    );
}


// ============================================================
// 14. BOTÃO ATUALIZAR
// ============================================================

function configurarBotaoAtualizarProdutos() {

    const botao =
        document.getElementById(
            'btn-atualizar-produtos'
        );

    if (!botao) {
        return;
    }

    botao.addEventListener(
        'click',
        async function() {

            botao.disabled =
                true;

            botao.textContent =
                'Atualizando...';

            try {

                await carregarProdutosAdmin();

            } finally {

                botao.disabled =
                    false;

                botao.textContent =
                    'Atualizar';
            }
        }
    );
}


// ============================================================
// 15. BOTÃO TENTAR NOVAMENTE
// ============================================================

function configurarBotaoTentarProdutos() {

    const botao =
        document.getElementById(
            'btn-tentar-produtos'
        );

    if (!botao) {
        return;
    }

    botao.addEventListener(
        'click',
        async function() {

            botao.disabled =
                true;

            botao.textContent =
                'Carregando...';

            try {

                await carregarProdutosAdmin();

            } finally {

                botao.disabled =
                    false;

                botao.textContent =
                    'Tentar novamente';
            }
        }
    );
}


// ============================================================
// 16. EVENTOS DOS PRODUTOS
// ============================================================

function configurarEventosProdutos() {

    const lista =
        document.getElementById(
            'lista-produtos'
        );

    if (!lista) {
        return;
    }

    lista.addEventListener(
        'click',
        function(event) {

            const editar =
                event.target.closest(
                    '.btn-editar-produto'
                );

            if (editar) {

                editarProdutoAdmin(
                    editar.dataset.id
                );

                return;
            }

            const excluir =
                event.target.closest(
                    '.btn-excluir-produto'
                );

            if (excluir) {

                excluirProdutoAdmin(
                    excluir.dataset.id
                );
            }
        }
    );
}


// ============================================================
// 17. INICIALIZAÇÃO
// ============================================================

document.addEventListener(
    'DOMContentLoaded',
    async function() {

        console.log(
            '============================================================'
        );

        console.log(
            'ZoraVision - Administração de Produtos'
        );

        console.log(
            'Inicializando página de produtos...'
        );

        console.log(
            '============================================================'
        );

        configurarBuscaProdutos();

        configurarBotaoAtualizarProdutos();

        configurarBotaoTentarProdutos();

        configurarEventosProdutos();

        await carregarProdutosAdmin();

        console.log(
            'Inicialização dos produtos finalizada.'
        );
    }
);


// ============================================================
// 18. FUNÇÕES GLOBAIS
// ============================================================

window.carregarProdutosAdmin =
carregarProdutosAdmin;

window.renderizarProdutosAdmin =
renderizarProdutosAdmin;

window.editarProdutoAdmin =
editarProdutoAdmin;

window.excluirProdutoAdmin =
excluirProdutoAdmin;