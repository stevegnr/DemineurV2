import { Module } from '@nestjs/common';
import { GridsService } from './grids.service';
import { GridsController } from './grids.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Grid } from './entities/grid.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Grid])],
  controllers: [GridsController],
  providers: [GridsService],
})
export class GridsModule {}
