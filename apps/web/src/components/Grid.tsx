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
  onPlayMove: (cell: CellType) => void;
  setFlaggedCells: Dispatch<SetStateAction<CellType[]>>;
  flaggedCells: CellType[];
  lastCellPlayed: { x: number; y: number };
};

const Grid = ({
  grid,
  onPlayMove,
  flaggedCells,
  setFlaggedCells,
  lastCellPlayed,
}: Props) => {
  const remainingBombs: number = grid.bombs - flaggedCells.length;
  return (
    <div>
      <p className="font-bold">
        {remainingBombs} restantes sur {grid.bombs}
      </p>
      <div
        className={`grid gap-0 mx-auto`}
        style={{
          gridTemplateColumns: `repeat(${grid.width}, minmax(0, 1fr))`,
          width: "max-content",
        }}>
        {grid?.cells.map((c) => (
          <Cell
            cell={c}
            key={grid.id + "-" + c.x + "-" + c.y}
            onPlayMove={onPlayMove}
            setFlaggedCells={setFlaggedCells}
            flaggedCells={flaggedCells}
            lastCellPlayed={lastCellPlayed}
          />
        ))}
      </div>
    </div>
  );
};

export default Grid;
