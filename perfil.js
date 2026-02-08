// CONFIG SUPABASE
const SUPABASE_URL = 'https://ettjrnpfgbcgwflmgcjv.supabase.co';
const SUPABASE_KEY = 'sb_publishable_sIyzTHGZX1o4B39cjE7_Aw_WdZ2w5Px';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Variables globales para el usuario
let currentUser = null;

window.addEventListener("load", async () => {
    lucide.createIcons();
    
    // 1. Obtener usuario actual
    const { data: { user }, error } = await _supabase.auth.getUser();

    if (!user) {
        // Si no hay sesión, mandamos al index
        window.location.href = "index.html";
        return;
    }

    currentUser = user;

    // 2. Actualizar Interfaz con datos del usuario
    const username = user.email.split('@')[0].toUpperCase();
    document.getElementById('display-name').innerText = username;
    document.getElementById('display-email').innerText = user.email.toLowerCase();
    
    // Generar un avatar robótico basado en su nombre
    document.getElementById('user-avatar').src = `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`;

    // 3. Cargar los juegos que ha publicado este usuario
    loadUserGames();
});

// GESTIÓN DE PESTAÑAS (Dashboard vs Dev Studio)
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

// CARGAR JUEGOS DEL USUARIO
async function loadUserGames() {
    const grid = document.getElementById('my-games-grid');
    const counter = document.getElementById('count-releases');

    // Buscamos en la tabla games los que pertenecen al ID del usuario actual
    const { data: games, error } = await _supabase
        .from('games')
        .select('*')
        .eq('user_id', currentUser.id) // Filtro por dueño
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error cargando juegos:", error);
        return;
    }

    if (games && games.length > 0) {
        grid.innerHTML = ''; // Limpiar el mensaje de "No games found"
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
    }
}

// PUBLICAR JUEGO (Con subida de imagen real al Storage)
async function handlePublish() {
    // Obtenemos los valores
    const title = document.getElementById('game-title').value;
    const category = document.getElementById('game-category').value;
    const price = document.getElementById('game-price').value;
    const description = document.getElementById('game-desc').value;
    
    // Aquí usamos el input de texto por ahora, pero si quieres usar archivos,
    // asegúrate de que el input en tu HTML sea type="text" o type="file".
    // Siguiendo tu HTML, es un input de texto para URL directa:
    const image_url = document.getElementById('game-img').value;

    if(!title || !price || !image_url) {
        alert("⚠️ Completa los campos obligatorios: Título, Precio e Imagen.");
        return;
    }

    // Insertar en la tabla 'games'
    const { data, error } = await _supabase.from('games').insert([
        { 
            title: title, 
            price: parseFloat(price), 
            category: category, 
            image_url: image_url, 
            banner_url: image_url, // Usamos la misma para el banner
            description: description, 
            status: 'verified',
            user_id: currentUser.id // Guardamos quién lo subió
        }
    ]);

    if(error) {
        alert("❌ Error al publicar: " + error.message);
    } else {
        alert("🚀 ¡Juego publicado con éxito en la Vault!");
        window.location.href = "index.html";
    }
}

// BORRAR JUEGO
async function deleteGame(gameId) {
    if(!confirm("¿Estás seguro de que quieres eliminar este juego de la Vault?")) return;

    const { error } = await _supabase
        .from('games')
        .delete()
        .eq('id', gameId);

    if(error) alert("Error: " + error.message);
    else location.reload();
}

// CERRAR SESIÓN
async function handleSignOut() {
    await _supabase.auth.signOut();
    window.location.href = "index.html";
}
