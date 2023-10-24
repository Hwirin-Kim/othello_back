// models.ts
import { Sequelize, Model, DataTypes } from "sequelize";
import dotenv from "dotenv";

dotenv.config();
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: "127.0.0.1",
    dialect: "mysql",
  }
);

class User extends Model {
  public id!: number;
  public username!: string;
  public password!: string;
  public nickname!: string;
  public refreshToken!: string;
}
sequelize
  .authenticate()
  .then(() => {
    console.log(
      "Connection to the database has been established successfully."
    );
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err);
  });

User.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    username: {
      type: new DataTypes.STRING(128),
      allowNull: false,
    },
    nickname: {
      type: new DataTypes.STRING(128),
      allowNull: false,
    },
    password: {
      type: new DataTypes.STRING(128),
      allowNull: false,
    },
    refreshToken: {
      // refreshToken 컬럼 정의
      type: new DataTypes.STRING(256), // 적절한 데이터 타입으로 지정
      allowNull: true, // 사용자 생성 시 refreshToken이 없을 수도 있으므로 allowNull 설정
    },
  },
  {
    tableName: "users",
    sequelize: sequelize,
  }
);

sequelize.sync().then(() => {
  console.log("All models were synchronized successfully.");
});

export { sequelize, User };
