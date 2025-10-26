const express = require("express")
const connected = require('./db/connectDB.js')
const userRoute = require('./routes/user.js')
const adminRoute = require('./routes/admin.js')

const app = express()

// middlewares---------------------------------------
app.use(express.static('public'))
app.use(express.json())
app.use(express.urlencoded({extends: true}))

// view engine---------------------------------------
app.set("view engine", "ejs")

// router
app.use('/', userRoute)
app.use('/admin', adminRoute)


connected()

app.listen(3000, () => {
    console.log("server running on port 3000")
})