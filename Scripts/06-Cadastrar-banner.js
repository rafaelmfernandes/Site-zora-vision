let imagemBannerBase64 = '';
let bannerEmEdicao = null;
let textoBannerEscuro = false;

function obterSupabaseBanner() {
const conexao =
typeof _supabase !== 'undefined'
? _supabase
: window._supabase;

if (!conexao) {
    console.error('Cliente Supabase não encontrado.');
    return null;
}

return conexao;

}

function escaparHTML(valor) {
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

function comprimirImagem(file, larguraMaxima = 1200, qualidade = 0.75) {
return new Promise((resolve, reject) => {
if (!file) {
reject(new Error('Nenhuma imagem foi selecionada.'));
return;
}

    const leitor = new FileReader();

    leitor.onload = eventoLeitor => {
        const imagem = new Image();

        imagem.onload = () => {
            try {
                const escala =
                    Math.min(
                        1,
                        larguraMaxima / imagem.width
                    );

                const larguraFinal =
                    Math.round(
                        imagem.width * escala
                    );

                const alturaFinal =
                    Math.round(
                        imagem.height * escala
                    );

                const canvas =
                    document.createElement('canvas');

                canvas.width = larguraFinal;
                canvas.height = alturaFinal;

                const ctx =
                    canvas.getContext('2d');

                if (!ctx) {
                    reject(
                        new Error(
                            'Não foi possível criar o contexto da imagem.'
                        )
                    );
                    return;
                }

                ctx.drawImage(
                    imagem,
                    0,
                    0,
                    larguraFinal,
                    alturaFinal
                );

                try {
                    const dadosImagem =
                        ctx.getImageData(
                            0,
                            0,
                            larguraFinal,
                            alturaFinal
                        ).data;

                    let luminosidadeTotal = 0;
                    let quantidadePixels = 0;

                    const passo = 40;

                    for (
                        let i = 0;
                        i < dadosImagem.length;
                        i += 4 * passo
                    ) {
                        const vermelho =
                            dadosImagem[i];

                        const verde =
                            dadosImagem[i + 1];

                        const azul =
                            dadosImagem[i + 2];

                        const luminosidade =
                            vermelho * 0.299 +
                            verde * 0.587 +
                            azul * 0.114;

                        luminosidadeTotal +=
                            luminosidade;

                        quantidadePixels++;
                    }

                    const luminosidadeMedia =
                        quantidadePixels > 0
                            ? luminosidadeTotal /
                              quantidadePixels
                            : 0;

                    textoBannerEscuro =
                        luminosidadeMedia >= 165;

                } catch (erroLuminosidade) {
                    console.warn(
                        'Não foi possível analisar luminosidade:',
                        erroLuminosidade
                    );

                    textoBannerEscuro = false;
                }

                const imagemBase64 =
                    canvas.toDataURL(
                        'image/jpeg',
                        qualidade
                    );

                resolve(imagemBase64);

            } catch (erroImagem) {
                reject(
                    new Error(
                        'Não foi possível processar a imagem.'
                    )
                );
            }
        };

        imagem.onerror = () => {
            reject(
                new Error(
                    'Não foi possível carregar a imagem.'
                )
            );
        };

        imagem.src =
            eventoLeitor.target.result;
    };

    leitor.onerror = () => {
        reject(
            new Error(
                'Não foi possível ler o arquivo.'
            )
        );
    };

    leitor.readAsDataURL(file);
});

}

async function enviarImagemParaStorage(file) {
const supabase =
obterSupabaseBanner();

if (!supabase) {
    throw new Error(
        'Supabase não está disponível.'
    );
}

if (!file) {
    throw new Error(
        'Nenhuma imagem selecionada.'
    );
}

const imagemProcessada =
    await comprimirImagem(file);

const resposta =
    await fetch(imagemProcessada);

const blob =
    await resposta.blob();

const nomeArquivo =
    'banner-' +
    Date.now() +
    '-' +
    Math.random()
        .toString(36)
        .substring(2, 8) +
    '.jpg';

const { error: erroUpload } =
    await supabase.storage
        .from('banners')
        .upload(
            nomeArquivo,
            blob,
            {
                contentType: 'image/jpeg',
                upsert: false
            }
        );

if (erroUpload) {
    console.error(
        'Erro ao enviar imagem para o Storage:',
        erroUpload
    );

    throw erroUpload;
}

const { data: dadosUrl } =
    supabase.storage
        .from('banners')
        .getPublicUrl(
            nomeArquivo
        );

if (
    !dadosUrl ||
    !dadosUrl.publicUrl
) {
    throw new Error(
        'Não foi possível obter a URL pública da imagem.'
    );
}

return dadosUrl.publicUrl;

}

function atualizarPreviewBanner(
imagemUrl,
texto = 'Imagem atual do banner'
) {
const previewIcone =
document.getElementById(
'preview-icone-banner'
);

const previewTexto =
    document.getElementById(
        'preview-texto-banner'
    );

if (
    previewIcone &&
    imagemUrl
) {
    const novaImagem =
        document.createElement('img');

    novaImagem.id =
        'preview-icone-banner';

    novaImagem.src =
        imagemUrl;

    novaImagem.alt =
        'Prévia do banner';

    novaImagem.style.width =
        '100%';

    novaImagem.style.maxHeight =
        '120px';

    novaImagem.style.objectFit =
        'cover';

    novaImagem.style.borderRadius =
        '8px';

    novaImagem.style.marginBottom =
        '8px';

    previewIcone.replaceWith(
        novaImagem
    );
}

if (previewTexto) {
    previewTexto.innerHTML =
        '<strong>' +
        escaparHTML(texto) +
        '</strong>';
}

}

async function carregarBannerParaEdicao(id) {
const supabase =
obterSupabaseBanner();

if (!supabase) {
    return;
}

try {
    const {
        data: banner,
        error
    } =
        await supabase
            .from('banners')
            .select(
                'id,titulo,descricao,imagem_url,link_url,ordem,ativo,created_at,updated_at'
            )
            .eq(
                'id',
                id
            )
            .single();

    if (error) {
        console.error(
            'Erro ao buscar banner:',
            error
        );

        alert(
            'Não foi possível carregar o banner para edição.\n\n' +
            error.message
        );

        return;
    }

    if (!banner) {
        alert(
            'Banner não encontrado.'
        );

        return;
    }

    bannerEmEdicao =
        banner;

    const campoTitulo =
        document.getElementById(
            'banner-titulo'
        );

    const campoDescricao =
        document.getElementById(
            'banner-subtitulo'
        );

    const campoLink =
        document.getElementById(
            'banner-link-destino'
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

    if (campoLink) {
        campoLink.value =
            banner.link_url || '';
    }

    if (campoOrdem) {
        campoOrdem.value =
            banner.ordem ?? 1;
    }

    if (campoAtivo) {
        campoAtivo.checked =
            banner.ativo !== false;
    }

    if (banner.imagem_url) {
        imagemBannerBase64 =
            banner.imagem_url;

        atualizarPreviewBanner(
            banner.imagem_url,
            'Imagem atual do banner'
        );
    }

    const tituloPagina =
        document.querySelector(
            '.admin-titulo'
        );

    if (tituloPagina) {
        tituloPagina.textContent =
            'Editar Banner';
    }

    const btnSalvar =
        document.querySelector(
            '.btn-salvar-produto'
        );

    if (btnSalvar) {
        btnSalvar.textContent =
            'Salvar Alterações';
    }

} catch (erro) {
    console.error(
        'Erro ao carregar o banner:',
        erro
    );

    alert(
        'Ocorreu um erro ao carregar o banner.'
    );
}

}

async function cadastrarBanner(
dadosFormulario
) {
const supabase =
obterSupabaseBanner();

if (!supabase) {
    return false;
}

try {
    const {
        data,
        error
    } =
        await supabase
            .from('banners')
            .insert({
                titulo:
                    dadosFormulario.titulo,

                descricao:
                    dadosFormulario.descricao,

                imagem_url:
                    dadosFormulario.imagem_url,

                link_url:
                    dadosFormulario.link_url,

                ordem:
                    dadosFormulario.ordem,

                ativo:
                    dadosFormulario.ativo
            })
            .select(
                'id,titulo,descricao,imagem_url,link_url,ordem,ativo,created_at,updated_at'
            )
            .single();

    if (error) {
        console.error(
            'Erro ao cadastrar banner:',
            error
        );

        alert(
            'Não foi possível cadastrar o banner.\n\n' +
            error.message
        );

        return false;
    }

    console.log(
        'Banner cadastrado:',
        data
    );

    return true;

} catch (erro) {
    console.error(
        'Erro inesperado ao cadastrar banner:',
        erro
    );

    alert(
        'Ocorreu um erro ao cadastrar o banner.'
    );

    return false;
}

}

async function atualizarBanner(
id,
dadosFormulario
) {
const supabase =
obterSupabaseBanner();

if (!supabase) {
    return false;
}

try {
    const {
        data,
        error
    } =
        await supabase
            .from('banners')
            .update({
                titulo:
                    dadosFormulario.titulo,

                descricao:
                    dadosFormulario.descricao,

                imagem_url:
                    dadosFormulario.imagem_url,

                link_url:
                    dadosFormulario.link_url,

                ordem:
                    dadosFormulario.ordem,

                ativo:
                    dadosFormulario.ativo,

                updated_at:
                    new Date().toISOString()
            })
            .eq(
                'id',
                id
            )
            .select(
                'id,titulo,descricao,imagem_url,link_url,ordem,ativo,created_at,updated_at'
            )
            .single();

    if (error) {
        console.error(
            'Erro ao atualizar banner:',
            error
        );

        alert(
            'Não foi possível atualizar o banner.\n\n' +
            error.message
        );

        return false;
    }

    console.log(
        'Banner atualizado:',
        data
    );

    return true;

} catch (erro) {
    console.error(
        'Erro inesperado ao atualizar banner:',
        erro
    );

    alert(
        'Ocorreu um erro ao atualizar o banner.'
    );

    return false;
}

}

document.addEventListener(
'DOMContentLoaded',
async () => {

    const supabase =
        obterSupabaseBanner();

    if (!supabase) {
        console.error(
            'Supabase não está disponível.'
        );

        return;
    }

    const urlParams =
        new URLSearchParams(
            window.location.search
        );

    const idParaEditar =
        urlParams.get('id');

    if (idParaEditar) {
        await carregarBannerParaEdicao(
            idParaEditar
        );
    }

    const inputImagem =
        document.getElementById(
            'input-imagem-banner'
        );

    if (inputImagem) {

        inputImagem.addEventListener(
            'change',
            async function(event) {

                const file =
                    event.target.files[0];

                if (!file) {
                    return;
                }

                const previewTexto =
                    document.getElementById(
                        'preview-texto-banner'
                    );

                if (previewTexto) {
                    previewTexto.innerHTML =
                        '<strong>Otimizando imagem...</strong>';
                }

                try {

                    const imagemProcessada =
                        await comprimirImagem(
                            file
                        );

                    atualizarPreviewBanner(
                        imagemProcessada,
                        'Imagem pronta para envio'
                    );

                    imagemBannerBase64 =
                        imagemProcessada;

                    if (previewTexto) {

                        const tamanhoKb =
                            Math.round(
                                (
                                    imagemProcessada.length *
                                    0.75
                                ) / 1024
                            );

                        previewTexto.innerHTML =
                            '<strong>Imagem pronta!</strong> (~' +
                            tamanhoKb +
                            ' KB)';
                    }

                } catch (erro) {

                    console.error(
                        'Erro ao processar imagem:',
                        erro
                    );

                    alert(
                        'Não foi possível processar essa imagem. Tente outra.'
                    );

                    if (previewTexto) {
                        previewTexto.innerHTML =
                            '<strong>Clique aqui</strong> para adicionar uma imagem de fundo.';
                    }
                }
            }
        );
    }

    const formCadastrar =
        document.getElementById(
            'form-cadastrar-banner'
        );

    if (!formCadastrar) {
        console.error(
            'Formulário de banner não encontrado.'
        );

        return;
    }

    formCadastrar.addEventListener(
        'submit',
        async function(event) {

            event.preventDefault();

            const campoTitulo =
                document.getElementById(
                    'banner-titulo'
                );

            const campoDescricao =
                document.getElementById(
                    'banner-subtitulo'
                );

            const campoLink =
                document.getElementById(
                    'banner-link-destino'
                );

            const campoOrdem =
                document.getElementById(
                    'banner-ordem'
                );

            const campoAtivo =
                document.getElementById(
                    'banner-ativo'
                );

            const inputImagem =
                document.getElementById(
                    'input-imagem-banner'
                );

            const titulo =
                campoTitulo?.value
                    ?.trim() || '';

            const descricao =
                campoDescricao?.value
                    ?.trim() || '';

            const linkUrl =
                campoLink?.value
                    ?.trim() || '#';

            const ordemInformada =
                campoOrdem?.value
                    ?.trim();

            const ordem =
                ordemInformada
                    ? parseInt(
                        ordemInformada,
                        10
                    )
                    : 1;

            const ativo =
                campoAtivo
                    ? campoAtivo.checked
                    : true;

            if (!titulo) {
                alert(
                    'Preencha o título do banner.'
                );

                campoTitulo?.focus();

                return;
            }

            if (
                Number.isNaN(ordem) ||
                ordem < 1
            ) {
                alert(
                    'Informe uma ordem válida para o banner.'
                );

                campoOrdem?.focus();

                return;
            }

            const botaoSalvar =
                formCadastrar.querySelector(
                    'button[type="submit"]'
                );

            if (botaoSalvar) {
                botaoSalvar.disabled =
                    true;

                botaoSalvar.textContent =
                    'Salvando...';
            }

            try {

                let imagemUrlFinal =
                    '';

                if (
                    inputImagem &&
                    inputImagem.files &&
                    inputImagem.files[0]
                ) {

                    const previewTexto =
                        document.getElementById(
                            'preview-texto-banner'
                        );

                    if (previewTexto) {
                        previewTexto.innerHTML =
                            '<strong>Enviando imagem para o Storage...</strong>';
                    }

                    imagemUrlFinal =
                        await enviarImagemParaStorage(
                            inputImagem.files[0]
                        );

                } else if (
                    bannerEmEdicao &&
                    bannerEmEdicao.imagem_url
                ) {

                    imagemUrlFinal =
                        bannerEmEdicao.imagem_url;
                }

                const dadosFormulario = {

                    titulo:
                        titulo,

                    descricao:
                        descricao,

                    imagem_url:
                        imagemUrlFinal,

                    link_url:
                        linkUrl,

                    ordem:
                        ordem,

                    ativo:
                        ativo
                };

                let sucesso =
                    false;

                if (bannerEmEdicao) {

                    sucesso =
                        await atualizarBanner(
                            bannerEmEdicao.id,
                            dadosFormulario
                        );

                } else {

                    sucesso =
                        await cadastrarBanner(
                            dadosFormulario
                        );
                }

                if (sucesso) {

                    alert(
                        bannerEmEdicao
                            ? 'Banner atualizado com sucesso!'
                            : 'Banner cadastrado com sucesso!'
                    );

                    window.location.href =
                        'Admin/05-admin.html';

                } else {

                    if (botaoSalvar) {

                        botaoSalvar.disabled =
                            false;

                        botaoSalvar.textContent =
                            bannerEmEdicao
                                ? 'Salvar Alterações'
                                : 'Salvar Banner';
                    }
                }

            } catch (erro) {

                console.error(
                    'Erro ao salvar banner:',
                    erro
                );

                alert(
                    'Não foi possível salvar o banner.\n\n' +
                    (
                        erro.message ||
                        erro
                    )
                );

                if (botaoSalvar) {

                    botaoSalvar.disabled =
                        false;

                    botaoSalvar.textContent =
                        bannerEmEdicao
                            ? 'Salvar Alterações'
                            : 'Salvar Banner';
                }
            }
        }
    );
}

);

window.carregarBannerParaEdicao =
carregarBannerParaEdicao;

window.cadastrarBanner =
cadastrarBanner;

window.atualizarBanner =
atualizarBanner;

window.comprimirImagem =
comprimirImagem;

window.enviarImagemParaStorage =
enviarImagemParaStorage;