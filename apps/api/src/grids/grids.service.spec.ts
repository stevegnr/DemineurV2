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

describe('GridsService', () => {
  let service: GridsService;
  let repository: jest.Mocked<Repository<Grid>>;

  const mockDeleteResult: DeleteResult = {
    raw: [],
    affected: 1,
  };

  const mockRepository = {
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
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<GridsService>(GridsService);
    repository = module.get(getRepositoryToken(Grid));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('doit être défini', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('doit créer une grille et la sauvegarder', async () => {
      mockRepository.create.mockReturnValue(mockGrid);
      mockRepository.save.mockResolvedValue(mockGrid);

      const result = await service.create(mockCreateGridDto);

      expect(repository.create).toHaveBeenCalledWith(mockCreateGridDto);
      expect(repository.save).toHaveBeenCalledWith(mockGrid);
      expect(result).toEqual(mockGrid);
    });
  });

  describe('findAll', () => {
    it('doit retourner toutes les grilles', async () => {
      mockRepository.find.mockResolvedValue([mockGrid]);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalled();
      expect(result).toEqual([mockGrid]);
    });
  });

  describe('findOne', () => {
    it('doit retourner une grille par son id', async () => {
      mockRepository.findOneBy.mockResolvedValue(mockGrid);

      const result = await service.findOne(1);

      expect(repository.findOneBy).toHaveBeenCalledWith({ id: 1 });
      expect(result).toEqual(mockGrid);
    });
  });

  describe('update', () => {
    it('doit mettre à jour une grille existante', async () => {
      const updatedGrid: Grid = { ...mockGrid, ...mockUpdateGridDto };
      mockRepository.preload.mockResolvedValue(updatedGrid);
      mockRepository.save.mockResolvedValue(updatedGrid);

      const result = await service.update(1, mockUpdateGridDto);

      expect(repository.preload).toHaveBeenCalledWith({
        id: 1,
        ...mockUpdateGridDto,
      });
      expect(repository.save).toHaveBeenCalledWith(updatedGrid);
      expect(result).toEqual(updatedGrid);
    });

    it('doit lever une exception NotFoundException si la grille est introuvable', async () => {
      mockRepository.preload.mockResolvedValue(undefined);

      await expect(service.update(1, mockUpdateGridDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.preload).toHaveBeenCalledWith({
        id: 1,
        ...mockUpdateGridDto,
      });
    });
  });

  describe('remove', () => {
    it('doit supprimer une grille existante', async () => {
      mockRepository.findOneBy.mockResolvedValue(mockGrid);
      mockRepository.delete.mockResolvedValue(mockDeleteResult);

      const result = await service.remove(1);

      expect(repository.findOneBy).toHaveBeenCalledWith({ id: 1 });
      expect(repository.delete).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockDeleteResult);
    });

    it('doit retourner undefined si la grille est introuvable', async () => {
      mockRepository.findOneBy.mockResolvedValue(undefined);

      const result = await service.remove(1);

      expect(repository.findOneBy).toHaveBeenCalledWith({ id: 1 });
      expect(repository.delete).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
    });
  });
});
