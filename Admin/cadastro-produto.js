const NOME_BUCKET_PRODUTOS = 'Produtos';

let produtoEmEdicao = null;
let imagemProdutoUrl = '';

function obterSupabaseCadastroProduto() {

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

function escaparHTMLCadastroProduto(valor) {


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

function mostrarMensagemFormulario(
mensagem,
tipo = 'erro'
) {


const elemento =
    document.getElementById(
        'mensagem-formulario'
    );

if (!elemento) {
    return;
}

elemento.textContent =
    mensagem;

elemento.className =
    'form-mensagem ' +
    tipo;


}

function limparMensagemFormulario() {


const elemento =
    document.getElementById(
        'mensagem-formulario'
    );

if (!elemento) {
    return;
}

elemento.textContent = '';

elemento.className =
    'form-mensagem';


}

async function carregarCategoriasProduto() {


const supabase =
    obterSupabaseCadastroProduto();

if (!supabase) {
    console.error(
        'Supabase não disponível para carregar categorias.'
    );
    return false;
}

const campoCategoria =
    document.getElementById(
        'produto-categoria'
    );

if (!campoCategoria) {
    console.error(
        'Campo produto-categoria não encontrado.'
    );
    return false;
}

try {

    console.log(
        'Carregando categorias da tabela categorias...'
    );

    campoCategoria.innerHTML =
        '<option value="">Carregando categorias...</option>';

    campoCategoria.disabled = true;

    const resultado =
        await supabase
            .from('categorias')
            .select('*')
            .order(
                'nome',
                {
                    ascending: true
                }
            );

    if (resultado.error) {

        console.error(
            'Erro ao carregar categorias:',
            resultado.error
        );

        campoCategoria.innerHTML =
            '<option value="">Não foi possível carregar as categorias</option>';

        campoCategoria.disabled = false;

        return false;
    }

    const categorias =
        resultado.data || [];

    console.log(
        'Categorias encontradas:',
        categorias
    );

    campoCategoria.innerHTML =
        '<option value="">Selecione uma categoria</option>';

    categorias.forEach(
        function(categoria) {

            const option =
                document.createElement(
                    'option'
                );

            option.value =
                categoria.id;

            option.textContent =
                categoria.nome ||
                'Categoria sem nome';

            campoCategoria.appendChild(
                option
            );
        }
    );

    campoCategoria.disabled = false;

    if (
        produtoEmEdicao &&
        produtoEmEdicao.categoria_id !== null &&
        produtoEmEdicao.categoria_id !== undefined
    ) {

        campoCategoria.value =
            String(
                produtoEmEdicao.categoria_id
            );

        console.log(
            'Categoria do produto selecionada:',
            produtoEmEdicao.categoria_id
        );
    }

    console.log(
        'Categorias carregadas:',
        categorias.length
    );

    return true;

} catch (erro) {

    console.error(
        'Erro inesperado ao carregar categorias:',
        erro
    );

    campoCategoria.innerHTML =
        '<option value="">Erro ao carregar categorias</option>';

    campoCategoria.disabled = false;

    return false;
}


}

function comprimirImagemProduto(
file,
larguraMaxima = 1200,
qualidade = 0.75
) {


return new Promise(
    function(resolve, reject) {

        if (!file) {

            reject(
                new Error(
                    'Nenhuma imagem selecionada.'
                )
            );

            return;
        }

        const leitor =
            new FileReader();

        leitor.onload =
            function(evento) {

                const imagem =
                    new Image();

                imagem.onload =
                    function() {

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

                            const base64 =
                                canvas.toDataURL(
                                    'image/jpeg',
                                    qualidade
                                );

                            resolve(
                                base64
                            );

                        } catch (erro) {

                            console.error(
                                'Erro ao comprimir imagem:',
                                erro
                            );

                            reject(
                                new Error(
                                    'Não foi possível processar a imagem.'
                                )
                            );
                        }
                    };

                imagem.onerror =
                    function() {

                        reject(
                            new Error(
                                'Não foi possível carregar a imagem.'
                            )
                        );
                    };

                imagem.src =
                    evento.target.result;
            };

        leitor.onerror =
            function() {

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

async function enviarImagemProdutoStorage(
file
) {


const supabase =
    obterSupabaseCadastroProduto();

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

console.log(
    'Processando imagem do produto...'
);

const imagemProcessada =
    await comprimirImagemProduto(
        file
    );

const resposta =
    await fetch(
        imagemProcessada
    );

const blob =
    await resposta.blob();

const nomeArquivo =
    'produto-' +
    Date.now() +
    '-' +
    Math.random()
        .toString(36)
        .substring(2, 8) +
    '.jpg';

console.log(
    'Bucket utilizado:',
    NOME_BUCKET_PRODUTOS
);

console.log(
    'Nome do arquivo:',
    nomeArquivo
);

const resultadoUpload =
    await supabase.storage
        .from(
            NOME_BUCKET_PRODUTOS
        )
        .upload(
            nomeArquivo,
            blob,
            {
                contentType:
                    'image/jpeg',

                cacheControl:
                    '3600',

                upsert:
                    false
            }
        );

if (resultadoUpload.error) {

    console.error(
        'Erro ao enviar imagem para o Storage:',
        resultadoUpload.error
    );

    throw resultadoUpload.error;
}

const resultadoUrl =
    supabase.storage
        .from(
            NOME_BUCKET_PRODUTOS
        )
        .getPublicUrl(
            nomeArquivo
        );

if (
    !resultadoUrl ||
    !resultadoUrl.data ||
    !resultadoUrl.data.publicUrl
) {

    throw new Error(
        'Não foi possível obter a URL pública da imagem.'
    );
}

console.log(
    'Imagem enviada com sucesso:',
    resultadoUrl.data.publicUrl
);

return resultadoUrl.data.publicUrl;


}

function mostrarPreviewImagemProduto(
imagemUrl
) {


const preview =
    document.getElementById(
        'preview-imagem-produto'
    );

if (!preview) {
    return;
}

if (!imagemUrl) {

    preview.innerHTML =
        '<span class="upload-icone">📷</span>' +
        '<strong>Adicionar imagem</strong>' +
        '<small>Toque para selecionar uma imagem</small>';

    return;
}

preview.innerHTML =
    '<img src="' +
    escaparHTMLCadastroProduto(
        imagemUrl
    ) +
    '" alt="Imagem do produto">';


}

function atualizarStatusImagemProduto(
mensagem
) {


const elemento =
    document.getElementById(
        'status-imagem-produto'
    );

if (!elemento) {
    return;
}

elemento.textContent =
    mensagem;


}

async function carregarProdutoParaEdicao(
id
) {


const supabase =
    obterSupabaseCadastroProduto();

if (!supabase) {
    return;
}

console.log(
    'Carregando produto para edição:',
    id
);

try {

    const resultado =
        await supabase
            .from('produtos')
            .select('*')
            .eq(
                'id',
                id
            )
            .single();

    if (resultado.error) {

        console.error(
            'Erro ao carregar produto:',
            resultado.error
        );

        mostrarMensagemFormulario(
            'Não foi possível carregar o produto.'
        );

        return;
    }

    if (!resultado.data) {

        mostrarMensagemFormulario(
            'Produto não encontrado.'
        );

        return;
    }

    produtoEmEdicao =
        resultado.data;

    console.log(
        'Produto carregado:',
        produtoEmEdicao
    );

    preencherFormularioProduto(
        produtoEmEdicao
    );

} catch (erro) {

    console.error(
        'Erro inesperado ao carregar produto:',
        erro
    );

    mostrarMensagemFormulario(
        'Ocorreu um erro ao carregar o produto.'
    );
}


}

function preencherFormularioProduto(
produto
) {


const campoNome =
    document.getElementById(
        'produto-nome'
    );

const campoDescricao =
    document.getElementById(
        'produto-descricao'
    );

const campoCategoria =
    document.getElementById(
        'produto-categoria'
    );

const campoPreco =
    document.getElementById(
        'produto-preco'
    );

const campoPrecoPromocional =
    document.getElementById(
        'produto-preco-promocional'
    );

const campoEstoque =
    document.getElementById(
        'produto-estoque'
    );

const campoAtivo =
    document.getElementById(
        'produto-ativo'
    );

if (campoNome) {
    campoNome.value =
        produto.nome || '';
}

if (campoDescricao) {
    campoDescricao.value =
        produto.descricao || '';
}

if (campoCategoria) {

    campoCategoria.value =
        produto.categoria_id !== null &&
        produto.categoria_id !== undefined
            ? String(
                produto.categoria_id
            )
            : '';
}

if (campoPreco) {
    campoPreco.value =
        produto.preco ?? '';
}

if (campoPrecoPromocional) {
    campoPrecoPromocional.value =
        produto.preco_promocional ?? '';
}

if (campoEstoque) {
    campoEstoque.value =
        produto.estoque ?? 0;
}

if (campoAtivo) {
    campoAtivo.checked =
        produto.ativo !== false;
}

imagemProdutoUrl =
    produto.imagem_url ||
    produto.imagem ||
    produto.foto_url ||
    '';

if (imagemProdutoUrl) {

    mostrarPreviewImagemProduto(
        imagemProdutoUrl
    );

    atualizarStatusImagemProduto(
        'Imagem atual do produto.'
    );

} else {

    mostrarPreviewImagemProduto(
        ''
    );

    atualizarStatusImagemProduto(
        'Nenhuma imagem selecionada.'
    );
}

const tituloPagina =
    document.getElementById(
        'titulo-pagina'
    );

if (tituloPagina) {
    tituloPagina.textContent =
        'Editar produto';
}

const descricaoPagina =
    document.getElementById(
        'descricao-pagina'
    );

if (descricaoPagina) {
    descricaoPagina.textContent =
        'Atualize as informações do produto.';
}

const botaoSalvar =
    document.getElementById(
        'btn-salvar-produto'
    );

if (botaoSalvar) {
    botaoSalvar.textContent =
        'Salvar alterações';
}


}

function validarFormularioProduto() {


const campoNome =
    document.getElementById(
        'produto-nome'
    );

const campoPreco =
    document.getElementById(
        'produto-preco'
    );

const campoPrecoPromocional =
    document.getElementById(
        'produto-preco-promocional'
    );

const campoEstoque =
    document.getElementById(
        'produto-estoque'
    );

const campoCategoria =
    document.getElementById(
        'produto-categoria'
    );

const nome =
    campoNome?.value
        ?.trim() || '';

const preco =
    Number(
        campoPreco?.value
    );

const precoPromocionalTexto =
    campoPrecoPromocional?.value
        ?.trim() || '';

const precoPromocional =
    precoPromocionalTexto
        ? Number(
            precoPromocionalTexto
        )
        : null;

const estoque =
    Number(
        campoEstoque?.value
    );

const categoriaId =
    campoCategoria?.value || null;

if (!nome) {

    mostrarMensagemFormulario(
        'Informe o nome do produto.'
    );

    campoNome?.focus();

    return null;
}

if (
    Number.isNaN(preco) ||
    preco < 0
) {

    mostrarMensagemFormulario(
        'Informe um preço válido.'
    );

    campoPreco?.focus();

    return null;
}

if (
    precoPromocional !== null &&
    (
        Number.isNaN(
            precoPromocional
        ) ||
        precoPromocional < 0
    )
) {

    mostrarMensagemFormulario(
        'Informe um preço promocional válido.'
    );

    campoPrecoPromocional?.focus();

    return null;
}

if (
    precoPromocional !== null &&
    precoPromocional >= preco
) {

    mostrarMensagemFormulario(
        'O preço promocional deve ser menor que o preço normal.'
    );

    campoPrecoPromocional?.focus();

    return null;
}

if (
    Number.isNaN(estoque) ||
    estoque < 0
) {

    mostrarMensagemFormulario(
        'Informe um estoque válido.'
    );

    campoEstoque?.focus();

    return null;
}

return {

    nome:
        nome,

    descricao:
        document.getElementById(
            'produto-descricao'
        )?.value
            ?.trim() || '',

    categoria_id:
        categoriaId,

    preco:
        preco,

    preco_promocional:
        precoPromocional,

    estoque:
        Math.floor(
            estoque
        ),

    ativo:
        document.getElementById(
            'produto-ativo'
        )?.checked !== false,

    imagem_url:
        imagemProdutoUrl || null
};


}

async function cadastrarProduto(
dados
) {


const supabase =
    obterSupabaseCadastroProduto();

if (!supabase) {

    throw new Error(
        'Supabase não está disponível.'
    );
}

const resultado =
    await supabase
        .from('produtos')
        .insert(
            dados
        )
        .select('*')
        .single();

if (resultado.error) {
    throw resultado.error;
}

return resultado.data;

}

async function atualizarProduto(
    id,
    dados
) {

    const supabase =
        obterSupabaseCadastroProduto();

    if (!supabase) {

        throw new Error(
            'Supabase não está disponível.'
        );
    }

    if (
        id === null ||
        id === undefined ||
        id === ''
    ) {

        throw new Error(
            'ID do produto não informado.'
        );
    }

    console.log(
        'Atualizando produto:',
        id
    );

    const resultado =
        await supabase
            .from('produtos')
            .update(
                {
                    ...dados,
                    updated_at:
                        new Date().toISOString()
                }
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
            'Nenhum produto foi atualizado. Verifique se o produto existe e se o administrador possui permissão para atualizar a tabela produtos.'
        );
    }

    return resultado.data[0];
}

function configurarImagemProduto() {


const input =
    document.getElementById(
        'input-imagem-produto'
    );

if (!input) {
    console.warn(
        'Input de imagem não encontrado.'
    );
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

        atualizarStatusImagemProduto(
            'Processando imagem...'
        );

        try {

            const imagemProcessada =
                await comprimirImagemProduto(
                    file
                );

            mostrarPreviewImagemProduto(
                imagemProcessada
            );

            imagemProdutoUrl =
                imagemProcessada;

            const tamanhoKb =
                Math.round(
                    (
                        imagemProcessada.length *
                        0.75
                    ) / 1024
                );

            atualizarStatusImagemProduto(
                'Imagem pronta! Aproximadamente ' +
                tamanhoKb +
                ' KB.'
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

            imagemProdutoUrl =
                produtoEmEdicao?.imagem_url ||
                '';

            if (imagemProdutoUrl) {

                mostrarPreviewImagemProduto(
                    imagemProdutoUrl
                );

            } else {

                mostrarPreviewImagemProduto(
                    ''
                );
            }

            atualizarStatusImagemProduto(
                'Nenhuma nova imagem selecionada.'
            );
        }
    }
);


}

function configurarFormularioProduto() {


const formulario =
    document.getElementById(
        'form-cadastro-produto'
    );

if (!formulario) {

    console.error(
        'Formulário de produto não encontrado.'
    );

    return;
}

formulario.addEventListener(
    'submit',
    async function(event) {

        event.preventDefault();

        limparMensagemFormulario();

        const dados =
            validarFormularioProduto();

            console.log('DADOS QUE SERÃO SALVOS:', dados);
            console.log('VALOR DO ATIVO:', dados.ativo);
            console.log('CHECKBOX ATIVO:', document.getElementById('produto-ativo')?.checked);

        if (!dados) {
            return;
        }

        const botao =
            document.getElementById(
                'btn-salvar-produto'
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
                    'input-imagem-produto'
                );

            const arquivoImagem =
                inputImagem?.files?.[0];

            if (arquivoImagem) {

                mostrarMensagemFormulario(
                    'Enviando imagem...',
                    'sucesso'
                );

                const urlImagem =
                    await enviarImagemProdutoStorage(
                        arquivoImagem
                    );

                dados.imagem_url =
                    urlImagem;

                imagemProdutoUrl =
                    urlImagem;
            }

            let resultado;

            if (produtoEmEdicao) {

                resultado =
                    await atualizarProduto(
                        produtoEmEdicao.id,
                        dados
                    );

            } else {

                resultado =
                    await cadastrarProduto(
                        dados
                    );
            }

            console.log(
                'Produto salvo:',
                resultado
            );

            mostrarMensagemFormulario(
                produtoEmEdicao
                    ? 'Produto atualizado com sucesso!'
                    : 'Produto cadastrado com sucesso!',
                'sucesso'
            );

            setTimeout(
                function() {

                    window.location.href =
                        'admin-produtos.html';

                },
                800
            );

        } catch (erro) {

            console.error(
                'Erro ao salvar produto:',
                erro
            );

            mostrarMensagemFormulario(
                'Não foi possível salvar o produto: ' +
                (
                    erro.message ||
                    'Erro desconhecido.'
                )
            );

            if (botao) {

                botao.disabled =
                    false;

                botao.textContent =
                    produtoEmEdicao
                        ? 'Salvar alterações'
                        : 'Salvar produto';
            }
        }
    }
);


}

document.addEventListener(
'DOMContentLoaded',
async function() {


    console.log(
        '============================================================'
    );

    console.log(
        'ZoraVision - Cadastro de Produto'
    );

    console.log(
        '============================================================'
    );

    const supabase =
        obterSupabaseCadastroProduto();

    if (!supabase) {

        console.error(
            'Supabase não disponível.'
        );

        mostrarMensagemFormulario(
            'Não foi possível conectar ao sistema.'
        );

        return;
    }

    const parametros =
        new URLSearchParams(
            window.location.search
        );

    const id =
        parametros.get(
            'id'
        );

    configurarImagemProduto();

    configurarFormularioProduto();

    if (id) {

        await carregarProdutoParaEdicao(
            id
        );

        await carregarCategoriasProduto();

    } else {

        await carregarCategoriasProduto();

        console.log(
            'Modo cadastro de produto.'
        );
    }

    console.log(
        'Cadastro de produto inicializado.'
    );
}


);

window.carregarProdutoParaEdicao =
carregarProdutoParaEdicao;

window.carregarCategoriasProduto =
carregarCategoriasProduto;

window.cadastrarProduto =
cadastrarProduto;

window.atualizarProduto =
atualizarProduto;

window.comprimirImagemProduto =
comprimirImagemProduto;

window.enviarImagemProdutoStorage =
enviarImagemProdutoStorage;

window.mostrarPreviewImagemProduto =
mostrarPreviewImagemProduto;
