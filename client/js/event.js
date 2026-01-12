import { supabase } from './supabaseClient.js';

const eventContent = document.getElementById('event-content');

/**
 * INITIALIZATION: Logic to load the event and its metadata
 */
async function initEventPage() {
    const params = new URLSearchParams(window.location.search);
    const eventId = params.get('id');
    const eventType = params.get('type');

    if (!eventId || !eventType) {
        eventContent.innerHTML = `<div class="p-12 text-center text-gray-500 italic">Event not found.</div>`;
        return;
    }

    const { data: event, error } = await supabase
        .from(eventType)
        .select('*')
        .eq('id', eventId)
        .single();

    if (error || !event) {
        eventContent.innerHTML = `<div class="p-12 text-center text-gray-500 italic">Error loading event details.</div>`;
        return;
    }

    renderEvent(event, eventType);
}

/**
 * RENDER: Builds the page HTML dynamically
 */
async function renderEvent(event, type) {
    const { data: { session } } = await supabase.auth.getSession();
    const currentUser = session?.user;

    eventContent.innerHTML = `
        <article class="max-w-5xl mx-auto p-4 md:p-8">
            <div class="relative h-[400px] md:h-[500px] rounded-3xl overflow-hidden shadow-2xl mb-8">
                <img src="${event.image_url || 'assets/landscape-placeholder.svg'}" class="w-full h-full object-cover">
                <div class="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
                <div class="absolute bottom-8 left-8 text-white">
                    <span class="bg-blue-600 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                        ${type === 'tournaments' ? 'Tournament' : 'Coaching'}
                    </span>
                    <h1 class="text-4xl md:text-6xl font-black news-headline mt-4">${event.title}</h1>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div class="lg:col-span-2 space-y-8">
                    <div class="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                        <h2 class="text-2xl font-bold mb-4 border-b pb-2">About this Event</h2>
                        <p class="text-slate-600 leading-relaxed whitespace-pre-wrap text-lg mb-8">
                            ${event.description || 'No description provided for this event.'}
                        </p>
                    </div>

                    <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
                        <div>
                            <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Players Interested</p>
                            <h4 id="interest-count" class="text-4xl font-black text-slate-900 mt-1">0</h4>
                        </div>
                        <div class="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full">
                            <span class="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping"></span>
                            <span class="text-xs font-bold text-green-700 uppercase tracking-tight">Live Activity</span>
                        </div>
                    </div>
                </div>

                <div class="space-y-6">
                    <div class="bg-slate-900 text-white p-8 rounded-3xl shadow-xl">
                        <h3 class="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Key Information</h3>
                        <div class="space-y-6">
                            <div>
                                <p class="text-slate-400 text-[10px] uppercase font-bold tracking-widest">Date</p>
                                <p class="text-xl font-bold">${new Date(event.date).toLocaleDateString('en-GB', { dateStyle: 'full' })}</p>
                            </div>

                            ${event.location ? `
                            <div>
                                <p class="text-slate-400 text-[10px] uppercase font-bold tracking-widest">Location</p>
                                <p class="text-xl font-bold">${event.location}</p>
                            </div>
                            ` : ''}

                            <div class="pt-4 space-y-3">
                                ${event.registration_link ? `
                                    <a href="${event.registration_link}" target="_blank" class="block w-full text-center bg-white text-slate-900 font-black py-4 rounded-xl transition-all shadow-lg uppercase tracking-wider text-sm hover:bg-slate-100 border-2 border-white">
                                        Enter Tournament Online
                                    </a>
                                ` : ''}

                                ${currentUser ? `
                                    <button id="register-interest-btn" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl transition-all shadow-lg uppercase tracking-wider text-sm">
                                        Register Interest
                                    </button>
                                    <p id="reg-msg" class="mt-3 text-center text-xs text-slate-400 hidden italic"></p>
                                ` : `
                                    <a href="login.html" class="block text-center w-full bg-slate-700 text-white font-bold py-4 rounded-xl hover:bg-slate-600 transition">
                                        Login to Register
                                    </a>
                                `}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </article>
    `;

    updateInterestCount(event.id);
    if (currentUser) setupRegistration(event.id, type, currentUser.id);
}

/**
 * COUNTER: Logic to fetch and animate the registration count
 */
async function updateInterestCount(eventId) {
    const countEl = document.getElementById('interest-count');
    const { count, error } = await supabase
        .from('registrations')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId);

    if (!error && countEl) {
        animateValue(countEl, parseInt(countEl.innerText) || 0, count, 1000);
    }
}

function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
}

/**
 * REGISTRATION: Toggle logic for registering/unregistering interest
 */
async function setupRegistration(eventId, type, userId) {
    const btn = document.getElementById('register-interest-btn');
    const msg = document.getElementById('reg-msg');

    const updateButtonStyle = (isRegistered) => {
        if (isRegistered) {
            btn.innerText = 'Unregister Interest';
            btn.classList.remove('bg-blue-600', 'hover:bg-blue-500');
            btn.classList.add('bg-green-600', 'hover:bg-red-600');
            btn.dataset.state = 'registered';
        } else {
            btn.innerText = 'Register Interest';
            btn.classList.remove('bg-green-600', 'hover:bg-red-600');
            btn.classList.add('bg-blue-600', 'hover:bg-blue-500');
            btn.dataset.state = 'unregistered';
        }
    };

    const { data: existing } = await supabase
        .from('registrations')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .single();

    updateButtonStyle(!!existing);

    btn.onclick = async () => {
        const isRegistered = btn.dataset.state === 'registered';
        btn.disabled = true;
        btn.innerText = isRegistered ? 'Removing...' : 'Registering...';
        msg.classList.add('hidden');

        try {
            if (isRegistered) {
                const { error } = await supabase
                    .from('registrations')
                    .delete()
                    .eq('event_id', eventId)
                    .eq('user_id', userId);
                if (error) throw error;
                updateButtonStyle(false);
                msg.innerText = "Interest removed.";
            } else {
                const { error } = await supabase
                    .from('registrations')
                    .insert([{ user_id: userId, event_id: eventId, event_type: type }]);
                if (error) throw error;
                updateButtonStyle(true);
                msg.innerText = "Success! You are on the list.";
            }
            msg.classList.remove('hidden', 'text-red-600');
            msg.classList.add('text-green-600');
        } catch (err) {
            msg.innerText = "Error: " + err.message;
            msg.classList.remove('hidden', 'text-green-600');
            msg.classList.add('text-red-600');
            updateButtonStyle(isRegistered);
        } finally {
            btn.disabled = false;
            updateInterestCount(eventId);
        }
    };
}

initEventPage();