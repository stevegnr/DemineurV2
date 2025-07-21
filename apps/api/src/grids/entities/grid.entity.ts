import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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
}
