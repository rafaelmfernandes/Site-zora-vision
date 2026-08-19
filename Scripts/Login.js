document.addEventListener('DOMContentLoaded', () => {
  const formLogin = document.getElementById('form-login');

  if (!formLogin) {
    console.error('Erro: Formulário com ID "form-login" não foi encontrado no HTML.');
    return;
  }

  formLogin.addEventListener('submit', (event) => {
    event.preventDefault(); // Impede o envio automático via GET e o redirecionamento sem checar nada

    const inputEmail = document.getElementById('email');
    const inputSenha = document.getElementById('senha');

    if (!inputEmail || !inputSenha) {
      alert('Erro: Os campos de e-mail ou senha não foram encontrados no HTML.');
      return;
    }

    const email = inputEmail.value.trim();
    const senha = inputSenha.value.trim();

    if (!email || !senha) {
      alert('Por favor, preencha todos os campos!');
      return;
    }

    // Busca a lista de usuários cadastrados (mesma chave usada pelo Cadastro.js)
    const usuarios = JSON.parse(localStorage.getItem('usuarios_db')) || [];

    const usuarioEncontrado = usuarios.find(u => u.email === email && u.password === senha);

    if (!usuarioEncontrado) {
      alert('E-mail ou senha incorretos. Verifique e tente novamente.');
      return;
    }

    // Salva o usuário logado no formato que o resto do site espera
    // (Meu-perfil.html, Carrinho-checkout.js e auth-guard.js leem essa mesma chave)
    const usuarioLogado = {
      nome: usuarioEncontrado.nome || 'Cliente',
      email: usuarioEncontrado.email
    };

    localStorage.setItem('usuario_logado', JSON.stringify(usuarioLogado));

    window.location.href = 'Meu-perfil.html';
  });
});
