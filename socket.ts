import { Server } from "socket.io";
import { RoomController } from "./controller/socket/roomController";
import { UserController } from "./controller/socket/userController";
import { socketAuthenticate } from "./middleware/socketAuthenticate";
import { User } from "./models/db/user.model";
import { CustomSocket } from "./type";

export default function initSocket(io: Server) {
  io.use(socketAuthenticate);
  const userController = new UserController(io);
  const roomController = new RoomController(io);
  io.on("connection", (socket: CustomSocket) => {
    userController.connectUser(socket);
    const { username } = socket.user;
    User.findOne({
      attributes: ["username", "nickname"],
      where: {
        username: username,
      },
    }).then((res) => (socket.user = res.dataValues));

    const user = userController.getUser();

    socket.on("create_room", (title: string) => {
      const room = roomController.createRoom(title);
      socket.join(room.roomId);
      room.addUser(user);
      socket.emit("created_room", { success: true, roomId: room.roomId });
      socket.emit("owner", room.getOwner().username);
    });

    socket.on("join_room", (roomId, callback) => {
      const join = roomController.joinRoom(roomId, user, socket);
      roomController.emitRoomInfo(roomId);
      callback(join);
    });

    socket.on("send_message", (data) => {
      roomController.sendMessage(data, user, socket);
    });

    socket.on("leave_room", (roomId) => {
      roomController.leaveRoom(roomId, user, socket);
      roomController.emitRoomInfo(roomId);
    });

    socket.on("get_room", () => {
      roomController.getRoomList(socket);
    });

    socket.on("ready", (roomId, callback) => {
      const ready = roomController.ready(roomId, user.username, user.nickname);
      user.setReady(ready);
      callback(ready);
      roomController.possibleGameStart(roomId);
      roomController.emitRoomInfo(roomId);
    });

    socket.on("game_start", (roomId) => {
      roomController.gameStart(roomId);
    });
  });
}
