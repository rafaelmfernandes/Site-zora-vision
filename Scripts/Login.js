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

    const email = inputEmail.value.trim().toLowerCase();
    const password = inputSenha.value.trim();

    // Busca a lista de usuários salvos no localStorage no momento do cadastro
    const usuarios = JSON.parse(localStorage.getItem('usuarios_db')) || [];

    // Procura por um usuário com e-mail e senha correspondentes
    const usuarioValido = usuarios.find(
      u => u.email.toLowerCase() === email && u.password === password
    );

    if (usuarioValido) {
      // 1. Salva a sessão ativa no navegador
      localStorage.setItem('usuario_logado', JSON.stringify({ 
        nome: usuarioValido.nome || 'Usuário',
        email: usuarioValido.email 
      }));
      
      alert('Login realizado com sucesso! 🎉');

      // 2. REGRA DE REDIRECIONAMENTO POR E-MAIL
      const emailAdmin = 'rafaelmelo116@gmail.com';

      if (usuarioValido.email.toLowerCase() === emailAdmin.toLowerCase()) {
        // Administrador vai para o Perfil (onde aparecerá o botão do Painel)
        window.location.href = 'Meu-perfil.html';
      } else {
        // Usuário comum vai para a Página Inicial
        window.location.href = 'index.html';
      }

    } else {
      alert('E-mail ou senha incorretos! Verifique os dados e tente novamente.');
    }
  });
});