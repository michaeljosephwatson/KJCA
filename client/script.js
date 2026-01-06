let pieces = {
  a1: "w-rook", b1: "w-knight", c1: "w-bishop", d1: "w-queen",
  e1: "w-king", f1: "w-bishop", g1: "w-knight", h1: "w-rook",
  a2: "w-pawn", b2: "w-pawn", c2: "w-pawn", d2: "w-pawn",
  e2: "w-pawn", f2: "w-pawn", g2: "w-pawn", h2: "w-pawn",
  a8: "b-rook", b8: "b-knight", c8: "b-bishop", d8: "b-queen",
  e8: "b-king", f8: "b-bishop", g8: "b-knight", h8: "b-rook",
  a7: "b-pawn", b7: "b-pawn", c7: "b-pawn", d7: "b-pawn",
  e7: "b-pawn", f7: "b-pawn", g7: "b-pawn", h7: "b-pawn",
};
let history = [];
let selectedPiece = null;
let selectedSquare = null;

// Attach listeners
function attachSquareClickListeners() {
  const squares = document.querySelectorAll("[id^='square-']");
  squares.forEach((squareEl) => {
    squareEl.addEventListener("click", () => {
      const img = squareEl.querySelector("img");

      if (selectedPiece) {
        history.push(JSON.parse(JSON.stringify(pieces)));
        if (img) img.remove();

        // Move selected piece
        squareEl.appendChild(selectedPiece);

        // Update pieces object
        const oldSquare = selectedSquare.id.replace("square-", "");
        const newSquare = squareEl.id.replace("square-", "");
        pieces[newSquare] = pieces[oldSquare];
        delete pieces[oldSquare];

        selectedSquare.classList.remove("bg-orange-400");
        selectedPiece = null;
        selectedSquare = null;

      } else if (img) {
        selectedPiece = img;
        selectedSquare = squareEl;
        squareEl.classList.add("bg-orange-400");
      }
    });
  });
}

// Render board pieces
function renderPieces(pieceMap) {
  const squares = document.querySelectorAll("[id^='square-']");
  squares.forEach((squareEl) => {
    squareEl.innerHTML = "";
  });

  for (const square in pieceMap) {
    const squareEl = document.getElementById(`square-${square}`);
    const img = document.createElement("img");
    img.src = `./assets/pieces/${pieceMap[square]}.svg`;
    img.alt = pieceMap[square];
    img.classList.add("w-full", "h-full", "object-contain", "select-none", "cursor-pointer");
    squareEl.appendChild(img);
  }
}

// Undo button
document.getElementById("undo-button").addEventListener("click", () => {
  if (history.length === 0) return;

  pieces = history.pop();
  renderPieces(pieces);
  selectedPiece = null;
  selectedSquare = null;
});

attachSquareClickListeners();
renderPieces(pieces);
