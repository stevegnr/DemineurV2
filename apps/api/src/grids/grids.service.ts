import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateGridDto } from './dto/create-grid.dto';
import { UpdateGridDto } from './dto/update-grid.dto';
import { Grid } from './entities/grid.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';

@Injectable()
export class GridsService {
  @InjectRepository(Grid) gridRepository: Repository<Grid>;

  create(createGridDto: CreateGridDto): Promise<Grid> {
    const grid: Grid = this.gridRepository.create(createGridDto);

    return this.gridRepository.save(grid);
  }

  findAll(): Promise<Grid[]> {
    return this.gridRepository.find();
  }

  findOne(id: number): Promise<Grid> {
    return this.gridRepository.findOneBy({ id });
  }

  async update(id: number, updateGridDto: UpdateGridDto): Promise<Grid> {
    const grid: Grid = await this.gridRepository.preload({
      id,
      ...updateGridDto,
    });

    if (!grid) throw new NotFoundException();

    return this.gridRepository.save(grid);
  }

  async remove(id: number): Promise<DeleteResult> {
    const grid: Grid = await this.gridRepository.findOneBy({ id });

    if (!grid) return;

    return this.gridRepository.delete(id);
  }
}
