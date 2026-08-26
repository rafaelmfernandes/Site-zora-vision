
// ============================================================
// ZORAVISION - GERENCIAMENTO DE ENDEREÇOS
// ============================================================
// Responsabilidades:
// - Listar endereços do cliente
// - Cadastrar endereço
// - Buscar CEP
// - Excluir endereço
// - Selecionar endereço
// - Definir endereço principal
// ============================================================


// ============================================================
// 1. SUPABASE
// ============================================================

function obterSupabaseEndereco() {

    if (window.supabaseClient) {
        return window.supabaseClient;
    }

    console.error(
        'Supabase não está disponível.'
    );

    return null;
}


// ============================================================
// 2. USUÁRIO LOGADO
// ============================================================

function obterUsuarioEndereco() {

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
            'Erro ao obter usuário:',
            erro
        );

        return null;
    }
}


// ============================================================
// 3. CHAVE DO ENDEREÇO NO LOCALSTORAGE
// ============================================================

function chaveEnderecoCliente() {

    const usuario =
        obterUsuarioEndereco();

    if (
        usuario &&
        usuario.email
    ) {

        return (
            'ultimo_endereco_cliente_' +
            usuario.email
                .trim()
                .toLowerCase()
        );
    }

    return 'ultimo_endereco_cliente';
}


// ============================================================
// 4. OBTER CLIENTE NO SUPABASE
// ============================================================

async function buscarClienteEndereco() {

    const supabase =
        obterSupabaseEndereco();

    const usuario =
        obterUsuarioEndereco();

    if (
        !supabase ||
        !usuario
    ) {
        return null;
    }

    try {

        const {
            data,
            error
        } =
            await supabase
                .from('clientes')
                .select('*')
                .eq(
                    'auth_user_id',
                    usuario.id
                )
                .maybeSingle();

        if (error) {

            console.error(
                'Erro ao buscar cliente:',
                error
            );

            return null;
        }

        return data || null;

    } catch (erro) {

        console.error(
            'Erro inesperado ao buscar cliente:',
            erro
        );

        return null;
    }
}


// ============================================================
// 5. BUSCAR CEP
// ============================================================

async function buscarCepCadastro() {

    const input =
        document.getElementById(
            'cep'
        );

    const status =
        document.getElementById(
            'cep-status'
        );

    if (!input) {
        return;
    }

    const cep =
        input.value.replace(
            /\D/g,
            ''
        );

    if (cep.length !== 8) {

        if (status) {

            status.style.color =
                '#ef4444';

            status.textContent =
                'Digite um CEP válido com 8 números.';
        }

        return;
    }

    try {

        if (status) {

            status.style.color =
                '#2563eb';

            status.textContent =
                'Buscando endereço...';
        }

        const resposta =
            await fetch(
                `https://viacep.com.br/ws/${cep}/json/`
            );

        if (!resposta.ok) {

            throw new Error(
                'Falha ao consultar o CEP.'
            );
        }

        const dados =
            await resposta.json();

        if (dados.erro) {

            if (status) {

                status.style.color =
                    '#ef4444';

                status.textContent =
                    'CEP não encontrado.';
            }

            return;
        }

        const rua =
            document.getElementById(
                'rua'
            );

        const bairro =
            document.getElementById(
                'bairro'
            );

        const cidade =
            document.getElementById(
                'cidade'
            );

        const uf =
            document.getElementById(
                'uf'
            );

        if (rua) {
            rua.value =
                dados.logradouro || '';
        }

        if (bairro) {
            bairro.value =
                dados.bairro || '';
        }

        if (cidade) {
            cidade.value =
                dados.localidade || '';
        }

        if (uf) {
            uf.value =
                dados.uf || '';
        }

        if (status) {

            status.style.color =
                '#10b981';

            status.textContent =
                'Endereço localizado!';
        }

        const numero =
            document.getElementById(
                'numero'
            );

        if (numero) {
            numero.focus();
        }

    } catch (erro) {

        console.error(
            'Erro ao buscar CEP:',
            erro
        );

        if (status) {

            status.style.color =
                '#ef4444';

            status.textContent =
                'Erro ao consultar CEP.';
        }
    }
}


// ============================================================
// 6. SALVAR ENDEREÇO LOCALMENTE
// ============================================================

function salvarEnderecoLocal(endereco) {

    try {

        localStorage.setItem(
            chaveEnderecoCliente(),
            JSON.stringify(
                endereco
            )
        );

    } catch (erro) {

        console.error(
            'Erro ao salvar endereço local:',
            erro
        );
    }
}


// ============================================================
// 7. CARREGAR ENDEREÇO LOCAL
// ============================================================

function carregarEnderecoLocal() {

    try {

        const endereco =
            JSON.parse(
                localStorage.getItem(
                    chaveEnderecoCliente()
                )
            );

        if (
            endereco &&
            endereco.rua
        ) {
            return endereco;
        }

        return null;

    } catch (erro) {

        console.error(
            'Erro ao carregar endereço local:',
            erro
        );

        return null;
    }
}


// ============================================================
// 8. CADASTRAR ENDEREÇO
// ============================================================

function carregarDadosFormularioEndereco() {

    const usuario =
        obterUsuarioEndereco();

    if (!usuario) {

        alert(
            'Você precisa estar logado para cadastrar um endereço.'
        );

        window.location.href =
            'Login.html';

        return;
    }

    const form =
        document.getElementById(
            'form-cadastrar-endereco'
        );

    const cep =
        document.getElementById(
            'cep'
        );

    if (cep) {

        cep.addEventListener(
            'input',
            event => {

                const valor =
                    event.target.value
                        .replace(
                            /\D/g,
                            ''
                        );

                if (
                    valor.length === 8
                ) {

                    buscarCepCadastro();
                }
            }
        );
    }

    if (!form) {
        return;
    }

    form.addEventListener(
        'submit',
        async event => {

            event.preventDefault();

            try {

                const usuarioAtual =
                    obterUsuarioEndereco();

                if (
                    !usuarioAtual ||
                    !usuarioAtual.id
                ) {

                    alert(
                        'Você precisa estar logado para cadastrar um endereço.'
                    );

                    return;
                }

                const endereco = {

                    nome:
                        document
                            .getElementById(
                                'nome-destinatario'
                            )
                            ?.value
                            .trim() || '',

                    cep:
                        document
                            .getElementById(
                                'cep'
                            )
                            ?.value
                            .trim() || '',

                    rua:
                        document
                            .getElementById(
                                'rua'
                            )
                            ?.value
                            .trim() || '',

                    numero:
                        document
                            .getElementById(
                                'numero'
                            )
                            ?.value
                            .trim() || '',

                    complemento:
                        document
                            .getElementById(
                                'complemento'
                            )
                            ?.value
                            .trim() || '',

                    bairro:
                        document
                            .getElementById(
                                'bairro'
                            )
                            ?.value
                            .trim() || '',

                    cidade:
                        document
                            .getElementById(
                                'cidade'
                            )
                            ?.value
                            .trim() || '',

                    uf:
                        document
                            .getElementById(
                                'uf'
                            )
                            ?.value
                            .trim()
                            .toUpperCase() || ''
                };

                if (
                    !endereco.nome ||
                    !endereco.cep ||
                    !endereco.rua ||
                    !endereco.numero ||
                    !endereco.bairro ||
                    !endereco.cidade ||
                    !endereco.uf
                ) {

                    alert(
                        'Preencha todos os campos obrigatórios.'
                    );

                    return;
                }

                const supabase =
                    obterSupabaseEndereco();

                if (!supabase) {

                    alert(
                        'Erro de conexão com o banco de dados.'
                    );

                    return;
                }

                const cliente =
                    await buscarClienteEndereco();

                if (
                    !cliente ||
                    !cliente.id
                ) {

                    alert(
                        'Cliente não encontrado no sistema.'
                    );

                    return;
                }

                // ------------------------------------------------
                // Remove o status de principal dos endereços
                // anteriores.
                // ------------------------------------------------

                const {
                    error: erroPrincipal
                } =
                    await supabase
                        .from('enderecos')
                        .update({
                            principal: false
                        })
                        .eq(
                            'cliente_id',
                            cliente.id
                        );

                if (erroPrincipal) {

                    console.error(
                        'Erro ao atualizar endereços anteriores:',
                        erroPrincipal
                    );

                    throw new Error(
                        'Não foi possível atualizar o endereço principal.'
                    );
                }

                // ------------------------------------------------
                // Insere o novo endereço.
                // ------------------------------------------------

                const dadosSupabase = {

                    cliente_id:
                        cliente.id,

                    nome_destinatario:
                        endereco.nome,

                    cep:
                        endereco.cep,

                    rua:
                        endereco.rua,

                    numero:
                        endereco.numero,

                    complemento:
                        endereco.complemento ||
                        null,

                    bairro:
                        endereco.bairro,

                    cidade:
                        endereco.cidade,

                    estado:
                        endereco.uf,

                    principal:
                        true
                };

                const {
                    data,
                    error
                } =
                    await supabase
                        .from('enderecos')
                        .insert(
                            dadosSupabase
                        )
                        .select()
                        .single();

                if (error) {

                    console.error(
                        'Erro ao salvar endereço:',
                        error
                    );

                    throw new Error(
                        'Não foi possível salvar o endereço.'
                    );
                }

                console.log(
                    'Endereço salvo no Supabase:',
                    data
                );

                salvarEnderecoLocal(
                    endereco
                );

                alert(
                    'Endereço salvo com sucesso!'
                );

                window.location.href =
                    'Endereços.html';

            } catch (erro) {

                console.error(
                    'Erro ao cadastrar endereço:',
                    erro
                );

                alert(
                    erro.message ||
                    'Ocorreu um erro ao salvar o endereço.'
                );
            }
        }
    );
}


// ============================================================
// 9. CARREGAR PÁGINA DE ENDEREÇOS
// ============================================================

async function carregarPaginaEnderecos() {

    const usuario =
        obterUsuarioEndereco();

    if (!usuario) {

        alert(
            'Você precisa estar logado para acessar seus endereços.'
        );

        window.location.href =
            'Login.html';

        return;
    }

    const supabase =
        obterSupabaseEndereco();

    if (!supabase) {
        return;
    }

    const cliente =
        await buscarClienteEndereco();

    if (
        !cliente ||
        !cliente.id
    ) {

        console.error(
            'Cliente não encontrado.'
        );

        return;
    }

    try {

        const {
            data: enderecos,
            error
        } =
            await supabase
                .from('enderecos')
                .select('*')
                .eq(
                    'cliente_id',
                    cliente.id
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
                'Erro ao carregar endereços:',
                error
            );

            return;
        }

        renderizarEnderecos(
            enderecos || []
        );

    } catch (erro) {

        console.error(
            'Erro ao consultar endereços:',
            erro
        );
    }
}


// ============================================================
// 10. RENDERIZAR ENDEREÇOS
// ============================================================

function renderizarEnderecos(
    enderecos
) {

    const container =
        document.getElementById(
            'lista-enderecos'
        );

    if (!container) {
        return;
    }

    if (
        !enderecos ||
        enderecos.length === 0
    ) {

        container.innerHTML = `
            <div class="sem-enderecos">
                <p>Você ainda não possui endereços cadastrados.</p>
            </div>
        `;

        return;
    }

    container.innerHTML =
        enderecos
            .map(
                endereco => {

                    const principal =
                        endereco.principal === true;

                    return `
                        <div
                            class="card-endereco"
                            data-endereco-id="${endereco.id}"
                        >

                            <div class="card-endereco-topo">

                                <strong>
                                    ${endereco.nome_destinatario || ''}
                                </strong>

                                ${
                                    principal
                                        ? `
                                            <span class="endereco-principal">
                                                Principal
                                            </span>
                                        `
                                        : ''
                                }

                            </div>

                            <p>
                                ${endereco.rua || ''}
                                ${
                                    endereco.numero
                                        ? `, nº ${endereco.numero}`
                                        : ''
                                }
                            </p>

                            ${
                                endereco.complemento
                                    ? `
                                        <p>
                                            ${endereco.complemento}
                                        </p>
                                    `
                                    : ''
                            }

                            <p>
                                ${endereco.bairro || ''}
                                -
                                ${endereco.cidade || ''}
                                /
                                ${
                                    endereco.estado
                                        ? endereco.estado.toUpperCase()
                                        : ''
                                }
                            </p>

                            <p>
                                CEP:
                                ${endereco.cep || ''}
                            </p>

                            <div class="acoes-endereco">

                                ${
                                    !principal
                                        ? `
                                            <button
                                                type="button"
                                                onclick="definirEnderecoPrincipal('${endereco.id}')"
                                            >
                                                Usar como principal
                                            </button>
                                        `
                                        : ''
                                }

                                <button
                                    type="button"
                                    onclick="selecionarEndereco('${endereco.id}')"
                                >
                                    Selecionar
                                </button>

                                <button
                                    type="button"
                                    onclick="excluirEndereco('${endereco.id}')"
                                >
                                    Excluir
                                </button>

                            </div>

                        </div>
                    `;
                }
            )
            .join('');
}


// ============================================================
// 11. DEFINIR ENDEREÇO PRINCIPAL
// ============================================================

async function definirEnderecoPrincipal(
    enderecoId
) {

    const usuario =
        obterUsuarioEndereco();

    if (!usuario) {
        return;
    }

    const supabase =
        obterSupabaseEndereco();

    const cliente =
        await buscarClienteEndereco();

    if (
        !supabase ||
        !cliente
    ) {
        return;
    }

    try {

        const {
            error: erroReset
        } =
            await supabase
                .from('enderecos')
                .update({
                    principal: false
                })
                .eq(
                    'cliente_id',
                    cliente.id
                );

        if (erroReset) {
            throw erroReset;
        }

        const {
            data,
            error
        } =
            await supabase
                .from('enderecos')
                .update({
                    principal: true
                })
                .eq(
                    'id',
                    enderecoId
                )
                .eq(
                    'cliente_id',
                    cliente.id
                )
                .select()
                .single();

        if (error) {
            throw error;
        }

        if (data) {

            salvarEnderecoLocal({
                nome:
                    data.nome_destinatario,

                cep:
                    data.cep,

                rua:
                    data.rua,

                numero:
                    data.numero,

                complemento:
                    data.complemento || '',

                bairro:
                    data.bairro,

                cidade:
                    data.cidade,

                uf:
                    data.estado
            });
        }

        await carregarPaginaEnderecos();

    } catch (erro) {

        console.error(
            'Erro ao definir endereço principal:',
            erro
        );

        alert(
            'Não foi possível definir o endereço principal.'
        );
    }
}


// ============================================================
// 12. SELECIONAR ENDEREÇO
// ============================================================

async function selecionarEndereco(
    enderecoId
) {

    const supabase =
        obterSupabaseEndereco();

    const cliente =
        await buscarClienteEndereco();

    if (
        !supabase ||
        !cliente
    ) {
        return;
    }

    try {

        const {
            data,
            error
        } =
            await supabase
                .from('enderecos')
                .select('*')
                .eq(
                    'id',
                    enderecoId
                )
                .eq(
                    'cliente_id',
                    cliente.id
                )
                .single();

        if (error) {
            throw error;
        }

        if (!data) {
            return;
        }

        const endereco = {

            nome:
                data.nome_destinatario,

            cep:
                data.cep,

            rua:
                data.rua,

            numero:
                data.numero,

            complemento:
                data.complemento || '',

            bairro:
                data.bairro,

            cidade:
                data.cidade,

            uf:
                data.estado
        };

        salvarEnderecoLocal(
            endereco
        );

        window.history.back();

    } catch (erro) {

        console.error(
            'Erro ao selecionar endereço:',
            erro
        );

        alert(
            'Não foi possível selecionar este endereço.'
        );
    }
}


// ============================================================
// 13. EXCLUIR ENDEREÇO
// ============================================================

async function excluirEndereco(
    enderecoId
) {

    if (
        !confirm(
            'Deseja realmente remover este endereço?'
        )
    ) {
        return;
    }

    const usuario =
        obterUsuarioEndereco();

    if (!usuario) {
        return;
    }

    const supabase =
        obterSupabaseEndereco();

    const cliente =
        await buscarClienteEndereco();

    if (
        !supabase ||
        !cliente
    ) {
        return;
    }

    try {

        const {
            data: endereco,
            error: erroBusca
        } =
            await supabase
                .from('enderecos')
                .select('*')
                .eq(
                    'id',
                    enderecoId
                )
                .eq(
                    'cliente_id',
                    cliente.id
                )
                .single();

        if (erroBusca) {
            throw erroBusca;
        }

        const {
            error
        } =
            await supabase
                .from('enderecos')
                .delete()
                .eq(
                    'id',
                    enderecoId
                )
                .eq(
                    'cliente_id',
                    cliente.id
                );

        if (error) {
            throw error;
        }

        const enderecoAtual =
            carregarEnderecoLocal();

        if (
            enderecoAtual &&
            endereco &&
            enderecoAtual.cep === endereco.cep
        ) {

            localStorage.removeItem(
                chaveEnderecoCliente()
            );
        }

        await carregarPaginaEnderecos();

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
// 14. COMPATIBILIDADE COM FUNÇÃO ANTIGA
// ============================================================

async function excluirEnderecoSalvo() {

    const endereco =
        carregarEnderecoLocal();

    if (!endereco) {

        alert(
            'Nenhum endereço salvo encontrado.'
        );

        return;
    }

    const supabase =
        obterSupabaseEndereco();

    const cliente =
        await buscarClienteEndereco();

    if (
        !supabase ||
        !cliente
    ) {
        return;
    }

    try {

        const {
            error
        } =
            await supabase
                .from('enderecos')
                .delete()
                .eq(
                    'cliente_id',
                    cliente.id
                )
                .eq(
                    'cep',
                    endereco.cep
                );

        if (error) {
            throw error;
        }

        localStorage.removeItem(
            chaveEnderecoCliente()
        );

        await carregarPaginaEnderecos();

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
// 15. CONFIRMAR SELEÇÃO
// ============================================================

function confirmarSelecaoEndereco() {

    const usuario =
        obterUsuarioEndereco();

    if (!usuario) {

        alert(
            'Faça login para continuar.'
        );

        window.location.href =
            'Login.html';

        return;
    }

    const endereco =
        carregarEnderecoLocal();

    if (
        !endereco ||
        !endereco.rua
    ) {

        alert(
            'Cadastre ou selecione um endereço antes de continuar.'
        );

        return;
    }

    window.history.back();
}


// ============================================================
// 16. INICIALIZAÇÃO
// ============================================================

document.addEventListener(
    'DOMContentLoaded',
    () => {

        const pagina =
            decodeURIComponent(
                window.location.pathname
            ).toLowerCase();

        // -----------------------------------------------
        // Página de cadastro de endereço
        // -----------------------------------------------

        if (
            pagina.includes('cadastrar') &&
            pagina.includes('endere')
        ) {

            carregarDadosFormularioEndereco();

            return;
        }

        // -----------------------------------------------
        // Página de endereços
        // -----------------------------------------------

        if (
            pagina.includes('endere')
        ) {

            carregarPaginaEnderecos();
        }
    }
);


// ============================================================
// 17. EXPORTAÇÕES GLOBAIS
// ============================================================

window.buscarCepCadastro =
    buscarCepCadastro;

window.carregarDadosFormularioEndereco =
    carregarDadosFormularioEndereco;

window.carregarPaginaEnderecos =
    carregarPaginaEnderecos;

window.definirEnderecoPrincipal =
    definirEnderecoPrincipal;

window.selecionarEndereco =
    selecionarEndereco;

window.excluirEndereco =
    excluirEndereco;

window.excluirEnderecoSalvo =
    excluirEnderecoSalvo;

window.confirmarSelecaoEndereco =
    confirmarSelecaoEndereco;
