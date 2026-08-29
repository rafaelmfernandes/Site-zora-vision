// ==========================================
// CADASTRO DE FORMA DE PAGAMENTO (cartão)
// ==========================================
// Por segurança, NUNCA salvamos o número completo do cartão nem o CVV —
// só o necessário para exibir na lista: bandeira, últimos 4 dígitos, nome e validade.

function chaveCartoesCliente() {
    const usuarioLogado = JSON.parse(localStorage.getItem('usuario_logado'));
    if (usuarioLogado && usuarioLogado.email) {
        return 'cartoes_cliente_' + usuarioLogado.email.toLowerCase();
    }
    return null; // sem usuário logado, não deve salvar cartão nenhum
}

function identificarBandeira(numeroLimpo) {
    if (/^4/.test(numeroLimpo)) return 'Visa';
    if (/^5[1-5]/.test(numeroLimpo)) return 'Mastercard';
    if (/^3[47]/.test(numeroLimpo)) return 'American Express';
    if (/^6/.test(numeroLimpo)) return 'Elo';
    return 'Cartão';
}

document.addEventListener('DOMContentLoaded', () => {

    // Exige login antes de cadastrar um cartão
    const usuarioLogado = JSON.parse(localStorage.getItem('usuario_logado'));
    if (!usuarioLogado || !usuarioLogado.email) {
        alert('Faça login para cadastrar uma forma de pagamento.');
        window.location.href = '02-Login.html';
        return;
    }

    const inputNumero = document.getElementById('numero-cartao');
    const inputTitular = document.getElementById('nome-titular');
    const inputValidade = document.getElementById('validade');

    const previewBandeira = document.getElementById('preview-bandeira');
    const previewNumero = document.getElementById('preview-numero');
    const previewTitular = document.getElementById('preview-titular');
    const previewValidade = document.getElementById('preview-validade');

    // Atualiza a prévia visual do cartão enquanto o usuário digita
    if (inputNumero && previewNumero) {
        inputNumero.addEventListener('input', () => {
            const numeroLimpo = inputNumero.value.replace(/\D/g, '');
            const numeroFormatado = numeroLimpo.padEnd(16, '•').replace(/(.{4})/g, '$1 ').trim();
            previewNumero.textContent = numeroFormatado;
            if (previewBandeira) previewBandeira.textContent = numeroLimpo ? identificarBandeira(numeroLimpo) : '💳';
        });
    }

    if (inputTitular && previewTitular) {
        inputTitular.addEventListener('input', () => {
            previewTitular.textContent = inputTitular.value.toUpperCase() || 'NOME COMO NO CARTÃO';
        });
    }

    if (inputValidade && previewValidade) {
        inputValidade.addEventListener('input', () => {
            previewValidade.textContent = inputValidade.value || 'MM/AA';
        });
    }

    const formPagamento = document.querySelector('.form-pagamento');
    if (formPagamento) {
        formPagamento.addEventListener('submit', (e) => {
            e.preventDefault();

            const numeroLimpo = (inputNumero.value || '').replace(/\D/g, '');
            if (numeroLimpo.length < 13) {
                alert('Número do cartão inválido.');
                return;
            }

            const chave = chaveCartoesCliente();
            if (!chave) {
                alert('Faça login para cadastrar uma forma de pagamento.');
                window.location.href = '02-Login.html';
                return;
            }

            const marcarPrincipal = document.querySelector('input[name="preferencial"]').checked;
            let cartoes = JSON.parse(localStorage.getItem(chave)) || [];

            // Se o novo cartão for marcado como principal, tira o "principal" dos outros
            if (marcarPrincipal) {
                cartoes = cartoes.map(c => ({ ...c, principal: false }));
            }

            const novoCartao = {
                id: 'cartao_' + Date.now(),
                bandeira: identificarBandeira(numeroLimpo),
                ultimosDigitos: numeroLimpo.slice(-4),
                titular: inputTitular.value.trim(),
                validade: inputValidade.value.trim(),
                principal: marcarPrincipal || cartoes.length === 0 // o primeiro cartão sempre vira principal
            };

            cartoes.push(novoCartao);

            try {
                localStorage.setItem(chave, JSON.stringify(cartoes));
            } catch (erro) {
                console.error('Erro ao salvar cartão.', erro);
                alert('Não foi possível salvar o cartão. Tente novamente.');
                return;
            }

            alert('Cartão salvo com sucesso! 💳');
            window.location.href = 'Formas-pagamento.html';
        });
    }
});
