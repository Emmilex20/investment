/* eslint-disable @typescript-eslint/no-explicit-any */
// client/src/pages/Dashboard.tsx (FINAL PRODUCTION READY)

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import type { User } from '../types/userTypes';
// Assuming you have a simple icon library or can use an SVG directly
import { RefreshCw } from 'lucide-react'; 

// --- CONFIGURATION ---
// Use the environment variable for the base URL.
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
// --- END CONFIGURATION ---

const API_URL = `${API_BASE_URL}/api/users/profile`; // <-- FIXED URL

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
    const navigate = useNavigate(); 

    // 1. Move the fetch logic into a memoized function (useCallback)
    const fetchProfile = useCallback(async (manualRefresh: boolean = false) => {
        // Use the token from the current userInfo state
        const token = userInfo?.token;
        if (!token) return;

        if (manualRefresh) {
            setIsRefreshing(true);
        } else {
            setLoading(true);
        }
        
        setError(null);
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`, // Use the extracted token
                },
            };

            const { data } = await axios.get<User>(API_URL, config); // <-- Using fixed API_URL

            // Update local state (for full dashboard view)
            setProfile(data); 

            // FIX: Update global context with ALL relevant latest profile data.
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
                // Ensure we handle case where response.data is an object with a message property
                errorMessage = (err.response.data as any).message || 'Authentication required.';
            }
            setError(errorMessage);
            
            // If token is expired or invalid (e.g., 401 Unauthorized), log user out
            if (!manualRefresh && axios.isAxiosError(err) && err.response?.status === 401) { 
                logout();
            }
        } finally {
            if (manualRefresh) {
                setIsRefreshing(false);
            } else {
                setLoading(false);
            }
        }
    }, [userInfo, dispatch, logout]); // Dependencies are clean

    // 2. useEffect for initial load
    useEffect(() => {
        // Only run on initial mount if userInfo exists and profile hasn't been fetched
        if (userInfo && !profile) { 
            fetchProfile();
        }
        // Dependency Array: Re-run only if userInfo changes (e.g., login/logout) or if fetchProfile changes (which it shouldn't unless its deps change)
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
        // If userInfo is null, this means the user is logged out. Redirect to home/login.
        if (!userInfo) navigate('/');
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
                            {/* Display referredBy user's name if available, otherwise 'None' */}
                            {profile.referredBy ? (
                                <span className='font-bold text-pi-green-alt'>{profile.referredBy.name}</span>
                            ) : (
                                'None'
                            )}
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