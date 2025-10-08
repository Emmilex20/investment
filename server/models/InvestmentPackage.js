// server/models/InvestmentPackage.js
import mongoose from 'mongoose';

const investmentPackageSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    costUSD: {
      type: Number, // Cost in USD (to standardize)
      required: true,
    },
    rewardPiCoins: {
        type: Number, // The Pi Coins the user will lock/invest
        required: true,
    },
    durationDays: {
        type: Number, // E.g., 30 days
        required: true,
    },
    dailyReturnRate: {
        type: Number, // E.g., 0.05 for 5% daily return
        required: true,
    },
    // The key requirement: compulsory referrals
    requiredReferrals: {
      type: Number,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const InvestmentPackage = mongoose.model('InvestmentPackage', investmentPackageSchema);

export default InvestmentPackage;