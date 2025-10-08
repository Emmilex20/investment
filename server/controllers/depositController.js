// server/controllers/depositController.js (UPDATE this file)
import asyncHandler from 'express-async-handler';
import User from '../models/User.js';

// Constant for simulated conversion rate
// For simplicity, let's assume 1 USD = 100 Pi Coins (P$) for the internal balance
const USD_TO_PI_RATE = 100;

// Conversion rate for Naira (Simulated: NGN 1,000 = $1 USD)
const NGN_TO_USD_RATE = 0.001; 

/**
 * @desc    Simulate a deposit and add funds to user's Pi Coins balance
 * @route   POST /api/deposits
 * @access  Private
 */
const createDeposit = asyncHandler(async (req, res) => {
  const { amount, method } = req.body; // 'amount' can be USD or NGN
  
  if (!amount || isNaN(amount) || amount <= 0 || !method) {
    res.status(400);
    throw new Error('Please provide a valid amount and payment method.');
  }
  
  let amountUSD;
  let currency;

  // Determine the USD equivalent based on the method
  if (method === 'crypto' || method === 'usdt') {
    amountUSD = Number(amount); // Assuming 'amount' is already in USD for crypto
    currency = 'USD';
  } else if (method === 'naira') {
    amountUSD = amount * NGN_TO_USD_RATE; // Convert NGN to USD
    currency = 'NGN';
  } else {
      res.status(400);
      throw new Error('Invalid payment method specified.');
  }

  // Check for minimum deposit (e.g., $10 USD equivalent)
  if (amountUSD < 10) {
      res.status(400);
      throw new Error('Minimum deposit equivalent is $10 USD.');
  }

  // Calculate the amount of Pi Coins to credit
  const piCoinsToCredit = amountUSD * USD_TO_PI_RATE;

  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found.');
  }

  // Update the user's Pi Coins balance
  user.piCoinsBalance += piCoinsToCredit;

  await user.save();

  // Return the updated user info
  res.status(200).json({
    message: `Successfully deposited ${currency === 'NGN' ? '₦' + amount.toFixed(2) : '$' + amount.toFixed(2)}. Credited ${piCoinsToCredit.toFixed(2)} P$ to your balance.`,
    piCoinsBalance: user.piCoinsBalance,
  });
});

export { createDeposit }; 