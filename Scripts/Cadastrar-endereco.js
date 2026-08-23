document.addEventListener('DOMContentLoaded', () => {
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

function obterClienteSupabase() {
    // Tenta encontrar a instância do Supabase de várias maneiras possíveis dependendo de como foi instanciado globalmente
    let cliente = window.supabase || window._supabase || window.supabaseClient;
    
    // Se o cliente for uma função construtora ou o objeto createClient, ou se vier como window.supabase.createClient
    if (cliente && typeof cliente.from !== 'function') {
        if (typeof cliente.createClient === 'function') {
            // Caso window.supabase seja o módulo principal
            return cliente;
        }
    }
    
    return cliente;
}

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
    
    const tipoSelecionado = document.querySelector('input[name="tipo_endereco"]:checked')?.value || getVal('identificacao') || 'CASA';
    const nomeDestinatario = getVal('nome-destinatario') || (usuarioLogado ? usuarioLogado.nome : '');
    const pontoReferencia = getVal('referencia');
    const ehPrincipal = document.getElementById('chk-principal')?.checked || false;

    const userId = usuarioLogado?.id || usuarioLogado?.email || 'convidado';

    const novoEndereco = {
        user_id: userId,
        identificacao: tipoSelecionado.toUpperCase(),
        destinatario: nomeDestinatario,
        cep: getVal('cep'),
        rua: getVal('rua'),
        numero: getVal('numero'),
        complemento: getVal('complemento'),
        bairro: getVal('bairro'),
        cidade: getVal('cidade'),
        estado: (getVal('uf') || getVal('estado')).toUpperCase(),
        referencia: pontoReferencia,
        principal: ehPrincipal
    };

    if (!novoEndereco.cep || !novoEndereco.rua || !novoEndereco.numero || !novoEndereco.bairro || !novoEndereco.cidade || !novoEndereco.estado) {
        alert('Por favor, preencha todos os campos obrigatórios do endereço (CEP, Rua, Número, Bairro, Cidade e Estado).');
        return;
    }

    // Obtém o cliente de forma segura
    let clienteSupabase = obterClienteSupabase();

    // Se ainda assim não tiver o método 'from', tenta inicializar usando variáveis globais comuns de URL/Anon Key se existirem
    if (!clienteSupabase || typeof clienteSupabase.from !== 'function') {
        if (typeof window.SUPABASE_URL !== 'undefined' && typeof window.SUPABASE_ANON_KEY !== 'undefined' && typeof supabase !== 'undefined' && typeof supabase.createClient === 'function') {
            clienteSupabase = supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
        }
    }

    if (!clienteSupabase || typeof clienteSupabase.from !== 'function') {
        alert('Erro crítico: O objeto Supabase não foi inicializado corretamente. Verifique se o script do Supabase foi carregado antes deste arquivo.');
        return;
    }

    try {
        console.log("Enviando endereço para o Supabase:", novoEndereco);

        if (ehPrincipal) {
            await clienteSupabase
                .from('enderecos')
                .update({ principal: false })
                .eq('user_id', userId);
        }

        const { data, error } = await clienteSupabase
            .from('enderecos')
            .insert([novoEndereco])
            .select();

        if (error) {
            console.error('Erro retornado pelo Supabase:', error);
            alert('Erro ao salvar no Supabase: ' + (error.message || JSON.stringify(error)));
            return;
        }

        alert('Endereço cadastrado com sucesso no Supabase!');
        window.location.href = 'Endereços.html';

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
            setVal('estado', data.uf);

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