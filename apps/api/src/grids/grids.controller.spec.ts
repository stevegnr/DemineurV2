import { Test, TestingModule } from '@nestjs/testing';
import { GridsController } from './grids.controller';
import { GridsService } from './grids.service';
import {
  mockGrid,
  mockCreateGridDto,
  mockUpdateGridDto,
  mockDeleteResult,
} from './entities/grid.mock';

describe('GridsController', () => {
  let controller: GridsController;
  let service: GridsService;

  const gridsServiceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GridsController],
      providers: [
        {
          provide: GridsService,
          useValue: gridsServiceMock,
        },
      ],
    }).compile();

    controller = module.get<GridsController>(GridsController);
    service = module.get<GridsService>(GridsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('doit être défini', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('doit appeler gridsService.create et retourner une grille', async () => {
      gridsServiceMock.create.mockResolvedValue(mockGrid);

      const result = await controller.create(mockCreateGridDto);

      expect(service.create).toHaveBeenCalledWith(mockCreateGridDto);
      expect(result).toEqual(mockGrid);
    });
  });

  describe('findAll', () => {
    it('doit appeler gridsService.findAll et retourner un tableau de grilles', async () => {
      gridsServiceMock.findAll.mockResolvedValue([mockGrid]);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual([mockGrid]);
    });
  });

  describe('findOne', () => {
    it('doit appeler gridsService.findOne avec un id et retourner une grille', async () => {
      gridsServiceMock.findOne.mockResolvedValue(mockGrid);

      const result = await controller.findOne('1');

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockGrid);
    });
  });

  describe('update', () => {
    it('doit appeler gridsService.update avec un id et un DTO et retourner la grille mise à jour', async () => {
      gridsServiceMock.update.mockResolvedValue(mockGrid);

      const result = await controller.update('1', mockUpdateGridDto);

      expect(service.update).toHaveBeenCalledWith(1, mockUpdateGridDto);
      expect(result).toEqual(mockGrid);
    });
  });

  describe('remove', () => {
    it('doit appeler gridsService.remove avec un id et retourner le résultat de suppression', async () => {
      gridsServiceMock.remove.mockResolvedValue(mockDeleteResult);

      const result = await controller.remove('1');

      expect(service.remove).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockDeleteResult);
    });
  });
});
