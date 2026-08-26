// ============================================================
// ZORAVISION - PAGAMENTO-PIX.JS
//
// RESPONSABILIDADES DESTE ARQUIVO:
// - Carregar os dados do pagamento PIX salvo no navegador.
// - Exibir o valor e o número do pedido.
// - Exibir o QR Code PIX.
// - Exibir o código PIX para pagamento.
// - Permitir copiar o código PIX.
// - Verificar automaticamente se o pagamento foi aprovado.
// - Consultar a Edge Function do Supabase.
// - Atualizar o status do pedido após a aprovação.
// - Atualizar os dados do pedido no localStorage.
// - Redirecionar para pedido-confirmado.html após a aprovação.
// - Controlar mensagens de carregamento, sucesso e erro.
// - Encerrar a verificação automática ao sair da página.
//
// NÃO É RESPONSABILIDADE DESTE ARQUIVO:
// - Criar o pedido.
// - Criar o pagamento no Mercado Pago.
// - Gerenciar o carrinho.
// - Cadastrar ou alterar endereço.
// - Fazer login ou cadastro de usuário.
//
// ARQUIVO:
// Scripts/pagamento-pix.js
// ============================================================


// ============================================================
// 1. CONFIGURAÇÃO
// ============================================================

const SUPABASE_URL_PIX =
    'https://ratajxnxkjoiuknamacn.supabase.co';

const FUNCAO_VERIFICAR_PIX =
    `${SUPABASE_URL_PIX}/functions/v1/verificar-pagamento-pix`;

const INTERVALO_VERIFICACAO_PIX = 5000;


// ============================================================
// 2. ESTADO
// ============================================================

let intervaloPagamentoPix = null;
let pagamentoPixAprovado = false;


// ============================================================
// 3. ELEMENTOS DA PÁGINA
// ============================================================

function obterElementoPagamentoPix(id) {
    return document.getElementById(id);
}


// ============================================================
// 4. MOSTRAR STATUS
// ============================================================

function mostrarStatusPagamentoPix(
    mensagem,
    tipo = ''
) {
    const status =
        obterElementoPagamentoPix(
            'status-pagamento'
        );

    if (!status) {
        return;
    }

    status.className = 'status';

    if (tipo) {
        status.classList.add(tipo);
    }

    status.innerHTML = mensagem;
    status.style.display = 'block';
}


// ============================================================
// 5. MOSTRAR ERRO
// ============================================================

function mostrarErroPagamentoPix(
    mensagem
) {
    const status =
        obterElementoPagamentoPix(
            'status-pagamento'
        );

    const qrContainer =
        obterElementoPagamentoPix(
            'qr-container'
        );

    const erroBox =
        obterElementoPagamentoPix(
            'erro-pagamento'
        );

    if (status) {
        status.style.display = 'none';
    }

    if (qrContainer) {
        qrContainer.style.display = 'none';
    }

    if (erroBox) {
        erroBox.style.display = 'block';
        erroBox.textContent =
            mensagem ||
            'Não foi possível carregar o pagamento PIX.';
    }
}


// ============================================================
// 6. LER PAGAMENTO PIX DO LOCALSTORAGE
// ============================================================

function obterPagamentoPixLocal() {
    try {
        const pagamentoSalvo =
            localStorage.getItem(
                'pagamento_pix_atual'
            );

        if (!pagamentoSalvo) {
            return null;
        }

        return JSON.parse(
            pagamentoSalvo
        );

    } catch (erro) {
        console.error(
            'Erro ao ler pagamento PIX:',
            erro
        );

        return null;
    }
}


// ============================================================
// 7. LER PEDIDO PIX DO LOCALSTORAGE
// ============================================================

function obterPedidoPixLocal() {
    try {
        const pedidoSalvo =
            localStorage.getItem(
                'pedido_pix_atual'
            );

        if (!pedidoSalvo) {
            return null;
        }

        return JSON.parse(
            pedidoSalvo
        );

    } catch (erro) {
        console.error(
            'Erro ao ler pedido PIX:',
            erro
        );

        return null;
    }
}


// ============================================================
// 8. OBTER ID DO PEDIDO
// ============================================================

function obterIdPedidoPix(
    pedido,
    pagamento
) {
    return (
        pedido?.id ||
        pagamento?.pedido_id ||
        null
    );
}


// ============================================================
// 9. OBTER NÚMERO DO PEDIDO
// ============================================================

function obterNumeroPedidoPix(
    pedido,
    pagamento
) {
    return (
        pedido?.numero_pedido ||
        pagamento?.numero_pedido ||
        pedido?.numero ||
        pagamento?.pedido_id ||
        '-'
    );
}


// ============================================================
// 10. FORMATAR VALOR
// ============================================================

function formatarValorPix(
    valor
) {
    const numero =
        Number(valor) || 0;

    return (
        `R$ ${numero
            .toFixed(2)
            .replace('.', ',')}`
    );
}


// ============================================================
// 11. EXIBIR VALOR DO PAGAMENTO
// ============================================================

function exibirValorPagamentoPix(
    pedido,
    pagamento
) {
    const elemento =
        obterElementoPagamentoPix(
            'valor-pagamento'
        );

    if (!elemento) {
        return;
    }

    const valor =
        Number(
            pedido?.total ??
            pagamento?.total ??
            0
        );

    elemento.textContent =
        formatarValorPix(valor);
}


// ============================================================
// 12. EXIBIR NÚMERO DO PEDIDO
// ============================================================

function exibirNumeroPedidoPix(
    pedido,
    pagamento
) {
    const elemento =
        obterElementoPagamentoPix(
            'numero-pedido'
        );

    if (!elemento) {
        return;
    }

    const numero =
        obterNumeroPedidoPix(
            pedido,
            pagamento
        );

    const numeroFormatado =
        String(numero).startsWith('#')
            ? String(numero)
            : `#${numero}`;

    elemento.textContent =
        `Pedido: ${numeroFormatado}`;
}


// ============================================================
// 13. EXIBIR QR CODE
// ============================================================

function exibirQRCodePix(
    pagamento
) {
    const qrCode =
        obterElementoPagamentoPix(
            'qr-code'
        );

    if (!qrCode) {
        throw new Error(
            'Elemento do QR Code não encontrado.'
        );
    }

    if (
        pagamento?.qr_code_base64
    ) {
        qrCode.src =
            `data:image/png;base64,${pagamento.qr_code_base64}`;

        return;
    }

    if (
        pagamento?.qr_code
    ) {
        qrCode.src =
            'https://quickchart.io/qr?text=' +
            encodeURIComponent(
                pagamento.qr_code
            ) +
            '&size=300';

        return;
    }

    throw new Error(
        'O pagamento não possui QR Code.'
    );
}


// ============================================================
// 14. EXIBIR CÓDIGO PIX
// ============================================================

function exibirCodigoPix(
    pagamento
) {
    const campo =
        obterElementoPagamentoPix(
            'codigo-pix'
        );

    if (!campo) {
        return;
    }

    campo.value =
        pagamento?.qr_code || '';
}


// ============================================================
// 15. MOSTRAR ÁREA DO PIX
// ============================================================

function mostrarAreaPagamentoPix() {
    const status =
        obterElementoPagamentoPix(
            'status-pagamento'
        );

    const qrContainer =
        obterElementoPagamentoPix(
            'qr-container'
        );

    const erroBox =
        obterElementoPagamentoPix(
            'erro-pagamento'
        );

    if (status) {
        status.style.display = 'none';
    }

    if (qrContainer) {
        qrContainer.style.display = 'flex';
    }

    if (erroBox) {
        erroBox.style.display = 'none';
    }
}


// ============================================================
// 16. CARREGAR PAGAMENTO PIX
// ============================================================

function carregarPagamentoPix() {
    try {
        const pagamento =
            obterPagamentoPixLocal();

        const pedido =
            obterPedidoPixLocal();

        if (!pagamento) {
            throw new Error(
                'Pagamento PIX não encontrado. Volte ao checkout e tente novamente.'
            );
        }

        console.log(
            'Pagamento PIX carregado:',
            pagamento
        );

        console.log(
            'Pedido PIX carregado:',
            pedido
        );

        exibirValorPagamentoPix(
            pedido,
            pagamento
        );

        exibirNumeroPedidoPix(
            pedido,
            pagamento
        );

        exibirQRCodePix(
            pagamento
        );

        exibirCodigoPix(
            pagamento
        );

        mostrarAreaPagamentoPix();

        const pedidoId =
            obterIdPedidoPix(
                pedido,
                pagamento
            );

        if (pedidoId) {
            localStorage.setItem(
                'pedido_id_pix_verificacao',
                String(pedidoId)
            );

            verificarPagamentoPix(
                pedidoId
            );

        } else {
            console.warn(
                'ID do pedido não encontrado. A verificação automática não será iniciada.'
            );
        }

    } catch (erro) {
        console.error(
            'Erro ao carregar pagamento PIX:',
            erro
        );

        mostrarErroPagamentoPix(
            erro.message
        );
    }
}


// ============================================================
// 17. VERIFICAR PAGAMENTO PIX
// ============================================================

async function verificarPagamentoPix(
    pedidoId
) {
    if (
        !pedidoId ||
        pagamentoPixAprovado
    ) {
        return;
    }

    try {
        console.log(
            'Verificando pagamento PIX:',
            pedidoId
        );

        const resposta =
            await fetch(
                FUNCAO_VERIFICAR_PIX,
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body: JSON.stringify({
                        pedido_id:
                            pedidoId
                    })
                }
            );

        if (!resposta.ok) {
            const texto =
                await resposta.text();

            console.error(
                'Erro na Edge Function:',
                resposta.status,
                texto
            );

            throw new Error(
                `Erro ao verificar pagamento. HTTP ${resposta.status}`
            );
        }

        const resultado =
            await resposta.json();

        console.log(
            'Resposta da verificação PIX:',
            resultado
        );

        if (
            resultado.encontrado === false
        ) {
            throw new Error(
                'Pedido não encontrado no Supabase.'
            );
        }

        if (
            resultado.pago === true
        ) {
            pagamentoPixAprovado = true;

            pararVerificacaoPagamentoPix();

            mostrarPagamentoPixAprovado(
                resultado
            );

            return;
        }

        mostrarStatusPagamentoPix(
            '<span class="loading-verificacao"></span>' +
            'Aguardando confirmação do pagamento...'
        );

        iniciarVerificacaoPagamentoPix(
            pedidoId
        );

    } catch (erro) {
        console.error(
            'Erro na verificação do pagamento PIX:',
            erro
        );

        iniciarVerificacaoPagamentoPix(
            pedidoId
        );
    }
}


// ============================================================
// 18. INICIAR VERIFICAÇÃO AUTOMÁTICA
// ============================================================

function iniciarVerificacaoPagamentoPix(
    pedidoId
) {
    if (
        !pedidoId ||
        intervaloPagamentoPix
    ) {
        return;
    }

    intervaloPagamentoPix =
        setInterval(
            () => {
                verificarPagamentoPix(
                    pedidoId
                );
            },
            INTERVALO_VERIFICACAO_PIX
        );
}


// ============================================================
// 19. PARAR VERIFICAÇÃO AUTOMÁTICA
// ============================================================

function pararVerificacaoPagamentoPix() {
    if (
        intervaloPagamentoPix
    ) {
        clearInterval(
            intervaloPagamentoPix
        );

        intervaloPagamentoPix = null;
    }
}


// ============================================================
// 20. ATUALIZAR PEDIDO LOCAL
// ============================================================

function atualizarPedidoLocalComPagamentoPix(
    resultado
) {
    try {
        const pedido =
            obterPedidoPixLocal();

        if (!pedido) {
            return;
        }

        if (
            resultado?.status
        ) {
            pedido.status =
                resultado.status;
        }

        if (
            resultado?.status_pagamento
        ) {
            pedido.status_pagamento =
                resultado.status_pagamento;
        }

        localStorage.setItem(
            'pedido_pix_atual',
            JSON.stringify(
                pedido
            )
        );

    } catch (erro) {
        console.warn(
            'Não foi possível atualizar o pedido local:',
            erro
        );
    }
}


// ============================================================
// 21. MOSTRAR PAGAMENTO APROVADO
// ============================================================

function mostrarPagamentoPixAprovado(
    resultado
) {
    const qrContainer =
        obterElementoPagamentoPix(
            'qr-container'
        );

    const erroBox =
        obterElementoPagamentoPix(
            'erro-pagamento'
        );

    const titulo =
        obterElementoPagamentoPix(
            'titulo-pagina'
        );

    const descricao =
        obterElementoPagamentoPix(
            'descricao-pagina'
        );

    if (qrContainer) {
        qrContainer.style.display =
            'none';
    }

    if (erroBox) {
        erroBox.style.display =
            'none';
    }

    if (titulo) {
        titulo.textContent =
            'Pagamento aprovado!';
    }

    if (descricao) {
        descricao.textContent =
            'Seu pagamento PIX foi confirmado com sucesso.';
    }

    const numeroPedido =
        resultado?.numero_pedido ||
        '-';

    mostrarStatusPagamentoPix(
        `
            <strong style="font-size:18px;">
                ✓ Pagamento aprovado
            </strong>
            <br><br>
            Pedido:
            #${numeroPedido}
        `,
        'aprovado'
    );

    atualizarPedidoLocalComPagamentoPix(
        resultado
    );

    setTimeout(
        () => {
            window.location.href =
                'pedido-confirmado.html';
        },
        2000
    );
}


// ============================================================
// 22. COPIAR CÓDIGO PIX
// ============================================================

async function copiarCodigoPix() {
    const campo =
        obterElementoPagamentoPix(
            'codigo-pix'
        );

    const botao =
        obterElementoPagamentoPix(
            'btn-copiar'
        );

    if (!campo || !botao) {
        return;
    }

    if (!campo.value) {
        alert(
            'Código PIX não disponível.'
        );

        return;
    }

    try {
        if (
            navigator.clipboard &&
            window.isSecureContext
        ) {
            await navigator.clipboard.writeText(
                campo.value
            );

        } else {
            campo.focus();
            campo.select();

            document.execCommand(
                'copy'
            );
        }

        const textoOriginal =
            'Copiar código PIX';

        botao.textContent =
            'Código copiado! ✓';

        botao.style.background =
            '#16a34a';

        setTimeout(
            () => {
                botao.textContent =
                    textoOriginal;

                botao.style.background =
                    '';
            },
            2000
        );

    } catch (erro) {
        console.error(
            'Erro ao copiar código PIX:',
            erro
        );

        alert(
            'Não foi possível copiar automaticamente. Selecione o código PIX e copie manualmente.'
        );
    }
}


// ============================================================
// 23. EVENTOS
// ============================================================

function configurarEventosPagamentoPix() {
    const botaoCopiar =
        obterElementoPagamentoPix(
            'btn-copiar'
        );

    if (botaoCopiar) {
        botaoCopiar.addEventListener(
            'click',
            copiarCodigoPix
        );
    }
}


// ============================================================
// 24. INICIALIZAÇÃO
// ============================================================

document.addEventListener(
    'DOMContentLoaded',
    () => {
        configurarEventosPagamentoPix();
        carregarPagamentoPix();
    }
);


// ============================================================
// 25. LIMPAR INTERVALO AO SAIR DA PÁGINA
// ============================================================

window.addEventListener(
    'beforeunload',
    () => {
        pararVerificacaoPagamentoPix();
    }
);


// ============================================================
// 26. EXPORTAÇÕES GLOBAIS
// ============================================================

window.carregarPagamentoPix =
    carregarPagamentoPix;

window.verificarPagamentoPix =
    verificarPagamentoPix;

window.pararVerificacaoPagamentoPix =
    pararVerificacaoPagamentoPix;

window.copiarCodigoPix =
    copiarCodigoPix;