import { supabase } from './supabaseClient.js';

// DOM Elements
const tournamentContainer = document.getElementById('tournaments-list');
const adminControls = document.getElementById('admin-controls');
const tournamentModal = document.getElementById('tournament-modal');
const tournamentForm = document.getElementById('tournament-form');
const submitBtn = document.getElementById('submit-btn');

/**
 * AUTH: Check if user is an organizer
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

// Listen for auth state changes (login/logout)
supabase.auth.onAuthStateChange((event, session) => {
    if (!session) {
        adminControls.classList.add('hidden');
    } else {
        checkOrganizerStatus();
    }
    // Re-fetch tournaments to update visibility of delete buttons
    fetchTournaments();
});

/**
 * FEED: Load tournaments and display them
 */
async function fetchTournaments() {
    // Get current session to check ownership of cards
    const { data: { session } } = await supabase.auth.getSession();
    const currentUserId = session?.user?.id;

    const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .order('date', { ascending: true });

    if (error) {
        tournamentContainer.innerHTML = '<p class="text-center text-red-500">Error loading tournaments.</p>';
        return;
    }

    if (data.length === 0) {
        tournamentContainer.innerHTML = '<p class="text-center text-gray-500">No upcoming tournaments.</p>';
        return;
    }

    tournamentContainer.innerHTML = data.map(item => {
        // Ownership check
        const isOwner = currentUserId === item.organizer_id;

        return `
            <div class="relative group block bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
                ${isOwner ? `
                    <button 
                        onclick="deleteTournament(${item.id}, '${item.image_url}')"
                        class="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 z-10 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete Tournament"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                ` : ''}
                <img class="w-full h-32 object-cover" src="${item.image_url || 'assets/landscape-placeholder.svg'}" alt="Tournament Image">
                <div class="p-4">
                    <p class="text-gray-800 font-bold text-lg">${item.title}</p>
                    <p class="text-blue-600 text-xs font-semibold mb-2">${new Date(item.date).toLocaleDateString('en-GB')}</p>
                    <p class="text-gray-600 text-sm line-clamp-3">${item.description || 'No description available.'}</p>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * DELETE: Remove tournament and cleanup storage
 */
window.deleteTournament = async (id, imageUrl) => {
    if (!confirm("Are you sure you want to delete this tournament?")) return;

    try {
        // 1. Delete from Database
        const { error: dbError } = await supabase
            .from('tournaments')
            .delete()
            .eq('id', id);

        if (dbError) throw dbError;

        // 2. Cleanup Storage if an image was uploaded (don't delete placeholder)
        if (imageUrl && imageUrl.includes('tournament-images')) {
            // Extracts the filename from the end of the public URL
            const fileName = imageUrl.split('/').pop();
            await supabase.storage
                .from('tournament-images')
                .remove([`tournament-photos/${fileName}`]);
        }

        await fetchTournaments();
        alert("Tournament deleted successfully.");
    } catch (err) {
        console.error(err);
        alert("Error deleting: " + err.message);
    }
};

/**
 * MODAL: Controls
 */
document.getElementById('open-modal').onclick = () => tournamentModal.classList.remove('hidden');
document.getElementById('close-modal').onclick = () => {
    tournamentModal.classList.add('hidden');
    tournamentForm.reset();
};

/**
 * SUBMIT: Upload Image + Save Data with Foreign Key
 */
tournamentForm.onsubmit = async (e) => {
    e.preventDefault();
    
    submitBtn.disabled = true;
    submitBtn.innerText = "Processing...";

    const title = document.getElementById('t-title').value;
    const date = document.getElementById('t-date').value;
    const description = document.getElementById('t-desc').value;
    const imageFile = document.getElementById('t-image-file').files[0];

    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("No active session found.");

        const userId = session.user.id;
        let finalImageUrl = 'assets/landscape-placeholder.svg';

        if (imageFile) {
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
            const filePath = `tournament-photos/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('tournament-images')
                .upload(filePath, imageFile);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('tournament-images')
                .getPublicUrl(filePath);
            
            finalImageUrl = publicUrl;
        }

        const { error: dbError } = await supabase
            .from('tournaments')
            .insert([{ 
                title, 
                date, 
                description, 
                image_url: finalImageUrl,
                organizer_id: userId 
            }]);

        if (dbError) throw dbError;

        tournamentModal.classList.add('hidden');
        tournamentForm.reset();
        await fetchTournaments();

    } catch (err) {
        console.error(err);
        alert("Error: " + err.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = "Create Event";
    }
};

// Start
checkOrganizerStatus();
fetchTournaments();