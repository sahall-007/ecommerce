const mongoose = require('mongoose')

const userCouponSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    couponId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'coupon'
    },
    startDate: Date,
    endDate: Date,
    usedAt: Date,
    used: {
        type: Boolean,
        default: false
    }
    

}, { timestamps: true })

module.exports = mongoose.model("userCoupon", userCouponSchema)