/**
 * Função utilitária para verificar se o usuário está logado antes de realizar uma ação.
 * Se não estiver, redireciona para a página de login/perfil.
 */
function verificarAutenticacaoAntesDeAcao(e) {
    // Busca o usuário logado no localStorage
    const usuarioLogado = JSON.parse(localStorage.getItem('usuario_logado'));

    // Se não houver usuário logado
    if (!usuarioLogado || !usuarioLogado.email) {
        // Impede a ação padrão (como adicionar ao carrinho ou ir para checkout)
        e.preventDefault();
        e.stopPropagation();

        alert('Por favor, faça login na sua conta para continuar.');
        
        // Redireciona para a página de perfil / login
        window.location.href = 'Meu-perfil.html';
        return false;
    }

    return true; // Usuário logado, pode prosseguir
}