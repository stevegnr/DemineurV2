import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { Room } from './entities/room.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { generateOutputCells } from 'src/grids/grid-utils';
import { OutputRoom } from './dto/Output.room';

@Injectable()
export class RoomsService {
  @InjectRepository(Room) roomRepository: Repository<Room>;

  async create(createRoomDto: CreateRoomDto): Promise<Room> {
    const room: Room = this.roomRepository.create(createRoomDto);

    return this.roomRepository.save(room);
  }

  findAll(): Promise<Room[]> {
    return this.roomRepository.find();
  }

  async findOne(id: string): Promise<OutputRoom> {
    const room: Room = await this.roomRepository.findOne({
      where: { id },
      relations: { grids: true },
    });

    const { grids, ...roomWithoutGrids } = room;

    const output: OutputRoom = {
      ...roomWithoutGrids,
      grid: {
        ...grids[0],
        cells: grids.length > 0 ? generateOutputCells(grids[0]) : [],
      },
    };

    return output;
  }

  async update(id: string, updateRoomDto: UpdateRoomDto): Promise<Room> {
    const room: Room = await this.roomRepository.preload({
      id,
      ...updateRoomDto,
    });

    if (!room) throw new NotFoundException();

    return this.roomRepository.save(room);
  }

  async remove(id: string): Promise<DeleteResult> {
    const room: Room = await this.roomRepository.findOneBy({ id });

    if (!room) return;

    return this.roomRepository.delete(id);
  }
}
