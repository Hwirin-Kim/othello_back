import { Server } from "socket.io";
import { RoomController } from "./controller/socket/roomController";
import { UserController } from "./controller/socket/userController";
import { socketAuthenticate } from "./middleware/socketAuthenticate";
import { User } from "./models/db/user.model";
import { CustomSocket } from "./type";

export default function initSocket(io: Server) {
  io.use(socketAuthenticate);
  const userController = new UserController();
  const roomController = new RoomController(io);

  //socket 접속
  io.on("connection", (socket: CustomSocket) => {
    const { username, nickname } = socket.user;
    userController.connectUser(username, nickname);
    const user = socket.user;
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
    socket.on("join_room", async (roomId, callback) => {
      const join = roomController.joinRoom(roomId, socket);
      roomController.emitRoomInfo(roomId);
      console.log("방입장의 join : ", join);
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

    //사용자 ready(클라이언트요청)
    socket.on("ready", async (roomId, callback) => {
      const ready = roomController.ready(roomId, user);

      await userController.setGameStatusReady(username, ready);
      callback(ready);
      roomController.emitRoomInfo(roomId);
    });

    //방장이 게임 시작(클라이언트요청)
    socket.on("game_start", (roomId) => {
      console.log("게임시작요청!");
      roomController.gameStart(roomId);
    });

    //사용자가 돌 착수(클라이언트요청)
    socket.on("placed_stone", (roomId, data) => {
      roomController.playerMove(roomId);
      console.log(data, roomId);
      io.to(roomId).emit("opponent_placed_stone", data);
    });

    //사용자 돌 색상 요청(클라이언트요청)
    socket.on("my_stone_color", (roomId, callback) => {
      const room = roomController.getRoom(roomId);
      const myColor = room.getMyColor(username);
      callback(myColor);
    });
  });
}
