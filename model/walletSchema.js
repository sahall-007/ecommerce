const mongoose = require('mongoose')

const walletSchema = new mongoose.Schema({
    balance: {
        type: Number,
        default: 0
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    },
    transactions: [{
        amount: {
            type: Number,
            default: 0
        },
        date: {
            type: Date,
            default: Date.now()
        },
        transactionType: {
            type: String,
            enum: ['credit', 'debit']
        },
        description: {
            type: String,
            default: ''
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }]

}, { timestamps: true })

module.exports = mongoose.model("wallet", walletSchema)