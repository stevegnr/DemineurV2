import { Cell } from 'src/cells/entities/cell.entity';
import { Room } from 'src/rooms/entities/room.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

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

  @ManyToOne(() => Room, (room) => room.grids)
  room: Room;
}
