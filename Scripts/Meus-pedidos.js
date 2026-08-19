document.addEventListener('DOMContentLoaded', () => {
  carregarMeusPedidos();
});

// Ícones SVG usados nos cards (mesmo padrão de linha usado no resto do site)
function svgIcone(paths, tamanho = 18) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:${tamanho}px; height:${tamanho}px;">${paths}</svg>`;
}

const ICONE_CHECK = svgIcone('<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>');
const ICONE_PACOTE = svgIcone('<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line>');
const ICONE_CAMINHAO = svgIcone('<rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle>');
const ICONE_CASA = svgIcone('<path d="M3 10.5 12 3l9 7.5"></path><path d="M5 9.5V21h14V9.5"></path>');
const ICONE_FONE_OUVIDO = svgIcone('<path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>', 18);

function carregarMeusPedidos() {
  const containerPedidos = document.getElementById('container-meus-pedidos');
  
  if (!containerPedidos) return;

  const usuarioLogado = JSON.parse(localStorage.getItem('usuario_logado'));

  if (!usuarioLogado || !usuarioLogado.email) {
    containerPedidos.innerHTML = `
      <div style="text-align: center; padding: 3rem 1rem; color: #64748b;">
        <p style="font-size: 1.1rem; margin-bottom: 0.5rem;">Faça login para ver seus pedidos. 🔒</p>
        <a href="Login.html" style="color: #2563eb; font-weight: 600; text-decoration: none;">Entrar na minha conta</a>
      </div>
    `;
    return;
  }

  const todoHistorico = JSON.parse(localStorage.getItem('historico_pedidos_cliente')) || [];

  // Mostra apenas os pedidos que pertencem ao usuário logado no momento
  const historicoCliente = todoHistorico.filter(pedido =>
    pedido.cliente &&
    pedido.cliente.email &&
    pedido.cliente.email.toLowerCase() === usuarioLogado.email.toLowerCase()
  );

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

    // Monta a lista de itens do pedido (uma linha por item: "1x Nome do produto")
    let itensHtml = '';
    const itens = pedido.itens || [];
    if (itens.length > 0) {
      itens.forEach(item => {
        const qtdItem = parseInt(item.quantidade || 1);
        const nomeItem = item.nome || 'Produto';
        const imgItem = item.imagem || item.img || '';
        const ehImagemUrl = typeof imgItem === 'string' && imgItem.startsWith('http');

        itensHtml += `
          <div style="display: flex; align-items: center; gap: 10px; background: #f8fafc; padding: 10px 12px; border-radius: 10px; margin-bottom: 8px;">
            <span style="color: #64748b; flex-shrink: 0;">
              ${ehImagemUrl ? `<img src="${imgItem}" style="width:18px; height:18px; object-fit:cover; border-radius:4px;">` : ICONE_FONE_OUVIDO}
            </span>
            <span style="font-size: 0.88rem; color: #334155;"><strong style="color:#0f172a;">${qtdItem}x</strong> ${nomeItem}</span>
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
    let textoStatusGeral = 'EM SEPARAÇÃO';
    let estiloBadgeGeral = "background: #ffedd5; color: #c2410c;";

    if (isCancelado) {
      textoStatusGeral = 'CANCELADO';
      estiloBadgeGeral = "background: #fee2e2; color: #991b1b;";
    } else if (isEntregue) {
      textoStatusGeral = 'ENTREGUE';
      estiloBadgeGeral = "background: #dcfce7; color: #166534;";
    } else if (isTransporte) {
      textoStatusGeral = 'EM TRÂNSITO';
      estiloBadgeGeral = "background: #e0f2fe; color: #0369a1;";
    }

    // Cores/ícones dos 4 passos da linha do tempo (azul = concluído/atual, cinza claro = pendente)
    const passoConcluido = (fundo, iconeCor) => `background:${fundo}; color:${iconeCor};`;

    const estiloAprovado = passoConcluido('#2563eb', '#ffffff'); // todo pedido válido já foi aprovado
    const estiloSeparacao = (isSeparacao || isTransporte || isEntregue) ? passoConcluido('#2563eb', '#ffffff') : passoConcluido('#f1f5f9', '#94a3b8');
    const estiloTransporte = (isTransporte || isEntregue) ? passoConcluido('#2563eb', '#ffffff') : passoConcluido('#f1f5f9', '#94a3b8');
    const estiloEntregue = isEntregue ? passoConcluido('#2563eb', '#ffffff') : passoConcluido('#f1f5f9', '#94a3b8');

    const corTextoAprovado = '#2563eb';
    const corTextoSeparacao = (isSeparacao || isTransporte || isEntregue) ? '#2563eb' : '#94a3b8';
    const corTextoTransporte = (isTransporte || isEntregue) ? '#2563eb' : '#94a3b8';
    const corTextoEntregue = isEntregue ? '#2563eb' : '#94a3b8';

    // Regra para habilitar o botão de cancelamento (somente se estiver em separação)
    const podeCancelar = !isCancelado && isSeparacao;

    // Monta o card
    const card = document.createElement('div');
    card.className = 'pedido-card';
    card.style.cssText = "background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 1.25rem; margin-bottom: 1.25rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);";
    
    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
        <div>
          <span style="font-weight: 700; color: #0f172a; font-size: 1.1rem; display: block;">#${String(idPedido).replace('#', '')}</span>
          <span style="font-size: 0.8rem; color: #64748b;">Realizado em ${dataPedido}</span>
        </div>
        <span style="${estiloBadgeGeral} padding: 5px 12px; border-radius: 20px; font-size: 0.72rem; font-weight: 800; letter-spacing: 0.3px;">${textoStatusGeral}</span>
      </div>

      <div style="margin-bottom: 1rem;">
        ${itensHtml}
      </div>

      ${isCancelado ? `
        <div style="text-align: center; color: #991b1b; font-size: 0.85rem; font-weight: 600; padding: 10px; background: #fee2e2; border-radius: 10px; margin-bottom: 1rem;">
          Este pedido foi cancelado.
        </div>
      ` : `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; text-align: center;">
          <div style="display: flex; flex-direction: column; align-items: center; flex: 1;">
            <div style="width: 38px; height: 38px; ${estiloAprovado} border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 6px;">${ICONE_CHECK}</div>
            <span style="font-size: 0.72rem; font-weight: 700; color: ${corTextoAprovado};">Aprovado</span>
          </div>
          <div style="display: flex; flex-direction: column; align-items: center; flex: 1;">
            <div style="width: 38px; height: 38px; ${estiloSeparacao} border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 6px;">${ICONE_PACOTE}</div>
            <span style="font-size: 0.72rem; font-weight: 700; color: ${corTextoSeparacao};">Separação</span>
          </div>
          <div style="display: flex; flex-direction: column; align-items: center; flex: 1;">
            <div style="width: 38px; height: 38px; ${estiloTransporte} border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 6px;">${ICONE_CAMINHAO}</div>
            <span style="font-size: 0.72rem; font-weight: 700; color: ${corTextoTransporte};">Trânsito</span>
          </div>
          <div style="display: flex; flex-direction: column; align-items: center; flex: 1;">
            <div style="width: 38px; height: 38px; ${estiloEntregue} border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 6px;">${ICONE_CASA}</div>
            <span style="font-size: 0.72rem; font-weight: 700; color: ${corTextoEntregue};">Entregue</span>
          </div>
        </div>
      `}

      <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f1f5f9; padding-top: 0.85rem;">
        <div>
          <span style="font-size: 0.78rem; color: #64748b; display: block;">Total Pago</span>
          <strong style="color: #0f172a; font-size: 1.1rem;">R$ ${totalPedido}</strong>
        </div>

        <div>
          ${podeCancelar ? `
            <button type="button" onclick="cancelarMeuPedido('${idPedido}')" style="background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; padding: 8px 16px; border-radius: 20px; cursor: pointer; font-size: 0.8rem; font-weight: 700;">
              Cancelar Pedido
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
