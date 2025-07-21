import { DeleteResult } from 'typeorm';
import { CreateGridDto } from '../dto/create-grid.dto';
import { UpdateGridDto } from '../dto/update-grid.dto';
import { Grid } from './grid.entity';

export const mockGrid: Grid = {
  id: 1,
  height: 10,
  width: 10,
  bombs: 10,
  cells: [],
};

export const mockCreateGridDto: CreateGridDto = {
  height: 10,
  width: 10,
  bombs: 10,
};

export const mockUpdateGridDto: UpdateGridDto = {
  height: 10,
  width: 10,
  bombs: 10,
};

export const mockDeleteResult: DeleteResult = {
  raw: [],
  affected: 1,
};
