// Inicializar o cliente do Supabase
const SUPABASE_URL = 'https://ratajxnxkjoiuknamacn.supabase.co';
const SUPABASE_KEY = 'sb_publishable_SD8dQdB4WQ-k_MdTPxU-lw_1j4cDD1L';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', () => {
  const emailInput = document.getElementById('email');
  const senhaInput = document.getElementById('senha');
  const btnLogin = document.getElementById('btn-login');
  const btnCadastrar = document.getElementById('btn-cadastrar');

  // 1. Cadastrar Usuário
  btnCadastrar.addEventListener('click', async () => {
    const email = emailInput.value;
    const password = senhaInput.value;

    if (!email || !password) {
      alert('Preencha e-mail e senha.');
      return;
    }

    const { data, error } = await _supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert('Erro ao cadastrar: ' + error.message);
    } else {
      alert('Conta criada com sucesso! Verifique seu e-mail para confirmar a conta.');
    }
  });

  // 2. Fazer Login
  btnLogin.addEventListener('click', async () => {
    const email = emailInput.value;
    const password = senhaInput.value;

    if (!email || !password) {
      alert('Preencha e-mail e senha.');
      return;
    }

    const { data, error } = await _supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert('Falha no login: ' + error.message);
    } else {
      alert('Login realizado com sucesso!');
      // Redireciona para o painel principal
      window.location.href = 'admin.html';
    }
  });
});