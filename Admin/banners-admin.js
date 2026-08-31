/* ============================================================
ZORAVISION - ADMINISTRAÇÃO DE BANNERS
Arquivo: Admin/banners-admin.js
============================================================ */

let bannersAdmin = [];
let bannerSelecionadoExclusao = null;

/* ============================================================

1. SUPABASE
   ============================================================ */

function obterSupabaseBannersAdmin() {


if (window.supabaseClient) {
    return window.supabaseClient;
}

if (window._supabase) {
    return window._supabase;
}

if (typeof window.obterSupabase === 'function') {
    try {
        return window.obterSupabase();
    } catch (erro) {
        console.error('Erro ao obter Supabase:', erro);
    }
}

console.error('Cliente Supabase não encontrado.');

return null;


}

/* ============================================================
2. ESCAPAR HTML
============================================================ */

function escaparHTMLBanner(valor) {


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

/* ============================================================
3. OBTER DADOS
============================================================ */

function obterImagemBanner(banner) {


if (!banner) {
    return '';
}

return banner.imagem_url || '';


}

function obterTituloBanner(banner) {


if (!banner) {
    return 'Banner sem título';
}

return banner.titulo || 'Banner sem título';


}

function obterDescricaoBanner(banner) {


if (!banner) {
    return '';
}

return banner.descricao || '';


}

function obterStatusBanner(banner) {


if (!banner) {
    return false;
}

return banner.ativo === true;


}

/* ============================================================
4. ESTADOS DA PÁGINA
============================================================ */

function esconderEstadoBanners() {


const carregando =
    document.getElementById('banners-carregando');

const vazio =
    document.getElementById('banners-vazio');

const erro =
    document.getElementById('banners-erro');

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

function mostrarCarregandoBanners() {


esconderEstadoBanners();

const carregando =
    document.getElementById('banners-carregando');

if (carregando) {
    carregando.hidden = false;
}


}

function mostrarBannersVazio() {


esconderEstadoBanners();

const vazio =
    document.getElementById('banners-vazio');

if (vazio) {
    vazio.hidden = false;
}


}

function mostrarErroBanners(mensagem) {


esconderEstadoBanners();

const erro =
    document.getElementById('banners-erro');

const mensagemErro =
    document.getElementById('mensagem-erro-banners');

if (mensagemErro) {
    mensagemErro.textContent =
        mensagem ||
        'Não foi possível carregar os banners.';
}

if (erro) {
    erro.hidden = false;
}


}

/* ============================================================
5. RESUMO
============================================================ */

function atualizarResumoBanners() {


const total =
    document.getElementById(
        'total-banners-admin'
    );

const ativos =
    document.getElementById(
        'total-banners-ativos'
    );

if (total) {
    total.textContent =
        bannersAdmin.length;
}

if (ativos) {

    const quantidadeAtivos =
        bannersAdmin.filter(
            banner =>
                obterStatusBanner(banner)
        ).length;

    ativos.textContent =
        quantidadeAtivos;
}


}

/* ============================================================
6. CARREGAR BANNERS
============================================================ */

async function carregarBannersAdmin() {


console.log(
    '============================================================'
);

console.log(
    'Iniciando carregamento dos banners...'
);

console.log(
    '============================================================'
);

const lista =
    document.getElementById(
        'lista-banners'
    );

if (!lista) {

    console.error(
        'Elemento lista-banners não encontrado.'
    );

    return;
}

mostrarCarregandoBanners();

lista.innerHTML = '';

const supabase =
    obterSupabaseBannersAdmin();

if (!supabase) {

    mostrarErroBanners(
        'Supabase não está disponível.'
    );

    return;
}

try {

    console.log(
        'Consultando tabela banners...'
    );

    const resultado =
        await supabase
            .from('banners')
            .select('*')
            .order(
                'ordem',
                {
                    ascending: true
                }
            )
            .order(
                'created_at',
                {
                    ascending: false
                }
            );

    console.log(
        'Resposta da tabela banners:',
        resultado
    );

    if (resultado.error) {

        console.error(
            'Erro Supabase:',
            resultado.error
        );

        bannersAdmin = [];

        atualizarResumoBanners();

        mostrarErroBanners(
            resultado.error.message ||
            'Erro ao carregar banners.'
        );

        return;
    }

    bannersAdmin =
        Array.isArray(resultado.data)
            ? resultado.data
            : [];

    console.log(
        'Quantidade de banners:',
        bannersAdmin.length
    );

    atualizarResumoBanners();

    if (
        bannersAdmin.length === 0
    ) {

        lista.innerHTML = '';

        mostrarBannersVazio();

        return;
    }

    renderizarBannersAdmin();

    console.log(
        'Banners carregados com sucesso.'
    );

} catch (erro) {

    console.error(
        'Erro inesperado ao carregar banners:',
        erro
    );

    bannersAdmin = [];

    atualizarResumoBanners();

    lista.innerHTML = '';

    mostrarErroBanners(
        erro?.message ||
        'Erro inesperado ao carregar os banners.'
    );
}


}

/* ============================================================
7. RENDERIZAR
============================================================ */

function renderizarBannersAdmin() {


const lista =
    document.getElementById(
        'lista-banners'
    );

if (!lista) {
    return;
}

esconderEstadoBanners();

if (
    !bannersAdmin ||
    bannersAdmin.length === 0
) {

    lista.innerHTML = '';

    mostrarBannersVazio();

    return;
}

lista.innerHTML =
    bannersAdmin
        .map(
            banner =>
                criarCardBanner(banner)
        )
        .join('');


}

/* ============================================================
8. CRIAR CARD
============================================================ */

function criarCardBanner(banner) {


const id =
    banner.id;

const titulo =
    escaparHTMLBanner(
        obterTituloBanner(banner)
    );

const descricao =
    escaparHTMLBanner(
        obterDescricaoBanner(banner)
    );

const imagem =
    obterImagemBanner(banner);

const ativo =
    obterStatusBanner(banner);

let imagemHTML;

if (imagem) {

    imagemHTML =
        '<img ' +
        'class="banner-admin-imagem" ' +
        'src="' +
        escaparHTMLBanner(imagem) +
        '" ' +
        'alt="' +
        titulo +
        '" ' +
        'loading="lazy"' +
        '>';

} else {

    imagemHTML =
        '<div class="banner-admin-sem-imagem">' +
        '🖼️' +
        '</div>';
}

const statusHTML =
    ativo
        ? '<span class="banner-status banner-ativo">Ativo</span>'
        : '<span class="banner-status banner-inativo">Inativo</span>';

let informacoesHTML = '';

if (
    banner.ordem !== null &&
    banner.ordem !== undefined
) {

    informacoesHTML +=
        '<span class="banner-info-item">' +
        'Ordem: ' +
        escaparHTMLBanner(banner.ordem) +
        '</span>';
}

if (banner.link_url) {

    informacoesHTML +=
        '<span class="banner-info-item">' +
        'Link configurado' +
        '</span>';
}

const botaoStatus =
    ativo
        ? 'Desativar'
        : 'Ativar';

const classeStatus =
    ativo
        ? 'btn-desativar-banner'
        : 'btn-ativar-banner';

return (

    '<article class="banner-admin-card" ' +
    'data-id="' +
    escaparHTMLBanner(id) +
    '">' +

    '<div class="banner-admin-imagem-container">' +

    imagemHTML +

    '</div>' +

    '<div class="banner-admin-conteudo">' +

    '<div class="banner-admin-topo">' +

    '<div>' +

    '<h3 class="banner-admin-titulo">' +
    titulo +
    '</h3>' +

    (
        descricao
            ? '<p class="banner-admin-descricao">' +
            descricao +
            '</p>'
            : ''
    ) +

    '</div>' +

    '<div class="banner-admin-status">' +
    statusHTML +
    '</div>' +

    '</div>' +

    (
        informacoesHTML
            ? '<div class="banner-admin-informacoes">' +
            informacoesHTML +
            '</div>'
            : ''
    ) +

    '</div>' +

    '<div class="banner-admin-acoes">' +

    '<button ' +
    'type="button" ' +
    'class="btn-editar-banner" ' +
    'data-id="' +
    escaparHTMLBanner(id) +
    '">' +
    'Editar' +
    '</button>' +

    '<button ' +
    'type="button" ' +
    'class="' +
    classeStatus +
    '" ' +
    'data-id="' +
    escaparHTMLBanner(id) +
    '">' +
    botaoStatus +
    '</button>' +

    '<button ' +
    'type="button" ' +
    'class="btn-excluir-banner" ' +
    'data-id="' +
    escaparHTMLBanner(id) +
    '">' +
    'Excluir' +
    '</button>' +

    '</div>' +

    '</article>'
);


}

/* ============================================================
9. EDITAR
============================================================ */

function editarBannerAdmin(id) {


if (
    id === null ||
    id === undefined ||
    id === ''
) {
    return;
}

window.location.href =
    'cadastro-banner.html?id=' +
    encodeURIComponent(id);


}

/* ============================================================
10. ALTERAR STATUS
============================================================ */

async function alterarStatusBanner(id, novoStatus) {


const supabase =
    obterSupabaseBannersAdmin();

if (!supabase) {

    alert(
        'Supabase não está disponível.'
    );

    return false;
}

const banner =
    bannersAdmin.find(
        item =>
            String(item.id) ===
            String(id)
    );

if (!banner) {

    alert(
        'Banner não encontrado.'
    );

    return false;
}

console.log(
    'Alterando status do banner:',
    id,
    novoStatus
);

try {

    const dadosAtualizacao = {
        ativo: novoStatus,
        updated_at:
            new Date().toISOString()
    };

    const resultado =
        await supabase
            .from('banners')
            .update(
                dadosAtualizacao
            )
            .eq(
                'id',
                id
            )
            .select('*');

    console.log(
        'Resultado da alteração de status:',
        resultado
    );

    if (resultado.error) {

        console.error(
            'Erro ao alterar status:',
            resultado.error
        );

        alert(
            'Não foi possível alterar o status do banner.\n\n' +
            resultado.error.message
        );

        return false;
    }

    if (
        !resultado.data ||
        resultado.data.length === 0
    ) {

        console.error(
            'Nenhum banner foi atualizado.'
        );

        alert(
            'Nenhum banner foi atualizado. Verifique as permissões da tabela banners.'
        );

        return false;
    }

    const bannerAtualizado =
        resultado.data[0];

    const indice =
        bannersAdmin.findIndex(
            item =>
                String(item.id) ===
                String(id)
        );

    if (indice !== -1) {

        bannersAdmin[indice] =
            bannerAtualizado;
    }

    atualizarResumoBanners();

    renderizarBannersAdmin();

    console.log(
        novoStatus
            ? 'Banner ativado com sucesso.'
            : 'Banner desativado com sucesso.'
    );

    return true;

} catch (erro) {

    console.error(
        'Erro inesperado ao alterar status:',
        erro
    );

    alert(
        'Ocorreu um erro ao alterar o status do banner.'
    );

    return false;
}


}

/* ============================================================
11. MODAL DE EXCLUSÃO
============================================================ */

function abrirModalExcluirBanner(id) {


const modal =
    document.getElementById(
        'modal-excluir-banner'
    );

if (!modal) {

    excluirBannerAdmin(id);

    return;
}

bannerSelecionadoExclusao =
    id;

modal.hidden = false;


}

function fecharModalExcluirBanner() {


const modal =
    document.getElementById(
        'modal-excluir-banner'
    );

if (modal) {
    modal.hidden = true;
}

bannerSelecionadoExclusao =
    null;


}

/* ============================================================
12. EXCLUIR
============================================================ */

async function excluirBannerAdmin(id) {


const supabase =
    obterSupabaseBannersAdmin();

if (!supabase) {

    alert(
        'Supabase não está disponível.'
    );

    return false;
}

const banner =
    bannersAdmin.find(
        item =>
            String(item.id) ===
            String(id)
    );

if (!banner) {

    alert(
        'Banner não encontrado.'
    );

    return false;
}

const titulo =
    obterTituloBanner(banner);

try {

    console.log(
        'Excluindo banner:',
        id
    );

    const resultado =
        await supabase
            .from('banners')
            .delete()
            .eq(
                'id',
                id
            )
            .select('id');

    console.log(
        'Resultado da exclusão:',
        resultado
    );

    if (resultado.error) {

        console.error(
            'Erro ao excluir banner:',
            resultado.error
        );

        alert(
            'Não foi possível excluir o banner.\n\n' +
            resultado.error.message
        );

        return false;
    }

    if (
        !resultado.data ||
        resultado.data.length === 0
    ) {

        alert(
            'Nenhum banner foi excluído. Verifique as permissões da tabela banners.'
        );

        return false;
    }

    alert(
        'Banner "' +
        titulo +
        '" excluído com sucesso!'
    );

    fecharModalExcluirBanner();

    await carregarBannersAdmin();

    return true;

} catch (erro) {

    console.error(
        'Erro inesperado ao excluir banner:',
        erro
    );

    alert(
        'Ocorreu um erro ao excluir o banner.'
    );

    return false;
}


}

/* ============================================================
13. EVENTOS DA LISTA
============================================================ */

function configurarEventosBanners() {


const lista =
    document.getElementById(
        'lista-banners'
    );

if (!lista) {
    return;
}

lista.addEventListener(
    'click',
    async function(event) {

        const editar =
            event.target.closest(
                '.btn-editar-banner'
            );

        if (editar) {

            editarBannerAdmin(
                editar.dataset.id
            );

            return;
        }

        const alterarStatus =
            event.target.closest(
                '.btn-ativar-banner, .btn-desativar-banner'
            );

        if (alterarStatus) {

            const id =
                alterarStatus.dataset.id;

            const banner =
                bannersAdmin.find(
                    item =>
                        String(item.id) ===
                        String(id)
                );

            if (!banner) {
                return;
            }

            const novoStatus =
                !obterStatusBanner(banner);

            alterarStatus.disabled =
                true;

            alterarStatus.textContent =
                novoStatus
                    ? 'Ativando...'
                    : 'Desativando...';

            await alterarStatusBanner(
                id,
                novoStatus
            );

            return;
        }

        const excluir =
            event.target.closest(
                '.btn-excluir-banner'
            );

        if (excluir) {

            abrirModalExcluirBanner(
                excluir.dataset.id
            );
        }
    }
);


}

/* ============================================================
14. EVENTOS DO MODAL
============================================================ */

function configurarModalBanners() {


const modal =
    document.getElementById(
        'modal-excluir-banner'
    );

const cancelar =
    document.getElementById(
        'btn-cancelar-exclusao'
    );

const confirmar =
    document.getElementById(
        'btn-confirmar-exclusao'
    );

if (cancelar) {

    cancelar.addEventListener(
        'click',
        function() {

            fecharModalExcluirBanner();

        }
    );
}

if (confirmar) {

    confirmar.addEventListener(
        'click',
        async function() {

            if (
                !bannerSelecionadoExclusao
            ) {
                return;
            }

            confirmar.disabled =
                true;

            confirmar.textContent =
                'Excluindo...';

            try {

                await excluirBannerAdmin(
                    bannerSelecionadoExclusao
                );

            } finally {

                confirmar.disabled =
                    false;

                confirmar.textContent =
                    'Excluir';
            }
        }
    );
}

if (modal) {

    modal.addEventListener(
        'click',
        function(event) {

            if (
                event.target ===
                modal
            ) {

                fecharModalExcluirBanner();
            }
        }
    );
}

document.addEventListener(
    'keydown',
    function(event) {

        if (
            event.key ===
            'Escape'
        ) {

            fecharModalExcluirBanner();
        }
    }
);


}

/* ============================================================
15. BOTÃO ATUALIZAR
============================================================ */

function configurarBotaoAtualizarBanners() {


const botao =
    document.getElementById(
        'btn-atualizar-banners'
    );

if (!botao) {
    return;
}

botao.addEventListener(
    'click',
    async function() {

        if (botao.disabled) {
            return;
        }

        botao.disabled =
            true;

        const textoOriginal =
            botao.textContent;

        botao.textContent =
            'Atualizando...';

        try {

            await carregarBannersAdmin();

        } finally {

            botao.disabled =
                false;

            botao.textContent =
                textoOriginal ||
                'Atualizar';
        }
    }
);


}

/* ============================================================
16. BOTÃO TENTAR NOVAMENTE
============================================================ */

function configurarBotaoTentarBanners() {


const botao =
    document.getElementById(
        'btn-tentar-banners'
    );

if (!botao) {
    return;
}

botao.addEventListener(
    'click',
    async function() {

        if (botao.disabled) {
            return;
        }

        botao.disabled =
            true;

        botao.textContent =
            'Carregando...';

        try {

            await carregarBannersAdmin();

        } finally {

            botao.disabled =
                false;

            botao.textContent =
                'Tentar novamente';
        }
    }
);


}

/* ============================================================
17. INICIALIZAÇÃO
============================================================ */

document.addEventListener(
'DOMContentLoaded',
async function() {


    console.log(
        '============================================================'
    );

    console.log(
        'ZoraVision - Administração de Banners'
    );

    console.log(
        'Inicializando página de banners...'
    );

    console.log(
        '============================================================'
    );

    configurarEventosBanners();

    configurarModalBanners();

    configurarBotaoAtualizarBanners();

    configurarBotaoTentarBanners();

    await carregarBannersAdmin();

    console.log(
        '============================================================'
    );

    console.log(
        'Inicialização dos banners finalizada.'
    );

    console.log(
        '============================================================'
    );
}


);

/* ============================================================
18. FUNÇÕES GLOBAIS
============================================================ */

window.carregarBannersAdmin =
carregarBannersAdmin;

window.renderizarBannersAdmin =
renderizarBannersAdmin;

window.editarBannerAdmin =
editarBannerAdmin;

window.alterarStatusBanner =
alterarStatusBanner;

window.excluirBannerAdmin =
excluirBannerAdmin;

window.abrirModalExcluirBanner =
abrirModalExcluirBanner;

window.fecharModalExcluirBanner =
fecharModalExcluirBanner;
