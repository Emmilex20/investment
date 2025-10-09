/* eslint-disable @typescript-eslint/no-explicit-any */
// client/src/pages/Deposit.tsx (FINAL PRODUCTION READY with Receipt Upload)

import React, { useState, type FormEvent, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// --- CONFIGURATION ---
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
// --- END CONFIGURATION ---

// Define specific types for clarity
interface UsdtDetails {
    address: string;
    network: string;
    note: string;
}

interface NairaDetails {
    bank: string;
    accountName: string;
    accountNumber: string;
    note: string;
}

// Define the shape of the deposit details object
const depositDetails: { usdt: UsdtDetails, naira: NairaDetails } = {
    usdt: {
        address: 'TDt9...KjQp',
        network: 'TRC-20 (Tron)',
        note: 'Send USDT (TRC-20) to the address above. Deposits are reviewed manually.',
    },
    naira: {
        bank: 'Access Bank',
        accountName: 'PI INVESTMENT LIMITED',
        accountNumber: '0001234567',
        note: 'Transfer the exact amount and upload your payment receipt below for confirmation.',
    }
};

const Deposit: React.FC = () => {
    // 1. ALL HOOKS MUST BE CALLED UNCONDITIONALLY AT THE TOP
    // FIX 2: Removed 'dispatch' as it's no longer used for immediate balance updates
    const { userInfo } = useAuth(); 
    const navigate = useNavigate();

    // All useState calls
    const [amount, setAmount] = useState<number>(10);
    const [method, setMethod] = useState<'usdt' | 'naira'>('usdt');
    const [receiptFile, setReceiptFile] = useState<File | null>(null); // New state for the receipt
    const [message, setMessage] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    // 2. Conditional return now executes AFTER all hooks have been called
    useEffect(() => {
        if (!userInfo) {
            navigate('/login');
        }
    }, [userInfo, navigate]);

    if (!userInfo) return null; 

    // Simulated rates (must match backend for estimation)
    const USD_TO_PI_RATE = 100; 
    const NGN_TO_USD_RATE = 0.001; 

    // Calculate USD equivalent
    const amountUSD = method === 'naira' ? amount * NGN_TO_USD_RATE : amount;
    // Calculate Pi Coins to credit
    const piCoinsToCredit = amountUSD * USD_TO_PI_RATE;

    const submitHandler = async (e: FormEvent) => {
        e.preventDefault();
        setMessage('');
        
        // Basic frontend validation for minimum deposit (equivalent to $10)
        if (amountUSD < 10) {
            setMessage('Minimum deposit equivalent is $10 USD.');
            return;
        }

        // Mandatory receipt for all deposits now
        if (!receiptFile) {
            setMessage('Please upload a screenshot of your payment receipt for verification.');
            return;
        }

        setLoading(true);

        // Use FormData for file upload
        const formData = new FormData();
        formData.append('amount', String(amount));
        formData.append('method', method);
        if (receiptFile) {
            formData.append('receipt', receiptFile); // 'receipt' must match the Multer field name
        }

        try {
            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data', // Crucial for file upload
                    // userInfo.token is guaranteed to exist here due to the early check
                    Authorization: `Bearer ${userInfo.token}`, 
                },
            };

            const { data } = await axios.post(
                `${API_BASE_URL}/api/deposits`, 
                formData, 
                config
            );

            setMessage(`Success: ${data.message}`);
            
            // Clear form fields and file state
            setAmount(method === 'naira' ? 10000 : 10);
            setReceiptFile(null);
            
            // Navigate or encourage checking history
            setTimeout(() => navigate('/dashboard'), 3000); 

        } catch (error) {
            let errorMessage = 'An unexpected error occurred.';
            if (axios.isAxiosError(error) && error.response) {
                errorMessage = (error.response.data as any).message || 'Deposit failed.';
            }
            setMessage(`Error: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full p-3 rounded-md bg-white/20 border border-pi-accent/40 text-white placeholder-gray-400 focus:outline-none focus:border-pi-accent/80 transition duration-150";
    const buttonClass = "w-full py-3 rounded-md font-bold text-white bg-pi-green-alt hover:bg-pi-green-alt/80 transition duration-300 disabled:opacity-50";

    // Cast the details based on the current method to satisfy TypeScript
    const currentDetails = depositDetails[method];

    // Helper to check for Naira details structure
    const isNairaDetails = (details: UsdtDetails | NairaDetails): details is NairaDetails => {
        return (details as NairaDetails).bank !== undefined;
    }

    return (
        <div className="w-full max-w-lg p-4 bg-white/10 rounded-xl shadow-2xl backdrop-blur-sm border border-pi-accent/50">
            <h2 className="text-3xl font-bold text-pi-accent text-center mb-6">
                Confirm Deposit Payment
            </h2>
            
            {/* Balance & Rate Display */}
            <div className='mb-4 text-center'>
                <p className="text-gray-300">Current Balance: <span className="text-pi-green-alt font-bold">{userInfo.piCoinsBalance.toFixed(2)} P$</span></p>
                <p className="text-sm text-gray-400">Rate: $1 USD = {USD_TO_PI_RATE} P$ | ₦{Math.round(1 / NGN_TO_USD_RATE).toLocaleString()} ≈ $1 USD (Est.)</p>
            </div>

            {/* Message Alert */}
            {message && (
                <div className={`p-3 mb-4 rounded ${message.includes('Success') ? 'bg-pi-green-alt/20 text-pi-green-alt' : 'bg-red-900/40 text-red-400'}`}>
                    {message}
                </div>
            )}

            <form onSubmit={submitHandler}>
                {/* Method Selection */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-1">Payment Method</label>
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => { setMethod('usdt'); setAmount(10); setReceiptFile(null); }}
                            className={`flex-1 py-3 rounded-md font-bold transition duration-150 ${method === 'usdt' ? 'bg-pi-accent text-white' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
                        >
                            Crypto (USDT)
                        </button>
                        <button
                            type="button"
                            onClick={() => { setMethod('naira'); setAmount(10000); setReceiptFile(null); }}
                            className={`flex-1 py-3 rounded-md font-bold transition duration-150 ${method === 'naira' ? 'bg-pi-accent text-white' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
                        >
                            Local (Naira)
                        </button>
                    </div>
                </div>

                {/* Deposit Details Display */}
                <div className="mb-6 p-4 bg-red-900/40 rounded-md border border-red-500/50">
                    <h4 className="text-lg font-bold text-red-300 mb-2">
                        {method === 'naira' ? 'Bank Transfer Details' : 'USDT Wallet Address'}
                    </h4>
                    {/* FIX 1: Use type guard to solve TypeScript property access errors */}
                    {isNairaDetails(currentDetails) ? (
                        <>
                            <p className="text-gray-200">Bank: <span className="font-bold">{currentDetails.bank}</span></p>
                            <p className="text-gray-200">Account Name: <span className="font-bold">{currentDetails.accountName}</span></p>
                            <p className="text-gray-200">Account Number: <span className="font-bold text-yellow-300">{currentDetails.accountNumber}</span></p>
                        </>
                    ) : (
                        <>
                            <p className="text-gray-200">Address: <span className="font-bold text-yellow-300 break-all">{currentDetails.address}</span></p>
                            <p className="text-gray-200">Network: <span className="font-bold">{currentDetails.network}</span></p>
                        </>
                    )}
                </div>

                {/* Amount Input */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="amount">
                        Amount to Deposit ({method === 'naira' ? 'NGN ₦' : 'USD $'})
                    </label>
                    <input
                        type="number"
                        id="amount"
                        placeholder={method === 'naira' ? 'e.g., 50000' : 'e.g., 50'}
                        value={amount}
                        onChange={(e) => setAmount(Number(e.target.value))}
                        min={method === 'naira' ? 10000 : 10}
                        step={method === 'naira' ? 1000 : 5}
                        className={inputClass}
                        required
                    />
                </div>

                {/* Conditional Receipt File Upload */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="receipt">
                        Upload Payment Screenshot/Receipt <span className='text-red-400'>(Required)</span>
                    </label>
                    <input
                        type="file"
                        id="receipt"
                        accept="image/*, application/pdf"
                        onChange={(e) => setReceiptFile(e.target.files ? e.target.files[0] : null)}
                        className={`${inputClass} pt-2`}
                        required
                    />
                     <p className="text-xs text-gray-500 mt-1">
                        {currentDetails.note}
                    </p>
                </div>


                {/* Summary */}
                <div className="mb-6 p-3 bg-white/10 rounded-md">
                    <p className="text-gray-300">USD Equivalent: <span className="font-bold text-white">${amountUSD.toFixed(2)}</span></p>
                    <p className="text-gray-300">P$ to be Credited (Upon Admin Approval):</p>
                    <p className="text-xl font-bold text-pi-accent">{piCoinsToCredit.toFixed(2)} P$</p>
                </div>

                <button
                    type="submit"
                    // Disabled if loading OR if receipt file is missing
                    disabled={loading || !receiptFile}
                    className={buttonClass}
                >
                    {loading ? 'Submitting Request...' : `Submit Deposit Request`}
                </button>
            </form>
        </div>
    );
};

export default Deposit;