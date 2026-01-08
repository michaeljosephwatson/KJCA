class WorkInProgress extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    const title = this.getAttribute('title') || 'Feature Coming Soon';
    const message = this.getAttribute('message') || "We're currently working hard to bring this feature to life. Check back later!";

    this.innerHTML = `
      <div class="flex flex-col items-center justify-center p-12 text-center bg-white rounded-xl shadow-sm border border-gray-100 my-8">
        <img 
          src="assets/working-progress.svg" 
          alt="Work in Progress" 
          class="w-64 h-64 mb-6 animate-pulse"
        >
        <h2 class="text-3xl font-bold text-slate-800 mb-2">${title}</h2>
        <p class="text-gray-600 max-w-md mx-auto leading-relaxed">
          ${message}
        </p>
        <div class="mt-8 flex gap-4">
          <a href="index.html" class="bg-slate-800 text-white px-6 py-2 rounded-lg hover:bg-slate-700 transition font-medium">
            Return Home
          </a>
        </div>
      </div>
    `;
  }
}

if (!customElements.get('work-in-progress')) {
  customElements.define('work-in-progress', WorkInProgress);
}