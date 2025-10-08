/* eslint-disable no-irregular-whitespace */
// client/src/pages/Dashboard.tsx (FIXED: Propagating referrals to AuthContext)

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import type { User } from '../types/userTypes';
// Assuming you have a simple icon library or can use an SVG directly
import { RefreshCw } from 'lucide-react'; // Example icon import (replace with your actual icon component)

// API base URL
const API_URL = 'http://localhost:5000/api/users/profile';

const Dashboard: React.FC = () => {
    const { userInfo, dispatch, logout } = useAuth();
    // Initialize profile to null. This ensures that the component enters a loading state 
    // until the *full* profile (with populated referrals) is fetched from the server.
    const [profile, setProfile] = useState<User | null>(null); 
    // Separate loading state for the *initial* profile load
    const [loading, setLoading] = useState(false); 
    // New state for balance-specific refresh
    const [isRefreshing, setIsRefreshing] = useState(false); 
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate(); // Initialize navigate

    // 1. Move the fetch logic into a memoized function (useCallback)
    const fetchProfile = useCallback(async (manualRefresh: boolean = false) => {
        if (!userInfo || !userInfo.token) return;

        // FIX: Use if/else blocks instead of ternary expressions for side effects (set state)
        if (manualRefresh) {
            setIsRefreshing(true);
        } else {
            setLoading(true);
        }
        
        setError(null);
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };

            const { data } = await axios.get<User>(API_URL, config);

            // Update local state (for full dashboard view)
            setProfile(data); 

            // FIX: Update global context with ALL relevant latest profile data.
            // This ensures WithdrawalForm.tsx uses the correct (non-stale) referral count.
            dispatch({ 
                type: 'UPDATE_PROFILE', 
                payload: { 
                    piCoinsBalance: data.piCoinsBalance,
                    referrals: data.referrals, // <-- PROPAGATE REFERRALS
                    referredBy: data.referredBy, // <-- PROPAGATE REFERRED_BY
                } 
            });

        } catch (err) {
            let errorMessage = 'Failed to load profile data.';
            if (axios.isAxiosError(err) && err.response) {
                errorMessage = err.response.data.message || 'Authentication required.';
            }
            setError(errorMessage);
            // If token is expired or invalid, log user out
            if (!manualRefresh) { // Only log out on initial load failure or critical error
                logout();
            }
        } finally {
            // FIX: Use if/else blocks instead of ternary expressions for side effects (set state)
            if (manualRefresh) {
                setIsRefreshing(false);
            } else {
                setLoading(false);
            }
        }
    }, [userInfo, dispatch, logout]); // Dependencies for useCallback

    // 2. useEffect for initial load
    useEffect(() => {
        // Only run on initial mount if userInfo exists and profile hasn't been fetched
        if (userInfo && !profile) { 
            fetchProfile();
        }
        // Dependency Array: Re-run only if userInfo changes (e.g., login/logout)
    }, [userInfo, fetchProfile, profile]); 

    // Handle initial loading state visibility
    if (loading || (!profile && userInfo)) {
        return <div className="text-xl text-pi-accent mt-10">Loading Dashboard...</div>;
    }

    if (error && !profile) {
        return <div className="text-xl text-red-500 mt-10">Error: {error}</div>;
    }

    // Fallback if user is not logged in, though AuthProvider should handle this
    if (!profile) {
        return <div className="text-xl text-red-500 mt-10">Please log in to view the dashboard.</div>;
    }
    
    // Now, profile is guaranteed to be a User object
    
    const cardClass = "bg-white/10 p-6 rounded-xl shadow-lg border border-pi-accent/50";
    const labelClass = "text-gray-400 text-sm mb-1";
    const valueClass = "text-white text-2xl font-bold";

    return (
        <div className="w-full max-w-4xl p-4">
            <h2 className="text-4xl font-bold text-white mb-6">
                Welcome, {profile.name}!
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Pi Coin Balance Card (UPDATED with Refresh Button) */}
                <div className={`${cardClass} col-span-1 md:col-span-2 flex flex-col justify-between`}>
                    <div>
                        <div className={labelClass}>Your Pi Coin Balance (P$)</div>
                        <div className={valueClass}>{profile.piCoinsBalance.toFixed(2)} P$</div>
                        <div className="text-sm text-pi-green-alt mt-2">
                            Use P$ to purchase investment packages.
                        </div>
                    </div>
                    {/* RELOAD BUTTON */}
                    <button
                        onClick={() => fetchProfile(true)} // Pass true for manual refresh
                        disabled={isRefreshing}
                        className="mt-4 flex items-center justify-center space-x-2 py-2 px-4 rounded-full text-sm font-bold text-gray-900 bg-pi-green-alt/90 hover:bg-pi-green-alt transition duration-300 disabled:opacity-50"
                    >
                        {isRefreshing ? (
                            <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                <span>Refreshing...</span>
                            </>
                        ) : (
                            <>
                                <RefreshCw className="w-4 h-4" />
                                <span>Refresh Balance</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Referral Code Card */}
                <div className={`${cardClass} bg-pi-accent/20`}>
                    <div className={labelClass}>Your Referral Code</div>
                    <div className="text-white text-xl font-mono tracking-widest">{profile.referralCode}</div>
                    <button 
                        onClick={() => { navigator.clipboard.writeText(profile.referralCode); alert('Code copied!'); }}
                        className="text-xs mt-2 text-white/70 hover:text-white"
                    >
                        (Click to Copy)
                    </button>
                </div>
            </div>

            {/* Referral Status Section */}
            <div className={`${cardClass} mb-8`}>
                <h3 className="text-2xl text-pi-accent font-semibold mb-4">Referral Status</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <div className={labelClass}>Total Active Referrals:</div>
                        <div className={valueClass}>{profile.referrals.length}</div>
                    </div>
                    <div>
                        <div className={labelClass}>Referred By:</div>
                        <div className="text-white text-lg">
                            {profile.referredBy ? profile.referredBy.name : 'None'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <button
                    onClick={() => navigate('/deposit')}
                    className="col-span-1 py-3 px-4 rounded-lg font-bold text-white bg-pi-green-alt hover:bg-pi-green-alt/80 transition duration-300"
                >
                    Deposit (Get P$)
                </button>
                
                <button
                    onClick={() => navigate('/transfer')}
                    className="col-span-1 py-3 px-4 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 transition duration-300"
                >
                    Transfer P$
                </button>
                
                {/* WITHDRAW BUTTON */}
                <button
                    onClick={() => navigate('/withdraw')}
                    className="col-span-1 py-3 px-4 rounded-lg font-bold text-gray-900 bg-amber-400 hover:bg-amber-300 transition duration-300"
                >
                    Withdraw
                </button>

                <button
                    onClick={() => navigate('/invest')}
                    className="col-span-1 py-3 px-4 rounded-lg font-bold text-white bg-pi-accent hover:bg-pi-accent/80 transition duration-300"
                >
                    Invest
                </button>
                <button
                    onClick={logout}
                    className="col-span-2 md:col-span-1 py-3 px-4 rounded-lg font-bold text-gray-300 border border-gray-600 hover:border-red-500 hover:text-red-500 transition duration-300"
                >
                    Logout
                </button>
            </div>

        </div>
    );
};

export default Dashboard;