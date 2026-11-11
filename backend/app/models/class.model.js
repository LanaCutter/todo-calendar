export default (sequelize, Sequelize) => {
  const Class = sequelize.define(
    "class",
    {
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      color: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
    },
    {
      tableName: "classes",
    }
  );

  return Class;
};
