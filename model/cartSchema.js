const mongoose = require('mongoose')

const cartSchema = new mongoose.Schema({
    totalQuantity: Number,
    totalPrice: Number,
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    },
    items: [{
        variantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "variant"
        },
        quantity: {
            type: Number,
            default: 1
        },
        price: Number
    }]
}, { timestamps: true })

module.exports = mongoose.model("cart", cartSchema)