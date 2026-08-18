document.addEventListener('DOMContentLoaded', () => {
  carregarDashboardAdmin();
});

function carregarDashboardAdmin() {
  const pedidosLoja = JSON.parse(localStorage.getItem('pedidos_loja')) || [];
  const historicoCliente = JSON.parse(localStorage.getItem('historico_pedidos_cliente')) || [];

  // Unifica os pedidos pelo ID ou número para evitar duplicatas
  const todosPedidosMap = new Map();
  [...pedidosLoja, ...historicoCliente].forEach(pedido => {
    const identificador = pedido.id || pedido.numero;
    if (identificador) {
      todosPedidosMap.set(String(identificador), pedido);
    }
  });

  const pedidos = Array.from(todosPedidosMap.values());

  // Seletores dos KPIs no HTML
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

    // Faturamento considera apenas pedidos que não foram cancelados
    if (statusAtual !== 'Cancelado') {
      faturamentoTotal += valorNumerico;
    }

    // Contagem por categorias de status
    if (statusAtual === 'Em Separação' || statusAtual === 'separacao' || statusAtual === 'Pendente') {
      qtdPendentes++;
    } else if (statusAtual === 'Em Transporte' || statusAtual === 'transporte' || statusAtual === 'A caminho') {
      qtdACaminho++;
    } else if (statusAtual === 'Entregue' || statusAtual === 'concluido' || statusAtual === 'Entregue / Concluído') {
      qtdConcluidos++;
    }
  });

  // Atualiza os valores na tela do Dashboard
  if (elFaturamento) {
    elFaturamento.textContent = `R$ ${faturamentoTotal.toFixed(2).replace('.', ',')}`;
  }

  if (elPedidosPendentes) {
    elPedidosPendentes.textContent = `${qtdPendentes} Pendentes`;
  }

  if (elSubtextoPendentes) {
    // Exibe o resumo detalhado solicitado (Pendentes, A caminho e Entregues)
    elSubtextoPendentes.innerHTML = `📦 ${qtdPendentes} separando • 🚚 ${qtdACaminho} a caminho • ✅ ${qtdConcluidos} entregues`;
  }

  if (badgeContador) {
    badgeContador.textContent = `${qtdPendentes} para separar`;
  }

  // Renderiza apenas a prévia dos pedidos recentes na home do admin
  if (listaPedidosContainer) {
    const pedidosAtivos = pedidos.filter(p => (p.status || '') !== 'Cancelado');

    if (pedidosAtivos.length === 0) {
      listaPedidosContainer.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: #64748b;">
          <p style="font-size: 1rem;">Nenhum pedido ativo no momento. 📦</p>
        </div>
      `;
      return;
    }

    listaPedidosContainer.innerHTML = '';

    // Exibe os últimos pedidos ordenados do mais recente para o mais antigo
    pedidosAtivos.slice().reverse().slice(0, 3).forEach((pedido, index) => {
      const idPedido = pedido.id || pedido.numero || `849${index}`;
      const dataPedido = pedido.data || 'Data recente';
      const nomeCliente = pedido.cliente?.nome || pedido.endereco?.nome || 'Cliente da Loja';
      const statusAtual = pedido.status || 'Em Separação';
      const totalPedido = parseFloat(pedido.total || 0).toFixed(2).replace('.', ',');

      let estiloStatus = "background: #fef3c7; color: #b45309;"; // Amarelo
      if (statusAtual === 'Entregue' || statusAtual === 'concluido') {
        estiloStatus = "background: #dcfce7; color: #166534;"; // Verde
      } else if (statusAtual === 'Em Transporte' || statusAtual === 'transporte') {
        estiloStatus = "background: #e0f2fe; color: #0369a1;"; // Azul
      }

      const article = document.createElement('article');
      article.className = 'pedido-card-admin';
      article.style.cssText = "background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1rem; margin-bottom: 1rem;";
      
      article.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <div>
            <strong style="color: #0f172a; font-size: 1rem;">Pedido #${String(idPedido).replace('#', '')}</strong>
            <span style="font-size: 0.75rem; color: #64748b; display: block;">👤 ${nomeCliente} • 📅 ${dataPedido}</span>
          </div>
          <span style="${estiloStatus} padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: bold; text-transform: uppercase;">${statusAtual}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f1f5f9; padding-top: 8px; font-size: 0.85rem;">
          <span style="color: #64748b;">Total: <strong>R$ ${totalPedido}</strong></span>
          <a href="pedidos-pendentes.html" style="color: #2563eb; text-decoration: none; font-weight: bold; font-size: 0.8rem;">Gerenciar na Central →</a>
        </div>
      `;

      listaPedidosContainer.appendChild(article);
    });
  }
}