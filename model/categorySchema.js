const mongoose = require('mongoose')

const categorySchema = new mongoose.Schema({
    name: String,
    sold: Number,
    stock: Number,
    discount: Number,
    isListed: Boolean    
}, { timestamps: true })

module.exports = mongoose.model("category", categorySchema)