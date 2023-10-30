import { User } from "../model";

export class Room {
  roomId: string;
  title: string;
  users: User[];
  createdAt: number;
  isGameStarted: boolean;
  turnState: "black" | "white";
  stonePlacements: {
    username: string;
    turn: "black" | "white";
    coordinate: [number, number];
  }[];
  readyUsers: string[];

  constructor(title: string) {
    let today = new Date();
    this.roomId = (Math.random() + today.getTime()).toString();
    this.title = title;
    this.users = [];
    this.createdAt = today.getTime();
    this.isGameStarted = this.readyUsers.length === 2;
    this.turnState = "black";
    this.stonePlacements = [];
    this.readyUsers = [];
  }

  addUser(user: User) {
    if (this.users.length < 2 && !this.users.includes(user)) {
      this.users.push(user);
    }
  }
  removeUser(username: string) {
    this.users = this.users.filter((user) => user.username !== username);
  }
  setReady(username: string, isReady: boolean) {
    if (isReady) {
      this.readyUsers.push(username);
    }
  }
  setStones(
    coordinate: [number, number],
    username: string,
    turn: "black" | "white"
  ) {
    let placed = {
      username,
      turn,
      coordinate,
    };
    this.stonePlacements.push(placed);
  }
  resetRoom() {
    this.isGameStarted = false;
    this.turnState = "black";
    this.stonePlacements = [];
    this.readyUsers = [];
  }
}
