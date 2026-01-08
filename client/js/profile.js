import { supabase } from './supabaseClient.js';

// DOM Elements
const avatarImg = document.getElementById('profile-avatar');
const avatarInput = document.getElementById('avatar-upload');
const passwordSection = document.getElementById('password-section');
const passwordForm = document.getElementById('password-form');
const pwStatus = document.getElementById('pw-status');
const showPwBtn = document.getElementById('show-pw-form');
const hidePwBtn = document.getElementById('hide-pw-form');

/**
 * HELPER: In-page status feedback
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
 * INITIAL LOAD: Fetch profile and handle default avatar
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

    // Populate UI
    document.getElementById('profile-name').innerText = profile.username || 'User';
    document.getElementById('profile-role').innerText = profile.type || 'Member';
    document.getElementById('info-username').innerText = profile.username || '---';
    document.getElementById('info-email').innerText = session.user.email;
    document.getElementById('info-postcode').innerText = profile.postcode || '---';
    document.getElementById('info-dob').innerText = profile.dob ? new Date(profile.dob).toLocaleDateString('en-GB') : '---';

    // FALLBACK LOGIC: Use user's photo or the default SVG asset
    if (profile.avatar_url) {
        avatarImg.src = profile.avatar_url;
    } else {
        avatarImg.src = 'assets/no-profile-pic.svg';
    }
}

/**
 * PASSWORD UPDATE: Secure identity-verification workflow
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
    pwStatus.classList.add('hidden');

    try {
        const { data: { session } } = await supabase.auth.getSession();
        
        // Step 1: Verify current password
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: session.user.email,
            password: currentPassword,
        });

        if (signInError) throw new Error("Verification failed: Current password is incorrect.");

        // Step 2: Save new password
        submitBtn.innerText = "Saving New Password...";
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
 * AVATAR UPLOAD: Storage upload & DB update
 */
avatarInput.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session.user.id;
        const fileName = `${userId}-${Date.now()}.${file.name.split('.').pop()}`;
        const filePath = `avatars/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('tournament-images') 
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('tournament-images')
            .getPublicUrl(filePath);

        const { error: updateError } = await supabase
            .from('profiles')
            .update({ avatar_url: publicUrl })
            .eq('id', userId);

        if (updateError) throw updateError;

        avatarImg.src = publicUrl;

    } catch (err) {
        console.error("Upload Error: " + err.message);
    }
};

loadProfile();