import { Request, Response } from "express";
import { User } from "../../models/db/user.model";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const registerUser = async (req: Request, res: Response) => {
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
};

export const checkUsername = async (req, res) => {
  console.log(req.body.payload);
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ error: "username이 제공되지 않았습니다." });
    }

    const existingUser = await User.findOne({ where: { username } });

    if (existingUser) {
      res.status(409).json({ error: "이미 존재하는 ID입니다." });
    } else {
      res.status(200).json({ success: true, message: "사용 가능한 ID입니다." });
    }
  } catch (error) {
    res.status(500).json({ error: "서버 오류입니다." });
  }
};

export const loginUser = async (req, res) => {
  console.log("로그인시도!");
  try {
    const { username, password } = req.body;
    console.log(username, password);
    //미입력 필터링
    if (!username || !password) {
      return res.status(401).json({ error: "ID 또는 PW가 미입력 되었습니다." });
    }

    const user = await User.findOne({ where: { username } });
    // 사용자가 DB에 존재하지 않는 경우
    if (!user) {
      return res.status(401).json({ error: "사용자를 찾을 수 없습니다." });
    }

    // 비밀번호 비교
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (passwordMatch) {
      const secretKey = process.env.JWT_SECRET;

      const accessToken = jwt.sign({ username: user.username }, secretKey, {
        expiresIn: "1h", // Access Token의 유효 기간 (1시간)
      });

      // Refresh Token 발급
      const refreshToken = jwt.sign({ username: user.username }, secretKey, {
        expiresIn: "7d", // Refresh Token의 유효 기간 (7일)
      });

      //토큰 쿠키에 저장
      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: true, // 개발 환경이 아닐 경우 true로 설정
        maxAge: 3600000, // 1시간
      });
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true, // HttpOnly 속성을 설정하여 JavaScript로 접근을 방지
        maxAge: 7 * 24 * 60 * 60 * 1000, // 쿠키의 만료 기간 (7일)
      });

      //Refresh Token DB에 저장
      await User.update(
        { refreshToken: refreshToken },
        { where: { id: user.id } }
      );

      // Refresh Token은 안전한 저장소에 저장 (예: HttpOnly 쿠키 또는 브라우저 저장소)

      //응답시 json으로 응답
      return res.status(200).json({
        message: "로그인 성공!",
        nickname: user.nickname,
        username: user.username,
      });
    } else {
      // 인증 실패
      return res.status(401).json({ error: "비밀번호가 일치하지 않습니다." });
    }
  } catch (error) {
    console.error("로그인 중 오류 발생:", error);
    res.status(500).json({ error: "서버 오류" });
  }
};
