import { Server, Socket } from "socket.io";
import { User } from "../../models/db/user.model";
import Message from "../../models/domain/message";
import Room from "../../models/domain/room";
import { GameStatus } from "../../models/db/status.model";

export class RoomController {
  private io: Server;
  private rooms: Room[];
  7;
  constructor(io: Server) {
    this.io = io;
    this.rooms = [];
  }

  //방생성
  createRoom(title: string, socket: Socket, user) {
    const room = new Room(title);
    this.rooms.unshift(room);
    this.io.emit("room_list", this.rooms);
    socket.join(room.roomId);
    const simpleUser = { ...user, stoneColor: "white" };
    room.addUser(simpleUser);
    return room;
  }

  //방입장
  joinRoom(roomId: string, socket) {
    const room = this.getRoom(roomId);
    const user = socket.user;
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
      const opponent = room.users.find((u) => u.username !== username);
      const myColor = opponent.stoneColor === "white" ? "black" : "white";

      //돌 색상을 검정으로 변경
      const simpleUser: {
        username: string;
        nickname: string;
        stoneColor: "white" | "black";
      } = { username, nickname, stoneColor: myColor };

      console.log(nickname, ": 님 이 방에 접속함");
      const userJoinedMessage = new Message(
        "notice",
        username,
        nickname,
        `${nickname} 님이 접속 하셨습니다.`
      );
      room.users.push(simpleUser);
      socket.join(roomId);

      this.io.to(roomId).emit("user_joined", {
        success: true,
        data: userJoinedMessage,
      });
      return { success: true };
    }
    // 방에 재입장 하는 경우
    else {
      room.users = room.users.filter((user) => user.username !== username);
      room.users.push(user);
      console.log(nickname, ": 님 이 방에 접속함");
      socket.join(roomId);
      return { success: true };
    }
  }

  //메시지전송
  sendMessage(data, socket) {
    console.log(data);
    const { username, nickname } = socket.user;
    const { roomId, message } = data;
    const room = this.getRoom(roomId);
    const sendMessage = new Message("message", username, nickname, message);

    if (!room.users.some((user) => user === username)) {
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

  //방퇴장
  leaveRoom(roomId, socket) {
    const { username, nickname } = socket.user;
    const room = this.getRoom(roomId);
    const leaveRoomMessage = new Message(
      "notice",
      username,
      nickname,
      `${nickname} 님이 방을 나가셨습니다.`
    );

    const leave = room.leaveUser(username);
    const leftUser = room.leftUser();

    //room객체에서 user제거 시킨 후 실제 socket에서 제거시키기
    if (leave) {
      socket.leave(roomId);
      console.log(nickname, ": 방나감");
      this.io.to(roomId).emit("user_left", {
        success: true,
        data: leaveRoomMessage,
      });

      //남은 유저에게 방장 위임
      if (leftUser && leftUser !== room.owner) {
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

  //방목록전송(소켓이 클라이언트로)
  getRoomList(socket) {
    socket.emit("room_list", this.rooms);
  }

  //방 삭제
  deleteRoom(roomId: string) {
    this.rooms = this.rooms.filter((room) => room.roomId !== roomId);
    this.io.emit("room_list", this.rooms);
  }

  //방 정보 가져오기
  getRoom(roomId) {
    return this.rooms.find((room) => room.roomId === roomId);
  }

  //방 정보 전송 (소켓이 클라이언트로)
  emitRoomInfo(roomId) {
    const room = this.getRoom(roomId);
    this.io.to(roomId).emit("room_info", room);
  }

  //사용자 레디
  ready(roomId, user) {
    const { username, nickname } = user;
    const room = this.getRoom(roomId);
    const ready = room.setReady(user);

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

  async gameStart(roomId: string) {
    const room = this.getRoom(roomId);
    room.setRoomStatus("playing");
    this.emitRoomInfo(roomId);
    const winner = await room.startTurnTimer(this.io, roomId);

    if (winner) {
      this.gameOver(roomId);
    }
  }

  async playerMove(roomId: string) {
    const room = this.getRoom(roomId);
    room.changeTurn();
    this.emitTurn(roomId);
    const winner = await room.startTurnTimer(this.io, roomId);
    if (winner) {
      this.gameOver(roomId);
      return null;
    }
  }

  emitTurn(roomId) {
    const room = this.getRoom(roomId);
    const currentTurn = room.getCurrentTurn();
    this.io
      .to(roomId)
      .emit("current_turn", { success: true, data: currentTurn });
  }

  gameOver(roomId) {
    const room = this.getRoom(roomId);
    const winner = room.winner;
    this.io.to(roomId).emit("game_over", winner);
    room.roomReset();
  }
}
