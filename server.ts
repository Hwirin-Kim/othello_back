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
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .send({ error: "Username and password are required." });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username,
      password: hashedPassword,
    });
    res.send({ message: "User registered successfully!", userId: newUser.id });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).send({ error: "Server error." });
  }
});
