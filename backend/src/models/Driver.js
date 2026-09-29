'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Driver extends Model {
    static associate(models) {
      Driver.hasMany(models.Trip, { foreignKey: 'driver_id', as: 'trips' });
      Driver.hasMany(models.Review, { foreignKey: 'driver_id', as: 'reviews' });
    }
  }

  Driver.init({
    full_name: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    },
    area: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    service_types: {
      type: DataTypes.JSON,
      defaultValue: ['lai_xe_ho']
    },
    avatar_url: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    vehicle_info: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    experience: {
      type: DataTypes.STRING(50),
      defaultValue: '2 năm'
    },
    total_trips: {
      type: DataTypes.INTEGER,
      defaultValue: 320
    },
    completion_rate: {
      type: DataTypes.INTEGER,
      defaultValue: 98
    },
    daily_income: {
      type: DataTypes.INTEGER,
      defaultValue: 1250000
    },
    daily_trips: {
      type: DataTypes.INTEGER,
      defaultValue: 5
    },
    rating: {
      type: DataTypes.FLOAT,
      defaultValue: 4.9
    },
    rating_count: {
      type: DataTypes.INTEGER,
      defaultValue: 320
    },
    status: {
      type: DataTypes.ENUM('pending', 'active', 'blocked'),
      defaultValue: 'active'
    },
    is_online: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    verified_docs: {
      type: DataTypes.JSON,
      defaultValue: ['CCCD/CMND', 'Giấy phép lái xe', 'Đăng kiểm xe', 'Bảo hiểm xe']
    },
    document_details: {
      type: DataTypes.JSON,
      defaultValue: {}
    },
    note: {
      type: DataTypes.TEXT,
      defaultValue: 'Tài xế chuyên nghiệp, thân thiện, đúng giờ'
    },
    payment_status: {
      type: DataTypes.ENUM('unpaid', 'paid'),
      defaultValue: 'paid'
    },
    payment_amount: {
      type: DataTypes.INTEGER,
      defaultValue: 300000
    },
    payment_receipt: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: '123456'
    },
    role: {
      type: DataTypes.ENUM('user', 'driver', 'admin'),
      defaultValue: 'driver'
    }
  }, {
    sequelize,
    modelName: 'Driver',
    tableName: 'drivers',
    underscored: true
  });

  return Driver;
};
