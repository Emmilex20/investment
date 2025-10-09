/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable no-irregular-whitespace */
// client/src/components/WithdrawalForm.tsx (ADDED PI_COIN_ADDRESS OPTION)

import React, { useState, type FormEvent, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from "react-router-dom";
import { ArrowLeftCircle, CheckCircle, XCircle } from 'lucide-react'; 
import { motion } from 'framer-motion';

// Hardcoded Payout Parameters
const MIN_WITHDRAWAL_AMOUNT = 10; // Minimum P$ to withdraw
const PI_COIN_USD_RATE = 0.05;    // Conversion rate: 1 P$ = $0.05 (Example)
const NAIRA_USD_RATE = 1450;      // Conversion rate: 1 USD = ₦1450 (Example)

// --- NEW FEATURE: Referral Requirements based on Investment Value (USD) ---
// Define referral requirements based on cumulative invested amount in USD.
const REFERRAL_TIERS = [
    { usdThreshold: 120, requiredReferrals: 8 }, 
    { usdThreshold: 90, requiredReferrals: 6 },  
    { usdThreshold: 60, requiredReferrals: 4 },  
    { usdThreshold: 30, requiredReferrals: 3 },  
    { usdThreshold: 10, requiredReferrals: 2 },  
];
// --------------------------------------------------------------------------

// UPDATED TYPE: Added 'PI_COIN_ADDRESS'
type PayoutMethod = 'NAIRA_BANK' | 'USDT_TRC20' | 'USD_PAYPAL' | 'PI_COIN_ADDRESS';

const WithdrawalForm: React.FC = () => {
    const { userInfo, dispatch } = useAuth();
    const [amount, setAmount] = useState<number>(0);
    const [payoutMethod, setPayoutMethod] = useState<PayoutMethod>('NAIRA_BANK');
    const navigate = useNavigate();
    
    // Dynamic fields for different payout methods
    const [bankName, setBankName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [accountName, setAccountName] = useState('');
    const [cryptoAddress, setCryptoAddress] = useState('');
    const [paypalEmail, setPaypalEmail] = useState('');
    // NEW STATE FOR PI COIN ADDRESS
    const [piCoinAddress, setPiCoinAddress] = useState('');

    const [loading, setLoading] = useState(false);
    const [submissionMessage, setSubmissionMessage] = useState<{ text: string, type: 'success' | 'error' | 'info' } | null>(null);
    const [referralWarning, setReferralWarning] = useState<string | null>(null); 

    if (!userInfo) return null;

    const currentBalance = userInfo.piCoinsBalance ?? 0;
    const actualReferrals = userInfo.referrals?.length ?? 0; 

    // --- ASSUMPTION: Total Invested Value ---
    const totalInvestedPiCoins = 1000; 
    const totalInvestedValueUsd = totalInvestedPiCoins * PI_COIN_USD_RATE;
    // --- END ASSUMPTION ---

    // --- Hook: Calculate Required Referrals ---
    const requiredReferrals = useMemo(() => {
        const sortedTiers = [...REFERRAL_TIERS].sort((a, b) => b.usdThreshold - a.usdThreshold);

        for (const tier of sortedTiers) {
            if (totalInvestedValueUsd >= tier.usdThreshold) {
                return tier.requiredReferrals;
            }
        }
        return 0;
    }, [totalInvestedValueUsd]);
    // ---------------------------------------

    // --- Calculation Hook: Payout Amount ---
    const payoutAmount = useMemo(() => {
        const usdValue = amount * PI_COIN_USD_RATE;
        if (payoutMethod === 'NAIRA_BANK') {
            return (usdValue * NAIRA_USD_RATE).toFixed(2) + ' ₦';
        }
        if (payoutMethod === 'USDT_TRC20' || payoutMethod === 'USD_PAYPAL') {
            return usdValue.toFixed(2) + ' USD / USDT';
        }
        if (payoutMethod === 'PI_COIN_ADDRESS') {
            return amount.toFixed(2) + ' P$'; // Withdrawal is in P$
        }
        return '0.00';
    }, [amount, payoutMethod]);
    // ---------------------------------------

    // Determine if the referral requirement is met
    const isReferralRequirementMet = actualReferrals >= requiredReferrals;

    const handleWithdrawal = async (e: FormEvent) => {
        e.preventDefault();
        setSubmissionMessage(null);
        setReferralWarning(null); 

        // ... (Basic Validation - remains the same) ...
        if (amount <= 0 || amount < MIN_WITHDRAWAL_AMOUNT || amount > currentBalance) {
            const text = amount <= 0 
                ? 'Please enter a valid amount.' 
                : amount < MIN_WITHDRAWAL_AMOUNT 
                ? `The minimum withdrawal amount is ${MIN_WITHDRAWAL_AMOUNT} P$.` 
                : 'Insufficient balance for this withdrawal.';
            setSubmissionMessage({ text, type: 'error' });
            return;
        }
        
        // --- 2. Referral Requirement Check ---
        if (requiredReferrals > actualReferrals) {
            const needed = requiredReferrals - actualReferrals;
            const warningText = `Withdrawal blocked: You need ${needed} more active referral(s) to meet the requirement of ${requiredReferrals} referrals for your investment level ($${totalInvestedValueUsd.toFixed(2)}).`;
            
            setReferralWarning(warningText);
            setSubmissionMessage({ text: warningText, type: 'error' });
            return;
        }
        // ----------------------------------------------------------------------------------

        // --- 3. Payout Method Specific Validation (ADDED PI_COIN_ADDRESS) ---
        let withdrawalDetails = {};
        if (payoutMethod === 'NAIRA_BANK') {
            if (!bankName || !accountNumber || !accountName) {
                setSubmissionMessage({ text: 'Please fill in all Naira bank details.', type: 'error' });
                return;
            }
            withdrawalDetails = { bankName, accountNumber, accountName };
        } else if (payoutMethod === 'USDT_TRC20') {
            if (!cryptoAddress) {
                setSubmissionMessage({ text: 'Please enter a valid USDT TRC20 address.', type: 'error' });
                return;
            }
            withdrawalDetails = { cryptoAddress, chain: 'TRC20' };
        } else if (payoutMethod === 'USD_PAYPAL') {
            if (!paypalEmail) {
                setSubmissionMessage({ text: 'Please enter a valid PayPal email.', type: 'error' });
                return;
            }
            withdrawalDetails = { paypalEmail };
        } else if (payoutMethod === 'PI_COIN_ADDRESS') { // NEW LOGIC
            if (!piCoinAddress) {
                setSubmissionMessage({ text: 'Please enter your Pi Coin wallet address.', type: 'error' });
                return;
            }
            withdrawalDetails = { piCoinAddress };
        }

        setLoading(true);

        try {
            const config = {
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userInfo.token}` 
                },
            };
            
            // Data sent to the backend must include the method and its specific details
            const requestBody = {
                amount,
                payoutMethod, 
                ...withdrawalDetails, 
            };

            const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

            const { data } = await axios.post<{ message: string, newBalance: number }>(
                `${API_BASE_URL}/api/users/withdraw`, 
                requestBody,
                config
            );

            // Update user's balance in global context on successful withdrawal
            dispatch({ 
                type: 'UPDATE_PROFILE', 
                payload: { piCoinsBalance: data.newBalance } 
            });

            setSubmissionMessage({ text: data.message || 'Withdrawal request submitted successfully!', type: 'success' });
            // Reset form fields
            setAmount(0);
            setBankName('');
            setAccountNumber('');
            setAccountName('');
            setCryptoAddress('');
            setPaypalEmail('');
            setPiCoinAddress(''); // NEW: Reset Pi Coin address

        } catch (err) {
            let errorMessage = 'Withdrawal failed. Please try again.';
            if (axios.isAxiosError(err) && err.response) {
                errorMessage = err.response.data.message || errorMessage;
            }
            setSubmissionMessage({ text: `Error: ${errorMessage}`, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // Disable if basic checks fail or if the referral requirement is not met
    const isWithdrawDisabled = loading || amount > currentBalance || amount < MIN_WITHDRAWAL_AMOUNT || !isReferralRequirementMet;
    
    // --- Dynamic Input Renderer (UPDATED) ---
    const renderPayoutInputs = () => {
        switch (payoutMethod) {
            case 'NAIRA_BANK':
                return (
                    <>
                        <input
                            type="text"
                            placeholder="Bank Name (e.g., Zenith, GTB)"
                            className="w-full p-3 rounded-md bg-gray-700/80 border border-gray-600 text-white focus:ring-amber-400 focus:border-amber-400 mb-4"
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                            required
                        />
                        <input
                            type="text"
                            placeholder="Account Number"
                            className="w-full p-3 rounded-md bg-gray-700/80 border border-gray-600 text-white focus:ring-amber-400 focus:border-amber-400 mb-4"
                            value={accountNumber}
                            onChange={(e) => setAccountNumber(e.target.value)}
                            required
                        />
                         <input
                            type="text"
                            placeholder="Account Name"
                            className="w-full p-3 rounded-md bg-gray-700/80 border border-gray-600 text-white focus:ring-amber-400 focus:border-amber-400"
                            value={accountName}
                            onChange={(e) => setAccountName(e.target.value)}
                            required
                        />
                    </>
                );
            case 'USDT_TRC20':
                return (
                    <input
                        type="text"
                        placeholder="USDT TRC20 Wallet Address"
                        className="w-full p-3 rounded-md bg-gray-700/80 border border-gray-600 text-white focus:ring-amber-400 focus:border-amber-400"
                        value={cryptoAddress}
                        onChange={(e) => setCryptoAddress(e.target.value)}
                        required
                    />
                );
            case 'USD_PAYPAL':
                return (
                    <input
                        type="email"
                        placeholder="PayPal Email Address"
                        className="w-full p-3 rounded-md bg-gray-700/80 border border-gray-600 text-white focus:ring-amber-400 focus:border-amber-400"
                        value={paypalEmail}
                        onChange={(e) => setPaypalEmail(e.target.value)}
                        required
                    />
                );
            case 'PI_COIN_ADDRESS': // NEW CASE
                return (
                    <input
                        type="text"
                        placeholder="Pi Coin Wallet Address (e.g., pxwcwkalwiwnea)"
                        className="w-full p-3 rounded-md bg-gray-700/80 border border-gray-600 text-white focus:ring-amber-400 focus:border-amber-400"
                        value={piCoinAddress}
                        onChange={(e) => setPiCoinAddress(e.target.value)}
                        required
                    />
                );
            default:
                return null;
        }
    };
    // ---------------------------------

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-xl border border-amber-400/50 max-w-lg w-full">
            <h3 className="text-3xl font-bold text-amber-400 mb-6">Cash Out Pi Coins (P$)</h3>
            
            {/* ... (Balance and Rate Info - unchanged) ... */}
            <div className="mb-4 p-3 bg-gray-700 rounded-md">
                <p className="text-lg text-gray-300">
                    Current Balance: <span className="font-extrabold text-white">{currentBalance.toFixed(2)} P$</span>
                </p>
                <p className="text-sm text-gray-400 mt-1">
                    Exchange Rate: <span className="font-semibold">1 P$ = ${PI_COIN_USD_RATE}</span>
                </p>
                <p className="text-sm text-gray-400">
                    Minimum Withdrawal: <span className="font-semibold">{MIN_WITHDRAWAL_AMOUNT} P$</span>
                </p>
            </div>

            {/* ... (Referral Status Block - unchanged) ... */}
            <div className={`mb-6 p-4 rounded-lg border-2 ${isReferralRequirementMet ? 'bg-green-900/40 border-green-500' : 'bg-red-900/40 border-red-500'}`}>
                <div className="flex items-center justify-between">
                    <h4 className="text-lg font-bold text-white">Withdrawal Requirement</h4>
                    <span className="flex items-center text-sm font-bold">
                        {isReferralRequirementMet ? (
                            <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                        ) : (
                            <XCircle className="w-5 h-5 text-red-400 mr-2" />
                        )}
                        <span className={isReferralRequirementMet ? 'text-green-300' : 'text-red-300'}>
                            {isReferralRequirementMet ? 'MET' : 'PENDING'}
                        </span>
                    </span>
                </div>
                <p className="text-sm text-gray-300 mt-2">
                    Required Referrals for Your Investment Level <span className="text-gray-400">($ {totalInvestedValueUsd.toFixed(2)}):</span>
                    <span className="font-extrabold ml-1 text-amber-300">{requiredReferrals}</span>
                </p>
                <p className="text-sm text-gray-300">
                    Your Active Referrals:
                    <span className="font-extrabold ml-1 text-white">{actualReferrals}</span>
                    {/* Display how many more are needed */}
                    {!isReferralRequirementMet && (
                        <span className="ml-2 text-red-400 font-semibold">
                            (Need {requiredReferrals - actualReferrals} more)
                        </span>
                    )}
                </p>
            </div>


            <form onSubmit={handleWithdrawal} className="space-y-4">
                {/* 1. Pi Coin Amount Input - unchanged */}
                <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-1">
                        Amount of Pi Coins (P$) to Withdraw
                    </label>
                    <input
                        id="amount"
                        type="number"
                        placeholder={`Min: ${MIN_WITHDRAWAL_AMOUNT} P$`}
                        className="w-full p-3 rounded-md bg-gray-700/80 border border-gray-600 text-white focus:ring-amber-400 focus:border-amber-400"
                        value={amount || ''}
                        onChange={(e) => setAmount(Number(e.target.value))}
                        min={0.01}
                        step="any"
                        required
                    />
                    {amount > 0 && (
                        <p className="text-sm text-gray-400 mt-2">
                            Estimated Payout: <span className="font-bold text-amber-300">{payoutAmount}</span>
                        </p>
                    )}
                    {amount > currentBalance && (
                        <p className="text-xs text-red-500 mt-1">Amount exceeds current balance.</p>
                    )}
                </div>

                {/* 2. Payout Method Selection (UPDATED) */}
                <div>
                    <label htmlFor="payoutMethod" className="block text-sm font-medium text-gray-300 mb-1">
                        Choose Payout Method
                    </label>
                    <select
                        id="payoutMethod"
                        className="w-full p-3 rounded-md bg-gray-700/80 border border-gray-600 text-white focus:ring-amber-400 focus:border-amber-400"
                        value={payoutMethod}
                        onChange={(e) => setPayoutMethod(e.target.value as PayoutMethod)}
                        required
                    >
                        <option value="NAIRA_BANK">Naira (Local Bank Transfer)</option>
                        <option value="PI_COIN_ADDRESS">Pi Coin Wallet Address</option> {/* NEW OPTION */}
                        <option value="USDT_TRC20">USDT (TRC20 Network)</option>
                        <option value="USD_PAYPAL">USD (PayPal)</option>
                    </select>
                </div>
                
                {/* 3. Dynamic Payout Details Input (UPDATED) */}
                <div className="p-3 bg-gray-700 rounded-md">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        {payoutMethod === 'NAIRA_BANK' ? 'Bank Details' 
                            : payoutMethod === 'USDT_TRC20' ? 'USDT Wallet Address' 
                            : payoutMethod === 'PI_COIN_ADDRESS' ? 'Pi Coin Wallet Address' // NEW LABEL
                            : 'PayPal Email'}
                    </label>
                    {renderPayoutInputs()}
                </div>

                {/* ... (Warnings and Button - unchanged) ... */}
                {referralWarning && (
                    <div className="p-3 rounded-md text-red-300 bg-red-900/40 text-sm font-medium">
                        {referralWarning}
                    </div>
                )}


                <button 
                    type="submit"
                    disabled={isWithdrawDisabled}
                    title={!isReferralRequirementMet ? `Withdrawal requires ${requiredReferrals} referrals.` : undefined}
                    className="w-full py-3 px-4 rounded-md font-bold text-gray-900 bg-amber-400 hover:bg-amber-300 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Submitting Request...' : `Withdraw ${amount.toFixed(2) || '0.00'} P$`}
                </button>
                <motion.button
                            type="button"
                            onClick={() => navigate("/dashboard")}
                            className="w-full py-3 mt-3 rounded-md font-semibold text-white bg-gradient-to-r from-blue-500/80 to-indigo-600/80 hover:from-indigo-600 hover:to-blue-500 transition-all duration-500 shadow-lg hover:shadow-indigo-500/30 flex justify-center items-center gap-2"
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <ArrowLeftCircle className="w-5 h-5" />
                            Back to Dashboard
                          </motion.button>
            </form>

            {/* Message Display (now submissionMessage) */}
            {submissionMessage && (
                <div 
                    className={`mt-4 p-3 rounded text-sm font-medium ${
                        submissionMessage.type === 'success' 
                        ? 'bg-green-900/40 text-green-300' 
                        : 'bg-red-900/40 text-red-300'
                    }`}
                >
                    {submissionMessage.text}
                </div>
            )}
        </div>
    );
};

export default WithdrawalForm;