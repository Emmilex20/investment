// server/models/WithdrawalModel.js

import mongoose from 'mongoose';

const withdrawalSchema = mongoose.Schema(
    {
        user: {
            // Links the withdrawal request to the User model
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        amount: {
            type: Number,
            required: true,
            min: 1, 
        },
        piCoins: {
            // User's balance at the time of request (for auditing)
            type: Number,
            required: true,
        },
        payoutMethod: {
            type: String,
            required: true,
            enum: ['NAIRA_BANK', 'USDT_TRC20', 'USD_PAYPAL'],
        },
        details: {
            // Contains formatted payout information (Bank/Account/Email/Wallet)
            type: String,
            required: true,
        },
        status: {
            type: String,
            required: true,
            default: 'Pending',
            enum: ['Pending', 'Processed', 'Failed'],
        },
        processedBy: {
            // Admin who approved or rejected the request
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        processedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

const Withdrawal = mongoose.model('Withdrawal', withdrawalSchema);

export default Withdrawal;