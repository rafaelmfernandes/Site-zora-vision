// ==========================================
// LISTAGEM DE FORMAS DE PAGAMENTO (por usuário logado)
// ==========================================

function chaveCartoesClienteAtual() {
    const usuarioLogado = JSON.parse(localStorage.getItem('usuario_logado'));
    if (usuarioLogado && usuarioLogado.email) {
        return 'cartoes_cliente_' + usuarioLogado.email.toLowerCase();
    }
    return null;
}

function renderizarCartoes() {
    const containerLista = document.getElementById('lista-cartoes');
    const acaoFixa = document.querySelector('.acao-fixa-container');
    if (!containerLista) return;

    const chave = chaveCartoesClienteAtual();
    if (!chave) {
        containerLista.innerHTML = `
            <div style="text-align:center; padding:2rem 1rem; color:#64748b;">
                <p>Faça login para ver suas formas de pagamento.</p>
                <a href="Login.html" style="color:#2563eb; font-weight:600; text-decoration:none;">Entrar na minha conta</a>
            </div>`;
        if (acaoFixa) acaoFixa.style.display = 'none';
        return;
    }

    const cartoes = JSON.parse(localStorage.getItem(chave)) || [];

    if (cartoes.length === 0) {
        containerLista.innerHTML = `
            <div style="text-align:center; padding:2rem 1rem; color:#64748b;">
                <p>Você ainda não tem nenhum cartão salvo.</p>
            </div>`;
        if (acaoFixa) acaoFixa.style.display = 'none';
        return;
    }

    if (acaoFixa) acaoFixa.style.display = '';

    containerLista.innerHTML = cartoes.map(cartao => `
        <label class="cartao-item ${cartao.principal ? 'ativo' : ''}">
            <input type="radio" name="cartao_selecionado" value="${cartao.id}" ${cartao.principal ? 'checked' : ''}>
            <div class="cartao-icone">💳</div>
            <div class="cartao-info">
                <div class="cartao-topo-info">
                    <span class="bandeira">${cartao.bandeira}</span>
                    ${cartao.principal ? '<span class="badge-principal">Principal</span>' : ''}
                </div>
                <p class="cartao-numero">•••• •••• •••• ${cartao.ultimosDigitos}</p>
                <span class="cartao-validade">Vence em ${cartao.validade}</span>
            </div>
            <button type="button" class="btn-excluir" title="Remover cartão" data-id="${cartao.id}">🗑️</button>
        </label>
    `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    renderizarCartoes();

    const containerLista = document.getElementById('lista-cartoes');
    if (!containerLista) return;

    containerLista.addEventListener('click', (evento) => {
        const botaoExcluir = evento.target.closest('.btn-excluir');
        if (!botaoExcluir) return;

        evento.preventDefault();

        if (!confirm('Deseja remover este cartão?')) return;

        const chave = chaveCartoesClienteAtual();
        if (!chave) return;

        let cartoes = JSON.parse(localStorage.getItem(chave)) || [];
        const idRemovido = botaoExcluir.dataset.id;
        const removendoPrincipal = cartoes.find(c => c.id === idRemovido)?.principal;

        cartoes = cartoes.filter(c => c.id !== idRemovido);

        // Se removeu o cartão principal, promove o próximo da lista (se houver)
        if (removendoPrincipal && cartoes.length > 0) {
            cartoes[0].principal = true;
        }

        localStorage.setItem(chave, JSON.stringify(cartoes));
        renderizarCartoes();
    });
});
