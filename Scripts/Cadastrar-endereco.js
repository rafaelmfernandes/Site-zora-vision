// ============================================================
// ZORAVISION - CADASTRO DE ENDEREÇO
// Integração com Supabase
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

    const formCadEndereco =
        document.getElementById('form-cadastrar-endereco');

    const btnSalvar =
        document.querySelector(
            '.btn-salvar, button[type="submit"], #btn-salvar-endereco'
        );

    // ========================================================
    // FORMULÁRIO
    // ========================================================

    if (formCadEndereco) {

        formCadEndereco.addEventListener(
            'submit',
            async event => {

                event.preventDefault();

                await salvarEnderecoNoSupabase();
            }
        );

    } else if (btnSalvar) {

        btnSalvar.addEventListener(
            'click',
            async event => {

                event.preventDefault();

                await salvarEnderecoNoSupabase();
            }
        );
    }


    // ========================================================
    // CEP
    // ========================================================

    const inputCep =
        document.getElementById('cep');

    if (inputCep) {

        inputCep.addEventListener(
            'blur',
            async event => {

                const cepLimpo =
                    event.target.value.replace(
                        /\D/g,
                        ''
                    );

                if (cepLimpo.length === 8) {

                    await buscarCep(
                        cepLimpo
                    );
                }
            }
        );
    }
});


// ============================================================
// OBTER USUÁRIO LOGADO
// ============================================================

function obterUsuarioLogadoEndereco() {

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
            'Erro ao ler usuário logado:',
            erro
        );

        return null;
    }
}


// ============================================================
// OBTER CLIENTE SUPABASE
// ============================================================

function obterClienteSupabaseEndereco() {

    // Primeiro tenta o cliente global já criado
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


    // Fallback: tenta criar usando a biblioteca CDN
    if (
        window.supabase &&
        typeof window.supabase.createClient === 'function'
    ) {

        const SUPABASE_URL =
            'https://ratajxnxkjoiuknamacn.supabase.co';

        const SUPABASE_PUBLISHABLE_KEY =
            'sb_publishable_SD8dQdB4WQ-k_MdTPxU-lw_1j4cDD1L';

        try {

            const cliente =
                window.supabase.createClient(
                    SUPABASE_URL,
                    SUPABASE_PUBLISHABLE_KEY
                );

            window.supabaseClient =
                cliente;

            window._supabase =
                cliente;

            console.log(
                '✅ Cliente Supabase inicializado pelo fallback.'
            );

            return cliente;

        } catch (erro) {

            console.error(
                'Erro ao criar cliente Supabase:',
                erro
            );
        }
    }


    return null;
}


// ============================================================
// BUSCAR CEP PELO BOTÃO
// ============================================================

async function buscarCepCadastro() {

    const cepInput =
        document.getElementById('cep');

    if (!cepInput) {
        return;
    }

    const cepLimpo =
        cepInput.value.replace(
            /\D/g,
            ''
        );

    if (cepLimpo.length !== 8) {

        alert(
            'Digite um CEP válido com 8 números.'
        );

        return;
    }

    await buscarCep(
        cepLimpo
    );
}


// ============================================================
// BUSCAR CEP
// ============================================================

async function buscarCep(
    cep
) {

    const statusEl =
        document.getElementById(
            'cep-status'
        );

    try {

        if (statusEl) {

            statusEl.style.color =
                '#2563eb';

            statusEl.textContent =
                'Buscando CEP...';
        }


        const response =
            await fetch(
                `https://viacep.com.br/ws/${cep}/json/`
            );


        if (!response.ok) {

            throw new Error(
                'Não foi possível consultar o CEP.'
            );
        }


        const data =
            await response.json();


        if (data.erro) {

            if (statusEl) {

                statusEl.style.color =
                    '#ef4444';

                statusEl.textContent =
                    'CEP não encontrado.';
            }

            return;
        }


        const setVal =
            (
                id,
                valor
            ) => {

                const elemento =
                    document.getElementById(id);

                if (elemento) {

                    elemento.value =
                        valor || '';
                }
            };


        setVal(
            'rua',
            data.logradouro
        );

        setVal(
            'bairro',
            data.bairro
        );

        setVal(
            'cidade',
            data.localidade
        );

        setVal(
            'uf',
            data.uf
        );


        if (statusEl) {

            statusEl.style.color =
                '#16a34a';

            statusEl.textContent =
                'CEP encontrado!';
        }


        setTimeout(
            () => {

                if (statusEl) {

                    statusEl.textContent =
                        '';
                }

            },
            3000
        );


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


        if (statusEl) {

            statusEl.style.color =
                '#ef4444';

            statusEl.textContent =
                'Erro ao consultar CEP.';
        }
    }
}


// ============================================================
// SALVAR ENDEREÇO NO SUPABASE
// ============================================================

async function salvarEnderecoNoSupabase() {

    const usuario =
        obterUsuarioLogadoEndereco();


    // ========================================================
    // VERIFICAR LOGIN
    // ========================================================

    if (!usuario) {

        alert(
            'Você precisa estar logado para cadastrar um endereço.'
        );

        window.location.href =
            'Login.html';

        return;
    }


    // ========================================================
    // OBTER SUPABASE
    // ========================================================

    const clienteSupabase =
        obterClienteSupabaseEndereco();


    if (
        !clienteSupabase ||
        typeof clienteSupabase.from !== 'function'
    ) {

        console.error(
            'Supabase não foi inicializado corretamente.'
        );

        alert(
            'Erro de conexão com o banco de dados. Recarregue a página e tente novamente.'
        );

        return;
    }


    // ========================================================
    // LER CAMPOS
    // ========================================================

    const getVal =
        id => {

            const elemento =
                document.getElementById(id);

            return elemento
                ? elemento.value.trim()
                : '';
        };


    const tipoSelecionado =
        document.querySelector(
            'input[name="tipo_endereco"]:checked'
        )?.value ||
        'casa';


    const nomeDestinatario =
        getVal(
            'nome-destinatario'
        ) ||
        usuario.nome ||
        'Cliente';


    const cep =
        getVal('cep');


    const rua =
        getVal('rua');


    const numero =
        getVal('numero');


    const complemento =
        getVal('complemento');


    const bairro =
        getVal('bairro');


    const cidade =
        getVal('cidade');


    const estado =
        getVal('uf').toUpperCase();


    const referencia =
        getVal('referencia');


    const ehPrincipal =
        document.getElementById(
            'chk-principal'
        )?.checked || false;


    // ========================================================
    // VALIDAR CAMPOS
    // ========================================================

    if (
        !cep ||
        !rua ||
        !numero ||
        !bairro ||
        !cidade ||
        !estado
    ) {

        alert(
            'Preencha todos os campos obrigatórios do endereço.'
        );

        return;
    }


    // ========================================================
    // VALIDAR UF
    // ========================================================

    if (
        estado.length !== 2
    ) {

        alert(
            'Informe uma UF válida com 2 letras.'
        );

        return;
    }


    // ========================================================
    // PREPARAR DADOS DO SUPABASE
    // ========================================================

    const novoEndereco = {

        cliente_id:
            usuario.id,

        nome_destinatario:
            nomeDestinatario,

        cep:
            cep,

        rua:
            rua,

        numero:
            numero,

        complemento:
            complemento ||
            null,

        bairro:
            bairro,

        cidade:
            cidade,

        estado:
            estado,

        principal:
            ehPrincipal
    };


    console.log(
        '📍 Salvando endereço:',
        novoEndereco
    );


    // ========================================================
    // DESABILITAR BOTÃO
    // ========================================================

    const btnSalvar =
        document.querySelector(
            '.btn-salvar'
        );


    if (btnSalvar) {

        btnSalvar.disabled =
            true;

        btnSalvar.textContent =
            'Salvando...';

        btnSalvar.style.opacity =
            '0.7';
    }


    try {

        // ====================================================
        // SE FOR PRINCIPAL, DESMARCAR OS OUTROS
        // ====================================================

        if (ehPrincipal) {

            const {
                error: erroAtualizacao
            } =
                await clienteSupabase
                    .from('enderecos')
                    .update({
                        principal: false
                    })
                    .eq(
                        'cliente_id',
                        usuario.id
                    );


            if (erroAtualizacao) {

                console.error(
                    'Erro ao atualizar endereços anteriores:',
                    erroAtualizacao
                );

                throw erroAtualizacao;
            }
        }


        // ====================================================
        // INSERIR ENDEREÇO
        // ====================================================

        const {
            data,
            error
        } =
            await clienteSupabase
                .from('enderecos')
                .insert([
                    novoEndereco
                ])
                .select()
                .single();


        if (error) {

            console.error(
                'Erro retornado pelo Supabase:',
                error
            );

            throw error;
        }


        console.log(
            '✅ Endereço salvo com sucesso:',
            data
        );


        // ====================================================
        // SALVAR LOCALMENTE
        // ====================================================

        const chaveLocal =
            'ultimo_endereco_cliente_' +
            usuario.email
                .toLowerCase();


        localStorage.setItem(
            chaveLocal,
            JSON.stringify({

                nome:
                    nomeDestinatario,

                cep:
                    cep,

                rua:
                    rua,

                numero:
                    numero,

                complemento:
                    complemento,

                bairro:
                    bairro,

                cidade:
                    cidade,

                uf:
                    estado,

                principal:
                    ehPrincipal,

                tipo:
                    tipoSelecionado,

                referencia:
                    referencia,

                id:
                    data.id

            })
        );


        // ====================================================
        // SUCESSO
        // ====================================================

        alert(
            'Endereço cadastrado com sucesso!'
        );


        window.location.href =
            'Endereços.html';


    } catch (erro) {

        console.error(
            '❌ Erro ao salvar endereço:',
            erro
        );


        alert(
            'Não foi possível salvar o endereço.\n\n' +
            (
                erro?.message ||
                'Verifique sua conexão com o banco de dados.'
            )
        );


        if (btnSalvar) {

            btnSalvar.disabled =
                false;

            btnSalvar.textContent =
                'Salvar Endereço';

            btnSalvar.style.opacity =
                '1';
        }
    }
}