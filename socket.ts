import { Server, Socket } from "socket.io";
import Message from "./models/message";
import Room from "./models/room";
import User from "./models/user";

const rooms: Room[] = [];
export default function initSocket(io: Server) {
  io.on("connection", (socket) => {
    const username = socket.handshake.query.username as string;
    const nickname = socket.handshake.query.nickname as string;

    const user = new User(username, nickname);
    console.log(`${nickname} (${username}) 님이 소켓에 접속하였음`);

    socket.on("create_room", (title: string) => {
      const room = new Room(title);
      rooms.unshift(room);
      socket.join(room.roomId);
      socket.emit("created_room", { success: true, roomId: room.roomId });
      io.emit("room_list", rooms);
    });

    socket.on("join_room", (roomId) => {
      console.log(roomId, socket.id, "joined");
      const room = rooms.find((room) => room.roomId === roomId);
      console.log(room);
      const currentUserCount = room.users.length;
      const messageData = {
        senderId: username,
        senderNickname: nickname,
        message: "",
        timestamp: new Date(),
      };

      if (
        currentUserCount > 2 &&
        !room.users.some((user) => user.username === username)
      ) {
        console.log("소켓 정원 초과");
        socket.emit("joined_failed", {
          success: false,
          data: "방이 가득 찼습니다.",
        });
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
        io.to(roomId).emit("user_joined", {
          success: true,
          data: userJoinedMessage,
        });
      } else {
        console.log(nickname, ": 님 이 방에 접속함");
        socket.join(roomId);
        socket.emit("joined_room", { success: true, data: roomId });
      }

      console.log(room);
    });

    socket.on("send_message", (data) => {
      console.log(data);
      const { roomId, message } = data;
      const room = rooms.find((room) => room.roomId === roomId);
      const sendMessage = new Message("message", username, nickname, message);

      if (!room.users.some((user) => user.username === username)) {
        console.log("해당 방에 접속하지 않았습니다.");
        socket.emit("send_message", {
          success: false,
          data: "해당 방에 접속하지 못했습니다.",
        });
      } else {
        io.to(roomId).emit("receive_message", {
          success: true,
          data: sendMessage,
        });
      }
    });

    socket.on("leave_room", (roomId) => {
      const room = rooms.find((room) => room.roomId === roomId);
      const leaveRoomMessage = new Message(
        "notice",
        username,
        nickname,
        `${nickname} 님이 방을 나가셨습니다.`
      );
      if (!room.users.some((user) => user.username === username)) {
        console.log("해당 방에 접속하지 않았습니다.");
        socket.emit("leave_room", {
          success: false,
          data: "해당 방에 접속하지 않으셨습니다.",
        });
      } else {
        room.users = room.users.filter((user) => user.username !== username);

        socket.leave(roomId);
        console.log(nickname, ": 방나감");
        io.to(roomId).emit("user_left", {
          success: true,
          data: leaveRoomMessage,
        });
      }
    });

    socket.on("get_room", () => {
      socket.emit("room_list", rooms);
    });

    socket.on("ready", (readyData) => {
      io.to(readyData.roomId).emit("ready", {
        username: username,
        nickname: nickname,
        status: readyData.status,
      });
    });
  });
}
