// client/src/pages/Invest.tsx (FIXED UX: Added Referral Requirement Warning)

import React, { useEffect, useState, useCallback } from 'react'; 
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import type { InvestmentPackage, UserInvestment } from '../types/userTypes';

const Invest: React.FC = () => {
    // 1. ALL HOOKS MUST BE AT THE ABSOLUTE TOP (UNCONDITIONAL)
    const { userInfo, dispatch } = useAuth();
    const navigate = useNavigate();

    const [packages, setPackages] = useState<InvestmentPackage[]>([]);
    const [myInvestments, setMyInvestments] = useState<UserInvestment[]>([]);
    const [loading, setLoading] = useState(true);
    const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    // FIX 1: Extract necessary primitive dependency (token)
    const userToken = userInfo?.token;
    
    // ----------------------------------------------------
    // FIX 2: Correcting fetchData dependencies
    // ----------------------------------------------------
    const fetchData = useCallback(async () => {
        if (!userToken) return; 

        setLoading(true);
        setError(null);
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${userToken}`, 
                },
            };
            
            // Fetch packages
            const packagesRes = await axios.get<InvestmentPackage[]>('http://localhost:5000/api/investments/packages', config);
            setPackages(packagesRes.data);

            // Fetch user investments
            const investmentsRes = await axios.get<UserInvestment[]>('http://localhost:5000/api/investments/my-investments', config);
            setMyInvestments(investmentsRes.data);

        } catch (err) {
            let errorMessage = 'Failed to load investment data.';
            if (axios.isAxiosError(err) && err.response) {
                errorMessage = err.response.data.message || 'Server Error.';
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [userToken]); 

    // ----------------------------------------------------
    // FIX 3: Correcting useEffect dependencies
    // ----------------------------------------------------
    useEffect(() => {
        // Only run if the user is logged in (has a token)
        if (userToken) {
            fetchData();
        }
    }, [fetchData, userToken]);

    // Conditional early return AFTER all hooks
    if (!userInfo) {
        navigate('/login');
        return null;
    }

    // ----------------------------------------------------
    // Correct and single definition of handlePurchase
    // ----------------------------------------------------
    const handlePurchase = async (packageId: string) => {
        if (!userInfo.token) return;

        setPurchaseLoading(packageId);
        setMessage(null);
        setError(null);

        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };

            const { data } = await axios.post(
                'http://localhost:5000/api/investments/purchase',
                { packageId },
                config
            );

            setMessage(data.message);
            
            // Assuming data.newBalance is the updated balance
            dispatch({ type: 'UPDATE_PROFILE', payload: { piCoinsBalance: data.newBalance } });

            // Re-fetch data to show the new investment
            await fetchData(); 

        } catch (err) {
            let errorMessage = 'Purchase failed.';
            if (axios.isAxiosError(err) && err.response) {
                errorMessage = err.response.data.message || 'Transaction error.';
            }
            setError(errorMessage);
        } finally {
            setPurchaseLoading(null);
        }
    };

    // ----------------------------------------------------
    // Correct and single definition of handleWithdrawal
    // ----------------------------------------------------
    const handleWithdrawal = async (investmentId: string) => {
        if (!userInfo.token) return;
        console.log(`Attempting withdrawal for ID: ${investmentId}. Length: ${investmentId.length}`)

        setPurchaseLoading(investmentId);
        setMessage(null);
        setError(null);

        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };

            const { data } = await axios.post(
                `http://localhost:5000/api/investments/withdraw/${investmentId}`,
                {},
                config
            );

            setMessage(data.message);
            
            // Assuming data.newBalance is the updated balance
            dispatch({ type: 'UPDATE_PROFILE', payload: { piCoinsBalance: data.newBalance } });
            await fetchData(); 

        } catch (err) {
            let errorMessage = 'Withdrawal failed.';
            if (axios.isAxiosError(err) && err.response) {
                errorMessage = err.response.data.message || 'Transaction error.';
            }
            setError(errorMessage);
        } finally {
            setPurchaseLoading(null);
        }
    };
    
    // Helper for styling
    const cardClass = "bg-white/10 p-6 rounded-xl shadow-lg border border-pi-accent/50";
    const highlightClass = "text-pi-green-alt font-semibold";
    
    // Use optional chaining just in case referrals is undefined
    const currentReferrals = userInfo.referrals?.length ?? 0;
    const currentBalance = userInfo.piCoinsBalance;

    return (
        <div className="w-full max-w-5xl p-4">
            <h2 className="text-4xl font-bold text-white mb-6 text-pi-accent">
                Investment Plans
            </h2>
            
            <div className="mb-6 p-4 bg-white/10 rounded-lg border border-gray-600">
                <p className="text-lg text-gray-300">
                    Your Balance: <span className={highlightClass}>{currentBalance.toFixed(2)} P$</span> | 
                    Your Referrals: <span className={highlightClass}>{currentReferrals}</span>
                </p>
                <button 
                    onClick={() => navigate('/deposit')}
                    className="mt-2 text-sm text-pi-green-alt hover:underline"
                >
                    + Add Funds
                </button>
                <button 
                    onClick={() => navigate('/transfer')}
                    className="mt-2 ml-4 text-sm text-pi-accent hover:underline"
                >
                    Transfer P$
                </button>
            </div>

            {(error || message) && (
                <div className={`p-3 mb-6 rounded ${error ? 'bg-red-900/40 text-red-400' : 'bg-pi-green-alt/20 text-pi-green-alt'}`}>
                    {error || message}
                </div>
            )}
            
            {loading ? (
                <div className="text-xl text-pi-accent text-center">Loading Packages...</div>
            ) : packages.length === 0 ? (
                <div className="text-xl text-gray-400 text-center">No active investment packages found.</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {packages.map((pkg) => {
                        const canAfford = currentBalance >= pkg.rewardPiCoins;
                        // NEW LOGIC: Check if the user meets the initial referral requirement for withdrawal
                        const hasRequiredReferrals = currentReferrals >= pkg.requiredReferrals;
                        const requiresReferrals = pkg.requiredReferrals > 0;
                        
                        return (
                            <div key={pkg._id} className={`${cardClass} flex flex-col justify-between`}>
                                <div>
                                    <h3 className="text-2xl font-bold mb-3 text-white">{pkg.name}</h3>
                                    <p className="text-lg text-gray-300 mb-2">
                                        Invest: <span className={highlightClass}>{pkg.rewardPiCoins} P$</span>
                                    </p>
                                    <ul className="text-sm space-y-2 text-gray-400 mb-4">
                                        <li>ROI: **{pkg.dailyReturnRate * 100}% Daily**</li>
                                        <li>Duration: **{pkg.durationDays} Days**</li>
                                        <li className={'text-yellow-400 font-bold'}>
                                            Withdrawal Requirement: **{pkg.requiredReferrals} Referrals**
                                        </li>
                                    </ul>
                                </div>
                                
                                {/* NEW: Referral Warning / Status Message */}
                                {requiresReferrals && !hasRequiredReferrals && (
                                    <div className="text-sm p-2 mb-3 rounded bg-red-800/50 text-red-300 font-medium">
                                        Warning: You need **{pkg.requiredReferrals} Referrals** to withdraw profits. You currently have **{currentReferrals}**.
                                    </div>
                                )}
                                
                                <button
                                    onClick={() => handlePurchase(pkg._id)}
                                    // Button is only disabled if user can't afford it OR if it's currently processing
                                    disabled={!canAfford || purchaseLoading === pkg._id}
                                    title={!canAfford ? 'Insufficient P$ balance' : purchaseLoading === pkg._id ? 'Processing...' : 'Invest Now'}
                                    className={`w-full py-2 rounded-lg font-bold text-white transition duration-300 ${
                                        canAfford
                                            ? 'bg-pi-green-alt hover:bg-pi-green-alt/80'
                                            : 'bg-gray-700 cursor-not-allowed opacity-60'
                                    }`}
                                >
                                    {purchaseLoading === pkg._id 
                                        ? 'Processing...' 
                                        : canAfford 
                                            ? 'Invest Now' 
                                            : 'Insufficient P$'}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
            
            {/* User's Active Investments List */}
            <div className='mt-10'>
                 <h3 className="text-3xl font-bold text-white mb-4 border-b border-pi-accent/50 pb-2">
                    My Investments
                </h3>
                {myInvestments.length === 0 ? (
                    <p className="text-gray-400">You have no investments yet.</p>
                ) : (
                    <div className="space-y-4">
                        {myInvestments.map(inv => {
                            const isCompleted = inv.status === 'completed';
                            const isWithdrawn = inv.status === 'withdrawn';
                            const requiresReferrals = inv.package.requiredReferrals > 0;
                            // Re-use hasReferrals check for consistency
                            const hasReferrals = currentReferrals >= inv.package.requiredReferrals; 
                            
                            return (
                                <div key={inv._id} className={`${cardClass} border-l-4 ${isCompleted ? 'border-yellow-400' : isWithdrawn ? 'border-gray-500' : 'border-pi-green-alt'} flex justify-between items-center`}>
                                    <div>
                                        <p className="text-xl font-semibold">{inv.package.name} <span className={`text-sm ml-2 ${isCompleted ? 'text-yellow-400' : isWithdrawn ? 'text-gray-500' : 'text-pi-green-alt'}`}>({inv.status.toUpperCase()})</span></p>
                                        <p className="text-gray-400">Invested: {inv.investedAmount} P$ | Earned: {inv.totalReturns.toFixed(2)} P$</p>
                                        <p className="text-sm text-gray-500">Ends: {new Date(inv.endDate).toLocaleDateString()}</p>
                                        {/* Display referral requirement only for withdrawal */}
                                        {requiresReferrals && isCompleted && !isWithdrawn && (
                                            <p className={`text-xs mt-1 font-bold ${hasReferrals ? 'text-green-400' : 'text-red-400'}`}>
                                                Withdrawal Requirement: {inv.package.requiredReferrals} Referrals {hasReferrals ? '(MET)' : '(PENDING)'}
                                            </p>
                                        )}
                                    </div>
                                    
                                    {isCompleted && !isWithdrawn && (
                                        <button
                                            onClick={() => handleWithdrawal(inv._id)}
                                            disabled={!hasReferrals || purchaseLoading === inv._id}
                                            title={!hasReferrals ? `Requires ${inv.package.requiredReferrals} referrals` : 'Withdraw now'}
                                            className={`py-2 px-4 rounded-lg font-bold text-white transition duration-300 ${
                                                hasReferrals
                                                    ? 'bg-yellow-600 hover:bg-yellow-500'
                                                    : 'bg-gray-700 cursor-not-allowed opacity-60'
                                            }`}
                                        >
                                            {purchaseLoading === inv._id ? 'Withdrawing...' : 'Withdraw'}
                                        </button>
                                    )}
                                    {isWithdrawn && (
                                        <span className="text-gray-500 font-bold">Funds Retrieved</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

        </div>
    );
};

export default Invest;