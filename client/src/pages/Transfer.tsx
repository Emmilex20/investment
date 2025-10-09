/* eslint-disable @typescript-eslint/no-explicit-any */
// client/src/pages/Transfer.tsx (FINAL PRODUCTION READY - STYLED + ANIMATED)

import React, { useState, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { ArrowLeftCircle, SendHorizonal } from "lucide-react";

// --- CONFIGURATION ---
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
// --- END CONFIGURATION ---

const Transfer: React.FC = () => {
  const { userInfo, dispatch } = useAuth();
  const navigate = useNavigate();

  const [recipientEmail, setRecipientEmail] = useState<string>("");
  const [amount, setAmount] = useState<number>(0);
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  if (!userInfo) {
    navigate("/login");
    return null;
  }

  const submitHandler = async (e: FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (amount <= 0 || !recipientEmail) {
      setMessage("Please enter a valid email and amount greater than zero.");
      return;
    }

    if (amount > userInfo.piCoinsBalance) {
      setMessage("Insufficient balance for this transfer.");
      return;
    }

    setLoading(true);

    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      const { data } = await axios.post(
        `${API_BASE_URL}/api/users/transfer`,
        { recipientEmail, amount },
        config
      );

      setMessage(`✅ ${data.message}`);
      dispatch({
        type: "UPDATE_PROFILE",
        payload: { piCoinsBalance: data.newBalance },
      });

      setAmount(0);
      setRecipientEmail("");
    } catch (error) {
      let errorMessage = "An unexpected error occurred.";
      if (axios.isAxiosError(error) && error.response) {
        errorMessage =
          (error.response.data as any).message || "Transfer failed.";
      }
      setMessage(`❌ ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full p-3 rounded-md bg-white/20 border border-pi-accent/40 text-white placeholder-gray-400 focus:outline-none focus:border-pi-accent/80 transition duration-150";
  const buttonClass =
    "w-full py-3 rounded-md font-bold text-white bg-gradient-to-r from-pi-accent to-pi-green-alt hover:from-pi-green-alt hover:to-pi-accent transition-all duration-500 shadow-lg shadow-pi-accent/20 hover:shadow-pi-green-alt/30 disabled:opacity-50";

  return (
    <motion.div
      className="w-full flex justify-center items-center px-4 py-10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <motion.div
        className="w-full max-w-lg p-6 bg-gradient-to-b from-[#1a103d]/90 to-[#12092c]/90 rounded-2xl border border-pi-accent/50 shadow-[0_0_30px_-5px_rgba(124,58,237,0.4)] backdrop-blur-md"
        whileHover={{ scale: 1.01 }}
      >
        <h2 className="text-3xl font-extrabold text-center text-pi-accent mb-6">
          Transfer Pi Coins 🚀
        </h2>

        {/* Current Balance */}
        <motion.div
          className="mb-6 text-center bg-white/5 py-3 rounded-lg border border-white/10"
          whileHover={{ scale: 1.02 }}
        >
          <p className="text-gray-300">
            Current Balance:{" "}
            <span className="text-pi-green-alt font-bold">
              {userInfo.piCoinsBalance.toFixed(2)} P$
            </span>
          </p>
        </motion.div>

        {message && (
          <motion.div
            className={`p-3 mb-4 rounded-lg text-center text-sm ${
              message.includes("✅")
                ? "bg-green-900/40 text-pi-green-alt"
                : "bg-red-900/40 text-red-400"
            }`}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {message}
          </motion.div>
        )}

        <form onSubmit={submitHandler} className="space-y-5">
          {/* Recipient Email */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Recipient Email
            </label>
            <input
              type="email"
              placeholder="Enter recipient's email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              className={inputClass}
              required
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Amount (P$)
            </label>
            <input
              type="number"
              placeholder="e.g., 1000"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              min="1"
              step="1"
              className={inputClass}
              required
            />
          </div>

          {/* Transfer Summary */}
          <motion.div
            className="p-3 bg-white/10 rounded-md border border-white/20 text-gray-300"
            whileHover={{ scale: 1.02 }}
          >
            You’re sending{" "}
            <span className="text-pi-accent font-bold">{amount} P$</span> to{" "}
            <span className="text-yellow-300 font-semibold">
              {recipientEmail || "—"}
            </span>
          </motion.div>

          {/* Buttons */}
          <motion.button
            type="submit"
            disabled={loading}
            className={buttonClass}
            whileTap={{ scale: 0.97 }}
          >
            {loading ? "Processing..." : "Send Transfer"}
            {!loading && <SendHorizonal className="inline-block ml-2 w-5 h-5" />}
          </motion.button>

          {/* Back to Dashboard */}
          <motion.button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="w-full mt-3 py-3 rounded-md font-bold text-gray-400 bg-white/5 hover:bg-white/10 hover:text-white transition-all duration-300 flex items-center justify-center gap-2"
            whileTap={{ scale: 0.97 }}
          >
            <ArrowLeftCircle className="w-5 h-5" /> Back to Dashboard
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default Transfer;
