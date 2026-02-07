// CONFIG SUPABASE
const SUPABASE_URL = 'https://ettjrnpfgbcgwflmgcjv.supabase.co';
const SUPABASE_KEY = 'sb_publishable_sIyzTHGZX1o4B39cjE7_Aw_WdZ2w5Px';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

window.addEventListener("load", async () => {
    lucide.createIcons();
    
    // Verificar sesión
    const { data: { user } } = await _supabase.auth.getUser();

    if (!user) {
        window.location.href = "index.html"; // Redirigir si no está logueado
        return;
    }

    // Actualizar perfil con datos reales
    const username = user.email.split('@')[0].toUpperCase();
    document.getElementById('display-name').innerText = username;
    document.getElementById('display-email').innerText = user.email.toLowerCase();
    document.getElementById('user-avatar').src = `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`;

    // Cargar juegos del usuario
    loadUserGames();
});

// GESTIÓN DE PESTAÑAS
function switchTab(tabId) {
    // Ocultar todos los contenidos
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    
    // Resetear estilos de botones
    document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('active', 'bg-[#76ff03]', 'text-black');
        b.classList.add('bg-white/5', 'text-white');
    });

    // Mostrar el seleccionado
    document.getElementById(`tab-${tabId}`).classList.remove('hidden');
    
    // Estilo activo al botón clicado
    const activeBtn = document.getElementById(`btn-${tabId}`);
    activeBtn.classList.add('active', 'bg-[#76ff03]', 'text-black');
    activeBtn.classList.remove('bg-white/5', 'text-white');
    
    lucide.createIcons();
}

// CARGAR JUEGOS PUBLICADOS
async function loadUserGames() {
    const grid = document.getElementById('my-games-grid');
    const counter = document.getElementById('count-releases');

    // Aquí traemos todos los juegos. 
    // Nota: Si quieres filtrar por TUS juegos, deberías usar .eq('user_id', user.id) 
    // pero para eso tu tabla 'games' debe tener esa columna.
    const { data: games, error } = await _supabase
        .from('games')
        .select('*')
        .order('created_at', { ascending: false });

    if (games && games.length > 0) {
        grid.innerHTML = '';
        counter.innerText = games.length;

        games.forEach(game => {
            grid.innerHTML += `
            <div class="bg-[#0d0d0d] border border-white/5 rounded-[2.5rem] overflow-hidden group hover:border-[#76ff03]/40 transition-all duration-500">
                <div class="h-40 overflow-hidden relative">
                    <img src="${game.image_url}" class="w-full h-full object-cover opacity-50 group-hover:opacity-100 group-hover:scale-110 transition duration-700">
                    <div class="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-transparent to-transparent"></div>
                    <div class="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[8px] font-black text-[#76ff03] uppercase tracking-widest">Live in Vault</div>
                </div>
                <div class="p-8 -mt-6 relative z-10">
                    <h4 class="font-black uppercase italic text-lg tracking-tighter">${game.title}</h4>
                    <p class="text-[9px] text-gray-500 uppercase font-bold tracking-[2px] mb-4">${game.category || 'General'}</p>
                    <div class="flex justify-between items-center">
                        <span class="text-xl font-black text-white">${game.price}€</span>
                        <div class="flex gap-2">
                             <button class="p-3 bg-white/5 rounded-xl hover:bg-[#76ff03] hover:text-black transition-all"><i data-lucide="edit-3" class="w-4 h-4"></i></button>
                             <button class="p-3 bg-white/5 rounded-xl hover:bg-red-500 transition-all"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                        </div>
                    </div>
                </div>
            </div>`;
        });
        lucide.createIcons();
    }
}

// PUBLICAR NUEVO JUEGO
async function handlePublish() {
    const title = document.getElementById('game-title').value;
    const category = document.getElementById('game-category').value;
    const price = document.getElementById('game-price').value;
    const image_url = document.getElementById('game-img').value;
    const description = document.getElementById('game-desc').value;

    if(!title || !price || !image_url) {
        alert("⚠️ Please fill out the Title, Price, and Image URL.");
        return;
    }

    // Mostrar estado de carga en el botón si quieres, pero aquí vamos directo:
    const { error } = await _supabase.from('games').insert([
        { 
            title, 
            price: parseFloat(price), 
            category, 
            image_url, 
            banner_url: image_url, 
            description, 
            status: 'verified' 
        }
    ]);

    if(error) {
        alert("❌ Error: " + error.message);
    } else {
        alert("🚀 MASTERPIECE DEPLOYED! Your game is now live.");
        window.location.href = "index.html";
    }
}

// CERRAR SESIÓN
async function handleSignOut() {
    const { error } = await _supabase.auth.signOut();
    window.location.href = "index.html";
}
