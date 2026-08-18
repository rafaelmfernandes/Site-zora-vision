document.addEventListener('DOMContentLoaded', () => {
  const formLogin = document.getElementById('form-login');

  if (!formLogin) {
    console.error('Erro: Formulário com ID "form-login" não foi encontrado no HTML.');
    return;
  }

  formLogin.addEventListener('submit', (event) => {
    event.preventDefault(); // Impede a página de recarregar

    const inputEmail = document.getElementById('email');
    const inputSenha = document.getElementById('senha');

    if (!inputEmail || !inputSenha) {
      alert('Erro: Os campos de e-mail ou senha não foram encontrados no HTML.');
      return;
    }

    const email = inputEmail.value.trim();
    const password = inputSenha.value.trim();

    // Busca a lista de usuários salvos no localStorage no momento do cadastro
    const usuarios = JSON.parse(localStorage.getItem('usuarios_db')) || [];

    // Procura por um usuário com e-mail e senha correspondentes
    const usuarioValido = usuarios.find(
      u => u.email === email && u.password === password
    );

    if (usuarioValido) {
      // Salva a sessão ativa no navegador
      localStorage.setItem('usuario_logado', JSON.stringify({ email: usuarioValido.email }));
      alert('Login realizado com sucesso! 🎉');
      
      // Redireciona para o painel principal
      window.location.href = 'admin.html'; // ajuste para a página inicial pós-login do seu projeto
    } else {
      alert('E-mail ou senha incorretos! Verifique os dados e tente novamente.');
    }
  });
});