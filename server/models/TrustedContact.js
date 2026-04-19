import mongoose from 'mongoose';

const { Schema } = mongoose;

const trustedContactSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
    },
    relation: {
      type: String,
      trim: true,
      maxlength: 50,
    },
  },
  { timestamps: true }
);

trustedContactSchema.index({ userId: 1 });

const TrustedContact = mongoose.model('TrustedContact', trustedContactSchema);
export default TrustedContact;
