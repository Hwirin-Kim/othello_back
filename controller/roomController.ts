import { Server } from "socket.io";
import Message from "../models/domain/message";
import Room from "../models/domain/room";
import User from "../models/domain/user";

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

  joinRoom(roomId: string, user: User, socket) {
    const room = this.rooms.find((room) => room.roomId === roomId);
    const { username, nickname } = user;
    console.log("joined 콘솔로그 ", room);
    if (!room) {
      return null;
    }

    const currentUserCount = room.users.length;
    if (
      currentUserCount > 2 &&
      !room.users.some((user) => user.username === username)
    ) {
      console.log("room 정원 초과");
      socket.emit("joined_failed", {
        success: false,
        data: "정원이 초과되었습니다.",
      });
      return true;
    } else if (!room.users.some((user) => user.username === username)) {
      console.log(nickname, ": 님 이 방에 접속함");
      const userJoinedMessage = new Message(
        "notice",
        username,
        nickname,
        `${nickname} 님이 접속 하셨습니다.`
      );
      room.users.push(user);
      socket.join(roomId);
      socket.emit("joined_room", { success: true, data: roomId });
      this.io.to(roomId).emit("user_joined", {
        success: true,
        data: userJoinedMessage,
      });
      return true;
    } else {
      console.log(nickname, ": 님 이 방에 접속함");
      socket.join(roomId);
      socket.emit("joined_room", { success: true, data: roomId });
      return true;
    }
  }

  sendMessage(data, user, socket) {
    console.log(data);
    const { username, nickname } = user;
    const { roomId, message } = data;
    const room = this.rooms.find((room) => room.roomId === roomId);
    const sendMessage = new Message("message", username, nickname, message);

    if (!room.users.some((user) => user.username === username)) {
      console.log("해당 방에 접속하지 않았습니다.");
      socket.emit("send_message", {
        success: false,
        data: "해당 방에 접속하지 못했습니다.",
      });
    } else {
      this.io.to(roomId).emit("receive_message", {
        success: true,
        data: sendMessage,
      });
    }
  }

  leaveRoom(roomId, user, socket) {
    const { username, nickname } = user;
    const room = this.rooms.find((room) => room.roomId === roomId);
    const leaveRoomMessage = new Message(
      "notice",
      username,
      nickname,
      `${nickname} 님이 방을 나가셨습니다.`
    );

    const leave = room.leaveUser(username);

    if (leave) {
      socket.leave(roomId);
      console.log(nickname, ": 방나감");
      this.io.to(roomId).emit("user_left", {
        success: true,
        data: leaveRoomMessage,
      });

      if (room.users.length === 0) {
        this.deleteRoom(roomId);
      }
    } else {
      console.log("해당 방에 접속하지 않았습니다.");
      socket.emit("leave_room", {
        success: false,
        data: "해당 방에 접속하지 않으셨습니다.",
      });
    }
  }

  getRoom(socket) {
    socket.emit("room_list", this.rooms);
  }

  deleteRoom(roomId: string) {
    this.rooms = this.rooms.filter((room) => room.roomId !== roomId);
    this.io.emit("room_list", this.rooms);
  }
}
