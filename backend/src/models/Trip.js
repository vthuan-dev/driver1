'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Trip extends Model {
    static associate(models) {
      Trip.belongsTo(models.Driver, { foreignKey: 'driver_id', as: 'driver' });
    }
  }

  Trip.init({
    id: {
      type: DataTypes.STRING(50),
      primaryKey: true
    },
    badge: {
      type: DataTypes.STRING(50),
      defaultValue: 'Mới'
    },
    pickup_location: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    dropoff_location: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    distance_km: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    estimated_minutes: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    price: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    service_tags: {
      type: DataTypes.JSON,
      defaultValue: ['Lái xe hộ']
    },
    status: {
      type: DataTypes.ENUM('new', 'accepted', 'in_progress', 'completed', 'cancelled'),
      defaultValue: 'new'
    },
    is_virtual: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    driver_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    time_posted: {
      type: DataTypes.STRING(100),
      defaultValue: 'Vừa xong'
    },
    customer_name: {
      type: DataTypes.STRING(100),
      defaultValue: 'Khách hàng'
    },
    customer_phone: {
      type: DataTypes.STRING(20),
      defaultValue: '0912345678'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Trip',
    tableName: 'trips',
    underscored: true
  });

  return Trip;
};
