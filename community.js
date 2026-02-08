// Simulación de datos (hasta que conectemos Supabase)
const mockData = [
    {
        id: 1,
        title: "Cyberpunk Mod Pack",
        author: "NeoDev",
        category: "MODS",
        price: 0,
        image: "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=800&q=80",
        stats: { downloads: "1.2k", rating: 4.8 }
    },
    {
        id: 2,
        title: "Vault Runner OS",
        author: "AdminX",
        category: "GAMES",
        price: 15,
        image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80",
        stats: { downloads: "850", rating: 4.9 }
    },
    {
        id: 3,
        title: "VHS Glitch Shader",
        author: "RetroVibes",
        category: "ASSETS",
        price: 5,
        image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80",
        stats: { downloads: "3.4k", rating: 4.5 }
    },
    {
        id: 4,
        title: "Orbital Strike v2",
        author: "ModderElite",
        category: "GAMES",
        price: 0,
        image: "https://images.unsplash.com/photo-1614728263952-84ea256f9679?w=800&q=80",
        stats: { downloads: "500", rating: 4.2 }
    }
];

document.addEventListener("DOMContentLoaded", () => {
    lucide.createIcons();
    renderCommunityShop(mockData);
});

function renderCommunityShop(items) {
    const grid = document.getElementById('community-grid');
    grid.innerHTML = "";

    items.forEach(item => {
        grid.innerHTML += `
            <div class="vault-card rounded-[2.5rem] overflow-hidden flex flex-col group">
                <div class="relative h-64 overflow-hidden">
                    <img src="${item.image}" class="w-full h-full object-cover group-hover:scale-110 transition duration-700 opacity-80 group-hover:opacity-100">
                    <div class="absolute top-5 left-5">
                        <span class="bg-black/80 backdrop-blur-md text-[8px] font-black px-4 py-2 rounded-full border border-white/10 tracking-[2px]">
                            ${item.category}
                        </span>
                    </div>
                </div>

                <div class="p-8 flex flex-col flex-grow">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <h3 class="text-lg font-black uppercase italic tracking-tighter group-hover:text-[#76ff03] transition">${item.title}</h3>
                            <p class="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">By ${item.author}</p>
                        </div>
                        <span class="text-[#76ff03] font-black text-lg">${item.price === 0 ? 'FREE' : item.price + '€'}</span>
                    </div>

                    <div class="flex items-center gap-4 mt-auto pt-6 border-t border-white/5">
                        <div class="flex items-center gap-1.5 text-gray-500">
                            <i data-lucide="download" class="w-3 h-3"></i>
                            <span class="text-[10px] font-bold">${item.stats.downloads}</span>
                        </div>
                        <div class="flex items-center gap-1.5 text-gray-500">
                            <i data-lucide="star" class="w-3 h-3 fill-[#76ff03] text-[#76ff03]"></i>
                            <span class="text-[10px] font-bold">${item.stats.rating}</span>
                        </div>
                        
                        <button class="ml-auto bg-white/5 p-3 rounded-xl hover:bg-[#76ff03] hover:text-black transition-all">
                            <i data-lucide="arrow-up-right" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    lucide.createIcons();
}
