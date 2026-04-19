import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: {
      type: String,
    },
    role: {
      type: String,
      enum: ["customer", "rider", "merchant"],
      required: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
    },
    phone: {
      type: String,
      sparse: true,
    },
    whatsapp: {
      type: String,
      trim: true,
      default: null,
    },
    gender: {
      type: String,
      enum: ['male', 'female'],
    },
    residencyType: {
      type: String,
      enum: ['resident', 'visitor'],
    },
    marketingOptOut: {
      type: Boolean,
      default: false,
    },
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      default: null,
    },
    firebaseUid: {
      type: String,
      unique: true,
      sparse: true,
    },
    kyc: {
      status: {
        type: String,
        enum: ["pending", "submitted", "approved", "rejected"],
        default: "pending",
      },
      idType: {
        type: String,
        enum: ["national_id", "passport", "drivers_license"],
      },
      idNumber: {
        type: String,
      },
      idFrontImage: {
        type: String,
      },
      idBackImage: {
        type: String,
      },
      fullName: {
        type: String,
      },
      dateOfBirth: {
        type: Date,
      },
      address: {
        type: String,
      },
      submittedAt: {
        type: Date,
      },
      verifiedAt: {
        type: Date,
      },
      rejectionReason: {
        type: String,
      },
    },
    earnings: {
      total: {
        type: Number,
        default: 0,
      },
      available: {
        type: Number,
        default: 0,
      },
      pendingWithdrawal: {
        type: Number,
        default: 0,
      },
    },
    stats: {
      totalRides: {
        type: Number,
        default: 0,
      },
      completedRides: {
        type: Number,
        default: 0,
      },
      cancelledRides: {
        type: Number,
        default: 0,
      },
      rating: {
        type: Number,
        default: 5.0,
      },
      totalRatings: {
        type: Number,
        default: 0,
      },
    },
    vehicle: {
      type: {
        type: String,
        enum: ["bike", "auto", "cabEconomy", "cabPremium"],
      },
      make: {
        type: String,
      },
      model: {
        type: String,
      },
      year: {
        type: Number,
      },
      color: {
        type: String,
      },
      licensePlate: {
        type: String,
      },
      photo: {
        type: String,
      },
    },
    profilePhoto: {
      type: String,
    },
    payoutMethod: {
      type: String,
      enum: ["ecocash", "onemoney", "bank"],
      default: null,
    },
    payoutMobile: {
      type: String,
      trim: true,
      default: null,
    },
    payoutBankAccount: {
      bankName: { type: String },
      accountNumber: { type: String },
      accountName: { type: String },
    },
    preferences: {
      type: Schema.Types.Mixed,
      default: {},
    },
    deletionRequestedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.methods.createAccessToken = function () {
  return jwt.sign(
    {
      id: this._id,
      phone: this.phone,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};

userSchema.methods.createRefreshToken = function () {
  return jwt.sign(
    { id: this._id, phone: this.phone },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

userSchema.index({ role: 1 });
userSchema.index({ 'kyc.status': 1 });
userSchema.index({ createdAt: -1 });

const User = mongoose.model("User", userSchema);
export default User;
