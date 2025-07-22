import type { CellType } from "./Cell";
import Cell from "./Cell";

type Props = { grid: GridType; onPlayMove: (cell: CellType) => void };

export type GridType = {
  id: number;
  height: number;
  width: number;
  bombs: number;
  cells: CellType[];
};

const Grid = ({ grid, onPlayMove }: Props) => {
  return (
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
        />
      ))}
    </div>
  );
};

export default Grid;
