import mongoose from 'mongoose';

const { Schema } = mongoose;

const merchantApplicationSchema = new Schema(
  {
    restaurantName: {
      type: String,
      required: true,
      trim: true,
    },
    ownerName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    cuisineType: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['submitted', 'under_review', 'approved', 'rejected'],
      default: 'submitted',
    },
    applicantUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      default: null,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    adminNotes: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

merchantApplicationSchema.index({ email: 1 });
merchantApplicationSchema.index({ status: 1 });
merchantApplicationSchema.index({ applicantUserId: 1 });

const MerchantApplication = mongoose.model('MerchantApplication', merchantApplicationSchema);

export default MerchantApplication;
