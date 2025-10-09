/* eslint-disable @typescript-eslint/no-explicit-any */
// client/src/pages/Login.tsx (ULTIMATE PROFESSIONAL DESIGN)

import React, { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import type { User } from "../types/userTypes";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API_URL = `${API_BASE_URL}/api/users/login`;

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, userInfo } = useAuth();

  if (userInfo) {
    navigate("/dashboard");
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      const { data } = await axios.post<User>(
        API_URL,
        { email, password },
        { headers: { "Content-Type": "application/json" } }
      );
      login(data);
      setMessage("✅ Login successful! Redirecting...");
      setTimeout(() => navigate("/dashboard"), 800);
    } catch (error) {
      let errorMessage = "❌ Invalid credentials or network issue.";
      if (axios.isAxiosError(error) && error.response) {
        errorMessage =
          (error.response.data as any).message ||
          (error.response.data as any).error ||
          errorMessage;
      }
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#0F051D] overflow-hidden">
      {/* ===== BACKGROUND EFFECTS ===== */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-indigo-900 to-black opacity-80"></div>

      {/* Glowing Orbs */}
      <div className="absolute -top-40 -left-40 w-[450px] h-[450px] bg-purple-600/30 rounded-full blur-[180px] animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[180px] animate-pulse delay-1000"></div>

      {/* ===== GLASS CARD ===== */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-[90%] max-w-md backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl text-center"
      >
        {/* Header */}
        <h1 className="text-4xl font-extrabold text-white mb-3 tracking-wide">
          Welcome Back
        </h1>
        <p className="text-gray-400 mb-8 text-sm sm:text-base">
          Access your <span className="text-purple-300 font-semibold">Pi Investment</span> account
        </p>

        {/* Feedback Message */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-3 mb-6 rounded-md text-sm ${
              message.includes("✅")
                ? "bg-green-900/40 text-green-300"
                : "bg-red-900/40 text-red-300"
            }`}
          >
            {message}
          </motion.div>
        )}

        {/* ===== FORM ===== */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="text-left">
            <label
              htmlFor="email"
              className="block text-xs font-semibold uppercase tracking-wide text-purple-200 mb-2"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              placeholder="Enter your email"
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-lg bg-white/10 border border-purple-500/30 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/30 transition duration-300"
              required
            />
          </div>

          <div className="text-left">
            <label
              htmlFor="password"
              className="block text-xs font-semibold uppercase tracking-wide text-purple-200 mb-2"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              placeholder="Enter your password"
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-lg bg-white/10 border border-purple-500/30 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/30 transition duration-300"
              required
            />
          </div>

          {/* Button */}
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.05 }}
            whileTap={{ scale: 0.97 }}
            className="w-full mt-4 py-3 font-bold text-lg rounded-lg text-white bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-700 hover:from-purple-600 hover:via-indigo-600 hover:to-purple-800 shadow-xl shadow-purple-800/40 transition duration-300 disabled:opacity-60"
          >
            {loading ? "Logging In..." : "Sign In"}
          </motion.button>
        </form>

        {/* ===== Footer Links ===== */}
        <div className="mt-6 text-sm text-gray-400">
          New user?{" "}
          <Link
            to="/register"
            className="text-purple-400 hover:text-purple-300 font-semibold transition underline-offset-2 hover:underline"
          >
            Create an account
          </Link>
        </div>

        <div className="mt-4 text-xs text-gray-500">
          <Link
            to="/forgot-password"
            className="hover:text-purple-300 transition"
          >
            Forgot Password?
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
