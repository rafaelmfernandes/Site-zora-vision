/**
 * Módulo de Busca Dinâmica em Tempo Real
 * Responsável por filtrar os produtos cadastrados na vitrine da página inicial
 * conforme o usuário digita na barra de pesquisa.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Seleciona o campo de input de busca na tela
    const inputBusca = document.querySelector('.search-input');
    
    // Se o campo de busca não existir na página atual, interrompe a execução
    if (!inputBusca) return;

    // 2. Adiciona um ouvinte para capturar cada letra digitada pelo usuário em tempo real
    inputBusca.addEventListener('input', (e) => {
        // Pega o valor digitado, converte para letras minúsculas e remove espaços vazios nas pontas
        const termo = e.target.value.toLowerCase().trim();
        
        // Seleciona o container (grid) onde os cards dos produtos são exibidos
        const gridProdutos = document.getElementById('grid-produtos-home');
        if (!gridProdutos) return;

        // 3. Recupera os produtos salvos no localStorage (cadastrados pelo painel admin)
        const produtosSalvos = JSON.parse(localStorage.getItem('produtos_loja')) || [];
        
        // Filtra apenas os produtos que estão ativos (ativo !== false)
        const produtosAtivos = produtosSalvos.filter(p => p.ativo !== false);

        // 4. Lógica de Filtragem:
        // Se o campo estiver vazio, exibe todos os produtos ativos.
        // Se houver texto, filtra os produtos cujo nome ou descrição contenham o termo digitado.
        const produtosFiltrados = termo === '' 
            ? produtosAtivos 
            : produtosAtivos.filter(p => 
                (p.nome || '').toLowerCase().includes(termo) || 
                (p.descricao && p.descricao.toLowerCase().includes(termo))
              );

        // 5. Tratamento para quando nenhum produto for encontrado
        if (produtosFiltrados.length === 0) {
            const contadorProdutos = document.getElementById('contador-produtos');
            if (contadorProdutos) contadorProdutos.textContent = '0 itens';

            if (termo === '') {
                gridProdutos.innerHTML = `
                  <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: #64748b;">
                    <p style="font-size: 1rem;">Nenhum produto cadastrado ainda. 📦</p>
                  </div>
                `;
            } else {
                gridProdutos.innerHTML = `
                  <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: #64748b;">
                    <p style="font-size: 1rem; margin-bottom: 0.5rem;">Nenhum produto encontrado para "<strong>${termo}</strong>" 🔍</p>
                    <small>Tente buscar por outro termo.</small>
                  </div>
                `;
            }
            return;
        }

        // 6. Reconstrói o grid dinamicamente apenas com os produtos que passaram no filtro
        gridProdutos.innerHTML = '';
        
        produtosFiltrados.forEach(produto => {
            // Formata o preço para o padrão brasileiro (R$ 00,00)
            const preco = parseFloat(produto.preco || 0);
            const precoAntigo = parseFloat(produto.precoAntigo || 0);
            const temDesconto = precoAntigo > preco;
            const precoFormatado = preco.toFixed(2).replace('.', ',');
            const precoAntigoFormatado = precoAntigo.toFixed(2).replace('.', ',');
            const percentualDesconto = temDesconto ? Math.round((1 - preco / precoAntigo) * 100) : 0;

            // Valida se a imagem cadastrada é uma URL válida ou Base64
            const imagemSrc = produto.imagem;
            const ehImagemUrl = typeof imagemSrc === 'string' && (imagemSrc.startsWith('data:image') || imagemSrc.startsWith('http'));
            const categoria = produto.categoria || 'Geral';

            // Cria o elemento HTML do card do produto
            const card = document.createElement('div');
            card.className = 'card-produto';
            card.style.position = 'relative';
            card.innerHTML = `
              ${temDesconto ? `<div class="badge-desconto">-${percentualDesconto}%</div>` : ''}
              ${typeof FavoritosModule !== 'undefined' ? FavoritosModule.botaoHtml(produto.id, 'position:absolute; top:8px; right:8px; z-index:2; background:rgba(255,255,255,0.9); border:none; border-radius:50%; width:28px; height:28px; cursor:pointer; font-size:14px;') : ''}
              <a href="Produtos.html?id=${produto.id}" style="text-decoration: none; color: inherit; display: block;">
                <div class="card-img-box" style="${ehImagemUrl ? 'padding: 0; overflow: hidden;' : ''}">
                  ${ehImagemUrl ? `<img src="${imagemSrc}" alt="${produto.nome}" style="width: 100%; height: 100%; object-fit: cover;">` : (imagemSrc || '📦')}
                </div>
                <span class="tag-categoria">${categoria}</span>
                <h3>${produto.nome}</h3>
                <div class="preco-linha">
                  ${temDesconto ? `<span class="preco-antigo">R$ ${precoAntigoFormatado}</span>` : ''}
                  <span class="preco">R$ ${precoFormatado}</span>
                </div>
              </a>
              <button class="btn-adicionar" 
                      data-id="${produto.id}" 
                      data-nome="${produto.nome}" 
                      data-preco="${produto.preco}">
                  🛒 Adicionar
              </button>
            `;
            
            // Adiciona o card gerado dentro do grid na tela
            gridProdutos.appendChild(card);
        });

        // Atualiza o contador de itens no cabeçalho da seção
        const contadorProdutos = document.getElementById('contador-produtos');
        if (contadorProdutos) {
            contadorProdutos.textContent = `${produtosFiltrados.length} ${produtosFiltrados.length === 1 ? 'item' : 'itens'}`;
        }
    });
});