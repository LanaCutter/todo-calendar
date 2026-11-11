import { Sequelize } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";
import classModel from "./class.model.js";
import assignmentModel from "./assignment.model.js";

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.class = classModel(sequelize, Sequelize);
db.assignment = assignmentModel(sequelize, Sequelize);

db.class.hasMany(db.assignment, { foreignKey: "classId", onDelete: "RESTRICT" });
db.assignment.belongsTo(db.class, { foreignKey: "classId", as: "class", onDelete: "RESTRICT" });

export default db;
