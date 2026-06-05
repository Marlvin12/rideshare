import mongoose from 'mongoose';

const { Schema } = mongoose;

const rideSchema = new Schema(
  {
    vehicle: {
      type: String,
      enum: ["bike", "human", "cabEconomy", "cabPremium"],
      required: true,
    },
    distance: {
      type: Number,
      required: true,
    },
    pickup: {
      address: { type: String, required: true },
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
    drop: {
      address: { type: String, required: true },
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
    fare: {
      type: Number,
      required: true,
    },
    proposedPrice: {
      type: Number,
      required: true,
    },
    suggestedPriceRange: {
      min: { type: Number },
      max: { type: Number },
    },
    pricingModel: {
      type: String,
      enum: ["fixed", "bidding"],
      default: "bidding",
    },
    offers: [{
      riderId: { type: Schema.Types.ObjectId, ref: "User" },
      offeredPrice: { type: Number, required: true },
      message: { type: String },
      status: { 
        type: String, 
        enum: ["pending", "accepted", "rejected"], 
        default: "pending" 
      },
      createdAt: { type: Date, default: Date.now },
    }],
    acceptedOffer: {
      riderId: { type: Schema.Types.ObjectId, ref: "User" },
      finalPrice: { type: Number },
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rider: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: ["AWAITING_OFFERS", "SEARCHING_FOR_RIDER", "START", "ARRIVED", "COMPLETED"],
      default: "AWAITING_OFFERS",
    },
    payment: {
      // How the fare was collected. 'mobile_money' is set by the Paynow
      // collection flow; 'cash' is an explicit in-person settlement recorded
      // on ride completion when no gateway charge succeeded.
      method: {
        type: String,
        enum: ["cash", "mobile_money"],
        default: null,
      },
      // 'paid' must mean EITHER a settled Paynow transaction OR an explicit
      // cash-settled-in-person record — never an implicit charge that did not
      // happen.
      status: {
        type: String,
        enum: ["pending", "paid", "failed"],
        default: "pending",
      },
      // Gateway reference for mobile-money collections; stays null for cash.
      gatewayRef: {
        type: String,
        default: null,
      },
      // Amount actually captured/settled (mobile-money capture or cash fare).
      capturedAmount: {
        type: Number,
        default: null,
      },
      // True when the fare was settled in person (cash) rather than via gateway.
      settledInPerson: {
        type: Boolean,
        default: false,
      },
      paidAt: {
        type: Date,
        default: null,
      },
    },
    otp: {
      type: String,
      default: null,
    },
    acceptedAt: {
      type: Date,
    },
    arrivedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    rating: {
      riderRating: {
        type: Number,
        min: 1,
        max: 5,
      },
      customerRating: {
        type: Number,
        min: 1,
        max: 5,
      },
      riderFeedback: String,
      customerFeedback: String,
    },
  },
  {
    timestamps: true,
  }
);

rideSchema.index({ customer: 1, createdAt: -1 });
rideSchema.index({ rider: 1, createdAt: -1 });
rideSchema.index({ status: 1 });
rideSchema.index({ createdAt: -1 });
rideSchema.index({ 'offers.riderId': 1 });

const Ride = mongoose.model("Ride", rideSchema);
export default Ride;
