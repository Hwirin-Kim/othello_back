import { Server, Socket } from "socket.io";
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

    //방이 존재하지 않음
    if (!room) {
      return null;
    }

    const currentUserCount = room.users.length;
    //방에 내가 없으면서 인원이 2명인 경우
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
    }
    // 방에 처음 입장하는 경우
    else if (!room.users.some((user) => user.username === username)) {
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
    }
    // 방에 재입장 하는 경우
    else {
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
    const leftUser = room.leftUser();
    if (leave) {
      socket.leave(roomId);
      console.log(nickname, ": 방나감");
      this.io.to(roomId).emit("user_left", {
        success: true,
        data: leaveRoomMessage,
      });

      //방장 변경
      if (leftUser && leftUser.username !== room.owner.username) {
        room.setOwner(leftUser);
        const message = new Message(
          "notice",
          username,
          nickname,
          `${leftUser.nickname}님이 방장이 되셨습니다.`
        );
        this.io.to(roomId).emit("receive_message", {
          success: true,
          data: message,
        });
      }

      //방 삭제
      if (!leftUser) {
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

  getRoomList(socket) {
    console.log("왜 에러가..?", socket);
    socket.emit("room_list", this.rooms);
  }

  deleteRoom(roomId: string) {
    this.rooms = this.rooms.filter((room) => room.roomId !== roomId);
    this.io.emit("room_list", this.rooms);
  }
  getRoom(roomId) {
    return this.rooms.find((room) => room.roomId === roomId);
  }
}
