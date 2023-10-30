import { Server, Socket } from "socket.io";
import { Room } from "./type";

const rooms: Room[] = [];
export default function initSocket(io: Server) {
  io.on("connection", (socket) => {
    const username = socket.handshake.query.username as string;
    const nickname = socket.handshake.query.nickname as string;

    console.log(`${nickname} (${username}) 님이 소켓에 접속하였음`);

    socket.on("create_room", (roomInfo: string) => {
      let today = new Date();
      const roomId = (rooms.length + today.getTime()).toString();
      const room = {
        roomId,
        title: roomInfo,
        users: [username],
        createdAt: today.getTime(),
      };

      rooms.unshift(room);
      socket.join(room.roomId);
      socket.emit("created_room", { success: true, roomId });
      io.emit("room_list", rooms);
    });

    socket.on("join_room", (roomId) => {
      console.log(roomId, socket.id, "joined");
      const roomInfo = rooms.find((room) => room.roomId === roomId);
      console.log(roomInfo);
      const currentUserCount = roomInfo.users.length;
      const messageData = {
        senderId: username,
        senderNickname: nickname,
        message: "",
        timestamp: new Date(),
      };

      if (currentUserCount > 2 && !roomInfo.users.includes(username)) {
        console.log("소켓 정원 초과");
        socket.emit("joined_failed", {
          success: false,
          data: "방이 가득 찼습니다.",
        });
      } else if (!roomInfo.users.includes(username)) {
        console.log(nickname, ": 님 이 방에 접속함");
        roomInfo.users.push(username);
        socket.join(roomId);
        socket.emit("joined_room", { success: true, data: roomId });
        io.to(roomId).emit("user_joined", {
          success: true,
          data: {
            type: "notice",
            senderId: username,
            senderNickname: nickname,
            message: `${nickname} 님이 접속 하셨습니다.`,
          },
        });
      } else {
        console.log(nickname, ": 님 이 방에 접속함");
        socket.join(roomId);
        socket.emit("joined_room", { success: true, data: roomId });
      }

      console.log(roomInfo);
    });

    socket.on("send_message", (data) => {
      console.log(data);
      const { roomId, message } = data;
      const roomInfo = rooms.find((room) => room.roomId === roomId);
      const messageData = {
        type: "message",
        senderId: username,
        senderNickname: nickname,
        message: message,
        timestamp: new Date(),
      };
      if (!roomInfo.users.includes(username)) {
        console.log("해당 방에 접속하지 않았습니다.");
        socket.emit("send_message", {
          success: false,
          data: "해당 방에 접속하지 못했습니다.",
        });
      } else {
        io.to(roomId).emit("receive_message", {
          success: true,
          data: messageData,
        });
      }
    });
    socket.on("leave_room", (roomId) => {
      const roomInfo = rooms.find((room) => room.roomId === roomId);
      if (!roomInfo.users.includes(username)) {
        console.log("해당 방에 접속하지 않았습니다.");
        socket.emit("leave_room", {
          success: false,
          data: "해당 방에 접속하지 않으셨습니다.",
        });
      } else {
        roomInfo.users = roomInfo.users.filter((user) => user !== username);
        const messageData = {
          type: "notice",
          senderId: username,
          senderNickname: nickname,
          message: `${nickname} 님이 방을 나가셨습니다.`,
          timestamp: new Date(),
        };
        socket.leave(roomId);
        console.log(nickname, ": 방나감");
        io.to(roomId).emit("user_left", {
          success: true,
          data: messageData,
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
