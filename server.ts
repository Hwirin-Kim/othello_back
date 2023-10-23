import { Request, Response } from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import app from "./app";
import initSocket from "./socket";
import bcrypt from "bcryptjs";
import { User } from "./model";

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
  },
});

initSocket(io);

server.listen(8080, () => {
  console.log("server running at http://localhost:8080");
});

app.post("/register", async (req: Request, res: Response) => {
  console.log("Received registration request:", req.body);
  const { username, nickname, password } = req.body;

  if (!username || !password || !nickname) {
    return res
      .status(400)
      .json({ error: "id와 nickname, password를 필수로 입력하세요." });
  }
  try {
    //id중복검사
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(409).json({ error: "이미 존재하는 ID입니다." });
    }

    //id유효성검사
    if (!/^[a-zA-Z0-9]{4,16}$/.test(username)) {
      return res
        .status(400)
        .json({ error: "아이디는 영어와 숫자조합으로 4~16글자여야 합니다." });
    }

    //닉네임 유효성검사
    if (!/^[a-zA-Z0-9\u0000-\uFFFF]{2,5}$/.test(nickname)) {
      return res
        .status(400)
        .json({ error: "닉네임은 2~5글자이고 특수문자는 불가능합니다." });
    }

    //pw유효성검사
    if (password.length < 6 || password.length > 20) {
      return res.status(400).json({ error: "비밀번호는 6~20자여야 합니다." });
    }

    //pw해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    //유저 등록 (해싱된 비밀번호로)
    const newUser = await User.create({
      username,
      password: hashedPassword,
      nickname,
    });

    res
      .status(200)
      .json({ message: "회원가입이 완료되었습니다.", userId: newUser.id });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "서버 오류입니다." });
  }
});

app.post("/check", async (req, res) => {
  try {
    const { username } = req.body;
    const existingUser = await User.findOne({ where: { username } });

    if (existingUser) {
      res.status(409).json({ error: "이미 존재하는 ID입니다." });
    } else {
      res.status(200).json({ success: true, message: "사용 가능한 ID입니다." });
    }
  } catch (error) {
    console.error("ID중복검사 오류 : ", error);
    res.status(500).json({ error: "서버 오류입니다." });
  }
});
