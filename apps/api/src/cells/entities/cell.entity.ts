import { Grid } from 'src/grids/entities/grid.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Cell {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  x: number;

  @Column()
  y: number;

  @Column()
  hasBomb: boolean;

  @Column()
  bombsAround: number;

  @Column()
  isOpen: boolean;

  @ManyToOne(() => Grid, (grid) => grid.cells)
  grid: Grid;
}
