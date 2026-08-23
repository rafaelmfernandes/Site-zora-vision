// ============================================================
// CADASTRO DE CLIENTES - INTEGRADO AO SUPABASE (TABELA CLIENTES)
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  const formCadastro = document.getElementById('form-cadastro');

  if (!formCadastro) {
    console.error('Erro: Formulário com ID "form-cadastro" não foi encontrado no HTML.');
    return;
  }

  formCadastro.addEventListener('submit', async (event) => {
    event.preventDefault(); // Impede a página de recarregar

    // Captura os elementos dos inputs
    const inputNome = document.getElementById('nome');
    const inputEmail = document.getElementById('email-cadastro');
    const inputSenha = document.getElementById('senha-cadastro');
    const inputConfirmarSenha = document.getElementById('confirmar-senha');

    if (!inputNome || !inputEmail || !inputSenha || !inputConfirmarSenha) {
      alert('Erro: Algum campo do formulário não foi encontrado no HTML.');
      return;
    }

    const nome = inputNome.value.trim();
    const email = inputEmail.value.trim();
    const password = inputSenha.value.trim();
    const confirmarPassword = inputConfirmarSenha.value.trim();

    if (!nome || !email || !password || !confirmarPassword) {
      alert('Por favor, preencha todos os campos!');
      return;
    }

    if (password !== confirmarPassword) {
      alert('As senhas não coincidem. Verifique e tente novamente.');
      return;
    }

    // Valida se o cliente _supabase global carregou do arquivo supabase.js
    const supabaseClient = typeof _supabase !== 'undefined' ? _supabase : window._supabase;

    if (!supabaseClient) {
      alert('Erro de conexão com o banco de dados. Cliente Supabase não encontrado.');
      return;
    }

    try {
      // 1. Insere o novo usuário diretamente na tabela 'clientes' do Supabase
      const { data, error } = await supabaseClient
        .from('clientes')
        .insert([
          {
            nome: nome,
            email: email,
            senha_hash: password, // Salvando a senha na coluna correspondente
            ativo: true
          }
        ])
        .select();

      if (error) {
        console.error('Erro ao cadastrar no Supabase:', error);
        if (error.code === '23505') {
          alert('Este e-mail já está cadastrado!');
        } else {
          alert('Erro ao realizar cadastro: ' + error.message);
        }
        return;
      }

      alert('Conta criada com sucesso! 🎉');

      // Opcional: já deixa o usuário logado salvando os dados na sessão local
      if (data && data.length > 0) {
        localStorage.setItem('usuario_logado', JSON.stringify(data[0]));
      }

      // Redireciona para a tela de login
      window.location.href = 'Login.html';

    } catch (erroExcecao) {
        console.error('Exceção ao tentar cadastrar:', erroExcecao);
        alert('Ocorreu um erro inesperado ao conectar com o banco de dados.');
    }
  });
});