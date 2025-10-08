/* eslint-disable @typescript-eslint/no-explicit-any */
// client/src/pages/AdminDashboard.tsx (FINAL PRODUCTION READY)

import React, { useEffect, useState, type FormEvent, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

// --- CONFIGURATION ---
// Use the environment variable for the base URL. Fallback to localhost for safety.
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
// --- END CONFIGURATION ---


interface AdminUserView {
    _id: string;
    name: string;
    email: string;
    piCoinsBalance: number;
    // Simplified view of referrals matching the backend's .populate('referrals', '_id')
    referrals: { _id: string }[]; 
    isAdmin: boolean;
}

// Define the type structure for a Withdrawal Request
interface WithdrawalRequest {
    _id: string;
    userId: string;
    userName: string; // Populated data from the User model
    userEmail: string; // Populated data from the User model
    amount: number; // Amount of P$ withdrawn
    payoutMethod: 'NAIRA_BANK' | 'USDT_TRC20' | 'USD_PAYPAL';
    details: string; // A concise string representation of payout details
    status: 'Pending' | 'Processed' | 'Failed';
    createdAt: string;
}

const AdminDashboard: React.FC = () => {
    const { userInfo, dispatch } = useAuth();
    const navigate = useNavigate();

    // State for User Management
    const [users, setUsers] = useState<AdminUserView[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [creditData, setCreditData] = useState({ userId: '', amount: 0 });
    const [creditMessage, setCreditMessage] = useState<string | null>(null);
    const [creditLoading, setCreditLoading] = useState(false);

    // State for Withdrawal Management
    const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
    const [withdrawalLoading, setWithdrawalLoading] = useState(false);
    const [withdrawalError, setWithdrawalError] = useState<string | null>(null);


    // Redirect if not logged in or not an admin
    useEffect(() => {
        if (!userInfo || !userInfo.isAdmin) {
            navigate('/dashboard'); 
        }
    }, [userInfo, navigate]);

    // **FIX: Extract token and isAdmin for stable dependencies**
    const token = userInfo?.token;
    const isAdmin = userInfo?.isAdmin;


    // --- API Fetch Functions (Using useCallback and Production URL) ---

    // 1. Fetch All Users
    const fetchUsers = useCallback(async () => {
        if (!isAdmin || !token) { 
            setLoading(false);
            return; 
        }
        setLoading(true);
        setError(null);
        try {
            const config = {
                headers: { Authorization: `Bearer ${token}` },
            };
            const { data } = await axios.get<AdminUserView[]>(`${API_BASE_URL}/api/users/admin/all-users`, config);
            setUsers(data);
        } catch (err) {
            let errorMessage = 'Failed to load user list.';
            if (axios.isAxiosError(err) && err.response && err.response.status === 401) {
                errorMessage = 'Access Denied: Not authorized or session expired.';
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [isAdmin, token]); // Dependencies are clean

    // 2. Fetch Pending Withdrawal Requests
    const fetchWithdrawals = useCallback(async () => {
        if (!isAdmin || !token) { 
            setWithdrawalLoading(false);
            return;
        }
        setWithdrawalLoading(true);
        setWithdrawalError(null);
        try {
            const config = {
                headers: { Authorization: `Bearer ${token}` },
            };
            const { data } = await axios.get<WithdrawalRequest[]>(`${API_BASE_URL}/api/transactions/admin/withdrawals`, config);
            setWithdrawalRequests(data); 
        } catch (err) {
            let errorMessage = 'Failed to fetch withdrawal requests.';
            if (axios.isAxiosError(err) && err.response && err.response.data) {
                // Ensure we handle case where response.data is an object with a message property
                errorMessage = (err.response.data as any).message || errorMessage; 
            }
            setWithdrawalError(`Error fetching withdrawals: ${errorMessage}`);
        } finally {
            setWithdrawalLoading(false);
        }
    }, [isAdmin, token]); // Dependencies are clean


    // --- Initial Data Load Effect ---
    useEffect(() => {
        if (isAdmin) {
            fetchUsers();
            fetchWithdrawals(); 
        }
    }, [isAdmin, fetchUsers, fetchWithdrawals]); 

    // --- Pi Coin Distribution Handler ---
    const handleCreditSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setCreditMessage(null);
        if (creditData.amount <= 0 || !creditData.userId) {
            setCreditMessage('Please select a user and enter a valid amount.');
            return;
        }

        setCreditLoading(true);
        try {
            const config = {
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}` 
                },
            };
            
            const { data } = await axios.post<{ message: string, newBalance: number }>(
                `${API_BASE_URL}/api/users/admin/add-coins`, // <-- FIXED URL
                creditData,
                config
            );

            setCreditMessage(data.message);
            
            // CRUCIAL: CHECK IF ADMIN CREDITED THEMSELVES AND UPDATE GLOBAL STATE
            if (userInfo && creditData.userId === userInfo._id) {
                 dispatch({ 
                     type: 'UPDATE_PROFILE', 
                     payload: { piCoinsBalance: data.newBalance } 
                 });
            }
            
            await fetchUsers(); // Re-fetch user list to show updated balance
            
            setCreditData({ userId: '', amount: 0 });

        } catch (err) {
            let errorMessage = 'Coin distribution failed.';
            if (axios.isAxiosError(err) && err.response) {
                errorMessage = (err.response.data as any).message || 'Server Error.';
            }
            setCreditMessage(`Error: ${errorMessage}`);
        } finally {
            setCreditLoading(false);
        }
    };
    
    // --- Withdrawal Request Actions (API CALL HANDLERS) ---

    // Generic handler for Processing or Rejecting a withdrawal
    const updateWithdrawalStatus = async (id: string, status: 'Processed' | 'Failed') => {
        if (!isAdmin || !token) return;

        const actionText = status === 'Processed' ? 'Processing' : 'Rejecting';
        // <-- FIXED URL
        const endpoint = `${API_BASE_URL}/api/transactions/admin/withdrawals/${id}/${status.toLowerCase()}`;
        
        if (!window.confirm(`Are you sure you want to ${actionText.toLowerCase()} this withdrawal (ID: ${id})?`)) {
            return;
        }

        try {
            const config = {
                headers: { 
                    Authorization: `Bearer ${token}` 
                },
            };
            
            const { data } = await axios.put<{ message: string }>(endpoint, {}, config);

            // Notify and refresh list
            alert(`${actionText} successful: ${data.message}`);
            
            // Refresh the withdrawal list and user balances
            fetchWithdrawals(); 
            fetchUsers(); 

        } catch (err) {
            let errorMessage = `${actionText} failed.`;
            if (axios.isAxiosError(err) && err.response) {
                errorMessage = (err.response.data as any).message || 'Server Error.';
            }
            alert(`Error during ${actionText}: ${errorMessage}`);
        }
    };

    const handleProcessWithdrawal = (id: string) => updateWithdrawalStatus(id, 'Processed');
    const handleRejectWithdrawal = (id: string) => updateWithdrawalStatus(id, 'Failed');
    
    // ----------------------------------------------------

    if (!isAdmin) return null; // Should be redirected, but safe check
    if (loading) return <div className="text-xl text-red-500 mt-10">Loading Admin Dashboard...</div>;
    if (error) return <div className="text-xl text-red-500 mt-10">Error: {error}</div>;

    const cardClass = "bg-white/10 p-4 rounded-lg shadow-lg";

    return (
        <div className="w-full max-w-6xl p-4 space-y-10">
            <h2 className="text-4xl font-bold text-red-500 mb-8">Admin Control Panel</h2>
            
            {/* 1. Pi Coin Distribution Form */}
            <div className={`${cardClass} border border-red-500/50`}>
                <h3 className="text-2xl text-white font-semibold mb-4">Distribute Pi Coins (P$)</h3>
                <form onSubmit={handleCreditSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-1">Select User</label>
                        <select
                            className="w-full p-2 rounded-md bg-white/20 border border-red-500/40 text-white focus:outline-none"
                            value={creditData.userId}
                            onChange={(e) => setCreditData({ ...creditData, userId: e.target.value })}
                            required
                        >
                            <option value="" disabled>-- Select User --</option>
                            {users.map((user: AdminUserView) => (
                                <option key={user._id} value={user._id} className="text-gray-800">
                                    {user.name} ({user.email}) - {user.piCoinsBalance.toFixed(2)} P$
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Amount (P$)</label>
                        <input
                            type="number"
                            placeholder="Amount to Credit"
                            className="w-full p-2 rounded-md bg-white/20 border border-red-500/40 text-white focus:outline-none"
                            value={creditData.amount || ''}
                            onChange={(e) => setCreditData({ ...creditData, amount: Number(e.target.value) })}
                            min="1"
                            step="any" 
                            required
                        />
                    </div>
                    <button 
                        type="submit"
                        disabled={creditLoading}
                        className="py-2 px-4 rounded-md font-bold text-white bg-red-600 hover:bg-red-500 transition duration-300 disabled:opacity-50"
                    >
                        {creditLoading ? 'Crediting...' : 'Credit P$'}
                    </button>
                </form>
                {creditMessage && (
                    <div className={`mt-3 p-2 rounded text-sm ${creditMessage.includes('Error') ? 'bg-red-900/40 text-red-400' : 'bg-green-900/40 text-green-400'}`}>
                        {creditMessage}
                    </div>
                )}
            </div>

            {/* 2. Withdrawal Request Management (NEW SECTION) */}
            <div className={`${cardClass} border border-amber-400/50`}>
                <h3 className="text-2xl text-white font-semibold mb-4 flex justify-between items-center">
                    Pending Withdrawal Requests 
                    <span className="text-lg font-bold text-amber-400/80">{withdrawalLoading ? 'Loading...' : withdrawalRequests.length}</span>
                </h3>
                
                {withdrawalError ? (
                     <p className="text-red-400 p-4 bg-red-900/20 rounded-md">
                         {withdrawalError}
                     </p>
                ) : withdrawalRequests.length === 0 ? (
                    <p className="text-gray-400 p-4 bg-white/5 rounded-md text-center">No pending withdrawal requests found.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-700">
                            <thead className="bg-white/10">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">User</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">P$ Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Payout Details</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {withdrawalRequests.map((req) => (
                                    <tr key={req._id} className="hover:bg-white/5 transition duration-150">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-white">{req.userName}</div>
                                            <div className="text-xs text-gray-400">{req.userEmail}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-pi-green-alt font-bold">
                                            {req.amount.toFixed(2)} P$
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-300 max-w-xs">
                                            <span className="font-semibold text-amber-300">{req.payoutMethod.replace('_', ' ')}:</span> {req.details}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400">
                                            {new Date(req.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                            <button
                                                onClick={() => handleProcessWithdrawal(req._id)}
                                                className="text-green-500 hover:text-green-300 font-bold"
                                            >
                                                Process
                                            </button>
                                            <button
                                                onClick={() => handleRejectWithdrawal(req._id)}
                                                className="text-red-500 hover:text-red-300 font-bold"
                                            >
                                                Reject
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* 3. User List Table */}
            <h3 className="text-2xl text-white font-semibold mb-4">All Users ({users.length})</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-white/10">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Name/Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">P$ Balance</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Referrals</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Role</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {users.map((user: AdminUserView) => (
                            <tr key={user._id} className="hover:bg-white/5 transition duration-150">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-white">{user.name}</div>
                                    <div className="text-sm text-gray-400">{user.email}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-pi-green-alt font-bold">
                                    {user.piCoinsBalance.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                    {user.referrals.length}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isAdmin ? 'bg-red-800/50 text-red-400' : 'bg-gray-700/50 text-gray-300'}`}>
                                        {user.isAdmin ? 'Admin' : 'User'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminDashboard;