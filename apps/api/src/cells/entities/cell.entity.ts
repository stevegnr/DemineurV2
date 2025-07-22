import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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
}
