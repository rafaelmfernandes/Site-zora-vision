// ============================================================
// ZORAVISION - ADMINISTRAÇÃO DE BANNERS
// ============================================================
// Arquivo: Admin/banners-admin.js
//
// Responsabilidades:
// - Buscar banners no Supabase
// - Exibir banners
// - Contar banners cadastrados
// - Contar banners ativos
// - Buscar/filtrar banners
// - Editar banner
// - Excluir banner
// - Atualizar lista
// ============================================================

// ============================================================
// 1. VARIÁVEIS
// ============================================================

let bannersAdmin = [];

let bannerSelecionadoExclusao = null;

// ============================================================
// 2. SUPABASE
// ============================================================

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
// 3. ESCAPAR HTML
// ============================================================

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

// ============================================================
// 4. OBTER IMAGEM
// ============================================================

function obterImagemBanner(banner) {


if (!banner) {
    return '';
}

return (
    banner.imagem_url ||
    banner.imagem ||
    banner.foto_url ||
    banner.url_imagem ||
    banner.banner_url ||
    ''
);


}

// ============================================================
// 5. OBTER TÍTULO
// ============================================================

function obterTituloBanner(banner) {

if (!banner) {
    return 'Banner sem título';
}

return (
    banner.titulo ||
    banner.nome ||
    banner.title ||
    'Banner sem título'
);


}

// ============================================================
// 6. OBTER DESCRIÇÃO
// ============================================================

function obterDescricaoBanner(banner) {


if (!banner) {
    return '';
}

return (
    banner.descricao ||
    banner.description ||
    banner.subtitulo ||
    ''
);


}

// ============================================================
// 7. OBTER STATUS
// ============================================================

function obterStatusBanner(banner) {


if (!banner) {
    return false;
}

return banner.ativo !== false;


}

// ============================================================
// 8. ESTADOS DA PÁGINA
// ============================================================

function esconderEstadoBanners() {


const carregando =
    document.getElementById(
        'banners-carregando'
    );

const vazio =
    document.getElementById(
        'banners-vazio'
    );

const erro =
    document.getElementById(
        'banners-erro'
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

function mostrarCarregandoBanners() {


esconderEstadoBanners();

const carregando =
    document.getElementById(
        'banners-carregando'
    );

if (carregando) {
    carregando.hidden = false;
}


}

function mostrarBannersVazio() {


esconderEstadoBanners();

const vazio =
    document.getElementById(
        'banners-vazio'
    );

if (vazio) {
    vazio.hidden = false;
}


}

function mostrarErroBanners(
mensagem
) {


esconderEstadoBanners();

const erro =
    document.getElementById(
        'banners-erro'
    );

const mensagemErro =
    document.getElementById(
        'mensagem-erro-banners'
    );

if (mensagemErro) {
    mensagemErro.textContent =
        mensagem ||
        'Não foi possível carregar os banners.';
}

if (erro) {
    erro.hidden = false;
}


}

// ============================================================
// 9. ATUALIZAR RESUMO
// ============================================================

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
                obterStatusBanner(
                    banner
                )
        ).length;

    ativos.textContent =
        quantidadeAtivos;
}


}

// ============================================================
// 10. CARREGAR BANNERS
// ============================================================

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

    console.error(
        'Supabase não disponível.'
    );

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
                'created_at',
                {
                    ascending: false
                }
            );

    console.log(
        'Resposta da tabela banners:',
        resultado
    );

    const data =
        resultado?.data || [];

    const error =
        resultado?.error || null;

    if (error) {

        console.error(
            'Erro Supabase:',
            error
        );

        bannersAdmin = [];

        atualizarResumoBanners();

        mostrarErroBanners(
            error.message ||
            'Erro ao carregar banners.'
        );

        return;
    }

    bannersAdmin =
        Array.isArray(data)
            ? data
            : [];

    console.log(
        'Quantidade de banners:',
        bannersAdmin.length
    );

    atualizarResumoBanners();

    esconderEstadoBanners();

    if (
        bannersAdmin.length === 0
    ) {

        lista.innerHTML = '';

        mostrarBannersVazio();

        console.log(
            'Nenhum banner cadastrado.'
        );

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

// ============================================================
// 11. RENDERIZAR BANNERS
// ============================================================

function renderizarBannersAdmin() {


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
                criarCardBanner(
                    banner
                )
        )
        .join('');


}

// ============================================================
// 12. CRIAR CARD
// ============================================================

function criarCardBanner(banner) {


const id =
    banner.id;

const titulo =
    escaparHTMLBanner(
        obterTituloBanner(
            banner
        )
    );

const descricao =
    escaparHTMLBanner(
        obterDescricaoBanner(
            banner
        )
    );

const imagem =
    obterImagemBanner(
        banner
    );

const ativo =
    obterStatusBanner(
        banner
    );

let imagemHTML;

if (imagem) {

    imagemHTML =
        '<img ' +
            'class="banner-admin-imagem" ' +
            'src="' +
                escaparHTMLBanner(
                    imagem
                ) +
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
    banner.ordem !== undefined &&
    banner.ordem !== null
) {

    informacoesHTML +=
        '<span class="banner-info-item">' +
            'Ordem: ' +
            escaparHTMLBanner(
                banner.ordem
            ) +
        '</span>';
}

if (
    banner.link_url
) {

    informacoesHTML +=
        '<span class="banner-info-item">' +
            'Link configurado' +
        '</span>';
}

return (

    '<article class="banner-admin-card" ' +
        'data-id="' +
            escaparHTMLBanner(
                id
            ) +
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
                    escaparHTMLBanner(
                        id
                    ) +
                '">' +
                'Editar' +
            '</button>' +

            '<button ' +
                'type="button" ' +
                'class="btn-excluir-banner" ' +
                'data-id="' +
                    escaparHTMLBanner(
                        id
                    ) +
                '">' +
                'Excluir' +
            '</button>' +

        '</div>' +

    '</article>'
);


}

// ============================================================
// 13. EDITAR
// ============================================================

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
    encodeURIComponent(
        id
    );


}

// ============================================================
// 14. MODAL
// ============================================================

function abrirModalExcluirBanner(id) {


const modal =
    document.getElementById(
        'modal-excluir-banner'
    );

if (!modal) {

    excluirBannerAdmin(
        id
    );

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

// ============================================================
// 15. EXCLUIR
// ============================================================

async function excluirBannerAdmin(id) {


const supabase =
    obterSupabaseBannersAdmin();

if (!supabase) {

    alert(
        'Supabase não está disponível.'
    );

    return;
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

    return;
}

const titulo =
    obterTituloBanner(
        banner
    );

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

        return;
    }

    console.log(
        'Banner excluído com sucesso.'
    );

    alert(
        'Banner "' +
        titulo +
        '" excluído com sucesso!'
    );

    fecharModalExcluirBanner();

    await carregarBannersAdmin();

} catch (erro) {

    console.error(
        'Erro inesperado ao excluir banner:',
        erro
    );

    alert(
        'Ocorreu um erro ao excluir o banner.'
    );
}


}

// ============================================================
// 16. EVENTOS DA LISTA
// ============================================================

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
    function(event) {

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

// ============================================================
// 17. EVENTOS DO MODAL
// ============================================================

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

// ============================================================
// 18. BOTÃO ATUALIZAR
// ============================================================

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

        if (
            botao.disabled
        ) {
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

// ============================================================
// 19. BOTÃO TENTAR NOVAMENTE
// ============================================================

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

        if (
            botao.disabled
        ) {
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

// ============================================================
// 20. INICIALIZAÇÃO
// ============================================================

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

// ============================================================
// 21. FUNÇÕES GLOBAIS
// ============================================================

window.carregarBannersAdmin =
carregarBannersAdmin;

window.renderizarBannersAdmin =
renderizarBannersAdmin;

window.editarBannerAdmin =
editarBannerAdmin;

window.excluirBannerAdmin =
excluirBannerAdmin;

window.abrirModalExcluirBanner =
abrirModalExcluirBanner;

window.fecharModalExcluirBanner =
fecharModalExcluirBanner;
