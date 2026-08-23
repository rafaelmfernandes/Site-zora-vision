// cadastrar-endereco.js

document.addEventListener('DOMContentLoaded', () => {
    // Garante que o Supabase foi inicializado corretamente
    if (typeof supabase === 'undefined' && typeof window.supabaseClient !== 'undefined') {
        window.supabase = window.supabaseClient;
    }

    const formCadEndereco = document.getElementById('form-cadastrar-endereco');
    const btnSalvar = document.querySelector('.btn-salvar, button[type="submit"], #btn-salvar-endereco');

    if (formCadEndereco) {
        formCadEndereco.addEventListener('submit', (e) => {
            e.preventDefault();
            salvarEnderecoNoSupabase();
        });
    } else if (btnSalvar) {
        btnSalvar.addEventListener('click', (e) => {
            e.preventDefault();
            salvarEnderecoNoSupabase();
        });
    }

    // Integração com ViaCEP no evento blur e no botão de busca
    const inputCep = document.getElementById('cep');
    if (inputCep) {
        inputCep.addEventListener('blur', (e) => {
            const cepLimpo = e.target.value.replace(/\D/g, '');
            if (cepLimpo.length === 8) {
                buscarCep(cepLimpo);
            }
        });
    }
});

// Função chamada pelo botão "Buscar" no HTML
async function buscarCepCadastro() {
    const cepInput = document.getElementById('cep');
    if (!cepInput) return;
    const cepLimpo = cepInput.value.replace(/\D/g, '');
    if (cepLimpo.length === 8) {
        await buscarCep(cepLimpo);
    } else {
        alert('Digite um CEP válido com 8 dígitos.');
    }
}

async function salvarEnderecoNoSupabase() {
    const getVal = (id) => document.getElementById(id)?.value?.trim() || '';

    const usuarioLogado = JSON.parse(localStorage.getItem('usuario_logado'));
    
    // Captura o tipo de endereço selecionado nos radio buttons
    const tipoSelecionado = document.querySelector('input[name="tipo_endereco"]:checked')?.value || 'casa';
    const nomeDestinatario = getVal('nome-destinatario');
    const pontoReferencia = getVal('referencia');
    const ehPrincipal = document.getElementById('chk-principal')?.checked || false;

    const novoEndereco = {
        user_id: usuarioLogado?.id || usuarioLogado?.email || 'convidado',
        identificacao: tipoSelecionado.toUpperCase(),
        destinatario: nomeDestinatario,
        cep: getVal('cep'),
        rua: getVal('rua'),
        numero: getVal('numero'),
        complemento: getVal('complemento'),
        bairro: getVal('bairro'),
        cidade: getVal('cidade'),
        estado: getVal('uf').toUpperCase(),
        referencia: pontoReferencia,
        principal: ehPrincipal
    };

    if (!novoEndereco.cep || !novoEndereco.rua || !novoEndereco.numero || !novoEndereco.bairro || !novoEndereco.cidade || !novoEndereco.estado) {
        alert('Por favor, preencha todos os campos obrigatórios do endereço.');
        return;
    }

    // Checagem robusta da instância do Supabase
    const clienteSupabase = window.supabase || window.supabaseClient;
    if (typeof clienteSupabase === 'undefined') {
        alert('Erro crítico: O script de conexão com o Supabase não foi carregado nesta página ou antes deste script.');
        return;
    }

    try {
        const resposta = await clienteSupabase
            .from('enderecos')
            .insert([novoEndereco]);

        if (resposta.error) {
            console.error('Erro retornado pelo Supabase:', resposta.error);
            alert('Erro ao salvar no Supabase: ' + (resposta.error.message || JSON.stringify(resposta.error)));
            return;
        }

        alert('Endereço cadastrado com sucesso no Supabase!');
        window.location.href = 'Endereços_2.html';

    } catch (err) {
        console.error('Exceção capturada:', err);
        alert('Exceção ao salvar: ' + (err.message || JSON.stringify(err)));
    }
}

async function buscarCep(cep) {
    const statusEl = document.getElementById('cep-status');
    try {
        if (statusEl) statusEl.textContent = 'Buscando CEP...';
        
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        
        if (!data.erro) {
            const setVal = (id, val) => {
                const el = document.getElementById(id);
                if (el) el.value = val || '';
            };

            setVal('rua', data.logradouro);
            setVal('bairro', data.bairro);
            setVal('cidade', data.localidade);
            setVal('uf', data.uf);

            if (statusEl) statusEl.textContent = 'CEP encontrado!';
            setTimeout(() => { if (statusEl) statusEl.textContent = ''; }, 3000);

            document.getElementById('numero')?.focus();
        } else {
            if (statusEl) statusEl.textContent = 'CEP não encontrado.';
        }
    } catch (error) {
        console.error('Erro ao buscar CEP:', error);
        if (statusEl) statusEl.textContent = 'Erro ao consultar CEP.';
    }
}