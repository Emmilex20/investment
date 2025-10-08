// client/src/pages/Transfer.tsx (FIXED)
import React, { useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Transfer: React.FC = () => {
    // 1. ALL HOOKS MUST BE AT THE TOP (UNCONDITIONAL)
    const { userInfo, dispatch } = useAuth();
    const navigate = useNavigate();
    
    const [recipientEmail, setRecipientEmail] = useState<string>('');
    const [amount, setAmount] = useState<number>(0);
    const [message, setMessage] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    // 2. Conditional check and early return go AFTER all hooks
    if (!userInfo) {
        navigate('/login');
        return null; 
    }

    const submitHandler = async (e: FormEvent) => {
        e.preventDefault();
        setMessage('');
        
        if (amount <= 0 || !recipientEmail) {
            setMessage('Please enter a valid email and amount.');
            return;
        }

        // Use optional chaining for safety, though userInfo is guaranteed here
        if (amount > userInfo.piCoinsBalance) {
            setMessage('Insufficient balance for this transfer.');
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
                'http://localhost:5000/api/users/transfer',
                { recipientEmail, amount },
                config
            );

            setMessage(data.message);
            
            // Update the global user state with the new balance
            dispatch({ type: 'UPDATE_PROFILE', payload: { piCoinsBalance: data.newBalance } });

            // Reset fields
            setAmount(0);
            setRecipientEmail('');
            
        } catch (error) {
            let errorMessage = 'An unexpected error occurred.';
            if (axios.isAxiosError(error) && error.response) {
                errorMessage = error.response.data.message || 'Transfer failed.';
            }
            setMessage(`Error: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full p-3 rounded-md bg-white/20 border border-pi-accent/40 text-white placeholder-gray-400 focus:outline-none focus:border-pi-accent/80 transition duration-150";
    const buttonClass = "w-full py-3 rounded-md font-bold text-white bg-pi-accent hover:bg-pi-accent/80 transition duration-300 disabled:opacity-50";

    return (
        <div className="w-full max-w-lg p-4 bg-white/10 rounded-xl shadow-2xl backdrop-blur-sm border border-pi-accent/50">
            <h2 className="text-3xl font-bold text-white text-center mb-6">
                Pi Coin Transfer
            </h2>
            <div className='mb-6 text-center'>
                <p className="text-lg text-gray-300">
                    Your Balance: <span className="text-pi-green-alt font-bold">{userInfo.piCoinsBalance.toFixed(2)} P$</span>
                </p>
            </div>

            {message && (
                <div className={`p-3 mb-4 rounded ${message.includes('Successfully transferred') ? 'bg-pi-green-alt/20 text-pi-green-alt' : 'bg-red-900/40 text-red-400'}`}>
                    {message}
                </div>
            )}

            <form onSubmit={submitHandler}>
                {/* Recipient Email */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="recipientEmail">Recipient Email</label>
                    <input
                        type="email"
                        id="recipientEmail"
                        placeholder="Enter recipient's email"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        className={inputClass}
                        required
                    />
                </div>

                {/* Amount */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="amount">Amount (P$)</label>
                    <input
                        type="number"
                        id="amount"
                        placeholder="e.g., 1000"
                        value={amount}
                        onChange={(e) => setAmount(Number(e.target.value))}
                        min="1"
                        step="1"
                        className={inputClass}
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className={buttonClass}
                >
                    {loading ? 'Processing Transfer...' : `Transfer ${amount.toFixed(2)} P$`}
                </button>
                <button
                    type="button"
                    onClick={() => navigate('/dashboard')}
                    className="w-full mt-3 py-3 rounded-md font-bold text-gray-400 bg-white/5 hover:bg-white/10 transition duration-300"
                >
                    Cancel
                </button>
            </form>
        </div>
    );
};

export default Transfer;