import mongoose from 'mongoose';

const { Schema } = mongoose;

const earningsTransactionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: false,
    },
    amount: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ['delivery', 'ride', 'withdrawal', 'order_settlement', 'restaurant_payout'],
      required: true,
    },
    referenceType: {
      type: String,
      enum: ['FoodOrder', 'Ride', 'Payout'],
      required: false,
    },
    referenceId: {
      type: Schema.Types.ObjectId,
      required: false,
    },
    currency: {
      type: String,
      default: 'USD',
    },
  },
  { timestamps: true }
);

earningsTransactionSchema.index({ userId: 1, createdAt: -1 });
earningsTransactionSchema.index({ restaurantId: 1, createdAt: -1 });
earningsTransactionSchema.index({ type: 1, createdAt: -1 });

const EarningsTransaction = mongoose.model('EarningsTransaction', earningsTransactionSchema);

export default EarningsTransaction;
