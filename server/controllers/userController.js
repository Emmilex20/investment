// server/controllers/userController.js (FIXED & CONSOLIDATED)

import asyncHandler from 'express-async-handler';
// FIX: Ensure this path is correct: '../models/User.js'
import User from '../models/User.js'; 
import generateToken from '../utils/generateToken.js';
// NEW: Import Withdrawal Model
import Withdrawal from '../models/WithdrawalModel.js'; 

// Helper function to generate a simple referral code (e.g., first 3 letters + random number)
const generateReferralCode = (name) => {
    const prefix = name.substring(0, 3).toUpperCase();
    const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}${suffix}`;
}

// Helper function to format the withdrawal details string for Admin view
const formatDetails = (payoutMethod, details) => {
    switch (payoutMethod) {
        case 'NAIRA_BANK':
            return `Bank: ${details.bankName}, Acct: ${details.accountNumber}, Name: ${details.accountName}`;
        case 'USDT_TRC20':
            return `USDT TRC20: ${details.cryptoAddress}`;
        case 'USD_PAYPAL':
            return `PayPal: ${details.paypalEmail}`;
        default:
            return 'Details Not Provided';
    }
}


/**
 * @desc    Register a new user
 * @route   POST /api/users/register
 * @access  Public
 */
const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, referralCode: incomingReferralCode } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }
    
    // 1. Determine referrer
    let referredByUser = null;
    if (incomingReferralCode) {
        referredByUser = await User.findOne({ referralCode: incomingReferralCode });
        if (!referredByUser) {
            res.status(404);
            throw new Error('Invalid referral code provided.');
        }
    }

    // 2. Create the new user
    const user = await User.create({
        name,
        email,
        password,
        referralCode: generateReferralCode(name),
        referredBy: referredByUser ? referredByUser._id : null,
    });

    if (user) {
        // 3. Update the referrer's referral list
        if (referredByUser) {
            referredByUser.referrals.push(user._id);
            await referredByUser.save();
        }

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            piCoinsBalance: user.piCoinsBalance,
            referralCode: user.referralCode,
            referredBy: user.referredBy,
            token: generateToken(user._id),
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});


/**
 * @desc    Auth user & get token
 * @route   POST /api/users/login
 * @access  Public
 */
const authUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            piCoinsBalance: user.piCoinsBalance,
            referralCode: user.referralCode,
            isAdmin: user.isAdmin,
            token: generateToken(user._id),
        });
    } else {
        res.status(401); // Unauthorized
        throw new Error('Invalid email or password');
    }
});

/**
 * @desc    Get user profile (only available after successful login)
 * @route   GET /api/users/profile
 * @access  Private
 */
const getUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id)
        .select('-password') 
        .populate('referredBy', 'name email') 
        .populate('referrals', 'name email'); 
        

    if (user) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            piCoinsBalance: user.piCoinsBalance,
            referralCode: user.referralCode,
            referredBy: user.referredBy,
            referrals: user.referrals,
            isAdmin: user.isAdmin,
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

/**
 * @desc    Transfer Pi Coins (P$) to another user
 * @route   POST /api/users/transfer
 * @access  Private
 */
const transferPiCoins = asyncHandler(async (req, res) => {
    const { recipientEmail, amount } = req.body;
    const transferAmount = Number(amount);

    if (!recipientEmail || !transferAmount || isNaN(transferAmount) || transferAmount <= 0) {
        res.status(400);
        throw new Error('Please provide a valid recipient email and transfer amount.');
    }
    
    const sender = await User.findById(req.user._id);
    const recipient = await User.findOne({ email: recipientEmail });

    if (!sender) {
        res.status(404);
        throw new Error('Sender user not found.');
    }

    if (!recipient) {
        res.status(404);
        throw new Error(`Recipient user with email ${recipientEmail} not found.`);
    }

    if (sender.email === recipient.email) {
        res.status(400);
        throw new Error('Cannot transfer Pi Coins to your own account.');
    }

    if (sender.piCoinsBalance < transferAmount) {
        res.status(400);
        throw new Error('Insufficient Pi Coins (P$) balance.');
    }

    // Perform the transfer transaction
    sender.piCoinsBalance -= transferAmount;
    recipient.piCoinsBalance += transferAmount;

    await sender.save();
    await recipient.save();

    res.status(200).json({
        message: `Successfully transferred ${transferAmount.toFixed(2)} P$ to ${recipient.name}.`,
        newBalance: sender.piCoinsBalance,
    });
});


/**
 * @desc    User submits a withdrawal request for Pi Coins (P$)
 * @route   POST /api/users/withdraw
 * @access  Private
 */
const withdrawPiCoins = asyncHandler(async (req, res) => {
    // Destructure all possible fields from the frontend
    const { 
        amount, 
        payoutMethod, 
        bankName, 
        accountNumber, 
        accountName, 
        cryptoAddress, 
        paypalEmail 
    } = req.body;
    
    const withdrawalAmount = Number(amount);
    const MIN_WITHDRAWAL_AMOUNT = 10; 

    // Find the user who is making the request (provided by protect middleware)
    const user = await User.findById(req.user._id);

    if (!user) {
        res.status(404);
        throw new Error('User not found.');
    }

    // --- 1. Validation ---

    if (withdrawalAmount < MIN_WITHDRAWAL_AMOUNT) {
        res.status(400);
        throw new Error(`Minimum withdrawal amount is ${MIN_WITHDRAWAL_AMOUNT} P$.`);
    }

    if (user.piCoinsBalance < withdrawalAmount) {
        res.status(400);
        throw new Error('Insufficient Pi Coin balance.');
    }
    
    // Determine and validate payout details
    let detailsString = '';
    const initialBalance = user.piCoinsBalance; // Record balance before deduction

    if (payoutMethod === 'NAIRA_BANK') {
        if (!bankName || !accountNumber || !accountName) {
            res.status(400); // Changed from 440 to standard 400
            throw new Error('Missing Naira bank details.');
        }
        detailsString = formatDetails(payoutMethod, { bankName, accountNumber, accountName });
    } else if (payoutMethod === 'USDT_TRC20') {
        if (!cryptoAddress) {
            res.status(400); // Changed from 440 to standard 400
            throw new Error('Missing USDT TRC20 address.');
        }
        detailsString = formatDetails(payoutMethod, { cryptoAddress });
    } else if (payoutMethod === 'USD_PAYPAL') {
        if (!paypalEmail) {
            res.status(400); // Changed from 440 to standard 400
            throw new Error('Missing PayPal email.');
        }
        detailsString = formatDetails(payoutMethod, { paypalEmail });
    } else {
        res.status(400);
        throw new Error('Invalid payout method.');
    }


    // --- 2. Core Transaction Logic ---

    // Deduct coins from the user immediately
    user.piCoinsBalance -= withdrawalAmount;
    const updatedUser = await user.save();

    // Create the pending withdrawal record
    await Withdrawal.create({
        user: user._id,
        amount: withdrawalAmount,
        piCoins: initialBalance, 
        payoutMethod,
        details: detailsString, 
        status: 'Pending', 
    });

    res.status(201).json({
        message: 'Withdrawal request submitted successfully and P$ deducted. Processing typically takes 1-3 business days.',
        newBalance: updatedUser.piCoinsBalance,
    });
});


/**
 * @desc    Admin adds Pi Coins to a user's balance
 * @route   POST /api/users/admin/add-coins
 * @access  Private/Admin
 */
const adminAddPiCoins = asyncHandler(async (req, res) => {
    const { userId, amount } = req.body;
    const creditAmount = Number(amount);

    if (!userId || !creditAmount || isNaN(creditAmount) || creditAmount <= 0) {
        res.status(400);
        throw new Error('Please provide a valid user ID and amount to credit.');
    }
    
    const user = await User.findById(userId);

    if (!user) {
        res.status(404);
        throw new Error('User not found.');
    }
    
    user.piCoinsBalance += creditAmount;
    await user.save();

    res.status(200).json({
        message: `Successfully credited ${creditAmount.toFixed(2)} P$ to ${user.name} (${user.email}).`,
        newBalance: user.piCoinsBalance,
    });
});

/**
 * @desc    Admin get all users
 * @route   GET /api/users/admin/all-users
 * @access  Private/Admin
 */
const getUsers = asyncHandler(async (req, res) => {
    const users = await User.find({})
        .select('_id name email piCoinsBalance isAdmin referrals')
        .populate('referrals', '_id'); 

    res.json(users);
});


export { 
    authUser, 
    registerUser, 
    getUserProfile, 
    transferPiCoins, 
    withdrawPiCoins, // <--- EXPOSED
    adminAddPiCoins, 
    getUsers 
};