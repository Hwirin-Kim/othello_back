import { Server } from "socket.io";
import Room from "../models/domain/room";

export class RoomController {
  private io: Server;
  private rooms: Room[];
  constructor(io: Server) {
    this.io = io;
    this.rooms = [];
  }

  createRoom(title: string) {
    const room = new Room(title);
    this.rooms.unshift(room);
    this.io.emit("room_list", this.rooms);
    return room;
  }
}
