import { Sequelize } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";
import classModel from "./class.model.js";
import assignmentModel from "./assignment.model.js";
import dayTodoModel from "./dayTodo.model.js";

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.class = classModel(sequelize, Sequelize);
db.assignment = assignmentModel(sequelize, Sequelize);
db.dayTodo = dayTodoModel(sequelize, Sequelize);

db.class.hasMany(db.assignment, { foreignKey: "classId", onDelete: "RESTRICT" });
db.assignment.belongsTo(db.class, { foreignKey: "classId", as: "class", onDelete: "RESTRICT" });
db.assignment.hasMany(db.dayTodo, { foreignKey: "assignmentId", as: "dayTodos", onDelete: "CASCADE" });
db.dayTodo.belongsTo(db.assignment, { foreignKey: "assignmentId", as: "assignment", onDelete: "CASCADE" });

export default db;
