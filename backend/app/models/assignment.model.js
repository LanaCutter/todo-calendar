export default (sequelize, Sequelize) => {
  const Assignment = sequelize.define(
    "assignment",
    {
      name: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      classId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      dueDate: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      dueTime: {
        type: Sequelize.STRING(5),
        allowNull: true,
      },
      startWorkingBy: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
    },
    {
      tableName: "assignments",
    }
  );

  return Assignment;
};
