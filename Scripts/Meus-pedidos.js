document.addEventListener('DOMContentLoaded', () => {
  carregarMeusPedidos();
});

function carregarMeusPedidos() {
  const containerPedidos = document.getElementById('container-meus-pedidos');
  
  if (!containerPedidos) return;

  const historicoCliente = JSON.parse(localStorage.getItem('historico_pedidos_cliente')) || [];

  if (historicoCliente.length === 0) {
    containerPedidos.innerHTML = `
      <div style="text-align: center; padding: 3rem 1rem; color: #64748b;">
        <p style="font-size: 1.1rem; margin-bottom: 0.5rem;">Você ainda não fez nenhum pedido. 🛒</p>
        <p style="font-size: 0.85rem;">Seus pedidos realizados aparecerão aqui para acompanhamento.</p>
      </div>
    `;
    return;
  }

  containerPedidos.innerHTML = '';

  // Exibe do pedido mais recente para o mais antigo
  historicoCliente.slice().reverse().forEach((pedido, index) => {
    const idPedido = pedido.id || pedido.numero || `849${index}`;
    const dataPedido = pedido.data || '18 de agosto de 2026';
    const statusAtual = pedido.status || 'Em Separação';
    const totalPedido = parseFloat(pedido.total || 0).toFixed(2).replace('.', ',');

    // Monta a lista de itens do pedido dinamicamente
    let itensHtml = '';
    const itens = pedido.itens || [];
    if (itens.length > 0) {
      itens.forEach(item => {
        const precoItem = parseFloat(item.preco || 0);
        const qtdItem = parseInt(item.quantidade || 1);
        const nomeItem = item.nome || 'Produto';
        const imgItem = item.imagem || item.img || '📦';
        
        itensHtml += `
          <div style="display: flex; align-items: center; gap: 12px; background: #f8fafc; padding: 10px 12px; border-radius: 10px; margin-bottom: 8px; border: 1px solid #f1f5f9;">
            <div style="width: 36px; height: 36px; background: #fff; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; border: 1px solid #e2e8f0; flex-shrink: 0;">
              ${typeof imgItem === 'string' && imgItem.startsWith('http') ? `<img src="${imgItem}" style="width:100%; height:100%; object-fit:cover; border-radius:8px;">` : '📦'}
            </div>
            <div style="flex-grow: 1;">
              <div style="font-weight: 600; font-size: 0.9rem; color: #1e293b;">${nomeItem}</div>
              <div style="font-size: 0.8rem; color: #64748b;">Qtd: ${qtdItem} • R$ ${(precoItem * qtdItem).toFixed(2).replace('.', ',')}</div>
            </div>
          </div>
        `;
      });
    } else {
      itensHtml = `<div style="font-size: 0.85rem; color: #64748b; padding: 8px 0;">Detalhes dos itens indisponíveis</div>`;
    }

    // Verifica se o pedido está cancelado
    const isCancelado = statusAtual === 'Cancelado' || statusAtual === 'cancelado';
    
    // Tratamento dos status para a linha do tempo e badges
    const st = (statusAtual || '').toLowerCase();
    const isSeparacao = st.includes('separação') || st === 'separacao' || st === 'pendente';
    const isTransporte = st.includes('transporte') || st.includes('trânsito') || st.includes('caminho');
    const isEntregue = st.includes('entregue') || st.includes('concluido');

    // Textos e cores do badge geral do topo
    let textoStatusGeral = 'Em Andamento';
    let estiloBadgeGeral = "background: #eff6ff; color: #1d4ed8;";

    if (isCancelado) {
      textoStatusGeral = 'Cancelado';
      estiloBadgeGeral = "background: #fee2e2; color: #991b1b;";
    } else if (isEntregue) {
      textoStatusGeral = 'Entregue';
      estiloBadgeGeral = "background: #dcfce7; color: #166534;";
    } else if (isTransporte) {
      textoStatusGeral = 'A Caminho';
      estiloBadgeGeral = "background: #e0f2fe; color: #0369a1;";
    }

    // Estilos dinâmicos para os círculos da linha do tempo baseados no admin
    const corAprovado = "#16a34a"; // Verde fixo pois todo pedido válido é aprovado
    
    const corSeparacao = (isSeparacao || isTransporte || isEntregue) ? "#2563eb" : "#cbd5e1";
    const opacSeparacao = (isSeparacao || isTransporte || isEntregue) ? "1" : "0.4";
    
    const corTransporte = (isTransporte || isEntregue) ? "#2563eb" : "#cbd5e1";
    const opacTransporte = (isTransporte || isEntregue) ? "1" : "0.4";

    const corEntregue = isEntregue ? "#16a34a" : "#cbd5e1";
    const opacEntregue = isEntregue ? "1" : "0.4";

    // Regra para habilitar o botão de cancelamento (somente se estiver em separação)
    const podeCancelar = !isCancelado && isSeparacao;

    // Monta o card estruturado mantendo o design original
    const card = document.createElement('div');
    card.className = 'pedido-card';
    card.style.cssText = "background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 1.25rem; margin-bottom: 1.25rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);";
    
    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
        <div>
          <span style="font-weight: 700; color: #0f172a; font-size: 1.1rem; display: block;">Pedido #${String(idPedido).replace('#', '')}</span>
          <span style="font-size: 0.8rem; color: #64748b;">Realizado em ${dataPedido}</span>
        </div>
        <span style="${estiloBadgeGeral} padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase;">${textoStatusGeral}</span>
      </div>

      <div style="margin-bottom: 1rem;">
        ${itensHtml}
      </div>

      <div style="background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 12px; padding: 1rem; margin-bottom: 1rem;">
        <div style="font-weight: 600; font-size: 0.85rem; color: #334155; margin-bottom: 10px;">Status da Entrega</div>
        
        ${isCancelado ? `
          <div style="text-align: center; color: #991b1b; font-size: 0.85rem; font-weight: 600; padding: 8px; background: #fee2e2; border-radius: 8px;">
            ❌ Este pedido foi cancelado.
          </div>
        ` : `
          <div style="display: flex; justify-content: space-between; align-items: center; position: relative; margin-bottom: 8px; text-align: center;">
            <div style="display: flex; flex-direction: column; align-items: center; flex: 1; z-index: 1;">
              <div style="width: 28px; height: 28px; background: ${corAprovado}; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; margin-bottom: 4px;">✓</div>
              <span style="font-size: 0.75rem; font-weight: 600; color: #1e293b;">Aprovado</span>
            </div>
            <div style="display: flex; flex-direction: column; align-items: center; flex: 1; z-index: 1; opacity: ${opacSeparacao};">
              <div style="width: 28px; height: 28px; background: ${corSeparacao}; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; margin-bottom: 4px;">📦</div>
              <span style="font-size: 0.75rem; font-weight: 600; color: #1e293b;">Em Separação</span>
            </div>
            <div style="display: flex; flex-direction: column; align-items: center; flex: 1; z-index: 1; opacity: ${opacTransporte};">
              <div style="width: 28px; height: 28px; background: ${corTransporte}; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; margin-bottom: 4px;">🚚</div>
              <span style="font-size: 0.75rem; font-weight: ${isTransporte ? '600' : '500'}; color: #64748b;">Em Trânsito</span>
            </div>
            <div style="display: flex; flex-direction: column; align-items: center; flex: 1; z-index: 1; opacity: ${opacEntregue};">
              <div style="width: 28px; height: 28px; background: ${corEntregue}; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; margin-bottom: 4px;">🏠</div>
              <span style="font-size: 0.75rem; font-weight: ${isEntregue ? '600' : '500'}; color: #64748b;">Entregue</span>
            </div>
          </div>
        `}

        <div style="text-align: center; font-size: 0.75rem; color: #64748b; margin-top: 8px; border-top: 1px dashed #e2e8f0; padding-top: 8px;">
          Pagamento via: <strong>PIX (Aprovação Instantânea)</strong>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f1f5f9; padding-top: 0.85rem;">
        <div>
          <span style="font-size: 0.8rem; color: #64748b; display: block;">Total Pago:</span>
          <strong style="color: #0f172a; font-size: 1.05rem;">R$ ${totalPedido}</strong>
        </div>

        <div>
          ${podeCancelar ? `
            <button type="button" onclick="cancelarMeuPedido('${idPedido}')" style="background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; padding: 7px 12px; border-radius: 8px; cursor: pointer; font-size: 0.8rem; font-weight: 600; display: flex; align-items: center; gap: 4px;">
              ❌ Cancelar Pedido
            </button>
          ` : isCancelado ? `
            <span style="font-size: 0.75rem; color: #991b1b; font-weight: 600;">Cancelado pelo cliente</span>
          ` : `
            <span style="font-size: 0.75rem; color: #64748b; font-style: italic;">Não pode mais ser cancelado</span>
          `}
        </div>
      </div>
    `;

    containerPedidos.appendChild(card);
  });
}

function cancelarMeuPedido(idPedido) {
  if (!confirm('Deseja realmente cancelar este pedido?')) return;

  let historico = JSON.parse(localStorage.getItem('historico_pedidos_cliente')) || [];
  let pedidosLoja = JSON.parse(localStorage.getItem('pedidos_loja')) || [];

  const idLimpo = String(idPedido).replace('#', '');

  // Atualiza no histórico do cliente
  historico = historico.map(p => {
    const pId = String(p.id || '').replace('#', '');
    const pNum = String(p.numero || '').replace('#', '');
    if (pId === idLimpo || pNum === idLimpo) {
      p.status = 'Cancelado';
    }
    return p;
  });

  // Atualiza também na lista do painel administrativo
  pedidosLoja = pedidosLoja.map(p => {
    const pId = String(p.id || '').replace('#', '');
    const pNum = String(p.numero || '').replace('#', '');
    if (pId === idLimpo || pNum === idLimpo) {
      p.status = 'Cancelado';
    }
    return p;
  });

  localStorage.setItem('historico_pedidos_cliente', JSON.stringify(historico));
  localStorage.setItem('pedidos_loja', JSON.stringify(pedidosLoja));

  alert('Pedido cancelado com sucesso.');
  carregarMeusPedidos();
}