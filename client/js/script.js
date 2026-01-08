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
});

/**
 * FEED: Load tournaments and display them
 */
async function fetchTournaments() {
    const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .order('date', { ascending: true });

    if (error) {
        tournamentContainer.innerHTML = '<p class="text-center text-red-500">Error loading tournaments.</p>';
        return;
    }

    tournamentContainer.innerHTML = data.map(item => `
        <div class="block bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
            <img class="w-full h-32 object-cover" src="${item.image_url || 'assets/landscape-placeholder.svg'}" alt="Tournament Image">
            <div class="p-4">
                <p class="text-gray-800 font-bold text-lg">${item.title}</p>
                <p class="text-blue-600 text-xs font-semibold mb-2">${new Date(item.date).toLocaleDateString('en-GB')}</p>
                <p class="text-gray-600 text-sm line-clamp-3">${item.description || 'No description available.'}</p>
            </div>
        </div>
    `).join('');
}

/**
 * MODAL: Controls
 */
document.getElementById('open-modal').onclick = () => tournamentModal.classList.remove('hidden');
document.getElementById('close-modal').onclick = () => {
    tournamentModal.classList.add('hidden');
    tournamentForm.reset();
};

/**
 * SUBMIT: Upload Image + Save Data
 */
tournamentForm.onsubmit = async (e) => {
    e.preventDefault();
    
    // UI Loading state
    submitBtn.disabled = true;
    submitBtn.innerText = "Processing...";

    const title = document.getElementById('t-title').value;
    const date = document.getElementById('t-date').value;
    const description = document.getElementById('t-desc').value;
    const imageFile = document.getElementById('t-image-file').files[0];

    let finalImageUrl = 'assets/landscape-placeholder.svg';

    try {
        // 1. Upload image to Storage if a file was selected
        if (imageFile) {
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `tournament-photos/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('tournament-images')
                .upload(filePath, imageFile);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('tournament-images')
                .getPublicUrl(filePath);
            
            finalImageUrl = publicUrl;
        }

        // 3. Save metadata to Database
        const { error: dbError } = await supabase
            .from('tournaments')
            .insert([{ 
                title, 
                date, 
                description, 
                image_url: finalImageUrl 
            }]);

        if (dbError) throw dbError;

        // Success: Reset and Close
        tournamentModal.classList.add('hidden');
        tournamentForm.reset();
        await fetchTournaments();
        alert("Tournament created successfully!");

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