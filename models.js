const {Model, Sequelize, DataTypes} = require('sequelize')
const sequelize = new Sequelize("sqlite:./db.sql", {logging: false})

class User extends Model {}
User.init({
    username: DataTypes.STRING,
    password: DataTypes.STRING
}, {sequelize: sequelize})

module.exports = {
    User,
    sequelize
}
