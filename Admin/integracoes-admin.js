// ============================================================
// ZORAVISION - ADMINISTRAÇÃO DE INTEGRAÇÕES
// ============================================================
// Arquivo: Admin/integracoes-admin.js
//
// Responsabilidades desta primeira versão:
// - Obter cliente Supabase
// - Verificar sessão do administrador
// - Exibir status da integração
// - Controlar interface do Mercado Livre
// - Preparar conexão OAuth
// - Controlar botão de conectar
// - Controlar botão de desconectar
// - Preparar área de sincronização
//
// IMPORTANTE:
// Nesta etapa ainda NÃO existe conexão real com o Mercado Livre.
// A integração OAuth será adicionada posteriormente.
// ============================================================

// ============================================================
// 1. CONFIGURAÇÃO
// ============================================================

const INTEGRACAO_MERCADO_LIVRE = {
nome: 'Mercado Livre',
status: 'nao_conectado'
};

// ============================================================
// 2. OBTER CLIENTE SUPABASE
// ============================================================

function obterSupabaseIntegracoesAdmin() {


if (window.supabaseClient) {
    return window.supabaseClient;
}

if (window._supabase) {
    return window._supabase;
}

if (typeof window.obterSupabase === 'function') {

    try {

        return window.obterSupabase();

    } catch (erro) {

        console.error(
            'Erro ao obter Supabase:',
            erro
        );

    }

}

console.error(
    'Cliente Supabase não encontrado.'
);

return null;


}

// ============================================================
// 3. ELEMENTOS
// ============================================================

function obterElementoIntegracaoAdmin(
...ids
) {


for (const id of ids) {

    const elemento =
        document.getElementById(id);

    if (elemento) {
        return elemento;
    }

}

return null;


}

// ============================================================
// 4. ATUALIZAR STATUS VISUAL
// ============================================================

function atualizarStatusMercadoLivre(
conectado
) {


const status =
    obterElementoIntegracaoAdmin(
        'status-mercado-livre',
        'mercado-livre-status',
        'status-integracao-mercado-livre'
    );

const texto =
    obterElementoIntegracaoAdmin(
        'texto-status-mercado-livre',
        'mercado-livre-status-texto',
        'status-texto-mercado-livre'
    );

const botaoConectar =
    obterElementoIntegracaoAdmin(
        'btn-conectar-mercado-livre',
        'conectar-mercado-livre'
    );

const botaoDesconectar =
    obterElementoIntegracaoAdmin(
        'btn-desconectar-mercado-livre',
        'desconectar-mercado-livre'
    );

if (conectado) {

    INTEGRACAO_MERCADO_LIVRE.status =
        'conectado';


    if (status) {

        status.textContent =
            'Conectado';

        status.classList.remove(
            'status-inativo',
            'integracao-inativa',
            'desconectado'
        );

        status.classList.add(
            'status-ativo',
            'integracao-ativa',
            'conectado'
        );

    }


    if (texto) {

        texto.textContent =
            'Sua conta do Mercado Livre está conectada à ZoraVision.';

    }


    if (botaoConectar) {

        botaoConectar.hidden =
            true;

    }


    if (botaoDesconectar) {

        botaoDesconectar.hidden =
            false;

    }

    return;
}


INTEGRACAO_MERCADO_LIVRE.status =
    'nao_conectado';


if (status) {

    status.textContent =
        'Não conectado';

    status.classList.remove(
        'status-ativo',
        'integracao-ativa',
        'conectado'
    );

    status.classList.add(
        'status-inativo',
        'integracao-inativa',
        'desconectado'
    );

}


if (texto) {

    texto.textContent =
        'Conecte sua conta do Mercado Livre para importar seus produtos para a ZoraVision.';

}


if (botaoConectar) {

    botaoConectar.hidden =
        false;

    botaoConectar.disabled =
        false;

    botaoConectar.textContent =
        'Conectar Mercado Livre';

}


if (botaoDesconectar) {

    botaoDesconectar.hidden =
        true;

}


}

// ============================================================
// 5. MOSTRAR MENSAGEM
// ============================================================

function mostrarMensagemIntegracao(
mensagem,
tipo = 'info'
) {


const elemento =
    obterElementoIntegracaoAdmin(
        'mensagem-integracao',
        'integracao-mensagem',
        'mensagem-mercado-livre'
    );

if (!elemento) {

    console.log(
        mensagem
    );

    return;
}


elemento.textContent =
    mensagem;


elemento.classList.remove(
    'mensagem-sucesso',
    'mensagem-erro',
    'mensagem-info'
);


elemento.classList.add(
    'mensagem-' + tipo
);


elemento.hidden =
    false;


}

// ============================================================
// 6. ESCONDER MENSAGEM
// ============================================================

function esconderMensagemIntegracao() {


const elemento =
    obterElementoIntegracaoAdmin(
        'mensagem-integracao',
        'integracao-mensagem',
        'mensagem-mercado-livre'
    );

if (elemento) {

    elemento.hidden =
        true;

}


}

// ============================================================
// 7. CONECTAR MERCADO LIVRE
// ============================================================

async function conectarMercadoLivre() {


console.log(
    'Iniciando processo de conexão com o Mercado Livre...'
);


const botao =
    obterElementoIntegracaoAdmin(
        'btn-conectar-mercado-livre',
        'conectar-mercado-livre'
    );


if (botao) {

    botao.disabled =
        true;

    botao.textContent =
        'Preparando conexão...';

}


mostrarMensagemIntegracao(
    'A conexão com o Mercado Livre será configurada na próxima etapa.',
    'info'
);


/*
============================================================
IMPORTANTE
============================================================

O OAuth real do Mercado Livre será implementado aqui
posteriormente.

O fluxo será:

1. ZoraVision solicita autorização.
2. Usuário é direcionado para o Mercado Livre.
3. Usuário autoriza a aplicação.
4. Mercado Livre retorna um código.
5. Uma Edge Function do Supabase troca o código por tokens.
6. Os tokens são armazenados de forma segura.
7. O painel passa a mostrar "Conectado".
8. A ZoraVision poderá consultar os produtos.

NÃO colocar Client Secret ou Access Token diretamente
neste arquivo JavaScript.
============================================================
*/


if (botao) {

    botao.disabled =
        false;

    botao.textContent =
        'Conectar Mercado Livre';

}


}

// ============================================================
// 8. DESCONECTAR MERCADO LIVRE
// ============================================================

async function desconectarMercadoLivre() {


const confirmar =
    window.confirm(
        'Deseja realmente desconectar o Mercado Livre da ZoraVision?'
    );


if (!confirmar) {
    return;
}


console.log(
    'Solicitação para desconectar Mercado Livre.'
);


/*
============================================================
IMPORTANTE
============================================================

O processo real de desconexão será implementado quando
criarmos a tabela de integrações no Supabase.

Nesta etapa não existe nenhum token sendo removido.
============================================================
*/


atualizarStatusMercadoLivre(
    false
);


mostrarMensagemIntegracao(
    'A integração foi desconectada da interface.',
    'sucesso'
);


}

// ============================================================
// 9. SINCRONIZAR PRODUTOS
// ============================================================

async function sincronizarProdutosMercadoLivre() {


console.log(
    'Solicitação de sincronização de produtos.'
);


if (
    INTEGRACAO_MERCADO_LIVRE.status !==
    'conectado'
) {

    mostrarMensagemIntegracao(
        'Conecte sua conta do Mercado Livre antes de sincronizar os produtos.',
        'erro'
    );

    return;

}


/*
============================================================
FUTURA SINCRONIZAÇÃO
============================================================

Aqui será feita a chamada para nossa Edge Function.

A Edge Function irá:

- consultar a API do Mercado Livre;
- buscar os anúncios;
- obter título;
- obter descrição;
- obter preço;
- obter estoque;
- obter imagens;
- obter categoria;
- obter ID do anúncio;
- gravar/atualizar os produtos no Supabase.

============================================================
*/


mostrarMensagemIntegracao(
    'A sincronização de produtos será ativada após a conexão real com o Mercado Livre.',
    'info'
);


}

// ============================================================
// 10. CONFIGURAR BOTÃO CONECTAR
// ============================================================

function configurarBotaoConectarMercadoLivre() {


const botao =
    obterElementoIntegracaoAdmin(
        'btn-conectar-mercado-livre',
        'conectar-mercado-livre'
    );


if (!botao) {

    console.log(
        'Botão de conexão do Mercado Livre não encontrado.'
    );

    return;

}


if (
    botao.dataset.configurado ===
    'true'
) {

    return;

}


botao.dataset.configurado =
    'true';


botao.addEventListener(
    'click',
    conectarMercadoLivre
);


}

// ============================================================
// 11. CONFIGURAR BOTÃO DESCONECTAR
// ============================================================

function configurarBotaoDesconectarMercadoLivre() {


const botao =
    obterElementoIntegracaoAdmin(
        'btn-desconectar-mercado-livre',
        'desconectar-mercado-livre'
    );


if (!botao) {

    return;

}


if (
    botao.dataset.configurado ===
    'true'
) {

    return;

}


botao.dataset.configurado =
    'true';


botao.addEventListener(
    'click',
    desconectarMercadoLivre
);


}

// ============================================================
// 12. CONFIGURAR BOTÃO SINCRONIZAR
// ============================================================

function configurarBotaoSincronizarMercadoLivre() {


const botao =
    obterElementoIntegracaoAdmin(
        'btn-sincronizar-mercado-livre',
        'sincronizar-mercado-livre',
        'btn-sincronizar-produtos'
    );


if (!botao) {

    return;

}


if (
    botao.dataset.configurado ===
    'true'
) {

    return;

}


botao.dataset.configurado =
    'true';


botao.addEventListener(
    'click',
    async function() {

        if (botao.disabled) {
            return;
        }


        botao.disabled =
            true;


        const textoOriginal =
            botao.textContent;


        botao.textContent =
            'Sincronizando...';


        try {

            await sincronizarProdutosMercadoLivre();

        } finally {

            botao.disabled =
                false;

            botao.textContent =
                textoOriginal ||
                'Sincronizar produtos';

        }

    }
);


}

// ============================================================
// 13. PREPARAR INTERFACE
// ============================================================

function prepararInterfaceIntegracoes() {


console.log(
    'Preparando interface das integrações...'
);


atualizarStatusMercadoLivre(
    false
);


configurarBotaoConectarMercadoLivre();

configurarBotaoDesconectarMercadoLivre();

configurarBotaoSincronizarMercadoLivre();


console.log(
    'Interface das integrações preparada.'
);


}

// ============================================================
// 14. VERIFICAR SESSÃO
// ============================================================

async function verificarSessaoIntegracoesAdmin() {


const supabase =
    obterSupabaseIntegracoesAdmin();


if (!supabase) {

    console.error(
        'Supabase não está disponível na página de integrações.'
    );

    return false;

}


try {

    const resultado =
        await supabase.auth.getUser();


    const usuario =
        resultado?.data?.user;


    const erro =
        resultado?.error;


    if (erro) {

        console.error(
            'Erro ao verificar sessão:',
            erro
        );

        return false;

    }


    if (!usuario) {

        console.warn(
            'Nenhum usuário autenticado.'
        );

        return false;

    }


    console.log(
        'Usuário autenticado nas integrações:',
        usuario.email
    );


    return true;


} catch (erro) {

    console.error(
        'Erro inesperado ao verificar sessão:',
        erro
    );

    return false;

}


}

// ============================================================
// 15. INICIALIZAÇÃO
// ============================================================

document.addEventListener(
'DOMContentLoaded',
async function() {


    console.log(
        '============================================================'
    );

    console.log(
        'ZoraVision - Administração de Integrações'
    );

    console.log(
        'Inicializando página de integrações...'
    );

    console.log(
        '============================================================'
    );


    const sessaoValida =
        await verificarSessaoIntegracoesAdmin();


    if (!sessaoValida) {

        console.warn(
            'Sessão não confirmada. O Painel-admin.js continuará responsável pela proteção da página.'
        );

    }


    prepararInterfaceIntegracoes();


    console.log(
        'Página de integrações carregada.'
    );


    console.log(
        '============================================================'
    );

}


);

// ============================================================
// 16. FUNÇÕES GLOBAIS
// ============================================================

window.obterSupabaseIntegracoesAdmin =
obterSupabaseIntegracoesAdmin;

window.atualizarStatusMercadoLivre =
atualizarStatusMercadoLivre;

window.conectarMercadoLivre =
conectarMercadoLivre;

window.desconectarMercadoLivre =
desconectarMercadoLivre;

window.sincronizarProdutosMercadoLivre =
sincronizarProdutosMercadoLivre;

window.prepararInterfaceIntegracoes =
prepararInterfaceIntegracoes;
