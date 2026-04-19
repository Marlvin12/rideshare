import mongoose from 'mongoose';

const { Schema } = mongoose;

const promoCodeSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: 30,
    },
    description: {
      type: String,
      maxlength: 200,
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    minOrderAmount: {
      type: Number,
      default: 0,
    },
    maxDiscount: {
      type: Number,
      default: null,
    },
    maxRedemptions: {
      type: Number,
      default: null,
    },
    redemptionCount: {
      type: Number,
      default: 0,
    },
    maxPerUser: {
      type: Number,
      default: 1,
    },
    validFrom: {
      type: Date,
      default: Date.now,
    },
    validUntil: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

promoCodeSchema.index({ code: 1 });
promoCodeSchema.index({ isActive: 1, validUntil: 1 });

const PromoCode = mongoose.model('PromoCode', promoCodeSchema);
export default PromoCode;
