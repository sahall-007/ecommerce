const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    phone: Number,
    gender: String,
    image: String,
    isListed: Boolean,
    googleId: {
        type: String,
        Unique: true
    }
}, { timestamps: true })

module.exports = mongoose.model("user", userSchema)