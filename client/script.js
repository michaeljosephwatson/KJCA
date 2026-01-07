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
let lastMove = null;
let promotionPending = null;
let movedPieces = new Set();

function squareToCoords(square) {
  // Converts square to coordinate names
  return [square.charCodeAt(0) - "a".charCodeAt(0), parseInt(square[1]) - 1];
}

function coordsToSquare(x, y) {
  // Converts coordinates to square name
  return String.fromCharCode("a".charCodeAt(0) + x) + (y + 1);
}

function isPathClear(from, to, pieces) {
  // Checks if the path is clear between two coordinates

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

function isSquareAttacked(square, attackerColor, currentPieces) {
  // Checks if a square is under attack by any piece of attackerColor

  for (const s in currentPieces) {
    const piece = currentPieces[s];
    if (piece.startsWith(attackerColor)) {
      // Pass true to ignoreCastling to prevent infinite recursion
      if (isValidMove(piece, s, square, currentPieces, true)) return true;
    }
  }
  return false;
}

function validatePawnMove(color, dx, dy, from, to, pieces, targetPiece) {
  // Determines if the proposed move is valid for pawns

  const direction = color === "w" ? 1 : -1;
  const startRank = color === "w" ? 1 : 6;
  const [x1, y1] = squareToCoords(from);
  const [x2, y2] = squareToCoords(to);

  if (dx === 0 && dy === direction && !targetPiece) return true;
  if (dx === 0 && dy === 2 * direction && y1 === startRank) {
    const intermediate = coordsToSquare(x1, y1 + direction);
    if (!pieces[intermediate] && !targetPiece) return true;
  }
  if (Math.abs(dx) === 1 && dy === direction && targetPiece) return true;

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
  // Determines if the proposed move is valid for rooks
  if (dx !== 0 && dy !== 0) return false;
  return isPathClear(from, to, pieces);
}

function validateKnightMove(dx, dy) {
  // Determines if the proposed move is valid for knights
  return (Math.abs(dx) === 1 && Math.abs(dy) === 2) || (Math.abs(dx) === 2 && Math.abs(dy) === 1);
}

function validateBishopMove(dx, dy, from, to, pieces) {
  // Determines if the proposed move is valid for bishops
  if (Math.abs(dx) !== Math.abs(dy)) return false;
  return isPathClear(from, to, pieces);
}

function validateQueenMove(dx, dy, from, to, pieces) {
  // Determines if the proposed move is valid for queens
  if (dx === 0 || dy === 0 || Math.abs(dx) === Math.abs(dy)) return isPathClear(from, to, pieces);
  return false;
}

function validateKingMove(dx, dy, from, to, pieces, color, ignoreCastling) {
  // Determines if the proposed move is valid for pawns

  // Normal
  if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) return true;

  // Castling
  if (!ignoreCastling && Math.abs(dx) === 2 && dy === 0) {
    const rank = color === "w" ? "1" : "8";
    if (from !== `e${rank}`) return false;
    if (movedPieces.has(`e${rank}`)) return false;
    if (isKingInCheck(color, pieces)) return false;

    const isKingside = dx === 2;
    const rookSquare = isKingside ? `h${rank}` : `a${rank}`;
    const rookPiece = pieces[rookSquare];

    if (!rookPiece || movedPieces.has(rookSquare)) return false;

    const path = isKingside ? [`f${rank}`, `g${rank}`] : [`d${rank}`, `c${rank}`, `b${rank}`];
    for (let sq of path) if (pieces[sq]) return false;

    const opponentColor = color === "w" ? "b" : "w";
    const travelSquares = isKingside ? [`f${rank}`, `g${rank}`] : [`d${rank}`, `c${rank}`];
    for (let sq of travelSquares) {
      if (isSquareAttacked(sq, opponentColor, pieces)) return false;
    }
    return true;
  }
  return false;
}

function isValidMove(pieceName, from, to, pieces, ignoreCastling = false) {
  // Determines if the proposed move is valid

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
    case "king": return validateKingMove(dx, dy, from, to, pieces, color, ignoreCastling);
    default: return false;
  }
}

function isKingInCheck(color, pieces) {
  // Returns if the king is in check

  let kingSquare;
  for (const square in pieces) {
    if (pieces[square] === `${color}-king`) {
      kingSquare = square;
      break;
    }
  }
  if (!kingSquare) return true;
  return isSquareAttacked(kingSquare, color === "w" ? "b" : "w", pieces);
}

function renderPieces(pieceMap) {
  // Renders all the pieces on the board

  const squares = document.querySelectorAll("[id^='square-']");
  squares.forEach((squareEl) => {
    squareEl.innerHTML = "";
    squareEl.classList.remove("bg-orange-400", "bg-green-400");
  });

  for (const square in pieceMap) {
    const squareEl = document.getElementById(`square-${square}`);
    if (!squareEl) continue;
    const img = document.createElement("img");
    img.src = `./assets/pieces/${pieceMap[square]}.svg`;
    img.alt = pieceMap[square];
    img.classList.add("w-full", "h-full", "object-contain", "select-none", "cursor-pointer");
    squareEl.appendChild(img);
  }
}

function showPromotion(square, color) {
  // Allows the user to see the promotion list 

  const squareEl = document.getElementById(`square-${square}`);
  const container = document.createElement("div");
  container.classList.add("promotion-container", "absolute", "flex", "bg-white", "border", "p-1", "gap-1", "z-50");

  ["queen", "rook", "bishop", "knight"].forEach(type => {
    const img = document.createElement("img");
    img.src = `./assets/pieces/${color}-${type}.svg`;
    img.alt = `${color}-${type}`;
    img.classList.add("w-8", "h-8", "cursor-pointer");
    img.addEventListener("click", () => {
      pieces[square] = `${color}-${type}`;
      renderPieces(pieces);
      container.remove();
      promotionPending = null;
      currentTurn = currentTurn === "w" ? "b" : "w";
    });
    container.appendChild(img);
  });
  squareEl.appendChild(container);
}

function highlightValidMoves(fromSquare, pieceName, pieces) {
  // Highlights the possible moves available per selected piece

  const squares = document.querySelectorAll("[id^='square-']");
  squares.forEach(sq => {
    const sqName = sq.id.replace("square-", "");
    if (sqName !== fromSquare) {
      if (isValidMove(pieceName, fromSquare, sqName, pieces)) {

        const testPieces = JSON.parse(JSON.stringify(pieces));
        const color = pieceName.startsWith("w") ? "w" : "b";
        delete testPieces[fromSquare];
        testPieces[sqName] = pieceName;
        
        if (!isKingInCheck(color, testPieces)) {
          sq.classList.add("bg-green-400");
        }
      }
    }
  });
}

function attachSquareClickListeners() {
  // Attaches listeners to each square in the board

  const squares = document.querySelectorAll("[id^='square-']");
  squares.forEach(squareEl => {
    squareEl.addEventListener("click", () => {
      if (promotionPending) return;

      const img = squareEl.querySelector("img");
      const clickedSquare = squareEl.id.replace("square-", "");

      if (selectedPiece) {
        const oldSquare = selectedSquare.id.replace("square-", "");
        const newSquare = clickedSquare;
        const pieceName = pieces[oldSquare];
        const [x1, y1] = squareToCoords(oldSquare);
        const [x2, y2] = squareToCoords(newSquare);

        const testPieces = JSON.parse(JSON.stringify(pieces));
        delete testPieces[oldSquare];
        testPieces[newSquare] = pieceName;

        // Handle En Passant Logic for validation
        let enPassantCaptured = null;
        if (pieceName.endsWith("pawn") && Math.abs(x2 - x1) === 1 && !pieces[newSquare] && lastMove) {
            const [lx1, ly1] = squareToCoords(lastMove.from);
            const [lx2, ly2] = squareToCoords(lastMove.to);
            if (lastMove.piece.endsWith("pawn") && Math.abs(ly2 - ly1) === 2 && lx2 === x2 && ly2 === y1) {
                enPassantCaptured = coordsToSquare(x2, y1);
                delete testPieces[enPassantCaptured];
            }
        }

        // Handle Castling
        if (pieceName.endsWith("king") && Math.abs(x2 - x1) === 2) {
            const rank = currentTurn === "w" ? "1" : "8";
            if (x2 > x1) { // Kingside
                delete testPieces[`h${rank}`];
                testPieces[`f${rank}`] = `${currentTurn}-rook`;
            } else { // Queenside
                delete testPieces[`a${rank}`];
                testPieces[`d${rank}`] = `${currentTurn}-rook`;
            }
        }

        if (isValidMove(pieceName, oldSquare, newSquare, pieces) && !isKingInCheck(currentTurn, testPieces)) {
          history.push({ 
            pieces: JSON.parse(JSON.stringify(pieces)), 
            turn: currentTurn, 
            lastMove,
            movedPieces: new Set(movedPieces) 
          });

          pieces = testPieces;
          movedPieces.add(oldSquare);

          const color = pieceName.startsWith("w") ? "w" : "b";
          const promotionRank = color === "w" ? 7 : 0;
          const [px, py] = squareToCoords(newSquare);

          if (pieceName.endsWith("pawn") && py === promotionRank) {
            promotionPending = newSquare;
            renderPieces(pieces);
            showPromotion(newSquare, color);
          } else {
            currentTurn = currentTurn === "w" ? "b" : "w";
            renderPieces(pieces);
          }

          lastMove = { piece: pieceName, from: oldSquare, to: newSquare };
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

document.getElementById("undo-button").addEventListener("click", () => {
  if (history.length === 0) return;
  const lastState = history.pop();
  pieces = lastState.pieces;
  currentTurn = lastState.turn;
  lastMove = lastState.lastMove;
  movedPieces = lastState.movedPieces || new Set();
  renderPieces(pieces);
  selectedPiece = null;
  selectedSquare = null;
  promotionPending = null;
});

attachSquareClickListeners();
renderPieces(pieces);