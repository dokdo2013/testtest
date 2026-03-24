import { Sequelize } from "sequelize";

const isTest = process.env.NODE_ENV === "test";

export const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: isTest ? ":memory:" : "./database.sqlite",
  logging: false,
});
