let arquivoImagem = null;

// ==========================================
// CARREGAR CATEGORIAS DO SUPABASE
// ==========================================

async function carregarCategorias() {
  console.log('🔎 Iniciando carregamento das categorias...');

  const selectCategoria = document.getElementById('categoria');

  console.log('🔎 Select encontrado:', selectCategoria);

  if (!selectCategoria) {
    console.error('❌ Não encontrei o elemento #categoria');
    return;
  }

  try {

    console.log('🔎 Consultando tabela categorias...');

    const { data: categorias, error } = await supabaseClient
      .from('categorias')
      .select('id, nome')
      .eq('ativo', true)
      .order('nome');

    console.log('📦 Categorias recebidas:', categorias);
    console.log('⚠️ Erro da consulta:', error);

    if (error) {
      console.error('❌ Erro ao carregar categorias:', error);

      selectCategoria.innerHTML =
        '<option value="" disabled selected>Erro ao carregar categorias</option>';

      return;
    }

    if (!categorias || categorias.length === 0) {
      console.warn('⚠️ Nenhuma categoria encontrada.');

      selectCategoria.innerHTML =
        '<option value="" disabled selected>Nenhuma categoria cadastrada</option>';

      return;
    }

    selectCategoria.innerHTML =
      '<option value="" disabled selected>Selecione uma categoria</option>';

    categorias.forEach(categoria => {

      const option = document.createElement('option');

      option.value = categoria.id;
      option.textContent = categoria.nome;

      selectCategoria.appendChild(option);

      console.log(
        '✅ Categoria adicionada:',
        categoria.nome,
        categoria.id
      );
    });

    console.log('🎉 Categorias carregadas com sucesso!');

  } catch (erro) {

    console.error(
      '❌ Erro inesperado ao carregar categorias:',
      erro
    );

    selectCategoria.innerHTML =
      '<option value="" disabled selected>Erro ao carregar categorias</option>';
  }
}

// ==========================================
// INICIALIZAÇÃO
// ==========================================

document.addEventListener('DOMContentLoaded', () => {

  carregarCategorias();


  // ==========================================
  // PREVIEW DA IMAGEM
  // ==========================================

  const inputFoto = document.getElementById('input-foto');

  if (inputFoto) {

    inputFoto.addEventListener('change', function (e) {

      const file = e.target.files[0];

      if (!file) return;

      arquivoImagem = file;

      const previewIcone =
        document.getElementById('preview-icone');

      const previewTexto =
        document.getElementById('preview-texto');

      if (previewIcone) {

        previewIcone.outerHTML = `
          <img
            id="preview-icone"
            src="${URL.createObjectURL(file)}"
            style="
              width: 80px;
              height: 80px;
              object-fit: cover;
              border-radius: 8px;
              margin-bottom: 8px;
            "
          >
        `;
      }

      if (previewTexto) {

        previewTexto.innerHTML =
          '<strong>Imagem carregada com sucesso!</strong>';
      }

    });
  }


  // ==========================================
  // FORMULÁRIO
  // ==========================================

  const formCadastrar =
    document.getElementById('form-cadastrar-produto');

  if (!formCadastrar) return;


  formCadastrar.addEventListener('submit', async function (e) {

    e.preventDefault();


    const botaoSalvar =
      formCadastrar.querySelector('button[type="submit"]');


    try {

      // ==========================================
      // BLOQUEIA O BOTÃO
      // ==========================================

      if (botaoSalvar) {

        botaoSalvar.disabled = true;

        botaoSalvar.textContent =
          'Salvando...';
      }


      // ==========================================
      // PEGA OS DADOS
      // ==========================================

      const nome =
        document.getElementById('nome-produto')
          .value
          .trim();

      const categoriaId =
        document.getElementById('categoria')
          .value;

      const descricao =
        document.getElementById('descricao')
          .value
          .trim();

      const preco =
        parseFloat(
          document.getElementById('preco-venda').value
        ) || 0;

      const precoOriginalValor =
        document.getElementById('preco-original').value;

      const precoOriginal =
        precoOriginalValor !== ''
          ? parseFloat(precoOriginalValor)
          : null;

      const estoque =
        parseInt(
          document.getElementById('estoque').value
        ) || 0;

      const skuValor =
        document.getElementById('sku')
          .value
          .trim();

      const sku =
        skuValor !== ''
          ? skuValor
          : null;

      const ativo =
        document.getElementById('produto-ativo')
          .checked;

      const destaque =
        document.getElementById('produto-destaque')
          .checked;


      // ==========================================
      // VALIDAÇÕES
      // ==========================================

      if (!nome) {
        throw new Error(
          'Informe o nome do produto.'
        );
      }

      if (!categoriaId) {
        throw new Error(
          'Selecione uma categoria.'
        );
      }

      if (preco <= 0) {
        throw new Error(
          'Informe um preço válido.'
        );
      }

      if (estoque < 0) {
        throw new Error(
          'O estoque não pode ser negativo.'
        );
      }


      // ==========================================
      // UPLOAD DA IMAGEM
      // ==========================================

      let imagemUrl = null;

      if (arquivoImagem) {

        const extensao =
          arquivoImagem.name
            .split('.')
            .pop()
            .toLowerCase();

        const nomeArquivo =
          `${crypto.randomUUID()}.${extensao}`;

        const caminhoArquivo =
          `produtos/${nomeArquivo}`;


        const { error: erroUpload } =
          await supabaseClient
            .storage
            .from('Produtos')
            .upload(
              caminhoArquivo,
              arquivoImagem,
              {
                cacheControl: '3600',
                upsert: false
              }
            );


        if (erroUpload) {

          console.error(
            'Erro no upload:',
            erroUpload
          );

          throw new Error(
            'Não foi possível enviar a imagem.'
          );
        }


        // ==========================================
        // URL PÚBLICA DA IMAGEM
        // ==========================================

        const { data: imagemPublica } =
          supabaseClient
            .storage
            .from('Produtos')
            .getPublicUrl(caminhoArquivo);


        imagemUrl =
          imagemPublica.publicUrl;
      }


      // ==========================================
      // PREPARA O PRODUTO
      // ==========================================

      const produto = {

        nome: nome,

        categoria_id: categoriaId,

        descricao:
          descricao || null,

        preco: preco,

        preco_promocional:
          precoOriginal,

        estoque: estoque,

        sku: sku,

        imagem_url:
          imagemUrl,

        ativo: ativo,

        destaque: destaque
      };


      console.log(
        'Produto que será enviado:',
        produto
      );


      // ==========================================
      // SALVA NO SUPABASE
      // ==========================================

      const { data, error } =
      await supabaseClient
        .from('produtos')
        .insert([produto])
        .select()
        .single();

      if (error) {

        console.error(
          'Erro ao salvar produto:',
          error
        );

        throw new Error(
          error.message ||
          'Não foi possível salvar o produto.'
        );
      }


      // ==========================================
      // SUCESSO
      // ==========================================

      console.log(
        'Produto cadastrado:',
        data
      );


      alert(
        'Produto cadastrado e publicado com sucesso! 🚀'
      );


      // ==========================================
      // REDIRECIONAMENTO
      // ==========================================

      window.location.href =
        'admin.html';

    } catch (erro) {

      console.error(
        'Erro no cadastro:',
        erro
      );


      alert(
        erro.message ||
        'Ocorreu um erro ao cadastrar o produto.'
      );


      if (botaoSalvar) {

        botaoSalvar.disabled = false;

        botaoSalvar.textContent =
          'Salvar e Publicar Produto';
      }
    }

  });

});