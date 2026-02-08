const SUPABASE_URL = 'https://ettjrnpfgbcgwflmgcjv.supabase.co';
const SUPABASE_KEY = 'sb_publishable_sIyzTHGZX1o4B39cjE7_Aw_WdZ2w5Px';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null;

window.addEventListener("load", async () => {
    const { data: { session } } = await _supabase.auth.getSession();
    if (!session) { window.location.href = "index.html"; return; }
    
    currentUser = session.user;
    
    // UI
    const username = currentUser.email.split('@')[0].toUpperCase();
    document.getElementById('display-name').innerText = username;
    document.getElementById('display-email').innerText = currentUser.email;
    document.getElementById('user-avatar').src = `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`;
    
    loadUserGames();
});

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
    document.querySelectorAll('[id^="btn-"]').forEach(b => b.classList.remove('active-tab'));
    
    document.getElementById(`tab-${tabId}`).classList.remove('hidden');
    document.getElementById(`btn-${tabId}`).classList.add('active-tab');
    lucide.createIcons();
}

async function loadUserGames() {
    const grid = document.getElementById('my-published-games-grid');
    const counter = document.getElementById('count-releases');

    const { data: games, error } = await _supabase
        .from('games')
        .select('*')
        .eq('user_id', currentUser.id);

    if (error) { console.error(error); return; }

    if (games && games.length > 0) {
        counter.innerText = games.length;
        grid.innerHTML = ""; // Limpiar
        
        games.forEach(game => {
            // DISEÑO DE TARJETA SIMPLIFICADO
            grid.innerHTML += `
                <div class="bg-zinc-900 rounded-3xl overflow-hidden border border-white/10">
                    <img src="${game.image_url}" class="w-full h-48 object-cover">
                    <div class="p-6">
                        <h3 class="text-xl font-bold uppercase italic">${game.title}</h3>
                        <div class="flex justify-between items-center mt-4">
                            <span class="text-[#76ff03] font-black">${game.price}€</span>
                            <button onclick="deleteGame('${game.id}')" class="text-red-500 bg-red-500/10 p-2 rounded-lg">
                                <i data-lucide="trash-2" class="w-5 h-5"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        lucide.createIcons();
    } else {
        grid.innerHTML = "<p class='col-span-full text-center text-gray-500 py-10'>No has publicado nada aún.</p>";
    }
}

async function handlePublish() {
    const title = document.getElementById('game-title').value;
    const price = document.getElementById('game-price').value;
    const img = document.getElementById('game-img').value;

    if(!title || !price || !img) { alert("Faltan datos"); return; }

    const { error } = await _supabase.from('games').insert([{
        title, 
        price: parseFloat(price), 
        image_url: img,
        user_id: currentUser.id,
        status: 'verified'
    }]);

    if(error) { alert("Error: " + error.message); } 
    else { location.reload(); }
}

async function deleteGame(id) {
    if(!confirm("¿Borrar?")) return;
    await _supabase.from('games').delete().eq('id', id);
    location.reload();
}

async function handleSignOut() {
    await _supabase.auth.signOut();
    window.location.href = "index.html";
}
