import { Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { RequestWithUser } from "../type";

export const authenticate = (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  const secretKey = process.env.JWT_SECRET;
  const accessToken = req.cookies.accessToken;
  const refreshToken = req.cookies.refreshToken;

  // 액세스 토큰 검증
  if (accessToken) {
    try {
      const decoded = jwt.verify(accessToken, secretKey!);

      req.user = decoded;

      return next();
    } catch (err) {
      if (err.name === "TokenExpiredError" && refreshToken) {
        try {
          const refreshDecoded = jwt.verify(refreshToken, secretKey!);

          if (
            typeof refreshDecoded !== "object" ||
            !("username" in refreshDecoded)
          ) {
            throw new Error("Invalid token");
          }

          const username = (refreshDecoded as JwtPayload).username;

          if (typeof username !== "string") {
            throw new Error("Invalid token payload");
          }
          const newAccessToken = jwt.sign(
            {
              username: refreshDecoded.username,
              nickname: refreshDecoded.nickname,
            },
            secretKey!,
            { expiresIn: "1h" }
          );

          // 새 토큰을 쿠키에 저장
          res.cookie("accessToken", newAccessToken, {
            httpOnly: true,

            maxAge: 3600000,
          });

          req.user = refreshDecoded;
          return next();
        } catch (refreshErr) {
          // 리프레시 토큰도 만료되었거나 유효하지 않음
          return res
            .status(401)
            .json({ message: "Invalid session, please login again" });
        }
      }
    }
  } else {
    // 액세스 토큰이 없는 경우
    return res.status(401).json({ message: "Access token is required" });
  }
};
