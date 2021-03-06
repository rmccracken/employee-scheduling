module.exports = (sequelize, DataTypes) => {
  return sequelize.define('shifts', {
    id: {
      type: DataTypes.INTEGER, 
      primaryKey: true, 
      autoIncrement: true,
    },
    start_date: {
      type: DataTypes.STRING,
      allowNull: false
    },
    end_date: {
      type: DataTypes.STRING,
      allowNull: false
    },
    shift_title: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    timestamps: false
  });
};