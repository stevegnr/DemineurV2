import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateGridDto } from './dto/create-grid.dto';
import { UpdateGridDto } from './dto/update-grid.dto';
import { Grid } from './entities/grid.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { Cell } from 'src/cells/entities/cell.entity';
import { PayloadCellsOpened } from 'src/game/types';

@Injectable()
export class GridsService {
  @InjectRepository(Grid) gridRepository: Repository<Grid>;
  @InjectRepository(Cell) cellRepository: Repository<Cell>;

  async create(createGridDto: CreateGridDto): Promise<Grid> {
    const { height, width, bombs } = createGridDto;

    const cellsWithBombs: Partial<Cell>[] = this.fillGrid(height, width, bombs);
    const cellsToSave: Cell[] = this.cellRepository.create(cellsWithBombs);

    const grid: Grid = this.gridRepository.create({
      ...createGridDto,
      cells: await this.cellRepository.save(cellsToSave),
    });

    return this.gridRepository.save(grid);
  }

  findAll(): Promise<Grid[]> {
    return this.gridRepository.find();
  }

  findOne(id: number): Promise<Grid> {
    return this.gridRepository.findOne({
      where: { id },
      relations: { cells: true },
    });
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

  generateBombIndexes(totalCells: number, totalBombs: number): Set<number> {
    if (totalBombs > totalCells) {
      throw new Error('Cannot generate more bombs than cells.');
    }
    const bombIndexes = new Set<number>();

    while (bombIndexes.size < totalBombs) {
      bombIndexes.add(Math.floor(Math.random() * totalCells));
    }

    return bombIndexes;
  }

  fillGrid(height: number, width: number, bombs: number): Partial<Cell>[] {
    const grid: Partial<Cell>[][] = [];
    const bombIndexes: Set<number> = this.generateBombIndexes(
      height * width,
      bombs,
    );

    let index = 1;

    for (let i = 1; i <= width; i++) {
      grid[i] = [];
      for (let j = 1; j <= height; j++) {
        const newCell = {
          id: 0,
          x: i,
          y: j,
          hasBomb: bombIndexes.has(index),
          isOpen: false,
          bombsAround: 0,
          grid: new Grid(),
        };
        grid[i][j] = newCell;

        index++;
      }
    }

    for (let i = 1; i <= width; i++) {
      for (let j = 1; j <= height; j++) {
        const cell = grid[i][j];

        if (cell.hasBomb) {
          cell.bombsAround = -1;
          continue;
        }

        let count = 0;

        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            // Ignorer soi-même
            if (dx === 0 && dy === 0) continue;

            const neighborX: number = cell.x + dx;
            const neighborY: number = cell.y + dy;

            // Coordonnées utilisables
            if (
              neighborX >= 1 &&
              neighborX <= width &&
              neighborY >= 1 &&
              neighborY <= height
            ) {
              if (grid[neighborX][neighborY].hasBomb) {
                count++;
              }
            }
          }
        }
        cell.bombsAround = count;
      }
    }
    // Aplatir Cell[][] en Cell[]
    const cells: Partial<Cell>[] = [];
    for (let i = 1; i <= width; i++) {
      for (let j = 1; j <= height; j++) {
        cells.push(grid[i][j]);
      }
    }

    return cells;
  }

  getAdjacentCells(cell: Cell, allCells: Cell[]): Cell[] {
    const adjacent: Cell[] = [];

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue; // Ne pas inclure la cellule elle-même

        const neighborX = cell.x + dx;
        const neighborY = cell.y + dy;

        const neighbor = allCells.find(
          (c) => c.x === neighborX && c.y === neighborY,
        );

        if (neighbor) {
          adjacent.push(neighbor);
        }
      }
    }

    return adjacent;
  }

  async revealCell(
    cellId: number,
    gridId: number,
  ): Promise<PayloadCellsOpened> {
    const grid: Grid = await this.gridRepository.findOne({
      where: { id: gridId },
      relations: { cells: true },
    });

    const cellsFiltered: Cell[] = grid.cells.filter(
      (cell) => cell.id === cellId,
    );

    if (cellsFiltered.length < 1) {
      throw new NotFoundException('Cell not in Grid');
    }

    if (cellsFiltered.length > 1) {
      throw new InternalServerErrorException(
        'Several cells in this grid with same Id',
      );
    }

    const cell: Cell = cellsFiltered[0];

    const openedCells: Cell[] = [];

    const stack: Cell[] = [cell];

    while (stack.length) {
      const cell: Cell = stack.pop();

      cell.isOpen = true;
      openedCells.push(cell);

      if (cell.hasBomb) {
        // TODO : Ouvrir toutes les cellules
        return { openedCells, isGameOver: true };
      } else if (cell.bombsAround === 0) {
        const adjacentCells: Cell[] = this.getAdjacentCells(cell, grid.cells);

        for (const adj of adjacentCells) {
          if (!adj.isOpen) stack.push(adj);
        }
      }
    }

    this.cellRepository.save(openedCells);
    console.log('cell', cell);

    return { openedCells, isGameOver: false };
  }
}
