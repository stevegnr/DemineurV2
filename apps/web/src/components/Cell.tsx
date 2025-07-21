type Props = { cell: CellType };

export type CellType = {
  id: number;
  x: number;
  y: number;
  hasBomb: boolean;
  bombsAround: number;
  isOpen: boolean;
};

const Cell = ({ cell }: Props) => {
  return (
    <div className="border-2 w-10 h-10 rounded-md text-center text-2xl">
      {cell.hasBomb ? "💣" : cell.bombsAround}
    </div>
  );
};

export default Cell;
