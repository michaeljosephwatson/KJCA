import { initialPieces } from './constants.js';
import { squareToCoords, coordsToSquare } from './utils.js';
import { isValidMove, isKingInCheck } from './validation.js';

/**
 * GAME STATE
 */
let pieces = { ...initialPieces };
let history = [];
let selectedPiece = null;
let selectedSquare = null;
let currentTurn = "w";
let lastMove = null;
let promotionPending = null;
let movedPieces = new Set();

/**
 * Renders pieces on the HTML board and clears highlights.
 */
function renderPieces(pieceMap) {
  const squares = document.querySelectorAll("[id^='square-']");
  squares.forEach(sq => {
    sq.innerHTML = "";
    sq.classList.remove("bg-orange-400", "bg-green-400");
  });
  for (const square in pieceMap) {
    const squareEl = document.getElementById(`square-${square}`);
    if (!squareEl) continue;
    const img = document.createElement("img");
    img.src = `./assets/pieces/${pieceMap[square]}.svg`;
    img.classList.add("w-full", "h-full", "object-contain", "select-none", "cursor-pointer");
    squareEl.appendChild(img);
  }
}

/**
 * Shows the pawn promotion selection UI.
 */
function showPromotion(square, color) {
  const squareEl = document.getElementById(`square-${square}`);
  const container = document.createElement("div");
  container.className = "promotion-container absolute flex bg-white border p-1 gap-1 z-50";

  ["queen", "rook", "bishop", "knight"].forEach(type => {
    const img = document.createElement("img");
    img.src = `./assets/pieces/${color}-${type}.svg`;
    img.className = "w-8 h-8 cursor-pointer hover:bg-gray-200";
    img.onclick = () => {
      pieces[square] = `${color}-${type}`;
      promotionPending = null;
      currentTurn = currentTurn === "w" ? "b" : "w";
      container.remove();
      renderPieces(pieces);
    };
    container.appendChild(img);
  });
  squareEl.appendChild(container);
}

/**
 * Highlights valid squares for the selected piece.
 */
function highlightValidMoves(fromSquare, pieceName) {
  const squares = document.querySelectorAll("[id^='square-']");
  squares.forEach(sq => {
    const sqName = sq.id.replace("square-", "");
    if (isValidMove(pieceName, fromSquare, sqName, pieces, movedPieces, lastMove)) {
      const testPieces = JSON.parse(JSON.stringify(pieces));
      delete testPieces[fromSquare];
      testPieces[sqName] = pieceName;
      if (!isKingInCheck(currentTurn, testPieces, movedPieces, lastMove)) {
        sq.classList.add("bg-green-400");
      }
    }
  });
}

/**
 * Processes a move attempt and updates history.
 */
function handleMove(oldSquare, newSquare) {
  const pieceName = pieces[oldSquare];
  const [x1, y1] = squareToCoords(oldSquare);
  const [x2, y2] = squareToCoords(newSquare);
  const testPieces = JSON.parse(JSON.stringify(pieces));
  delete testPieces[oldSquare];
  testPieces[newSquare] = pieceName;

  // Castling Side Effects
  if (pieceName.endsWith("king") && Math.abs(x2 - x1) === 2) {
    const rank = currentTurn === "w" ? "1" : "8";
    if (x2 > x1) { delete testPieces[`h${rank}`]; testPieces[`f${rank}`] = `${currentTurn}-rook`; }
    else { delete testPieces[`a${rank}`]; testPieces[`d${rank}`] = `${currentTurn}-rook`; }
  }

  // En Passant Side Effects
  if (pieceName.endsWith("pawn") && Math.abs(x2 - x1) === 1 && !pieces[newSquare]) {
     delete testPieces[coordsToSquare(x2, y1)];
  }

  if (isValidMove(pieceName, oldSquare, newSquare, pieces, movedPieces, lastMove) && 
      !isKingInCheck(currentTurn, testPieces, movedPieces, lastMove)) {
    
    // Save state
    history.push({ 
        pieces: JSON.parse(JSON.stringify(pieces)), 
        turn: currentTurn, 
        lastMove: lastMove ? { ...lastMove } : null, 
        movedPieces: new Set(movedPieces) 
    });

    pieces = testPieces;
    movedPieces.add(oldSquare);
    lastMove = { piece: pieceName, from: oldSquare, to: newSquare };

    const color = currentTurn;
    const promotionRank = color === "w" ? 7 : 0;
    if (pieceName.endsWith("pawn") && squareToCoords(newSquare)[1] === promotionRank) {
      promotionPending = newSquare;
      renderPieces(pieces);
      showPromotion(newSquare, color);
    } else {
      currentTurn = currentTurn === "w" ? "b" : "w";
      renderPieces(pieces);
    }
  }
}

/**
 * Click handling for selecting and moving pieces.
 */
document.querySelectorAll("[id^='square-']").forEach(squareEl => {
  squareEl.addEventListener("click", () => {
    if (promotionPending) return;
    const clickedSquare = squareEl.id.replace("square-", "");
    const img = squareEl.querySelector("img");

    if (selectedPiece) {
      handleMove(selectedSquare.id.replace("square-", ""), clickedSquare);
      selectedSquare.classList.remove("bg-orange-400");
      document.querySelectorAll(".bg-green-400").forEach(s => s.classList.remove("bg-green-400"));
      selectedPiece = null; selectedSquare = null;
    } else if (img && pieces[clickedSquare].startsWith(currentTurn)) {
      selectedPiece = img; selectedSquare = squareEl;
      squareEl.classList.add("bg-orange-400");
      highlightValidMoves(clickedSquare, pieces[clickedSquare]);
    }
  });
});

/**
 * Reverts to the last entry in the history array.
 */
const undoButton = document.getElementById("undo-button");
if (undoButton) {
  undoButton.addEventListener("click", () => {
    if (history.length === 0) return;

    const lastState = history.pop();

    pieces = lastState.pieces;
    currentTurn = lastState.turn;
    lastMove = lastState.lastMove;
    movedPieces = lastState.movedPieces;

    selectedPiece = null;
    selectedSquare = null;
    promotionPending = null;

    renderPieces(pieces);
  });
}

// Initial Render
renderPieces(pieces);