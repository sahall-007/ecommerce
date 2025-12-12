

const mongoose = require('mongoose')
// console.log("ORDER SCHEMA FILE LOADED:", __filename);

// Force delete cached model
// try {
//     mongoose.deleteModel('order');
//     console.log("Deleted existing ORDER model from cache");
// } catch (e) {
//     console.log("ORDER model did not exist in cache");
// }


const orderSchema = new mongoose.Schema({
    orderId: String,
    totalPriceBeforeDiscount: Number,
    payablePrice: Number,
    discountAmount: Number,
    items: [{
        name: String,
        price: String,
        quantity: Number,
        ram: String,
        storage: String,
        color: String,
        image: String,
        discount: Number,
        priceAfterDiscount: Number,
        subTotal: Number,
        priceAfterCouponDiscount: Number,
        refundTransactionId: { 
            type: mongoose.Schema.Types.ObjectId,
            default: null
        },
        status: { 
            type: String, 
            enum: ['Pending', 'Out for delivery', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled', 'Return requested', 'Returned', 'Return approved', 'Return rejected', 'Returning'],
            default: 'Pending'
        }, 
        deliveredAt: { 
            type: Date, 
        },
        cancelledAt: { 
            type: Date, 
        },
        returnedAt: { 
            type: Date, 
        },
        shippedAt: { 
            type: Date, 
        },
        outForDeliveryAt: { 
            type: Date, 
        },
        cancellation: { 
            requested: Boolean, 
            reason: String, 
            requestedAt: Date 
        },
        return: { 
            requested: Boolean, 
            reason: String, 
            customReason: String,
            image: String,
            requestedAt: Date 
        },
        returnReject: {
            rejected: Boolean,
            reason: String, 
            customReason: String,
            rejectedAt: Date
        },
        productId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'product', 
            required: true 
        },
        variantId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'variant',         
            required: true 
        },
    }],
    billingAddress: {
        fullname: { type: String },
        email: { type: String },
        pincode: { type: Number },
        phone: { type: Number },
        address: { type: String },
        city: { type: String },
        state: { type: String },
        isSelected: { type: Boolean },
        addressType: { type: String }
    },
    paymentMethod: { 
        type: String, 
        enum: ['COD', 'Stripe', 'Wallet'], 
        default: 'COD' 
    },
    status: { 
        type: String, 
        enum: ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled', 'Returned'],
        default: 'Pending'
    }, 
    cancellation: { 
        requested: Boolean, 
        reason: String, 
        requestedAt: Date 
    },
    return: { 
        requested: Boolean, 
        reason: String, 
        requestedAt: Date 
    },
    placedAt: { 
        type: Date, 
        default: Date.now 
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    },
    couponCode: {
        type: String,
        default: null
    }

}, { timestamps: true })

module.exports = mongoose.model("order", orderSchema)