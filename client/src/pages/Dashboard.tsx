/* eslint-disable @typescript-eslint/no-explicit-any */
// client/src/pages/Dashboard.tsx (ULTRA STYLED VERSION)

import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import type { User } from "../types/userTypes";
import { RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API_URL = `${API_BASE_URL}/api/users/profile`;

const Dashboard: React.FC = () => {
  const { userInfo, dispatch, logout } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchProfile = useCallback(
    async (manualRefresh: boolean = false) => {
      const token = userInfo?.token;
      if (!token) return;

      if (manualRefresh) setIsRefreshing(true);
      else setLoading(true);

      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const { data } = await axios.get<User>(API_URL, config);

        setProfile(data);
        dispatch({
          type: "UPDATE_PROFILE",
          payload: {
            piCoinsBalance: data.piCoinsBalance,
            referrals: data.referrals,
            referredBy: data.referredBy,
          },
        });
      } catch (err) {
        let errorMessage = "Failed to load profile data.";
        if (axios.isAxiosError(err) && err.response) {
          errorMessage =
            (err.response.data as any).message || "Authentication required.";
        }
        setError(errorMessage);
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
    },
    [userInfo, dispatch, logout]
  );

  useEffect(() => {
    if (userInfo && !profile) fetchProfile();
  }, [userInfo, fetchProfile, profile]);

  if (loading || (!profile && userInfo)) {
    return (
      <div className="flex h-screen items-center justify-center text-xl text-purple-400">
        Loading Dashboard...
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="flex h-screen items-center justify-center text-xl text-red-500">
        Error: {error}
      </div>
    );
  }

  if (!profile) {
    if (!userInfo) navigate("/");
    return (
      <div className="flex h-screen items-center justify-center text-xl text-red-500">
        Please log in to view the dashboard.
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#0F051D] via-[#150035] to-[#0A001A] p-6 sm:p-10 text-white">
      {/* BACKGROUND DECOR */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[400px] h-[400px] bg-purple-700/30 rounded-full blur-[180px] animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[200px] animate-pulse delay-1000"></div>
      </div>

      {/* HEADER SECTION */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 mb-10 text-center"
      >
        <h2 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-purple-300 via-pink-400 to-indigo-300 bg-clip-text text-transparent">
          Welcome, {profile.name} 👋
        </h2>
        <p className="text-gray-400 mt-2">
          Your personalized Pi Investment dashboard.
        </p>
      </motion.div>

      {/* DASHBOARD GRID */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
      >
        {/* BALANCE CARD */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="col-span-1 md:col-span-2 bg-white/10 backdrop-blur-lg border border-white/10 rounded-2xl p-6 shadow-xl transition-all"
        >
          <h3 className="text-sm uppercase text-gray-400 mb-2">
            Pi Coin Balance (P$)
          </h3>
          <p className="text-4xl font-bold text-purple-300">
            {profile.piCoinsBalance.toFixed(2)} P$
          </p>
          <p className="text-sm text-green-400 mt-1">
            Use P$ to purchase investment packages.
          </p>

          <button
            onClick={() => fetchProfile(true)}
            disabled={isRefreshing}
            className="mt-5 flex items-center justify-center space-x-2 py-2 px-4 rounded-full text-sm font-semibold bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 transition-all duration-300 shadow-lg"
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
        </motion.div>

        {/* REFERRAL CODE CARD */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-purple-700/30 via-purple-800/20 to-indigo-900/20 backdrop-blur-md border border-purple-500/30 rounded-2xl p-6 shadow-xl"
        >
          <h3 className="text-sm uppercase text-gray-400 mb-2">
            Your Referral Code
          </h3>
          <p className="text-xl font-mono tracking-wider text-purple-300">
            {profile.referralCode}
          </p>
          <button
            onClick={() => {
              navigator.clipboard.writeText(profile.referralCode);
              alert("Referral code copied!");
            }}
            className="mt-2 text-xs text-purple-300 hover:text-purple-200 transition"
          >
            (Click to Copy)
          </button>
        </motion.div>
      </motion.div>

      {/* REFERRAL STATUS SECTION */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        className="relative z-10 bg-white/10 backdrop-blur-lg border border-white/10 rounded-2xl p-6 mb-10 shadow-xl"
      >
        <h3 className="text-2xl font-semibold text-purple-300 mb-4">
          Referral Status
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-400 text-sm mb-1">Total Active Referrals</p>
            <p className="text-3xl font-bold text-green-400">
              {profile.referrals.length}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-1">Referred By</p>
            <p className="text-lg font-medium text-purple-200">
              {profile.referredBy ? (
                <span className="font-bold text-green-400">
                  {profile.referredBy.name}
                </span>
              ) : (
                "None"
              )}
            </p>
          </div>
        </div>
      </motion.div>

      {/* ACTION BUTTONS */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2 }}
        className="relative z-10 grid grid-cols-2 md:grid-cols-5 gap-4"
      >
        {[
          { label: "Deposit (Get P$)", color: "from-green-400 to-emerald-500", to: "/deposit" },
          { label: "Transfer P$", color: "from-blue-500 to-indigo-600", to: "/transfer" },
          { label: "Withdraw", color: "from-amber-400 to-yellow-500", to: "/withdraw" },
          { label: "Invest", color: "from-purple-500 to-pink-500", to: "/invest" },
        ].map((btn, i) => (
          <motion.button
            key={i}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(btn.to)}
            className={`py-3 px-4 rounded-lg font-bold text-white bg-gradient-to-r ${btn.color} hover:opacity-90 transition duration-300 shadow-lg`}
          >
            {btn.label}
          </motion.button>
        ))}

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          onClick={logout}
          className="col-span-2 md:col-span-1 py-3 px-4 rounded-lg font-bold text-gray-300 border border-gray-600 hover:border-red-500 hover:text-red-500 transition duration-300"
        >
          Logout
        </motion.button>
      </motion.div>
    </div>
  );
};

export default Dashboard;
