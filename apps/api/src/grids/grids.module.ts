import { Module } from '@nestjs/common';
import { GridsService } from './grids.service';
import { GridsController } from './grids.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Grid } from './entities/grid.entity';
import { Cell } from 'src/cells/entities/cell.entity';
import { Room } from 'src/rooms/entities/room.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Grid, Cell, Room])],
  controllers: [GridsController],
  providers: [GridsService],
  exports: [GridsService],
})
export class GridsModule {}
