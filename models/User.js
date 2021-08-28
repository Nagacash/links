const { Sequelize, DataTypes } = require("sequelize");
const db = require("../config/database.js");

const User = db.define("User", {
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false
    },

    email: {
        type: DataTypes.STRING(320),
        required: true,
        unique: true,
        allowNull: false
    },

    username: {
        type: DataTypes.STRING(20),
        required: true,
        unique: true,
        allowNull: false
    },

    password: {
        type: DataTypes.STRING(80),
        required: true,
        allowNull: false
    },

    created_at: {
        type: DataTypes.DATE
    },

    tableName: "Users"
})

module.exports = User