import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateGridDto } from './dto/create-grid.dto';
import { UpdateGridDto } from './dto/update-grid.dto';
import { Grid } from './entities/grid.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { Cell } from 'src/cells/entities/cell.entity';
import { PayloadCellsOpened } from 'src/game/types';
import { Room } from 'src/rooms/entities/room.entity';
import { OutputCell, OutputGrid } from './dto/output.grid';
import {
  countBombsAround,
  generateOutputCells,
  getBit,
  revealAll,
  setBit,
} from './grid-utils';

@Injectable()
export class GridsService {
  @InjectRepository(Grid) gridRepository: Repository<Grid>;
  @InjectRepository(Room) roomRepository: Repository<Room>;
  @InjectRepository(Cell) cellRepository: Repository<Cell>;

  async create(createGridDto: CreateGridDto): Promise<OutputGrid> {
    const { height, width, bombs, roomId } = createGridDto;

    const room: Room = await this.roomRepository.findOne({
      where: { id: roomId },
      relations: { grids: true },
    });

    if (!room) {
      throw new ConflictException("La salle n'existe pas");
    }

    if (room.grids.length > 0) {
      await Promise.all(room.grids.map((grid) => this.remove(grid.id)));
    }

    const { mines, ouvertures } = this.fillGrid(height, width, bombs);

    const grid: Grid = this.gridRepository.create({
      height,
      width,
      bombs,
      room,
      mines,
      ouvertures,
    });

    const savedGrid: Grid = await this.gridRepository.save(grid);

    const cells: OutputCell[] = generateOutputCells(savedGrid);

    const output: OutputGrid = {
      id: savedGrid.id,
      height: savedGrid.height,
      width: savedGrid.width,
      bombs: savedGrid.bombs,
      cells,
    };

    return output;
  }

  findAll(): Promise<Grid[]> {
    return this.gridRepository.find();
  }

  async findOne(id: number): Promise<OutputGrid> {
    const grid: Grid = await this.gridRepository.findOne({ where: { id } });

    if (!grid) {
      throw new NotFoundException('Grid not found');
    }

    const { width, height, bombs } = grid;

    const output: OutputGrid = {
      id: grid.id,
      width,
      height,
      cells: generateOutputCells(grid),
      bombs,
    };

    return output;
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

    return this.gridRepository.delete(grid.id);
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

  fillGrid(
    height: number,
    width: number,
    bombs: number,
  ): { mines: Buffer; ouvertures: Buffer } {
    const nbCases = width * height;

    // Buffers compactés
    const mines = Buffer.alloc(Math.ceil(nbCases / 8));
    const ouvertures = Buffer.alloc(Math.ceil(nbCases / 8)); // tout fermé au début

    const bombIndexes: Set<number> = this.generateBombIndexes(nbCases, bombs);

    // Remplissage du buffer mines
    let index = 0; // passe à index 0-based
    for (let y = 1; y <= height; y++) {
      for (let x = 1; x <= width; x++) {
        if (bombIndexes.has(index + 1)) {
          // ton ancien index démarrait à 1
          const byteIndex = Math.floor(index / 8);
          const bitIndex = index % 8;
          mines[byteIndex] |= 1 << bitIndex;
        }
        index++;
      }
    }

    // ouvertures reste à 0 (tout fermé)
    return { mines, ouvertures };
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
    x: number,
    y: number,
    gridId: number,
  ): Promise<PayloadCellsOpened> {
    const grid: Grid = await this.gridRepository.findOne({
      where: { id: gridId },
    });

    if (!grid) {
      throw new NotFoundException('Grid not found');
    }

    const { width, height } = grid;

    const index: number = (y - 1) * width + (x - 1);

    if (getBit(grid.ouvertures, index)) {
      return { openedCells: [], isGameOver: false };
    }

    const stack: { x: number; y: number }[] = [{ x, y }];
    const openedCells: {
      x: number;
      y: number;
      bombsAround: number;
      hasBomb?: boolean;
    }[] = [];

    while (stack.length) {
      const { x, y } = stack.pop();
      const index: number = (y - 1) * width + (x - 1);

      if (getBit(grid.ouvertures, index)) continue;

      setBit(grid.ouvertures, index);

      const isBomb: boolean = getBit(grid.mines, index);

      if (isBomb) {
        openedCells.push({ x, y, hasBomb: true, bombsAround: -1 });

        revealAll(grid.ouvertures);
        // Ajoute toutes les autres cellules à openedCells
        for (let ny = 1; ny <= height; ny++) {
          for (let nx = 1; nx <= width; nx++) {
            const i = (ny - 1) * width + (nx - 1);
            if (getBit(grid.ouvertures, i)) {
              const hasBomb = getBit(grid.mines, i);
              const bombsAround = hasBomb
                ? -1
                : countBombsAround(nx, ny, width, height, grid.mines);

              // Évite d’ajouter la bombe deux fois
              const alreadyAdded = openedCells.some(
                (c) => c.x === nx && c.y === ny,
              );
              if (!alreadyAdded) {
                openedCells.push({
                  x: nx,
                  y: ny,
                  bombsAround,
                  hasBomb: hasBomb || undefined,
                });
              }
            }
          }
        }
        await this.gridRepository.save(grid);
        return { openedCells, isGameOver: true };
      }

      const bombsAround: number = countBombsAround(
        x,
        y,
        width,
        height,
        grid.mines,
      );
      openedCells.push({ x, y, bombsAround });

      if (bombsAround === 0) {
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0) continue;

            const nx = x + dx;
            const ny = y + dy;

            if (nx >= 1 && nx <= width && ny >= 1 && ny <= height) {
              stack.push({ x: nx, y: ny });
            }
          }
        }
      }
    }

    await this.gridRepository.save(grid);
    return { openedCells, isGameOver: false };
  }
}
