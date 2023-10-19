import { Server, Socket } from "socket.io";

const rooms = [];
export default function initSocket(io: Server) {
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
}
