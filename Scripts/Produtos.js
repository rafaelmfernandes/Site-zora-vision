document.addEventListener('DOMContentLoaded', () => {
  // Captura dos elementos do HTML
  const inputQtd = document.querySelector('.input-qtd');
  const btnsQtd = document.querySelectorAll('.btn-qtd');
  const btnAdicionar = document.querySelector('.btn-carrinho');
  const btnComprar = document.querySelector('.btn-comprar');
  const contadorCarrinhoNav = document.querySelector('.carrinho-count');

  // Dados do produto extraídos da página
  const produtoAtual = {
    id: 'fone-bt-premium-01',
    nome: 'Fone Bluetooth Sem Fio Premium',
    preco: 129.90,
    imagem: '🎧'
  };

  // 1. Controle dos botões de Quantidade (+ e -)
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
      const max = parseInt(inputQtd.getAttribute('max')) || 8;
      if (qtdAtual < max) {
        inputQtd.value = qtdAtual + 1;
      }
    });
  }

  // 2. Função auxiliar para salvar no localStorage
  function salvarNoCarrinho(quantidade) {
    const carrinho = JSON.parse(localStorage.getItem('carrinho_db')) || [];
    const itemExistente = carrinho.find(item => item.id === produtoAtual.id);

    if (itemExistente) {
      itemExistente.quantidade += quantidade;
    } else {
      carrinho.push({
        id: produtoAtual.id,
        nome: produtoAtual.nome,
        preco: produtoAtual.preco,
        imagem: produtoAtual.imagem,
        quantidade: quantidade
      });
    }

    localStorage.setItem('carrinho_db', JSON.stringify(carrinho));
    atualizarContadorNav();
  }

  // 3. Atualizar o contador da barra de navegação inferior
  function atualizarContadorNav() {
    if (!contadorCarrinhoNav) return;
    const carrinho = JSON.parse(localStorage.getItem('carrinho_db')) || [];
    const totalItens = carrinho.reduce((acc, item) => acc + item.quantidade, 0);
    contadorCarrinhoNav.textContent = totalItens;
  }

  // 4. Evento do botão "Adicionar ao Carrinho"
  if (btnAdicionar) {
    // Transforma a tag <a> para evitar o redirecionamento padrão imediato
    btnAdicionar.addEventListener('click', (e) => {
      e.preventDefault();
      const quantidade = parseInt(inputQtd ? inputQtd.value : 1);
      
      salvarNoCarrinho(quantidade);
      alert(`${quantidade}x ${produtoAtual.nome} adicionado(s) ao carrinho! 🛒`);
    });
  }

  // 5. Evento do botão "Comprar Agora"
  if (btnComprar) {
    btnComprar.addEventListener('click', (e) => {
      e.preventDefault();
      const quantidade = parseInt(inputQtd ? inputQtd.value : 1);
      
      salvarNoCarrinho(quantidade);
      window.location.href = 'carrinho.html';
    });
  }

  // Inicializa o contador na carga da página
  atualizarContadorNav();
});