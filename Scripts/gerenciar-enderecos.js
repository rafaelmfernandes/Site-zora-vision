// ============================================================
// ZORAVISION - GERENCIAMENTO DE ENDEREÇOS
// Supabase + usuário logado
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {

    console.log('📍 Página de endereços iniciada.');

    const usuario = obterUsuarioLogadoEndereco();

    if (!usuario) {
        alert('Faça login para acessar seus endereços.');
        window.location.href = 'Login.html';
        return;
    }

    const supabase = obterSupabaseEndereco();

    if (!supabase) {
        console.error(
            '❌ Supabase não foi inicializado corretamente.'
        );

        alert(
            'Erro de conexão com o banco de dados. Recarregue a página e tente novamente.'
        );

        return;
    }

    await carregarEnderecos();
});


// ============================================================
// OBTER USUÁRIO LOGADO
// ============================================================

function obterUsuarioLogadoEndereco() {

    try {

        const usuario = JSON.parse(
            localStorage.getItem('usuario_logado')
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
            'Erro ao ler usuário logado:',
            erro
        );

        return null;
    }
}


// ============================================================
// OBTER SUPABASE
// ============================================================

function obterSupabaseEndereco() {

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
        window.supabase &&
        typeof window.supabase.createClient === 'function'
    ) {

        try {

            const cliente =
                window.supabase.createClient(
                    'https://ratajxnxkjoiuknamacn.supabase.co',
                    'sb_publishable_SD8dQdB4WQ-k_MdTPxU-lw_1j4cDD1L'
                );

            window.supabaseClient = cliente;
            window._supabase = cliente;

            return cliente;

        } catch (erro) {

            console.error(
                'Erro ao inicializar Supabase:',
                erro
            );
        }
    }

    return null;
}


// ============================================================
// CARREGAR ENDEREÇOS
// ============================================================

async function carregarEnderecos() {

    const container =
        document.getElementById(
            'lista-enderecos-container'
        );

    if (!container) {
        console.error(
            'Container de endereços não encontrado.'
        );
        return;
    }

    const usuario =
        obterUsuarioLogadoEndereco();

    if (!usuario) {
        window.location.href = 'Login.html';
        return;
    }

    const supabase =
        obterSupabaseEndereco();

    if (!supabase) {
        return;
    }

    container.innerHTML = `
        <div style="
            text-align:center;
            padding:30px;
            color:#64748b;
        ">
            Carregando seus endereços...
        </div>
    `;

    try {

        const {
            data: enderecos,
            error
        } = await supabase
            .from('enderecos')
            .select(`
                id,
                cliente_id,
                nome_destinatario,
                cep,
                rua,
                numero,
                complemento,
                bairro,
                cidade,
                estado,
                principal,
                created_at
            `)
            .eq(
                'cliente_id',
                usuario.id
            )
            .order(
                'principal',
                {
                    ascending: false
                }
            )
            .order(
                'created_at',
                {
                    ascending: false
                }
            );

        if (error) {

            console.error(
                '❌ Erro ao buscar endereços:',
                error
            );

            container.innerHTML = `
                <div style="
                    text-align:center;
                    padding:30px;
                    color:#ef4444;
                ">
                    Não foi possível carregar seus endereços.
                </div>
            `;

            return;
        }

        if (
            !enderecos ||
            enderecos.length === 0
        ) {

            container.innerHTML = `
                <div style="
                    text-align:center;
                    padding:30px 20px;
                    color:#64748b;
                    background:#fff;
                    border:1px dashed #cbd5e1;
                    border-radius:12px;
                ">
                    <div style="
                        font-size:36px;
                        margin-bottom:10px;
                    ">
                        📍
                    </div>

                    <p style="
                        margin:0 0 6px;
                        font-weight:600;
                        color:#334155;
                    ">
                        Nenhum endereço cadastrado
                    </p>

                    <small>
                        Adicione um endereço para realizar suas compras.
                    </small>
                </div>
            `;

            return;
        }

        container.innerHTML =
            enderecos.map(
                endereco => {

                    const principal =
                        endereco.principal === true;

                    return `
                        <label
                            class="endereco-item ${principal ? 'ativo' : ''}"
                            style="
                                display:flex;
                                gap:12px;
                                cursor:pointer;
                                padding:14px;
                                margin-bottom:12px;
                                border:1px solid ${
                                    principal
                                        ? '#93c5fd'
                                        : '#e2e8f0'
                                };
                                border-radius:12px;
                                background:${
                                    principal
                                        ? '#eff6ff'
                                        : '#ffffff'
                                };
                            "
                        >

                            <input
                                type="radio"
                                name="endereco_selecionado"
                                value="${endereco.id}"
                                ${principal ? 'checked' : ''}
                                data-endereco-id="${endereco.id}"
                                style="margin-top:4px;"
                            >

                            <div
                                class="endereco-info"
                                style="width:100%;"
                            >

                                <div
                                    style="
                                        display:flex;
                                        gap:8px;
                                        align-items:center;
                                        margin-bottom:7px;
                                        flex-wrap:wrap;
                                    "
                                >

                                    <span
                                        style="
                                            background:#dbeafe;
                                            color:#1d4ed8;
                                            padding:3px 8px;
                                            border-radius:5px;
                                            font-size:11px;
                                            font-weight:700;
                                        "
                                    >
                                        Entrega
                                    </span>

                                    ${
                                        principal
                                            ? `
                                                <span
                                                    style="
                                                        background:#dcfce7;
                                                        color:#166534;
                                                        padding:3px 8px;
                                                        border-radius:5px;
                                                        font-size:11px;
                                                        font-weight:700;
                                                    "
                                                >
                                                    Principal
                                                </span>
                                            `
                                            : ''
                                    }

                                </div>

                                <p
                                    style="
                                        margin:0 0 5px;
                                        font-weight:700;
                                        color:#1e293b;
                                    "
                                >
                                    ${escapeHtml(
                                        endereco.nome_destinatario ||
                                        usuario.nome ||
                                        ''
                                    )}
                                </p>

                                <p
                                    style="
                                        margin:0 0 3px;
                                        color:#475569;
                                        font-size:13px;
                                    "
                                >
                                    ${escapeHtml(
                                        endereco.rua || ''
                                    )},
                                    nº
                                    ${escapeHtml(
                                        endereco.numero || ''
                                    )}

                                    ${
                                        endereco.complemento
                                            ? ` - ${escapeHtml(
                                                endereco.complemento
                                            )}`
                                            : ''
                                    }
                                </p>

                                <p
                                    style="
                                        margin:0 0 3px;
                                        color:#475569;
                                        font-size:13px;
                                    "
                                >
                                    ${escapeHtml(
                                        endereco.bairro || ''
                                    )}
                                    -
                                    ${escapeHtml(
                                        endereco.cidade || ''
                                    )}/${escapeHtml(
                                        endereco.estado || ''
                                    )}
                                </p>

                                <p
                                    style="
                                        margin:0 0 10px;
                                        color:#2563eb;
                                        font-size:13px;
                                        font-weight:700;
                                    "
                                >
                                    CEP:
                                    ${escapeHtml(
                                        endereco.cep || ''
                                    )}
                                </p>

                                <div
                                    style="
                                        display:flex;
                                        gap:15px;
                                        border-top:1px solid #e2e8f0;
                                        padding-top:9px;
                                    "
                                >

                                    <button
                                        type="button"
                                        onclick="editarEndereco('${endereco.id}')"
                                        style="
                                            border:0;
                                            background:none;
                                            color:#2563eb;
                                            cursor:pointer;
                                            padding:0;
                                            font-weight:600;
                                            font-size:13px;
                                        "
                                    >
                                        Editar
                                    </button>

                                    <button
                                        type="button"
                                        onclick="excluirEndereco('${endereco.id}')"
                                        style="
                                            border:0;
                                            background:none;
                                            color:#dc2626;
                                            cursor:pointer;
                                            padding:0;
                                            font-weight:600;
                                            font-size:13px;
                                        "
                                    >
                                        Excluir
                                    </button>

                                </div>

                            </div>

                        </label>
                    `;

                }
            ).join('');

        console.log(
            `✅ ${enderecos.length} endereço(s) carregado(s).`
        );

    } catch (erro) {

        console.error(
            '❌ Erro inesperado ao carregar endereços:',
            erro
        );

        container.innerHTML = `
            <div style="
                text-align:center;
                padding:30px;
                color:#ef4444;
            ">
                Ocorreu um erro ao carregar seus endereços.
            </div>
        `;
    }
}


// ============================================================
// ESCOLHER ENDEREÇO
// ============================================================

async function confirmarSelecaoEndereco() {

    const usuario =
        obterUsuarioLogadoEndereco();

    if (!usuario) {

        alert(
            'Faça login para continuar.'
        );

        window.location.href =
            'Login.html';

        return;
    }

    const selecionado =
        document.querySelector(
            'input[name="endereco_selecionado"]:checked'
        );

    if (!selecionado) {

        alert(
            'Selecione um endereço antes de continuar.'
        );

        return;
    }

    const supabase =
        obterSupabaseEndereco();

    if (!supabase) {
        return;
    }

    const enderecoId =
        selecionado.value;

    try {

        const {
            data: endereco,
            error
        } = await supabase
            .from('enderecos')
            .select('*')
            .eq(
                'id',
                enderecoId
            )
            .eq(
                'cliente_id',
                usuario.id
            )
            .single();

        if (error) {
            throw error;
        }

        localStorage.setItem(
            'ultimo_endereco_cliente_' +
            usuario.email.toLowerCase(),
            JSON.stringify({

                id:
                    endereco.id,

                nome:
                    endereco.nome_destinatario,

                cep:
                    endereco.cep,

                rua:
                    endereco.rua,

                numero:
                    endereco.numero,

                complemento:
                    endereco.complemento || '',

                bairro:
                    endereco.bairro,

                cidade:
                    endereco.cidade,

                uf:
                    endereco.estado,

                principal:
                    endereco.principal

            })
        );

        window.history.back();

    } catch (erro) {

        console.error(
            'Erro ao selecionar endereço:',
            erro
        );

        alert(
            'Não foi possível selecionar o endereço.'
        );
    }
}


// ============================================================
// EDITAR ENDEREÇO
// ============================================================

function editarEndereco(id) {

    localStorage.setItem(
        'endereco_edicao_id',
        id
    );

    window.location.href =
        'Cadastrar-endereço.html?editar=' +
        encodeURIComponent(id);
}


// ============================================================
// EXCLUIR ENDEREÇO
// ============================================================

async function excluirEndereco(id) {

    if (
        !confirm(
            'Deseja realmente excluir este endereço?'
        )
    ) {
        return;
    }

    const usuario =
        obterUsuarioLogadoEndereco();

    const supabase =
        obterSupabaseEndereco();

    if (!usuario || !supabase) {
        return;
    }

    try {

        const {
            error
        } = await supabase
            .from('enderecos')
            .delete()
            .eq(
                'id',
                id
            )
            .eq(
                'cliente_id',
                usuario.id
            );

        if (error) {
            throw error;
        }

        localStorage.removeItem(
            'ultimo_endereco_cliente_' +
            usuario.email.toLowerCase()
        );

        await carregarEnderecos();

    } catch (erro) {

        console.error(
            'Erro ao excluir endereço:',
            erro
        );

        alert(
            'Não foi possível excluir o endereço.'
        );
    }
}


// ============================================================
// COMPATIBILIDADE COM CÓDIGO ANTIGO
// ============================================================

function excluirEnderecoSalvo() {

    const selecionado =
        document.querySelector(
            'input[name="endereco_selecionado"]:checked'
        );

    if (!selecionado) {

        alert(
            'Selecione um endereço antes de excluir.'
        );

        return;
    }

    excluirEndereco(
        selecionado.value
    );
}


// ============================================================
// ESCAPAR HTML
// ============================================================

function escapeHtml(valor) {

    return String(valor ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}