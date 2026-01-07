import { initialPieces } from './constants.js';
import { squareToCoords, coordsToSquare } from './utils.js';
import { isValidMove, isKingInCheck } from './validation.js';

export const GameEngine = {
  state: {
    pieces: { ...initialPieces },
    history: [],
    currentTurn: "w",
    lastMove: null,
    movedPieces: new Set(),
    selectedSquare: null,
    promotionPending: null
  },

  render() {
    const squares = document.querySelectorAll("[id^='square-']");
    squares.forEach(sq => {
      sq.innerHTML = "";
      sq.classList.remove("bg-orange-400", "bg-green-400");
    });

    for (const [sq, piece] of Object.entries(this.state.pieces)) {
      const squareEl = document.getElementById(`square-${sq}`);
      if (!squareEl) continue;
      const img = document.createElement("img");
      img.src = `./assets/pieces/${piece}.svg`;
      img.className = "w-full h-full object-contain cursor-pointer select-none";
      squareEl.appendChild(img);
    }

    // Only highlight if a piece is selected and NOT waiting for promotion
    if (this.state.selectedSquare && !this.state.promotionPending) {
      const selectedEl = document.getElementById(`square-${this.state.selectedSquare}`);
      if (selectedEl) selectedEl.classList.add("bg-orange-400");
      this.highlightValidMoves(this.state.selectedSquare);
    }
  },

  highlightValidMoves(from) {
    const pieceName = this.state.pieces[from];
    if (!pieceName) return;

    const squares = document.querySelectorAll("[id^='square-']");
    squares.forEach(sq => {
      const to = sq.id.replace("square-", "");
      if (isValidMove(pieceName, from, to, this.state.pieces, this.state.movedPieces, this.state.lastMove)) {
        const testPieces = JSON.parse(JSON.stringify(this.state.pieces));
        delete testPieces[from];
        testPieces[to] = pieceName;
        
        if (!isKingInCheck(this.state.currentTurn, testPieces, this.state.movedPieces, this.state.lastMove)) {
          sq.classList.add("bg-green-400");
        }
      }
    });
  },

  executeMove(from, to, onPromotion) {
    const pieceName = this.state.pieces[from];
    if (!pieceName) return false;

    const [x1, y1] = squareToCoords(from);
    const [x2, y2] = squareToCoords(to);
    
    const testPieces = JSON.parse(JSON.stringify(this.state.pieces));
    delete testPieces[from];
    testPieces[to] = pieceName;

    // Side Effects (Castling/En Passant)
    if (pieceName.endsWith("king") && Math.abs(x2 - x1) === 2) {
      const rank = this.state.currentTurn === "w" ? "1" : "8";
      if (x2 > x1) { delete testPieces[`h${rank}`]; testPieces[`f${rank}`] = `${this.state.currentTurn}-rook`; }
      else { delete testPieces[`a${rank}`]; testPieces[`d${rank}`] = `${this.state.currentTurn}-rook`; }
    }
    if (pieceName.endsWith("pawn") && Math.abs(x2 - x1) === 1 && !this.state.pieces[to]) {
      delete testPieces[coordsToSquare(x2, y1)];
    }

    if (isValidMove(pieceName, from, to, this.state.pieces, this.state.movedPieces, this.state.lastMove) && 
        !isKingInCheck(this.state.currentTurn, testPieces, this.state.movedPieces, this.state.lastMove)) {
      
      this.state.history.push({
        pieces: JSON.parse(JSON.stringify(this.state.pieces)),
        turn: this.state.currentTurn,
        lastMove: this.state.lastMove ? { ...this.state.lastMove } : null,
        movedPieces: new Set(this.state.movedPieces)
      });

      this.state.pieces = testPieces;
      this.state.movedPieces.add(from);
      this.state.lastMove = { piece: pieceName, from, to };

      const promotionRank = this.state.currentTurn === "w" ? 7 : 0;
      
      // CRITICAL: Clear selection BEFORE checking promotion to stop the render loop
      this.state.selectedSquare = null;

      if (pieceName.endsWith("pawn") && squareToCoords(to)[1] === promotionRank) {
        this.state.promotionPending = to;
        this.render();
        onPromotion(to, this.state.currentTurn);
      } else {
        this.state.currentTurn = this.state.currentTurn === "w" ? "b" : "w";
        this.render();
      }
      return true;
    }
    this.state.selectedSquare = null;
    this.render();
    return false;
  },

  undo() {
    if (this.state.history.length === 0) return;
    const last = this.state.history.pop();
    this.state.pieces = last.pieces;
    this.state.currentTurn = last.turn;
    this.state.lastMove = last.lastMove;
    this.state.movedPieces = last.movedPieces;
    this.state.promotionPending = null;
    this.state.selectedSquare = null;
    this.render();
  }
};