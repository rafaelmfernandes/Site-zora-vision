// ============================================================
// ZORAVISION - CUPONS.JS
//
// RESPONSABILIDADES DESTE ARQUIVO:
// - Gerenciar o cupom aplicado no checkout.
// - Validar o código do cupom.
// - Calcular o desconto percentual.
// - Remover o cupom aplicado.
// - Atualizar o resumo do pedido após aplicar/remover cupom.
// - Exibir mensagens de sucesso e erro.
// - Manter o cupom ativo durante a navegação do checkout.
// - Integrar o desconto com o checkoutState do checkout.js.
//
// IMPORTANTE:
// - Este arquivo NÃO cria a tabela de cupons.
// - Este arquivo NÃO cria pedidos.
// - Este arquivo NÃO processa pagamentos.
// - Este arquivo NÃO altera produtos.
// - Este arquivo NÃO gerencia usuários.
//
// COMO ESTÁ FUNCIONANDO NESTA VERSÃO:
// - Os cupons são definidos em uma lista local.
// - A estrutura pode posteriormente ser ligada ao Supabase.
// - O checkout.js continua responsável pelo cálculo geral
//   do pedido.
//
// ARQUIVO:
// Scripts/cupons.js
// ============================================================


// ============================================================
// 1. CONFIGURAÇÃO DOS CUPONS
// ============================================================
//
// IMPORTANTE:
// Estes são exemplos temporários.
// Quando criarmos a tabela "cupons" no Supabase,
// esta parte será substituída pela consulta ao banco.
//

const CUPONS_DISPONIVEIS = {

    ZORA10: {
        codigo: 'ZORA10',
        desconto: 10,
        ativo: true
    },

    ZORA15: {
        codigo: 'ZORA15',
        desconto: 15,
        ativo: true
    },

    ZORA20: {
        codigo: 'ZORA20',
        desconto: 20,
        ativo: true
    }

};


// ============================================================
// 2. OBTER CUPOM SALVO
// ============================================================

function obterCupomSalvo() {

    try {

        const cupom =
            JSON.parse(
                localStorage.getItem(
                    'cupom_zoravision'
                )
            );

        if (
            !cupom ||
            !cupom.codigo
        ) {
            return null;
        }

        return cupom;

    } catch (erro) {

        console.error(
            'Erro ao recuperar cupom:',
            erro
        );

        return null;
    }
}


// ============================================================
// 3. SALVAR CUPOM
// ============================================================

function salvarCupom(cupom) {

    try {

        localStorage.setItem(
            'cupom_zoravision',
            JSON.stringify(cupom)
        );

    } catch (erro) {

        console.error(
            'Erro ao salvar cupom:',
            erro
        );
    }
}


// ============================================================
// 4. REMOVER CUPOM SALVO
// ============================================================

function removerCupomSalvo() {

    localStorage.removeItem(
        'cupom_zoravision'
    );
}


// ============================================================
// 5. OBTER ESTADO DO CHECKOUT
// ============================================================

function obterEstadoCheckoutCupons() {

    if (
        typeof checkoutState === 'undefined'
    ) {

        console.error(
            'checkoutState não está disponível. Verifique se checkout.js foi carregado antes de cupons.js.'
        );

        return null;
    }

    return checkoutState;
}


// ============================================================
// 6. LOCALIZAR CUPOM
// ============================================================

function localizarCupom(codigo) {

    if (!codigo) {
        return null;
    }

    const codigoNormalizado =
        String(codigo)
            .trim()
            .toUpperCase();

    return (
        CUPONS_DISPONIVEIS[
            codigoNormalizado
        ] || null
    );
}


// ============================================================
// 7. VALIDAR CUPOM
// ============================================================

function validarCupom(codigo) {

    if (!codigo) {

        return {
            valido: false,
            mensagem: 'Digite um código de cupom.'
        };
    }


    const cupom =
        localizarCupom(
            codigo
        );


    if (!cupom) {

        return {
            valido: false,
            mensagem: 'Cupom inválido ou não encontrado.'
        };
    }


    if (!cupom.ativo) {

        return {
            valido: false,
            mensagem: 'Este cupom não está mais disponível.'
        };
    }


    if (
        !cupom.desconto ||
        Number(cupom.desconto) <= 0
    ) {

        return {
            valido: false,
            mensagem: 'Este cupom não possui um desconto válido.'
        };
    }


    return {
        valido: true,
        cupom
    };
}


// ============================================================
// 8. APLICAR CUPOM
// ============================================================

function aplicarCupom(codigo) {

    const estado =
        obterEstadoCheckoutCupons();


    if (!estado) {
        return false;
    }


    const resultado =
        validarCupom(
            codigo
        );


    if (!resultado.valido) {

        mostrarMensagemCupom(
            resultado.mensagem,
            'erro'
        );

        return false;
    }


    const cupom =
        resultado.cupom;


    estado.cupomAtivo =
        cupom.codigo;


    estado.descontoPorcentagem =
        Number(
            cupom.desconto
        ) || 0;


    salvarCupom({
        codigo:
            cupom.codigo,

        desconto:
            estado.descontoPorcentagem
    });


    mostrarMensagemCupom(
        `Cupom ${cupom.codigo} aplicado! Desconto de ${estado.descontoPorcentagem}%.`,
        'sucesso'
    );


    atualizarResumoCupom();


    return true;
}


// ============================================================
// 9. REMOVER CUPOM
// ============================================================

function removerCupom() {

    const estado =
        obterEstadoCheckoutCupons();


    if (!estado) {
        return false;
    }


    estado.cupomAtivo =
        null;


    estado.descontoPorcentagem =
        0;


    removerCupomSalvo();


    mostrarMensagemCupom(
        'Cupom removido.',
        'sucesso'
    );


    atualizarResumoCupom();


    return true;
}


// ============================================================
// 10. CARREGAR CUPOM SALVO
// ============================================================

function carregarCupomSalvo() {

    const estado =
        obterEstadoCheckoutCupons();


    if (!estado) {
        return;
    }


    const cupom =
        obterCupomSalvo();


    if (!cupom) {

        estado.cupomAtivo =
            null;

        estado.descontoPorcentagem =
            0;

        return;
    }


    const resultado =
        validarCupom(
            cupom.codigo
        );


    if (!resultado.valido) {

        removerCupomSalvo();

        estado.cupomAtivo =
            null;

        estado.descontoPorcentagem =
            0;

        return;
    }


    estado.cupomAtivo =
        resultado.cupom.codigo;


    estado.descontoPorcentagem =
        Number(
            resultado.cupom.desconto
        ) || 0;
}


// ============================================================
// 11. ATUALIZAR RESUMO
// ============================================================

function atualizarResumoCupom() {

    /*
     * O checkout.js possui o cálculo oficial dos valores.
     * Aqui apenas solicitamos a atualização da interface.
     */

    if (
        typeof CarrinhoCheckoutModule !==
        'undefined'
    ) {

        if (
            typeof CarrinhoCheckoutModule
                .atualizarTudo ===
            'function'
        ) {

            CarrinhoCheckoutModule
                .atualizarTudo();
        }
    }


    /*
     * Caso o checkout tenha uma função própria
     * para atualizar seus valores.
     */

    if (
        typeof carregarCheckoutDinamico ===
        'function'
    ) {

        carregarCheckoutDinamico();
    }
}


// ============================================================
// 12. MOSTRAR MENSAGEM DO CUPOM
// ============================================================

function mostrarMensagemCupom(
    mensagem,
    tipo = 'erro'
) {

    const elementos =
        document.querySelectorAll(
            '#cupom-mensagem, .cupom-mensagem'
        );


    if (!elementos.length) {

        /*
         * Caso não exista um elemento visual
         * para a mensagem, utiliza console.
         */

        if (tipo === 'erro') {

            console.warn(
                mensagem
            );

        } else {

            console.log(
                mensagem
            );
        }

        return;
    }


    elementos.forEach(
        elemento => {

            elemento.textContent =
                mensagem;


            elemento.style.display =
                'block';


            elemento.classList.remove(
                'sucesso',
                'erro'
            );


            elemento.classList.add(
                tipo
            );
        }
    );
}


// ============================================================
// 13. INICIALIZAR CAMPOS DE CUPOM
// ============================================================

function inicializarCupons() {

    carregarCupomSalvo();


    const input =
        document.querySelector(
            '#codigo-cupom, #cupom, input[name="cupom"]'
        );


    const botaoAplicar =
        document.querySelector(
            '#btn-aplicar-cupom, .btn-aplicar-cupom'
        );


    const botaoRemover =
        document.querySelector(
            '#btn-remover-cupom, .btn-remover-cupom'
        );


    /*
     * Preenche o campo caso exista
     * um cupom salvo.
     */

    const cupom =
        obterCupomSalvo();


    if (
        input &&
        cupom
    ) {

        input.value =
            cupom.codigo;
    }


    /*
     * Botão aplicar
     */

    if (botaoAplicar) {

        botaoAplicar.addEventListener(
            'click',
            () => {

                const codigo =
                    input
                        ? input.value
                        : '';


                aplicarCupom(
                    codigo
                );
            }
        );
    }


    /*
     * Botão remover
     */

    if (botaoRemover) {

        botaoRemover.addEventListener(
            'click',
            () => {

                removerCupom();

            }
        );
    }
}


// ============================================================
// 14. INICIALIZAÇÃO AUTOMÁTICA
// ============================================================

document.addEventListener(
    'DOMContentLoaded',
    () => {

        inicializarCupons();

    }
);


// ============================================================
// 15. EXPORTAÇÕES GLOBAIS
// ============================================================

window.aplicarCupom =
    aplicarCupom;

window.removerCupom =
    removerCupom;

window.validarCupom =
    validarCupom;

window.localizarCupom =
    localizarCupom;

window.obterCupomSalvo =
    obterCupomSalvo;

window.carregarCupomSalvo =
    carregarCupomSalvo;

window.atualizarResumoCupom =
    atualizarResumoCupom;