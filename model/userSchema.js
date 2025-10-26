const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    phone: Number,
    gender: String,
    isBlocked: Boolean
})

module.exports = mongoose.model("user", userSchema)