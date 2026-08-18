let imagemBase64 = '';

document.addEventListener('DOMContentLoaded', () => {
  // Trata o upload da imagem e gera preview imediato
  const inputFoto = document.getElementById('input-foto');
  if (inputFoto) {
    inputFoto.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
          imagemBase64 = event.target.result;
          const previewIcone = document.getElementById('preview-icone');
          const previewTexto = document.getElementById('preview-texto');
          
          if (previewIcone) {
            previewIcone.outerHTML = `<img id="preview-icone" src="${imagemBase64}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;">`;
          }
          if (previewTexto) {
            previewTexto.innerHTML = `<strong>Imagem carregada com sucesso!</strong>`;
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Manipula o envio do formulário e salva no localStorage
  const formCadastrar = document.getElementById('form-cadastrar-produto');
  if (formCadastrar) {
    formCadastrar.addEventListener('submit', function(e) {
      e.preventDefault();

      const novoProduto = {
        id: 'prod_' + Date.now(),
        nome: document.getElementById('nome-produto').value.trim(),
        categoria: document.getElementById('categoria').value,
        descricao: document.getElementById('descricao').value.trim(),
        preco: parseFloat(document.getElementById('preco-venda').value) || 0,
        precoAntigo: parseFloat(document.getElementById('preco-original').value) || 0,
        estoque: parseInt(document.getElementById('estoque').value) || 0,
        sku: document.getElementById('sku').value.trim(),
        ativo: document.getElementById('produto-ativo').checked,
        destaque: document.getElementById('produto-destaque').checked,
        imagem: imagemBase64 || 'https://via.placeholder.com/300?text=Produto',
        vendas: 0,
        views: 0
      };

      // Recupera a lista atual de produtos do localStorage ou inicia vazia
      let listaProdutos = JSON.parse(localStorage.getItem('produtos_loja')) || [];
      
      // Adiciona o novo produto na lista
      listaProdutos.push(novoProduto);

      // Salva de volta no localStorage para sincronizar com o index.html
      localStorage.setItem('produtos_loja', JSON.stringify(listaProdutos));

      alert('Produto cadastrado e publicado com sucesso! 🚀');

      // Redireciona para o painel administrativo
      window.location.href = 'admin.html';
    });
  }
});