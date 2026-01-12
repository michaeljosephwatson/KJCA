import { supabase } from './supabaseClient.js';

const authForm = document.getElementById('auth-form'); 
const signupForm = document.getElementById('signup-form'); 
const msg = document.getElementById('auth-msg'); 
const regMsg = document.getElementById('reg-msg'); 

/**
 * LOGIN
 */
if (authForm) {
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        msg.innerText = "Logging in...";
        msg.style.color = "gray";
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            msg.style.color = "red";
            msg.innerText = error.message;
        } else {
            window.location.href = 'index.html';
        }
    });
}

/**
 * SIGN UP
 */
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        regMsg.innerText = "Processing registration...";
        regMsg.style.color = "gray";
        
        const email = document.getElementById('reg-email').value;
        const username = document.getElementById('reg-username').value;
        const password = document.getElementById('reg-password').value;
        const confirmPassword = document.getElementById('reg-password-confirm').value;
        const dob = document.getElementById('reg-dob').value;
        
        // Optional Values handling
        const postcode = document.getElementById('reg-postcode').value.trim() || null;
        const fide = document.getElementById('reg-fide').value.trim() || null;
        const ecf = document.getElementById('reg-ecf').value.trim() || null;

        if (password !== confirmPassword) {
            regMsg.style.color = "red";
            regMsg.innerText = "Passwords do not match!";
            return;
        }

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username,
                    dob,
                    postcode,
                    fide_code: fide,
                    ecf_code: ecf,
                    type: 'player' 
                }
            }
        });

        if (error) {
            regMsg.style.color = "red";
            regMsg.innerText = error.message;
        } else {
            regMsg.style.color = "green";
            regMsg.innerText = "Check your email for the confirmation link!";
            signupForm.reset();
        }
    });
}