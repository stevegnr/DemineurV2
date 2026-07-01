import { Grid } from 'src/grids/entities/grid.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: '1player' })
  mode: '1player' | '2players';

  @OneToMany(() => Grid, (grids) => grids.room, { nullable: true })
  grids?: Grid[];
}
