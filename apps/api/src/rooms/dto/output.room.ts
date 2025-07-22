import { OutputGrid } from 'src/grids/dto/output.grid';
import { Room } from '../entities/room.entity';

export type OutputRoom = Omit<Room, 'grids'> & {
  grid: OutputGrid;
};
