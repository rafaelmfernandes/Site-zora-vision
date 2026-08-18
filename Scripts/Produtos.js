document.addEventListener('DOMContentLoaded', () => {
  // Captura dos elementos do HTML
  const inputQtd = document.querySelector('.input-qtd');
  const btnsQtd = document.querySelectorAll('.btn-qtd');
  const btnAdicionar = document.querySelector('.btn-carrinho');
  const btnComprar = document.querySelector('.btn-comprar');
  const contadorCarrinhoNav = document.querySelector('.carrinho-badge');

  const tituloEl = document.getElementById('prod-titulo');
  const precoEl = document.getElementById('prod-preco');
  const precoAntigoEl = document.getElementById('prod-preco-antigo');
  const descEl = document.getElementById('prod-descricao');
  const imgEl = document.getElementById('prod-img');
  const estoqueTagEl = document.getElementById('prod-estoque-tag');

  // 0. Função utilitária para verificar se o usuário está logado antes da ação
  function verificarAutenticacaoAntesDeAcao(e) {
    const usuarioLogado = JSON.parse(localStorage.getItem('usuario_logado'));

    // Se não houver usuário logado ou e-mail válido cadastrado
    if (!usuarioLogado || !usuarioLogado.email) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

      alert('Por favor, faça login na sua conta para continuar.');
      
      // Redireciona corretamente para a página de Login
      window.location.href = 'Login.html';
      return false;
    }

    return true; // Usuário autenticado com sucesso
  }

  // 1. Pega o ID passado na URL (ex: Produtos.html?id=prod_123456)
  const urlParams = new URLSearchParams(window.location.search);
  const produtoId = urlParams.get('id');

  // 2. Busca os produtos cadastrados no localStorage
  const produtosSalvos = JSON.parse(localStorage.getItem('produtos_loja')) || [];
  let produtoAtual = produtosSalvos.find(p => p.id === produtoId);

  // Se não encontrar pelo ID do painel, usa um produto padrão de fallback
  if (!produtoAtual) {
    produtoAtual = {
      id: produtoId || 'fone-bt-premium-01',
      nome: 'Fone Bluetooth Sem Fio Premium',
      preco: 129.90,
      precoAntigo: 159.90,
      descricao: 'Fone de ouvido bluetooth de alta qualidade com som estéreo imersivo e bateria de longa duração.',
      imagem: '🎧',
      estoque: 10
    };
  }

  // 3. Preenche a interface com os dados do produto encontrado
  if (tituloEl) tituloEl.textContent = produtoAtual.nome;
  if (precoEl) precoEl.textContent = `R$ ${parseFloat(produtoAtual.preco || 0).toFixed(2).replace('.', ',')}`;
  
  if (precoAntigoEl && produtoAtual.precoAntigo && produtoAtual.precoAntigo > 0) {
    precoAntigoEl.textContent = `R$ ${parseFloat(produtoAtual.precoAntigo).toFixed(2).replace('.', ',')}`;
    precoAntigoEl.style.display = 'inline';
  }

  if (descEl) descEl.textContent = produtoAtual.descricao || 'Nenhuma descrição informada.';

  if (imgEl) {
    const imagemSrc = produtoAtual.imagem;
    const ehImagemUrl = typeof imagemSrc === 'string' && (imagemSrc.startsWith('data:image') || imagemSrc.startsWith('http'));
    
    if (ehImagemUrl) {
      imgEl.innerHTML = `<img src="${imagemSrc}" alt="${produtoAtual.nome}" style="width: 100%; height: 100%; object-fit: cover;">`;
    } else {
      imgEl.innerHTML = imagemSrc || '📦';
    }
  }

  if (estoqueTagEl) {
    if (produtoAtual.estoque > 0) {
      estoqueTagEl.innerHTML = `<span class="dot"></span> ${produtoAtual.estoque} em estoque`;
    } else {
      estoqueTagEl.innerHTML = `<span class="dot" style="background: red;"></span> Indisponível`;
    }
  }

  // 4. Controle dos botões de Quantidade (+ e -)
  if (inputQtd && btnsQtd.length >= 2) {
    const btnMenos = btnsQtd[0];
    const btnMais = btnsQtd[1];

    btnMenos.addEventListener('click', () => {
      let qtdAtual = parseInt(inputQtd.value) || 1;
      const min = parseInt(inputQtd.getAttribute('min')) || 1;
      if (qtdAtual > min) {
        inputQtd.value = qtdAtual - 1;
      }
    });

    btnMais.addEventListener('click', () => {
      let qtdAtual = parseInt(inputQtd.value) || 1;
      const max = produtoAtual.estoque ? produtoAtual.estoque : 99;
      if (qtdAtual < max) {
        inputQtd.value = qtdAtual + 1;
      }
    });
  }

  // 5. Função para salvar sincronizado em 'carrinho_db' e 'carrinho'
  function salvarNoCarrinho(quantidade) {
    let imagemParaCarrinho = '📦';
    if (produtoAtual.imagem && typeof produtoAtual.imagem === 'string') {
      if (!produtoAtual.imagem.startsWith('data:image')) {
        imagemParaCarrinho = produtoAtual.imagem; 
      }
    }

    const novoItem = {
      id: produtoAtual.id,
      nome: produtoAtual.nome,
      preco: parseFloat(produtoAtual.preco),
      imagem: imagemParaCarrinho,
      quantidade: quantidade
    };

    const chaves = ['carrinho_db', 'carrinho'];

    chaves.forEach(chave => {
      try {
        let carrinho = JSON.parse(localStorage.getItem(chave)) || [];
        const itemExistente = carrinho.find(item => item.id === produtoAtual.id);

        if (itemExistente) {
          itemExistente.quantidade += quantidade;
        } else {
          carrinho.push({ ...novoItem });
        }

        localStorage.setItem(chave, JSON.stringify(carrinho));
      } catch (err) {
        console.warn(`Aviso: Não foi possível salvar na chave ${chave} por falta de espaço.`, err);
      }
    });

    atualizarContadorNav();
  }

  // 6. Atualizar o contador da barra de navegação inferior
  function atualizarContadorNav() {
    if (!contadorCarrinhoNav) return;
    const carrinho = JSON.parse(localStorage.getItem('carrinho_db')) || JSON.parse(localStorage.getItem('carrinho')) || [];
    const totalItens = carrinho.reduce((acc, item) => acc + item.quantidade, 0);
    contadorCarrinhoNav.textContent = totalItens;
  }

  // 7. Evento do botão "Adicionar ao Carrinho" (Com validação de login)
  if (btnAdicionar) {
    btnAdicionar.addEventListener('click', (e) => {
      e.preventDefault();

      // 🔒 Valida se está logado antes de prosseguir
      if (!verificarAutenticacaoAntesDeAcao(e)) return;

      const quantidade = parseInt(inputQtd ? inputQtd.value : 1);
      
      salvarNoCarrinho(quantidade);
      
      const textoOriginal = btnAdicionar.textContent;
      btnAdicionar.textContent = 'Adicionado! ✓';
      btnAdicionar.style.backgroundColor = '#16a34a';
      btnAdicionar.style.color = '#fff';

      setTimeout(() => {
        btnAdicionar.textContent = textoOriginal;
        btnAdicionar.style.backgroundColor = '';
        btnAdicionar.style.color = '';
      }, 1500);
    });
  }

  // 8. Evento do botão "Comprar Agora" (Com validação de login)
  if (btnComprar) {
    btnComprar.addEventListener('click', (e) => {
      e.preventDefault();

      // 🔒 Valida se está logado antes de prosseguir
      if (!verificarAutenticacaoAntesDeAcao(e)) return;

      const quantidade = parseInt(inputQtd ? inputQtd.value : 1);
      
      salvarNoCarrinho(quantidade);
      window.location.href = 'carrinho.html';
    });
  }

  // Inicializa o contador na carga da página
  atualizarContadorNav();
});