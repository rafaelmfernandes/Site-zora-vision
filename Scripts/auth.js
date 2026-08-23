// ============================================================
// ZORAVISION - AUTENTICAÇÃO DE CLIENTES (TABELA CLIENTES)
// ============================================================

// Inicializar o cliente do Supabase
const SUPABASE_URL = 'https://ratajxnxkjoiuknamacn.supabase.co';
const SUPABASE_KEY = 'sb_publishable_SD8dQdB4WQ-k_MdTPxU-lw_1j4cDD1L';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', () => {
  // Ajuste os IDs abaixo conforme os campos existentes no seu HTML de login/cadastro
  const nomeInput = document.getElementById('nome');       // Opcional caso tenha no cadastro
  const telefoneInput = document.getElementById('telefone'); // Opcional caso tenha no cadastro
  const cpfInput = document.getElementById('cpf');         // Opcional caso tenha no cadastro
  const emailInput = document.getElementById('email');
  const senhaInput = document.getElementById('senha');
  const btnLogin = document.getElementById('btn-login');
  const btnCadastrar = document.getElementById('btn-cadastrar');

  // 1. Cadastrar Usuário na tabela 'clientes'
  if (btnCadastrar) {
    btnCadastrar.addEventListener('click', async () => {
      const email = emailInput ? emailInput.value.trim() : '';
      const password = senhaInput ? senhaInput.value : '';
      const nome = nomeInput ? nomeInput.value.trim() : 'Cliente';
      const telefone = telefoneInput ? telefoneInput.value.trim() : '';
      const cpf = cpfInput ? cpfInput.value.trim() : '';

      if (!email || !password) {
        alert('Preencha pelo menos e-mail e senha.');
        return;
      }

      // Insere diretamente na sua tabela 'clientes' do Supabase
      const { data, error } = await _supabase
        .from('clientes')
        .insert([
          {
            nome: nome || email.split('@')[0],
            email: email,
            telefone: telefone || null,
            cpf: cpf || null,
            senha_hash: password, // Salvando na coluna de senha da sua tabela
            ativo: true
          }
        ])
        .select();

      if (error) {
        console.error('Erro ao cadastrar:', error);
        if (error.code === '23505') {
          alert('Este e-mail já está cadastrado.');
        } else {
          alert('Erro ao cadastrar: ' + error.message);
        }
      } else {
        alert('Conta criada com sucesso!');
        
        // Salva a sessão localmente para o sistema reconhecer o usuário logado
        if (data && data.length > 0) {
          localStorage.setItem('usuario_logado', JSON.stringify(data[0]));
        }

        // Redireciona para a página principal ou painel
        window.location.href = 'index.html';
      }
    });
  }

  // 2. Fazer Login consultando a tabela 'clientes'
  if (btnLogin) {
    btnLogin.addEventListener('click', async () => {
      const email = emailInput ? emailInput.value.trim() : '';
      const password = senhaInput ? senhaInput.value : '';

      if (!email || !password) {
        alert('Preencha e-mail e senha.');
        return;
      }

      // Busca o cliente correspondente na tabela filtrando por e-mail e senha
      const { data, error } = await _supabase
        .from('clientes')
        .select('*')
        .eq('email', email)
        .eq('senha_hash', password)
        .maybeSingle();

      if (error || !data) {
        alert('E-mail ou senha incorretos.');
        console.error('Erro no login:', error);
      } else {
        alert('Login realizado com sucesso!');
        
        // Salva o usuário logado no localStorage para uso em todo o e-commerce
        localStorage.setItem('usuario_logado', JSON.stringify(data));

        // Redireciona para a página principal (ou admin.html se preferir)
        window.location.href = 'index.html';
      }
    });
  }
});