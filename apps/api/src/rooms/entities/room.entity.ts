import { UUID } from 'crypto';
import { Grid } from 'src/grids/entities/grid.entity';
import { Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Room {
  @PrimaryGeneratedColumn()
  id: UUID;

  @OneToMany(() => Grid, (grids) => grids.room)
  grids: Grid[];
}
