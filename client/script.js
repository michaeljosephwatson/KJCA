const pieces = {
  a1: "w-rook", b1: "w-knight", c1: "w-bishop", d1: "w-queen",
  e1: "w-king", f1: "w-bishop", g1: "w-knight", h1: "w-rook",
  a2: "w-pawn", b2: "w-pawn", c2: "w-pawn", d2: "w-pawn",
  e2: "w-pawn", f2: "w-pawn", g2: "w-pawn", h2: "w-pawn",

  a8: "b-rook", b8: "b-knight", c8: "b-bishop", d8: "b-queen",
  e8: "b-king", f8: "b-bishop", g8: "b-knight", h8: "b-rook",
  a7: "b-pawn", b7: "b-pawn", c7: "b-pawn", d7: "b-pawn",
  e7: "b-pawn", f7: "b-pawn", g7: "b-pawn", h7: "b-pawn",
};

let selectedPiece = null;
let selectedSquare = null;

function renderPieces(pieceMap) {

  for (const square in pieceMap) {
    const squareEl = document.getElementById(`square-${square}`);
    const img = document.createElement("img");
    img.src = `./assets/pieces/${pieceMap[square]}.svg`;
    img.alt = pieceMap[square];
    img.classList.add("w-full", "h-full", "select-none");
    squareEl.appendChild(img);
  }

  const squares = document.querySelectorAll("[id^='square-']");
  squares.forEach((squareEl) => {
    squareEl.addEventListener("click", function () {
      if (selectedPiece) {

        const targetPiece = squareEl.querySelector("img");
        if (targetPiece) targetPiece.remove();
        squareEl.appendChild(selectedPiece);

        // Remove highlight from old square
        if (selectedSquare) selectedSquare.classList.remove("bg-orange-400");

        selectedPiece = null;
        selectedSquare = null;

      } else {
        const piece = squareEl.querySelector("img");
        if (piece) {
            
          selectedPiece = piece;
          selectedSquare = squareEl;

          // Highlight the square
          squareEl.classList.add("bg-orange-400");
        }
      }
    });
  });
}
renderPieces(pieces);
