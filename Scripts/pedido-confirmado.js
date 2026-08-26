// ============================================================
// ZORA VISION - PEDIDO CONFIRMADO
// ============================================================
// Carrega:
// - Dados do pedido
// - Itens comprados
// - Total pago
// - Endereço de entrega
// - Status do pedido
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {

    console.log("==========================================");
    console.log("PEDIDO-CONFIRMADO.JS INICIADO");
    console.log("==========================================");

    try {

        // ========================================================
        // VERIFICAR SUPABASE
        // ========================================================

        if (!window.supabaseClient) {

            throw new Error(
                "Supabase não foi carregado. Verifique o arquivo Supabase/supabase.js."
            );
        }

        const supabaseClient =
            window.supabaseClient;


        // ========================================================
        // RECUPERAR PEDIDO DO LOCALSTORAGE
        // ========================================================

        const pedidoSalvo =
            localStorage.getItem(
                "pedido_pix_atual"
            );

        let pedidoLocal = null;

        if (pedidoSalvo) {

            try {

                pedidoLocal =
                    JSON.parse(
                        pedidoSalvo
                    );

            } catch (erro) {

                console.warn(
                    "Não foi possível interpretar pedido_pix_atual:",
                    erro
                );
            }
        }


        // ========================================================
        // DESCOBRIR ID DO PEDIDO
        // ========================================================

        const pedidoId =
            pedidoLocal?.id ||
            localStorage.getItem(
                "pedido_id_pix_verificacao"
            );


        console.log(
            "ID DO PEDIDO:",
            pedidoId
        );


        if (!pedidoId) {

            throw new Error(
                "Não foi possível identificar o pedido confirmado."
            );
        }


        // ========================================================
        // BUSCAR PEDIDO
        // ========================================================

        const {
            data: pedido,
            error: erroPedido
        } =
            await supabaseClient
                .from("pedidos")
                .select(`
                    id,
                    cliente_id,
                    endereco_id,
                    numero_pedido,
                    status,
                    status_pagamento,
                    forma_pagamento,
                    subtotal,
                    frete,
                    desconto,
                    total,
                    observacoes,
                    created_at
                `)
                .eq(
                    "id",
                    pedidoId
                )
                .single();


        if (erroPedido) {

            console.error(
                "ERRO AO BUSCAR PEDIDO:",
                erroPedido
            );

            throw new Error(
                "Não foi possível carregar os dados do pedido."
            );
        }


        if (!pedido) {

            throw new Error(
                "Pedido não encontrado."
            );
        }


        console.log(
            "PEDIDO ENCONTRADO:",
            pedido
        );


        // ========================================================
        // NÚMERO DO PEDIDO
        // ========================================================

        const campoNumero =
            document.getElementById(
                "conf-numero-pedido"
            );


        if (campoNumero) {

            const numero =
                pedido.numero_pedido || "-";


            campoNumero.textContent =
                String(numero).startsWith("#")
                    ? String(numero)
                    : `#${numero}`;
        }


        // ========================================================
        // DATA DO PEDIDO
        // ========================================================

        const campoData =
            document.getElementById(
                "conf-data-pedido"
            );


        if (
            campoData &&
            pedido.created_at
        ) {

            const data =
                new Date(
                    pedido.created_at
                );


            campoData.textContent =
                data.toLocaleDateString(
                    "pt-BR"
                );
        }


        // ========================================================
        // FORMA DE PAGAMENTO
        // ========================================================

        const campoPagamento =
            document.getElementById(
                "conf-pagamento"
            );


        if (campoPagamento) {

            campoPagamento.textContent =
                pedido.forma_pagamento
                    ? String(
                        pedido.forma_pagamento
                    ).toUpperCase()
                    : "PIX";
        }


        // ========================================================
        // TOTAL PAGO
        // ========================================================

        const campoTotal =
            document.getElementById(
                "conf-total-pago"
            );


        if (campoTotal) {

            const total =
                Number(
                    pedido.total || 0
                );


            campoTotal.textContent =
                total.toLocaleString(
                    "pt-BR",
                    {
                        style: "currency",
                        currency: "BRL"
                    }
                );
        }


        // ========================================================
        // BUSCAR ITENS DO PEDIDO
        // ========================================================

        console.log("==========================================");
        console.log("BUSCANDO ITENS DO PEDIDO");
        console.log("PEDIDO ID:", pedido.id);
        console.log("==========================================");


        const {
            data: itens,
            error: erroItens
        } =
            await supabaseClient
                .from("itens_pedido")
                .select(`
                    id,
                    pedido_id,
                    produto_id,
                    nome_produto,
                    quantidade
                `)
                .eq(
                    "pedido_id",
                    pedido.id
                )
                .order(
                    "id",
                    {
                        ascending: true
                    }
                );


        console.log(
            "ITENS RETORNADOS PELO SUPABASE:",
            itens
        );


        console.log(
            "ERRO AO BUSCAR ITENS:",
            erroItens
        );


        console.log(
            "QUANTIDADE DE ITENS:",
            itens
                ? itens.length
                : 0
        );


        // ========================================================
        // CONTAINER DOS ITENS
        // ========================================================

        const listaItens =
            document.getElementById(
                "conf-lista-itens"
            );


        if (!listaItens) {

            console.error(
                "ELEMENTO #conf-lista-itens NÃO ENCONTRADO NO HTML."
            );

        } else {

            listaItens.innerHTML = "";


            // ====================================================
            // ERRO NA CONSULTA
            // ====================================================

            if (erroItens) {

                console.error(
                    "ERRO REAL AO CONSULTAR ITENS:",
                    erroItens
                );


                listaItens.innerHTML =
                    `
                    <div
                        style="
                            padding:15px;
                            border-radius:10px;
                            background:#fef2f2;
                            color:#dc2626;
                            font-size:14px;
                        "
                    >
                        Não foi possível carregar os itens do pedido.
                    </div>
                    `;


            // ====================================================
            // NENHUM ITEM
            // ====================================================

            } else if (
                !itens ||
                itens.length === 0
            ) {

                console.warn(
                    "NENHUM ITEM ENCONTRADO PARA O PEDIDO:",
                    pedido.id
                );


                listaItens.innerHTML =
                    `
                    <div
                        style="
                            padding:15px;
                            text-align:center;
                            color:#64748b;
                            background:#f8fafc;
                            border-radius:10px;
                        "
                    >
                        Nenhum item encontrado neste pedido.
                    </div>
                    `;


            // ====================================================
            // MOSTRAR ITENS
            // ====================================================

            } else {

                itens.forEach(
                    (
                        item,
                        index
                    ) => {

                        console.log(
                            `ITEM ${index + 1}:`,
                            item
                        );


                        const quantidade =
                            Number(
                                item.quantidade || 0
                            );


                        const nome =
                            item.nome_produto ||
                            "Produto";


                        const linha =
                            document.createElement(
                                "div"
                            );


                        linha.style.display =
                            "flex";


                        linha.style.justifyContent =
                            "space-between";


                        linha.style.alignItems =
                            "center";


                        linha.style.gap =
                            "15px";


                        linha.style.padding =
                            "14px 0";


                        linha.style.borderBottom =
                            index <
                            itens.length - 1
                                ? "1px solid #e2e8f0"
                                : "none";


                        linha.innerHTML =
                            `
                            <div
                                style="
                                    display:flex;
                                    align-items:center;
                                    gap:12px;
                                    min-width:0;
                                    flex:1;
                                "
                            >

                                <div
                                    style="
                                        width:42px;
                                        height:42px;
                                        min-width:42px;
                                        border-radius:10px;
                                        background:#eff6ff;
                                        display:flex;
                                        align-items:center;
                                        justify-content:center;
                                        font-size:20px;
                                    "
                                >
                                    📦
                                </div>


                                <div
                                    style="
                                        min-width:0;
                                        text-align:left;
                                    "
                                >

                                    <div
                                        style="
                                            font-weight:600;
                                            color:#1e293b;
                                            font-size:14px;
                                            line-height:1.4;
                                            word-break:break-word;
                                        "
                                    >
                                        ${nome}
                                    </div>


                                    <div
                                        style="
                                            margin-top:4px;
                                            color:#64748b;
                                            font-size:12px;
                                        "
                                    >
                                        ${
                                            quantidade === 1
                                                ? "1 unidade"
                                                : `${quantidade} unidades`
                                        }
                                    </div>

                                </div>

                            </div>


                            <div
                                style="
                                    flex-shrink:0;
                                    text-align:right;
                                    color:#475569;
                                    font-size:13px;
                                    font-weight:600;
                                "
                            >
                                Qtd. ${quantidade}
                            </div>
                            `;


                        listaItens.appendChild(
                            linha
                        );

                    }
                );


                console.log(
                    "ITENS RENDERIZADOS NA PÁGINA:",
                    itens.length
                );
            }
        }


        // ========================================================
        // BUSCAR ENDEREÇO
        // ========================================================

        const containerEndereco =
            document.getElementById(
                "conf-container-endereco"
            );


        if (
            containerEndereco &&
            pedido.endereco_id
        ) {

            console.log(
                "BUSCANDO ENDEREÇO:",
                pedido.endereco_id
            );


            const {
                data: endereco,
                error: erroEndereco
            } =
                await supabaseClient
                    .from("enderecos")
                    .select("*")
                    .eq(
                        "id",
                        pedido.endereco_id
                    )
                    .single();


            if (erroEndereco) {

                console.error(
                    "ERRO AO BUSCAR ENDEREÇO:",
                    erroEndereco
                );


                containerEndereco.innerHTML =
                    `
                    <p
                        style="
                            color:#64748b;
                            margin:0;
                        "
                    >
                        Não foi possível carregar o endereço.
                    </p>
                    `;


            } else if (endereco) {

                console.log(
                    "ENDEREÇO:",
                    endereco
                );


                const logradouro =
                    endereco.logradouro ||
                    endereco.rua ||
                    endereco.endereco ||
                    "";


                const numero =
                    endereco.numero ||
                    "";


                const complemento =
                    endereco.complemento ||
                    "";


                const bairro =
                    endereco.bairro ||
                    "";


                const cidade =
                    endereco.cidade ||
                    "";


                const estado =
                    endereco.estado ||
                    endereco.uf ||
                    "";


                const cep =
                    endereco.cep ||
                    "";


                containerEndereco.innerHTML =
                    `
                    <p
                        style="
                            margin:0;
                            font-weight:600;
                            color:#1e293b;
                        "
                    >
                        ${logradouro}
                        ${
                            numero
                                ? `, ${numero}`
                                : ""
                        }
                    </p>


                    ${
                        complemento
                            ? `
                            <p
                                style="
                                    margin:3px 0 0;
                                "
                            >
                                ${complemento}
                            </p>
                            `
                            : ""
                    }


                    ${
                        bairro
                            ? `
                            <p
                                style="
                                    margin:3px 0 0;
                                "
                            >
                                ${bairro}
                            </p>
                            `
                            : ""
                    }


                    ${
                        cidade
                            ? `
                            <p
                                style="
                                    margin:3px 0 0;
                                "
                            >
                                ${cidade}
                                ${
                                    estado
                                        ? ` - ${estado}`
                                        : ""
                                }
                            </p>
                            `
                            : ""
                    }


                    ${
                        cep
                            ? `
                            <p
                                style="
                                    margin:3px 0 0;
                                "
                            >
                                CEP: ${cep}
                            </p>
                            `
                            : ""
                    }
                    `;
            }


        } else if (containerEndereco) {

            containerEndereco.innerHTML =
                `
                <p
                    style="
                        color:#64748b;
                        margin:0;
                    "
                >
                    Endereço não informado.
                </p>
                `;
        }


        // ========================================================
        // ATUALIZAR STATUS
        // ========================================================

        atualizarStatusPedido(
            pedido
        );


        // ========================================================
        // SALVAR PEDIDO ATUALIZADO LOCALMENTE
        // ========================================================

        try {

            localStorage.setItem(
                "pedido_pix_atual",
                JSON.stringify(
                    pedido
                )
            );

        } catch (erro) {

            console.warn(
                "Não foi possível atualizar pedido local:",
                erro
            );
        }


        // ========================================================
        // FINAL
        // ========================================================

        console.log("==========================================");
        console.log("PEDIDO CONFIRMADO CARREGADO COM SUCESSO");
        console.log("==========================================");


    } catch (erro) {

        console.error("==========================================");
        console.error(
            "ERRO AO CARREGAR PEDIDO CONFIRMADO:",
            erro
        );
        console.error("==========================================");


        mostrarErroPedido(
            erro.message ||
            "Não foi possível carregar o pedido."
        );
    }

});


// ============================================================
// ATUALIZAR STATUS VISUAL
// ============================================================

function atualizarStatusPedido(
    pedido
) {

    const status =
        String(
            pedido?.status || ""
        ).toLowerCase();


    const statusPagamento =
        String(
            pedido?.status_pagamento || ""
        ).toLowerCase();


    console.log(
        "STATUS PEDIDO:",
        status
    );


    console.log(
        "STATUS PAGAMENTO:",
        statusPagamento
    );


    const passos =
        document.querySelectorAll(
            ".status-passo"
        );


    if (!passos.length) {

        return;
    }


    // ========================================================
    // PAGAMENTO APROVADO
    // ========================================================

    const pagamentoAprovado =
        [
            "aprovado",
            "aprovada",
            "approved",
            "pago",
            "paga"
        ].includes(
            statusPagamento
        );


    if (pagamentoAprovado) {

        passos[0]
            ?.classList
            .add(
                "concluido"
            );


        const hora =
            document.getElementById(
                "conf-hora-aprovado"
            );


        if (hora) {

            const dataPagamento =
                pedido.updated_at
                    ? new Date(
                        pedido.updated_at
                    )
                    : new Date();


            hora.textContent =
                dataPagamento.toLocaleString(
                    "pt-BR"
                );
        }
    }


    // ========================================================
    // EM SEPARAÇÃO
    // ========================================================

    const emSeparacao =
        [
            "em_separacao",
            "em separacao",
            "separando",
            "separação",
            "separacao"
        ].includes(
            status
        );


    if (emSeparacao) {

        passos[1]
            ?.classList
            .add(
                "concluido"
            );


        passos[1]
            ?.classList
            .remove(
                "ativo"
            );
    }


    // ========================================================
    // EM TRANSPORTE
    // ========================================================

    const emTransporte =
        [
            "enviado",
            "em_transporte",
            "em transporte",
            "transportando"
        ].includes(
            status
        );


    if (emTransporte) {

        passos[1]
            ?.classList
            .add(
                "concluido"
            );


        passos[1]
            ?.classList
            .remove(
                "ativo"
            );


        passos[2]
            ?.classList
            .add(
                "concluido"
            );
    }

}


// ============================================================
// MOSTRAR ERRO
// ============================================================

function mostrarErroPedido(
    mensagem
) {

    const containerEndereco =
        document.getElementById(
            "conf-container-endereco"
        );


    const listaItens =
        document.getElementById(
            "conf-lista-itens"
        );


    if (listaItens) {

        listaItens.innerHTML =
            `
            <p
                style="
                    color:#dc2626;
                    margin:0;
                "
            >
                ${mensagem}
            </p>
            `;
    }


    if (containerEndereco) {

        containerEndereco.innerHTML =
            `
            <p
                style="
                    color:#dc2626;
                    margin:0;
                "
            >
                ${mensagem}
            </p>
            `;
    }

}