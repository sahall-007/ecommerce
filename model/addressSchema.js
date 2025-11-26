const mongoose = require('mongoose')

const addressSchema = new mongoose.Schema({
    billingAddress: [{
        fullname: String,
        email: String,
        pincode: Number,
        phone: Number,
        address: String,
        addressType: String,
        isSelected: Boolean
    }],
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    },
}, {timestamps: true}, {_id: true})

module.exports = mongoose.model("address", addressSchema)