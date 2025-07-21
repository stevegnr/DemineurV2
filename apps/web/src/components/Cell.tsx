export type CellType = {
  id: number;
  x: number;
  y: number;
  hasBomb: boolean;
  bombsAround: number;
  isOpen: boolean;
};

type Props = { cell: CellType; onPlayMove: (cell: CellType) => void };

const Cell = ({ cell, onPlayMove }: Props) => {
  const { isOpen, hasBomb, bombsAround } = cell;

  const handleClick = () => {
    onPlayMove(cell);
  };

  return (
    <div
      onClick={handleClick}
      className={`
        border-2 w-10 h-10 rounded-md text-center text-2xl
        ${isOpen ? "bg-white" : "bg-gray-400 cursor-pointer"}
      `}>
      {isOpen ? (hasBomb ? "💣" : bombsAround) : ""}
    </div>
  );
};

export default Cell;
