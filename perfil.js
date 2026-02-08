const SUPABASE_URL = 'https://ettjrnpfgbcgwflmgcjv.supabase.co';
const SUPABASE_KEY = 'sb_publishable_sIyzTHGZX1o4B39cjE7_Aw_WdZ2w5Px'; // Usa tu clave real
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null;

// AL CARGAR LA PÁGINA
window.addEventListener("load", async () => {
    lucide.createIcons();
    const { data: { session } } = await _supabase.auth.getSession();
    
    if (!session) {
        window.location.href = "index.html";
        return;
    }
    
    currentUser = session.user;
    
    // Rellenar Interfaz
    const username = currentUser.email.split('@')[0].toUpperCase();
    document.getElementById('display-name').innerText = username;
    document.getElementById('display-email').innerText = currentUser.email;
    document.getElementById('user-avatar').src = `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`;
    
    loadUserGames();
});

// NAVEGACIÓN DE PESTAÑAS
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

// CARGAR JUEGOS DEL STUDIO
async function loadUserGames() {
    const grid = document.getElementById('my-published-games-grid');
    const counter = document.getElementById('count-releases');

    const { data: games, error } = await _supabase
        .from('games')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

    if (error) return;

    if (games && games.length > 0) {
        counter.innerText = games.length;
        grid.innerHTML = ""; 
        
        games.forEach(game => {
            grid.innerHTML += `
                <div class="bg-zinc-900/50 border border-white/5 rounded-[2.5rem] overflow-hidden group hover:border-[#76ff03]/30 transition-all duration-500 flex flex-col">
                    <div class="h-48 overflow-hidden relative">
                        <img src="${game.image_url}" class="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition duration-700" onerror="this.src='https://via.placeholder.com/400x200?text=Vault+Media'">
                        <div class="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black to-transparent">
                             <span class="bg-[#76ff03] text-black text-[8px] font-black px-3 py-1 rounded-full uppercase">Verified Build</span>
                        </div>
                    </div>
                    <div class="p-8 flex flex-col flex-grow">
                        <h3 class="text-xl font-black uppercase italic tracking-tighter">${game.title}</h3>
                        <p class="text-[9px] text-gray-500 font-bold uppercase tracking-[2px] mt-1 mb-4">${game.category || 'Indie'}</p>
                        <p class="text-gray-400 text-xs italic mb-6 line-clamp-2">${game.description || 'Secure distribution build.'}</p>
                        
                        <div class="flex justify-between items-center mt-auto border-t border-white/5 pt-6">
                            <span class="text-2xl font-black text-white">${game.price}€</span>
                            <div class="flex gap-2">
                                <button onclick="deleteGame('${game.id}', '${game.file_url}')" class="p-3 bg-red-500/10 rounded-xl hover:bg-red-500 transition-all text-red-500 hover:text-white">
                                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        lucide.createIcons();
    } else {
        grid.innerHTML = `<div class="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-[3rem] opacity-20 italic">No active releases in your studio.</div>`;
    }
}

// PUBLICAR: SUBIDA DE ARCHIVO + DATOS
async function handlePublish() {
    const btn = document.getElementById('publish-btn');
    const title = document.getElementById('game-title').value;
    const price = document.getElementById('game-price').value;
    const img = document.getElementById('game-img').value;
    const desc = document.getElementById('game-desc').value;
    const fileInput = document.getElementById('game-file');
    const file = fileInput.files[0];

    if(!title || !price || !img || !file) {
        alert("⚠️ All fields are required, including the game build file.");
        return;
    }

    btn.innerText = "UPLOADING BUILD...";
    btn.disabled = true;

    try {
        // 1. Subir archivo al Storage Privado
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${currentUser.id}/${fileName}`;

        const { data: uploadData, error: uploadError } = await _supabase.storage
            .from('game-builds')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        // 2. Insertar metadatos en la tabla
        const { error: insertError } = await _supabase.from('games').insert([{
            title, 
            price: parseFloat(price), 
            category: document.getElementById('game-category').value,
            image_url: img,
            description: desc,
            file_url: filePath, // Guardamos la ruta del storage
            user_id: currentUser.id,
            status: 'verified'
        }]);

        if (insertError) throw insertError;

        alert("🚀 Deployment Successful! Your game is now in the Vault.");
        location.reload();

    } catch (err) {
        alert("❌ Deployment Failed: " + err.message);
        btn.innerText = "INITIALIZE DISTRIBUTION";
        btn.disabled = false;
    }
}

// BORRAR JUEGO Y ARCHIVO
async function deleteGame(id, filePath) {
    if(!confirm("Are you sure? This will remove the game and the build file forever.")) return;
    
    // Borrar de la tabla
    const { error: dbError } = await _supabase.from('games').delete().eq('id', id);
    
    // Borrar del storage
    if (filePath) {
        await _supabase.storage.from('game-builds').remove([filePath]);
    }

    if(dbError) alert("Error: " + dbError.message);
    else location.reload();
}

async function handleSignOut() {
    await _supabase.auth.signOut();
    window.location.href = "index.html";
}
