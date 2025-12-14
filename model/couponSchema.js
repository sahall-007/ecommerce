const mongoose = require('mongoose')

const couponSchema = new mongoose.Schema({
    code: String,
    description: String,
    startDate: {
        type: Date,
        default: null
    },
    endDate: {
        type: Date,
        default: null
    },
    discount: Number,
    minimumPurchase: {
        type: Number,
        default: 0
    },
    maximumDiscount: Number,
    isListed: {
        type: Boolean,
        default: true
    },
    usedCount: Number

}, { timestamps: true })

module.exports = mongoose.model("coupon", couponSchema)