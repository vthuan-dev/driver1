'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Review extends Model {
    static associate(models) {
      Review.belongsTo(models.Driver, { foreignKey: 'driver_id', as: 'driver' });
    }
  }

  Review.init({
    driver_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    customer_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    rating: {
      type: DataTypes.FLOAT,
      defaultValue: 5.0
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Review',
    tableName: 'driver_reviews',
    underscored: true
  });

  return Review;
};
