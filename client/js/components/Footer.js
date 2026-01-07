/**
 * A reusable Footer component that matches the Header styling.
 */
export class MainFooter extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.innerHTML = `
      <footer style="background-color: #1e293b; color: #d1d5db; margin-top: 2rem; width: 100%; font-family: sans-serif;">
        <div style="max-width: 80rem; margin: 0 auto; padding: 1.5rem 1rem; display: flex; flex-direction: column; align-items: center; justify-content: space-between; gap: 1rem;">
          
          <p style="font-size: 0.875rem; margin: 0;">
            © 2026 <span style="font-weight: 600; color: white;">KJCA</span>. All rights reserved.
          </p>

          <div style="display: flex; gap: 1.5rem; font-size: 0.875rem;">
            <a href="about.html" style="color: #d1d5db; text-decoration: none; transition: color 0.2s;" onmouseover="this.style.color='white'" onmouseout="this.style.color='#d1d5db'">About</a>
            <a href="rules.html" style="color: #d1d5db; text-decoration: none; transition: color 0.2s;" onmouseover="this.style.color='white'" onmouseout="this.style.color='#d1d5db'">Rules</a>
            <a href="contact.html" style="color: #d1d5db; text-decoration: none; transition: color 0.2s;" onmouseover="this.style.color='white'" onmouseout="this.style.color='#d1d5db'">Contact</a>
          </div>

        </div>
      </footer>
    `;
  }
}

// Register the custom element <main-footer></main-footer>
if (!customElements.get('main-footer')) {
  customElements.define('main-footer', MainFooter);
}