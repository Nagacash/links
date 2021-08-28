const { Sequelize, DataTypes } = require("sequelize");
const db = require("../config/database.js");

const Link = db.define("Link", {
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false
    },
    link: {
        type: DataTypes.STRING,
        required: true,
        allowNull: false
    },
    tableName: "Link"
})

module.exports = Link