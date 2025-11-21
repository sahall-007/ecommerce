const express = require("express")
const connected = require('./db/connectDB.js')
const userRoute = require('./routes/user.js')
const adminRoute = require('./routes/admin/admin.js')

const session = require('express-session')
const nocache = require('nocache')
const passport = require('./config/passport.js')

const logger = require("./config/logger.js")

logger.info("server has started")

const app = express()

// middlewares---------------------------------------

app.use(express.static('public'))
app.use('/uploads', express.static(__dirname + '/uploads'));

app.use(express.json())
app.use(express.urlencoded({extends: true}))
app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 72*60*60*1000
    }
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(nocache())

// view engine---------------------------------------
app.set("view engine", "ejs")

// router

app.use('/', userRoute)
app.use('/admin', adminRoute)

connected()

app.listen(3000, () => {
    console.log("server running on port 3000")
})