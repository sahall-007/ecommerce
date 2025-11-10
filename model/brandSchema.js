const mongoose = require('mongoose')

const brandSchema = new mongoose.Schema({
    name: String,
    sold: Number,
    isListed: Boolean
}, { timestamps: true })

module.exports = mongoose.model("brand", brandSchema)