import { supabase } from './supabaseClient.js';

const authForm = document.getElementById('auth-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const msg = document.getElementById('auth-msg');

// Handle Sign Up
document.getElementById('btn-signup').addEventListener('click', async () => {
    const { data, error } = await supabase.auth.signUp({
        email: emailInput.value,
        password: passwordInput.value,
    });

    if (error) msg.innerText = error.message;
    else msg.innerText = "Check your email for a confirmation link!";
});

// Handle Login
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const { data, error } = await supabase.auth.signInWithPassword({
        email: emailInput.value,
        password: passwordInput.value,
    });

    if (error) msg.innerText = error.message;
    else window.location.href = 'index.html';
});