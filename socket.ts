import { Server } from "socket.io";
import { RoomController } from "./controller/roomController";
import { UserController } from "./controller/userController";

export default function initSocket(io: Server) {
  const userController = new UserController(io);
  const roomController = new RoomController(io);
  io.on("connection", (socket) => {
    userController.connectUser(socket);
    const user = socket.data.user;

    socket.on("create_room", (title: string) => {
      const room = roomController.createRoom(title);
      socket.join(room.roomId);
      room.addUser(user);
      socket.emit("created_room", { success: true, roomId: room.roomId });
      socket.emit("owner", room.getOwner().username);
    });

    socket.on("join_room", (roomId, callback) => {
      const join = roomController.joinRoom(roomId, user, socket);
      const room = roomController.getRoom(roomId);
      if (!join) {
        callback({ success: false, data: "해당 방을 찾을 수 없습니다." });
      } else {
        callback({ success: true, data: room });
      }
    });

    socket.on("send_message", (data) => {
      roomController.sendMessage(data, user, socket);
    });

    socket.on("leave_room", (roomId) => {
      roomController.leaveRoom(roomId, user, socket);
    });

    socket.on("get_room", () => {
      roomController.getRoomList(socket);
    });
  });
}
