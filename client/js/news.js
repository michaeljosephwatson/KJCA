import { supabase } from './supabaseClient.js';

const newsFeed = document.getElementById('news-feed');
const addBtn = document.getElementById('add-news-btn');
const modal = document.getElementById('news-modal');
const closeModal = document.getElementById('close-modal');
const newsForm = document.getElementById('news-form');
const submitBtn = document.getElementById('submit-news-btn');

let isEditing = false;
let editId = null;
let currentImageUrl = null;
let isOrganizer = false;

async function init() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        const { data: profile } = await supabase.from('profiles').select('type').eq('id', session.user.id).single();
        if (profile?.type === 'organizer') {
            isOrganizer = true;
            addBtn.classList.remove('hidden');
        }
    }
    fetchNews();
}

async function fetchNews() {
    const { data, error } = await supabase.from('news').select('*').order('created_at', { ascending: false });
    if (error) return console.error(error);
    renderNews(data);
}

function renderNews(articles) {
    if (articles.length === 0) {
        newsFeed.innerHTML = `<p class="text-center text-slate-400 py-10 italic border-2 border-dashed border-slate-200 rounded-xl">No news articles yet.</p>`;
        return;
    }

    newsFeed.innerHTML = articles.map(art => {
        const date = new Date(art.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
        return `
            <article class="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 max-w-full group relative">
                ${isOrganizer ? `
                <div class="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    <button onclick="window.editArticle('${art.id}')" class="bg-white/90 p-2 rounded-full shadow-lg hover:bg-blue-600 hover:text-white transition text-slate-700">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button onclick="window.deleteArticle('${art.id}')" class="bg-white/90 p-2 rounded-full shadow-lg hover:bg-red-600 hover:text-white transition text-slate-700">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>` : ''}

                ${art.image_url ? `<img src="${art.image_url}" class="w-full h-72 object-cover border-b border-slate-100">` : ''}
                <div class="p-8">
                    <div class="flex items-center gap-2 mb-4">
                        <span class="text-[10px] font-black uppercase text-slate-400">Published</span>
                        <span class="text-xs font-bold text-slate-900">${date}</span>
                    </div>
                    <h2 class="text-3xl font-black text-slate-900 mb-3 break-words leading-tight tracking-tighter">${art.title}</h2>
                    <p class="text-lg text-slate-500 font-medium mb-4 italic break-words leading-relaxed">"${art.tagline}"</p>
                    <div id="content-${art.id}" class="hidden text-slate-700 leading-relaxed border-t border-slate-50 pt-6 mt-6 whitespace-pre-wrap break-words overflow-hidden">${art.content}</div>
                    <button onclick="const el = document.getElementById('content-${art.id}'); el.classList.toggle('hidden'); this.innerText = el.classList.contains('hidden') ? 'Read Full Article' : 'Collapse Article'" 
                            class="mt-6 inline-flex items-center gap-2 text-blue-600 font-bold hover:text-blue-800 transition uppercase tracking-widest text-[10px] bg-blue-50 px-4 py-2 rounded-full">
                        Read Full Article
                    </button>
                </div>
            </article>`;
    }).join('');
}

// Upload Helper
async function uploadImage(file) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `news/${fileName}`;

    const { error: uploadError } = await supabase.storage.from('tournament-images').upload(filePath, file);
    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('tournament-images').getPublicUrl(filePath);
    return data.publicUrl;
}

window.editArticle = async (id) => {
    const { data } = await supabase.from('news').select('*').eq('id', id).single();
    if (!data) return;
    isEditing = true;
    editId = id;
    currentImageUrl = data.image_url;
    document.getElementById('news-title').value = data.title;
    document.getElementById('news-tagline').value = data.tagline;
    document.getElementById('news-content').value = data.content;
    document.getElementById('edit-img-note').classList.remove('hidden');
    modal.querySelector('h3').innerText = "Edit News Article";
    modal.classList.remove('hidden');
};

window.deleteArticle = async (id) => {
    if (confirm("Delete this article?")) {
        const { error } = await supabase.from('news').delete().eq('id', id);
        if (error) alert(error.message); else fetchNews();
    }
};

addBtn.onclick = () => {
    isEditing = false;
    currentImageUrl = null;
    newsForm.reset();
    document.getElementById('edit-img-note').classList.add('hidden');
    modal.querySelector('h3').innerText = "Create News Article";
    modal.classList.remove('hidden');
};

closeModal.onclick = () => modal.classList.add('hidden');

newsForm.onsubmit = async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.innerText = "Uploading...";

    try {
        const { data: { session } } = await supabase.auth.getSession();
        const imageFile = document.getElementById('news-image-file').files[0];
        let imageUrl = currentImageUrl;

        if (imageFile) {
            imageUrl = await uploadImage(imageFile);
        }

        const articleData = {
            title: document.getElementById('news-title').value,
            image_url: imageUrl,
            tagline: document.getElementById('news-tagline').value,
            content: document.getElementById('news-content').value,
            author_id: session.user.id
        };

        let err;
        if (isEditing) {
            const { error } = await supabase.from('news').update(articleData).eq('id', editId);
            err = error;
        } else {
            const { error } = await supabase.from('news').insert([articleData]);
            err = error;
        }

        if (err) throw err;
        modal.classList.add('hidden');
        newsForm.reset();
        fetchNews();
    } catch (err) {
        alert(err.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = isEditing ? "Update News" : "Publish News";
    }
};

init();