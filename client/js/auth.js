import { supabase } from './supabaseClient.js';

// --- Elements ---
const authForm = document.getElementById('auth-form'); // For Login
const signupForm = document.getElementById('signup-form'); // For Registration

const msg = document.getElementById('auth-msg'); // General messages
const regMsg = document.getElementById('reg-msg'); // Registration specific messages

/**
 * HANDLE LOGIN
 * Uses the simple email/password form
 */
if (authForm) {
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            msg.style.color = "red";
            msg.innerText = error.message;
        } else {
            window.location.href = 'index.html';
        }
    });
}

/**
 * HANDLE SIGN UP (REGISTRATION)
 * Collects Username, DOB, Postcode, Codes, and validates Password
 */
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // 1. Grab all values
        const email = document.getElementById('reg-email').value;
        const username = document.getElementById('reg-username').value;
        const password = document.getElementById('reg-password').value;
        const confirmPassword = document.getElementById('reg-password-confirm').value;
        const dob = document.getElementById('reg-dob').value;
        const postcode = document.getElementById('reg-postcode').value;
        const fide = document.getElementById('reg-fide').value;
        const ecf = document.getElementById('reg-ecf').value;

        // 2. Client-side Validation: Password Match
        if (password !== confirmPassword) {
            regMsg.style.color = "red";
            regMsg.innerText = "Passwords do not match!";
            return;
        }

        // 3. Supabase Sign Up with Metadata
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    username: username,
                    dob: dob,
                    postcode: postcode,
                    fide_code: fide || null, // Optional
                    ecf_code: ecf || null,   // Optional
                    type: 'player'           // Default role
                }
            }
        });

        if (error) {
            regMsg.style.color = "red";
            regMsg.innerText = error.message;
        } else {
            regMsg.style.color = "green";
            regMsg.innerText = "Success! Please check your email to confirm your account.";
            signupForm.reset();
        }
    });
}