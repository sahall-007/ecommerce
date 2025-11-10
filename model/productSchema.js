const mongoose = require('mongoose')
const { schema } = require('./categorySchema')

const productSchema = new mongoose.Schema({
    name: String,
    discount: String,
    offer: String,
    isListed: {
        type: Boolean,
        default: true
    },
    discription: String,
    // brand: String,
    // category: String
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "category"
    },
    brandId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "brand"
    }
}, { timestamps: true })

module.exports = mongoose.model("product", productSchema)