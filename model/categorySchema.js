const mongoose = require('mongoose')

const categorySchema = new mongoose.Schema({
    name: String,
    sold: Number,
    stock: Number,
    discount: {
        type: Number,
        default: 0
    },
    isListed: Boolean    
}, { timestamps: true })

module.exports = mongoose.model("category", categorySchema)