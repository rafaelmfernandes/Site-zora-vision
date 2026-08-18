// Verifica se existe um usuário logado no localStorage
const usuarioLogado = JSON.parse(localStorage.getItem('usuario_logado'));

if (!usuarioLogado) {
  alert('Acesso negado! Por favor, faça login primeiro.');
  window.location.href = 'Login.html';
}