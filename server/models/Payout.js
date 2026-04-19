import mongoose from 'mongoose';

const { Schema } = mongoose;

const payoutSchema = new Schema(
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
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
    method: {
      type: String,
      enum: ['ecocash', 'onemoney', 'bank'],
      required: true,
    },
    destination: {
      type: String,
      required: true,
      trim: true,
    },
    externalReference: {
      type: String,
      trim: true,
    },
    failureReason: {
      type: String,
    },
    completedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

payoutSchema.index({ userId: 1, createdAt: -1 });
payoutSchema.index({ restaurantId: 1, createdAt: -1 });
payoutSchema.index({ status: 1 });

const Payout = mongoose.model('Payout', payoutSchema);

export default Payout;
