// ============================================================
// ZORAVISION - CONFIGURAÇÃO DO SUPABASE
// ============================================================

const SUPABASE_URL =
    'https://ratajxnxkjoiuknamacn.supabase.co';

const SUPABASE_PUBLISHABLE_KEY =
    'sb_publishable_SD8dQdB4WQ-k_MdTPxU-lw_1j4cDD1L';


// ============================================================
// CLIENTE SUPABASE
// ============================================================

const supabaseClient =
    supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );


// ============================================================
// DISPONIBILIZAR GLOBALMENTE
// ============================================================

window.supabaseClient =
    supabaseClient;

window._supabase =
    supabaseClient;


// ============================================================
// FUNÇÃO PARA OBTER O SUPABASE
// ============================================================

function obterSupabase() {

    if (window.supabaseClient) {
        return window.supabaseClient;
    }

    console.error(
        'Supabase não está disponível.'
    );

    return null;
}


// ============================================================
// TESTAR CONEXÃO
// ============================================================

async function testarConexaoSupabase() {

    try {

        const { data, error } =
            await supabaseClient
                .from('produtos')
                .select('id')
                .limit(1);


        if (error) {

            console.error(
                'Erro ao conectar ao Supabase:',
                error
            );

            return false;
        }


        console.log(
            '✅ Supabase conectado com sucesso!'
        );


        console.log(
            'Dados recebidos:',
            data
        );


        return true;

    } catch (erro) {

        console.error(
            'Erro inesperado ao testar Supabase:',
            erro
        );

        return false;
    }
}


// ============================================================
// EXPORTAÇÕES GLOBAIS
// ============================================================

window.obterSupabase =
    obterSupabase;

window.testarConexaoSupabase =
    testarConexaoSupabase;


// ============================================================
// INICIAR TESTE
// ============================================================

testarConexaoSupabase();