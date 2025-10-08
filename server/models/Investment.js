// server/models/Investment.js
import mongoose from 'mongoose';

const investmentSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    package: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'InvestmentPackage',
    },
    investedAmount: {
      type: Number, // The Pi Coins (P$) the user put in
      required: true,
    },
    // Tracking for returns
    totalReturns: {
        type: Number, // Total Pi Coins earned so far
        default: 0,
    },
    currentDay: {
        type: Number, // Which day of the investment duration we are on
        default: 0,
    },
    status: {
      type: String, // 'active', 'completed', 'pending' (if waiting for admin approval/referrals)
      default: 'active', 
      enum: ['active', 'completed', 'pending', 'withdrawn'],
    },
    // Schedule for daily returns
    lastReturnDate: {
        type: Date,
        default: Date.now,
    },
    endDate: {
        type: Date,
        required: true,
    }
  },
  {
    timestamps: true,
  }
);

const Investment = mongoose.model('Investment', investmentSchema);

export default Investment;