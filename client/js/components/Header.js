import { supabase } from '../supabaseClient.js';

class MainHeader extends HTMLElement {
  constructor() {
    super();
    this.user = null;
  }

  async connectedCallback() {
    // 1. Initial Render
    this.render();

    // 2. Check for existing session
    const { data: { session } } = await supabase.auth.getSession();
    this.user = session?.user;
    this.render();

    // 3. Listen for changes
    supabase.auth.onAuthStateChange((event, session) => {
      this.user = session?.user;
      this.render();
    });
  }

  render() {
    this.innerHTML = `
      <header class="bg-slate-800 text-white p-4 shadow-lg flex justify-between items-center w-full">
        <h1 class="text-2xl font-bold tracking-tight">KJCA CHESS</h1>
        <nav class="flex gap-6 items-center">
          <a href="index.html" class="hover:text-blue-400 transition">Home</a>
          <a href="play.html" class="hover:text-blue-400 transition">Play</a>
          <a href="analysis.html" class="hover:text-blue-400 transition">Analysis</a>
          
          ${this.user ? `
            <div class="flex items-center gap-4 border-l border-slate-600 pl-6">
              <span class="text-gray-400 text-sm hidden md:inline">${this.user.email}</span>
              <button id="logout-btn" class="bg-red-600 px-3 py-1 rounded text-sm hover:bg-red-700 transition">Logout</button>
            </div>
          ` : `
            <a href="login.html" class="hover:text-blue-400 transition font-semibold">Login</a>
          `}
        </nav>
      </header>
    `;

    const logoutBtn = this.querySelector('#logout-btn');
    if (logoutBtn) {
      logoutBtn.onclick = async () => {
        await supabase.auth.signOut();
        window.location.href = 'index.html';
      };
    }
  }
}

if (!customElements.get('main-header')) {
  customElements.define('main-header', MainHeader);
}