import { Response, Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { RequestWithUser } from "../type";

const router = Router();

// 인증 상태 확인을 위한 라우트
router.get(
  "/auth/check",
  authenticate,
  (req: RequestWithUser, res: Response) => {
    console.log("http에서 쿠키 검증요청!");
    if (req.user) {
      res.status(200).json({
        isAuthenticated: true,
        user: req.user,
      });
    } else {
      res.status(200).json({
        isAuthenticated: false,
      });
    }
  }
);

export default router;
