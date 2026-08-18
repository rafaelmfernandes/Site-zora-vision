// Aguarda o carregamento completo do documento
document.addEventListener('DOMContentLoaded', () => {

  // 1. Atualizar o contador de itens no topo
  function atualizarContador() {
    const totalItens = document.querySelectorAll('.card-produto').length;
    const badgeContador = document.querySelector('.badge-contador');
    
    if (badgeContador) {
      badgeContador.textContent = `${totalItens} ${totalItens === 1 ? 'Item' : 'Itens'}`;
    }
  }

  // 2. Adicionar evento de clique para remover um item favorito
  const botoesRemover = document.querySelectorAll('.btn-remover-favorito');

  botoesRemover.forEach(botao => {
    botao.addEventListener('click', (event) => {
      // Encontra o card de produto pai do botão clicado
      const cardProduto = event.target.closest('.card-produto');
      
      if (cardProduto) {
        // Remove o card da tela
        cardProduto.remove();
        // Atualiza a contagem no topo
        atualizarContador();
      }
    });
  });

  // 3. Botão para limpar todos os favoritos
  const btnLimpar = document.querySelector('.btn-limpar');

  if (btnLimpar) {
    btnLimpar.addEventListener('click', () => {
      const confirmacao = confirm('Deseja realmente remover todos os itens dos favoritos?');
      if (confirmacao) {
        const gridFavoritos = document.querySelector('.grid-favoritos');
        gridFavoritos.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px; color: #64748b;">Sua lista de favoritos está vazia. ❤️</p>';
        atualizarContador();
      }
    });
  }

});