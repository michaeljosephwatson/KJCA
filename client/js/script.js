import { supabase } from './supabaseClient.js';

// DOM Elements
const tournamentContainer = document.getElementById('tournaments-list');
const trainingsContainer = document.getElementById('trainings-list');
const featuredContainer = document.getElementById('featured-tournament');
const newsContainer = document.getElementById('chess-news-feed');
const adminControls = document.getElementById('admin-controls');
const postModal = document.getElementById('post-modal');
const postForm = document.getElementById('post-form');
const submitBtn = document.getElementById('submit-btn');

/**
 * AUTH: Check permissions
 */
async function checkOrganizerStatus() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('type')
            .eq('id', session.user.id)
            .single();

        if (profile?.type === 'organizer') {
            adminControls.classList.remove('hidden');
        }
    }
}

supabase.auth.onAuthStateChange((event, session) => {
    if (!session) {
        adminControls.classList.add('hidden');
    } else {
        checkOrganizerStatus();
    }
    refreshAllFeeds();
});

async function refreshAllFeeds() {
    await Promise.all([
        fetchFeaturedTournament(),
        fetchTournaments(),
        fetchTrainings(),
        fetchChessNews()
    ]);
}

/**
 * FEATURED: Large Hero Tournament
 */
async function fetchFeaturedTournament() {
    if (!featuredContainer) return;
    const { data: { session } } = await supabase.auth.getSession();
    const currentUserId = session?.user?.id;

    const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true })
        .limit(1)
        .single();

    if (error || !data) {
        featuredContainer.innerHTML = '<p class="text-gray-500 p-8 text-center border rounded-xl italic">No major events scheduled.</p>';
        return;
    }

    const isOwner = currentUserId === data.organizer_id;

    featuredContainer.innerHTML = `
        <div class="relative group block bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-500 hover:shadow-blue-100">
            ${isOwner ? `<button onclick="handleDelete(event, ${data.id}, '${data.image_url}', 'tournaments')" class="absolute top-4 right-4 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 z-20 shadow-lg transition opacity-0 group-hover:opacity-100">✕</button>` : ''}
            <a href="event.html?id=${data.id}&type=tournaments" class="block">
                <img class="w-full h-[400px] object-cover" src="${data.image_url || 'assets/landscape-placeholder.svg'}" alt="Featured">
                <div class="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
                <div class="absolute bottom-0 p-8 text-white w-full">
                    <p class="text-blue-400 font-black mb-2 uppercase tracking-tighter italic">Next Major Event — ${new Date(data.date).toLocaleDateString('en-GB')}</p>
                    <h3 class="text-4xl md:text-5xl font-black news-headline mb-4">${data.title}</h3>
                    <p class="text-slate-200 text-lg line-clamp-2 max-w-3xl">${data.description || 'Kent Junior Chess Premier Event.'}</p>
                </div>
            </a>
        </div>
    `;
}

/**
 * TOURNAMENTS: Card style
 */
async function fetchTournaments() {
    if (!tournamentContainer) return;
    const { data: { session } } = await supabase.auth.getSession();
    const currentUserId = session?.user?.id;

    const { data } = await supabase.from('tournaments').select('*').gte('date', new Date().toISOString().split('T')[0]).order('date', { ascending: true });

    if (!data || data.length <= 1) {
        tournamentContainer.innerHTML = '<p class="text-gray-500 text-sm italic">No additional tournaments.</p>';
        return;
    }

    tournamentContainer.innerHTML = data.slice(1).map(item => {
        const isOwner = currentUserId === item.organizer_id;
        return `
            <div class="relative group block border-b pb-4 hover:bg-white p-2 rounded-lg transition-all event-card">
                ${isOwner ? `<button onclick="handleDelete(event, ${item.id}, '${item.image_url}', 'tournaments')" class="absolute top-2 right-2 bg-red-600 text-white w-6 h-6 rounded-full text-[10px] z-10 opacity-0 group-hover:opacity-100 transition-opacity">✕</button>` : ''}
                <a href="event.html?id=${item.id}&type=tournaments" class="block">
                    <div class="overflow-hidden rounded-lg mb-3 h-40">
                        <img class="w-full h-full object-cover group-hover:scale-105 transition duration-500" src="${item.image_url || 'assets/landscape-placeholder.svg'}">
                    </div>
                    <h4 class="font-bold text-lg leading-tight text-gray-900 transition-colors">${item.title}</h4>
                    <div class="flex justify-between items-center mt-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        <span>${new Date(item.date).toLocaleDateString('en-GB')}</span>
                        <span class="text-blue-600">TOURNAMENT</span>
                    </div>
                </a>
            </div>
        `;
    }).join('');
}

/**
 * TRAININGS: Card style
 */
async function fetchTrainings() {
    if (!trainingsContainer) return;
    const { data: { session } } = await supabase.auth.getSession();
    const currentUserId = session?.user?.id;

    const { data } = await supabase.from('trainings').select('*').gte('date', new Date().toISOString().split('T')[0]).order('date', { ascending: true });

    if (!data || data.length === 0) {
        trainingsContainer.innerHTML = '<p class="text-gray-500 text-sm italic">No training scheduled.</p>';
        return;
    }

    trainingsContainer.innerHTML = data.map(item => {
        const isOwner = currentUserId === item.organizer_id;
        return `
            <div class="relative group block border-b pb-4 transition-all hover:bg-white p-2 rounded-lg event-card">
                ${isOwner ? `<button onclick="handleDelete(event, ${item.id}, '${item.image_url}', 'trainings')" class="absolute top-2 right-2 bg-red-600 text-white w-6 h-6 rounded-full text-[10px] z-10 opacity-0 group-hover:opacity-100 transition-opacity">✕</button>` : ''}
                <a href="event.html?id=${item.id}&type=trainings" class="block">
                    <div class="overflow-hidden rounded-lg mb-3 h-40">
                        <img class="w-full h-full object-cover group-hover:scale-105 transition duration-500" src="${item.image_url || 'assets/landscape-placeholder.svg'}">
                    </div>
                    <h4 class="font-bold text-lg leading-tight text-gray-900 transition-colors">${item.title}</h4>
                    <div class="flex justify-between items-center mt-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        <span>${new Date(item.date).toLocaleDateString('en-GB')}</span>
                        <span class="text-blue-600">${item.location || 'KENT'}</span>
                    </div>
                </a>
            </div>
        `;
    }).join('');
}

/**
 * NEWS: TWIC Feed
 */
async function fetchChessNews() {
    if (!newsContainer) return;
    const rssUrl = 'https://theweekinchess.com/twic-rss-feed';
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        newsContainer.innerHTML = data.items.slice(0, 8).map(article => `
            <a href="${article.link}" target="_blank" class="block group border-b border-slate-100 pb-3 transition-all hover:bg-slate-50 p-1">
                <p class="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mb-1">${new Date(article.pubDate).toLocaleDateString('en-GB')}</p>
                <h4 class="text-sm font-bold leading-snug group-hover:text-blue-600 transition-colors">${article.title}</h4>
            </a>
        `).join('');
    } catch (e) { newsContainer.innerHTML = '<p class="text-xs italic text-gray-400">Feed offline.</p>'; }
}

/**
 * MODAL TRIGGERS
 */
document.getElementById('add-tournament-btn').onclick = () => {
    document.getElementById('p-type').value = 'tournaments';
    document.getElementById('modal-title').innerText = 'New Tournament';
    document.getElementById('location-field').classList.add('hidden');
    postModal.classList.remove('hidden');
};

document.getElementById('add-training-btn').onclick = () => {
    document.getElementById('p-type').value = 'trainings';
    document.getElementById('modal-title').innerText = 'New Training Session';
    document.getElementById('location-field').classList.remove('hidden');
    postModal.classList.remove('hidden');
};

/**
 * SUBMISSION
 */
postForm.onsubmit = async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.innerText = "Publishing...";

    const type = document.getElementById('p-type').value;
    const title = document.getElementById('p-title').value;
    const date = document.getElementById('p-date').value;
    const desc = document.getElementById('p-desc').value;
    const loc = document.getElementById('p-location').value;
    const regLink = document.getElementById('p-link').value; // NEW
    const imgFile = document.getElementById('p-image-file').files[0];

    try {
        const { data: { session } } = await supabase.auth.getSession();
        let finalImg = 'assets/landscape-placeholder.svg';

        if (imgFile) {
            const fileName = `${Date.now()}-${imgFile.name}`;
            const { error: upErr } = await supabase.storage.from('tournament-images').upload(`tournament-photos/${fileName}`, imgFile);
            if (upErr) throw upErr;
            const { data: { publicUrl } } = supabase.storage.from('tournament-images').getPublicUrl(`tournament-photos/${fileName}`);
            finalImg = publicUrl;
        }

        const payload = { 
            title, 
            date, 
            description: desc, 
            image_url: finalImg, 
            organizer_id: session.user.id,
            registration_link: regLink // Capture the link
        };
        
        if (type === 'trainings') payload.location = loc;

        const { error } = await supabase.from(type).insert([payload]);
        if (error) throw error;

        postModal.classList.add('hidden');
        postForm.reset();
        await refreshAllFeeds();
    } catch (err) { alert(err.message); } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = "Publish to Live Feed";
    }
};

/**
 * DELETE
 */
window.handleDelete = async (event, id, imageUrl, table) => {
    event.stopPropagation();
    event.preventDefault();
    
    if (!confirm(`Permanently delete from ${table}?`)) return;
    
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (!error) {
        if (imageUrl?.includes('tournament-images')) {
            const fileName = imageUrl.split('/').pop();
            await supabase.storage.from('tournament-images').remove([`tournament-photos/${fileName}`]);
        }
        refreshAllFeeds();
    }
};

document.getElementById('close-modal').onclick = () => postModal.classList.add('hidden');
document.getElementById('close-modal-x').onclick = () => postModal.classList.add('hidden');

// START
refreshAllFeeds();
checkOrganizerStatus();