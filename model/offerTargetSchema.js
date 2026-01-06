const mongoose = require('mongoose')

const offerTargetSchema = new mongoose.Schema(
  {
    offerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Offer",
      required: true
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
    discount: {
      type: Number,
      required: true,
      min: 1,
      max: 100
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

offerTargetSchema.index({ productId: 1 });
offerTargetSchema.index({ offerId: 1 });
offerTargetSchema.index({ isActive: 1 });

module.exports = mongoose.model("offerTarget", offerTargetSchema);
