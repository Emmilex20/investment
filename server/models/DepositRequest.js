// server/models/DepositRequest.js (UPDATED for Cloudinary)
import mongoose from 'mongoose';

const depositRequestSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        method: {
            type: String,
            required: true,
            enum: ['usdt', 'naira'],
        },
        amount: { // The amount the user claims to have sent (USD or NGN)
            type: Number,
            required: true,
        },
        amountUSD: { // Calculated USD equivalent
            type: Number,
            required: true,
        },
        piCoinsToCredit: { // Calculated P$ to be credited
            type: Number,
            required: true,
        },
        receiptPath: { // <-- RENAMED: Stores the Cloudinary URL (req.file.path)
            type: String,
            required: true, // Receipt is mandatory
        },
        receiptPublicId: { // <-- NEW FIELD: Stores the ID required to delete from Cloudinary (req.file.filename)
            type: String,
            required: true,
        },
        status: {
            type: String,
            required: true,
            default: 'pending', // pending, approved, rejected
            enum: ['pending', 'approved', 'rejected'],
        },
        adminReviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        reviewDate: {
            type: Date,
        }
    },
    {
        timestamps: true,
    }
);

const DepositRequest = mongoose.model('DepositRequest', depositRequestSchema);
export default DepositRequest; 