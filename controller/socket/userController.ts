import { Server } from "socket.io";
import { GameStatus } from "../../models/db/status.model";
import { User } from "../../models/db/user.model";

export class UserController {
  //소켓연결 후 유저정보 확인 (아직미구현)
  async connectUser(username, nickname) {
    const gameStatus = await GameStatus.findOne({ where: { username } });

    const { isPlaying, isReady, isOwner, stoneColor } = gameStatus.dataValues;
    if (isPlaying) {
      console.log("유저컨트롤러 : 유저가 게임중이였습니다.");
    }

    console.log(
      `유저컨트롤러 : ${nickname} (${username}) 님이 소켓에 접속하였음`
    );
  }

  //해당 소켓의 유저정보 가져오기
  async getUserStatus(username: string) {
    const gameStatus = await GameStatus.findOne({ where: { username } });
    return gameStatus.dataValues;
  }

  //ready상태 변경
  async setGameStatusReady(username: string, isReady: boolean) {
    const gameStatus = await GameStatus.findOne({ where: { username } });
    if (gameStatus) {
      gameStatus.isReady = isReady;
      await gameStatus.save();
    } else {
      console.error("GameStatus에 해당 username이 없음", username);
      return null;
    }
  }

  //유저 돌 색상 변경
  async setUserStoneColor(username: string, color: "white" | "black") {
    const gameStatus = await GameStatus.findOne({ where: { username } });

    if (gameStatus) {
      gameStatus.stoneColor = color;
      await gameStatus.save();
    } else {
      console.error("GameStatus에 해당 username이 없음", username);
      return null;
    }
  }

  //유저 돌 색상 가져오기
  async getUserStoneColor(username: string) {
    const stoneColor = await GameStatus.findOne({
      where: { username },
      attributes: ["stoneColor"],
    });

    if (stoneColor) {
      return stoneColor;
    } else {
      console.error("GameStatus에 해당 username이 없음", username);
      return null;
    }
  }
}
