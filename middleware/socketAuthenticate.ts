import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import cookie from "cookie";

export const socketAuthenticate = (socket, next) => {
  const secretKey = process.env.JWT_SECRET;
  const handshakeData = socket.request;
  const cookies = cookie.parse(handshakeData.headers.cookie || "");
  const accessToken = cookies.accessToken;
  const refreshToken = cookies.refreshToken;
  console.log("미들웨어 접속!");
  // 액세스 토큰 검증
  if (accessToken) {
    try {
      console.log("엑세스토큰 검증");

      const decoded = jwt.verify(accessToken, secretKey!);
      socket.user = decoded;
      console.log("decoded:", decoded);
      next();
    } catch (err) {
      console.log("에러발생!", err);
      // 액세스 토큰이 만료된 경우 리프레시 토큰 검증
      if (err.name === "TokenExpiredError" && refreshToken) {
        try {
          const refreshDecoded = jwt.verify(refreshToken, secretKey);

          if (
            typeof refreshDecoded !== "object" ||
            !("username" in refreshDecoded)
          ) {
            return next(new Error("Invalid token"));
          }

          // 새 액세스 토큰 발급
          const newAccessToken = jwt.sign(
            {
              username: refreshDecoded.username,
              nickname: refreshDecoded.nickname,
            },
            secretKey,
            { expiresIn: "1h" }
          );

          // 소켓의 사용자 정보 업데이트
          socket.user = refreshDecoded;

          // TODO: 새 토큰을 클라이언트로 보내는 로직을 추가할 수 있습니다.
          // 예: socket.emit('update_token', newAccessToken);

          next();
        } catch (refreshErr) {
          next(new Error("Authentication error"));
        }
      } else {
        next(new Error("Authentication error"));
      }
    }
  } else {
    next(new Error("Authentication error"));
  }
};
