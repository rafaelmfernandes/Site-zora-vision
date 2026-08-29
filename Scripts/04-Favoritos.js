// ==========================================
// MÓDULO DE PRODUTOS FAVORITOS (por usuário logado)
// ==========================================
// Os produtos da loja ficam salvos em 'produtos_loja' (ou 'produtos').
// Aqui guardamos só os IDs favoritados, numa chave própria de cada
// cliente logado — assim o favorito de um usuário nunca aparece pra outro.

const FavoritosModule = {

    // Monta a chave de armazenamento específica do usuário logado no momento.
    // Retorna null se ninguém estiver logado (nesse caso não deve favoritar nada).
    chaveAtual() {
        const usuarioLogado = JSON.parse(localStorage.getItem('usuario_logado'));
        if (usuarioLogado && usuarioLogado.email) {
            return 'favoritos_cliente_' + usuarioLogado.email.toLowerCase();
        }
        return null;
    },

    usuarioLogado() {
        return this.chaveAtual() !== null;
    },

    obterFavoritos() {
        const chave = this.chaveAtual();
        if (!chave) return [];
        return JSON.parse(localStorage.getItem(chave)) || [];
    },

    salvarFavoritos(listaIds) {
        const chave = this.chaveAtual();
        if (!chave) return;
        localStorage.setItem(chave, JSON.stringify(listaIds));
    },

    estaFavoritado(id) {
        return this.obterFavoritos().includes(String(id));
    },

    adicionarFavorito(id) {
        const favoritos = this.obterFavoritos();
        if (!favoritos.includes(String(id))) {
            favoritos.push(String(id));
            this.salvarFavoritos(favoritos);
        }
    },

    removerFavorito(id) {
        const favoritos = this.obterFavoritos().filter(favId => favId !== String(id));
        this.salvarFavoritos(favoritos);
    },

    // Alterna favorito/não-favorito. Exige login — se não houver ninguém
    // logado, avisa e manda para a tela de Login em vez de favoritar.
    toggleFavorito(id) {
        if (!this.usuarioLogado()) {
            alert('Faça login para favoritar produtos.');
            window.location.href = 'Login.html';
            return null; // null = ação não realizada (sem usuário logado)
        }

        if (this.estaFavoritado(id)) {
            this.removerFavorito(id);
            return false;
        } else {
            this.adicionarFavorito(id);
            return true;
        }
    },

    limparFavoritos() {
        this.salvarFavoritos([]);
    },

    // Busca os dados completos dos produtos favoritados,
    // cruzando os IDs salvos com o catálogo da loja (mesma fonte do index.html)
    obterProdutosFavoritados() {
        const idsFavoritos = this.obterFavoritos();
        const catalogo = JSON.parse(localStorage.getItem('produtos_loja')) ||
                          JSON.parse(localStorage.getItem('produtos')) || [];

        return catalogo.filter(produto => idsFavoritos.includes(String(produto.id)));
    },

    // Gera o HTML do botão de coração para ser usado dentro de qualquer card de produto
    // (index.html, busca.js). Já nasce com o estado visual correto (favoritado ou não).
    botaoHtml(id, extraStyle = '') {
        const favoritado = this.estaFavoritado(id);
        return `<button type="button" class="btn-favoritar${favoritado ? ' favoritado' : ''}" data-id="${id}" aria-label="Favoritar" style="${extraStyle}">${favoritado ? '❤️' : '🤍'}</button>`;
    }
};

// ==========================================
// RENDERIZAÇÃO DA PÁGINA DE FAVORITOS (Produtos-favoritos.html)
// ==========================================
function renderizarPaginaFavoritos() {
    const grid = document.getElementById('grid-favoritos');
    const estadoVazio = document.getElementById('favoritos-vazio');
    const badgeContador = document.getElementById('favoritos-contador');

    if (!grid) return;

    if (!FavoritosModule.usuarioLogado()) {
        grid.innerHTML = '';
        grid.style.display = 'none';
        if (estadoVazio) {
            estadoVazio.style.display = 'block';
            estadoVazio.innerHTML = `
                <p style="font-size: 1.05rem; margin-bottom: 0.5rem;">Faça login para ver seus favoritos 🔒</p>
                <a href="02-Login.html" style="color:#2563eb; font-weight:600; text-decoration:none;">Entrar na minha conta</a>
            `;
        }
        if (badgeContador) badgeContador.textContent = '0 Itens';
        return;
    }

    const produtos = FavoritosModule.obterProdutosFavoritados();

    if (badgeContador) {
        badgeContador.textContent = `${produtos.length} ${produtos.length === 1 ? 'Item' : 'Itens'}`;
    }

    if (produtos.length === 0) {
        grid.innerHTML = '';
        grid.style.display = 'none';
        if (estadoVazio) {
            estadoVazio.style.display = 'block';
            estadoVazio.innerHTML = `
                <p style="font-size: 1.05rem; margin-bottom: 0.5rem;">Você ainda não tem favoritos 💔</p>
                <p style="font-size: 0.85rem;">Toque no coração de um produto para adicioná-lo aqui.</p>
            `;
        }
        return;
    }

    if (estadoVazio) estadoVazio.style.display = 'none';
    grid.style.display = '';

    grid.innerHTML = produtos.map(produto => {
        const nome = produto.nome || produto.titulo || 'Produto';
        const preco = parseFloat(produto.preco || produto.valor || 0);
        const precoFormatado = preco.toFixed(2).replace('.', ',');
        const categoria = produto.categoria || 'Geral';
        const imagemSrc = produto.imagem || produto.foto || '';
        const ehImagemUrl = typeof imagemSrc === 'string' &&
            (imagemSrc.startsWith('data:image') || imagemSrc.startsWith('http') || imagemSrc.startsWith('assets/'));

        let statusClasse = 'em-estoque';
        let statusTexto = '✓ Em estoque';
        if (produto.estoque === 0) {
            statusClasse = 'sem-estoque';
            statusTexto = '✕ Esgotado';
        } else if (typeof produto.estoque === 'number' && produto.estoque <= 5) {
            statusClasse = 'poucos-itens';
            statusTexto = '⚠️ Poucas unidades';
        }

        return `
            <article class="card-produto" data-id="${produto.id}">
                <button class="btn-remover-favorito" title="Remover dos favoritos" data-id="${produto.id}">❤️</button>
                <div class="produto-imagem">
                    ${ehImagemUrl
                        ? `<img src="${imagemSrc}" alt="${nome}" style="width:100%; height:100%; object-fit:cover;">`
                        : `<span class="emoji-preview">${imagemSrc || '📦'}</span>`}
                </div>
                <div class="produto-detalhes">
                    <span class="produto-categoria">${categoria}</span>
                    <h2 class="produto-nome">${nome}</h2>
                    <div class="produto-preco-container">
                        <span class="preco-atual">R$ ${precoFormatado}</span>
                    </div>
                    <span class="status-estoque ${statusClasse}">${statusTexto}</span>
                </div>
                <div class="produto-acoes">
                    <button class="btn-comprar btn-adicionar"
                            data-id="${produto.id}"
                            data-nome="${nome}"
                            data-preco="${preco}"
                            data-imagem="${ehImagemUrl ? imagemSrc : ''}"
                            ${statusClasse === 'sem-estoque' ? 'disabled' : ''}>
                        ${statusClasse === 'sem-estoque' ? 'Indisponível' : 'Adicionar ao Carrinho 🛒'}
                    </button>
                </div>
            </article>
        `;
    }).join('');
}

// ==========================================
// SINCRONIZA O ESTADO VISUAL (❤️/🤍) DE QUALQUER BOTÃO DE FAVORITAR
// JÁ PRESENTE NO HTML AO CARREGAR A PÁGINA (ex: cards fixos de exemplo)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.btn-favoritar[data-id]').forEach(botao => {
        const favoritado = FavoritosModule.estaFavoritado(botao.dataset.id);
        botao.textContent = favoritado ? '❤️' : '🤍';
        botao.classList.toggle('favoritado', favoritado);
    });
});

// ==========================================
// EVENTOS DA PÁGINA DE FAVORITOS (Produtos-favoritos.html)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('grid-favoritos');
    if (!grid) return; // só roda a lógica de página nos lugares que tiverem esse grid

    renderizarPaginaFavoritos();

    // Remover favorito ao clicar no coração do card
    grid.addEventListener('click', (evento) => {
        const botaoRemover = evento.target.closest('.btn-remover-favorito');
        if (!botaoRemover) return;

        const id = botaoRemover.dataset.id;
        FavoritosModule.removerFavorito(id);
        renderizarPaginaFavoritos();
    });

    // Botão "Limpar Favoritos"
    const btnLimpar = document.getElementById('btn-limpar-favoritos');
    if (btnLimpar) {
        btnLimpar.addEventListener('click', () => {
            if (FavoritosModule.obterFavoritos().length === 0) return;
            if (confirm('Deseja remover todos os itens dos favoritos?')) {
                FavoritosModule.limparFavoritos();
                renderizarPaginaFavoritos();
            }
        });
    }

    // Busca dentro dos favoritos
    const inputBusca = document.getElementById('busca-favoritos');
    if (inputBusca) {
        inputBusca.addEventListener('input', (evento) => {
            const termo = evento.target.value.trim().toLowerCase();
            document.querySelectorAll('#grid-favoritos .card-produto').forEach(card => {
                const nome = card.querySelector('.produto-nome')?.textContent.toLowerCase() || '';
                card.style.display = nome.includes(termo) ? '' : 'none';
            });
        });
    }
});

// ==========================================
// BOTÃO DE FAVORITAR GLOBAL (usado nos cards do index.html, busca.js e Produtos.html:
// <button class="btn-favoritar" data-id="...">)
// ==========================================
document.addEventListener('click', (evento) => {
    const botaoFavoritar = evento.target.closest('.btn-favoritar');
    if (!botaoFavoritar) return;

    const id = botaoFavoritar.dataset.id;
    const favoritado = FavoritosModule.toggleFavorito(id);

    if (favoritado === null) return; // sem usuário logado, já redirecionou para o Login

    botaoFavoritar.textContent = favoritado ? '❤️' : '🤍';
    botaoFavoritar.classList.toggle('favoritado', favoritado);
});
