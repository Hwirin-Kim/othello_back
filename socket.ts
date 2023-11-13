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

  //socket 접속
  io.on("connection", (socket: CustomSocket) => {
    userController.connectUser(socket);
    const user = socket.user;
    const { username, nickname } = socket.user;
    User.findOne({
      attributes: ["username", "nickname"],
      where: {
        username: username,
      },
    }).then((res) => (socket.user = res.dataValues));

    //방생성(클라이언트요청)
    socket.on("create_room", async (title: string) => {
      const room = roomController.createRoom(title, socket, user);

      socket.emit("created_room", { success: true, roomId: room.roomId });
      socket.emit("owner", room.getOwner());
    });

    //방입장(클라이언트요청)
    socket.on("join_room", (roomId, callback) => {
      const join = roomController.joinRoom(roomId, socket);
      roomController.emitRoomInfo(roomId);
      callback(join);
    });

    //방정보(클라이언트요청)
    socket.on("room_info", (roomId, callback) => {
      const room = roomController.getRoom(roomId);
      callback(room);
    });

    //채팅전송(클라이언트요청)
    socket.on("send_message", (data) => {
      roomController.sendMessage(data, socket);
    });

    //방나가기(클라이언트요청)
    socket.on("leave_room", (roomId) => {
      roomController.leaveRoom(roomId, socket);
      roomController.emitRoomInfo(roomId);
    });

    //방목록 불러오기(클라이언트요청)
    socket.on("get_room_list", () => {
      roomController.getRoomList(socket);
    });

    // socket.on("ready", (roomId, callback) => {
    //   const ready = roomController.ready(roomId, username, nickname);
    //   console.log(ready);
    //   userController.setGameStatusReady(username, ready);
    //   callback(ready);
    //   roomController.possibleGameStart(roomId);
    //   roomController.emitRoomInfo(roomId);
    // });

    // socket.on("game_start", (roomId) => {
    //   roomController.gameStart(roomId);
    // });
  });
}
