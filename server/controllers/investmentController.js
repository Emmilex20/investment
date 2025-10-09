// server/controllers/investmentController.js (UPDATED WITH ADMIN PACKAGE CRUD)

import asyncHandler from 'express-async-handler';
import InvestmentPackage from '../models/InvestmentPackage.js';
import User from '../models/User.js';
import Investment from '../models/Investment.js';

// Utility function to calculate end date
const getEndDate = (durationDays) => {
    const date = new Date();
    // Use Math.max to ensure at least one day is added if durationDays is 0 or less
    date.setDate(date.getDate() + Math.max(1, durationDays)); 
    return date;
};

/**
 * @desc    Get all active investment packages
 * @route   GET /api/investments/packages
 * @access  Private
 */
const getInvestmentPackages = asyncHandler(async (req, res) => {
    // Only return fields needed for display, exclude Mongoose overhead fields
    const packages = await InvestmentPackage.find({ isActive: true }).select('-__v -createdAt -updatedAt');
    res.json(packages);
});

/**
 * @desc    Admin: Get all investment packages (including inactive)
 * @route   GET /api/investments/admin/packages
 * @access  Private/Admin
 */
const getAllInvestmentPackagesAdmin = asyncHandler(async (req, res) => {
    // Return all packages for admin management
    const packages = await InvestmentPackage.find({}).select('-__v');
    res.json(packages);
});

/**
 * @desc    Admin: Creates a new investment package
 * @route   POST /api/investments/admin/packages
 * @access  Private/Admin
 */
const createInvestmentPackage = asyncHandler(async (req, res) => {
    const { 
        name, 
        costUSD, 
        rewardPiCoins, 
        durationDays, 
        dailyReturnRate, 
        requiredReferrals, 
        isActive 
    } = req.body;

    // Validation for critical fields
    if (!name || rewardPiCoins === undefined || durationDays === undefined || dailyReturnRate === undefined || requiredReferrals === undefined) {
        res.status(400);
        throw new Error('Please provide all required fields: name, Pi Coins, duration, rate, and referrals.');
    }
    
    // Check for duplicate name
    const packageExists = await InvestmentPackage.findOne({ name });
    if (packageExists) {
        res.status(400);
        throw new Error(`Package with name "${name}" already exists.`);
    }

    const newPackage = await InvestmentPackage.create({
        name,
        // Ensure numbers are stored correctly, default to 0 for optional costUSD
        costUSD: Number(costUSD) || 0,
        rewardPiCoins: Number(rewardPiCoins),
        durationDays: Number(durationDays),
        dailyReturnRate: Number(dailyReturnRate),
        requiredReferrals: Number(requiredReferrals),
        isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json(newPackage);
});


/**
 * @desc    Admin: Updates an existing investment package
 * @route   PUT /api/investments/admin/packages/:id
 * @access  Private/Admin
 */
const updateInvestmentPackage = asyncHandler(async (req, res) => {
    const packageId = req.params.id;

    const investmentPackage = await InvestmentPackage.findById(packageId);

    if (!investmentPackage) {
        res.status(404);
        throw new Error('Investment package not found.');
    }

    // Update fields only if they are provided in the request body
    if (req.body.name !== undefined) investmentPackage.name = req.body.name;
    if (req.body.costUSD !== undefined) investmentPackage.costUSD = Number(req.body.costUSD);
    if (req.body.rewardPiCoins !== undefined) investmentPackage.rewardPiCoins = Number(req.body.rewardPiCoins);
    if (req.body.durationDays !== undefined) investmentPackage.durationDays = Number(req.body.durationDays);
    if (req.body.dailyReturnRate !== undefined) investmentPackage.dailyReturnRate = Number(req.body.dailyReturnRate);
    if (req.body.requiredReferrals !== undefined) investmentPackage.requiredReferrals = Number(req.body.requiredReferrals);
    if (req.body.isActive !== undefined) investmentPackage.isActive = req.body.isActive;

    const updatedPackage = await investmentPackage.save();
    res.json(updatedPackage);
});


/**
 * @desc    User purchases an investment package
 * @route   POST /api/investments/purchase
 * @access  Private
 */
const purchaseInvestment = asyncHandler(async (req, res) => {
    const { packageId } = req.body;

    if (!packageId) {
        res.status(400);
        throw new Error('Please select an investment package.');
    }

    const investmentPackage = await InvestmentPackage.findById(packageId);
    const user = await User.findById(req.user._id);

    if (!investmentPackage || !user) {
        res.status(404);
        throw new Error('Investment package or user not found.');
    }
    
    const requiredPiCoins = investmentPackage.rewardPiCoins;

    // 1. Check for sufficient Pi Coins Balance (REQUIRED)
    if (user.piCoinsBalance < requiredPiCoins) {
        res.status(400);
        throw new Error(`Insufficient Pi Coins (P$). You need ${requiredPiCoins} P$.`);
    }
    
    // --- Transaction Processing ---

    // 2. Deduct Pi Coins from user balance
    user.piCoinsBalance -= requiredPiCoins;
    await user.save();

    // 3. Create new investment record
    const newInvestment = await Investment.create({
        user: user._id,
        package: investmentPackage._id,
        investedAmount: requiredPiCoins,
        endDate: getEndDate(investmentPackage.durationDays),
        status: 'active',
    });

    // 4. Respond with success
    res.status(201).json({
        message: `Investment in ${investmentPackage.name} successful! ${requiredPiCoins} P$ deducted.`,
        investment: newInvestment,
        newBalance: user.piCoinsBalance,
    });
});

/**
 * @desc    Get all investments for the logged-in user
 * @route   GET /api/investments/my-investments
 * @access  Private
 */
const getMyInvestments = asyncHandler(async (req, res) => {
    // Also include 'requiredReferrals' in the populated package details
    const investments = await Investment.find({ user: req.user._id })
        .populate('package', 'name dailyReturnRate durationDays requiredReferrals'); 

    res.json(investments);
});

/**
 * @desc    User requests to withdraw completed investment capital/returns
 * @route   POST /api/investments/withdraw/:investmentId
 * @access  Private
 */
const withdrawInvestment = asyncHandler(async (req, res) => {
    const { investmentId } = req.params;
    
    // *** FIX: Ensure req.user._id (which is an ObjectId) is converted to a string. ***
    const userId = req.user._id ? req.user._id.toString() : null; 
    // *********************************************************************************
    
    // Now, the ID check works because userId is a string with a length property.
    if (!userId || userId.length !== 24 || investmentId.length !== 24) {
        res.status(400); 
        throw new Error('Invalid ID format in request.');
    }
    
    // Find investment (populate package to get referral requirements)
    const investment = await Investment.findById(investmentId).populate('package');
    // Find the user again to get the most current referral count
    const user = await User.findById(userId); // Use the guaranteed string userId here

    if (!investment || !user) {
        res.status(404);
        throw new Error('Investment or user not found.');
    }

    if (investment.user.toString() !== user._id.toString()) {
        res.status(401);
        throw new Error('Not authorized to withdraw this investment.');
    }
    
    if (investment.status === 'withdrawn') {
        res.status(400);
        throw new Error('This investment has already been withdrawn.');
    }

    // Check if investment is completed (or ready for withdrawal)
    if (investment.status !== 'completed') {
        res.status(400);
        throw new Error(`Investment is not ready for withdrawal (Status: ${investment.status}).`);
    }

    // **CRITICAL FIX: Ensure the package was successfully populated.**
    if (!investment.package) {
        res.status(500); // Internal logic error if a package reference is missing
        throw new Error('Investment package details are missing from the investment record.');
    }

    // --- CRITICAL: Referral Check at Withdrawal ---
    const requiredReferrals = investment.package.requiredReferrals || 0; 
    const actualReferrals = user.referrals ? user.referrals.length : 0; 

    if (actualReferrals < requiredReferrals) {
        res.status(400);
        throw new Error(`Withdrawal Failed: This package requires ${requiredReferrals} referrals. You currently have ${actualReferrals}.`);
    }
    
    // Calculate total amount to withdraw (Capital + Returns)
    const invested = Number(investment.investedAmount) || 0;
    const returns = Number(investment.totalReturns) || 0;
    
    const totalWithdrawalAmount = invested + returns;
    
    // Final check before processing
    if (totalWithdrawalAmount <= 0) {
        res.status(400);
        throw new Error('Withdrawal amount is zero. Check investment returns.');
    }

    // Process Withdrawal
    user.piCoinsBalance += totalWithdrawalAmount;
    investment.status = 'withdrawn'; 
    
    await user.save();
    await investment.save();

    res.status(200).json({
        message: `Capital and Returns of ${totalWithdrawalAmount.toFixed(2)} P$ successfully withdrawn to your balance.`,
        newBalance: user.piCoinsBalance,
        investmentStatus: 'withdrawn'
    });
});


export { 
    getInvestmentPackages, 
    purchaseInvestment, 
    getMyInvestments, 
    withdrawInvestment,
    getAllInvestmentPackagesAdmin, // <-- NEW EXPORT
    createInvestmentPackage,    // <-- NEW EXPORT
    updateInvestmentPackage     // <-- NEW EXPORT
};