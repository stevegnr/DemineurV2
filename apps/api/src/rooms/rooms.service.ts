import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { Room } from './entities/room.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';

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

  findOne(id: string): Promise<Room> {
    return this.roomRepository.findOne({
      where: { id },
      relations: { grids: true },
    });
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
