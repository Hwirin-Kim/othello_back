import { createServer } from "node:http";
import { Server } from "socket.io";
import app from "./app";
import initSocket from "./socket";
import userRoutes from "./routes/user.routes";
import authRoutes from "./routes/auth.routes";
import sequelize from "./models/db";

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
    await sequelize.sync();
    console.log("model was synchronized successfully");
  } catch (error) {
    console.error("Database connection failed:", error);
  }
};

const startServer = async () => {
  try {
    await connectDB();
    const server = createServer(app);
    const io = new Server(server, {
      cors: {
        origin: ["http://localhost:3000", "http://172.30.1.65:3000"],
        credentials: true,
      },
    });

    initSocket(io);

    server.listen(8080, () => {
      console.log("server running at http://localhost:8080");
    });

    app.use("/user", userRoutes);
    app.use("/", authRoutes);
    console.log("서버접속완료");
  } catch (error) {
    console.error("server error");
  }
};

startServer();
