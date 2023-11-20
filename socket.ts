import { Server } from "socket.io";
import { RoomController } from "./controller/socket/roomController";
import { UserController } from "./controller/socket/userController";
import { socketAuthenticate } from "./middleware/socketAuthenticate";
import { User } from "./models/db/user.model";
import { CustomSocket } from "./type";
import SimpleUser from "./models/domain/simpleUser";

export default function initSocket(io: Server) {
  io.use(socketAuthenticate);
  const userController = new UserController();
  const roomController = new RoomController(io);

  //socket 접속
  io.on("connection", (socket: CustomSocket) => {
    const { username, nickname } = socket.user;
    const simpleUser = new SimpleUser(username, nickname);
    userController.connectUser(username, nickname);

    User.findOne({
      attributes: ["username", "nickname"],
      where: {
        username: username,
      },
    }).then((res) => (socket.user = res.dataValues));

    //방생성(클라이언트요청)
    socket.on("create_room", async (title: string) => {
      try {
        const room = roomController.createRoom(title, socket, simpleUser);

        socket.emit("created_room", { success: true, roomId: room.roomId });
        socket.emit("owner", room.getOwner());
      } catch (error) {
        console.log(error);
      }
    });

    //방입장(클라이언트요청)
    socket.on("join_room", async (roomId, callback) => {
      try {
        const join = roomController.joinRoom(roomId, socket, simpleUser);
        roomController.emitRoomInfo(roomId);
        console.log("방입장의 join : ", join);
        callback(join);
      } catch (error) {
        console.log(error);
      }
    });

    //방정보(클라이언트요청)
    socket.on("room_info", (roomId, callback) => {
      try {
        const room = roomController.getRoom(roomId);
        callback(room);
      } catch (error) {
        console.log(error);
      }
    });

    //채팅전송(클라이언트요청)
    socket.on("send_message", (data) => {
      try {
        roomController.sendMessage(data, socket);
      } catch (error) {
        console.log(error);
      }
    });

    //방나가기(클라이언트요청)
    socket.on("leave_room", (roomId) => {
      try {
        roomController.leaveRoom(roomId, socket);
        roomController.emitRoomInfo(roomId);
      } catch (error) {
        console.log(error);
      }
    });

    //방목록 불러오기(클라이언트요청)
    socket.on("get_room_list", () => {
      try {
        roomController.emitRoomList(socket);
      } catch (error) {
        console.log(error);
      }
    });

    //사용자 ready(클라이언트요청)
    socket.on("ready", async (roomId) => {
      try {
        const ready = roomController.ready(roomId, simpleUser);
        await userController.setGameStatusReady(username, ready);
        roomController.emitRoomInfo(roomId);
      } catch (error) {
        console.log(error);
      }
    });

    //방장이 게임 시작(클라이언트요청)
    socket.on("game_start", (roomId) => {
      try {
        console.log("게임시작요청!");
        roomController.gameStart(roomId, simpleUser);
      } catch (error) {
        console.log("game_start 오류", error);
      }
    });

    //사용자가 돌 착수(클라이언트요청)
    socket.on("placed_stone", (roomId, data) => {
      try {
        roomController.playerMove(roomId, simpleUser);
        console.log(data, roomId);
        io.to(roomId).emit("opponent_placed_stone", data);
      } catch (error) {
        console.log("placed_stone 오류", error);
      }
    });

    //사용자 돌 색상 요청(클라이언트요청)
    socket.on("my_stone_color", (roomId, callback) => {
      try {
        const room = roomController.getRoom(roomId);
        const myColor = room.getMyColor(username);
        callback(myColor);
      } catch (error) {
        console.log(error);
      }
    });
  });
}
