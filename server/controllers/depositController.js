// server/controllers/depositController.js (FULL CORRECTED CODE)
import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import DepositRequest from '../models/DepositRequest.js'; 
import { v2 as cloudinary } from 'cloudinary'; // Import for cleanup/rejection logic

// Constant for simulated conversion rate
const USD_TO_PI_RATE = 100;
const NGN_TO_USD_RATE = 0.001; 

/**
 * Helper function to delete the receipt file from Cloudinary safely.
 * @param {string} publicId The public ID of the file to delete (stored in req.file.filename by Multer-Cloudinary).
 */
const deleteCloudinaryFile = async (publicId) => {
    if (publicId) {
        try {
            const result = await cloudinary.uploader.destroy(publicId);
            // console.log('Cloudinary deletion result:', result);
            return result;
        } catch (error) {
            console.error('Cloudinary cleanup failed:', error);
            // We ignore failure here as it's cleanup and should not crash the API flow.
            return null;
        }
    }
    return null;
};


/**
 * @desc    Create a deposit request for admin review
 * @route   POST /api/deposits
 * @access  Private
 */
const createDeposit = asyncHandler(async (req, res) => {
    // req.file now contains Cloudinary details:
    // req.file.path is the URL (receiptPath)
    // req.file.filename is the public_id (receiptPublicId)
    const { amount, method } = req.body; 
    const receiptPath = req.file ? req.file.path : null; 
    const receiptPublicId = req.file ? req.file.filename : null; 

    // Cloudinary automatically saves the file before this controller runs.
    // Cleanup is ONLY needed for validation failures.
    const cleanup = async () => {
        if (receiptPublicId) {
            await deleteCloudinaryFile(receiptPublicId);
        }
    };

    if (!amount || isNaN(amount) || Number(amount) <= 0 || !method) {
        await cleanup();
        res.status(400);
        throw new Error('Please provide a valid amount and payment method.');
    }

    if (!receiptPath) {
        // If req.file is null, it means Multer might have failed, or the client didn't send a file.
        res.status(400);
        throw new Error('A payment receipt/screenshot is required for verification.');
    }
    
    const inputAmount = Number(amount);
    let amountUSD;
    let currency;

    if (method === 'usdt') {
        amountUSD = inputAmount; 
        currency = 'USD';
    } else if (method === 'naira') {
        amountUSD = inputAmount * NGN_TO_USD_RATE; 
        currency = 'NGN';
    } else {
        await cleanup();
        res.status(400);
        throw new Error('Invalid payment method specified.');
    }

    // Check for minimum deposit (e.g., $10 USD equivalent)
    if (amountUSD < 10) {
        await cleanup();
        res.status(400);
        throw new Error('Minimum deposit equivalent is $10 USD.');
    }

    const piCoinsToCredit = amountUSD * USD_TO_PI_RATE;

    // Create the deposit request
    const depositRequest = await DepositRequest.create({
        user: req.user._id,
        method: method,
        amount: inputAmount,
        amountUSD,
        piCoinsToCredit,
        receiptPath: receiptPath, // The secure Cloudinary URL
        receiptPublicId: receiptPublicId, // The public ID for future deletion
        status: 'pending',
    });

    res.status(201).json({
        message: `Your deposit of ${currency === 'NGN' ? '₦' : '$'}${inputAmount.toFixed(2)} has been submitted for admin review. You will be credited ${piCoinsToCredit.toFixed(2)} P$ upon approval.`,
        request: depositRequest,
    });
});

/**
 * @desc    Admin gets all pending deposit requests
 * @route   GET /api/deposits/admin/pending
 * @access  Private/Admin
 */
const getPendingDeposits = asyncHandler(async (req, res) => {
    // Find all requests where status is 'pending'
    const pendingDeposits = await DepositRequest.find({ status: 'pending' })
        .populate('user', 'name email') // Populate user details
        .sort({ createdAt: 1 }); // Sort by oldest first

    // Map to a cleaner format matching the frontend interface
    const formattedDeposits = pendingDeposits.map(deposit => ({
        _id: deposit._id,
        userId: deposit.user._id,
        userName: deposit.user.name,
        userEmail: deposit.user.email,
        amount: deposit.amount,
        piCoinsToCredit: deposit.piCoinsToCredit,
        depositMethod: deposit.method,
        status: deposit.status,
        receiptPath: deposit.receiptPath,
        // We now need to expose the public ID if needed, but receiptPath is enough for display
        // receiptPublicId: deposit.receiptPublicId, 
        createdAt: deposit.createdAt,
    }));

    res.json(formattedDeposits);
});

/**
 * @desc    Admin updates a deposit request status (Approve or Reject)
 * @route   PUT /api/deposits/admin/update-status/:id
 * @access  Private/Admin
 */
const updateDepositStatus = asyncHandler(async (req, res) => {
    // Status from the client should be lowercase ('approved' or 'rejected') due to client fix
    const { status } = req.body; 

    // IMPORTANT: Populate 'user' to get the user object for updating the balance
    const deposit = await DepositRequest.findById(req.params.id).populate('user', 'name email piCoinsBalance');

    if (!deposit) {
        res.status(404);
        throw new Error('Deposit request not found.');
    }

    if (deposit.status !== 'pending') {
        res.status(400);
        throw new Error(`Deposit has already been ${deposit.status}.`);
    }

    // Assign the populated user object for easy access
    const user = deposit.user; // FIX 1: 'user is not defined' is now fixed

    if (!user) {
        // This should not happen if deposit creation worked, but is a safe check.
        res.status(404);
        throw new Error('Associated user not found or deleted.');
    }

    // FIX 2 & 3: Ensure status comparison and assignment are in lowercase
    if (status === 'approved') {
        // Update user's balance
        user.piCoinsBalance += deposit.piCoinsToCredit;
        await user.save(); // Save the updated user balance

        // Update deposit status
        deposit.status = 'approved';
        
    } else if (status === 'rejected') {
        deposit.status = 'rejected';
        
        // ** CLOUDINARY CLEANUP ON REJECTION **
        // We do NOT delete the file on approval, only rejection.
        if (deposit.receiptPublicId) {
            await deleteCloudinaryFile(deposit.receiptPublicId);
        }
    } else {
        res.status(400);
        throw new Error('Invalid status provided. Must be "approved" or "rejected".');
    }

    // Final updates for the deposit request
    deposit.adminReviewedBy = req.user._id; 
    deposit.reviewDate = new Date();
    await deposit.save();

    res.json({
        message: `Deposit for user ${user.name} was successfully set to ${deposit.status}. ${deposit.status === 'approved' ? `User credited ${deposit.piCoinsToCredit.toFixed(2)} P$.` : ''}`,
        piCoinsBalance: user.piCoinsBalance, // Send back new balance for potential client state update
    });
});

export { createDeposit, getPendingDeposits, updateDepositStatus };