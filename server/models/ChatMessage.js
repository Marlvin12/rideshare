import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Persists chat messages for both ride-scoped chat (customer <-> rider)
 * and order-scoped direct messages (customer <-> courier).
 *
 * Exactly one of rideId / orderId must be set per message depending on context.
 */
const chatMessageSchema = new Schema(
  {
    rideId: {
      type: Schema.Types.ObjectId,
      ref: 'Ride',
      default: null,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'FoodOrder',
      default: null,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    senderRole: {
      type: String,
      enum: ['customer', 'rider', 'merchant'],
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
  },
  { timestamps: true }
);

chatMessageSchema.index({ rideId: 1, createdAt: 1 });
chatMessageSchema.index({ orderId: 1, createdAt: 1 });
chatMessageSchema.index({ senderId: 1, recipientId: 1, createdAt: 1 });

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);
export default ChatMessage;
