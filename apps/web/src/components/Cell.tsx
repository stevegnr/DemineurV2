import { type Dispatch, type MouseEvent, type SetStateAction } from "react";
import { getAdjacentCells } from "../utils/grid";

export type CellType = {
  id: number;
  x: number;
  y: number;
  hasBomb: boolean;
  bombsAround: number;
  isOpen: boolean;
};

type Props = {
  cell: CellType;
  onPlayMove: (cells: CellType[]) => void;
  setFlaggedCells: Dispatch<SetStateAction<CellType[]>>;
  flaggedCells: CellType[];
  lastCellsPlayed: { x: number; y: number }[];
  allCells: CellType[];
  disabled?: boolean;
  is2Player?: boolean;
};

const Cell = ({
  cell,
  onPlayMove,
  flaggedCells,
  setFlaggedCells,
  lastCellsPlayed,
  allCells,
  disabled = false,
  is2Player = false,
}: Props) => {
  const { isOpen, hasBomb, bombsAround, x, y } = cell;

  const isLastPlayed: boolean = lastCellsPlayed.some(
    (lc) => lc.x === x && lc.y === y
  );

  const isFlagged: boolean = flaggedCells.some(
    (fc) => fc.x === cell.x && fc.y === cell.y
  );

  const handleClick = () => {
    if (disabled || isFlagged) return;

    if (isOpen) {
      // Chord-click : ouvrir les voisins si assez de drapeaux autour
      if (bombsAround > 0) {
        const adjCells: CellType[] = getAdjacentCells(x, y, allCells);
        const flaggedAround: CellType[] = adjCells.filter((ac) =>
          flaggedCells.some((fc) => fc.x === ac.x && fc.y === ac.y)
        );
        if (flaggedAround.length === bombsAround) {
          const toReveal: CellType[] = adjCells.filter((ac) => {
            const isFlagged: boolean = flaggedCells.some(
              (fc) => fc.x === ac.x && fc.y === ac.y
            );
            return !ac.isOpen && !isFlagged;
          });
          if (toReveal.length > 0) {
            onPlayMove(toReveal);
          }
        }
      }
      return; // Case déjà ouverte → ne pas émettre si chord-click non déclenché
    }

    onPlayMove([cell]);
  };

  const handleRightClick = (e: MouseEvent) => {
    e.preventDefault();
    if (disabled || isOpen) return;

    setFlaggedCells((prev) => {
      const isAlreadyFlagged: boolean = prev.some(
        (fc) => fc.x === cell.x && fc.y === cell.y
      );

      if (isAlreadyFlagged) {
        // Retirer le drapeau
        return prev.filter((fc) => !(fc.x === cell.x && fc.y === cell.y));
      } else {
        // Ajouter le drapeau
        return [...prev, cell];
      }
    });
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
        ${isOpen ? "bg-white" : disabled ? "bg-gray-400 cursor-default" : "bg-gray-400 cursor-pointer"}
        
      `}
      style={{ color: isOpen ? textColor : undefined }}>
      {!isOpen && isFlagged && "🚩"}
      {isOpen && hasBomb && (is2Player ? "🚩" : isLastPlayed ? "💥" : "💣")}
      {isOpen && !hasBomb && bombsAround}
    </div>
  );
};

export default Cell;
