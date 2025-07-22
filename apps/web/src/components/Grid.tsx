import { type Dispatch, type SetStateAction } from "react";
import type { CellType } from "./Cell";
import Cell from "./Cell";

export type GridType = {
  id: number;
  height: number;
  width: number;
  bombs: number;
  isGameOver: boolean;
  cells: CellType[];
};

type Props = {
  grid: GridType;
  onPlayMove: (cells: CellType[]) => void;
  setFlaggedCells: Dispatch<SetStateAction<CellType[]>>;
  flaggedCells: CellType[];
  lastCellsPlayed: { x: number; y: number }[];
};

const Grid = ({
  grid,
  onPlayMove,
  flaggedCells,
  setFlaggedCells,
  lastCellsPlayed,
}: Props) => {
  const { bombs, cells, width } = grid;

  const remainingBombs: number = bombs - flaggedCells.length;
  return (
    <div>
      <p className={`font-bold ${remainingBombs < 0 && "text-danger-500"}`}>
        {remainingBombs} restantes sur {bombs}
      </p>
      <div
        className={`grid gap-0 mx-auto`}
        style={{
          gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))`,
          width: "max-content",
        }}>
        {grid?.cells.map((c) => (
          <Cell
            cell={c}
            key={grid.id + "-" + c.x + "-" + c.y}
            onPlayMove={onPlayMove}
            setFlaggedCells={setFlaggedCells}
            flaggedCells={flaggedCells}
            lastCellsPlayed={lastCellsPlayed}
            allCells={cells}
          />
        ))}
      </div>
    </div>
  );
};

export default Grid;
