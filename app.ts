import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: ["http://localhost:3000", "http://172.30.1.65:3000"],
    credentials: true,
  }),
  express.json()
);
app.use(cookieParser());

export default app;
