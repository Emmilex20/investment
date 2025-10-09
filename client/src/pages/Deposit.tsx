/* eslint-disable @typescript-eslint/no-explicit-any */
// client/src/pages/Deposit.tsx (FINAL PRODUCTION READY - STYLED + ANIMATED + BACK BUTTON)

import React, { useState, type FormEvent, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { UploadCloud, ArrowRightCircle, ArrowLeftCircle } from "lucide-react";

// --- CONFIGURATION ---
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
// --- END CONFIGURATION ---

interface UsdtDetails {
  address: string;
  network: string;
  note: string;
}

interface NairaDetails {
  bank: string;
  accountName: string;
  accountNumber: string;
  note: string;
}

const depositDetails: { usdt: UsdtDetails; naira: NairaDetails } = {
  usdt: {
    address: "TDt9...KjQp",
    network: "TRC-20 (Tron)",
    note: "Send USDT (TRC-20) to the address above. Deposits are reviewed manually.",
  },
  naira: {
    bank: "Access Bank",
    accountName: "PI INVESTMENT LIMITED",
    accountNumber: "0001234567",
    note: "Transfer the exact amount and upload your payment receipt below for confirmation.",
  },
};

const Deposit: React.FC = () => {
  const { userInfo } = useAuth();
  const navigate = useNavigate();

  const [amount, setAmount] = useState<number>(10);
  const [method, setMethod] = useState<"usdt" | "naira">("usdt");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!userInfo) {
      navigate("/login");
    }
  }, [userInfo, navigate]);

  if (!userInfo) return null;

  // --- UPDATED RATES ---
  const USD_TO_PI_RATE = 100;
  const NGN_TO_USD_RATE = 1 / 1400;
  // --- END UPDATED RATES ---

  const amountUSD = method === "naira" ? amount * NGN_TO_USD_RATE : amount;
  const piCoinsToCredit = amountUSD * USD_TO_PI_RATE;

  const submitHandler = async (e: FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (amountUSD < 10) {
      setMessage("Minimum deposit equivalent is $10 USD.");
      return;
    }

    if (!receiptFile) {
      setMessage("Please upload a screenshot of your payment receipt.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("amount", String(amount));
    formData.append("method", method);
    formData.append("receipt", receiptFile);

    try {
      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      const { data } = await axios.post(`${API_BASE_URL}/api/deposits`, formData, config);
      setMessage(`✅ ${data.message}`);
      setAmount(method === "naira" ? 14000 : 10);
      setReceiptFile(null);

      setTimeout(() => navigate("/dashboard"), 2500);
    } catch (error) {
      let errorMessage = "Deposit failed.";
      if (axios.isAxiosError(error) && error.response) {
        errorMessage = (error.response.data as any).message || errorMessage;
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

  const currentDetails = depositDetails[method];
  const isNairaDetails = (details: UsdtDetails | NairaDetails): details is NairaDetails =>
    (details as NairaDetails).bank !== undefined;

  const minNairaDeposit = Math.ceil(10 / NGN_TO_USD_RATE);

  return (
    <motion.div
      className="w-full flex justify-center items-center px-4 py-10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <motion.div
        className="w-full max-w-xl p-6 bg-gradient-to-b from-[#1a103d]/90 to-[#12092c]/90 rounded-2xl border border-pi-accent/50 shadow-[0_0_30px_-5px_rgba(124,58,237,0.4)] backdrop-blur-md"
        whileHover={{ scale: 1.01 }}
      >
        <h2 className="text-3xl font-extrabold text-center text-pi-accent mb-6">
          Deposit Funds 💰
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
          <p className="text-xs text-gray-500 mt-1">
            $1 = {USD_TO_PI_RATE} P$ | ₦
            {Math.round(1 / NGN_TO_USD_RATE).toLocaleString()} ≈ $1
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
          {/* Method Selection */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">Payment Method</label>
            <div className="flex gap-4">
              {(["usdt", "naira"] as const).map((opt) => (
                <motion.button
                  key={opt}
                  type="button"
                  onClick={() => {
                    setMethod(opt);
                    setAmount(opt === "naira" ? 14000 : 10);
                    setReceiptFile(null);
                  }}
                  className={`flex-1 py-3 rounded-md font-semibold transition duration-200 ${
                    method === opt
                      ? "bg-pi-accent text-white shadow-lg shadow-pi-accent/30"
                      : "bg-white/10 text-gray-400 hover:bg-white/20"
                  }`}
                  whileTap={{ scale: 0.97 }}
                >
                  {opt === "usdt" ? "Crypto (USDT)" : "Local (Naira)"}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Deposit Details */}
          <motion.div
            className="p-4 bg-[#2b115c]/40 rounded-lg border border-pi-accent/30"
            whileHover={{ scale: 1.01 }}
          >
            <h4 className="text-lg font-semibold text-pi-accent mb-2">
              {method === "naira" ? "Bank Transfer Details" : "USDT Wallet Address"}
            </h4>
            {isNairaDetails(currentDetails) ? (
              <>
                <p className="text-gray-300">
                  Bank: <span className="font-bold">{currentDetails.bank}</span>
                </p>
                <p className="text-gray-300">
                  Account Name: <span className="font-bold">{currentDetails.accountName}</span>
                </p>
                <p className="text-gray-300">
                  Account Number:{" "}
                  <span className="font-bold text-yellow-300">{currentDetails.accountNumber}</span>
                </p>
              </>
            ) : (
              <>
                <p className="text-gray-300 break-all">
                  Address:{" "}
                  <span className="font-bold text-yellow-300">{currentDetails.address}</span>
                </p>
                <p className="text-gray-300">
                  Network: <span className="font-bold">{currentDetails.network}</span>
                </p>
              </>
            )}
            <p className="text-xs text-gray-400 mt-2">{currentDetails.note}</p>
          </motion.div>

          {/* Amount */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Amount ({method === "naira" ? "₦" : "$"})
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              min={method === "naira" ? minNairaDeposit : 10}
              step={method === "naira" ? 1000 : 5}
              className={inputClass}
              required
            />
          </div>

          {/* Upload */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">Upload Payment Receipt</label>
            <div className="relative">
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                className={`${inputClass} cursor-pointer`}
                required
              />
              <UploadCloud className="absolute right-4 top-3 text-gray-400" />
            </div>
          </div>

          {/* Summary */}
          <motion.div
            className="p-3 bg-white/10 rounded-md border border-white/20"
            whileHover={{ scale: 1.02 }}
          >
            <p className="text-gray-300">
              USD Equivalent: <span className="font-bold">${amountUSD.toFixed(2)}</span>
            </p>
            <p className="text-gray-300 mt-1">
              P$ to be Credited:{" "}
              <span className="font-bold text-pi-accent">{piCoinsToCredit.toFixed(2)} P$</span>
            </p>
          </motion.div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={loading || !receiptFile}
            className={buttonClass}
            whileTap={{ scale: 0.97 }}
          >
            {loading ? "Processing..." : "Submit Deposit Request"}
            {!loading && <ArrowRightCircle className="inline-block ml-2 w-5 h-5" />}
          </motion.button>

          {/* BACK TO DASHBOARD BUTTON */}
          <motion.button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="w-full py-3 mt-3 rounded-md font-semibold text-white bg-gradient-to-r from-blue-500/80 to-indigo-600/80 hover:from-indigo-600 hover:to-blue-500 transition-all duration-500 shadow-lg hover:shadow-indigo-500/30 flex justify-center items-center gap-2"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeftCircle className="w-5 h-5" />
            Back to Dashboard
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default Deposit;
