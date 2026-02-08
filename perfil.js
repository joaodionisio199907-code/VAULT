const SUPABASE_URL = 'https://ettjrnpfgbcgwflmgcjv.supabase.co';
const SUPABASE_KEY = 'sb_publishable_sIyzTHGZX1o4B39cjE7_Aw_WdZ2w5Px';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null;

window.addEventListener("load", async () => {
    lucide.createIcons();
    
    // 1. Obtener usuario con sesión persistente
    const { data: { session }, error: sessionError } = await _supabase.auth.getSession();
    
    if (sessionError || !session) {
        window.location.href = "index.html";
        return;
    }

    currentUser = session.user;
    console.log("✅ Conectado como:", currentUser.email, "ID:", currentUser.id);

    // 2. Interfaz
    const username = currentUser.email.split('@')[0].toUpperCase();
    document.getElementById('display-name').innerText = username;
    document.getElementById('display-email').innerText = currentUser.email.toLowerCase();
    document.getElementById('user-avatar').src = `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`;

    loadUserGames();
});

async function loadUserGames() {
    const grid = document.getElementById('my-published-games-grid');
    const counter = document.getElementById('count-releases');

    // Forzamos la espera de currentUser si fuera necesario
    if (!currentUser) return;

    const { data: games, error } = await _supabase
        .from('games')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("❌ Error Supabase:", error.message);
        return;
    }

    console.log("🔍 Juegos encontrados para este ID:", games.length);

    if (games && games.length > 0) {
        grid.innerHTML = ''; 
        counter.innerText = games.length;
        games.forEach(game => {
            grid.innerHTML += `
            <div class="bg-[#0d0d0d] border border-white/5 rounded-[2.5rem] overflow-hidden group hover:border-[#76ff03]/40 transition-all duration-500">
                <div class="h-40 overflow-hidden relative">
                    <img src="${game.image_url}" class="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition duration-700">
                </div>
                <div class="p-8 relative z-10">
                    <h4 class="font-black uppercase italic text-lg tracking-tighter">${game.title}</h4>
                    <div class="flex justify-between items-center mt-4">
                        <span class="text-xl font-black text-white">${game.price}€</span>
                        <button onclick="deleteGame('${game.id}')" class="p-3 bg-white/5 rounded-xl hover:bg-red-500 transition-all text-red-500 hover:text-white">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
            </div>`;
        });
        lucide.createIcons();
    } else {
        grid.innerHTML = `<div class="col-span-full py-10 text-center opacity-50 italic">Aún no has publicado nada.</div>`;
        counter.innerText = "0";
    }
}

async function handlePublish() {
    if (!currentUser) {
        alert("Error: Usuario no identificado. Recarga la página.");
        return;
    }

    const title = document.getElementById('game-title').value;
    const price = document.getElementById('game-price').value;
    const image_url = document.getElementById('game-img').value;

    if(!title || !price || !image_url) {
        alert("⚠️ Completa los campos obligatorios.");
        return;
    }

    const gameData = { 
        title: title, 
        price: parseFloat(price), 
        category: document.getElementById('game-category').value, 
        image_url: image_url, 
        banner_url: image_url, 
        description: document.getElementById('game-desc').value, 
        status: 'verified',
        user_id: currentUser.id // ASIGNACIÓN EXPLÍCITA
    };

    const { error } = await _supabase.from('games').insert([gameData]);

    if(error) {
        alert("❌ Error: " + error.message);
    } else {
        alert("🚀 ¡Publicado!");
        location.reload(); // Recarga total para asegurar que el estado se refresque
    }
}
