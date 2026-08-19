// ==========================================
// 1. ESTADO GLOBAL DA APLICAÇÃO (Unificado com 'carrinho_db')
// ==========================================
const checkoutState = {
    carrinho: JSON.parse(localStorage.getItem('carrinho_db')) || 
              JSON.parse(localStorage.getItem('carrinho')) || 
              JSON.parse(localStorage.getItem('carrinho_app')) || [],
    cupomAtivo: null,
    descontoPorcentagem: 0,
    metodoPagamento: 'pix',
    taxaEntrega: 5.00
};

// Gera a chave de armazenamento do endereço específica de cada usuário logado,
// para o endereço de um cliente nunca aparecer para outro no mesmo navegador.
function chaveEnderecoCliente() {
    const usuarioLogado = JSON.parse(localStorage.getItem('usuario_logado'));
    if (usuarioLogado && usuarioLogado.email) {
        return 'ultimo_endereco_cliente_' + usuarioLogado.email.toLowerCase();
    }
    // Sem usuário logado, usa uma chave genérica (não deveria persistir de fato)
    return 'ultimo_endereco_cliente';
}

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
        try {
            // Mantém a imagem real de cada produto (inclusive fotos em base64),
            // pra ela continuar aparecendo certinho no carrinho e nos pedidos.
            localStorage.setItem('carrinho_db', JSON.stringify(checkoutState.carrinho));
            localStorage.setItem('carrinho', JSON.stringify(checkoutState.carrinho));
        } catch (e) {
            console.error("Erro ao salvar no localStorage: O armazenamento está cheio.", e);
            alert("O armazenamento do navegador ficou cheio (provavelmente por causa de fotos de produtos). Algumas informações podem não ser salvas corretamente.");
        }
    },

    adicionarProduto(produto) {
        const itemExistente = checkoutState.carrinho.find(item => item.id === produto.id);

        if (itemExistente) {
            itemExistente.quantidade += 1;
            // Atualiza a imagem caso tenha vindo uma nova preenchida agora
            if (produto.imagem) {
                itemExistente.imagem = produto.imagem;
            }
        } else {
            checkoutState.carrinho.push({
                id: produto.id,
                nome: produto.nome,
                preco: parseFloat(produto.preco),
                imagem: produto.imagem || produto.foto || '',
                icone: produto.icone || '📦',
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

        containerLista.innerHTML = checkoutState.carrinho.map(item => {
            // Validação aprimorada para aceitar qualquer caminho/link de imagem válido
            const temImagemReal = item.imagem && typeof item.imagem === 'string' && item.imagem.trim() !== '' && !item.imagem.startsWith('📦');

            const conteudoVisual = temImagemReal 
                ? `<img src="${item.imagem}" alt="${item.nome}" style="width: 100%; height: 100%; object-fit: cover;">`
                : (item.icone || '📦');

            return `
                <div class="carrinho-item" data-id="${item.id}" style="display: flex; gap: 12px; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid #f3f4f6;">
                    <div class="item-img-box" style="width: 60px; height: 60px; background-color: #f1f5f9; border-radius: 8px; overflow: hidden; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; flex-shrink: 0;">
                        ${conteudoVisual}
                    </div>

                    <div class="item-detalhes" style="flex-grow: 1;">
                        <strong style="display: block; font-size: 0.9rem; color: #1f2937;">${item.nome}</strong>
                        <span style="font-size: 0.85rem; color: #2563eb; font-weight: 600;">R$ ${(item.preco * item.quantidade).toFixed(2).replace('.', ',')}</span>
                    </div>

                    <div class="controles-quantidade" style="display: flex; align-items: center; gap: 0.5rem;">
                        <button class="btn-qtd" onclick="CarrinhoCheckoutModule.alterarQuantidade('${item.id}', -1)" style="padding: 2px 8px; cursor: pointer;">-</button>
                        <span style="font-weight: 600; font-size: 0.9rem;">${item.quantidade}</span>
                        <button class="btn-qtd" onclick="CarrinhoCheckoutModule.alterarQuantidade('${item.id}', 1)" style="padding: 2px 8px; cursor: pointer;">+</button>
                    </div>
                </div>
            `;
        }).join('');
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
        document.querySelectorAll('input[name="pagamento"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                checkoutState.metodoPagamento = e.target.value;
                localStorage.setItem('ultimo_metodo_pagamento', e.target.value);
            });
        });
    }
};

// ==========================================
// 4. AÇÕES DE NAVEGAÇÃO
// ==========================================
function voltarPaginaAnterior() {
    const paginaAnterior = document.referrer;
    if (paginaAnterior && !paginaAnterior.includes('carrinho.html') && !paginaAnterior.includes('Checkout.html')) {
        window.history.back();
    } else {
        window.location.href = "index.html";
    }
}

function finalizarPedido() {
    if (!checkoutState.carrinho || checkoutState.carrinho.length === 0) {
        alert("Seu carrinho está vazio! Adicione algum produto antes de finalizar.");
        return;
    }
    window.location.href = "Checkout.html";
}

// ==========================================
// 5. DETALHES DE PRODUTOS (PRODUTOS.HTML)
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
                    <button class="btn-adicionar" data-id="${rel.id}" data-nome="${rel.nome}" data-preco="${rel.preco}" data-icone="${rel.icone}">
                        Adicionar ao Carrinho
                    </button>
                </div>
            `;
        }).join('');
    }
}

// ==========================================
// 6. ENDEREÇO, CEP E CHECKOUT
// ==========================================
function configurarCamposAutocomplete() {
    const mapaCampos = [
        { id: 'end-nome', autocomplete: 'name', name: 'name' },
        { id: 'end-cep', autocomplete: 'postal-code', name: 'postal-code' },
        { id: 'end-rua', autocomplete: 'address-line1', name: 'address-line1' },
        { id: 'end-numero', autocomplete: 'address-line2', name: 'address-line2' },
        { id: 'end-complemento', autocomplete: 'address-line3', name: 'address-line3' },
        { id: 'end-bairro', autocomplete: 'address-level3', name: 'address-level3' },
        { id: 'end-cidade', autocomplete: 'address-level2', name: 'address-level2' },
        { id: 'end-uf', autocomplete: 'address-level1', name: 'address-level1' }
    ];

    mapaCampos.forEach(item => {
        const input = document.getElementById(item.id);
        if (input) {
            input.setAttribute('autocomplete', item.autocomplete);
            input.setAttribute('name', item.name);
        }
    });
}

async function buscarCEP() {
    const inputCEP = document.getElementById('end-cep');
    const statusDiv = document.getElementById('cep-status');
    if (!inputCEP) return;

    const cep = inputCEP.value.replace(/\D/g, '');

    if (cep.length !== 8) {
        if (statusDiv) {
            statusDiv.style.color = '#ef4444';
            statusDiv.textContent = 'Informe um CEP válido com 8 dígitos.';
        }
        return;
    }

    if (statusDiv) {
        statusDiv.style.color = '#2563eb';
        statusDiv.textContent = 'Buscando endereço...';
    }

    try {
        const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const dados = await resposta.json();

        if (dados.erro) {
            if (statusDiv) {
                statusDiv.style.color = '#ef4444';
                statusDiv.textContent = 'CEP não encontrado.';
            }
            return;
        }

        if (dados.logradouro) document.getElementById('end-rua').value = dados.logradouro;
        if (dados.bairro) document.getElementById('end-bairro').value = dados.bairro;
        if (dados.localidade) document.getElementById('end-cidade').value = dados.localidade;
        if (dados.uf) document.getElementById('end-uf').value = dados.uf;

        if (statusDiv) {
            statusDiv.style.color = '#10b981';
            statusDiv.textContent = 'Endereço localizado!';
        }

        const inputNumero = document.getElementById('end-numero');
        if (inputNumero) inputNumero.focus();

    } catch (erro) {
        if (statusDiv) {
            statusDiv.style.color = '#ef4444';
            statusDiv.textContent = 'Erro ao consultar CEP.';
        }
    }
}

function checarEnderecoSalvo() {
    const boxCadastrado = document.getElementById('box-endereco-cadastrado');
    const formEndereco = document.getElementById('form-endereco');
    if (!boxCadastrado || !formEndereco) return;

    const enderecoSalvo = JSON.parse(localStorage.getItem(chaveEnderecoCliente()));

    if (enderecoSalvo && enderecoSalvo.rua) {
        if(document.getElementById('card-end-nome')) document.getElementById('card-end-nome').textContent = enderecoSalvo.nome;
        if(document.getElementById('card-end-rua-num')) document.getElementById('card-end-rua-num').textContent = `${enderecoSalvo.rua}, nº ${enderecoSalvo.numero} ${enderecoSalvo.complemento ? '(' + enderecoSalvo.complemento + ')' : ''}`;
        if(document.getElementById('card-end-bairro-cidade')) document.getElementById('card-end-bairro-cidade').textContent = `${enderecoSalvo.bairro} - ${enderecoSalvo.cidade}/${enderecoSalvo.uf ? enderecoSalvo.uf.toUpperCase() : ''}`;
        if(document.getElementById('card-end-cep')) document.getElementById('card-end-cep').textContent = `CEP: ${enderecoSalvo.cep}`;

        boxCadastrado.style.display = 'block';
        formEndereco.style.display = 'none';
    } else {
        boxCadastrado.style.display = 'none';
        formEndereco.style.display = 'flex';
    }
}

function alternarFormularioEndereco(exibirFormulario) {
    const boxCadastrado = document.getElementById('box-endereco-cadastrado');
    const formEndereco = document.getElementById('form-endereco');
    const btnCancelar = document.getElementById('btn-cancelar-alteracao');

    if (exibirFormulario) {
        boxCadastrado.style.display = 'none';
        formEndereco.style.display = 'flex';
        if (btnCancelar) btnCancelar.style.display = 'inline-block';
    } else {
        boxCadastrado.style.display = 'block';
        formEndereco.style.display = 'none';
    }
}

function carregarCheckoutDinamico() {
    configurarCamposAutocomplete();
    checarEnderecoSalvo();

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
// VALIDAÇÃO E CONFIRMAÇÃO DO PEDIDO (botão "Confirmar e Pagar" do Checkout.html)
// ==========================================
function validarEConfirmarPedido() {
    // 1. Não deixa confirmar com o carrinho vazio
    if (!checkoutState.carrinho || checkoutState.carrinho.length === 0) {
        alert('Seu carrinho está vazio! Volte e adicione algum produto antes de finalizar.');
        return;
    }

    const boxCadastrado = document.getElementById('box-endereco-cadastrado');
    const formEndereco = document.getElementById('form-endereco');
    const formularioVisivel = formEndereco && formEndereco.style.display !== 'none';

    // 2. Se o formulário de endereço está aberto (endereço novo ou alterando um existente),
    // valida os campos obrigatórios e salva antes de prosseguir
    if (formularioVisivel) {
        const campoNome = document.getElementById('end-nome');
        const campoCep = document.getElementById('end-cep');
        const campoRua = document.getElementById('end-rua');
        const campoNumero = document.getElementById('end-numero');
        const campoBairro = document.getElementById('end-bairro');
        const campoCidade = document.getElementById('end-cidade');
        const campoUf = document.getElementById('end-uf');

        const camposObrigatorios = [campoNome, campoCep, campoRua, campoNumero, campoBairro, campoCidade, campoUf];
        const algumVazio = camposObrigatorios.some(campo => !campo || !campo.value.trim());

        if (algumVazio) {
            alert('Preencha todos os campos obrigatórios do endereço de entrega antes de continuar.');
            return;
        }

        const novoEndereco = {
            nome: campoNome.value.trim(),
            cep: campoCep.value.trim(),
            rua: campoRua.value.trim(),
            numero: campoNumero.value.trim(),
            complemento: (document.getElementById('end-complemento') || {}).value?.trim() || '',
            bairro: campoBairro.value.trim(),
            cidade: campoCidade.value.trim(),
            uf: campoUf.value.trim()
        };

        localStorage.setItem(chaveEnderecoCliente(), JSON.stringify(novoEndereco));
    } else {
        // 3. Se não está com o formulário aberto, precisa já existir um endereço salvo
        const enderecoSalvo = JSON.parse(localStorage.getItem(chaveEnderecoCliente()));
        if (!enderecoSalvo || !enderecoSalvo.rua) {
            alert('Informe um endereço de entrega antes de continuar.');
            return;
        }
    }

    // 4. Salva o método de pagamento escolhido
    const metodoSelecionado = document.querySelector('input[name="pagamento"]:checked');
    if (metodoSelecionado) {
        checkoutState.metodoPagamento = metodoSelecionado.value;
        localStorage.setItem('ultimo_metodo_pagamento', metodoSelecionado.value);
    }

    // 5. Segue para a tela de confirmação, que gera o pedido automaticamente
    window.location.href = 'Pedido-confirmado.html';
}

// ==========================================
// 7. CONFIRMAÇÃO DE PEDIDO (PEDIDO-CONFIRMADO.HTML)
// ==========================================
function carregarPedidoConfirmadoDinamico() {
    const elNumero = document.getElementById('conf-numero-pedido');
    const elData = document.getElementById('conf-data-pedido');
    const elHoraAprovado = document.getElementById('conf-hora-aprovado');
    const elPagamento = document.getElementById('conf-pagamento');
    const elListaItens = document.getElementById('conf-lista-itens');
    const elTotalPago = document.getElementById('conf-total-pago');
    const containerEndereco = document.getElementById('conf-container-endereco');

    let historicoPedidos = JSON.parse(localStorage.getItem('historico_pedidos_cliente')) || [];
    let pedidosAdmin = JSON.parse(localStorage.getItem('pedidos_loja')) || [];
    const enderecoSalvo = JSON.parse(localStorage.getItem(chaveEnderecoCliente()));
    const usuarioLogado = JSON.parse(localStorage.getItem('usuario_logado')) || {};

    let pedidoAtual = null;

    // Só cria um pedido NOVO quando o carrinho atual realmente tem itens
    // (ou seja: o cliente acabou de finalizar uma compra de verdade).
    // Isso evita reaproveitar por engano os dados de um pedido antigo.
    if (checkoutState.carrinho.length > 0) {
        const { total } = CarrinhoCheckoutModule.calcularValores();
        const numPedido = Math.floor(10000 + Math.random() * 90000);
        const numPedidoFormatado = '#' + numPedido;
        const dataAgora = new Date();
        const dataFormatada = dataAgora.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
        const horaFormatada = dataAgora.toLocaleDateString('pt-BR') + ' às ' + dataAgora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        const metodoSalvo = localStorage.getItem('ultimo_metodo_pagamento') || 'pix';
        const nomesMetodos = {
            'pix': 'PIX (Aprovação Instantânea)',
            'cartao': 'Cartão de Crédito',
            'boleto': 'Boleto Bancário'
        };

        pedidoAtual = {
            id: numPedido,
            numero: numPedidoFormatado,
            data: dataFormatada,
            hora: horaFormatada,
            pagamento: nomesMetodos[metodoSalvo] || 'PIX',
            status: 'Em Separação',
            cliente: {
                nome: usuarioLogado.nome || (enderecoSalvo ? enderecoSalvo.nome : 'Cliente da Loja'),
                email: usuarioLogado.email || 'email@naoinformado.com',
                telefone: usuarioLogado.telefone || '(62) 99999-9999'
            },
            itens: [...checkoutState.carrinho],
            total: total,
            endereco: enderecoSalvo
        };

        localStorage.setItem('ultimo_pedido_salvo', JSON.stringify(pedidoAtual));
        historicoPedidos.unshift(pedidoAtual);
        localStorage.setItem('historico_pedidos_cliente', JSON.stringify(historicoPedidos));

        pedidosAdmin.unshift(pedidoAtual);
        localStorage.setItem('pedidos_loja', JSON.stringify(pedidosAdmin));

        checkoutState.carrinho = [];
        CarrinhoCheckoutModule.salvarStorage();
    } else {
        // Carrinho já vazio (ex: a pessoa recarregou a página de confirmação):
        // reexibe o último pedido salvo só pra não deixar a tela em branco.
        pedidoAtual = JSON.parse(localStorage.getItem('ultimo_pedido_salvo'));
    }

    if (pedidoAtual) {
        if (elNumero) elNumero.textContent = pedidoAtual.numero;
        if (elData) elData.textContent = pedidoAtual.data;
        if (elHoraAprovado) elHoraAprovado.textContent = pedidoAtual.hora;
        if (elPagamento) elPagamento.textContent = pedidoAtual.pagamento;
        if (elTotalPago) elTotalPago.textContent = `R$ ${pedidoAtual.total.toFixed(2).replace('.', ',')}`;

        if (elListaItens && pedidoAtual.itens) {
            elListaItens.innerHTML = pedidoAtual.itens.map(item => {
                const ehImagemUrl = typeof item.imagem === 'string' && (item.imagem.startsWith('http') || item.imagem.startsWith('data:image'));
                return `
                <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; color:#334155;">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <div style="width:32px; height:32px; border-radius:6px; background:#f1f5f9; display:flex; align-items:center; justify-content:center; overflow:hidden; flex-shrink:0;">
                            ${ehImagemUrl ? `<img src="${item.imagem}" style="width:100%; height:100%; object-fit:cover;">` : '📦'}
                        </div>
                        <span>${item.quantidade}x ${item.nome}</span>
                    </div>
                    <span style="font-weight:600;">R$ ${(item.preco * item.quantidade).toFixed(2).replace('.', ',')}</span>
                </div>
            `;
            }).join('');
        }

        const end = pedidoAtual.endereco || enderecoSalvo;
        if (containerEndereco) {
            if (end && end.rua) {
                containerEndereco.innerHTML = `
                    <p style="margin: 0 0 4px 0;"><strong>Destinatário:</strong> ${end.nome}</p>
                    <p style="margin: 0 0 4px 0;"><strong>Endereço:</strong> ${end.rua}, Nº ${end.numero} ${end.complemento ? '(' + end.complemento + ')' : ''}</p>
                    <p style="margin: 0 0 4px 0;"><strong>Bairro:</strong> ${end.bairro}</p>
                    <p style="margin: 0 0 4px 0;"><strong>Cidade/UF:</strong> ${end.cidade} / ${end.uf ? end.uf.toUpperCase() : ''}</p>
                    <p style="margin: 0; color: #2563eb; font-weight: bold;"><strong>CEP:</strong> ${end.cep}</p>
                `;
            } else {
                containerEndereco.innerHTML = `<p style="color:#ef4444; margin: 0;">Endereço de entrega não informado.</p>`;
            }
        }
    }
}

// ==========================================
// 8. MÓDULO DE LISTA DE ENDEREÇOS (ENDEREÇOS.HTML)
// ==========================================
function carregarPaginaEnderecos() {
    const containerLista = document.getElementById('lista-enderecos-container');
    if (!containerLista) return;

    const enderecoSalvo = JSON.parse(localStorage.getItem(chaveEnderecoCliente()));

    if (!enderecoSalvo || !enderecoSalvo.rua) {
        containerLista.innerHTML = `
            <div style="text-align: center; padding: 2rem 1rem; color: #64748b; background: #fff; border-radius: 12px; border: 1px dashed #cbd5e1;">
                <p style="font-size: 0.95rem; margin-bottom: 0.5rem; font-weight: 500;">Nenhum endereço cadastrado 📍</p>
                <small>Clique no botão abaixo para cadastrar um endereço de entrega.</small>
            </div>
        `;
        return;
    }

    containerLista.innerHTML = `
        <label class="endereco-item ativo" style="display: flex; gap: 12px; cursor: pointer;">
          <input type="radio" name="endereco_selecionado" value="principal" checked style="margin-top: 4px;">
          <div class="endereco-info" style="width: 100%;">
            <div class="endereco-topo-info" style="display: flex; gap: 8px; margin-bottom: 6px;">
              <span class="tipo-tag" style="background: #e0e7ff; color: #3730a3; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">Entrega</span>
              <span class="badge-principal" style="background: #d1fae5; color: #065f46; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">Principal</span>
            </div>
            <p class="nome-destinatario" style="font-weight: bold; color: #1e293b; margin: 0 0 4px 0;">${enderecoSalvo.nome}</p>
            <p class="rua-numero" style="margin: 0 0 2px 0; color: #475569; font-size: 13px;">${enderecoSalvo.rua}, nº ${enderecoSalvo.numero} ${enderecoSalvo.complemento ? '(' + enderecoSalvo.complemento + ')' : ''}</p>
            <p class="bairro-cidade" style="margin: 0 0 2px 0; color: #475569; font-size: 13px;">${enderecoSalvo.bairro} - ${enderecoSalvo.cidade} / ${enderecoSalvo.uf ? enderecoSalvo.uf.toUpperCase() : ''}</p>
            <p class="cep" style="margin: 0 0 8px 0; color: #2563eb; font-weight: bold; font-size: 13px;">CEP: ${enderecoSalvo.cep}</p>
            
            <div class="acoes-endereco" style="display: flex; gap: 12px; border-top: 1px solid #f1f5f9; padding-top: 8px;">
              <a href="Cadastrar-endereço.html" class="btn-acao-link" style="color: #2563eb; font-size: 13px; text-decoration: none; font-weight: 500;">Editar</a>
              <button type="button" onclick="excluirEnderecoSalvo()" class="btn-acao-excluir" style="background: none; border: none; color: #ef4444; font-size: 13px; cursor: pointer; font-weight: 500; padding: 0;">Excluir</button>
            </div>
          </div>
        </label>
    `;
}

function excluirEnderecoSalvo() {
    if (confirm('Deseja realmente remover este endereço?')) {
        localStorage.removeItem(chaveEnderecoCliente());
        localStorage.removeItem('ultimo_pedido_salvo');
        carregarPaginaEnderecos();
    }
}

// Botão "Usar Endereço Selecionado" do Endereços.html.
// Hoje o sistema guarda apenas 1 endereço por cliente, então "selecionar"
// é apenas confirmar que existe um endereço salvo e voltar para a tela anterior.
function confirmarSelecaoEndereco() {
    const enderecoSalvo = JSON.parse(localStorage.getItem(chaveEnderecoCliente()));

    if (!enderecoSalvo || !enderecoSalvo.rua) {
        alert('Cadastre um endereço antes de continuar.');
        return;
    }

    window.history.back();
}

// ==========================================
// 9. MÓDULO DE CADASTRO DE ENDEREÇO
// ==========================================
async function buscarCepCadastro() {
    const inputCEP = document.getElementById('cep');
    const statusDiv = document.getElementById('cep-status');
    if (!inputCEP) return;

    const cep = inputCEP.value.replace(/\D/g, '');

    if (cep.length !== 8) {
        if (statusDiv) {
            statusDiv.style.color = '#ef4444';
            statusDiv.textContent = 'Digite um CEP válido com 8 números.';
        }
        return;
    }

    try {
        const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const dados = await resposta.json();

        if (dados.erro) return;

        if (dados.logradouro) document.getElementById('rua').value = dados.logradouro;
        if (dados.bairro) document.getElementById('bairro').value = dados.bairro;
        if (dados.localidade) document.getElementById('cidade').value = dados.localidade;
        if (dados.uf) document.getElementById('uf').value = dados.uf;
    } catch (erro) {
        console.error("Erro ao buscar CEP", erro);
    }
}

function carregarDadosFormularioEndereco() {
    const form = document.getElementById('form-cadastrar-endereco');
    const inputCEP = document.getElementById('cep');

    if (inputCEP) {
        inputCEP.addEventListener('input', (e) => {
            const cep = e.target.value.replace(/\D/g, '');
            if (cep.length === 8) buscarCepCadastro();
        });
    }

    if (form) {
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            const novoEndereco = {
                nome: document.getElementById('nome-destinatario').value.trim(),
                cep: document.getElementById('cep').value.trim(),
                rua: document.getElementById('rua').value.trim(),
                numero: document.getElementById('numero').value.trim(),
                complemento: document.getElementById('complemento').value.trim(),
                bairro: document.getElementById('bairro').value.trim(),
                cidade: document.getElementById('cidade').value.trim(),
                uf: document.getElementById('uf').value.trim()
            };

            localStorage.setItem(chaveEnderecoCliente(), JSON.stringify(novoEndereco));
            window.location.href = 'Endereços.html';
        });
    }
}

// ==========================================
// 10. EVENTOS GLOBAIS DE INTERAÇÃO (Adicionar produto capturando imagem e ícone)
// ==========================================
document.addEventListener('click', (e) => {
    const btnAdicionar = e.target.closest('.btn-adicionar');
    if (btnAdicionar) {
        e.stopPropagation();
        
        const cardProduto = btnAdicionar.closest('.card-produto, .card, article, div');
        
        let imgUrl = '';
        if (cardProduto) {
            const imgElement = cardProduto.querySelector('img');
            if (imgElement && imgElement.src) {
                imgUrl = imgElement.src;
            }
        }

        if (!imgUrl && (btnAdicionar.dataset.imagem || btnAdicionar.dataset.foto)) {
            imgUrl = btnAdicionar.dataset.imagem || btnAdicionar.dataset.foto;
        }

        const produto = {
            id: btnAdicionar.dataset.id || 'fone-01',
            nome: btnAdicionar.dataset.nome || 'Produto',
            preco: parseFloat(btnAdicionar.dataset.preco) || 0,
            imagem: imgUrl,
            icone: btnAdicionar.dataset.icone || '📦'
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

    const cardProduto = e.target.closest('.card-produto, .card');
    if (cardProduto && !e.target.closest('button')) {
        const btn = cardProduto.querySelector('.btn-adicionar');
        const idProduto = (btn && btn.dataset.id) ? btn.dataset.id : 'fone-01';
        window.location.href = `Produtos.html?id=${idProduto}`;
    }
});

// ==========================================
// 11. INICIALIZADOR DE PÁGINAS (ROUTER)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    CarrinhoCheckoutModule.init();

    const paginaAtual = decodeURIComponent(window.location.pathname).toLowerCase();

    if (paginaAtual.includes('produtos.html')) {
        carregarDetalhesProduto();
    } else if (paginaAtual.includes('checkout.html')) {
        carregarCheckoutDinamico();
    } else if (paginaAtual.includes('pedido-confirmado.html')) {
        carregarPedidoConfirmadoDinamico();
    } else if (paginaAtual.includes('endere')) { 
        if (paginaAtual.includes('cadastrar')) {
            carregarDadosFormularioEndereco();
        } else {
            carregarPaginaEnderecos();
        }
    }
});