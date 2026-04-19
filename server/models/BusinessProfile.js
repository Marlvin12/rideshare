import mongoose from 'mongoose';

const { Schema } = mongoose;

const businessProfileSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    taxId: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    industry: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    billingEmail: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 200,
    },
    billingAddress: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    useForOrders: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const BusinessProfile = mongoose.model('BusinessProfile', businessProfileSchema);
export default BusinessProfile;
