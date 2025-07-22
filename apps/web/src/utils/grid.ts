import type { CellType } from "../components/Cell";

export function getAdjacentCells(
  x: number,
  y: number,
  allCells: CellType[]
): CellType[] {
  return allCells.filter((cell) => {
    const dx = Math.abs(cell.x - x);
    const dy = Math.abs(cell.y - y);

    // Ignore la cellule centrale
    if (dx === 0 && dy === 0) return false;

    // Prend toutes les cellules adjacentes (8 max)
    return dx <= 1 && dy <= 1;
  });
}
