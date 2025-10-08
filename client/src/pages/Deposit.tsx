// client/src/pages/Deposit.tsx (FIXED)

import React, { useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Deposit: React.FC = () => {
    // 1. ALL HOOKS MUST BE CALLED UNCONDITIONALLY AT THE TOP
    const { userInfo, dispatch } = useAuth();
    const navigate = useNavigate();

    // All useState calls moved up here:
    const [amount, setAmount] = useState<number>(10); // Generic amount field
    const [method, setMethod] = useState<'usdt' | 'naira'>('usdt');
    const [message, setMessage] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    // 2. Conditional return now executes AFTER all hooks have been called
    if (!userInfo) {
        // Since hooks are called, this early return is fine.
        navigate('/login');
        return null; 
    }

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
        
        if (amountUSD < 10) {
            setMessage('Minimum deposit equivalent is $10 USD.');
            return;
        }

        setLoading(true);

        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };

            const { data } = await axios.post(
                'http://localhost:5000/api/deposits',
                // Send generic amount and selected method
                { amount, method }, 
                config
            );

            setMessage(data.message);
            
            // Update the global user state with the new balance
            dispatch({ type: 'UPDATE_PROFILE', payload: { piCoinsBalance: data.piCoinsBalance } });

            setTimeout(() => navigate('/dashboard'), 2000);

        } catch (error) {
            let errorMessage = 'An unexpected error occurred.';
            if (axios.isAxiosError(error) && error.response) {
                errorMessage = error.response.data.message || 'Deposit failed.';
            }
            setMessage(`Error: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full p-3 rounded-md bg-white/20 border border-pi-accent/40 text-white placeholder-gray-400 focus:outline-none focus:border-pi-accent/80 transition duration-150";
    const buttonClass = "w-full py-3 rounded-md font-bold text-white bg-pi-green-alt hover:bg-pi-green-alt/80 transition duration-300 disabled:opacity-50";

    return (
        <div className="w-full max-w-lg p-4 bg-white/10 rounded-xl shadow-2xl backdrop-blur-sm border border-pi-accent/50">
            <h2 className="text-3xl font-bold text-pi-accent text-center mb-6">
                Deposit Funds
            </h2>
            <div className='mb-4 text-center'>
                <p className="text-gray-300">Current Balance: <span className="text-pi-green-alt font-bold">{userInfo.piCoinsBalance.toFixed(2)} P$</span></p>
                <p className="text-sm text-gray-400">Rate: $1 USD = {USD_TO_PI_RATE} P$ | ₦1,000 ≈ $1 USD</p>
            </div>

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
                            onClick={() => { setMethod('usdt'); setAmount(10); }}
                            className={`flex-1 py-3 rounded-md font-bold transition duration-150 ${method === 'usdt' ? 'bg-pi-accent text-white' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
                        >
                            Crypto (USDT)
                        </button>
                        <button
                            type="button"
                            onClick={() => { setMethod('naira'); setAmount(10000); }}
                            className={`flex-1 py-3 rounded-md font-bold transition duration-150 ${method === 'naira' ? 'bg-pi-accent text-white' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
                        >
                            Local (Naira)
                        </button>
                    </div>
                </div>

                {/* Amount Input */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="amount">
                        Amount ({method === 'naira' ? 'NGN ₦' : 'USD $'})
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

                {/* Summary */}
                <div className="mb-6 p-3 bg-white/10 rounded-md">
                    <p className="text-gray-300">USD Equivalent: <span className="font-bold text-white">${amountUSD.toFixed(2)}</span></p>
                    <p className="text-gray-300">You will receive:</p>
                    <p className="text-xl font-bold text-pi-accent">{piCoinsToCredit.toFixed(2)} P$</p>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className={buttonClass}
                >
                    {loading ? 'Processing Deposit...' : `Confirm Deposit of ${method === 'naira' ? '₦' : '$'}${amount.toFixed(2)}`}
                </button>
            </form>
        </div>
    );
};

export default Deposit;