const SUPABASE_URL = 'https://ettjrnpfgbcgwflmgcjv.supabase.co';
const SUPABASE_KEY = 'sb_publishable_sIyzTHGZX1o4B39cjE7_Aw_WdZ2w5Px';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null;

// INICIALIZACIÓN DE SESIÓN
window.addEventListener("load", async () => {
    lucide.createIcons();
    const { data: { session } } = await _supabase.auth.getSession();
    
    if (!session) {
        window.location.href = "index.html";
        return;
    }
    
    currentUser = session.user;
    console.log("Vault Session Active:", currentUser.id);

    // UI Header
    const username = currentUser.email.split('@')[0].toUpperCase();
    document.getElementById('display-name').innerText = username;
    document.getElementById('display-email').innerText = currentUser.email.toLowerCase();
    document.getElementById('user-avatar').src = `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`;
    
    // Carga inicial
    loadUserGames();
});

// GESTIÓN DE PESTAÑAS
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
    document.querySelectorAll('[id^="btn-"]').forEach(b => {
        b.classList.remove('active-tab', 'bg-[#76ff03]', 'text-black');
        b.classList.add('bg-white/5', 'text-white');
    });

    document.getElementById(`tab-${tabId}`).classList.remove('hidden');
    const activeBtn = document.getElementById(`btn-${tabId}`);
    activeBtn.classList.add('active-tab');
    activeBtn.classList.remove('bg-white/5', 'text-white');
    
    lucide.createIcons();
}

// CARGAR JUEGOS PUBLICADOS
async function loadUserGames() {
    const grid = document.getElementById('my-published-games-grid');
    const counter = document.getElementById('count-releases');

    if (!currentUser) return;

    // Pedimos los juegos filtrando por el ID del usuario logueado
    const { data: games, error } = await _supabase
        .from('games')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Fetch error:", error.message);
        return;
    }

    console.log("Games found in studio:", games.length);

    if (games && games.length > 0) {
        counter.innerText = games.length;
        grid.innerHTML = ""; 
        
        games.forEach(game => {
            grid.innerHTML += `
                <div class="bg-zinc-900/40 border border-white/5 rounded-[3rem] overflow-hidden group hover:border-[#76ff03]/30 transition-all duration-500 flex flex-col">
                    <div class="h-56 overflow-hidden relative">
                        <img src="${game.image_url}" class="w-full h-full object-cover opacity-50 group-hover:opacity-100 group-hover:scale-105 transition duration-700" onerror="this.src='https://via.placeholder.com/600x400?text=Build+Ready'">
                        <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                    </div>
                    <div class="p-8 flex flex-col flex-grow">
                        <h3 class="text-2xl font-black uppercase italic tracking-tighter">${game.title}</h3>
                        <div class="flex items-center gap-2 mt-2 mb-6 text-[#76ff03] opacity-70">
                             <i data-lucide="package" class="w-3 h-3"></i>
                             <span class="text-[9px] font-bold uppercase tracking-widest">${game.category || 'Standard Build'}</span>
                        </div>
                        
                        <p class="text-gray-500 text-xs italic mb-8 line-clamp-2 leading-relaxed">${game.description || 'Verified Vault Distribution File.'}</p>
                        
                        <div class="flex justify-between items-center mt-auto">
                            <span class="text-3xl font-black text-white">${game.price}€</span>
                            <button onclick="deleteGame('${game.id}', '${game.file_url}')" class="p-4 bg-red-500/10 rounded-2xl hover:bg-red-500 transition-all text-red-500 hover:text-white group/del">
                                <i data-lucide="trash-2" class="w-5 h-5 transition-transform group-hover/del:scale-110"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        lucide.createIcons();
    } else {
        grid.innerHTML = `
            <div class="col-span-full py-24 text-center border-2 border-dashed border-white/5 rounded-[4rem] opacity-20">
                <i data-lucide="plus-square" class="w-12 h-12 mx-auto mb-4"></i>
                <p class="italic uppercase text-xs tracking-[4px]">No deployments detected</p>
            </div>`;
        counter.innerText = "0";
    }
}

// PUBLICAR JUEGO + ARCHIVO
async function handlePublish() {
    const btn = document.getElementById('publish-btn');
    const fileInput = document.getElementById('game-file');
    const file = fileInput.files[0];

    // Datos del formulario
    const title = document.getElementById('game-title').value;
    const price = document.getElementById('game-price').value;
    const img = document.getElementById('game-img').value;
    const desc = document.getElementById('game-desc').value;
    const category = document.getElementById('game-category').value;

    if(!title || !price || !img || !file) {
        alert("🚨 Critical: Missing Title, Price, Image or Build File.");
        return;
    }

    btn.innerText = "UPLOADING TO VAULT...";
    btn.disabled = true;

    try {
        // 1. Subida al Storage Privado
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.floor(Math.random()*1000)}.${fileExt}`;
        const filePath = `${currentUser.id}/${fileName}`;

        console.log("Target Path:", filePath);

        const { data: upData, error: upError } = await _supabase.storage
            .from('game-builds')
            .upload(filePath, file);

        if (upError) throw upError;

        // 2. Inserción con RETORNO de datos (select)
        const { data: finalGame, error: inError } = await _supabase
            .from('games')
            .insert([{
                title, 
                price: parseFloat(price), 
                category,
                image_url: img,
                description: desc,
                file_url: filePath,
                user_id: currentUser.id,
                status: 'verified'
            }])
            .select();

        if (inError) throw inError;

        console.log("Deployment Complete:", finalGame);
        alert("🚀 MASTERPIECE DEPLOYED SUCCESSFULLY");
        
        // Pequeña espera para sincronizar antes de recargar
        setTimeout(() => location.reload(), 500);

    } catch (err) {
        console.error("Deployment Error:", err);
        alert("❌ DEPLOYMENT FAILED: " + err.message);
        btn.innerText = "EXECUTE GLOBAL RELEASE";
        btn.disabled = false;
    }
}

// ELIMINAR JUEGO Y LIMPIAR STORAGE
async function deleteGame(id, filePath) {
    if(!confirm("DANGER: This will purge the build and database record. Proceed?")) return;
    
    // 1. Eliminar de DB
    const { error: dbError } = await _supabase.from('games').delete().eq('id', id);
    
    // 2. Eliminar de Storage si existe ruta
    if (filePath) {
        await _supabase.storage.from('game-builds').remove([filePath]);
    }

    if(dbError) alert("Error: " + dbError.message);
    else location.reload();
}

// LOGOUT
async function handleSignOut() {
    await _supabase.auth.signOut();
    window.location.href = "index.html";
}
