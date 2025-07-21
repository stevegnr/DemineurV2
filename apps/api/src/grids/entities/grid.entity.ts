import { Cell } from 'src/cells/entities/cell.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Grid {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  height: number;

  @Column()
  width: number;

  @Column()
  bombs: number;

  @OneToMany(() => Cell, (cell) => cell.grid)
  cells: Cell[];
}
