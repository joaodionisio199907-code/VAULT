// CONFIG SUPABASE
const SUPABASE_URL = 'https://ettjrnpfgbcgwflmgcjv.supabase.co';
const SUPABASE_KEY = 'sb_publishable_sIyzTHGZX1o4B39cjE7_Aw_WdZ2w5Px';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null;

// INICIALIZACIÓN
window.addEventListener("load", async () => {
    lucide.createIcons();
    const { data: { session } } = await _supabase.auth.getSession();
    
    if (!session) {
        window.location.href = "index.html";
        return;
    }
    
    currentUser = session.user;
    
    // UI Header
    const username = currentUser.email.split('@')[0].toUpperCase();
    document.getElementById('display-name').innerText = username;
    document.getElementById('display-email').innerText = currentUser.email;
    document.getElementById('user-avatar').src = `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`;
    
    loadUserGames();
});

// PESTAÑAS
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
    document.querySelectorAll('[id^="btn-"]').forEach(b => b.classList.remove('active-tab', 'bg-[#76ff03]', 'text-black'));
    document.querySelectorAll('[id^="btn-"]').forEach(b => b.classList.add('bg-white/5', 'text-white'));

    document.getElementById(`tab-${tabId}`).classList.remove('hidden');
    const activeBtn = document.getElementById(`btn-${tabId}`);
    activeBtn.classList.add('active-tab');
    activeBtn.classList.remove('bg-white/5', 'text-white');
    
    lucide.createIcons();
}

// CARGAR JUEGOS
async function loadUserGames() {
    const grid = document.getElementById('my-published-games-grid');
    const counter = document.getElementById('count-releases');

    const { data: games, error } = await _supabase
        .from('games')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error:", error.message);
        return;
    }

    if (games && games.length > 0) {
        counter.innerText = games.length;
        grid.innerHTML = ""; 
        
        games.forEach(game => {
            grid.innerHTML += `
                <div class="bg-zinc-900/50 border border-white/5 rounded-[2.5rem] overflow-hidden group hover:border-[#76ff03]/30 transition-all duration-500 flex flex-col">
                    <div class="h-48 overflow-hidden relative">
                        <img src="${game.image_url}" class="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition duration-700">
                        <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                    </div>
                    <div class="p-8 flex flex-col flex-grow">
                        <h3 class="text-xl font-black uppercase italic tracking-tighter">${game.title}</h3>
                        <p class="text-[10px] text-[#76ff03] font-bold uppercase tracking-widest mt-1 mb-3">${game.category || 'General'}</p>
                        
                        <p class="text-gray-400 text-xs italic mb-6 line-clamp-2">${game.description || 'No description provided.'}</p>
                        
                        <div class="flex justify-between items-center mt-auto">
                            <span class="text-2xl font-black text-white">${game.price}€</span>
                            <button onclick="deleteGame('${game.id}')" class="p-3 bg-white/5 rounded-xl hover:bg-red-500 transition-all text-red-500 hover:text-white">
                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        lucide.createIcons();
    } else {
        grid.innerHTML = `<div class="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-[3rem] opacity-30 italic">Your studio is currently empty.</div>`;
    }
}

// PUBLICAR
async function handlePublish() {
    const title = document.getElementById('game-title').value;
    const category = document.getElementById('game-category').value;
    const price = document.getElementById('game-price').value;
    const img = document.getElementById('game-img').value;
    const desc = document.getElementById('game-desc').value;

    if(!title || !price || !img) {
        alert("⚠️ Please fill in Title, Price and Image URL.");
        return;
    }

    const { error } = await _supabase.from('games').insert([{
        title, 
        category,
        price: parseFloat(price), 
        image_url: img,
        banner_url: img,
        description: desc,
        user_id: currentUser.id,
        status: 'verified'
    }]);

    if(error) {
        alert("❌ Error: " + error.message);
    } else {
        alert("🚀 Game published successfully!");
        location.reload(); 
    }
}

// BORRAR
async function deleteGame(id) {
    if(!confirm("Are you sure you want to remove this release?")) return;
    const { error } = await _supabase.from('games').delete().eq('id', id);
    if(error) alert("Error: " + error.message);
    else location.reload();
}

// LOGOUT
async function handleSignOut() {
    await _supabase.auth.signOut();
    window.location.href = "index.html";
}
