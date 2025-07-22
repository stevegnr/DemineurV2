import { DeleteResult } from 'typeorm';
import { Cell } from './cell.entity';

export const mockCell: Cell = {
  id: 1,
  x: 3,
  y: 6,
  hasBomb: false,
  bombsAround: 0,
  isOpen: false,
};

export const mockDeleteResult: DeleteResult = {
  raw: [],
  affected: 1,
};
