import { Sequelize } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";
import classModel from "./class.model.js";

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.class = classModel(sequelize, Sequelize);

export default db;
