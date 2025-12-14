const mongoose = require('mongoose')

const brandSchema = new mongoose.Schema({
    name: String,
    discount: {
        type: Number,
        default: 0
    },
    isListed: Boolean
}, { timestamps: true })

module.exports = mongoose.model("brand", brandSchema)