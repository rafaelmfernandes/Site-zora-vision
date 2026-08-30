let imagemBannerBase64 = '';
let bannerEmEdicao = null;
let textoBannerEscuro = false;

// ============================================================
// ZORAVISION - CADASTRO / EDIÇÃO DE BANNER
// ============================================================
// Usa a tabela "banners" do Supabase.
// Não utiliza localStorage para salvar banners.
// ============================================================

// ============================================================
// SUPABASE
// ============================================================

function obterSupabaseBanner() {


const conexao =
    typeof _supabase !== 'undefined'
        ? _supabase
        : window._supabase;

if (!conexao) {

    console.error(
        '❌ Cliente Supabase não encontrado.'
    );

    return null;
}

return conexao;


}

// ============================================================
// COMPRIMIR IMAGEM
// ============================================================

function comprimirImagem(
file,
larguraMaxima = 1200,
qualidade = 0.75
) {

return new Promise(
    (resolve, reject) => {

        const leitor =
            new FileReader();


        leitor.onload =
            eventoLeitor => {

                const imagem =
                    new Image();


                imagem.onload =
                    () => {

                        const escala =
                            Math.min(
                                1,
                                larguraMaxima /
                                imagem.width
                            );


                        const canvas =
                            document.createElement(
                                'canvas'
                            );


                        canvas.width =
                            imagem.width *
                            escala;


                        canvas.height =
                            imagem.height *
                            escala;


                        const ctx =
                            canvas.getContext(
                                '2d'
                            );


                        ctx.drawImage(
                            imagem,
                            0,
                            0,
                            canvas.width,
                            canvas.height
                        );


                        // ==========================================
                        // ANALISAR LUMINOSIDADE
                        // ==========================================

                        try {

                            const dadosImagem =
                                ctx.getImageData(
                                    0,
                                    0,
                                    canvas.width,
                                    canvas.height
                                ).data;


                            let luminosidadeTotal =
                                0;


                            let quantidadePixels =
                                0;


                            const passo =
                                40;


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
                                    (
                                        vermelho * 0.299 +
                                        verde * 0.587 +
                                        azul * 0.114
                                    );


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


                            console.log(
                                '🖼️ Luminosidade média:',
                                Math.round(
                                    luminosidadeMedia
                                )
                            );


                        }
                        catch (erroLuminosidade) {

                            console.warn(
                                '⚠️ Não foi possível analisar luminosidade:',
                                erroLuminosidade
                            );

                        }


                        resolve(
                            canvas.toDataURL(
                                'image/jpeg',
                                qualidade
                            )
                        );

                    };


                imagem.onerror =
                    () => {

                        reject(
                            new Error(
                                'Não foi possível processar a imagem.'
                            )
                        );

                    };


                imagem.src =
                    eventoLeitor.target.result;

            };


        leitor.onerror =
            () => {

                reject(
                    new Error(
                        'Não foi possível ler o arquivo.'
                    )
                );

            };


        leitor.readAsDataURL(
            file
        );

    }
);


}

// ============================================================
// CARREGAR BANNER PARA EDIÇÃO
// ============================================================

async function carregarBannerParaEdicao(
id
) {


const supabase =
    obterSupabaseBanner();


if (!supabase) {
    return;
}


try {

    console.log(
        '🔎 Buscando banner para edição:',
        id
    );


    const {
        data: banner,
        error
    } =
        await supabase
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
                'id',
                id
            )
            .single();


    if (error) {

        console.error(
            '❌ Erro ao buscar banner:',
            error
        );


        alert(
            'Não foi possível carregar o banner para edição.'
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


    console.log(
        '✅ Banner carregado:',
        banner
    );


    const campoTitulo =
        document.getElementById(
            'banner-titulo'
        );


    const campoDescricao =
        document.getElementById(
            'banner-descricao'
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


    // ==========================================
    // IMAGEM
    // ==========================================

    if (banner.imagem_url) {

        imagemBannerBase64 =
            banner.imagem_url;


        const previewIcone =
            document.getElementById(
                'preview-icone-banner'
            );


        const previewTexto =
            document.getElementById(
                'preview-texto-banner'
            );


        if (previewIcone) {

            previewIcone.outerHTML = `

                <img
                    id="preview-icone-banner"
                    src="${escaparHTML(banner.imagem_url)}"
                    alt="Banner atual"
                    style="
                        width:100%;
                        max-height:120px;
                        object-fit:cover;
                        border-radius:8px;
                        margin-bottom:8px;
                    "
                >

            `;

        }


        if (previewTexto) {

            previewTexto.innerHTML = `
                <strong>Imagem atual do banner</strong>
                (selecione outra para trocar)
            `;

        }

    }


    // ==========================================
    // TÍTULO DA PÁGINA
    // ==========================================

    const tituloPagina =
        document.querySelector(
            '.admin-titulo'
        );


    if (tituloPagina) {

        tituloPagina.textContent =
            'Editar Banner';

    }


    // ==========================================
    // BOTÃO SALVAR
    // ==========================================

    const btnSalvar =
        document.querySelector(
            '.btn-salvar-produto'
        );


    if (btnSalvar) {

        btnSalvar.textContent =
            'Salvar Alterações';

    }

}
catch (erro) {

    console.error(
        '❌ Erro inesperado ao carregar banner:',
        erro
    );


    alert(
        'Ocorreu um erro ao carregar o banner.'
    );

}
```

}

// ============================================================
// SALVAR NOVO BANNER
// ============================================================

async function cadastrarBanner(
dadosFormulario
) {


const supabase =
    obterSupabaseBanner();


if (!supabase) {
    return false;
}


try {

    console.log(
        '📤 Cadastrando novo banner...'
    );


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
            .select()
            .single();


    if (error) {

        console.error(
            '❌ Erro ao cadastrar banner:',
            error
        );


        alert(
            'Não foi possível cadastrar o banner.\n\n' +
            error.message
        );


        return false;

    }


    console.log(
        '✅ Banner cadastrado:',
        data
    );


    return true;

}
catch (erro) {

    console.error(
        '❌ Erro inesperado ao cadastrar banner:',
        erro
    );


    alert(
        'Ocorreu um erro ao cadastrar o banner.'
    );


    return false;

}
```

}

// ============================================================
// ATUALIZAR BANNER
// ============================================================

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

    console.log(
        '💾 Atualizando banner:',
        id
    );


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
            .select()
            .single();


    if (error) {

        console.error(
            '❌ Erro ao atualizar banner:',
            error
        );


        alert(
            'Não foi possível atualizar o banner.\n\n' +
            error.message
        );


        return false;

    }


    console.log(
        '✅ Banner atualizado:',
        data
    );


    return true;

}
catch (erro) {

    console.error(
        '❌ Erro inesperado ao atualizar banner:',
        erro
    );


    alert(
        'Ocorreu um erro ao atualizar o banner.'
    );


    return false;

}


}

// ============================================================
// INICIALIZAÇÃO
// ============================================================

document.addEventListener(
'DOMContentLoaded',
async () => {


    console.log(
        '=========================================='
    );


    console.log(
        '🟢 CADASTRO DE BANNER INICIADO'
    );


    console.log(
        '=========================================='
    );


    // ==========================================
    // VERIFICAR ID NA URL
    // ==========================================

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


    // ==========================================
    // UPLOAD DA IMAGEM
    // ==========================================

    const inputImagem =
        document.getElementById(
            'input-imagem-banner'
        );


    if (inputImagem) {

        inputImagem.addEventListener(
            'change',
            async function (event) {

                const file =
                    event.target.files[0];


                if (!file) {
                    return;
                }


                const previewIcone =
                    document.getElementById(
                        'preview-icone-banner'
                    );


                const previewTexto =
                    document.getElementById(
                        'preview-texto-banner'
                    );


                if (previewTexto) {

                    previewTexto.innerHTML =
                        '<strong>Otimizando imagem...</strong>';

                }


                try {

                    imagemBannerBase64 =
                        await comprimirImagem(
                            file
                        );


                    if (previewIcone) {

                        previewIcone.outerHTML = `

                            <img
                                id="preview-icone-banner"
                                src="${imagemBannerBase64}"
                                alt="Prévia do banner"
                                style="
                                    width:100%;
                                    max-height:120px;
                                    object-fit:cover;
                                    border-radius:8px;
                                    margin-bottom:8px;
                                "
                            >

                        `;

                    }


                    if (previewTexto) {

                        const tamanhoKb =
                            Math.round(
                                (
                                    imagemBannerBase64.length *
                                    0.75
                                ) / 1024
                            );


                        previewTexto.innerHTML =
                            `<strong>Imagem otimizada!</strong> (~${tamanhoKb} KB)`;

                    }

                }
                catch (erro) {

                    console.error(
                        '❌ Erro ao processar imagem:',
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


    // ==========================================
    // FORMULÁRIO
    // ==========================================

    const formCadastrar =
        document.getElementById(
            'form-cadastrar-banner'
        );


    if (formCadastrar) {

        formCadastrar.addEventListener(
            'submit',
            async function (event) {

                event.preventDefault();


                const campoTitulo =
                    document.getElementById(
                        'banner-titulo'
                    );


                const campoDescricao =
                    document.getElementById(
                        'banner-descricao'
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


                const titulo =
                    campoTitulo?.value
                        ?.trim() || '';


                const descricao =
                    campoDescricao?.value
                        ?.trim() || '';


                const linkUrl =
                    campoLink?.value
                        ?.trim() || '#';


                const ordem =
                    parseInt(
                        campoOrdem?.value
                    ) || 1;


                const ativo =
                    campoAtivo
                        ? campoAtivo.checked
                        : true;


                if (!titulo) {

                    alert(
                        'Preencha o título do banner.'
                    );


                    return;

                }


                // ==========================================
                // IMAGEM
                // ==========================================

                const imagemUrl =
                    imagemBannerBase64 || '';


                // ==========================================
                // DADOS DO BANNER
                // ==========================================

                const dadosFormulario = {

                    titulo:
                        titulo,

                    descricao:
                        descricao,

                    imagem_url:
                        imagemUrl,

                    link_url:
                        linkUrl,

                    ordem:
                        ordem,

                    ativo:
                        ativo

                };


                console.log(
                    '📋 Dados do banner:',
                    dadosFormulario
                );


                // ==========================================
                // DESABILITAR BOTÃO
                // ==========================================

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


                let sucesso = false;


                // ==========================================
                // EDITAR
                // ==========================================

                if (bannerEmEdicao) {

                    sucesso =
                        await atualizarBanner(
                            bannerEmEdicao.id,
                            dadosFormulario
                        );

                }


                // ==========================================
                // NOVO
                // ==========================================

                else {

                    sucesso =
                        await cadastrarBanner(
                            dadosFormulario
                        );

                }


                // ==========================================
                // RESULTADO
                // ==========================================

                if (sucesso) {

                    alert(
                        bannerEmEdicao
                            ? 'Banner atualizado com sucesso! ✅'
                            : 'Banner cadastrado com sucesso! 🚀'
                    );


                    window.location.href =
                        '05-admin.html';

                }
                else {

                    if (botaoSalvar) {

                        botaoSalvar.disabled =
                            false;


                        botaoSalvar.textContent =
                            bannerEmEdicao
                                ? 'Salvar Alterações'
                                : 'Cadastrar Banner';

                    }

                }

            }
        );

    }

}


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

// ============================================================
// FUNÇÕES GLOBAIS
// ============================================================

window.carregarBannerParaEdicao =
carregarBannerParaEdicao;

window.cadastrarBanner =
cadastrarBanner;

window.atualizarBanner =
atualizarBanner;
