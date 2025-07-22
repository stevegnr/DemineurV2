import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { GridsService } from './grids.service';
import { CreateGridDto } from './dto/create-grid.dto';
import { UpdateGridDto } from './dto/update-grid.dto';
import { Grid } from './entities/grid.entity';
import { OutputGrid } from './dto/output.grid';

@Controller('grids')
export class GridsController {
  constructor(private readonly gridsService: GridsService) {}

  @Post()
  create(@Body() createGridDto: CreateGridDto): Promise<OutputGrid> {
    return this.gridsService.create(createGridDto);
  }

  @Get()
  findAll(): Promise<Grid[]> {
    return this.gridsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<OutputGrid> {
    return this.gridsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateGridDto: UpdateGridDto,
  ): Promise<Grid> {
    return this.gridsService.update(+id, updateGridDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<Grid> {
    return this.gridsService.remove(+id);
  }
}
