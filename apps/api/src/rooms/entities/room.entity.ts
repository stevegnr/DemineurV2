import { Grid } from 'src/grids/entities/grid.entity';
import { Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToMany(() => Grid, (grids) => grids.room, { nullable: true })
  grids?: Grid[];
}
