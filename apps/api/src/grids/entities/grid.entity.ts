import { Room } from 'src/rooms/entities/room.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

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

  @Column({ type: 'blob' })
  mines: Buffer;

  @Column({ type: 'blob' })
  ouvertures: Buffer;

  @Column({ default: false })
  isGameOver: boolean;

  @ManyToOne(() => Room, (room) => room.grids)
  room: Room;
}
