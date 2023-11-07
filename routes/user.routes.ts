import { Router } from "express";
import {
  checkUsername,
  loginUser,
  registerUser,
} from "../controller/http/user.controller";

export const userRoutes = Router();

userRoutes.post("/register", registerUser);
userRoutes.post("/check", checkUsername);
userRoutes.post("/login", loginUser);
