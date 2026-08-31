// ============================================================
// ZORAVISION - CADASTRO E EDIÇÃO DE BANNERS
// ============================================================
// Arquivo: Admin/cadastro-banner.js
// ============================================================

let bannerEmEdicao = null;
let imagemBannerUrl = '';

// ============================================================
// 1. SUPABASE
// ============================================================

function obterSupabaseCadastroBanner() {


if (window.supabaseClient) {
    return window.supabaseClient;
}

if (window._supabase) {
    return window._supabase;
}

if (typeof window.obterSupabase === 'function') {
    return window.obterSupabase();
}

console.error('Cliente Supabase não encontrado.');

return null;


}

// ============================================================
// 2. ESCAPAR HTML
// ============================================================

function escaparHTMLBanner(valor) {


if (valor === null || valor === undefined) {
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
// 3. MENSAGEM
// ============================================================

function mostrarMensagemBanner(mensagem, tipo = 'erro') {


const elemento =
    document.getElementById('mensagem-formulario');

if (!elemento) {
    return;
}

elemento.textContent = mensagem;

elemento.className =
    'form-mensagem ' + tipo;


}

function limparMensagemBanner() {


const elemento =
    document.getElementById('mensagem-formulario');

if (!elemento) {
    return;
}

elemento.textContent = '';

elemento.className =
    'form-mensagem';


}

// ============================================================
// 4. COMPRIMIR IMAGEM
// ============================================================

function comprimirImagemBanner(
file,
larguraMaxima = 1600,
qualidade = 0.80
) {


return new Promise(
    (resolve, reject) => {

        if (!file) {

            reject(
                new Error(
                    'Nenhuma imagem selecionada.'
                )
            );

            return;
        }

        const leitor = new FileReader();

        leitor.onload = function(evento) {

            const imagem = new Image();

            imagem.onload = function() {

                try {

                    const escala =
                        Math.min(
                            1,
                            larguraMaxima /
                            imagem.width
                        );

                    const larguraFinal =
                        Math.round(
                            imagem.width *
                            escala
                        );

                    const alturaFinal =
                        Math.round(
                            imagem.height *
                            escala
                        );

                    const canvas =
                        document.createElement(
                            'canvas'
                        );

                    canvas.width =
                        larguraFinal;

                    canvas.height =
                        alturaFinal;

                    const contexto =
                        canvas.getContext(
                            '2d'
                        );

                    if (!contexto) {

                        reject(
                            new Error(
                                'Não foi possível processar a imagem.'
                            )
                        );

                        return;
                    }

                    contexto.drawImage(
                        imagem,
                        0,
                        0,
                        larguraFinal,
                        alturaFinal
                    );

                    canvas.toBlob(
                        function(blob) {

                            if (!blob) {

                                reject(
                                    new Error(
                                        'Não foi possível gerar a imagem.'
                                    )
                                );

                                return;
                            }

                            resolve(blob);
                        },
                        'image/jpeg',
                        qualidade
                    );

                } catch (erro) {

                    reject(
                        new Error(
                            'Não foi possível processar a imagem.'
                        )
                    );
                }
            };

            imagem.onerror = function() {

                reject(
                    new Error(
                        'Não foi possível carregar a imagem.'
                    )
                );
            };

            imagem.src =
                evento.target.result;
        };

        leitor.onerror = function() {

            reject(
                new Error(
                    'Não foi possível ler a imagem.'
                )
            );
        };

        leitor.readAsDataURL(file);
    }
);


}

// ============================================================
// 5. PREVIEW
// ============================================================

function mostrarPreviewImagemBanner(imagemUrl) {


const preview =
    document.getElementById(
        'preview-imagem-banner'
    );

if (!preview) {
    return;
}

if (!imagemUrl) {

    preview.innerHTML =
        '<span class="upload-icone">🖼️</span>' +
        '<strong>Adicionar imagem</strong>' +
        '<small>Selecione a imagem do banner</small>';

    return;
}

preview.innerHTML =
    '<img src="' +
    escaparHTMLBanner(imagemUrl) +
    '" alt="Imagem do banner">';


}

// ============================================================
// 6. STATUS DA IMAGEM
// ============================================================

function atualizarStatusImagemBanner(mensagem) {


const elemento =
    document.getElementById(
        'status-imagem-banner'
    );

if (!elemento) {
    return;
}

elemento.textContent =
    mensagem;


}

// ============================================================
// 7. ENVIAR IMAGEM PARA STORAGE
// ============================================================

async function enviarImagemBannerStorage(file) {


const supabase =
    obterSupabaseCadastroBanner();

if (!supabase) {

    throw new Error(
        'Supabase não está disponível.'
    );
}

const blob =
    await comprimirImagemBanner(file);

const nomeArquivo =
    'banner-' +
    Date.now() +
    '-' +
    Math.random()
        .toString(36)
        .substring(2, 8) +
    '.jpg';

console.log(
    'Enviando imagem do banner:',
    nomeArquivo
);

const resultado =
    await supabase
        .storage
        .from('banners')
        .upload(
            nomeArquivo,
            blob,
            {
                contentType:
                    'image/jpeg',

                upsert:
                    false
            }
        );

if (resultado.error) {

    console.error(
        'Erro ao enviar imagem:',
        resultado.error
    );

    throw resultado.error;
}

const publicUrl =
    supabase
        .storage
        .from('banners')
        .getPublicUrl(
            nomeArquivo
        );

if (
    !publicUrl ||
    !publicUrl.data ||
    !publicUrl.data.publicUrl
) {

    throw new Error(
        'Não foi possível obter a URL da imagem.'
    );
}

console.log(
    'Imagem do banner enviada com sucesso.'
);

return publicUrl.data.publicUrl;


}

// ============================================================
// 8. CARREGAR BANNER PARA EDIÇÃO
// ============================================================

async function carregarBannerParaEdicao(id) {


const supabase =
    obterSupabaseCadastroBanner();

if (!supabase) {
    return;
}

console.log(
    'Carregando banner para edição:',
    id
);

try {

    const resultado =
        await supabase
            .from('banners')
            .select('*')
            .eq(
                'id',
                id
            );

    console.log(
        'Resultado do banner:',
        resultado
    );

    if (resultado.error) {

        console.error(
            'Erro ao carregar banner:',
            resultado.error
        );

        mostrarMensagemBanner(
            'Não foi possível carregar o banner.'
        );

        return;
    }

    const dados =
        resultado.data || [];

    if (dados.length === 0) {

        mostrarMensagemBanner(
            'Banner não encontrado.'
        );

        return;
    }

    bannerEmEdicao =
        dados[0];

    preencherFormularioBanner(
        bannerEmEdicao
    );

} catch (erro) {

    console.error(
        'Erro inesperado:',
        erro
    );

    mostrarMensagemBanner(
        'Ocorreu um erro ao carregar o banner.'
    );
}


}

// ============================================================
// 9. PREENCHER FORMULÁRIO
// ============================================================

function preencherFormularioBanner(banner) {


const campoTitulo =
    document.getElementById(
        'banner-titulo'
    );

const campoDescricao =
    document.getElementById(
        'banner-descricao'
    );

const campoSelo =
    document.getElementById(
        'banner-selo'
    );

const campoTextoBotao =
    document.getElementById(
        'banner-texto-botao'
    );

const campoLink =
    document.getElementById(
        'banner-link'
    );

const campoOrdem =
    document.getElementById(
        'banner-ordem'
    );

const campoAtivo =
    document.getElementById(
        'banner-ativo'
    );


if (campoTitulo) {
    campoTitulo.value =
        banner.titulo || '';
}


if (campoDescricao) {
    campoDescricao.value =
        banner.descricao || '';
}


if (campoSelo) {
    campoSelo.value =
        banner.selo || '';
}


if (campoTextoBotao) {
    campoTextoBotao.value =
        banner.texto_botao || '';
}


if (campoLink) {
    campoLink.value =
        banner.link_url || '';
}


if (campoOrdem) {
    campoOrdem.value =
        banner.ordem ?? 0;
}


if (campoAtivo) {
    campoAtivo.checked =
        banner.ativo !== false;
}


imagemBannerUrl =
    banner.imagem_url ||
    '';


if (imagemBannerUrl) {

    mostrarPreviewImagemBanner(
        imagemBannerUrl
    );

    atualizarStatusImagemBanner(
        'Imagem atual do banner.'
    );
}


const tituloPagina =
    document.getElementById(
        'titulo-pagina'
    );

if (tituloPagina) {

    tituloPagina.textContent =
        'Editar banner';
}


const descricaoPagina =
    document.getElementById(
        'descricao-pagina'
    );

if (descricaoPagina) {

    descricaoPagina.textContent =
        'Atualize as informações do banner.';
}


const botaoSalvar =
    document.getElementById(
        'btn-salvar-banner'
    );

if (botaoSalvar) {

    botaoSalvar.textContent =
        'Salvar alterações';
}


}

// ============================================================
// 10. VALIDAR FORMULÁRIO
// ============================================================

function validarFormularioBanner() {


const campoTitulo =
    document.getElementById(
        'banner-titulo'
    );

const campoDescricao =
    document.getElementById(
        'banner-descricao'
    );

const campoSelo =
    document.getElementById(
        'banner-selo'
    );

const campoTextoBotao =
    document.getElementById(
        'banner-texto-botao'
    );

const campoLink =
    document.getElementById(
        'banner-link'
    );

const campoOrdem =
    document.getElementById(
        'banner-ordem'
    );

const campoAtivo =
    document.getElementById(
        'banner-ativo'
    );


const titulo =
    campoTitulo?.value
        ?.trim() || '';


const descricao =
    campoDescricao?.value
        ?.trim() || '';


const selo =
    campoSelo?.value
        ?.trim() || '';


const textoBotao =
    campoTextoBotao?.value
        ?.trim() || '';


const linkUrl =
    campoLink?.value
        ?.trim() || '';


const ordemTexto =
    campoOrdem?.value
        ?.trim() || '0';


const ordem =
    Number(
        ordemTexto
    );


if (!titulo) {

    mostrarMensagemBanner(
        'Informe o título do banner.'
    );

    campoTitulo?.focus();

    return null;
}


if (
    Number.isNaN(ordem) ||
    ordem < 0
) {

    mostrarMensagemBanner(
        'Informe uma ordem de exibição válida.'
    );

    campoOrdem?.focus();

    return null;
}


return {

    titulo:
        titulo,

    descricao:
        descricao || null,

    selo:
        selo || null,

    texto_botao:
        textoBotao || null,

    link_url:
        linkUrl || null,

    ordem:
        Math.floor(
            ordem
        ),

    ativo:
        campoAtivo?.checked !== false,

    imagem_url:
        imagemBannerUrl || null
};


}

// ============================================================
// 11. CADASTRAR BANNER
// ============================================================

async function cadastrarBanner(dados) {


const supabase =
    obterSupabaseCadastroBanner();

if (!supabase) {

    throw new Error(
        'Supabase não está disponível.'
    );
}

console.log(
    'Cadastrando banner:',
    dados
);

const resultado =
    await supabase
        .from('banners')
        .insert(
            dados
        )
        .select('*');

console.log(
    'Resultado do cadastro:',
    resultado
);

if (resultado.error) {
    throw resultado.error;
}

return resultado.data;


}

// ============================================================
// 12. ATUALIZAR BANNER
// ============================================================

async function atualizarBanner(id, dados) {


const supabase =
    obterSupabaseCadastroBanner();

if (!supabase) {

    throw new Error(
        'Supabase não está disponível.'
    );
}

console.log(
    'Atualizando banner:',
    id
);


const dadosAtualizacao = {
    ...dados
};


if (
    bannerEmEdicao &&
    'updated_at' in bannerEmEdicao
) {

    dadosAtualizacao.updated_at =
        new Date().toISOString();
}


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
    'Resultado da atualização:',
    resultado
);


if (resultado.error) {
    throw resultado.error;
}


if (
    !resultado.data ||
    resultado.data.length === 0
) {

    throw new Error(
        'Nenhum banner foi atualizado. Verifique se o banner existe e se o administrador possui permissão.'
    );
}


return resultado.data[0];


}

// ============================================================
// 13. CONFIGURAR IMAGEM
// ============================================================

function configurarImagemBanner() {


const input =
    document.getElementById(
        'input-imagem-banner'
    );

if (!input) {
    return;
}


input.addEventListener(
    'change',
    async function(event) {

        const file =
            event.target.files?.[0];


        if (!file) {
            return;
        }


        if (
            !file.type.startsWith(
                'image/'
            )
        ) {

            alert(
                'Selecione um arquivo de imagem válido.'
            );

            input.value =
                '';

            return;
        }


        atualizarStatusImagemBanner(
            'Processando imagem...'
        );


        try {

            const blob =
                await comprimirImagemBanner(
                    file
                );


            const previewUrl =
                URL.createObjectURL(
                    blob
                );


            mostrarPreviewImagemBanner(
                previewUrl
            );


            imagemBannerUrl =
                '';


            input._imagemProcessada =
                blob;


            atualizarStatusImagemBanner(
                'Imagem pronta para envio.'
            );


        } catch (erro) {

            console.error(
                'Erro ao processar imagem:',
                erro
            );


            alert(
                'Não foi possível processar a imagem.'
            );


            input.value =
                '';


            atualizarStatusImagemBanner(
                'Nenhuma imagem selecionada.'
            );
        }
    }
);


}

// ============================================================
// 14. FORMULÁRIO
// ============================================================

function configurarFormularioBanner() {


const formulario =
    document.getElementById(
        'form-cadastro-banner'
    );


if (!formulario) {

    console.error(
        'Formulário de banner não encontrado.'
    );

    return;
}


console.log(
    'Formulário de banner encontrado.'
);


formulario.addEventListener(
    'submit',
    async function(event) {

        event.preventDefault();


        limparMensagemBanner();


        const dados =
            validarFormularioBanner();


        if (!dados) {
            return;
        }


        const botao =
            document.getElementById(
                'btn-salvar-banner'
            );


        if (botao) {

            botao.disabled =
                true;

            botao.textContent =
                'Salvando...';
        }


        try {

            const inputImagem =
                document.getElementById(
                    'input-imagem-banner'
                );


            const arquivoImagem =
                inputImagem?.files?.[0];


            if (arquivoImagem) {

                mostrarMensagemBanner(
                    'Enviando imagem...',
                    'sucesso'
                );


                const urlImagem =
                    await enviarImagemBannerStorage(
                        arquivoImagem
                    );


                dados.imagem_url =
                    urlImagem;


                imagemBannerUrl =
                    urlImagem;
            }


            let resultado;


            if (bannerEmEdicao) {

                resultado =
                    await atualizarBanner(
                        bannerEmEdicao.id,
                        dados
                    );

            } else {

                resultado =
                    await cadastrarBanner(
                        dados
                    );
            }


            console.log(
                'Banner salvo:',
                resultado
            );


            mostrarMensagemBanner(
                bannerEmEdicao
                    ? 'Banner atualizado com sucesso!'
                    : 'Banner cadastrado com sucesso!',
                'sucesso'
            );


            setTimeout(
                function() {

                    window.location.href =
                        'admin-banners.html';

                },
                800
            );


        } catch (erro) {

            console.error(
                'Erro ao salvar banner:',
                erro
            );


            mostrarMensagemBanner(
                'Não foi possível salvar o banner: ' +
                (
                    erro.message ||
                    'Erro desconhecido.'
                )
            );


            if (botao) {

                botao.disabled =
                    false;

                botao.textContent =
                    bannerEmEdicao
                        ? 'Salvar alterações'
                        : 'Salvar banner';
            }
        }
    }
);


}

// ============================================================
// 15. INICIALIZAÇÃO
// ============================================================

document.addEventListener(
'DOMContentLoaded',
async function() {


    console.log(
        '============================================================'
    );

    console.log(
        'ZoraVision - Cadastro de Banner'
    );

    console.log(
        'Inicializando página...'
    );

    console.log(
        '============================================================'
    );


    const formulario =
        document.getElementById(
            'form-cadastro-banner'
        );


    if (!formulario) {

        console.error(
            'ERRO: form-cadastro-banner não encontrado.'
        );

        return;
    }


    const supabase =
        obterSupabaseCadastroBanner();


    if (!supabase) {

        console.error(
            'Supabase não disponível.'
        );

        mostrarMensagemBanner(
            'Não foi possível conectar ao sistema.'
        );

        return;
    }


    configurarImagemBanner();

    configurarFormularioBanner();


    const parametros =
        new URLSearchParams(
            window.location.search
        );


    const id =
        parametros.get(
            'id'
        );


    if (id) {

        await carregarBannerParaEdicao(
            id
        );

        console.log(
            'Modo edição de banner.'
        );

    } else {

        console.log(
            'Modo cadastro de banner.'
        );
    }


    console.log(
        'Cadastro de banner inicializado.'
    );
}


);

// ============================================================
// 16. FUNÇÕES GLOBAIS
// ============================================================

window.carregarBannerParaEdicao =
carregarBannerParaEdicao;

window.cadastrarBanner =
cadastrarBanner;

window.atualizarBanner =
atualizarBanner;

window.comprimirImagemBanner =
comprimirImagemBanner;

window.enviarImagemBannerStorage =
enviarImagemBannerStorage;
