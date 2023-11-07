import { Router } from "express";
import {
  checkUsername,
  loginUser,
  registerUser,
} from "../controller/http/user.controller";

const router = Router();

router.post("/register", registerUser);
router.post("/check", checkUsername);
router.post("/login", loginUser);
export default router;
