/**
 * Component that generates the 8x8 grid of squares.
 */
export class ChessBoard extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `<div id="board-grid" class="grid grid-cols-8 grid-rows-8 w-[600px] h-[600px] border-4 border-slate-700 shadow-2xl bg-slate-400"></div>`;
    const grid = this.querySelector('#board-grid');
    
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    for (let r = 7; r >= 0; r--) {
      for (let f = 0; f < 8; f++) {
        const squareName = `${files[f]}${r + 1}`;
        const isDark = (r + f) % 2 === 0;
        const square = document.createElement('div');
        square.id = `square-${squareName}`;
        square.className = `relative w-full h-full flex items-center justify-center ${isDark ? 'bg-slate-500' : 'bg-slate-200'}`;
        grid.appendChild(square);
      }
    }
  }
}

if (!customElements.get('chess-board')) {
  customElements.define('chess-board', ChessBoard);
}