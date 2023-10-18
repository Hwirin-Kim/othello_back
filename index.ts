import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
  },
});

app.use(
  cors({
    origin: "http://localhost:3000",
  })
);

app.get("/", (req, res) => {
  console.log("user 접속(get)");
  res.send("<h1>이것은 get으로 들어온 홈 (index.js)</h1>");
});

const rooms = [];

io.on("connection", (socket) => {
  socket.on("create_room", (roomInfo) => {
    let today = new Date();
    const roomId = (rooms.length + today.getTime()).toString();
    const room = {
      roomId,
      title: roomInfo,
      sockets: [socket.id],
      createdAt: today.getTime(),
    };

    rooms.unshift(room);
    socket.join(room.roomId);
    socket.emit("created_room", { success: true, roomId });
  });

  socket.on("join_room", (roomId) => {
    console.log(roomId, socket.id, "joined");
    socket.join(roomId);
    socket.emit("joined_room", { success: true, roomId });
    io.to(roomId).emit("user_joined", `${socket.id} has joined the room`);
  });

  socket.on("send_message", (data) => {
    console.log(data);
    const { roomId, message } = data;

    io.to(roomId).emit("receive_message", {
      user: socket.id,
      message,
    });
  });

  socket.on("leave_room", (room) => {
    socket.leave(room);
    io.to(room).emit("user_left", `${socket.id} has left the room`);
  });

  socket.on("get_room", () => {
    socket.emit("room_list", rooms);
  });
});

server.listen(8080, () => {
  console.log("server running at http://localhost:8080");
});
