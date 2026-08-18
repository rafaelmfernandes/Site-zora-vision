// ==========================================
// 1. ESTADO GLOBAL DA APLICAÇÃO (CARRINHO E CHECKOUT)
// ==========================================
const checkoutState = {
    carrinho: JSON.parse(localStorage.getItem('carrinho_app')) || [], // Lê os produtos do localStorage
    cupomAtivo: null,
    descontoPorcentagem: 0,
    metodoPagamento: 'pix',
    taxaEntrega: 5.00
};

// ==========================================
// 2. BANCO DE DADOS LOCAL DOS PRODUTOS
// ==========================================
const PRODUTOS_BD = {
    'fone-01': {
        id: 'fone-01',
        nome: 'Fone de Ouvido Bluetooth Premium',
        preco: '189.90',
        icone: '🎧',
        descricao: 'Fone de ouvido sem fio com cancelamento de ruído ativo, bateria de até 30 horas de duração e conexão Bluetooth 5.2 de alta estabilidade.',
        comentarios: [
            { autor: 'Carlos Silva', nota: '⭐⭐⭐⭐⭐', texto: 'Excelente qualidade de som e bateria duradoura!' },
            { autor: 'Ana Paula', nota: '⭐⭐⭐⭐', texto: 'Muito confortável, chegou super rápido.' }
        ],
        relacionados: ['deco-02']
    },
    'deco-02': {
        id: 'deco-02',
        nome: 'Luminária de Mesa Minimalista',
        preco: '120.00',
        icone: '💡',
        descricao: 'Luminária LED minimalista com ajuste de intensidade de luz (dimmer), haste flexível e carregamento via cabo USB-C.',
        comentarios: [],
        relacionados: ['fone-01']
    }
};

// ==========================================
// 3. MÓDULO DE OPERAÇÕES DO CARRINHO
// ==========================================
const CarrinhoCheckoutModule = {

    init() {
        this.bindEvents();
        this.atualizarTudo();
    },

    salvarStorage() {
        localStorage.setItem('carrinho_app', JSON.stringify(checkoutState.carrinho));
    },

    adicionarProduto(produto) {
        const itemExistente = checkoutState.carrinho.find(item => item.id === produto.id);

        if (itemExistente) {
            itemExistente.quantidade += 1;
        } else {
            checkoutState.carrinho.push({
                id: produto.id,
                nome: produto.nome,
                preco: parseFloat(produto.preco),
                quantidade: 1
            });
        }

        this.salvarStorage();
        this.atualizarTudo();
    },

    removerProduto(id) {
        checkoutState.carrinho = checkoutState.carrinho.filter(item => item.id !== id);
        this.salvarStorage();
        this.atualizarTudo();
    },

    alterarQuantidade(id, delta) {
        const item = checkoutState.carrinho.find(item => item.id === id);
        if (!item) return;

        item.quantidade += delta;

        if (item.quantidade <= 0) {
            this.removerProduto(id);
        } else {
            this.salvarStorage();
            this.atualizarTudo();
        }
    },

    calcularValores() {
        const subtotal = checkoutState.carrinho.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);
        const valorDesconto = subtotal * (checkoutState.descontoPorcentagem / 100);
        const taxaEntrega = subtotal > 0 ? checkoutState.taxaEntrega : 0;
        const total = Math.max(0, subtotal - valorDesconto + taxaEntrega);

        return { subtotal, valorDesconto, taxaEntrega, total };
    },

    renderizarCarrinho() {
        const containerLista = document.getElementById('lista-carrinho');
        if (!containerLista) return;

        if (checkoutState.carrinho.length === 0) {
            containerLista.innerHTML = `
                <div style="text-align: center; padding: 2rem 1rem; color: #6b7280;">
                    <p style="font-size: 0.95rem; margin-bottom: 0.5rem;">Seu carrinho está vazio 🛒</p>
                    <small>Adicione itens do catálogo para começar.</small>
                </div>`;
            return;
        }

        containerLista.innerHTML = checkoutState.carrinho.map(item => `
            <div class="carrinho-item" data-id="${item.id}" style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid #f3f4f6;">
                <div class="info-item">
                    <strong style="display: block; font-size: 0.9rem; color: #1f2937;">${item.nome}</strong>
                    <span style="font-size: 0.85rem; color: #2563eb; font-weight: 600;">R$ ${(item.preco * item.quantidade).toFixed(2).replace('.', ',')}</span>
                </div>
                <div class="controles-quantidade" style="display: flex; align-items: center; gap: 0.5rem;">
                    <button class="btn-qtd" onclick="CarrinhoCheckoutModule.alterarQuantidade('${item.id}', -1)" style="padding: 2px 8px; cursor: pointer;">-</button>
                    <span style="font-weight: 600; font-size: 0.9rem;">${item.quantidade}</span>
                    <button class="btn-qtd" onclick="CarrinhoCheckoutModule.alterarQuantidade('${item.id}', 1)" style="padding: 2px 8px; cursor: pointer;">+</button>
                </div>
            </div>
        `).join('');
    },

    atualizarResumoValores() {
        const { total } = this.calcularValores();

        const elTotal = document.querySelector('#valor-total, .resumo-total, .resumo-fixo .total, #total-carrinho');
        if (elTotal) elTotal.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;

        const totalItens = checkoutState.carrinho.reduce((acc, item) => acc + item.quantidade, 0);
        document.querySelectorAll('.badge-carrinho, .carrinho-badge, .carrinho-count, .badge').forEach(badge => {
            badge.textContent = totalItens;
        });
    },

    atualizarTudo() {
        this.renderizarCarrinho();
        this.atualizarResumoValores();
    },

    bindEvents() {
        // Escuta a seleção do radio de forma de pagamento no Checkout.html
        document.querySelectorAll('input[name="pagamento"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                checkoutState.metodoPagamento = e.target.value;
                localStorage.setItem('ultimo_metodo_pagamento', e.target.value);
            });
        });
    }
};

// ==========================================
// 4. AÇÃO DO BOTÃO FINALIZAR PEDIDO (CARRINHO -> CHECKOUT)
// ==========================================
function finalizarPedido() {
    if (!checkoutState.carrinho || checkoutState.carrinho.length === 0) {
        alert("Seu carrinho está vazio! Adicione algum produto antes de finalizar.");
        return;
    }
    window.location.href = "Checkout.html";
}

// ==========================================
// 5. CARREGAMENTO DINÂMICO PARA PRODUTOS.HTML
// ==========================================
function carregarDetalhesProduto() {
    const urlParams = new URLSearchParams(window.location.search);
    const produtoId = urlParams.get('id') || 'fone-01';
    const produto = PRODUTOS_BD[produtoId];

    if (!produto) return;

    const elTitulo = document.getElementById('prod-titulo');
    const elPreco = document.getElementById('prod-preco');
    const elImg = document.getElementById('prod-img');
    const elDesc = document.getElementById('prod-descricao');

    if (elTitulo) elTitulo.textContent = produto.nome;
    if (elPreco) elPreco.textContent = `R$ ${parseFloat(produto.preco).toFixed(2).replace('.', ',')}`;
    if (elImg) elImg.textContent = produto.icone;
    if (elDesc) elDesc.textContent = produto.descricao;

    const containerComentarios = document.getElementById('prod-comentarios');
    if (containerComentarios) {
        if (produto.comentarios && produto.comentarios.length > 0) {
            containerComentarios.innerHTML = produto.comentarios.map(c => `
                <div class="comentario-card" style="background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; padding:12px; margin-bottom:10px;">
                    <strong style="display:block; font-size:13px; color:#0f172a;">${c.autor} <span style="font-size:11px;">${c.nota}</span></strong>
                    <p style="font-size:12px; color:#475569; margin-top:4px;">"${c.texto}"</p>
                </div>
            `).join('');
        } else {
            containerComentarios.innerHTML = `
                <div style="text-align:center; padding:16px; background:#f1f5f9; border-radius:8px; color:#64748b; font-size:13px;">
                    <p>Este produto ainda não possui avaliações. Seja o primeiro a avaliar!</p>
                </div>`;
        }
    }

    const containerRelacionados = document.getElementById('prod-relacionados');
    if (containerRelacionados && produto.relacionados) {
        containerRelacionados.innerHTML = produto.relacionados.map(relId => {
            const rel = PRODUTOS_BD[relId];
            if (!rel) return '';
            return `
                <div class="card-produto" style="cursor:pointer;" data-id="${rel.id}">
                    <div class="card-img-box">${rel.icone}</div>
                    <h3>${rel.nome}</h3>
                    <span class="preco">R$ ${parseFloat(rel.preco).toFixed(2).replace('.', ',')}</span>
                    <button class="btn-adicionar" data-id="${rel.id}" data-nome="${rel.nome}" data-preco="${rel.preco}">
                        Adicionar ao Carrinho
                    </button>
                </div>
            `;
        }).join('');
    }
}

// ==========================================
// 6. CARREGAMENTO DINÂMICO PARA CHECKOUT.HTML
// ==========================================
function carregarCheckoutDinamico() {
    const containerItens = document.getElementById('chk-lista-itens');
    const elSubtotal = document.getElementById('chk-subtotal');
    const elFrete = document.getElementById('chk-frete');
    const elTotal = document.getElementById('chk-total');
    const elTitulo = document.getElementById('chk-titulo-itens');

    if (!containerItens) return;

    const carrinho = checkoutState.carrinho;

    if (carrinho.length === 0) {
        containerItens.innerHTML = '<p style="color:#64748b; font-size:13px;">Seu carrinho está vazio.</p>';
        return;
    }

    if (elTitulo) elTitulo.textContent = `📦 Itens do Pedido (${carrinho.reduce((acc, i) => acc + i.quantidade, 0)})`;

    containerItens.innerHTML = carrinho.map(item => `
        <div class="item-linha" style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:14px;">
            <span class="item-qtd-nome">${item.quantidade}x ${item.nome}</span>
            <span class="item-preco" style="font-weight:600;">R$ ${(item.preco * item.quantidade).toFixed(2).replace('.', ',')}</span>
        </div>
    `).join('');

    const { subtotal, taxaEntrega, total } = CarrinhoCheckoutModule.calcularValores();

    if (elSubtotal) elSubtotal.textContent = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
    if (elFrete) elFrete.textContent = `R$ ${taxaEntrega.toFixed(2).replace('.', ',')}`;
    if (elTotal) elTotal.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
}

// ==========================================
// 7. CARREGAMENTO DINÂMICO PARA PEDIDO-CONFIRMADO.HTML
// ==========================================
function carregarPedidoConfirmadoDinamico() {
    const elNumero = document.getElementById('conf-numero-pedido');
    const elData = document.getElementById('conf-data-pedido');
    const elHoraAprovado = document.getElementById('conf-hora-aprovado');
    const elPagamento = document.getElementById('conf-pagamento');
    const elListaItens = document.getElementById('conf-lista-itens');
    const elTotalPago = document.getElementById('conf-total-pago');

    if (!elNumero) return; // Se não for a página de confirmação, interrompe a execução

    // A. Tenta resgatar os dados do último pedido salvo ou do carrinho atual
    let pedidoAtual = JSON.parse(localStorage.getItem('ultimo_pedido_salvo'));

    if (!pedidoAtual && checkoutState.carrinho.length > 0) {
        const { total } = CarrinhoCheckoutModule.calcularValores();
        const numPedido = '#' + Math.floor(10000 + Math.random() * 90000);
        const dataAgora = new Date();
        const dataFormatada = dataAgora.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
        const horaFormatada = dataAgora.toLocaleDateString('pt-BR') + ' - ' + dataAgora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        const metodoSalvo = localStorage.getItem('ultimo_metodo_pagamento') || 'pix';
        const nomesMetodos = {
            'pix': 'PIX (Aprovação Instantânea)',
            'cartao': 'Cartão de Crédito',
            'boleto': 'Boleto Bancário'
        };

        pedidoAtual = {
            numero: numPedido,
            data: dataFormatada,
            hora: horaFormatada,
            pagamento: nomesMetodos[metodoSalvo] || 'PIX',
            itens: [...checkoutState.carrinho],
            total: total
        };

        // Salva para persistir se o usuário recarregar a tela
        localStorage.setItem('ultimo_pedido_salvo', JSON.stringify(pedidoAtual));

        // Esvazia o carrinho do navegador após confirmar
        checkoutState.carrinho = [];
        CarrinhoCheckoutModule.salvarStorage();
    }

    // B. Preenche o HTML se houver dados de um pedido
    if (pedidoAtual) {
        if (elNumero) elNumero.textContent = pedidoAtual.numero;
        if (elData) elData.textContent = pedidoAtual.data;
        if (elHoraAprovado) elHoraAprovado.textContent = pedidoAtual.hora;
        if (elPagamento) elPagamento.textContent = pedidoAtual.pagamento;
        if (elTotalPago) elTotalPago.textContent = `R$ ${pedidoAtual.total.toFixed(2).replace('.', ',')}`;

        if (elListaItens && pedidoAtual.itens) {
            elListaItens.innerHTML = pedidoAtual.itens.map(item => `
                <div style="display:flex; justify-content:space-between; margin-bottom:6px; color:#334155;">
                    <span>${item.quantidade}x ${item.nome}</span>
                    <span style="font-weight:600;">R$ ${(item.preco * item.quantidade).toFixed(2).replace('.', ',')}</span>
                </div>
            `).join('');
        }
    }
}

// ==========================================
// 8. LISTENERS DE CLIQUES GLOBAIS (NAVEGAÇÃO E CARDS)
// ==========================================
document.addEventListener('click', (e) => {

    // A. Clique no botão "Adicionar ao Carrinho"
    const btnAdicionar = e.target.closest('.btn-adicionar');
    if (btnAdicionar) {
        e.stopPropagation();
        
        const produto = {
            id: btnAdicionar.dataset.id || 'fone-01',
            nome: btnAdicionar.dataset.nome || 'Produto',
            preco: parseFloat(btnAdicionar.dataset.preco) || 0
        };

        CarrinhoCheckoutModule.adicionarProduto(produto);

        const textoOriginal = btnAdicionar.textContent;
        btnAdicionar.textContent = 'Adicionado! ✓';
        btnAdicionar.style.backgroundColor = '#10b981';

        setTimeout(() => {
            btnAdicionar.textContent = textoOriginal;
            btnAdicionar.style.backgroundColor = '';
        }, 1200);

        return;
    }

    // B. Clique no card do produto (Abre Produtos.html)
    const cardProduto = e.target.closest('.card-produto, .card');
    if (cardProduto) {
        const btn = cardProduto.querySelector('.btn-adicionar');
        const idProduto = (btn && btn.dataset.id) ? btn.dataset.id : 'fone-01';

        window.location.href = `Produtos.html?id=${idProduto}`;
    }
});

// ==========================================
// 9. INICIALIZAÇÃO E ROTEAMENTO AUTOMÁTICO
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    CarrinhoCheckoutModule.init();

    const paginaAtual = window.location.pathname.toLowerCase();

    // Roteia a lógica dependendo da página carregada
    if (paginaAtual.includes('produtos.html')) {
        carregarDetalhesProduto();
    } else if (paginaAtual.includes('checkout.html')) {
        carregarCheckoutDinamico();
    } else if (paginaAtual.includes('pedido-confirmado.html')) {
        carregarPedidoConfirmadoDinamico();
    }
});