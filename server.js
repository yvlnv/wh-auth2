const express = require('express')
const app = express()
const {sequelize, User} = require('./models')
const bcrypt = require('bcrypt')

app.use(express.json())


// const basicAuth = require('express-basic-auth')
// const sqlite3 = require('sqlite3')
// const db = new sqlite3.Database('db.sql');

// app.use(basicAuth({
//     authorizer: dbAuthorizer,
//     authorizeAsync: true,
//     challenge: true,
//     unauthorizedResponse: (req) => {
//         return `unauthorized. ip: ${req.ip}`
//     }
// }));

// function dbAuthorizer(username, password, callback) {
//     const sql = "select password from users where username = ?;";
//     db.get(sql, [username], async (err, user) => {
//         err ? callback(err) : bcrypt.compare(password, user.password, callback);
//     });
// }

const protect = async (req, res, next) => {
    const splitted_auth_header = req.headers.authorization.split(" ")[1]
    const decoded_un_pw = Buffer.from(splitted_auth_header, 'base64').toString()
    const decoded_un = decoded_un_pw.split(":")[0]
    const decoded_pw = decoded_un_pw.split(":")[1]
    const users = await User.findAll({
        where: {
            username: decoded_un
        },
        limit: 1
    })
    if (!users) {
        res.sendStatus(404)
    } else {
        const user = users[0]
        const pw_is_correct = await bcrypt.compare(decoded_pw, user.password)
        if (!pw_is_correct) {
            res.sendStatus(400)
        } else {
            res.locals.user = user
            next()
        }
    }
}

app.get("/", async (req, res) => {
    res.send("Welcome! Sign in here")
})

app.get("/users/:id", protect, async (req, res) => {
    if (res.locals.user.id != req.params.id) {
        res.sendStatus(400)
    } else {
        res.send(`Welcome, ${res.locals.user.username}!`)
    }
})

app.post("/users", async (req, res) => {
    const user = await User.create(req.body)
    const encrypted_password = await bcrypt.hash(req.body.password, 10)
    user.password = encrypted_password
    await user.save()
    res.send(user)
})

app.listen(3000, () => {
    sequelize.sync().then(() => console.log("Running..."))
})
