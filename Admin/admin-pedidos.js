/* ============================================================
ZORAVISION
GERENCIAMENTO DE PEDIDOS - ADMIN
============================================================ */

let pedidos = [];
let pedidosFiltrados = [];
let pedidoSelecionado = null;

/* ============================================================
SUPABASE
============================================================ */

function obterSupabasePedidos() {


if (
    window.supabaseClient &&
    typeof window.supabaseClient.from === 'function'
) {
    return window.supabaseClient;
}

if (
    window._supabase &&
    typeof window._supabase.from === 'function'
) {
    return window._supabase;
}

if (
    typeof window.obterSupabase === 'function'
) {
    try {

        const cliente =
            window.obterSupabase();

        if (
            cliente &&
            typeof cliente.from === 'function'
        ) {
            return cliente;
        }

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

/* ============================================================
ELEMENTO
============================================================ */

function elemento(id) {
return document.getElementById(id);
}

/* ============================================================
NORMALIZAR TEXTO
============================================================ */

function normalizarTexto(texto) {


return String(texto ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();


}

/* ============================================================
MOEDA
============================================================ */

function formatarMoeda(valor) {


const numero =
    Number(valor ?? 0);

return numero.toLocaleString(
    'pt-BR',
    {
        style: 'currency',
        currency: 'BRL'
    }
);


}

/* ============================================================
DATA
============================================================ */

function formatarData(valor) {


if (!valor) {
    return 'Não informado';
}

const data =
    new Date(valor);

if (
    Number.isNaN(
        data.getTime()
    )
) {
    return 'Não informado';
}

return data.toLocaleString(
    'pt-BR',
    {
        dateStyle: 'short',
        timeStyle: 'short'
    }
);


}

/* ============================================================
STATUS
============================================================ */

function normalizarStatus(status) {


return normalizarTexto(status)
    .replace(/-/g, '_')
    .replace(/\s+/g, '_');


}

function textoStatus(status) {


const valor =
    normalizarStatus(status);

const mapa = {

    pendente: 'Pendente',

    processando: 'Processando',

    enviado: 'Enviado',

    a_caminho: 'A caminho',

    entregue: 'Entregue',

    cancelado: 'Cancelado'

};

return mapa[valor] ||
    (
        status ||
        'Não informado'
    );


}

function classeStatus(status) {


const valor =
    normalizarStatus(status);

if (valor === 'pendente') {
    return 'status-pendente';
}

if (valor === 'processando') {
    return 'status-processando';
}

if (valor === 'enviado') {
    return 'status-enviado';
}

if (valor === 'a_caminho') {
    return 'status-a-caminho';
}

if (valor === 'entregue') {
    return 'status-entregue';
}

if (valor === 'cancelado') {
    return 'status-cancelado';
}

return 'status-processando';


}

/* ============================================================
MENSAGEM
============================================================ */

function mostrarMensagem(
texto,
tipo = 'sucesso'
) {


const campo =
    elemento('mensagem-pedidos');

if (!campo) {
    return;
}

campo.textContent =
    texto;

campo.className =
    'mensagem-pedidos mensagem-' +
    tipo;

campo.style.display =
    'block';


}

function esconderMensagem() {


const campo =
    elemento('mensagem-pedidos');

if (!campo) {
    return;
}

campo.textContent =
    '';

campo.style.display =
    'none';


}

/* ============================================================
CARREGAR CLIENTES
============================================================ */

async function carregarClientes(supabase) {


try {

    const resultado =
        await supabase
            .from('clientes')
            .select('*');

    if (resultado.error) {

        console.warn(
            'Não foi possível carregar clientes:',
            resultado.error
        );

        return [];
    }

    return resultado.data || [];

} catch (erro) {

    console.warn(
        'Erro ao consultar clientes:',
        erro
    );

    return [];
}


}

/* ============================================================
RELACIONAR CLIENTE AO PEDIDO
============================================================ */

function localizarCliente(pedido, clientes) {


if (
    !Array.isArray(clientes) ||
    clientes.length === 0
) {
    return null;
}

const possiveisIds = [

    pedido.cliente_id,
    pedido.id_cliente,
    pedido.clienteId

]
    .filter(
        valor =>
            valor !== null &&
            valor !== undefined &&
            valor !== ''
    )
    .map(
        valor =>
            String(valor)
    );

for (
    const cliente of clientes
) {

    const idsCliente = [

        cliente.id,
        cliente.cliente_id

    ]
        .filter(
            valor =>
                valor !== null &&
                valor !== undefined &&
                valor !== ''
        )
        .map(
            valor =>
                String(valor)
        );

    if (
        possiveisIds.some(
            id =>
                idsCliente.includes(id)
        )
    ) {
        return cliente;
    }
}

const emailPedido =
    normalizarTexto(
        pedido.cliente_email ||
        pedido.email
    );

if (emailPedido) {

    const clientePorEmail =
        clientes.find(
            cliente =>
                normalizarTexto(
                    cliente.email
                ) === emailPedido
        );

    if (clientePorEmail) {
        return clientePorEmail;
    }
}

return null;


}

/* ============================================================
PREPARAR PEDIDO
============================================================ */

function prepararPedido(
pedido,
cliente
) {


const resultado = {
    ...pedido
};

if (cliente) {

    if (
        !resultado.cliente_nome
    ) {

        resultado.cliente_nome =
            cliente.nome ||
            cliente.nome_completo ||
            cliente.razao_social ||
            cliente.name ||
            '';

    }

    if (
        !resultado.cliente_email
    ) {

        resultado.cliente_email =
            cliente.email ||
            '';

    }

    if (
        !resultado.cliente_id &&
        cliente.id
    ) {

        resultado.cliente_id =
            cliente.id;

    }
}

return resultado;


}

/* ============================================================
BUSCAR PEDIDOS
============================================================ */

async function carregarPedidosDoBanco() {


const supabase =
    obterSupabasePedidos();

if (!supabase) {

    throw new Error(
        'Cliente Supabase não encontrado.'
    );
}

console.log(
    'Consultando tabela pedidos...'
);

const resultado =
    await supabase
        .from('pedidos')
        .select('*');

if (resultado.error) {

    console.error(
        'Erro retornado pelo Supabase:',
        resultado.error
    );

    throw resultado.error;
}

const pedidosBanco =
    resultado.data || [];

console.log(
    'Pedidos encontrados no banco:',
    pedidosBanco
);

let clientes = [];

if (
    pedidosBanco.length > 0
) {

    clientes =
        await carregarClientes(
            supabase
        );
}

const pedidosPreparados =
    pedidosBanco.map(
        pedido => {

            const cliente =
                localizarCliente(
                    pedido,
                    clientes
                );

            return prepararPedido(
                pedido,
                cliente
            );
        }
    );

pedidosPreparados.sort(
    function(a, b) {

        const dataA =
            new Date(
                a.created_at ||
                a.data_criacao ||
                0
            ).getTime();

        const dataB =
            new Date(
                b.created_at ||
                b.data_criacao ||
                0
            ).getTime();

        return dataB - dataA;
    }
);

return pedidosPreparados;


}

/* ============================================================
RESUMO
============================================================ */

function atualizarResumo() {


const total =
    pedidos.length;

const pendentes =
    pedidos.filter(
        pedido =>
            normalizarStatus(
                pedido.status
            ) === 'pendente'
    ).length;

const caminho =
    pedidos.filter(
        pedido => {

            const status =
                normalizarStatus(
                    pedido.status
                );

            return (
                status === 'enviado' ||
                status === 'a_caminho'
            );
        }
    ).length;

const entregues =
    pedidos.filter(
        pedido =>
            normalizarStatus(
                pedido.status
            ) === 'entregue'
    ).length;

const totalElemento =
    elemento(
        'total-pedidos'
    );

const pendentesElemento =
    elemento(
        'pedidos-pendentes'
    );

const caminhoElemento =
    elemento(
        'pedidos-caminho'
    );

const entreguesElemento =
    elemento(
        'pedidos-entregues'
    );

if (totalElemento) {
    totalElemento.textContent =
        total;
}

if (pendentesElemento) {
    pendentesElemento.textContent =
        pendentes;
}

if (caminhoElemento) {
    caminhoElemento.textContent =
        caminho;
}

if (entreguesElemento) {
    entreguesElemento.textContent =
        entregues;
}


}

/* ============================================================
FILTROS
============================================================ */

function aplicarFiltros() {


const filtro =
    elemento(
        'filtro-status'
    );

const pesquisaCampo =
    elemento(
        'campo-pesquisa'
    );

const statusFiltro =
    filtro
        ? normalizarStatus(
            filtro.value
        )
        : 'todos';

const pesquisa =
    pesquisaCampo
        ? normalizarTexto(
            pesquisaCampo.value
        )
        : '';

pedidosFiltrados =
    pedidos.filter(
        pedido => {

            if (
                statusFiltro !== 'todos'
            ) {

                const statusPedido =
                    normalizarStatus(
                        pedido.status
                    );

                if (
                    statusPedido !==
                    statusFiltro
                ) {
                    return false;
                }
            }

            if (!pesquisa) {
                return true;
            }

            const numero =
                normalizarTexto(
                    pedido.numero_pedido
                );

            const id =
                normalizarTexto(
                    pedido.id
                );

            const cliente =
                normalizarTexto(
                    pedido.cliente_nome
                );

            const email =
                normalizarTexto(
                    pedido.cliente_email
                );

            return (
                numero.includes(
                    pesquisa
                ) ||
                id.includes(
                    pesquisa
                ) ||
                cliente.includes(
                    pesquisa
                ) ||
                email.includes(
                    pesquisa
                )
            );
        }
    );

renderizarPedidos();


}

/* ============================================================
BADGE
============================================================ */

function criarBadge(status) {


const badge =
    document.createElement(
        'span'
    );

badge.className =
    'status-badge ' +
    classeStatus(status);

badge.textContent =
    textoStatus(status);

return badge;


}

/* ============================================================
CARD
============================================================ */

function criarCardPedido(pedido) {


const card =
    document.createElement(
        'article'
    );

card.className =
    'pedido-card';

/* ========================================================
   NÚMERO
======================================================== */

const numero =
    document.createElement(
        'div'
    );

const numeroStrong =
    document.createElement(
        'div'
    );

numeroStrong.className =
    'pedido-numero';

const numeroPedido =
    pedido.numero_pedido ||
    pedido.numero ||
    pedido.id ||
    'Sem número';

numeroStrong.textContent =
    '#' + numeroPedido;

const data =
    document.createElement(
        'div'
    );

data.className =
    'pedido-data';

data.textContent =
    formatarData(
        pedido.created_at ||
        pedido.data_criacao
    );

numero.appendChild(
    numeroStrong
);

numero.appendChild(
    data
);

/* ========================================================
   CLIENTE
======================================================== */

const cliente =
    document.createElement(
        'div'
    );

cliente.className =
    'pedido-cliente';

const clienteNome =
    document.createElement(
        'strong'
    );

clienteNome.textContent =
    pedido.cliente_nome ||
    pedido.nome_cliente ||
    pedido.nome ||
    'Cliente não informado';

const clienteEmail =
    document.createElement(
        'span'
    );

clienteEmail.textContent =
    pedido.cliente_email ||
    pedido.email ||
    'E-mail não informado';

cliente.appendChild(
    clienteNome
);

cliente.appendChild(
    clienteEmail
);

/* ========================================================
   VALOR
======================================================== */

const valor =
    document.createElement(
        'div'
    );

const valorPrincipal =
    document.createElement(
        'div'
    );

valorPrincipal.className =
    'pedido-valor';

valorPrincipal.textContent =
    formatarMoeda(
        pedido.total
    );

const pagamento =
    document.createElement(
        'div'
    );

pagamento.className =
    'pedido-pagamento';

pagamento.textContent =
    'Pagamento: ' +
    (
        pedido.status_pagamento ||
        'Não informado'
    );

valor.appendChild(
    valorPrincipal
);

valor.appendChild(
    pagamento
);

/* ========================================================
   STATUS
======================================================== */

const status =
    document.createElement(
        'div'
    );

status.className =
    'pedido-status';

status.appendChild(
    criarBadge(
        pedido.status
    )
);

/* ========================================================
   AÇÃO
======================================================== */

const acao =
    document.createElement(
        'div'
    );

acao.className =
    'pedido-acao';

const botao =
    document.createElement(
        'button'
    );

botao.type =
    'button';

botao.className =
    'btn-detalhes';

botao.textContent =
    'Detalhes';

botao.addEventListener(
    'click',
    function() {

        abrirDetalhesPedido(
            pedido
        );

    }
);

acao.appendChild(
    botao
);

card.appendChild(
    numero
);

card.appendChild(
    cliente
);

card.appendChild(
    valor
);

card.appendChild(
    status
);

card.appendChild(
    acao
);

return card;


}

/* ============================================================
RENDERIZAR
============================================================ */

function renderizarPedidos() {


const lista =
    elemento(
        'lista-pedidos'
    );

if (!lista) {
    return;
}

lista.innerHTML =
    '';

if (
    pedidosFiltrados.length === 0
) {

    lista.innerHTML =
        `
        <div class="pedidos-vazio">

            <div class="pedidos-vazio-icone">
                📦
            </div>

            <h2>
                Nenhum pedido encontrado
            </h2>

            <p>
                Não existem pedidos correspondentes
                aos filtros selecionados.
            </p>

        </div>
        `;

    return;
}

const fragmento =
    document.createDocumentFragment();

pedidosFiltrados.forEach(
    pedido => {

        fragmento.appendChild(
            criarCardPedido(
                pedido
            )
        );

    }
);

lista.appendChild(
    fragmento
);


}

/* ============================================================
MODAL
============================================================ */

function criarModal() {


if (
    elemento(
        'modal-pedido'
    )
) {
    return;
}

const modal =
    document.createElement(
        'div'
    );

modal.id =
    'modal-pedido';

modal.className =
    'modal-pedido';

modal.innerHTML =
    `
    <div class="modal-conteudo">

        <div class="modal-topo">

            <h2>
                Detalhes do pedido
            </h2>

            <button
                type="button"
                class="btn-fechar-modal"
                id="btn-fechar-modal"
            >
                ×
            </button>

        </div>

        <div
            id="detalhes-pedido"
            class="detalhes-grid"
        ></div>

        <div class="alterar-status">

            <label for="novo-status">
                Alterar status do pedido
            </label>

            <select id="novo-status">

                <option value="pendente">
                    Pendente
                </option>

                <option value="processando">
                    Processando
                </option>

                <option value="enviado">
                    Enviado
                </option>

                <option value="a_caminho">
                    A caminho
                </option>

                <option value="entregue">
                    Entregue
                </option>

                <option value="cancelado">
                    Cancelado
                </option>

            </select>

            <button
                type="button"
                id="btn-salvar-status"
                class="btn-salvar-status"
            >
                Salvar status
            </button>

        </div>

    </div>
    `;

document.body.appendChild(
    modal
);

const fechar =
    elemento(
        'btn-fechar-modal'
    );

if (fechar) {

    fechar.addEventListener(
        'click',
        fecharModal
    );
}

modal.addEventListener(
    'click',
    function(evento) {

        if (
            evento.target ===
            modal
        ) {
            fecharModal();
        }

    }
);

const salvar =
    elemento(
        'btn-salvar-status'
    );

if (salvar) {

    salvar.addEventListener(
        'click',
        salvarStatusPedido
    );
}


}

/* ============================================================
ABRIR DETALHES
============================================================ */

function abrirDetalhesPedido(
pedido
) {


criarModal();

pedidoSelecionado =
    pedido;

const detalhes =
    elemento(
        'detalhes-pedido'
    );

if (!detalhes) {
    return;
}

const numeroPedido =
    pedido.numero_pedido ||
    pedido.numero ||
    pedido.id ||
    'Não informado';

detalhes.innerHTML =
    `
    <div class="detalhe-item">

        <label>
            Pedido
        </label>

        <strong>
            #${numeroPedido}
        </strong>

    </div>

    <div class="detalhe-item">

        <label>
            Data
        </label>

        <strong>
            ${formatarData(
                pedido.created_at ||
                pedido.data_criacao
            )}
        </strong>

    </div>

    <div class="detalhe-item">

        <label>
            Cliente
        </label>

        <strong>
            ${pedido.cliente_nome ||
            pedido.nome_cliente ||
            pedido.nome ||
            'Não informado'}
        </strong>

    </div>

    <div class="detalhe-item">

        <label>
            E-mail
        </label>

        <strong>
            ${pedido.cliente_email ||
            pedido.email ||
            'Não informado'}
        </strong>

    </div>

    <div class="detalhe-item">

        <label>
            Total
        </label>

        <strong>
            ${formatarMoeda(
                pedido.total
            )}
        </strong>

    </div>

    <div class="detalhe-item">

        <label>
            Pagamento
        </label>

        <strong>
            ${pedido.status_pagamento ||
            'Não informado'}
        </strong>

    </div>
    `;

const select =
    elemento(
        'novo-status'
    );

if (select) {

    const statusAtual =
        normalizarStatus(
            pedido.status
        );

    select.value =
        statusAtual ||
        'pendente';
}

const modal =
    elemento(
        'modal-pedido'
    );

if (modal) {

    modal.classList.add(
        'aberto'
    );
}


}

/* ============================================================
FECHAR MODAL
============================================================ */

function fecharModal() {


const modal =
    elemento(
        'modal-pedido'
    );

if (!modal) {
    return;
}

modal.classList.remove(
    'aberto'
);

pedidoSelecionado =
    null;


}

/* ============================================================
SALVAR STATUS
============================================================ */

async function salvarStatusPedido() {


if (!pedidoSelecionado) {

    alert(
        'Nenhum pedido selecionado.'
    );

    return;
}

const supabase =
    obterSupabasePedidos();

if (!supabase) {

    alert(
        'Cliente Supabase não encontrado.'
    );

    return;
}

const select =
    elemento(
        'novo-status'
    );

const botao =
    elemento(
        'btn-salvar-status'
    );

const novoStatus =
    select
        ? select.value
        : 'pendente';

const textoOriginal =
    botao
        ? botao.textContent
        : 'Salvar status';

try {

    if (botao) {

        botao.disabled =
            true;

        botao.textContent =
            'Salvando...';
    }

    const resultado =
        await supabase
            .from('pedidos')
            .update({

                status:
                    novoStatus,

                updated_at:
                    new Date().toISOString()

            })
            .eq(
                'id',
                pedidoSelecionado.id
            );

    if (resultado.error) {
        throw resultado.error;
    }

    const pedidoAtualizado =
        pedidos.find(
            pedido =>
                String(
                    pedido.id
                ) ===
                String(
                    pedidoSelecionado.id
                )
        );

    if (pedidoAtualizado) {

        pedidoAtualizado.status =
            novoStatus;

        pedidoAtualizado.updated_at =
            new Date().toISOString();
    }

    atualizarResumo();

    aplicarFiltros();

    fecharModal();

    mostrarMensagem(
        'Status do pedido atualizado com sucesso.',
        'sucesso'
    );

} catch (erro) {

    console.error(
        'Erro ao alterar status:',
        erro
    );

    alert(
        'Não foi possível alterar o status.\n\n' +
        (
            erro.message ||
            'Erro desconhecido.'
        )
    );

} finally {

    if (botao) {

        botao.disabled =
            false;

        botao.textContent =
            textoOriginal;
    }
}


}

/* ============================================================
INICIAR CARREGAMENTO
============================================================ */

async function iniciarCarregamento() {


esconderMensagem();

const lista =
    elemento(
        'lista-pedidos'
    );

if (lista) {

    lista.innerHTML =
        `
        <div class="pedidos-vazio">

            <div class="pedidos-vazio-icone">
                ⏳
            </div>

            <h2>
                Carregando pedidos
            </h2>

            <p>
                Consultando pedidos...
            </p>

        </div>
        `;
}

try {

    pedidos =
        await carregarPedidosDoBanco();

    pedidosFiltrados =
        [...pedidos];

    atualizarResumo();

    aplicarFiltros();

    console.log(
        'Total de pedidos carregados:',
        pedidos.length
    );

    if (
        pedidos.length === 0
    ) {

        mostrarMensagem(
            'A tabela pedidos foi consultada, mas não existem pedidos cadastrados.',
            'sucesso'
        );
    }

} catch (erro) {

    console.error(
        'ERRO AO CARREGAR PEDIDOS:',
        erro
    );

    const mensagemErro =
        erro?.message ||
        erro?.details ||
        erro?.hint ||
        'Erro desconhecido.';

    mostrarMensagem(
        'Não foi possível carregar os pedidos: ' +
        mensagemErro,
        'erro'
    );

    if (lista) {

        lista.innerHTML =
            `
            <div class="pedidos-vazio">

                <div class="pedidos-vazio-icone">
                    ⚠️
                </div>

                <h2>
                    Erro ao carregar pedidos
                </h2>

                <p>
                    ${mensagemErro}
                </p>

            </div>
            `;
    }
}


}

/* ============================================================
EVENTOS
============================================================ */

document.addEventListener(
'DOMContentLoaded',
function() {


    console.log(
        '=================================================='
    );

    console.log(
        'ZoraVision - Admin Pedidos'
    );

    console.log(
        'Inicializando página...'
    );

    console.log(
        '=================================================='
    );

    const filtro =
        elemento(
            'filtro-status'
        );

    if (filtro) {

        filtro.addEventListener(
            'change',
            aplicarFiltros
        );
    }

    const pesquisa =
        elemento(
            'campo-pesquisa'
        );

    if (pesquisa) {

        pesquisa.addEventListener(
            'input',
            aplicarFiltros
        );
    }

    const atualizar =
        elemento(
            'btn-atualizar-pedidos'
        );

    if (atualizar) {

        atualizar.addEventListener(
            'click',
            iniciarCarregamento
        );
    }

    iniciarCarregamento();

}


);

/* ============================================================
FUNÇÕES GLOBAIS
============================================================ */

window.carregarPedidos =
iniciarCarregamento;

window.aplicarFiltros =
aplicarFiltros;

window.abrirDetalhesPedido =
abrirDetalhesPedido;

window.fecharModal =
fecharModal;

window.salvarStatusPedido =
salvarStatusPedido;

console.log(
'admin-pedidos.js carregado com sucesso.'
);
