import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { Room } from './entities/room.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { generateOutputCells } from 'src/grids/grid-utils';
import { OutputRoom } from './dto/Output.room';
import type { Server } from 'socket.io';

@Injectable()
export class RoomsService {
  @InjectRepository(Room) roomRepository: Repository<Room>;

  private rooms: Map<string, { players: { id: string; name: string }[] }> =
    new Map();

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

  addPlayer(roomId: string, player: { id: string; name: string }) {
    let room = this.rooms.get(roomId);
    if (!room) {
      room = { players: [] };
      this.rooms.set(roomId, room);
    }
    const exists = room.players.find((p) => p.id === player.id);
    if (!exists) {
      room.players.push(player);
    }
  }

  removePlayer(roomId: string, playerId: string) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.players = room.players.filter((p) => p.id !== playerId);
      if (room.players.length === 0) {
        this.rooms.delete(roomId);
      }
    }
  }

  removePlayerEverywhere(playerId: string, server: Server) {
    for (const [roomId, room] of this.rooms.entries()) {
      const before = room.players.length;
      room.players = room.players.filter((p) => p.id !== playerId);
      if (before !== room.players.length) {
        // Diffuse la nouvelle liste à cette room
        server.to(roomId).emit('updatedPlayers', room.players);
      }
      if (room.players.length === 0) {
        this.rooms.delete(roomId);
      }
    }
  }

  getPlayers(roomId: string) {
    return this.rooms.get(roomId)?.players ?? [];
  }
}
