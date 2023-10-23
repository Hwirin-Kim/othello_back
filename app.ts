import express from "express";
import cors from "cors";

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
  }),
  express.json()
);

app.get("/", (req, res) => {
  console.log("user 접속(get)");
  res.send("hello, this is my server!");
});

export default app;
