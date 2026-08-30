const SUPABASE_URL = 'https://ratajxnxkjoiuknamacn.supabase.co';

const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_SD8dQdB4WQ-k_MdTPxU-lw_1j4cDD1L';

console.log('TESTE 1 - supabase.js iniciou');

console.log('TESTE 2 - window.supabase:', window.supabase);

console.log('TESTE 3 - createClient:', window.supabase?.createClient);

window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

console.log('TESTE 4 - cliente criado:', window.supabaseClient);

window._supabase = window.supabaseClient;

window.obterSupabase = function () {
return window.supabaseClient;
};

console.log('TESTE 5 - Supabase pronto');
