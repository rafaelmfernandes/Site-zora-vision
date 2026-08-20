let imagemBannerBase64 = '';
let bannerEmEdicao = null;

// ==========================================
// REMENDO TEMPORÁRIO: comprime a imagem no navegador antes de virar base64,
// pra não guardar fotos gigantes no localStorage (o site fica lento e o
// armazenamento estoura rápido). O certo mesmo, no futuro, é subir a imagem
// pra um serviço de armazenamento de verdade (ex: Supabase) e guardar só o link.
// ==========================================
function comprimirImagem(file, larguraMaxima = 1200, qualidade = 0.75) {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();

    leitor.onload = (eventoLeitor) => {
      const imagem = new Image();

      imagem.onload = () => {
        const escala = Math.min(1, larguraMaxima / imagem.width);
        const canvas = document.createElement('canvas');
        canvas.width = imagem.width * escala;
        canvas.height = imagem.height * escala;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(imagem, 0, 0, canvas.width, canvas.height);

        resolve(canvas.toDataURL('image/jpeg', qualidade));
      };

      imagem.onerror = () => reject(new Error('Não foi possível processar a imagem.'));
      imagem.src = eventoLeitor.target.result;
    };

    leitor.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
    leitor.readAsDataURL(file);
  });
}

document.addEventListener('DOMContentLoaded', () => {

  // ==========================================
  // MODO DE EDIÇÃO: verifica se veio um ?id= na URL
  // ==========================================
  const urlParams = new URLSearchParams(window.location.search);
  const idParaEditar = urlParams.get('id');

  if (idParaEditar) {
    const listaBanners = JSON.parse(localStorage.getItem('banners_loja')) || [];
    bannerEmEdicao = listaBanners.find(b => String(b.id) === String(idParaEditar));

    if (bannerEmEdicao) {
      document.getElementById('banner-badge').value = bannerEmEdicao.badge || '';
      document.getElementById('banner-titulo').value = bannerEmEdicao.titulo || '';
      document.getElementById('banner-subtitulo').value = bannerEmEdicao.subtitulo || '';
      document.getElementById('banner-texto-link').value = bannerEmEdicao.textoLink || '';
      document.getElementById('banner-link-destino').value = bannerEmEdicao.linkDestino || '';
      document.getElementById('banner-cor').value = bannerEmEdicao.cor || 'azul';
      document.getElementById('banner-ordem').value = bannerEmEdicao.ordem || 1;
      document.getElementById('banner-ativo').checked = bannerEmEdicao.ativo !== false;

      if (bannerEmEdicao.imagem) {
        imagemBannerBase64 = bannerEmEdicao.imagem;
        const previewIcone = document.getElementById('preview-icone-banner');
        const previewTexto = document.getElementById('preview-texto-banner');
        if (previewIcone) {
          previewIcone.outerHTML = `<img id="preview-icone-banner" src="${imagemBannerBase64}" style="width: 100%; max-height: 120px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;">`;
        }
        if (previewTexto) {
          previewTexto.innerHTML = `<strong>Imagem atual do banner</strong> (clique para trocar)`;
        }
      }

      const titulo = document.querySelector('.admin-titulo');
      if (titulo) titulo.textContent = 'Editar Banner';

      const btnSalvar = document.querySelector('.btn-salvar-produto');
      if (btnSalvar) btnSalvar.textContent = 'Salvar Alterações';

    } else {
      alert('Banner não encontrado. Um novo banner será criado ao salvar.');
    }
  }

  // Trata o upload da imagem: comprime antes de gerar o preview
  const inputImagem = document.getElementById('input-imagem-banner');
  if (inputImagem) {
    inputImagem.addEventListener('change', async function (e) {
      const file = e.target.files[0];
      if (!file) return;

      const previewIcone = document.getElementById('preview-icone-banner');
      const previewTexto = document.getElementById('preview-texto-banner');
      if (previewTexto) previewTexto.innerHTML = `<strong>Otimizando imagem...</strong>`;

      try {
        imagemBannerBase64 = await comprimirImagem(file);

        if (previewIcone) {
          previewIcone.outerHTML = `<img id="preview-icone-banner" src="${imagemBannerBase64}" style="width: 100%; max-height: 120px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;">`;
        }
        if (previewTexto) {
          const tamanhoKb = Math.round((imagemBannerBase64.length * 0.75) / 1024);
          previewTexto.innerHTML = `<strong>Imagem otimizada!</strong> (~${tamanhoKb} KB)`;
        }
      } catch (erro) {
        console.error('Erro ao processar imagem:', erro);
        alert('Não foi possível processar essa imagem. Tente outra.');
        if (previewTexto) previewTexto.innerHTML = `<strong>Clique aqui</strong> pra adicionar uma imagem de fundo (opcional)`;
      }
    });
  }

  // Manipula o envio do formulário e salva no localStorage
  const formCadastrar = document.getElementById('form-cadastrar-banner');
  if (formCadastrar) {
    formCadastrar.addEventListener('submit', function (e) {
      e.preventDefault();

      const dadosFormulario = {
        badge: document.getElementById('banner-badge').value.trim(),
        titulo: document.getElementById('banner-titulo').value.trim(),
        subtitulo: document.getElementById('banner-subtitulo').value.trim(),
        textoLink: document.getElementById('banner-texto-link').value.trim(),
        linkDestino: document.getElementById('banner-link-destino').value.trim() || '#',
        cor: document.getElementById('banner-cor').value,
        imagem: imagemBannerBase64 || '',
        ordem: parseInt(document.getElementById('banner-ordem').value) || 1,
        ativo: document.getElementById('banner-ativo').checked
      };

      if (!dadosFormulario.titulo) {
        alert('Preencha o título do banner.');
        return;
      }

      let listaBanners = JSON.parse(localStorage.getItem('banners_loja')) || [];

      if (bannerEmEdicao) {
        listaBanners = listaBanners.map(b => {
          if (String(b.id) === String(bannerEmEdicao.id)) {
            return { ...b, ...dadosFormulario, id: b.id };
          }
          return b;
        });
      } else {
        listaBanners.push({
          id: 'banner_' + Date.now(),
          ...dadosFormulario
        });
      }

      try {
        localStorage.setItem('banners_loja', JSON.stringify(listaBanners));
      } catch (erro) {
        console.error('Erro ao salvar banner: armazenamento cheio.', erro);
        alert('Não foi possível salvar o banner: o armazenamento do navegador está cheio (provavelmente por causa de imagens grandes já cadastradas). Tente usar uma imagem menor.');
        return;
      }

      alert(bannerEmEdicao ? 'Banner atualizado com sucesso! ✅' : 'Banner cadastrado com sucesso! 🚀');
      window.location.href = 'admin.html';
    });
  }
});
