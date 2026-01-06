const mongoose = require('mongoose')

const offerSchema = new mongoose.Schema(
  {
    offerName: {
      type: String,
      required: true,
      trim: true
    },
    discount: {
      type: Number,
      required: true,
      min: 1,
      max: 100
    },
    offerType: {
      type: String,
      enum: ["product", "category", "brand"],
    },
    offerFor: {
      type: String      
    },
    targetIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
      }
    ],
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("offer", offerSchema);
