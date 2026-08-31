/* ============================================================
ZORAVISION - GERENCIAMENTO DE PRODUTOS
MERCADO LIVRE
=============

Responsabilidades:

* Verificar conexão Mercado Livre
* Buscar produtos importados no Supabase
* Buscar anúncios do Mercado Livre
* Mostrar status de cada produto
* Permitir seleção individual
* Selecionar todos
* Desmarcar todos
* Importar somente selecionados
* Evitar duplicação
  ============================================================ */

// ============================================================
// CONFIGURAÇÕES
// ============================================================

const SUPABASE_URL =
'https://ratajxnxkjoiuknamacn.supabase.co';

const EDGE_IMPORTAR_URL =
SUPABASE_URL +
'/functions/v1/mercadolivre-importar-produtos';

// ============================================================
// ESTADO
// ============================================================

let produtos = [];

let filtroAtual = 'todos';

let buscaAtual = '';

// ============================================================
// SUPABASE
// ============================================================

function obterSupabaseProdutos() {


if (window.supabaseClient) {
    return window.supabaseClient;
}

if (window._supabase) {
    return window._supabase;
}

if (
    typeof window.obterSupabase ===
    'function'
) {

    try {

        return window.obterSupabase();

    } catch (erro) {

        console.error(
            'Erro ao obter Supabase:',
            erro
        );

    }

}

console.error(
    'Cliente Supabase não encontrado.'
);

return null;


}

// ============================================================
// ELEMENTOS
// ============================================================

const listaProdutos =
document.getElementById(
'lista-produtos'
);

const carregando =
document.getElementById(
'carregando'
);

const mensagemVazia =
document.getElementById(
'mensagem-vazia'
);

const campoBusca =
document.getElementById(
'campo-busca'
);

const btnImportar =
document.getElementById(
'btn-importar'
);

// ============================================================
// ESCAPAR HTML
// ============================================================

function escaparHTML(valor) {


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
// VERIFICAR CONEXÃO
// ============================================================

async function verificarConexao() {


const supabase =
    obterSupabaseProdutos();

if (!supabase) {
    throw new Error(
        'Supabase não está disponível.'
    );
}

console.log(
    'Verificando conexão Mercado Livre...'
);

const resultado =
    await supabase
        .from('integracoes')
        .select(
            'id,plataforma,usuario_id,access_token,refresh_token,expires_at'
        )
        .eq(
            'plataforma',
            'mercado_livre'
        )
        .order(
            'atualizado_em',
            {
                ascending: false
            }
        )
        .limit(1);

if (resultado.error) {

    console.error(
        resultado.error
    );

    throw new Error(
        'Não foi possível consultar a conexão do Mercado Livre.'
    );

}

const conexao =
    resultado.data?.[0];

if (!conexao) {

    document.getElementById(
        'status-conta'
    ).textContent =
        'Mercado Livre desconectado';

    document.getElementById(
        'usuario-mercado-livre'
    ).textContent =
        'Nenhuma conexão encontrada.';

    const indicador =
        document.getElementById(
            'indicador-conexao'
        );

    indicador.textContent =
        'Desconectado';

    indicador.className =
        'indicador desconectado';

    return null;

}

document.getElementById(
    'status-conta'
).textContent =
    'Mercado Livre conectado';

document.getElementById(
    'usuario-mercado-livre'
).textContent =
    'Usuário: ' +
    conexao.usuario_id;

const indicador =
    document.getElementById(
        'indicador-conexao'
    );

indicador.textContent =
    'Conectado';

indicador.className =
    'indicador conectado';

return conexao;


}

// ============================================================
// BUSCAR PRODUTOS DO ZORAVISION
// ============================================================

async function buscarProdutosZoraVision() {


const supabase =
    obterSupabaseProdutos();

if (!supabase) {
    throw new Error(
        'Supabase não está disponível.'
    );
}

const resultado =
    await supabase
        .from('produtos')
        .select(
            'id,nome,descricao,preco,preco_promocional,estoque,sku,imagem_url,ativo,destaque,mercado_livre_item_id'
        )
        .not(
            'mercado_livre_item_id',
            'is',
            null
        )
        .order(
            'created_at',
            {
                ascending: false
            }
        );

if (resultado.error) {

    console.error(
        'Erro ao buscar produtos:',
        resultado.error
    );

    throw new Error(
        'Não foi possível consultar os produtos importados.'
    );

}

return resultado.data || [];


}

// ============================================================
// BUSCAR ANÚNCIOS DO MERCADO LIVRE
// ============================================================

async function buscarProdutosMercadoLivre() {


/*
 * A Edge Function atual de importação já consegue
 * consultar os anúncios do usuário conectado.
 *
 * Para não alterar o fluxo que já está funcionando,
 * primeiro carregamos os produtos existentes no
 * Supabase.
 *
 * Na próxima etapa podemos criar uma Edge Function
 * específica "mercadolivre-listar-produtos", que
 * somente consulta os anúncios sem importar.
 */

console.log(
    'Produtos importados encontrados no Supabase.'
);

return buscarProdutosZoraVision();


}

// ============================================================
// PREPARAR PRODUTOS
// ============================================================

function prepararProdutos(
produtosImportados
) {


return produtosImportados.map(
    produto => {

        return {

            ...produto,

            selecionado: false,

            status:
                produto.mercado_livre_item_id
                    ? 'importado'
                    : 'nao-importado'

        };

    }
);


}

// ============================================================
// FILTRAR PRODUTOS
// ============================================================

function obterProdutosFiltrados() {


return produtos.filter(
    produto => {

        let correspondeFiltro = true;

        if (
            filtroAtual ===
            'importados'
        ) {

            correspondeFiltro =
                produto.status ===
                'importado';

        }

        if (
            filtroAtual ===
            'nao-importados'
        ) {

            correspondeFiltro =
                produto.status ===
                'nao-importado';

        }

        if (
            filtroAtual ===
            'erros'
        ) {

            correspondeFiltro =
                produto.status ===
                'erro';

        }

        if (!correspondeFiltro) {
            return false;
        }

        if (!buscaAtual) {
            return true;
        }

        const texto =
            (
                produto.nome +
                ' ' +
                (
                    produto.mercado_livre_item_id ||
                    ''
                ) +
                ' ' +
                (
                    produto.sku ||
                    ''
                )
            ).toLowerCase();

        return texto.includes(
            buscaAtual
        );

    }
);


}

// ============================================================
// RENDERIZAR PRODUTOS
// ============================================================

function renderizarProdutos() {


const lista =
    obterProdutosFiltrados();

listaProdutos.innerHTML =
    '';

if (!lista.length) {

    listaProdutos.style.display =
        'none';

    mensagemVazia.style.display =
        'block';

    atualizarResumo();

    atualizarBotaoImportar();

    return;

}

mensagemVazia.style.display =
    'none';

listaProdutos.style.display =
    'grid';

lista.forEach(
    produto => {

        const card =
            document.createElement(
                'article'
            );

        card.className =
            'produto-card';

        const imagem =
            produto.imagem_url ||
            '';

        let statusTexto =
            'Importado';

        let statusClasse =
            'importado';

        if (
            produto.status ===
            'nao-importado'
        ) {

            statusTexto =
                'Não importado';

            statusClasse =
                'nao-importado';

        }

        if (
            produto.status ===
            'erro'
        ) {

            statusTexto =
                'Erro';

            statusClasse =
                'erro';

        }

        card.innerHTML = `

            <div class="produto-checkbox">

                <input
                    type="checkbox"
                    data-produto-id="${escaparHTML(produto.id)}"
                    ${produto.selecionado ? 'checked' : ''}
                >

            </div>


            <div class="produto-imagem">

                ${
                    imagem
                    ?
                    `
                    <img
                        src="${escaparHTML(imagem)}"
                        alt="${escaparHTML(produto.nome)}"
                        loading="lazy"
                    >
                    `
                    :
                    '📦'
                }

            </div>


            <div class="produto-info">

                <div class="produto-nome">

                    ${escaparHTML(produto.nome)}

                </div>


                <div class="produto-id">

                    ${escaparHTML(
                        produto.mercado_livre_item_id ||
                        'Sem ID Mercado Livre'
                    )}

                </div>


                <div class="produto-dados">

                    <div class="produto-dado">

                        Preço

                        <strong>
                            R$ ${
                                Number(
                                    produto.preco || 0
                                ).toFixed(2).replace(
                                    '.',
                                    ','
                                )
                            }
                        </strong>

                    </div>


                    <div class="produto-dado">

                        Estoque

                        <strong>
                            ${
                                produto.estoque ??
                                0
                            }
                        </strong>

                    </div>


                    ${
                        produto.sku
                        ?
                        `
                        <div class="produto-dado">

                            SKU

                            <strong>
                                ${escaparHTML(
                                    produto.sku
                                )}
                            </strong>

                        </div>
                        `
                        :
                        ''
                    }

                </div>


                <div
                    class="produto-status ${statusClasse}"
                >
                    ${statusTexto}
                </div>

            </div>

        `;


        const checkbox =
            card.querySelector(
                'input[type="checkbox"]'
            );


        checkbox.addEventListener(
            'change',
            function() {

                produto.selecionado =
                    this.checked;

                atualizarBotaoImportar();

            }
        );


        listaProdutos.appendChild(
            card
        );

    }
);

atualizarResumo();

atualizarBotaoImportar();


}

// ============================================================
// ATUALIZAR RESUMO
// ============================================================

function atualizarResumo() {


const total =
    produtos.length;

const importados =
    produtos.filter(
        produto =>
            produto.status ===
            'importado'
    ).length;

const naoImportados =
    produtos.filter(
        produto =>
            produto.status ===
            'nao-importado'
    ).length;

const erros =
    produtos.filter(
        produto =>
            produto.status ===
            'erro'
    ).length;

document.getElementById(
    'total-encontrados'
).textContent =
    total;

document.getElementById(
    'total-importados'
).textContent =
    importados;

document.getElementById(
    'total-nao-importados'
).textContent =
    naoImportados;

document.getElementById(
    'total-erros'
).textContent =
    erros;


}

// ============================================================
// ATUALIZAR BOTÃO IMPORTAR
// ============================================================

function atualizarBotaoImportar() {


if (!btnImportar) {
    return;
}

const selecionados =
    produtos.filter(
        produto =>
            produto.selecionado
    );

btnImportar.disabled =
    selecionados.length === 0;

btnImportar.textContent =
    selecionados.length
        ? `Importar selecionados (${selecionados.length})`
        : 'Importar selecionados';


}

// ============================================================
// SELECIONAR TODOS
// ============================================================

function selecionarTodos() {


obterProdutosFiltrados()
    .forEach(
        produto => {

            produto.selecionado =
                true;

        }
    );

renderizarProdutos();


}

// ============================================================
// DESMARCAR TODOS
// ============================================================

function desmarcarTodos() {


produtos.forEach(
    produto => {

        produto.selecionado =
            false;

    }
);

renderizarProdutos();


}

// ============================================================
// IMPORTAR SELECIONADOS
// ============================================================

async function importarSelecionados() {


const selecionados =
    produtos.filter(
        produto =>
            produto.selecionado
    );

if (!selecionados.length) {

    alert(
        'Selecione pelo menos um produto.'
    );

    return;

}


if (
    !confirm(
        `Deseja importar ${selecionados.length} produto(s) selecionado(s)?`
    )
) {

    return;

}


btnImportar.disabled =
    true;

btnImportar.textContent =
    'Importando...';


try {

    const ids =
        selecionados
            .map(
                produto =>
                    produto.mercado_livre_item_id
            )
            .filter(Boolean);


    console.log(
        'Produtos selecionados:',
        ids
    );


    const resposta =
        await fetch(
            EDGE_IMPORTAR_URL,
            {

                method: 'POST',

                headers: {
                    'Content-Type':
                        'application/json'
                },

                body:
                    JSON.stringify({
                        item_ids: ids
                    })

            }
        );


    const resultado =
        await resposta.json();


    console.log(
        'Resultado da importação:',
        resultado
    );


    if (!resposta.ok) {

        throw new Error(
            resultado?.erro ||
            resultado?.error ||
            'Erro ao importar produtos.'
        );

    }


    mostrarResultado(
        'Importação concluída',
        resultado?.mensagem ||
        'Os produtos selecionados foram processados com sucesso.',
        true
    );


    await carregarDados();


} catch (erro) {

    console.error(
        'Erro na importação:',
        erro
    );

    mostrarResultado(
        'Erro na importação',
        erro?.message ||
        'Não foi possível importar os produtos.',
        false
    );

} finally {

    atualizarBotaoImportar();

}


}

// ============================================================
// MODAL
// ============================================================

function mostrarResultado(
titulo,
mensagem,
sucesso
) {


const modal =
    document.getElementById(
        'modal-resultado'
    );

document.getElementById(
    'modal-titulo'
).textContent =
    titulo;

document.getElementById(
    'modal-mensagem'
).textContent =
    mensagem;

const icone =
    document.getElementById(
        'modal-icone'
    );

icone.textContent =
    sucesso
        ? '✓'
        : '⚠';

modal.style.display =
    'flex';


}

function fecharModal() {


document.getElementById(
    'modal-resultado'
).style.display =
    'none';


}

// ============================================================
// FILTROS
// ============================================================

function configurarFiltros() {


document
    .querySelectorAll(
        '.filtro'
    )
    .forEach(
        botao => {

            botao.addEventListener(
                'click',
                function() {

                    document
                        .querySelectorAll(
                            '.filtro'
                        )
                        .forEach(
                            item =>
                                item.classList.remove(
                                    'ativo'
                                )
                        );

                    this.classList.add(
                        'ativo'
                    );

                    filtroAtual =
                        this.dataset.filtro;

                    renderizarProdutos();

                }
            );

        }
    );


}

// ============================================================
// BUSCA
// ============================================================

function configurarBusca() {


if (!campoBusca) {
    return;
}

campoBusca.addEventListener(
    'input',
    function() {

        buscaAtual =
            this.value
                .trim()
                .toLowerCase();

        renderizarProdutos();

    }
);


}

// ============================================================
// CARREGAR DADOS
// ============================================================

async function carregarDados() {


carregando.style.display =
    'block';

listaProdutos.style.display =
    'none';

mensagemVazia.style.display =
    'none';


try {

    const conexao =
        await verificarConexao();


    if (!conexao) {

        produtos = [];

        atualizarResumo();

        return;

    }


    const produtosImportados =
        await buscarProdutosMercadoLivre();


    produtos =
        prepararProdutos(
            produtosImportados
        );


    renderizarProdutos();


} catch (erro) {

    console.error(
        'Erro ao carregar produtos:',
        erro
    );

    produtos = [];

    listaProdutos.innerHTML =
        '';

    mensagemVazia.style.display =
        'block';

    mensagemVazia.querySelector(
        'h3'
    ).textContent =
        'Erro ao carregar produtos';

    mensagemVazia.querySelector(
        'p'
    ).textContent =
        erro?.message ||
        'Não foi possível carregar os produtos.';

} finally {

    carregando.style.display =
        'none';

}


}

// ============================================================
// EVENTOS
// ============================================================

document.addEventListener(
'DOMContentLoaded',
function() {


    console.log(
        '============================================================'
    );

    console.log(
        'ZoraVision - Produtos Mercado Livre'
    );

    console.log(
        'Inicializando gerenciamento de produtos...'
    );

    console.log(
        '============================================================'
    );


    configurarFiltros();

    configurarBusca();


    document
        .getElementById(
            'btn-selecionar-todos'
        )
        .addEventListener(
            'click',
            selecionarTodos
        );


    document
        .getElementById(
            'btn-desmarcar-todos'
        )
        .addEventListener(
            'click',
            desmarcarTodos
        );


    document
        .getElementById(
            'btn-fechar-modal'
        )
        .addEventListener(
            'click',
            fecharModal
        );


    document
        .getElementById(
            'btn-modal-ok'
        )
        .addEventListener(
            'click',
            fecharModal
        );


    btnImportar.addEventListener(
        'click',
        importarSelecionados
    );


    carregarDados();


}


);

// ============================================================
// FUNÇÕES GLOBAIS
// ============================================================

window.importarSelecionados =
importarSelecionados;

window.selecionarTodos =
selecionarTodos;

window.desmarcarTodos =
desmarcarTodos;
