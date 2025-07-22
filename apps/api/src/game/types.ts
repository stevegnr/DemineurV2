export type PlayMovePayload = {
  gridId: number;
  cell: { x: number; y: number };
  roomId: string;
};

export type PayloadCellsOpened = {
  openedCells: { x: number; y: number; bombsAround: number }[];
  isGameOver: boolean;
};
