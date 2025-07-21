import type { CellType } from "./Cell";
import Cell from "./Cell";

type Props = { grid: Grid };

type Grid = {
  height: number;
  width: number;
  bombs: number;
  cells: CellType[];
};

const Grid = ({ grid }: Props) => {
  return (
    <div
      className={`grid grid-cols-${grid.width} gap-0 mx-auto`}
      style={{ width: "max-content" }}>
      {grid?.cells.map((c) => (
        <Cell
          cell={c}
          key={c.id}
        />
      ))}
    </div>
  );
};

export default Grid;
