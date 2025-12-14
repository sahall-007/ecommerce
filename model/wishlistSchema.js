const mongoose = require('mongoose')

const wishlistSchema = new mongoose.Schema({
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
        price: Number
    }]
}, { timestamps: true })

module.exports = mongoose.model("wishlist", wishlistSchema)