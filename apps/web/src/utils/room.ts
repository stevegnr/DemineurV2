import type { CellType } from "../components/Cell";
import type { GridType } from "../components/Grid";

export const updateGrid = (
  grid: GridType,
  openedCells: CellType[]
): GridType => {
  const updatedCells = grid.cells.map((c) => {
    const openedCell = openedCells.find((oc) => oc.x === c.x && oc.y === c.y);
    if (openedCell) {
      return {
        ...c,
        isOpen: true,
        hasBomb: openedCell.hasBomb,
        bombsAround: openedCell.bombsAround,
      };
    }
    return c;
  });

  return {
    ...grid,
    cells: updatedCells,
  };
};
