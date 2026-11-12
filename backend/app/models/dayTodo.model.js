export default (sequelize, Sequelize) => {
  const DayTodo = sequelize.define(
    "dayTodo",
    {
      assignmentId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      name: {
        type: Sequelize.STRING(200),
        allowNull: true,
      },
      todoDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      completed: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      tableName: "day_todos",
      indexes: [
        {
          unique: true,
          fields: ["assignmentId", "todoDate"],
        },
      ],
    },
  );

  return DayTodo;
};
