import { Response, Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { RequestWithUser } from "../type";

const router = Router();

// 인증 상태 확인을 위한 라우트
router.get(
  "/auth/check",
  authenticate,
  (req: RequestWithUser, res: Response) => {
    // authenticate 미들웨어가 유효한 토큰을 검증하고 req.user를 설정했다고 가정합니다.
    if (req.user) {
      res.status(200).json({
        isAuthenticated: true,
        user: req.user, // 사용자 정보를 포함시킵니다.
      });
    } else {
      res.status(200).json({
        isAuthenticated: false,
      });
    }
  }
);

export default router;
