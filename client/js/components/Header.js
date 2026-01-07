/**
 * A reusable Header component that can be used across all pages.
 */
class MainHeader extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <header class="bg-slate-800 text-white p-4 shadow-lg flex justify-between items-center w-full">
        <h1 class="text-2xl font-bold tracking-tight">KJCA CHESS</h1>
        <nav class="flex gap-6">
          <a href="index.html" class="hover:text-blue-400 transition">Home</a>
          <a href="play.html" class="hover:text-blue-400 transition">Play</a>
          <a href="analysis.html" class="hover:text-blue-400 transition">Analysis</a>
        </nav>
      </header>
    `;
  }
}

// Define the custom element <main-header></main-header>
customElements.define('main-header', MainHeader);