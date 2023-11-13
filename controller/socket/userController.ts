import { Server } from "socket.io";
import { GameStatus } from "../../models/db/status.model";
import { User } from "../../models/db/user.model";

export class UserController {
  private io: Server;
  private user: User;
  constructor(io: Server) {
    this.io = io;
  }

  async connectUser(socket) {
    const { username, nickname } = socket.user;
    const gameStatus = await GameStatus.findOne({ where: { username } });

    const { isPlaying, isReady, isOwner, stoneColor } = gameStatus.dataValues;
    if (isPlaying) {
      console.log("유저컨트롤러 : 유저가 게임중이였습니다.");
    }

    console.log(
      `유저컨트롤러 : ${nickname} (${username}) 님이 소켓에 접속하였음`
    );
  }
  async getUserStatus(socket) {
    const { username } = socket.user;
    const gameStatus = await GameStatus.findOne({ where: { username } });
    return gameStatus.dataValues;
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
