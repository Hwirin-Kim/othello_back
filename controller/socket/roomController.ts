import { Server, Socket } from "socket.io";
import Message from "../../models/domain/message";
import Room from "../../models/domain/room";
import User from "../../models/domain/user";

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
    const room = this.getRoom(roomId);
    const { username, nickname } = user;

    //방이 존재하지 않음
    if (!room) {
      console.log("방없음");
      return {
        success: false,
        data: "해당 방을 찾을 수 없습니다.",
      };
    }
    const MAXIMUM_USER = 2;
    //방에 내가 없으면서 인원이 2명인 경우
    const currentUserCount = room.users.length;
    if (
      currentUserCount >= MAXIMUM_USER &&
      !room.users.some((user) => user.username === username)
    ) {
      console.log("정원초과");
      return {
        success: false,
        data: "정원이 초과되었습니다.",
      };
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

      this.io.to(roomId).emit("user_joined", {
        success: true,
        data: userJoinedMessage,
      });
      return { success: true };
    }
    // 방에 재입장 하는 경우
    else {
      room.users = room.users.filter((u) => u.username !== user.username);
      room.users.push(user);
      console.log(nickname, ": 님 이 방에 접속함");
      socket.join(roomId);
      return { success: true };
    }
  }

  sendMessage(data, user, socket) {
    console.log(data);
    const { username, nickname } = user;
    const { roomId, message } = data;
    const room = this.getRoom(roomId);
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
    const room = this.getRoom(roomId);
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
        this.emitRoomInfo(roomId);
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
    socket.emit("room_list", this.rooms);
  }

  deleteRoom(roomId: string) {
    this.rooms = this.rooms.filter((room) => room.roomId !== roomId);
    this.io.emit("room_list", this.rooms);
  }
  getRoom(roomId) {
    return this.rooms.find((room) => room.roomId === roomId);
  }
  emitRoomInfo(roomId) {
    const room = this.getRoom(roomId);
    this.io.to(roomId).emit("room_info", room);
  }
  ready(roomId, username, nickname) {
    const room = this.getRoom(roomId);
    const ready = room.setReady(username);

    if (ready) {
      const message = new Message(
        "notice",
        username,
        nickname,
        `${nickname}님이 준비 완료 하셨습니다.`
      );
      this.io
        .to(roomId)
        .emit("receive_message", { success: true, data: message });
    } else {
      const message = new Message(
        "notice",
        username,
        nickname,
        `${nickname}님이 준비를 취소하였습니다.`
      );
      this.io
        .to(roomId)
        .emit("receive_message", { success: true, data: message });
    }
    return ready;
  }
  possibleGameStart(roomId) {
    const room = this.getRoom(roomId);
    if (room && room.allUsersReady) {
      this.io.to(roomId).emit("possible_game_start", true);
    } else this.io.to(roomId).emit("possible_game_start", false);
  }

  gameStart(roomId) {
    const room = this.getRoom(roomId);

    room.setGameStart();
    this.io.to(roomId).emit("game_status", room.gameStart);
    this.emitTurn(roomId, room.currentTurn);
    this.startTurnTimer(roomId);
  }

  startTurnTimer(roomId) {
    setTimeout(() => {
      this.changeTurn(roomId); // 시간 초과시 턴 변경
    }, 15000); // 15초 후 턴 변경
  }
  changeTurn(roomId) {
    const room = this.getRoom(roomId);
    room.setTurn();
    this.emitTurn(roomId, room.currentTurn);
  }

  emitTurn(roomId, turn) {
    this.io.to(roomId).emit("current_turn", { success: true, data: turn });
  }
}
