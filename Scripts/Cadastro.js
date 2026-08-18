document.addEventListener('DOMContentLoaded', () => {
  const formCadastro = document.getElementById('form-cadastro');

  if (!formCadastro) {
    console.error('Erro: Formulário com ID "form-cadastro" não foi encontrado no HTML.');
    return;
  }

  formCadastro.addEventListener('submit', (event) => {
    event.preventDefault(); // Impede a página de recarregar

    // Captura os elementos dos inputs
    const inputEmail = document.getElementById('email-cadastro');
    const inputSenha = document.getElementById('senha-cadastro');

    if (!inputEmail || !inputSenha) {
      alert('Erro: Os campos de e-mail ou senha não foram encontrados no HTML.');
      return;
    }

    const email = inputEmail.value.trim();
    const password = inputSenha.value.trim();

    if (!email || !password) {
      alert('Por favor, preencha todos os campos!');
      return;
    }

    // Busca a lista de usuários no localStorage
    const usuarios = JSON.parse(localStorage.getItem('usuarios_db')) || [];

    // Verifica se já existe um usuário cadastrado com esse e-mail
    const usuarioExiste = usuarios.some(u => u.email === email);

    if (usuarioExiste) {
      alert('Este e-mail já está cadastrado!');
      return;
    }

    // Adiciona o novo usuário
    usuarios.push({ email: email, password: password });
    localStorage.setItem('usuarios_db', JSON.stringify(usuarios));

    alert('Conta criada com sucesso! 🎉');
    window.location.href = 'login.html';
  });
});