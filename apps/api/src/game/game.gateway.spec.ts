import { Test, TestingModule } from '@nestjs/testing';
import { GameGateway } from './game.gateway';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Grid } from 'src/grids/entities/grid.entity';
import { GridsService } from 'src/grids/grids.service';
import { Cell } from 'src/cells/entities/cell.entity';
import { Room } from 'src/rooms/entities/room.entity';
import { Repository } from 'typeorm';

describe('GameGateway', () => {
  let gateway: GameGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameGateway,
        GridsService,
        {
          provide: getRepositoryToken(Grid),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Cell),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Room),
          useClass: Repository,
        },
      ],
    }).compile();

    gateway = module.get<GameGateway>(GameGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
