import { Server } from "socket.io";
import { GameStatus } from "../../models/db/status.model";
import { User } from "../../models/db/user.model";

export class UserController {
  private io: Server;
  private user: User;
  constructor(io: Server) {
    this.io = io;
  }

  connectUser(socket) {
    const { username, nickname } = socket.user;

    const user = new User(username, nickname);
    socket.data.user = user;
    this.user = user;
    console.log(`${nickname} (${username}) 님이 소켓에 접속하였음`);
  }
  getUser() {
    return this.user;
  }

  async setGameStatusReady(username: string, isReady: boolean) {
    console.log("setGameStatusReady : ", username);
    const gameStatus = await GameStatus.findOne({ where: { username } });
    if (gameStatus) {
      gameStatus.isReady = isReady;
      await gameStatus.save();
    } else {
      // GameStatus가 없는 경우, 적절한 오류 처리 또는 상태 생성
      console.error("GameStatus에 해당 username이 없음", username);
    }
  }
}
