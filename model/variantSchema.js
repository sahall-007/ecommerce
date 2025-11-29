const mongoose = require('mongoose')
const { schema } = require('./categorySchema')

const variantSchema = new mongoose.Schema({
    ram: String,
    storage: String,
    color: String,
    price: Number,
    quantity: Number,
    isListed: {
        type: Boolean,
        default: true
    },
    image: [String],
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "product"
    }

}, { timestamps: true })

module.exports = mongoose.model("variant", variantSchema)