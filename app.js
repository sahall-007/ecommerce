const express = require("express")
const connected = require('./db/connectDB.js')
const userRoute = require('./routes/user/user.js')
const adminRoute = require('./routes/admin/admin.js')
const env = require('dotenv').config()
const PDFDocument = require('pdfkit');

const orderController = require('./controller/user/orderController.js')

const session = require('express-session')
const nocache = require('nocache')
const passport = require('./config/passport.js')
const stripe = require('./config/stripe.js')

// logger.info("server has started")

const app = express()

// middlewares---------------------------------------

app.use(express.static('public'))
app.use('/uploads', express.static(__dirname + '/uploads'));


app.post('/webhook', express.raw({ type: 'application/json' }), orderController.webhook);

app.use(express.json())
app.use(express.urlencoded({ extends: true }))
app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 72 * 60 * 60 * 1000
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

app.use('/admin', (req, res) => {
    res.render('pageNotFound')
})

app.use('/', (req, res) => {
    res.render('pageNotFound')
})

connected()

app.listen(process.env.PORT, () => {
    console.log(`server running on port ${process.env.PORT}`)
})