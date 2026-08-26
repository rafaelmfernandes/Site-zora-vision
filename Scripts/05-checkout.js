// ============================================================
// ZORAVISION - CHECKOUT
// Responsabilidade:
// - Controlar a página de checkout
// - Exibir itens do carrinho
// - Exibir resumo dos valores
// - Exibir endereço selecionado
// - Controlar forma de pagamento
// - Encaminhar a finalização para os módulos responsáveis
// ============================================================


// ============================================================
// 1. USUÁRIO LOGADO
// ============================================================

function obterUsuarioCheckout() {

    try {

        const usuario =
            JSON.parse(
                localStorage.getItem(
                    'usuario_logado'
                )
            );


        if (
            !usuario ||
            !usuario.id ||
            !usuario.email
        ) {
            return null;
        }


        return usuario;

    } catch (erro) {

        console.error(
            'Erro ao obter usuário do checkout:',
            erro
        );

        return null;
    }
}


// ============================================================
// 2. CHAVE DO ENDEREÇO
// ============================================================

function chaveEnderecoCheckout() {

    const usuario =
        obterUsuarioCheckout();


    if (!usuario) {
        return 'ultimo_endereco_cliente';
    }


    return (
        'ultimo_endereco_cliente_' +
        usuario.email
            .trim()
            .toLowerCase()
    );
}


// ============================================================
// 3. CARREGAR ENDEREÇO SALVO
// ============================================================

function obterEnderecoCheckout() {

    try {

        const endereco =
            JSON.parse(
                localStorage.getItem(
                    chaveEnderecoCheckout()
                )
            );


        if (
            !endereco ||
            !endereco.rua
        ) {
            return null;
        }


        return endereco;

    } catch (erro) {

        console.error(
            'Erro ao carregar endereço do checkout:',
            erro
        );

        return null;
    }
}


// ============================================================
// 4. FORMATAÇÃO DE VALOR
// ============================================================

function formatarValorCheckout(valor) {

    return (
        `R$ ${Number(valor || 0)
            .toFixed(2)
            .replace('.', ',')}`
    );
}


// ============================================================
// 5. CONFIGURAR AUTOCOMPLETE
// ============================================================

function configurarAutocompleteCheckout() {

    const campos = [

        {
            id: 'end-nome',
            autocomplete: 'name',
            name: 'name'
        },

        {
            id: 'end-cep',
            autocomplete: 'postal-code',
            name: 'postal-code'
        },

        {
            id: 'end-rua',
            autocomplete: 'address-line1',
            name: 'address-line1'
        },

        {
            id: 'end-numero',
            autocomplete: 'address-line2',
            name: 'address-line2'
        },

        {
            id: 'end-complemento',
            autocomplete: 'address-line3',
            name: 'address-line3'
        },

        {
            id: 'end-bairro',
            autocomplete: 'address-level3',
            name: 'address-level3'
        },

        {
            id: 'end-cidade',
            autocomplete: 'address-level2',
            name: 'address-level2'
        },

        {
            id: 'end-uf',
            autocomplete: 'address-level1',
            name: 'address-level1'
        }
    ];


    campos.forEach(
        campo => {

            const input =
                document.getElementById(
                    campo.id
                );


            if (!input) {
                return;
            }


            input.setAttribute(
                'autocomplete',
                campo.autocomplete
            );


            input.setAttribute(
                'name',
                campo.name
            );
        }
    );
}


// ============================================================
// 6. EXIBIR ENDEREÇO SALVO
// ============================================================

function renderizarEnderecoCheckout() {

    const box =
        document.getElementById(
            'box-endereco-cadastrado'
        );


    const formulario =
        document.getElementById(
            'form-endereco'
        );


    if (
        !box ||
        !formulario
    ) {
        return;
    }


    const endereco =
        obterEnderecoCheckout();


    if (
        endereco &&
        endereco.rua
    ) {

        const nome =
            document.getElementById(
                'card-end-nome'
            );


        const rua =
            document.getElementById(
                'card-end-rua-num'
            );


        const bairro =
            document.getElementById(
                'card-end-bairro-cidade'
            );


        const cep =
            document.getElementById(
                'card-end-cep'
            );


        if (nome) {

            nome.textContent =
                endereco.nome ||
                endereco.nome_destinatario ||
                '';
        }


        if (rua) {

            rua.textContent =
                `${endereco.rua}, nº ${endereco.numero || ''}` +
                (
                    endereco.complemento
                        ? ` (${endereco.complemento})`
                        : ''
                );
        }


        if (bairro) {

            bairro.textContent =
                `${endereco.bairro || ''} - ` +
                `${endereco.cidade || ''}/` +
                `${endereco.uf
                    ? endereco.uf.toUpperCase()
                    : ''}`;
        }


        if (cep) {

            cep.textContent =
                `CEP: ${endereco.cep || ''}`;
        }


        box.style.display =
            'block';


        formulario.style.display =
            'none';


    } else {

        box.style.display =
            'none';


        formulario.style.display =
            'flex';
    }
}


// ============================================================
// 7. ALTERNAR FORMULÁRIO DE ENDEREÇO
// ============================================================

function alternarFormularioCheckout(
    exibirFormulario
) {

    const box =
        document.getElementById(
            'box-endereco-cadastrado'
        );


    const formulario =
        document.getElementById(
            'form-endereco'
        );


    const cancelar =
        document.getElementById(
            'btn-cancelar-alteracao'
        );


    if (
        !box ||
        !formulario
    ) {
        return;
    }


    if (exibirFormulario) {

        box.style.display =
            'none';


        formulario.style.display =
            'flex';


        if (cancelar) {

            cancelar.style.display =
                'inline-block';
        }

    } else {

        box.style.display =
            'block';


        formulario.style.display =
            'none';


        if (cancelar) {

            cancelar.style.display =
                'none';
        }
    }
}


// ============================================================
// 8. RENDERIZAR ITENS DO CHECKOUT
// ============================================================

function renderizarItensCheckout() {

    const lista =
        document.getElementById(
            'chk-lista-itens'
        );


    if (!lista) {
        return;
    }


    if (
        typeof CarrinhoModule ===
        'undefined'
    ) {

        console.error(
            'CarrinhoModule não está disponível.'
        );

        return;
    }


    const itens =
        CarrinhoModule
            ? carrinhoState.itens
            : [];


    if (
        !itens ||
        itens.length === 0
    ) {

        lista.innerHTML = `
            <p
                style="
                    color:#64748b;
                    font-size:13px;
                "
            >
                Seu carrinho está vazio.
            </p>
        `;

        return;
    }


    lista.innerHTML =
        itens
            .map(
                item => {

                    const preco =
                        parseFloat(
                            item.preco
                        ) || 0;


                    const quantidade =
                        parseInt(
                            item.quantidade
                        ) || 0;


                    const subtotal =
                        preco *
                        quantidade;


                    return `
                        <div
                            class="item-linha"
                            style="
                                display:flex;
                                justify-content:space-between;
                                align-items:center;
                                gap:12px;
                                margin-bottom:8px;
                                font-size:14px;
                            "
                        >

                            <span
                                class="item-qtd-nome"
                            >
                                ${quantidade}x
                                ${item.nome || 'Produto'}
                            </span>


                            <span
                                class="item-preco"
                                style="
                                    font-weight:600;
                                    white-space:nowrap;
                                "
                            >
                                ${formatarValorCheckout(
                                    subtotal
                                )}
                            </span>

                        </div>
                    `;
                }
            )
            .join('');
}


// ============================================================
// 9. ATUALIZAR TÍTULO DOS ITENS
// ============================================================

function atualizarTituloItensCheckout() {

    const titulo =
        document.getElementById(
            'chk-titulo-itens'
        );


    if (!titulo) {
        return;
    }


    if (
        typeof CarrinhoModule ===
        'undefined'
    ) {
        return;
    }


    const quantidade =
        CarrinhoModule
            .quantidadeTotal();


    titulo.textContent =
        `📦 Itens do Pedido (${quantidade})`;
}


// ============================================================
// 10. ATUALIZAR RESUMO
// ============================================================

function atualizarResumoCheckout() {

    const subtotalEl =
        document.getElementById(
            'chk-subtotal'
        );


    const freteEl =
        document.getElementById(
            'chk-frete'
        );


    const descontoEl =
        document.getElementById(
            'chk-desconto'
        );


    const totalEl =
        document.getElementById(
            'chk-total'
        );


    if (
        typeof CarrinhoModule ===
        'undefined'
    ) {

        console.error(
            'CarrinhoModule não está disponível.'
        );

        return;
    }


    const valores =
        CarrinhoModule
            .calcularValores();


    if (subtotalEl) {

        subtotalEl.textContent =
            formatarValorCheckout(
                valores.subtotal
            );
    }


    if (freteEl) {

        freteEl.textContent =
            formatarValorCheckout(
                valores.taxaEntrega
            );
    }


    if (descontoEl) {

        descontoEl.textContent =
            formatarValorCheckout(
                valores.valorDesconto
            );
    }


    if (totalEl) {

        totalEl.textContent =
            formatarValorCheckout(
                valores.total
            );
    }
}


// ============================================================
// 11. SELECIONAR MÉTODO DE PAGAMENTO
// ============================================================

function configurarPagamentoCheckout() {

    const radios =
        document.querySelectorAll(
            'input[name="pagamento"]'
        );


    if (!radios.length) {
        return;
    }


    const metodoSalvo =
        localStorage.getItem(
            'ultimo_metodo_pagamento'
        );


    let metodoSelecionado =
        metodoSalvo ||
        'pix';


    let encontrouMetodo =
        false;


    radios.forEach(
        radio => {

            if (
                radio.value ===
                metodoSelecionado
            ) {

                radio.checked =
                    true;

                encontrouMetodo =
                    true;
            }


            radio.addEventListener(
                'change',
                event => {

                    const metodo =
                        event.target.value;


                    localStorage.setItem(
                        'ultimo_metodo_pagamento',
                        metodo
                    );
                }
            );
        }
    );


    if (!encontrouMetodo) {

        const primeiro =
            radios[0];


        if (primeiro) {

            primeiro.checked =
                true;


            localStorage.setItem(
                'ultimo_metodo_pagamento',
                primeiro.value
            );
        }
    }
}


// ============================================================
// 12. VALIDAR CHECKOUT
// ============================================================

function validarCheckout() {

    const usuario =
        obterUsuarioCheckout();


    if (!usuario) {

        alert(
            'Você precisa estar logado para continuar.'
        );

        window.location.href =
            'Login.html';

        return false;
    }


    if (
        typeof CarrinhoModule ===
        'undefined'
    ) {

        alert(
            'O carrinho não foi carregado corretamente.'
        );

        return false;
    }


    if (
        !carrinhoState.itens ||
        carrinhoState.itens.length === 0
    ) {

        alert(
            'Seu carrinho está vazio.'
        );

        return false;
    }


    const endereco =
        obterEnderecoCheckout();


    if (
        !endereco ||
        !endereco.rua
    ) {

        alert(
            'Informe um endereço de entrega antes de continuar.'
        );

        return false;
    }


    return true;
}


// ============================================================
// 13. FINALIZAR CHECKOUT
// ============================================================

function finalizarCheckout() {

    if (!validarCheckout()) {
        return;
    }


    const pagamento =
        document.querySelector(
            'input[name="pagamento"]:checked'
        );


    const metodo =
        pagamento
            ? pagamento.value
            : 'pix';


    // ========================================================
    // PIX
    // ========================================================

    if (
        metodo === 'pix'
    ) {

        if (
            typeof iniciarPagamentoPix ===
            'function'
        ) {

            iniciarPagamentoPix();

            return;
        }


        console.error(
            'A função iniciarPagamentoPix não está disponível.'
        );


        alert(
            'O módulo de pagamento PIX não foi carregado.'
        );

        return;
    }


    // ========================================================
    // OUTROS MÉTODOS
    // ========================================================

    alert(
        'Este método de pagamento ainda está em configuração.'
    );
}


// ============================================================
// 14. CARREGAR CHECKOUT
// ============================================================

function carregarCheckout() {

    const usuario =
        obterUsuarioCheckout();


    if (!usuario) {

        alert(
            'Você precisa estar logado para acessar o checkout.'
        );

        window.location.href =
            'Login.html';

        return;
    }


    configurarAutocompleteCheckout();

    renderizarEnderecoCheckout();

    renderizarItensCheckout();

    atualizarTituloItensCheckout();

    atualizarResumoCheckout();

    configurarPagamentoCheckout();
}


// ============================================================
// 15. EVENTOS
// ============================================================

document.addEventListener(
    'DOMContentLoaded',
    () => {

        const pagina =
            window.location.pathname
                .toLowerCase();


        if (
            pagina.includes(
                'checkout'
            )
        ) {

            carregarCheckout();
        }
    }
);


// ============================================================
// 16. EXPORTAÇÕES GLOBAIS
// ============================================================

window.carregarCheckout =
    carregarCheckout;

window.finalizarCheckout =
    finalizarCheckout;

window.alternarFormularioCheckout =
    alternarFormularioCheckout;

window.renderizarEnderecoCheckout =
    renderizarEnderecoCheckout;

window.atualizarResumoCheckout =
    atualizarResumoCheckout;