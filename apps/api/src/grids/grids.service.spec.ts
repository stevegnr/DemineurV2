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
import { Room } from 'src/rooms/entities/room.entity';
import * as gridUtils from './grid-utils';

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

  const mockRoomRepository = {
    findOneBy: jest.fn(),
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
        {
          provide: getRepositoryToken(Room),
          useValue: mockRoomRepository,
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
    it('doit créer une grille avec des buffers compactés et renvoyer un OutputGrid', async () => {
      // Arrange : on prépare les valeurs simulées
      const mockMines = Buffer.from([0b00001111]);
      const mockOuvertures = Buffer.from([0b00000000]);

      // On espionne fillGrid pour qu’il renvoie nos buffers factices
      jest.spyOn(service, 'fillGrid').mockReturnValue({
        mines: mockMines,
        ouvertures: mockOuvertures,
      });

      // Simule une Room existante
      mockRoomRepository.findOneBy.mockResolvedValue({
        id: mockCreateGridDto.roomId,
      });

      // Simule la création de l’entité Grid
      const mockSavedGrid = {
        id: 1,
        height: mockCreateGridDto.height,
        width: mockCreateGridDto.width,
        bombs: mockCreateGridDto.bombs,
        room: { id: mockCreateGridDto.roomId },
        mines: mockMines,
        ouvertures: mockOuvertures,
      };
      mockGridRepository.create.mockReturnValue(mockSavedGrid);
      mockGridRepository.save.mockResolvedValue(mockSavedGrid);

      // On espionne la fonction utilitaire pour parser les buffers en cellules
      jest
        .spyOn(gridUtils, 'generateOutputCells')
        .mockReturnValue([
          { x: 1, y: 1, isOpen: false, bombsAround: undefined },
        ]);

      // Act : on appelle le service
      const result = await service.create(mockCreateGridDto);

      // Assert : on vérifie les appels et le résultat
      expect(service.fillGrid).toHaveBeenCalledWith(
        mockCreateGridDto.height,
        mockCreateGridDto.width,
        mockCreateGridDto.bombs,
      );
      expect(mockGridRepository.create).toHaveBeenCalledWith({
        height: mockCreateGridDto.height,
        width: mockCreateGridDto.width,
        bombs: mockCreateGridDto.bombs,
        room: { id: mockCreateGridDto.roomId },
        mines: mockMines,
        ouvertures: mockOuvertures,
      });
      expect(mockGridRepository.save).toHaveBeenCalledWith(mockSavedGrid);
      expect(gridUtils.generateOutputCells).toHaveBeenCalledWith(mockSavedGrid);
      expect(result).toEqual({
        id: mockSavedGrid.id,
        height: mockSavedGrid.height,
        width: mockSavedGrid.width,
        bombs: mockSavedGrid.bombs,
        cells: [{ x: 1, y: 1, isOpen: false, bombsAround: undefined }],
      });
    });

    it('doit appeler fillGrid et parseGridData correctement', async () => {
      // Arrange : comme avant
      const mockMines = Buffer.from([0b00001111]);
      const mockOuvertures = Buffer.from([0b00000000]);

      jest.spyOn(service, 'fillGrid').mockReturnValue({
        mines: mockMines,
        ouvertures: mockOuvertures,
      });

      mockRoomRepository.findOneBy.mockResolvedValue({
        id: mockCreateGridDto.roomId,
      });

      const mockSavedGrid = {
        id: 1,
        height: mockCreateGridDto.height,
        width: mockCreateGridDto.width,
        bombs: mockCreateGridDto.bombs,
        room: { id: mockCreateGridDto.roomId },
        mines: mockMines,
        ouvertures: mockOuvertures,
      };
      mockGridRepository.create.mockReturnValue(mockSavedGrid);
      mockGridRepository.save.mockResolvedValue(mockSavedGrid);

      jest.spyOn(gridUtils, 'generateOutputCells').mockReturnValue([
        { x: 1, y: 1, isOpen: false, bombsAround: undefined },
        { x: 1, y: 2, isOpen: false, bombsAround: undefined },
      ]);

      // Act
      const result = await service.create(mockCreateGridDto);

      // Assert
      expect(service.fillGrid).toHaveBeenCalledTimes(1);
      expect(gridUtils.generateOutputCells).toHaveBeenCalledTimes(1);
      expect(result.cells).toHaveLength(2);
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
      });
      expect(result).toMatchObject({
        id: 1,
        width: 10,
        height: 10,
        bombs: 10,
        cells: expect.any(Array),
      });
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
      service = new GridsService(/* mocks si nécessaire */);

      jest.spyOn(service, 'generateBombIndexes').mockImplementation(() => {
        // Exemple : place une bombe à l’index 2 (1-based)
        return new Set([2]);
      });
    });

    it('doit créer des buffers mines et ouvertures de la bonne taille', () => {
      const height = 3;
      const width = 3;
      const bombs = 1;

      const { mines, ouvertures } = service.fillGrid(height, width, bombs);

      const nbCases = height * width;
      const expectedLength = Math.ceil(nbCases / 8);

      expect(mines.length).toBe(expectedLength);
      expect(ouvertures.length).toBe(expectedLength);
    });

    it('doit placer correctement les bombes dans le buffer mines', () => {
      const { mines } = service.fillGrid(3, 3, 1);

      // Bombe à l’index 2 (1-based) → index 1 (0-based)
      const byteIndex = Math.floor(1 / 8);
      const bitIndex = 1 % 8;

      const isBombSet = (mines[byteIndex] & (1 << bitIndex)) !== 0;

      expect(isBombSet).toBe(true);
    });

    it('doit laisser le buffer ouvertures vide (tout fermé)', () => {
      const { ouvertures } = service.fillGrid(3, 3, 1);

      for (const byte of ouvertures) {
        expect(byte).toBe(0);
      }
    });
  });

  describe('generateBombIndexes', () => {
    let service: GridsService;

    beforeEach(() => {
      service = new GridsService();
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
