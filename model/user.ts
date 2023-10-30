export class User {
  id: string;
  username: string;
  nickname: string;
  isReady: boolean;
  color: "black" | "white";

  constructor(id: string, username: string, nickname: string) {
    this.id = id;
    this.username = username;
    this.nickname = nickname;
    this.isReady = false;
  }

  setReadyStatus(status: boolean) {
    this.isReady = status;
  }
  setColor(color: "black" | "white") {
    this.color = color;
  }
}
