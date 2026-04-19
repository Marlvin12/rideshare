import mongoose from 'mongoose';

const { Schema } = mongoose;

const promoRedemptionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    promoCodeId: {
      type: Schema.Types.ObjectId,
      ref: 'PromoCode',
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    discountAmount: {
      type: Number,
      required: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'FoodOrder',
      default: null,
    },
  },
  { timestamps: true }
);

promoRedemptionSchema.index({ userId: 1, promoCodeId: 1 });

const PromoRedemption = mongoose.model('PromoRedemption', promoRedemptionSchema);
export default PromoRedemption;
