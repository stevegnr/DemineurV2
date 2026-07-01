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
  disabled?: boolean;
  is2Player?: boolean;
};

const Grid = ({
  grid,
  onPlayMove,
  flaggedCells,
  setFlaggedCells,
  lastCellsPlayed,
  disabled = false,
  is2Player = false,
}: Props) => {
  const { bombs, cells, width, height } = grid;

  const remainingBombs: number = bombs - flaggedCells.length;

  return (
    <div>
      <h3>Grille n° : {grid.id}</h3>
      <p className={`font-bold ${remainingBombs < 0 ? "text-danger-500" : ""}`}>
        {remainingBombs} restantes sur {bombs}
      </p>
      <div style={{ overflow: "auto" }}>
        <table className="border-collapse">
          <tbody>
            {/* En-tête des colonnes */}
            <tr>
              <td></td>
              {Array.from({ length: width }, (_, i) => (
                <td
                  key={`col-${i}`}
                  className="text-center font-mono px-1">
                  {i + 1}
                </td>
              ))}
            </tr>

            {/* Lignes de cellules avec numéro de ligne */}
            {Array.from({ length: height }, (_, rowIndex) => {
              const rowCells = cells.filter((c) => c.y === rowIndex + 1);
              return (
                <tr key={`row-${rowIndex}`}>
                  <td className="text-right pr-1 font-mono">{rowIndex + 1}</td>
                  {rowCells.map((c) => (
                    <td
                      key={`${grid.id}-${c.x}-${c.y}`}
                      className="p-0">
                      <Cell
                        cell={c}
                        onPlayMove={onPlayMove}
                        setFlaggedCells={setFlaggedCells}
                        flaggedCells={flaggedCells}
                        lastCellsPlayed={lastCellsPlayed}
                        allCells={cells}
                        disabled={disabled}
                        is2Player={is2Player}
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Grid;
