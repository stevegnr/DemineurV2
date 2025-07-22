import { Grid } from '../entities/grid.entity';

export type OutputGrid = Omit<Grid, 'mines' | 'ouvertures' | 'room'> & {
  cells: OutputCell[];
};

export type OutputCell = {
  x: number;
  y: number;
  isOpen: boolean;
  bombsAround?: number;
};
