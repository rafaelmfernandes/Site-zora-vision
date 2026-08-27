
// ============================================================
// ZORAVISION - CLIENTE SUPABASE
// Conexão central com o banco de dados
// ============================================================

const SUPABASE_URL = 'https://ratajxnxkjoiuknamacn.supabase.co';

const SUPABASE_KEY =
    'sb_publishable_SD8dQdB4WQ-k_MdTPxU-lw_1j4cDD1L';


// ============================================================
// CRIAR CLIENTE SUPABASE
// ============================================================

const supabaseClient =
    supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


// ============================================================
// DISPONIBILIZAR GLOBALMENTE
// ============================================================

window.supabaseClient = supabaseClient;


console.log('✅ Supabase conectado com sucesso.');

