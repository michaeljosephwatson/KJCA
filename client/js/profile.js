import { supabase } from './supabaseClient.js';

// DOM Elements
const avatarImg = document.getElementById('profile-avatar');
const avatarInput = document.getElementById('avatar-upload');
const passwordSection = document.getElementById('password-section');
const passwordForm = document.getElementById('password-form');
const pwStatus = document.getElementById('pw-status');
const showPwBtn = document.getElementById('show-pw-form');
const hidePwBtn = document.getElementById('hide-pw-form');

// Deletion Elements
const deleteInitial = document.getElementById('delete-initial');
const deleteConfirmPanel = document.getElementById('delete-confirm-panel');
const showDeleteBtn = document.getElementById('show-delete-confirm');
const cancelDeleteBtn = document.getElementById('cancel-delete');
const executeDeleteBtn = document.getElementById('execute-delete');

/**
 * HELPER: UI Feedback
 */
function showStatus(message, isError = true) {
    pwStatus.innerText = message;
    pwStatus.classList.remove('hidden', 'bg-red-50', 'text-red-600', 'bg-green-50', 'text-green-600');
    if (isError) {
        pwStatus.classList.add('bg-red-50', 'text-red-600');
    } else {
        pwStatus.classList.add('bg-green-50', 'text-green-600');
    }
}

/**
 * DATA LOAD: Profile Information
 */
async function loadProfile() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = 'login.html';
        return;
    }

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

    if (error) return console.error("Profile load error:", error.message);

    // Sidebar Info
    document.getElementById('profile-name').innerText = profile.username || 'User';
    document.getElementById('profile-role').innerText = profile.type || 'Member';
    avatarImg.src = profile.avatar_url || 'assets/no-profile-pic.svg';

    // Main Info Grid
    document.getElementById('info-username').innerText = profile.username || '---';
    document.getElementById('info-email').innerText = session.user.email;
    document.getElementById('info-ecf').innerText = profile.ecf_code || 'Not Provided';
    document.getElementById('info-fide').innerText = profile.fide_code || 'Not Provided';
    document.getElementById('info-postcode').innerText = profile.postcode || '---';
    document.getElementById('info-dob').innerText = profile.dob ? new Date(profile.dob).toLocaleDateString('en-GB') : '---';
}

/**
 * SECURITY: Password Management
 */
showPwBtn.onclick = () => {
    passwordSection.classList.remove('hidden');
    pwStatus.classList.add('hidden');
};
hidePwBtn.onclick = () => {
    passwordSection.classList.add('hidden');
    passwordForm.reset();
};

passwordForm.onsubmit = async (e) => {
    e.preventDefault();
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const submitBtn = document.getElementById('pw-submit-btn');

    if (newPassword !== confirmPassword) {
        showStatus("New passwords do not match.");
        return;
    }

    submitBtn.disabled = true;
    submitBtn.innerText = "Verifying Identity...";

    try {
        const { data: { session } } = await supabase.auth.getSession();
        
        // 1. Re-authenticate
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: session.user.email,
            password: currentPassword,
        });

        if (signInError) throw new Error("Incorrect current password.");

        // 2. Update
        const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
        if (updateError) throw updateError;

        showStatus("Password updated successfully!", false);
        setTimeout(() => {
            passwordSection.classList.add('hidden');
            passwordForm.reset();
        }, 2000);

    } catch (err) {
        showStatus(err.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = "Update Password";
    }
};

/**
 * ASSETS: Avatar Upload
 */
avatarInput.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session.user.id;
        const filePath = `avatars/${userId}-${Date.now()}`;

        const { error: uploadError } = await supabase.storage
            .from('tournament-images') 
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('tournament-images')
            .getPublicUrl(filePath);

        await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', userId);
        avatarImg.src = publicUrl;

    } catch (err) {
        console.error("Upload Error: " + err.message);
    }
};

/**
 * DANGER ZONE: Account Deletion
 */
showDeleteBtn.onclick = () => {
    deleteInitial.classList.add('hidden');
    deleteConfirmPanel.classList.remove('hidden');
};

cancelDeleteBtn.onclick = () => {
    deleteInitial.classList.remove('hidden');
    deleteConfirmPanel.classList.add('hidden');
};

executeDeleteBtn.onclick = async () => {
    executeDeleteBtn.disabled = true;
    executeDeleteBtn.innerText = "Wiping Data...";

    try {
        const { data: { session } } = await supabase.auth.getSession();
        // Deleting the profile row will trigger the SQL function to wipe the Auth record
        const { error } = await supabase.from('profiles').delete().eq('id', session.user.id);
        if (error) throw error;

        await supabase.auth.signOut();
        window.location.href = 'index.html';
    } catch (err) {
        alert("Error: " + err.message);
        executeDeleteBtn.disabled = false;
        executeDeleteBtn.innerText = "Yes, Delete Everything";
    }
};

loadProfile();