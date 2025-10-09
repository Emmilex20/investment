/* eslint-disable @typescript-eslint/no-explicit-any */
// client/src/pages/AdminPackages.tsx (NEW COMPONENT FOR ADMIN PACKAGE MANAGEMENT)

import React, { useEffect, useState, type FormEvent, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import type { InvestmentPackage } from '../types/userTypes'; // Re-use the existing type

// --- CONFIGURATION ---
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
// --- END CONFIGURATION ---

const initialPackageState: InvestmentPackage = {
    _id: '',
    name: '',
    costUSD: 0,
    rewardPiCoins: 0,
    durationDays: 30,
    dailyReturnRate: 0.02, // Defaulting to 2% (60% over 30 days)
    requiredReferrals: 0,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};

const AdminPackages: React.FC = () => {
    const { userInfo } = useAuth();
    const navigate = useNavigate();

    const [packages, setPackages] = useState<InvestmentPackage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    
    // State for the package being edited or created
    const [currentPackage, setCurrentPackage] = useState<InvestmentPackage>(initialPackageState);
    const [isEditing, setIsEditing] = useState(false);

    const token = userInfo?.token;
    const isAdmin = userInfo?.isAdmin;
    
    // Redirect if not logged in or not an admin
    useEffect(() => {
        if (!userInfo || !userInfo.isAdmin) {
            // Use a specific admin route if you have one, otherwise fall back
            navigate('/dashboard'); 
        }
    }, [userInfo, navigate]);

    // --- API Fetch Function ---
    const fetchPackages = useCallback(async () => {
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
            // Use the new admin endpoint to get all packages (active/inactive)
            const { data } = await axios.get<InvestmentPackage[]>(`${API_BASE_URL}/api/investments/admin/packages`, config);
            setPackages(data);
        } catch (err) {
            let errorMessage = 'Failed to load packages.';
            if (axios.isAxiosError(err) && err.response && err.response.data) {
                 errorMessage = (err.response.data as any).message || errorMessage;
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [isAdmin, token]);

    useEffect(() => {
        if (isAdmin) {
            fetchPackages();
        }
    }, [isAdmin, fetchPackages]);

    // --- Form Handlers ---

    const handleCreateEdit = (pkg: InvestmentPackage | null) => {
        setMessage(null);
        setFormError(null);
        if (pkg) {
            // Edit existing package
            setCurrentPackage(pkg);
            setIsEditing(true);
        } else {
            // Create new package
            setCurrentPackage(initialPackageState);
            setIsEditing(false);
        }
    };
    
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setFormError(null);
        setMessage(null);
        setIsSaving(true);

        const url = isEditing 
            ? `${API_BASE_URL}/api/investments/admin/packages/${currentPackage._id}`
            : `${API_BASE_URL}/api/investments/admin/packages`;
        
        const method = isEditing ? 'put' : 'post';
        
        try {
            const config = {
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}` 
                },
            };

            const dataToSend = {
                ...currentPackage,
                // Ensure numbers are sent as numbers
                costUSD: Number(currentPackage.costUSD),
                rewardPiCoins: Number(currentPackage.rewardPiCoins),
                durationDays: Number(currentPackage.durationDays),
                dailyReturnRate: Number(currentPackage.dailyReturnRate),
                requiredReferrals: Number(currentPackage.requiredReferrals),
            };

            const { data } = await axios[method](url, dataToSend, config);

            setMessage(`Package ${isEditing ? 'updated' : 'created'} successfully: ${data.name}`);
            
            // Reset form and re-fetch list
            setCurrentPackage(initialPackageState);
            setIsEditing(false);
            fetchPackages(); 

        } catch (err) {
            let errorMessage = `Failed to ${isEditing ? 'update' : 'create'} package.`;
            if (axios.isAxiosError(err) && err.response) {
                errorMessage = (err.response.data as any).message || 'Server Error.';
            }
            setFormError(`Error: ${errorMessage}`);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isAdmin) return null;
    if (loading) return <div className="text-xl text-red-500 mt-10">Loading Package Manager...</div>;
    if (error) return <div className="text-xl text-red-500 mt-10">Error: {error}</div>;

    const inputClass = "w-full p-2 rounded-md bg-white/20 border border-gray-600 text-white focus:outline-none focus:border-red-500";
    const labelClass = "block text-sm font-medium text-gray-300 mb-1";
    const cardClass = "bg-white/10 p-4 rounded-lg shadow-lg border border-red-500/50";


    return (
        <div className="w-full max-w-6xl p-4 space-y-10">
            <h2 className="text-4xl font-bold text-red-500 mb-8 border-b border-red-500/50 pb-2">Investment Package Manager</h2>
            
            {/* Action Messages */}
            {(formError || message) && (
                <div className={`p-3 rounded ${formError ? 'bg-red-900/40 text-red-400' : 'bg-green-900/40 text-green-400'}`}>
                    {formError || message}
                </div>
            )}

            {/* Package Creation/Edit Form */}
            <div className={cardClass}>
                <h3 className="text-2xl text-white font-semibold mb-4">{isEditing ? `Editing: ${currentPackage.name}` : 'Create New Package'}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Name */}
                        <div>
                            <label className={labelClass}>Package Name</label>
                            <input
                                type="text"
                                className={inputClass}
                                value={currentPackage.name}
                                onChange={(e) => setCurrentPackage({ ...currentPackage, name: e.target.value })}
                                required
                            />
                        </div>
                        {/* Invested Pi Coins */}
                        <div>
                            <label className={labelClass}>Invest Amount (P$)</label>
                            <input
                                type="number"
                                className={inputClass}
                                value={currentPackage.rewardPiCoins}
                                onChange={(e) => setCurrentPackage({ ...currentPackage, rewardPiCoins: Number(e.target.value) })}
                                min="1"
                                step="any"
                                required
                            />
                        </div>
                        {/* Duration Days */}
                        <div>
                            <label className={labelClass}>Duration (Days)</label>
                            <input
                                type="number"
                                className={inputClass}
                                value={currentPackage.durationDays}
                                onChange={(e) => setCurrentPackage({ ...currentPackage, durationDays: Number(e.target.value) })}
                                min="1"
                                required
                            />
                        </div>
                        {/* Daily Return Rate */}
                        <div>
                            <label className={labelClass}>Daily Return Rate (e.g., 0.02 for 2%)</label>
                            <input
                                type="number"
                                className={inputClass}
                                value={currentPackage.dailyReturnRate}
                                onChange={(e) => setCurrentPackage({ ...currentPackage, dailyReturnRate: Number(e.target.value) })}
                                min="0"
                                max="1"
                                step="0.001"
                                required
                            />
                        </div>
                        {/* Required Referrals */}
                        <div>
                            <label className={labelClass}>Required Referrals (for withdrawal)</label>
                            <input
                                type="number"
                                className={inputClass}
                                value={currentPackage.requiredReferrals}
                                onChange={(e) => setCurrentPackage({ ...currentPackage, requiredReferrals: Number(e.target.value) })}
                                min="0"
                                required
                            />
                        </div>
                        {/* Cost USD (Label for display on frontend) */}
                        <div>
                            <label className={labelClass}>Cost (USD Label) - for display</label>
                            <input
                                type="number"
                                className={inputClass}
                                value={currentPackage.costUSD}
                                onChange={(e) => setCurrentPackage({ ...currentPackage, costUSD: Number(e.target.value) })}
                                min="0"
                            />
                        </div>
                    </div>
                    
                    {/* Active Toggle */}
                    <div className="flex items-center space-x-3 pt-2">
                        <input
                            id="isActive"
                            type="checkbox"
                            className="h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                            checked={currentPackage.isActive}
                            onChange={(e) => setCurrentPackage({ ...currentPackage, isActive: e.target.checked })}
                        />
                        <label htmlFor="isActive" className="text-sm font-medium text-gray-300">Package is Active</label>
                    </div>

                    <div className="flex space-x-4 pt-4">
                        <button 
                            type="submit"
                            disabled={isSaving}
                            className="py-2 px-4 rounded-md font-bold text-white bg-red-600 hover:bg-red-500 transition duration-300 disabled:opacity-50"
                        >
                            {isSaving ? 'Saving...' : isEditing ? 'Update Package' : 'Create Package'}
                        </button>
                        <button 
                            type="button"
                            onClick={() => handleCreateEdit(null)}
                            className="py-2 px-4 rounded-md font-bold text-gray-300 bg-gray-700 hover:bg-gray-600 transition duration-300"
                        >
                            {isEditing ? 'Cancel Edit' : 'Reset Form'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Existing Packages Table */}
            <h3 className="text-2xl text-white font-semibold mb-4">All Packages ({packages.length})</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-white/10">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Name (USD Label)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Invest (P$)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">ROI / Day</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Duration</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Referrals</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {packages.map((pkg) => (
                            <tr key={pkg._id} className="hover:bg-white/5 transition duration-150">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-white">{pkg.name}</div>
                                    {/* UPDATED: Display USD Cost in the requested format */}
                                    <div className="text-xs text-gray-400 font-bold">
                                        ${pkg.costUSD.toFixed(0)} (π)
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-pi-green-alt font-bold">
                                    {pkg.rewardPiCoins.toFixed(2)} P$
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                    {(pkg.dailyReturnRate * 100).toFixed(2)}%
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                    {pkg.durationDays} days
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-400 font-bold">
                                    {pkg.requiredReferrals}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${pkg.isActive ? 'bg-green-800/50 text-green-400' : 'bg-red-800/50 text-red-400'}`}>
                                        {pkg.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        onClick={() => handleCreateEdit(pkg)}
                                        className="text-red-500 hover:text-red-300 font-bold"
                                    >
                                        Edit
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminPackages;