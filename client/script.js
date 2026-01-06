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
let currentTurn = "w";
let lastMove = null; // For en passant

function squareToCoords(square) {
  const file = square[0];
  const rank = square[1];
  return [file.charCodeAt(0) - "a".charCodeAt(0), parseInt(rank) - 1];
}

function coordsToSquare(x, y) {
  return String.fromCharCode("a".charCodeAt(0) + x) + (y + 1);
}

function isPathClear(from, to, pieces) {
  const [x1, y1] = squareToCoords(from);
  const [x2, y2] = squareToCoords(to);
  const dx = Math.sign(x2 - x1);
  const dy = Math.sign(y2 - y1);
  let x = x1 + dx;
  let y = y1 + dy;
  while (x !== x2 || y !== y2) {
    if (pieces[coordsToSquare(x, y)]) return false;
    x += dx;
    y += dy;
  }
  return true;
}

function validatePawnMove(color, dx, dy, from, to, pieces, targetPiece) {
  const direction = color === "w" ? 1 : -1;
  const startRank = color === "w" ? 1 : 6;
  const [x1, y1] = squareToCoords(from);
  const [x2, y2] = squareToCoords(to);

  // Forward 1
  if (dx === 0 && dy === direction && !targetPiece) return true;
  // Forward 2 from start
  if (dx === 0 && dy === 2 * direction && y1 === startRank) {
    const intermediate = coordsToSquare(x1, y1 + direction);
    if (!pieces[intermediate] && !targetPiece) return true;
  }
  // Capture
  if (Math.abs(dx) === 1 && dy === direction && targetPiece) return true;

  // En passant
  if (Math.abs(dx) === 1 && dy === direction && !targetPiece && lastMove) {
    const [lx1, ly1] = squareToCoords(lastMove.from);
    const [lx2, ly2] = squareToCoords(lastMove.to);
    const movedPiece = lastMove.piece;
    if (
      movedPiece === (color === "w" ? "b-pawn" : "w-pawn") &&
      Math.abs(ly2 - ly1) === 2 &&
      ly2 === y1 &&
      lx2 === x2
    ) return true;
  }

  return false;
}

function validateRookMove(dx, dy, from, to, pieces) {
  if (dx !== 0 && dy !== 0) return false;
  return isPathClear(from, to, pieces);
}

function validateKnightMove(dx, dy) {
  return (Math.abs(dx) === 1 && Math.abs(dy) === 2) || (Math.abs(dx) === 2 && Math.abs(dy) === 1);
}

function validateBishopMove(dx, dy, from, to, pieces) {
  if (Math.abs(dx) !== Math.abs(dy)) return false;
  return isPathClear(from, to, pieces);
}

function validateQueenMove(dx, dy, from, to, pieces) {
  if (dx === 0 || dy === 0 || Math.abs(dx) === Math.abs(dy)) return isPathClear(from, to, pieces);
  return false;
}

function validateKingMove(dx, dy) {
  return Math.abs(dx) <= 1 && Math.abs(dy) <= 1;
}

function isValidMove(pieceName, from, to, pieces) {
  const [x1, y1] = squareToCoords(from);
  const [x2, y2] = squareToCoords(to);
  const dx = x2 - x1;
  const dy = y2 - y1;
  const targetPiece = pieces[to] || null;
  const color = pieceName.startsWith("w") ? "w" : "b";

  if (targetPiece && targetPiece.startsWith(color)) return false;

  const type = pieceName.split("-")[1];
  switch (type) {
    case "pawn": return validatePawnMove(color, dx, dy, from, to, pieces, targetPiece);
    case "rook": return validateRookMove(dx, dy, from, to, pieces);
    case "knight": return validateKnightMove(dx, dy);
    case "bishop": return validateBishopMove(dx, dy, from, to, pieces);
    case "queen": return validateQueenMove(dx, dy, from, to, pieces);
    case "king": return validateKingMove(dx, dy);
    default: return false;
  }
}

function isKingInCheck(color, pieces) {
  let kingSquare;
  for (const square in pieces) {
    if (pieces[square] === `${color}-king`) {
      kingSquare = square;
      break;
    }
  }
  if (!kingSquare) return true;

  const opponentColor = color === "w" ? "b" : "w";
  for (const square in pieces) {
    const piece = pieces[square];
    if (piece.startsWith(opponentColor)) {
      if (isValidMove(piece, square, kingSquare, pieces)) return true;
    }
  }
  return false;
}

function renderPieces(pieceMap) {
  const squares = document.querySelectorAll("[id^='square-']");
  squares.forEach((squareEl) => {
    squareEl.innerHTML = "";
    squareEl.classList.remove("bg-orange-400", "bg-green-400");
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

function highlightValidMoves(fromSquare, pieceName, pieces) {
  const squares = document.querySelectorAll("[id^='square-']");
  squares.forEach(sq => {
    const sqName = sq.id.replace("square-", "");
    if (sqName !== fromSquare) {
      const testPieces = JSON.parse(JSON.stringify(pieces));
      delete testPieces[fromSquare];
      testPieces[sqName] = pieceName;

      if (isValidMove(pieceName, fromSquare, sqName, pieces) && !isKingInCheck(pieceName.startsWith("w") ? "w" : "b", testPieces)) {
        sq.classList.add("bg-green-400");
      }
    }
  });
}

function attachSquareClickListeners() {
  const squares = document.querySelectorAll("[id^='square-']");
  squares.forEach((squareEl) => {
    squareEl.addEventListener("click", () => {
      const img = squareEl.querySelector("img");
      const clickedSquare = squareEl.id.replace("square-", "");

      if (selectedPiece) {
        const oldSquare = selectedSquare.id.replace("square-", "");
        const newSquare = clickedSquare;
        const pieceName = pieces[oldSquare];

        const testPieces = JSON.parse(JSON.stringify(pieces));
        delete testPieces[oldSquare];
        testPieces[newSquare] = pieceName;

        // --- Handle en passant ---
        const [x1, y1] = squareToCoords(oldSquare);
        const [x2, y2] = squareToCoords(newSquare);
        let enPassantCaptured = null;

        if (
          pieceName.endsWith("pawn") &&
          Math.abs(x2 - x1) === 1 &&
          !pieces[newSquare] &&
          lastMove
        ) {
          const lastPiece = lastMove.piece;
          const [lx1, ly1] = squareToCoords(lastMove.from);
          const [lx2, ly2] = squareToCoords(lastMove.to);
          if (
            lastPiece === (pieceName.startsWith("w") ? "b-pawn" : "w-pawn") &&
            Math.abs(ly2 - ly1) === 2 &&
            lx2 === x2 &&
            ly2 === y1
          ) {
            const capturedPawnSquare = coordsToSquare(x2, y1); // square behind landing pawn
            delete testPieces[capturedPawnSquare];
            enPassantCaptured = capturedPawnSquare; // Save to remove DOM
          }
        }

        if (isValidMove(pieceName, oldSquare, newSquare, pieces) && !isKingInCheck(currentTurn, testPieces)) {
          // Save state before move
          history.push({ pieces: JSON.parse(JSON.stringify(pieces)), turn: currentTurn, lastMove });

          pieces = testPieces;
          if (img) img.remove();
          squareEl.appendChild(selectedPiece);

          // Remove en passant captured piece from DOM
          if (enPassantCaptured) {
            const capturedEl = document.getElementById(`square-${enPassantCaptured}`).querySelector("img");
            if (capturedEl) capturedEl.remove();
          }

          lastMove = { piece: pieceName, from: oldSquare, to: newSquare };
          currentTurn = currentTurn === "w" ? "b" : "w";
        }

        selectedSquare.classList.remove("bg-orange-400");
        document.querySelectorAll("[id^='square-']").forEach(sq => sq.classList.remove("bg-green-400"));
        selectedPiece = null;
        selectedSquare = null;

      } else if (img) {
        const pieceName = pieces[clickedSquare];
        if (!pieceName.startsWith(currentTurn)) return;

        selectedPiece = img;
        selectedSquare = squareEl;
        squareEl.classList.add("bg-orange-400");
        highlightValidMoves(clickedSquare, pieceName, pieces);
      }
    });
  });
}

// --- Undo button ---
document.getElementById("undo-button").addEventListener("click", () => {
  if (history.length === 0) return;
  const lastState = history.pop();
  pieces = lastState.pieces;
  currentTurn = lastState.turn;
  lastMove = lastState.lastMove;
  renderPieces(pieces);
  selectedPiece = null;
  selectedSquare = null;
});

// --- Initialize ---
attachSquareClickListeners();
renderPieces(pieces);
