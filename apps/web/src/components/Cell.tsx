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
  const { isOpen, hasBomb, bombsAround } = cell;

  return (
    <div
      className={`
        border-2 w-10 h-10 rounded-md text-center text-2xl
        ${isOpen ? "bg-white" : "bg-gray-400 cursor-pointer"}
      `}>
      {isOpen ? (hasBomb ? "💣" : bombsAround) : ""}
    </div>
  );
};


export default Cell;
