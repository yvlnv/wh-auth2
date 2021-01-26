const express = require('express')
const session = require('express-session')
const app = express()
const {sequelize, User} = require('./models')
const Sequelize = require("sequelize")
const bcrypt = require('bcrypt')
const SequelizeStore = require("connect-session-sequelize")(session.Store)

const sessionSequelize = new Sequelize("database", "username", "password", {
    dialect: "sqlite",
    storage: "./sessions.sql",
  });

app.use(express.json())

const sessionStore = new SequelizeStore({
    db: sessionSequelize,
  });

const sessionSettings = {
    store: myStore,
    secret: "cats are best",
    resave: false,
    saveUninitialized: true
}

sessionStore.sync()

app.use(session(sessionSettings))

const protect = async (req, res, next) => {
    if (!req.session.userId) {
        res.sendStatus(400)
    } else {
        next()
    }
}

app.get("/", async (req, res) => {
    res.send("Welcome! Sign in here")
})

app.get("/login", async (req, res) => {
    const splitted_auth_header = req.headers.authorization.split(" ")[1]
    const decoded_un_pw = Buffer.from(splitted_auth_header, 'base64').toString()
    const decoded_un = decoded_un_pw.split(":")[0]
    const decoded_pw = decoded_un_pw.split(":")[1]
    const user = await User.findOne({
        where: {
            username: decoded_un
        }
    })
    if (!user) {
        res.sendStatus(404)
    } else {
        const pw_is_correct = await bcrypt.compare(decoded_pw, user.password)
        if (!pw_is_correct) {
            res.sendStatus(400)
        } else {
            req.session.userId = user.id
            res.locals.user = user
            res.send(`Welcome, ${res.locals.user.username}! You are now logged in`)
        }
    }
})

app.get("/logout", async (req, res) => {
    req.session.destroy()
    res.send("You are logged out")
})

app.get("/users/:id", protect, async (req, res) => {
    const viewer = await User.findByPk(req.session.userId)
    const viewing = await User.findByPk(req.params.id)
    res.send(`Welcome, ${viewer.username}! You are looking at ${viewing.username} page`)
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
