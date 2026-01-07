/**
 * Converts a square string to [x, y] coordinates (0-7).
 */
export function squareToCoords(square) {
  return [square.charCodeAt(0) - "a".charCodeAt(0), parseInt(square[1]) - 1];
}


/**
 * Converts [x, y] coordinates to a square string
 */
export function coordsToSquare(x, y) {
  return String.fromCharCode("a".charCodeAt(0) + x) + (y + 1);
}


/**
 * Checks if all squares between 'from' and 'to' are empty.
 */
export function isPathClear(from, to, pieces) {
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