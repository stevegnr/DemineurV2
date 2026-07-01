import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { Room } from './entities/room.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { generateOutputCells } from 'src/grids/grid-utils';
import { OutputRoom } from './dto/Output.room';
import type { Server } from 'socket.io';

type RoomState = {
  players: { id: string; name: string }[];
  mode: '1player' | '2players';
  currentTurnIndex: number;
  scores: Record<string, number>;
};

@Injectable()
export class RoomsService {
  @InjectRepository(Room) roomRepository: Repository<Room>;

  private rooms: Map<string, RoomState> = new Map();

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
        isGameOver: grids[0]?.isGameOver ?? true,
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

  async getRoomMode(roomId: string): Promise<'1player' | '2players'> {
    const inMemory = this.rooms.get(roomId);
    if (inMemory) return inMemory.mode;

    const room = await this.roomRepository.findOneBy({ id: roomId });
    return (room?.mode ?? '1player') as '1player' | '2players';
  }

  getMode(roomId: string): '1player' | '2players' {
    return this.rooms.get(roomId)?.mode ?? '1player';
  }

  canJoin(roomId: string, mode: '1player' | '2players'): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return true;
    const maxPlayers = mode === '1player' ? 1 : 2;
    return room.players.length < maxPlayers;
  }

  addPlayer(
    roomId: string,
    player: { id: string; name: string },
    mode: '1player' | '2players',
  ) {
    let room = this.rooms.get(roomId);
    if (!room) {
      room = { players: [], mode, currentTurnIndex: 0, scores: {} };
      this.rooms.set(roomId, room);
    }
    const exists = room.players.find((p) => p.id === player.id);
    if (!exists) {
      room.players.push(player);
      room.scores[player.id] = 0;
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

  getCurrentTurn(roomId: string): string | null {
    const room = this.rooms.get(roomId);
    if (!room || room.players.length === 0) return null;
    return room.players[room.currentTurnIndex % room.players.length]?.id ?? null;
  }

  nextTurn(roomId: string) {
    const room = this.rooms.get(roomId);
    if (room && room.players.length > 0) {
      room.currentTurnIndex =
        (room.currentTurnIndex + 1) % room.players.length;
    }
  }

  addScore(roomId: string, playerId: string, points: number) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.scores[playerId] = (room.scores[playerId] ?? 0) + points;
    }
  }

  getScores(roomId: string): Record<string, number> {
    return this.rooms.get(roomId)?.scores ?? {};
  }

  renamePlayer(roomId: string, playerId: string, name: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const player = room.players.find((p) => p.id === playerId);
    if (player) player.name = name;
  }

  resetGame(roomId: string) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.currentTurnIndex = 0;
      room.scores = {};
      for (const player of room.players) {
        room.scores[player.id] = 0;
      }
    }
  }
}
