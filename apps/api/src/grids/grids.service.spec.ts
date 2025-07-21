import { Test, TestingModule } from '@nestjs/testing';
import { GridsService } from './grids.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Grid } from './entities/grid.entity';
import { Repository, DeleteResult } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import {
  mockCreateGridDto,
  mockGrid,
  mockUpdateGridDto,
} from './entities/grid.mock';
import { Cell } from 'src/cells/entities/cell.entity';

describe('GridsService', () => {
  let service: GridsService;
  let gridRepository: jest.Mocked<Repository<Grid>>;
  // let cellRepository: jest.Mocked<Repository<Cell>>;

  const mockDeleteResult: DeleteResult = {
    raw: [],
    affected: 1,
  };

  const mockGridRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    preload: jest.fn(),
    delete: jest.fn(),
  };

  const mockCellRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOneBy: jest.fn(),
    preload: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GridsService,
        {
          provide: getRepositoryToken(Grid),
          useValue: mockGridRepository,
        },
        {
          provide: getRepositoryToken(Cell),
          useValue: mockCellRepository,
        },
      ],
    }).compile();

    service = module.get<GridsService>(GridsService);
    gridRepository = module.get(getRepositoryToken(Grid));
    // cellRepository = module.get(getRepositoryToken(Cell));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('doit être défini', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('doit créer une grille avec ses cellules et la sauvegarder', async () => {
      // Arrange
      const mockCells = [{ x: 1, y: 1 }] as Partial<Cell>[];
      const mockCreatedCells = [{ id: 1, x: 1, y: 1 }] as Cell[];
      const mockGridEntity = { ...mockGrid, cells: mockCreatedCells } as Grid;

      // Mocker fillGrid
      jest.spyOn(service, 'fillGrid').mockReturnValue(mockCells);

      // Mocker cellRepository.create pour retourner les cellules complètes
      mockCellRepository.create.mockReturnValue(mockCreatedCells);

      // Mocker gridRepository.create pour retourner l’entité Grid avec cellules
      mockGridRepository.create.mockReturnValue(mockGridEntity);

      // Mocker save
      mockGridRepository.save.mockResolvedValue(mockGridEntity);

      // Act
      const result = await service.create(mockCreateGridDto);

      // Assert
      expect(service.fillGrid).toHaveBeenCalledWith(
        mockCreateGridDto.height,
        mockCreateGridDto.width,
        mockCreateGridDto.bombs,
      );

      expect(mockCellRepository.create).toHaveBeenCalledWith(mockCells);
      expect(mockGridRepository.save).toHaveBeenCalledWith(mockGridEntity);
      expect(result).toEqual(mockGridEntity);
    });

    it('doit créer les cellules avec les bonnes propriétés', async () => {
      // Arrange
      const height = 2;
      const width = 2;
      const bombs = 1;
      const roomId = '123a';

      const mockCells = [
        { x: 1, y: 1, hasBomb: true, isOpen: false, bombsAround: -1 },
        { x: 1, y: 2, hasBomb: false, isOpen: false, bombsAround: 1 },
        { x: 2, y: 1, hasBomb: false, isOpen: false, bombsAround: 1 },
        { x: 2, y: 2, hasBomb: false, isOpen: false, bombsAround: 1 },
      ] as Partial<Cell>[];

      const createdCells = mockCells.map((cell, index) => ({
        id: index + 1,
        ...cell,
      })) as Cell[];

      const savedCells = createdCells; // ⏳ Ce qu’on attend de save()

      const gridEntity = {
        ...mockGrid,
        cells: savedCells,
      } as Grid;

      jest.spyOn(service, 'fillGrid').mockReturnValue(mockCells);
      mockCellRepository.create.mockReturnValue(createdCells);
      mockCellRepository.save.mockResolvedValue(savedCells); // ✅ Ajout du mock save
      mockGridRepository.create.mockReturnValue(gridEntity);
      mockGridRepository.save.mockResolvedValue(gridEntity);

      // Act
      const result = await service.create({
        height,
        width,
        bombs,
        roomId,
      });

      // Assert
      expect(service.fillGrid).toHaveBeenCalledWith(height, width, bombs);
      expect(mockCellRepository.create).toHaveBeenCalledWith(mockCells);
      expect(mockCellRepository.save).toHaveBeenCalledWith(createdCells); // ✅ Vérifie save
      expect(mockGridRepository.create).toHaveBeenCalledWith({
        height,
        width,
        bombs,
        cells: savedCells,
      });
      expect(mockGridRepository.save).toHaveBeenCalledWith(gridEntity);
      expect(result.cells).toHaveLength(4);

      result.cells.forEach((cell) => {
        expect(cell).toHaveProperty('x');
        expect(cell).toHaveProperty('y');
        expect(cell).toHaveProperty('hasBomb');
        expect(cell).toHaveProperty('isOpen', false);
        expect(cell).toHaveProperty('bombsAround');
      });
    });
  });

  describe('findAll', () => {
    it('doit retourner toutes les grilles', async () => {
      mockGridRepository.find.mockResolvedValue([mockGrid]);

      const result = await service.findAll();

      expect(gridRepository.find).toHaveBeenCalled();
      expect(result).toEqual([mockGrid]);
    });
  });

  describe('findOne', () => {
    it('doit retourner une grille par son id', async () => {
      mockGridRepository.findOne.mockResolvedValue(mockGrid);

      const result = await service.findOne(1);

      expect(gridRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: { cells: true },
      });
      expect(result).toEqual(mockGrid);
    });
  });

  describe('update', () => {
    it('doit mettre à jour une grille existante', async () => {
      const updatedGrid: Grid = { ...mockGrid, ...mockUpdateGridDto };
      mockGridRepository.preload.mockResolvedValue(updatedGrid);
      mockGridRepository.save.mockResolvedValue(updatedGrid);

      const result = await service.update(1, mockUpdateGridDto);

      expect(gridRepository.preload).toHaveBeenCalledWith({
        id: 1,
        ...mockUpdateGridDto,
      });
      expect(gridRepository.save).toHaveBeenCalledWith(updatedGrid);
      expect(result).toEqual(updatedGrid);
    });

    it('doit lever une exception NotFoundException si la grille est introuvable', async () => {
      mockGridRepository.preload.mockResolvedValue(undefined);

      await expect(service.update(1, mockUpdateGridDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(gridRepository.preload).toHaveBeenCalledWith({
        id: 1,
        ...mockUpdateGridDto,
      });
    });
  });

  describe('remove', () => {
    it('doit supprimer une grille existante', async () => {
      mockGridRepository.findOneBy.mockResolvedValue(mockGrid);
      mockGridRepository.delete.mockResolvedValue(mockDeleteResult);

      const result = await service.remove(1);

      expect(gridRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
      expect(gridRepository.delete).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockDeleteResult);
    });

    it('doit retourner undefined si la grille est introuvable', async () => {
      mockGridRepository.findOneBy.mockResolvedValue(undefined);

      const result = await service.remove(1);

      expect(gridRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
      expect(gridRepository.delete).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
    });
  });

  describe('GridsService - fillGrid', () => {
    let service: GridsService;

    beforeEach(() => {
      service = new GridsService(/* inject mocks if needed */);

      jest.spyOn(service, 'generateBombIndexes').mockImplementation(() => {
        // Exemple : placer des bombes aux indexes 2 et 5 (indexation 1-based)
        return new Set([2, 5]);
      });
    });

    it('doit retourner un tableau plat de Partial<Cell> avec la bonne taille', () => {
      const height = 3;
      const width = 3;
      const bombs = 2;

      const result = service.fillGrid(height, width, bombs);

      expect(result.length).toBe(height * width);
      result.forEach((cell) => {
        expect(cell).toHaveProperty('x');
        expect(cell).toHaveProperty('y');
        expect(typeof cell.hasBomb).toBe('boolean');
        expect(cell.isOpen).toBe(false);
        expect(cell).toHaveProperty('bombsAround');
      });
    });

    it('doit définir bombsAround à -1 pour les cellules avec bombe', () => {
      const result = service.fillGrid(3, 3, 2);

      const bombCells = result.filter((c) => c.hasBomb);
      expect(bombCells.length).toBe(2);
      bombCells.forEach((cell) => {
        expect(cell.bombsAround).toBe(-1);
      });
    });

    it('doit calculer correctement le nombre de bombes autour', () => {
      jest.spyOn(service, 'generateBombIndexes').mockReturnValue(new Set([2]));

      const cells = service.fillGrid(3, 3, 1);

      // Ex: cellule en (1,1) n'a pas de bombe, elle doit compter 1 bombe voisine (celle en index 2 = (1,2))
      const cell = cells.find((c) => c.x === 1 && c.y === 1);
      expect(cell.hasBomb).toBe(false);
      expect(cell.bombsAround).toBe(1);
    });
  });

  describe('generateBombIndexes', () => {
    let service: GridsService;

    beforeEach(() => {
      service = new GridsService(/* mocks inutiles ici */);
    });

    it('doit générer le bon nombre d’indexes uniques', () => {
      const totalCells = 10;
      const totalBombs = 5;

      const result = service.generateBombIndexes(totalCells, totalBombs);

      expect(result.size).toBe(totalBombs);

      // Tous les indexes doivent être >=0 et < totalCells
      for (const index of result) {
        expect(index).toBeGreaterThanOrEqual(0);
        expect(index).toBeLessThan(totalCells);
      }
    });

    it('doit générer tous les indexes uniques même pour totalBombs = totalCells', () => {
      const totalCells = 5;
      const totalBombs = 5;

      const result = service.generateBombIndexes(totalCells, totalBombs);

      expect(result.size).toBe(totalCells);

      // On doit avoir tous les entiers de 0 à totalCells - 1
      for (let i = 0; i < totalCells; i++) {
        expect(result.has(i)).toBe(true);
      }
    });

    it('doit finir en boucle infinie si totalBombs > totalCells', () => {
      expect(() => {
        service.generateBombIndexes(3, 5);
      }).toThrow('Cannot generate more bombs than cells.');
    });
  });
});
