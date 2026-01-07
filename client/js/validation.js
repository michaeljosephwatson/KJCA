import { squareToCoords, coordsToSquare, isPathClear } from './utils.js';

/**
 * Checks if a specific square is under attack by any piece of the attackerColor.
 */
export function isSquareAttacked(square, attackerColor, currentPieces, movedPieces, lastMove) {
  for (const s in currentPieces) {
    const piece = currentPieces[s];
    if (piece.startsWith(attackerColor)) {
      if (isValidMove(piece, s, square, currentPieces, movedPieces, lastMove, true)) return true;
    }
  }
  return false;
}

/**
 * Finds the king and checks if it is currently in check.
 */
export function isKingInCheck(color, pieces, movedPieces, lastMove) {
  let kingSquare;
  for (const square in pieces) {
    if (pieces[square] === `${color}-king`) {
      kingSquare = square;
      break;
    }
  }
  if (!kingSquare) return true;
  return isSquareAttacked(kingSquare, color === "w" ? "b" : "w", pieces, movedPieces, lastMove);
}

/**
 * Core validation function to determine if a move follows piece rules.
 */
export function isValidMove(pieceName, from, to, pieces, movedPieces, lastMove, ignoreCastling = false) {
  const [x1, y1] = squareToCoords(from);
  const [x2, y2] = squareToCoords(to);
  const dx = x2 - x1;
  const dy = y2 - y1;
  const targetPiece = pieces[to] || null;
  const color = pieceName.startsWith("w") ? "w" : "b";

  if (targetPiece && targetPiece.startsWith(color)) return false;

  const type = pieceName.split("-")[1];
  switch (type) {
    case "pawn":
      const direction = color === "w" ? 1 : -1;
      const startRank = color === "w" ? 1 : 6;
      if (dx === 0 && dy === direction && !targetPiece) return true;
      if (dx === 0 && dy === 2 * direction && y1 === startRank) {
        if (!pieces[coordsToSquare(x1, y1 + direction)] && !targetPiece) return true;
      }
      if (Math.abs(dx) === 1 && dy === direction && targetPiece) return true;
      // En Passant
      if (Math.abs(dx) === 1 && dy === direction && !targetPiece && lastMove) {
        const [lx1, ly1] = squareToCoords(lastMove.from);
        const [lx2, ly2] = squareToCoords(lastMove.to);
        if (lastMove.piece === (color === "w" ? "b-pawn" : "w-pawn") && Math.abs(ly2 - ly1) === 2 && ly2 === y1 && lx2 === x2) return true;
      }
      return false;

    case "rook":
      return (dx === 0 || dy === 0) && isPathClear(from, to, pieces);

    case "knight":
      return (Math.abs(dx) === 1 && Math.abs(dy) === 2) || (Math.abs(dx) === 2 && Math.abs(dy) === 1);

    case "bishop":
      return Math.abs(dx) === Math.abs(dy) && isPathClear(from, to, pieces);

    case "queen":
      return (dx === 0 || dy === 0 || Math.abs(dx) === Math.abs(dy)) && isPathClear(from, to, pieces);

    case "king":
      if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) return true;
      // Castling logic
      if (!ignoreCastling && Math.abs(dx) === 2 && dy === 0) {
        const rank = color === "w" ? "1" : "8";
        if (from !== `e${rank}` || movedPieces.has(`e${rank}`) || isKingInCheck(color, pieces, movedPieces, lastMove)) return false;
        const isKingside = dx === 2;
        const rookSquare = isKingside ? `h${rank}` : `a${rank}`;
        if (!pieces[rookSquare] || movedPieces.has(rookSquare)) return false;
        const path = isKingside ? [`f${rank}`, `g${rank}`] : [`d${rank}`, `c${rank}`, `b${rank}`];
        for (let sq of path) if (pieces[sq]) return false;
        const travelSquares = isKingside ? [`f${rank}`, `g${rank}`] : [`d${rank}`, `c${rank}`];
        for (let sq of travelSquares) if (isSquareAttacked(sq, color === "w" ? "b" : "w", pieces, movedPieces, lastMove)) return false;
        return true;
      }
      return false;
    default: return false;
  }
}