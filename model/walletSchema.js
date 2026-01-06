const mongoose = require('mongoose')

const walletSchema = new mongoose.Schema({
    balance: {
        type: Number,
        default: 0,
        set: v => {
            const n = Number(v);
            if (Number.isNaN(n)) return undefined;
            return Math.floor(n);
        }
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
        status: {
            type: String,
            enum: ['Completed', 'Pending'],
            default: "Pending"
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }]

}, { timestamps: true })

module.exports = mongoose.model("wallet", walletSchema)