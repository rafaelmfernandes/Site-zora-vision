// ==========================================
// CONFIGURAÇÃO DO SUPABASE
// ==========================================

const SUPABASE_URL = "https://ratajxnxkjoiuknamacn.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_SD8dQdB4WQ-k_MdTPxU-lw_1j4cDD1L";


// Cria a conexão com o Supabase
const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);


// ==========================================
// TESTE DE CONEXÃO
// ==========================================

async function testarConexaoSupabase() {
    try {
        const { data, error } = await supabaseClient
            .from("produtos")
            .select("*")
            .limit(1);

        if (error) {
            console.error("Erro ao conectar ao Supabase:", error);
            return false;
        }

        console.log("✅ Supabase conectado com sucesso!");
        console.log("Dados recebidos:", data);

        return true;

    } catch (erro) {
        console.error("Erro inesperado:", erro);
        return false;
    }
}

testarConexaoSupabase();