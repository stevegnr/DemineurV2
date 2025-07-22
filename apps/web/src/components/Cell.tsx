import { useState, type MouseEvent } from "react";

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

  const [isFlagged, setIsFlagged] = useState<boolean>(false);

  const handleClick = () => {
    if (isFlagged) return;
    onPlayMove(cell);
  };

  const handleRightClick = (e: MouseEvent) => {
    e.preventDefault();
    setIsFlagged((prev) => !prev);
  };

  let textColor: string;

  switch (bombsAround) {
    case 1:
      textColor = "blue";
      break;
    case 2:
      textColor = "green";
      break;
    case 3:
      textColor = "red";
      break;
    case 4:
      textColor = "#000084";
      break;
    case 5:
      textColor = "darkblue";
      break;
    case 6:
      textColor = "darkslategrey";
      break;
    case 7:
      textColor = "brown";
      break;
    case 8:
      textColor = "black";
      break;

    default:
      textColor = "white";
      break;
  }

  return (
    <div
      onClick={handleClick}
      onContextMenu={handleRightClick}
      className={`
        border-2 border-gray-600 w-10 h-10 rounded-md text-center text-2xl font-bold
        ${isOpen ? "bg-white" : "bg-gray-400 cursor-pointer"}
        
      `}
      style={{ color: isOpen ? textColor : undefined }}>
      {!isOpen && isFlagged && "🚩"}
      {isOpen ? (hasBomb ? "💥" : bombsAround) : ""}
    </div>
  );
};

export default Cell;
