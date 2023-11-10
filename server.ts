import { createServer } from "node:http";
import { Server } from "socket.io";
import app from "./app";
import initSocket from "./socket";
import { sequelize } from "./config/database";
import userRoutes from "./routes/user.routes";
import authRoutes from "./routes/auth.routes";
import { User } from "./models/db/user.model";
import { GameStatus } from "./models/db/status.model";
import { Record } from "./models/db/record.model";

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");

    // 모델 동기화 순서를 제어
    await User.sync();
    console.log("User model was synchronized successfully.");

    await GameStatus.sync();
    console.log("GameStatus model was synchronized successfully.");

    await Record.sync();
    console.log("GameRecord model was synchronized successfully.");
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
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
  } catch (error) {
    console.error("server error");
  }
};

startServer();

// sequelize
//   .authenticate()
//   .then(() => {
//     console.log("Connection has been established successfully.");
//     return User.sync({ force: true });
//   })
//   .then(() => {
//     return GameStatus.sync({ force: true });
//   })
//   .then(() => {
//     return Record.sync({ force: true }).then(() => {
//       return console.log("DB updated successfully.");
//     });
//   })
//   .then(() => {
//     console.log("All models were synchronized successfully.");
//   })
//   .catch((err) => {
//     console.error("Unable to connect to the database:", err);
//   });

// const server = createServer(app);
// const io = new Server(server, {
//   cors: {
//     origin: ["http://localhost:3000", "http://172.30.1.65:3000"],
//     credentials: true,
//   },
// });

// initSocket(io);

// server.listen(8080, () => {
//   console.log("server running at http://localhost:8080");
// });

// app.use("/user", userRoutes);

// app.use("/", authRoutes);
