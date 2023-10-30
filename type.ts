export type Room = {
  roomId: string;
  title: string;
  users: string[];
  createdAt: number;
};

type User = {
  username: string; // 유저의 고유 아이디
  nickname: string; // 유저의 닉네임
  status: "online" | "offline"; // 유저의 연결 상태
  isReady: boolean; // 게임 준비 상태
  color?: "black" | "white"; // 유저의 돌 색상
  score?: number; // 게임 내 점수나 랭킹 정보
};

type GameMove = {
  turn: "black" | "white"; // 누구의 턴인지
  coordinate: [number, number]; // 돌이 놓인 좌표
  timestamp: number; // 해당 수가 놓인 시간
};

type newRoom = {
  roomId: string; // 방의 고유 아이디
  title: string; // 방 제목
  users: User[]; // 방에 있는 유저 목록
  createdAt: number; // 방 생성 시간
  isGameStarted: boolean; // 게임 시작 상태
  currentTurn?: string; // 현재 턴인 유저의 아이디
  gameMoves: GameMove[]; // 게임 내 착수한 돌의 위치 및 정보
  gameResult?: {
    // 게임 결과 정보 (옵션)
    winner: string; // 승리자 아이디
    loser: string; // 패배자 아이디
    finalBoardState: any; // 게임 종료 시의 보드 상태
  };
};
