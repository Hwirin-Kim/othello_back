import { createServer } from "node:http";
import { Server } from "socket.io";
import app from "./app";
import initSocket from "./socket";
import { sequelize } from "./config/database";
import { userRoutes } from "./routes/user.routes";

sequelize
  .authenticate()
  .then(() => {
    console.log("Connection has been established successfully.");
    return sequelize.sync();
  })
  .then(() => {
    console.log("All models were synchronized successfully.");
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err);
  });

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://172.30.1.65:3000"],
    exposedHeaders: ["Authorization"],
  },
});

initSocket(io);

server.listen(8080, () => {
  console.log("server running at http://localhost:8080");
});

app.use("/users", userRoutes);
