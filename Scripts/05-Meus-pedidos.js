
// ============================================================
// ZORA VISION - MEUS PEDIDOS
// ============================================================
// Busca os pedidos diretamente do Supabase.
// Tabelas utilizadas:
// pedidos
// itens_pedido
// clientes
// enderecos
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
    carregarMeusPedidos();
});


// ============================================================
// ÍCONES SVG
// ============================================================

function svgIcone(paths, tamanho = 18) {
    return `
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            style="width:${tamanho}px;height:${tamanho}px;"
        >
            ${paths}
        </svg>
    `;
}


const ICONE_CHECK = svgIcone(`
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
`);

const ICONE_PACOTE = svgIcone(`
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
    <line x1="12" y1="22.08" x2="12" y2="12"></line>
`);

const ICONE_CAMINHAO = svgIcone(`
    <rect x="1" y="3" width="15" height="13"></rect>
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
    <circle cx="5.5" cy="18.5" r="2.5"></circle>
    <circle cx="18.5" cy="18.5" r="2.5"></circle>
`);

const ICONE_CASA = svgIcone(`
    <path d="M3 10.5 12 3l9 7.5"></path>
    <path d="M5 9.5V21h14V9.5"></path>
`);


// ============================================================
// FUNÇÃO PRINCIPAL
// ============================================================

async function carregarMeusPedidos() {

    console.log("==========================================");
    console.log("MEUS-PEDIDOS.JS INICIADO");
    console.log("==========================================");

    const containerPedidos =
        document.getElementById("container-meus-pedidos");

    if (!containerPedidos) {
        console.error(
            "Container #container-meus-pedidos não encontrado."
        );
        return;
    }


    // ========================================================
    // VERIFICAR SUPABASE
    // ========================================================

    if (!window.supabaseClient) {

        containerPedidos.innerHTML = `
            <div style="
                text-align:center;
                padding:3rem 1rem;
                color:#dc2626;
            ">
                <p>
                    Supabase não foi carregado.
                </p>
            </div>
        `;

        console.error(
            "window.supabaseClient não encontrado."
        );

        return;
    }


    const supabaseClient =
        window.supabaseClient;


    // ========================================================
    // VERIFICAR USUÁRIO LOGADO
    // ========================================================

    let usuarioLogado = null;

    try {

        usuarioLogado =
            JSON.parse(
                localStorage.getItem("usuario_logado")
            );

    } catch (erro) {

        console.error(
            "Erro ao ler usuario_logado:",
            erro
        );
    }


    if (
        !usuarioLogado ||
        !usuarioLogado.email
    ) {

        containerPedidos.innerHTML = `
            <div style="
                text-align:center;
                padding:3rem 1rem;
                color:#64748b;
            ">

                <p style="
                    font-size:1.1rem;
                    margin-bottom:0.5rem;
                ">
                    Faça login para ver seus pedidos. 🔒
                </p>

                <a
                    href="Login.html"
                    style="
                        color:#2563eb;
                        font-weight:600;
                        text-decoration:none;
                    "
                >
                    Entrar na minha conta
                </a>

            </div>
        `;

        return;
    }


    console.log(
        "USUÁRIO LOGADO:",
        usuarioLogado
    );


    // ========================================================
    // BUSCAR CLIENTE PELO EMAIL
    // ========================================================

    const {
        data: cliente,
        error: erroCliente
    } = await supabaseClient
        .from("clientes")
        .select(`
            id,
            nome,
            email,
            auth_user_id
        `)
        .eq(
            "email",
            usuarioLogado.email
        )
        .maybeSingle();


    if (erroCliente) {

        console.error(
            "ERRO AO BUSCAR CLIENTE:",
            erroCliente
        );

        mostrarErro(
            containerPedidos,
            "Não foi possível localizar sua conta."
        );

        return;
    }


    if (!cliente) {

        console.error(
            "CLIENTE NÃO ENCONTRADO."
        );

        mostrarErro(
            containerPedidos,
            "Cliente não encontrado no sistema."
        );

        return;
    }


    console.log(
        "CLIENTE ENCONTRADO:",
        cliente
    );


    // ========================================================
    // BUSCAR PEDIDOS DO CLIENTE
    // ========================================================

    const {
        data: pedidos,
        error: erroPedidos
    } = await supabaseClient
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
            created_at,
            updated_at
        `)
        .eq(
            "cliente_id",
            cliente.id
        )
        .order(
            "created_at",
            {
                ascending: false
            }
        );


    if (erroPedidos) {

        console.error(
            "ERRO AO BUSCAR PEDIDOS:",
            erroPedidos
        );

        mostrarErro(
            containerPedidos,
            "Não foi possível carregar seus pedidos."
        );

        return;
    }


    console.log(
        "PEDIDOS ENCONTRADOS:",
        pedidos
    );


    // ========================================================
    // NENHUM PEDIDO
    // ========================================================

    if (
        !pedidos ||
        pedidos.length === 0
    ) {

        containerPedidos.innerHTML = `
            <div style="
                text-align:center;
                padding:3rem 1rem;
                color:#64748b;
            ">

                <p style="
                    font-size:1.1rem;
                    margin-bottom:0.5rem;
                ">
                    Você ainda não fez nenhum pedido. 🛒
                </p>

                <p style="
                    font-size:0.85rem;
                ">
                    Seus pedidos aparecerão aqui.
                </p>

            </div>
        `;

        return;
    }


    // ========================================================
    // LIMPAR CONTAINER
    // ========================================================

    containerPedidos.innerHTML = "";


    // ========================================================
    // PROCESSAR PEDIDOS
    // ========================================================

    for (const pedido of pedidos) {

        // Buscar itens do pedido
        const {
            data: itens,
            error: erroItens
        } = await supabaseClient
            .from("itens_pedido")
            .select(`
                id,
                pedido_id,
                produto_id,
                nome_produto,
                quantidade,
                preco_unitario,
                subtotal
            `)
            .eq(
                "pedido_id",
                pedido.id
            );


        if (erroItens) {

            console.error(
                "ERRO AO BUSCAR ITENS DO PEDIDO:",
                pedido.id,
                erroItens
            );

        }


        // Buscar endereço
        let endereco = null;


        if (pedido.endereco_id) {

            const resultadoEndereco =
                await supabaseClient
                    .from("enderecos")
                    .select(`
                        id,
                        nome_destinatario,
                        cep,
                        rua,
                        numero,
                        complemento,
                        bairro,
                        cidade,
                        estado,
                        principal
                    `)
                    .eq(
                        "id",
                        pedido.endereco_id
                    )
                    .maybeSingle();


            if (
                !resultadoEndereco.error
            ) {

                endereco =
                    resultadoEndereco.data;

            }
        }


        const card =
            criarCardPedido(
                pedido,
                itens || [],
                endereco
            );


        containerPedidos.appendChild(
            card
        );
    }


    console.log(
        "=========================================="
    );

    console.log(
        "MEUS PEDIDOS CARREGADOS COM SUCESSO"
    );

    console.log(
        "=========================================="
    );
}


// ============================================================
// CRIAR CARD DO PEDIDO
// ============================================================

function criarCardPedido(
    pedido,
    itens,
    endereco
) {

    const card =
        document.createElement("div");

    card.className =
        "pedido-card";


    // ========================================================
    // DADOS BÁSICOS
    // ========================================================

    const numeroPedido =
        pedido.numero_pedido
            ? `#${String(
                pedido.numero_pedido
            ).replace("#", "")}`
            : "#-";


    const dataPedido =
        pedido.created_at
            ? new Date(
                pedido.created_at
            ).toLocaleDateString(
                "pt-BR"
            )
            : "--/--/----";


    const total =
        Number(
            pedido.total || 0
        );


    const subtotal =
        Number(
            pedido.subtotal || 0
        );


    const frete =
        Number(
            pedido.frete || 0
        );


    const desconto =
        Number(
            pedido.desconto || 0
        );


    const formaPagamento =
        pedido.forma_pagamento
            ? pedido.forma_pagamento.toUpperCase()
            : "PIX";


    const status =
        String(
            pedido.status || ""
        ).toLowerCase();


    const statusPagamento =
        String(
            pedido.status_pagamento || ""
        ).toLowerCase();


    // ========================================================
    // STATUS
    // ========================================================

    const cancelado =
        [
            "cancelado",
            "cancelada"
        ].includes(status);


    const entregue =
        [
            "entregue",
            "concluido",
            "concluído"
        ].includes(status);


    const transporte =
        [
            "enviado",
            "em_transporte",
            "em transporte",
            "transportando",
            "a caminho"
        ].includes(status);


    const separacao =
        [
            "confirmado",
            "em_separacao",
            "em separacao",
            "separando",
            "separação",
            "separacao",
            "pendente"
        ].includes(status);


    // ========================================================
    // BADGE
    // ========================================================

    let textoStatus =
        "PENDENTE";

    let estiloBadge =
        "background:#f1f5f9;color:#64748b;";


    if (cancelado) {

        textoStatus =
            "CANCELADO";

        estiloBadge =
            "background:#fee2e2;color:#991b1b;";

    } else if (entregue) {

        textoStatus =
            "ENTREGUE";

        estiloBadge =
            "background:#dcfce7;color:#166534;";

    } else if (transporte) {

        textoStatus =
            "EM TRÂNSITO";

        estiloBadge =
            "background:#e0f2fe;color:#0369a1;";

    } else if (separacao) {

        textoStatus =
            "EM SEPARAÇÃO";

        estiloBadge =
            "background:#ffedd5;color:#c2410c;";

    }


    // ========================================================
    // ITENS
    // ========================================================

    let itensHtml = "";


    if (
        itens &&
        itens.length > 0
    ) {

        itens.forEach(
            item => {

                const quantidade =
                    Number(
                        item.quantidade || 1
                    );


                const preco =
                    Number(
                        item.preco_unitario || 0
                    );


                const subtotalItem =
                    Number(
                        item.subtotal ||
                        quantidade * preco
                    );


                itensHtml += `
                    <div style="
                        display:flex;
                        justify-content:space-between;
                        gap:12px;
                        padding:10px 0;
                        border-bottom:1px solid #f1f5f9;
                    ">

                        <div style="
                            flex:1;
                        ">

                            <div style="
                                font-size:0.9rem;
                                font-weight:700;
                                color:#0f172a;
                            ">
                                ${quantidade}x
                                ${item.nome_produto || "Produto"}
                            </div>

                            <div style="
                                font-size:0.75rem;
                                color:#64748b;
                                margin-top:3px;
                            ">
                                ${formatarMoeda(preco)}
                                por unidade
                            </div>

                        </div>

                        <strong style="
                            font-size:0.9rem;
                            color:#0f172a;
                            white-space:nowrap;
                        ">
                            ${formatarMoeda(subtotalItem)}
                        </strong>

                    </div>
                `;
            }
        );

    } else {

        itensHtml = `
            <div style="
                padding:10px 0;
                color:#64748b;
                font-size:0.85rem;
            ">
                Nenhum item encontrado.
            </div>
        `;
    }


    // ========================================================
    // ENDEREÇO
    // ========================================================

    let enderecoHtml =
        "Endereço não informado.";


    if (endereco) {

        enderecoHtml = `
            <strong>
                ${endereco.nome_destinatario || ""}
            </strong>

            <br>

            ${endereco.rua || ""}
            ${endereco.numero ? `, ${endereco.numero}` : ""}

            ${
                endereco.complemento
                    ? ` - ${endereco.complemento}`
                    : ""
            }

            <br>

            ${endereco.bairro || ""}

            <br>

            ${endereco.cidade || ""}
            ${
                endereco.estado
                    ? ` - ${endereco.estado}`
                    : ""
            }

            ${
                endereco.cep
                    ? `<br>CEP: ${endereco.cep}`
                    : ""
            }
        `;
    }


    // ========================================================
    // LINHA DO TEMPO
    // ========================================================

    const aprovado =
        statusPagamento === "aprovado" ||
        statusPagamento === "aprovada" ||
        statusPagamento === "approved" ||
        statusPagamento === "pago" ||
        statusPagamento === "paga";


    const estiloPasso =
        concluido =>
            concluido
                ? "background:#2563eb;color:#ffffff;"
                : "background:#f1f5f9;color:#94a3b8;";


    const corPasso =
        concluido =>
            concluido
                ? "#2563eb"
                : "#94a3b8";


    const separacaoConcluida =
        separacao ||
        transporte ||
        entregue;


    const transporteConcluido =
        transporte ||
        entregue;


    const entregueConcluido =
        entregue;


    // ========================================================
    // CANCELAMENTO
    // ========================================================

    const podeCancelar =
        !cancelado &&
        (
            status === "pendente" ||
            status === "confirmado" ||
            status === "em_separacao" ||
            status === "em separacao" ||
            status === "separando"
        );


    // ========================================================
    // HTML DO CARD
    // ========================================================

    card.style.cssText = `
        background:#ffffff;
        border:1px solid #e2e8f0;
        border-radius:16px;
        padding:1.25rem;
        margin-bottom:1.25rem;
        box-shadow:0 4px 6px -1px rgba(0,0,0,0.03);
    `;


    card.innerHTML = `

        <!-- CABEÇALHO -->

        <div style="
            display:flex;
            justify-content:space-between;
            align-items:flex-start;
            gap:10px;
            margin-bottom:1rem;
        ">

            <div>

                <span style="
                    font-weight:700;
                    color:#0f172a;
                    font-size:1.1rem;
                    display:block;
                ">
                    ${numeroPedido}
                </span>

                <span style="
                    font-size:0.8rem;
                    color:#64748b;
                ">
                    Realizado em ${dataPedido}
                </span>

            </div>

            <span style="
                ${estiloBadge}
                padding:5px 12px;
                border-radius:20px;
                font-size:0.72rem;
                font-weight:800;
                white-space:nowrap;
            ">
                ${textoStatus}
            </span>

        </div>


        <!-- ITENS -->

        <div style="
            margin-bottom:1rem;
        ">

            <h3 style="
                font-size:0.9rem;
                color:#0f172a;
                margin:0 0 5px;
            ">
                📦 Itens do pedido
            </h3>

            ${itensHtml}

        </div>


        <!-- RESUMO FINANCEIRO -->

        <div style="
            background:#f8fafc;
            border-radius:12px;
            padding:12px;
            margin-bottom:1rem;
        ">

            <div style="
                display:flex;
                justify-content:space-between;
                font-size:0.82rem;
                color:#64748b;
                margin-bottom:6px;
            ">
                <span>Subtotal</span>
                <span>${formatarMoeda(subtotal)}</span>
            </div>

            <div style="
                display:flex;
                justify-content:space-between;
                font-size:0.82rem;
                color:#64748b;
                margin-bottom:6px;
            ">
                <span>Frete</span>
                <span>
                    ${
                        frete > 0
                            ? formatarMoeda(frete)
                            : "Grátis"
                    }
                </span>
            </div>

            ${
                desconto > 0
                    ? `
                        <div style="
                            display:flex;
                            justify-content:space-between;
                            font-size:0.82rem;
                            color:#16a34a;
                            margin-bottom:6px;
                        ">
                            <span>Desconto</span>
                            <span>
                                - ${formatarMoeda(desconto)}
                            </span>
                        </div>
                    `
                    : ""
            }

            <div style="
                border-top:1px solid #e2e8f0;
                margin-top:8px;
                padding-top:8px;
                display:flex;
                justify-content:space-between;
                align-items:center;
            ">

                <strong style="
                    color:#0f172a;
                    font-size:0.9rem;
                ">
                    Total Pago
                </strong>

                <strong style="
                    color:#2563eb;
                    font-size:1.15rem;
                ">
                    ${formatarMoeda(total)}
                </strong>

            </div>

        </div>


        <!-- PAGAMENTO -->

        <div style="
            display:flex;
            justify-content:space-between;
            align-items:center;
            padding-bottom:1rem;
            margin-bottom:1rem;
            border-bottom:1px solid #f1f5f9;
        ">

            <span style="
                font-size:0.8rem;
                color:#64748b;
            ">
                Forma de pagamento
            </span>

            <strong style="
                font-size:0.82rem;
                color:#0f172a;
            ">
                ${formaPagamento}
            </strong>

        </div>


        ${
            !cancelado
                ? `

                    <!-- LINHA DO TEMPO -->

                    <div style="
                        display:flex;
                        justify-content:space-between;
                        align-items:flex-start;
                        margin-bottom:1.25rem;
                        text-align:center;
                    ">

                        <div style="
                            display:flex;
                            flex-direction:column;
                            align-items:center;
                            flex:1;
                        ">

                            <div style="
                                width:36px;
                                height:36px;
                                ${estiloPasso(aprovado)}
                                border-radius:50%;
                                display:flex;
                                align-items:center;
                                justify-content:center;
                                margin-bottom:5px;
                            ">
                                ${ICONE_CHECK}
                            </div>

                            <span style="
                                font-size:0.7rem;
                                font-weight:700;
                                color:${corPasso(aprovado)};
                            ">
                                Aprovado
                            </span>

                        </div>


                        <div style="
                            display:flex;
                            flex-direction:column;
                            align-items:center;
                            flex:1;
                        ">

                            <div style="
                                width:36px;
                                height:36px;
                                ${estiloPasso(separacaoConcluida)}
                                border-radius:50%;
                                display:flex;
                                align-items:center;
                                justify-content:center;
                                margin-bottom:5px;
                            ">
                                ${ICONE_PACOTE}
                            </div>

                            <span style="
                                font-size:0.7rem;
                                font-weight:700;
                                color:${corPasso(separacaoConcluida)};
                            ">
                                Separação
                            </span>

                        </div>


                        <div style="
                            display:flex;
                            flex-direction:column;
                            align-items:center;
                            flex:1;
                        ">

                            <div style="
                                width:36px;
                                height:36px;
                                ${estiloPasso(transporteConcluido)}
                                border-radius:50%;
                                display:flex;
                                align-items:center;
                                justify-content:center;
                                margin-bottom:5px;
                            ">
                                ${ICONE_CAMINHAO}
                            </div>

                            <span style="
                                font-size:0.7rem;
                                font-weight:700;
                                color:${corPasso(transporteConcluido)};
                            ">
                                Trânsito
                            </span>

                        </div>


                        <div style="
                            display:flex;
                            flex-direction:column;
                            align-items:center;
                            flex:1;
                        ">

                            <div style="
                                width:36px;
                                height:36px;
                                ${estiloPasso(entregueConcluido)}
                                border-radius:50%;
                                display:flex;
                                align-items:center;
                                justify-content:center;
                                margin-bottom:5px;
                            ">
                                ${ICONE_CASA}
                            </div>

                            <span style="
                                font-size:0.7rem;
                                font-weight:700;
                                color:${corPasso(entregueConcluido)};
                            ">
                                Entregue
                            </span>

                        </div>

                    </div>

                `
                : `
                    <div style="
                        text-align:center;
                        color:#991b1b;
                        font-size:0.85rem;
                        font-weight:600;
                        padding:10px;
                        background:#fee2e2;
                        border-radius:10px;
                        margin-bottom:1rem;
                    ">
                        Este pedido foi cancelado.
                    </div>
                `
        }


        <!-- ENDEREÇO -->

        <div style="
            background:#f8fafc;
            border-radius:12px;
            padding:12px;
            margin-bottom:1rem;
        ">

            <div style="
                display:flex;
                gap:7px;
                align-items:center;
                margin-bottom:6px;
            ">

                <span>
                    ${ICONE_CASA}
                </span>

                <strong style="
                    font-size:0.85rem;
                    color:#0f172a;
                ">
                    Endereço de entrega
                </strong>

            </div>

            <div style="
                font-size:0.8rem;
                color:#475569;
                line-height:1.5;
            ">
                ${enderecoHtml}
            </div>

        </div>


        <!-- RODAPÉ -->

        <div style="
            display:flex;
            justify-content:flex-end;
            align-items:center;
            padding-top:0.25rem;
        ">

            ${
                podeCancelar
                    ? `
                        <button
                            type="button"
                            onclick="cancelarMeuPedido('${pedido.id}')"
                            style="
                                background:#fee2e2;
                                color:#dc2626;
                                border:1px solid #fca5a5;
                                padding:8px 16px;
                                border-radius:20px;
                                cursor:pointer;
                                font-size:0.8rem;
                                font-weight:700;
                            "
                        >
                            Cancelar Pedido
                        </button>
                    `
                    : cancelado
                        ? `
                            <span style="
                                font-size:0.75rem;
                                color:#991b1b;
                                font-weight:600;
                            ">
                                Pedido cancelado
                            </span>
                        `
                        : `
                            <span style="
                                font-size:0.75rem;
                                color:#64748b;
                            ">
                                Pedido em processamento
                            </span>
                        `
            }

        </div>

    `;


    return card;
}


// ============================================================
// FORMATAR MOEDA
// ============================================================

function formatarMoeda(valor) {

    return Number(
        valor || 0
    ).toLocaleString(
        "pt-BR",
        {
            style:"currency",
            currency:"BRL"
        }
    );
}


// ============================================================
// CANCELAR PEDIDO
// ============================================================

async function cancelarMeuPedido(
    idPedido
) {

    const confirmar =
        confirm(
            "Deseja realmente cancelar este pedido?"
        );


    if (!confirmar) {
        return;
    }


    if (!window.supabaseClient) {

        alert(
            "Supabase não está disponível."
        );

        return;
    }


    const supabaseClient =
        window.supabaseClient;


    // ========================================================
    // VERIFICAR USUÁRIO
    // ========================================================

    let usuarioLogado = null;

    try {

        usuarioLogado =
            JSON.parse(
                localStorage.getItem(
                    "usuario_logado"
                )
            );

    } catch (erro) {

        console.error(erro);
    }


    if (
        !usuarioLogado ||
        !usuarioLogado.email
    ) {

        alert(
            "Faça login novamente."
        );

        return;
    }


    // ========================================================
    // BUSCAR CLIENTE
    // ========================================================

    const {
        data: cliente,
        error: erroCliente
    } = await supabaseClient
        .from("clientes")
        .select("id")
        .eq(
            "email",
            usuarioLogado.email
        )
        .maybeSingle();


    if (
        erroCliente ||
        !cliente
    ) {

        alert(
            "Não foi possível identificar sua conta."
        );

        return;
    }


    // ========================================================
    // ATUALIZAR PEDIDO
    // ========================================================

    const {
        data,
        error
    } = await supabaseClient
        .from("pedidos")
        .update({
            status:"cancelado",
            updated_at:new Date().toISOString()
        })
        .eq(
            "id",
            idPedido
        )
        .eq(
            "cliente_id",
            cliente.id
        )
        .select()
        .maybeSingle();


    if (error) {

        console.error(
            "ERRO AO CANCELAR PEDIDO:",
            error
        );

        alert(
            "Não foi possível cancelar o pedido."
        );

        return;
    }


    if (!data) {

        alert(
            "Pedido não encontrado ou você não possui permissão para cancelá-lo."
        );

        return;
    }


    alert(
        "Pedido cancelado com sucesso."
    );


    // Recarregar pedidos
    carregarMeusPedidos();
}


// ============================================================
// MOSTRAR ERRO
// ============================================================

function mostrarErro(
    container,
    mensagem
) {

    container.innerHTML = `
        <div style="
            text-align:center;
            padding:3rem 1rem;
            color:#dc2626;
        ">

            <p style="
                font-size:1rem;
                font-weight:600;
            ">
                ${mensagem}
            </p>

        </div>
    `;
}
