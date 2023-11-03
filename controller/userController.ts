import { Server } from "socket.io";
import User from "../models/domain/user";

export class UserController {
  private io: Server;
  constructor(io: Server) {
    this.io = io;
  }

  connectUser(socket) {
    const username = socket.handshake.query.username as string;
    const nickname = socket.handshake.query.nickname as string;

    const user = new User(username, nickname);
    socket.data.user = user;
    console.log(`${nickname} (${username}) 님이 소켓에 접속하였음`);
  }
}
