document.addEventListener('DOMContentLoaded', () => {
  const formCadastro = document.getElementById('form-cadastro');

  if (!formCadastro) {
    console.error('Erro: Formulário com ID "form-cadastro" não foi encontrado no HTML.');
    return;
  }

  formCadastro.addEventListener('submit', (event) => {
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

    // Busca a lista de usuários no localStorage
    const usuarios = JSON.parse(localStorage.getItem('usuarios_db')) || [];

    // Verifica se já existe um usuário cadastrado com esse e-mail
    const usuarioExiste = usuarios.some(u => u.email === email);

    if (usuarioExiste) {
      alert('Este e-mail já está cadastrado!');
      return;
    }

    // Adiciona o novo usuário
    usuarios.push({ nome: nome, email: email, password: password });
    localStorage.setItem('usuarios_db', JSON.stringify(usuarios));

    alert('Conta criada com sucesso! 🎉');
    window.location.href = 'Login.html';
  });
});