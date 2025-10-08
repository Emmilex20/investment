// server/controllers/withdrawalController.js (FIXED: User Model Import)

import asyncHandler from 'express-async-handler';
import Withdrawal from '../models/WithdrawalModel.js';
// FIX: Corrected import path/name based on the error and userController.js
import User from '../models/User.js'; 

// @desc    Get all pending withdrawal requests (Admin Only)
// @route   GET /api/transactions/admin/withdrawals
// @access  Private/Admin
const getPendingWithdrawals = asyncHandler(async (req, res) => {
    // Finds all withdrawals with status 'Pending'
    // Populates the 'user' field to get name and email
    const withdrawals = await Withdrawal.find({ status: 'Pending' })
        .populate('user', 'name email')
        .sort({ createdAt: 1 }); // Oldest requests first

    // Transform the data to match the frontend interface (AdminUserView)
    const formattedWithdrawals = withdrawals.map(w => ({
        _id: w._id,
        userId: w.user._id,
        userName: w.user.name,
        userEmail: w.user.email,
        amount: w.amount,
        payoutMethod: w.payoutMethod,
        details: w.details,
        status: w.status,
        createdAt: w.createdAt.toISOString(),
    }));

    res.json(formattedWithdrawals);
});

// @desc    Process a withdrawal request (Admin Only)
// @route   PUT /api/transactions/admin/withdrawals/:id/processed
// @access  Private/Admin
const processWithdrawal = asyncHandler(async (req, res) => {
    const withdrawal = await Withdrawal.findById(req.params.id);

    if (withdrawal) {
        if (withdrawal.status !== 'Pending') {
            res.status(400);
            throw new Error('Withdrawal request is already processed or failed.');
        }

        // 1. Update Withdrawal status
        withdrawal.status = 'Processed';
        withdrawal.processedBy = req.user._id; // Assumes admin user info is in req.user
        withdrawal.processedAt = Date.now();
        await withdrawal.save();

        res.json({ message: `Withdrawal (ID: ${withdrawal._id}) successfully marked as Processed.` });
    } else {
        res.status(404);
        throw new Error('Withdrawal request not found');
    }
});


// @desc    Reject a withdrawal request and re-credit coins (Admin Only)
// @route   PUT /api/transactions/admin/withdrawals/:id/failed
// @access  Private/Admin
const rejectWithdrawal = asyncHandler(async (req, res) => {
    // Using .populate('user') here is necessary to get the user ID for re-credit
    const withdrawal = await Withdrawal.findById(req.params.id).populate('user'); 

    if (withdrawal) {
        if (withdrawal.status !== 'Pending') {
            res.status(400);
            throw new Error('Withdrawal request is already processed or failed.');
        }

        // 1. Update Withdrawal status
        withdrawal.status = 'Failed';
        withdrawal.processedBy = req.user._id;
        withdrawal.processedAt = Date.now();
        await withdrawal.save();

        // 2. Re-credit PiCoins to the user's balance
        // withdrawal.user is the populated user object from the .populate() call
        const user = await User.findById(withdrawal.user._id); 
        
        if (user) {
            user.piCoinsBalance += withdrawal.amount;
            await user.save();
        } else {
            console.error(`CRITICAL: User ID ${withdrawal.user._id} not found for withdrawal ${withdrawal._id}. Coins not re-credited.`);
        }

        res.json({ message: `Withdrawal (ID: ${withdrawal._id}) rejected. ${withdrawal.amount} P$ re-credited to user ${user?.name || 'ID ' + user._id}.` });
    } else {
        res.status(404);
        throw new Error('Withdrawal request not found');
    }
});

export {
    getPendingWithdrawals,
    processWithdrawal,
    rejectWithdrawal,
};