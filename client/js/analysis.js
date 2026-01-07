import { GameEngine } from './gameEngine.js';

function handlePromotion(square, color) {
  const squareEl = document.getElementById(`square-${square}`);
  const container = document.createElement("div");
  container.className = "absolute flex bg-white border shadow-xl p-1 gap-1 z-50 rounded";

  ["queen", "rook", "bishop", "knight"].forEach(type => {
    const img = document.createElement("img");
    img.src = `./assets/pieces/${color}-${type}.svg`;
    img.className = "w-10 h-10 cursor-pointer hover:bg-gray-200 p-1";
    img.onclick = (e) => {
      e.stopPropagation();
      GameEngine.state.pieces[square] = `${color}-${type}`;
      GameEngine.state.promotionPending = null;
      GameEngine.state.currentTurn = GameEngine.state.currentTurn === "w" ? "b" : "w";
      container.remove();
      GameEngine.render();
    };
    container.appendChild(img);
  });
  squareEl.appendChild(container);
}

window.addEventListener('DOMContentLoaded', () => {
  // Initial draw
  GameEngine.render();

  const board = document.querySelector('chess-board');
  if (board) {
    board.addEventListener('click', (e) => {
      if (GameEngine.state.promotionPending) return;

      const square = e.target.closest("[id^='square-']");
      if (!square) return;
      const clicked = square.id.replace("square-", "");

      // If a piece is already selected...
      if (GameEngine.state.selectedSquare) {
        // ...and we click it again, deselect.
        if (GameEngine.state.selectedSquare === clicked) {
          GameEngine.state.selectedSquare = null;
          GameEngine.render();
          return;
        }
        
        // ...otherwise, try to move there.
        GameEngine.executeMove(GameEngine.state.selectedSquare, clicked, handlePromotion);
      } 
      // If no piece is selected, try to select one.
      else if (GameEngine.state.pieces[clicked]?.startsWith(GameEngine.state.currentTurn)) {
        GameEngine.state.selectedSquare = clicked;
        GameEngine.render(); // render() now automatically calls highlightValidMoves
      }
    });
  }

  // Button Listeners
  document.getElementById("undo-button")?.addEventListener("click", () => GameEngine.undo());
  document.getElementById("reset-button")?.addEventListener("click", () => location.reload());
});