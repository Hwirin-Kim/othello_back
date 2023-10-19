import { createServer } from "node:http";
import { Server } from "socket.io";
import app from "./app";
import initSocket from "./socket";

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
