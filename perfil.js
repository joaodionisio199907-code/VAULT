// CONFIG SUPABASE
const SUPABASE_URL = 'https://ettjrnpfgbcgwflmgcjv.supabase.co';
const SUPABASE_KEY = 'sb_publishable_sIyzTHGZX1o4B39cjE7_Aw_WdZ2w5Px';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null;

window.addEventListener("load", async () => {
    lucide.createIcons();
    
    // 1. Obtener usuario actual
    const { data: { user }, error } = await _supabase.auth.getUser();

    if (!user) {
        window.location.href = "index.html";
        return;
    }

    currentUser = user;

    // 2. Actualizar Interfaz
    const username = user.email.split('@')[0].toUpperCase();
    document.getElementById('display-name').innerText = username;
    document.getElementById('display-email').innerText = user.email.toLowerCase();
    document.getElementById('user-avatar').src = `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`;

    // 3. Cargar los juegos publicados en el Studio
    loadUserGames();
});

// GESTIÓN DE PESTAÑAS
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('active', 'bg-[#76ff03]', 'text-black');
        b.classList.add('bg-white/5', 'text-white');
    });

    document.getElementById(`tab-${tabId}`).classList.remove('hidden');
    const activeBtn = document.getElementById(`btn-${tabId}`);
    activeBtn.classList.add('active', 'bg-[#76ff03]', 'text-black');
    activeBtn.classList.remove('bg-white/5', 'text-white');
    
    lucide.createIcons();
}

// CARGAR JUEGOS PUBLICADOS POR EL USUARIO (En Dev Studio)
async function loadUserGames() {
    const grid = document.getElementById('my-published-games-grid'); // Cambiado al nuevo ID
    const counter = document.getElementById('count-releases');

    const { data: games, error } = await _supabase
        .from('games')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error cargando juegos:", error);
        return;
    }

    if (games && games.length > 0) {
        grid.innerHTML = ''; 
        counter.innerText = games.length;

        games.forEach(game => {
            grid.innerHTML += `
            <div class="bg-[#0d0d0d] border border-white/5 rounded-[2.5rem] overflow-hidden group hover:border-[#76ff03]/40 transition-all duration-500">
                <div class="h-40 overflow-hidden relative">
                    <img src="${game.image_url}" class="w-full h-full object-cover opacity-50 group-hover:opacity-100 group-hover:scale-110 transition duration-700">
                    <div class="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-transparent to-transparent"></div>
                </div>
                <div class="p-8 -mt-6 relative z-10">
                    <h4 class="font-black uppercase italic text-lg tracking-tighter">${game.title}</h4>
                    <p class="text-[9px] text-gray-500 uppercase font-bold tracking-[2px] mb-4">${game.category || 'Indie'}</p>
                    <div class="flex justify-between items-center">
                        <span class="text-xl font-black text-white">${game.price}€</span>
                        <div class="flex gap-2">
                             <button onclick="deleteGame('${game.id}')" class="p-3 bg-white/5 rounded-xl hover:bg-red-500 transition-all text-red-500 hover:text-white">
                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                             </button>
                        </div>
                    </div>
                </div>
            </div>`;
        });
        lucide.createIcons();
    } else {
        grid.innerHTML = `
            <div class="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
                <p class="text-gray-600 italic">You haven't published any games in your studio yet.</p>
            </div>`;
        counter.innerText = "0";
    }
}

// PUBLICAR JUEGO
async function handlePublish() {
    const title = document.getElementById('game-title').value;
    const category = document.getElementById('game-category').value;
    const price = document.getElementById('game-price').value;
    const description = document.getElementById('game-desc').value;
    const image_url = document.getElementById('game-img').value;

    if(!title || !price || !image_url) {
        alert("⚠️ Completa los campos obligatorios.");
        return;
    }

    const { data, error } = await _supabase.from('games').insert([
        { 
            title: title, 
            price: parseFloat(price), 
            category: category, 
            image_url: image_url, 
            banner_url: image_url, 
            description: description, 
            status: 'verified',
            user_id: currentUser.id 
        }
    ]);

    if(error) {
        alert("❌ Error: " + error.message);
    } else {
        alert("🚀 ¡Juego enviado al Vault!");
        loadUserGames(); // Recargar la lista sin salir de la página
        // Limpiar campos
        document.getElementById('game-title').value = '';
        document.getElementById('game-price').value = '';
        document.getElementById('game-img').value = '';
        document.getElementById('game-desc').value = '';
    }
}

// BORRAR JUEGO
async function deleteGame(gameId) {
    if(!confirm("¿Eliminar este juego definitivamente?")) return;
    const { error } = await _supabase.from('games').delete().eq('id', gameId);
    if(error) alert("Error: " + error.message);
    else loadUserGames();
}

// CERRAR SESIÓN
async function handleSignOut() {
    await _supabase.auth.signOut();
    window.location.href = "index.html";
}
