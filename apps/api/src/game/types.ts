import { Cell } from 'src/cells/entities/cell.entity';

export type PlayMovePayload = {
  gridId: number;
  cellId: number;
  roomId: string;
};

export type PayloadCellsOpened = { openedCells: Cell[]; isGameOver: boolean };
