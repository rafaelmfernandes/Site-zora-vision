/**
 * Aguarda o DOM carregar totalmente antes de executar as funções.
 */
document.addEventListener('DOMContentLoaded', () => {
  carregarDashboardAdmin();
  carregarProdutosAdmin();
  carregarBannersAdmin();
});

/**
 * 1. CARREGAMENTO DO DASHBOARD (Resumo de Pedidos e Faturamento)
 */
function carregarDashboardAdmin() {
  const pedidosLoja = JSON.parse(localStorage.getItem('pedidos_loja')) || [];
  const historicoCliente = JSON.parse(localStorage.getItem('historico_pedidos_cliente')) || [];

  const todosPedidosMap = new Map();
  [...pedidosLoja, ...historicoCliente].forEach(pedido => {
    const identificador = pedido.id || pedido.numero;
    if (identificador) {
      todosPedidosMap.set(String(identificador), pedido);
    }
  });

  const pedidos = Array.from(todosPedidosMap.values());

  const elFaturamento = document.querySelector('.card-kpi.destaque-financeiro .kpi-valor');
  const elPedidosPendentes = document.querySelector('.card-kpi:nth-child(2) .kpi-valor');
  const elSubtextoPendentes = document.querySelector('.card-kpi:nth-child(2) .kpi-subtexto');
  const badgeContador = document.querySelector('.contador-badge');
  const listaPedidosContainer = document.querySelector('.lista-pedidos');

  let faturamentoTotal = 0;
  let qtdPendentes = 0;
  let qtdACaminho = 0;
  let qtdConcluidos = 0;

  pedidos.forEach(pedido => {
    const valorNumerico = parseFloat(pedido.total || 0);
    const statusAtual = pedido.status || 'Em Separação';

    if (statusAtual !== 'Cancelado') {
      faturamentoTotal += valorNumerico;
    }

    if (statusAtual === 'Em Separação' || statusAtual === 'separacao' || statusAtual === 'Pendente') {
      qtdPendentes++;
    } else if (statusAtual === 'Em Transporte' || statusAtual === 'transporte' || statusAtual === 'A caminho') {
      qtdACaminho++;
    } else if (statusAtual === 'Entregue' || statusAtual === 'concluido' || statusAtual === 'Entregue / Concluído') {
      qtdConcluidos++;
    }
  });

  if (elFaturamento) elFaturamento.textContent = `R$ ${faturamentoTotal.toFixed(2).replace('.', ',')}`;
  if (elPedidosPendentes) elPedidosPendentes.textContent = `${qtdPendentes} Pendentes`;
  if (elSubtextoPendentes) elSubtextoPendentes.innerHTML = `📦 ${qtdPendentes} separando • 🚚 ${qtdACaminho} a caminho • ✅ ${qtdConcluidos} entregues`;
  if (badgeContador) badgeContador.textContent = `${qtdPendentes} para separar`;

  // Renderiza a lista de pedidos recentes com layout corrigido e alinhado
  if (listaPedidosContainer) {
    const pedidosAtivos = pedidos.filter(p => (p.status || '') !== 'Cancelado');
    if (pedidosAtivos.length === 0) {
      listaPedidosContainer.innerHTML = `<div style="text-align: center; padding: 2rem; color: #64748b;"><p>Nenhum pedido ativo no momento. 📦</p></div>`;
      return;
    }
    listaPedidosContainer.innerHTML = '';
    
    // Exibe no máximo 3 pedidos recentes organizados
    pedidosAtivos.slice().reverse().slice(0, 3).forEach((pedido, index) => {
      const idPedido = pedido.id || pedido.numero || `849${index}`;
      const statusAtual = pedido.status || 'Em Separação';
      const totalPedido = parseFloat(pedido.total || 0).toFixed(2).replace('.', ',');
      
      const article = document.createElement('article');
      article.className = 'pedido-card-admin';
      article.style.cssText = "background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 16px; margin-bottom: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);";
      
      article.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <strong style="font-size: 0.95rem; color: #0f172a;">Pedido #${String(idPedido).replace('#', '')}</strong>
          <span style="padding: 3px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: bold; background: #fef3c7; color: #92400e;">${statusAtual}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; border-top: 1px solid #f1f5f9; padding-top: 8px;">
          <span style="color: #64748b;">Total: <strong style="color: #0f172a;">R$ ${totalPedido}</strong></span>
          <a href="pedidos-pendentes.html" style="color: #2563eb; text-decoration: none; font-weight: 600;">Gerenciar →</a>
        </div>
      `;
      listaPedidosContainer.appendChild(article);
    });
  }
}

/**
 * 2. CARREGAMENTO DOS PRODUTOS (Limitado a no máximo 3 itens no painel)
 */
function carregarProdutosAdmin() {
  const tabelaCorpo = document.getElementById('tabela-produtos-corpo');
  if (!tabelaCorpo) return;

  let dadosBrutos = 
    localStorage.getItem('produtos_loja') || 
    localStorage.getItem('produtos') || 
    localStorage.getItem('lista_produtos');

  let produtos = [];
  try {
    produtos = dadosBrutos ? JSON.parse(dadosBrutos) : [];
  } catch (e) {
    produtos = [];
  }

  if (!Array.isArray(produtos)) {
    produtos = [produtos];
  }
  produtos = produtos.filter(p => p && typeof p === 'object' && (p.nome || p.preco));

  if (produtos.length === 0) {
    tabelaCorpo.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2rem; color: #64748b;">Nenhum produto cadastrado na base. 📦</td></tr>`;
    return;
  }

  tabelaCorpo.innerHTML = '';

  // Exibe apenas os 3 primeiros produtos por questão de estética no painel
  produtos.slice(0, 3).forEach((produto, index) => {
    const nomeProduto = produto.nome || produto.titulo || 'Produto sem nome';
    const precoFormatado = parseFloat(produto.preco || produto.valor || 0).toFixed(2).replace('.', ',');
    const estoque = produto.estoque !== undefined ? produto.estoque : 0;
    const idItem = produto.id || index;
    const categoria = produto.categoria || 'Geral';
    const thumbnail = produto.imagem || produto.foto || '📦';

    let thumbHtml = thumbnail;
    if (typeof thumbnail === 'string' && (thumbnail.startsWith('data:image') || thumbnail.startsWith('http'))) {
      thumbHtml = `<img src="${thumbnail}" alt="" style="width: 32px; height: 32px; object-fit: cover; border-radius: 4px;">`;
    }

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div class="produto-item-celula" style="display: flex; align-items: center; gap: 10px;">
          <span class="emoji-thumb" style="font-size: 1.5rem;">${thumbHtml}</span>
          <div>
            <span class="prod-nome-tabela" style="font-weight: 600; display: block; color: #1e293b;">${nomeProduto}</span>
            <span class="prod-categoria" style="font-size: 0.75rem; color: #64748b;">${categoria}</span>
          </div>
        </div>
      </td>
      <td><strong>R$ ${precoFormatado}</strong></td>
      <td><span class="tag-estoque ${estoque > 5 ? 'ok' : 'alerta'}">${estoque} un.</span></td>
      <td><span class="tag-metrica views">👁️ ${produto.views || 0}</span></td>
      <td><span class="tag-metrica vendas">🛍️ ${produto.vendas || 0}</span></td>
      <td class="text-right">
        <button type="button" class="btn-tb-acao btn-tb-editar" onclick="editarProduto('${idItem}')">✏️ Editar</button>
        <button type="button" class="btn-tb-acao btn-tb-excluir" onclick="excluirProduto('${idItem}')">🗑️</button>
      </td>
    `;
    tabelaCorpo.appendChild(tr);
  });
}

function excluirProduto(idOuIndex) {
  if (confirm('Tem certeza que deseja excluir este produto?')) {
    // Descobre em qual chave os produtos realmente estão salvos (mesma lógica de carregarProdutosAdmin)
    const chaveComDados = ['produtos_loja', 'produtos', 'lista_produtos']
      .find(chave => localStorage.getItem(chave));

    if (!chaveComDados) return;

    let produtos = JSON.parse(localStorage.getItem(chaveComDados)) || [];
    produtos = produtos.filter((p, index) => (p.id ? String(p.id) !== String(idOuIndex) : index != Number(idOuIndex)));
    localStorage.setItem(chaveComDados, JSON.stringify(produtos));
    carregarProdutosAdmin();
  }
}

function editarProduto(idOuIndex) {
  window.location.href = `cadastro-produto.html?id=${idOuIndex}`;
}

/**
 * 3. CARREGAMENTO DOS BANNERS DO CARROSSEL
 */
const CORES_BANNER_PREVIEW = {
  azul: '#2563eb',
  laranja: '#d85a30',
  escuro: '#0f172a'
};

function carregarBannersAdmin() {
  const container = document.getElementById('lista-banners-admin');
  if (!container) return;

  const banners = JSON.parse(localStorage.getItem('banners_loja')) || [];

  if (banners.length === 0) {
    container.innerHTML = `<p style="text-align: center; padding: 1.5rem; color: #64748b; font-size: 0.85rem;">Nenhum banner cadastrado ainda — o carrossel da loja está mostrando os 3 banners de exemplo. 📦</p>`;
    return;
  }

  container.innerHTML = '';

  banners
    .slice()
    .sort((a, b) => (a.ordem || 1) - (b.ordem || 1))
    .forEach(banner => {
      const corFundo = banner.imagem ? '#e2e8f0' : (CORES_BANNER_PREVIEW[banner.cor] || '#2563eb');

      const linha = document.createElement('div');
      linha.style.cssText = "display: flex; align-items: center; gap: 12px; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 12px;";
      linha.innerHTML = `
        <div style="width: 56px; height: 40px; border-radius: 6px; background: ${corFundo}; background-size: cover; background-position: center; flex-shrink: 0;" ${banner.imagem ? `data-bg="${banner.imagem}"` : ''}></div>
        <div style="flex-grow: 1; min-width: 0;">
          <div style="font-weight: 700; color: #0f172a; font-size: 0.88rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${banner.titulo || 'Sem título'}</div>
          <div style="font-size: 0.75rem; color: #94a3b8;">Ordem ${banner.ordem || 1} • ${banner.ativo !== false ? 'Ativo' : 'Inativo'}</div>
        </div>
        <button type="button" class="btn-tb-acao btn-tb-editar" onclick="editarBanner('${banner.id}')">✏️ Editar</button>
        <button type="button" class="btn-tb-acao btn-tb-excluir" onclick="excluirBanner('${banner.id}')">🗑️</button>
      `;
      container.appendChild(linha);

      // Aplica a imagem de fundo via JS (evita quebrar o innerHTML com aspas da base64)
      if (banner.imagem) {
        linha.querySelector('[data-bg]').style.backgroundImage = `url(${banner.imagem})`;
      }
    });
}

function excluirBanner(id) {
  if (confirm('Tem certeza que deseja excluir este banner?')) {
    let banners = JSON.parse(localStorage.getItem('banners_loja')) || [];
    banners = banners.filter(b => String(b.id) !== String(id));
    localStorage.setItem('banners_loja', JSON.stringify(banners));
    carregarBannersAdmin();
  }
}

function editarBanner(id) {
  window.location.href = `Cadastrar-banner.html?id=${id}`;
}