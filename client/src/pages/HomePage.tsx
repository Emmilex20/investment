// client/src/pages/HomePage.tsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion, useMotionValue, animate } from "framer-motion";
import {
  FaLock,
  FaUsers,
  FaWallet,
  FaRocket,
  FaChartLine,
  FaCoins,
} from "react-icons/fa";

// ===== Reusable Components =====

const FeatureCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
}> = ({ icon, title, description }) => (
  <motion.div
    whileHover={{ scale: 1.05, y: -5 }}
    transition={{ type: "spring", stiffness: 300, damping: 20 }}
    className="bg-gradient-to-br from-[#2B115C]/70 to-[#1E053A]/70 backdrop-blur-xl p-6 rounded-2xl border border-purple-400/20 shadow-[0_0_20px_rgba(168,85,247,0.2)] hover:shadow-[0_0_35px_rgba(168,85,247,0.4)] transition duration-500"
  >
    <div className="text-purple-400 text-5xl mb-4">{icon}</div>
    <h3 className="text-2xl font-bold text-white mb-2 tracking-wide">{title}</h3>
    <p className="text-gray-300 text-sm sm:text-base leading-relaxed">{description}</p>
  </motion.div>
);

const AnimatedCounter: React.FC<{
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}> = ({ value, prefix = "", suffix = "", decimals = 0 }) => {
  const count = useMotionValue(0);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const controls = animate(count, value, {
      duration: 1.5,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(v),
    });
    return controls.stop;
  }, [value, count]);

  return (
    <motion.span className="text-3xl sm:text-5xl font-extrabold text-purple-300 drop-shadow-[0_0_10px_rgba(168,85,247,0.6)]">
      {prefix}
      {display.toFixed(decimals)}
      {suffix}
    </motion.span>
  );
};

// ===== Main Component =====

const HomePage: React.FC = () => {
  const { userInfo } = useAuth();

  const [stats, setStats] = useState({
    piPrice: 314.15,
    investors: 24820,
    totalLocked: 1.28,
    dailyROI: 4.29,
    withdrawals: 12130,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setStats((prev) => ({
        piPrice: prev.piPrice + (Math.random() * 2 - 1),
        investors: prev.investors + Math.floor(Math.random() * 10),
        totalLocked: prev.totalLocked + (Math.random() * 0.01 - 0.005),
        dailyROI: prev.dailyROI + (Math.random() * 0.05 - 0.02),
        withdrawals: prev.withdrawals + Math.floor(Math.random() * 5),
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#140233] via-[#22044F] to-[#09021B] text-white overflow-hidden">
      {/* ===== HERO SECTION ===== */}
      <section className="relative flex flex-col items-center justify-center text-center pt-24 pb-32 px-6 overflow-hidden">
        {/* Glow + Gradient layers */}
        <div className="absolute inset-0">
          <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-purple-600/25 blur-[250px] rounded-full"></div>
          <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-fuchsia-500/20 blur-[200px] rounded-full"></div>
        </div>

        {/* Floating Coins */}
        <motion.div
          className="absolute top-16 left-10 text-purple-400 opacity-40 text-6xl"
          animate={{ y: [0, 15, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        >
          <FaCoins />
        </motion.div>
        <motion.div
          className="absolute bottom-20 right-12 text-purple-400 opacity-30 text-7xl"
          animate={{ y: [0, -20, 0] }}
          transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
        >
          <FaCoins />
        </motion.div>

        {/* Text */}
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-5xl sm:text-7xl font-extrabold mb-6 leading-tight tracking-tight z-10"
        >
          Multiply Your{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.7)]">
            Pi Coins
          </span>
          {" "}with Confidence
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2 }}
          className="text-lg sm:text-xl text-gray-200 mb-10 max-w-3xl leading-relaxed z-10"
        >
          Experience next-level crypto investing with real-time analytics, automated growth, 
          and transparent daily rewards. Welcome to the future of DeFi.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.3 }}
          className="z-10"
        >
          {userInfo ? (
            <Link
              to="/dashboard"
              className="inline-block px-10 py-4 text-lg font-semibold rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-700 hover:from-purple-600 hover:to-fuchsia-800 transition-all duration-300 shadow-[0_0_30px_rgba(168,85,247,0.4)] hover:shadow-[0_0_40px_rgba(168,85,247,0.7)] transform hover:scale-105"
            >
              Start Investing
            </Link>
          ) : (
            <Link
              to="/register"
              className="inline-block px-10 py-4 text-lg font-semibold rounded-full bg-gradient-to-r from-purple-400 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-700 transition-all duration-300 shadow-[0_0_30px_rgba(168,85,247,0.4)] hover:shadow-[0_0_40px_rgba(168,85,247,0.7)] transform hover:scale-105"
            >
              Get Started Today
            </Link>
          )}
        </motion.div>
      </section>

      {/* ===== LIVE MARKET OVERVIEW ===== */}
<section className="py-20 bg-gradient-to-b from-[#1B033B] via-[#25084E] to-[#1B033B] relative border-t border-purple-400/10 overflow-hidden">
  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(128,0,255,0.12),transparent_75%)] pointer-events-none"></div>

  <div className="relative max-w-7xl mx-auto px-6 text-center">
    <h2 className="text-4xl sm:text-5xl font-bold mb-14">
      Live <span className="text-purple-300">Market Overview</span>
    </h2>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 sm:gap-8">
      {[
        {
          icon: <FaCoins />,
          label: "Pi Coin Price",
          prefix: "$",
          value: stats.piPrice,
          decimals: 2,
        },
        {
          icon: <FaUsers />,
          label: "Active Investors",
          suffix: "+",
          value: stats.investors,
        },
        {
          icon: <FaWallet />,
          label: "Total Locked",
          prefix: "$",
          suffix: "M",
          value: stats.totalLocked,
          decimals: 2,
        },
        {
          icon: <FaRocket />,
          label: "Daily ROI",
          suffix: "%",
          value: stats.dailyROI,
          decimals: 2,
        },
        {
          icon: <FaLock />,
          label: "Withdrawals",
          suffix: "+",
          value: stats.withdrawals,
        },
      ].map((item, idx) => (
        <motion.div
          key={idx}
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.3 }}
          className="bg-[#2B115C]/40 hover:bg-[#3B1B72]/50 backdrop-blur-lg border border-purple-400/20 hover:border-purple-400/40 p-8 rounded-2xl shadow-md hover:shadow-purple-500/20 transition-all duration-300 flex flex-col items-center justify-center space-y-2"
        >
          <div className="text-purple-400 text-4xl mb-2">{item.icon}</div>
          <h4 className="text-gray-300 text-sm sm:text-base mb-1 font-medium">
            {item.label}
          </h4>
          <AnimatedCounter
            value={item.value}
            prefix={item.prefix}
            suffix={item.suffix}
            decimals={item.decimals}
          />
        </motion.div>
      ))}
    </div>
  </div>
</section>

      {/* ===== FEATURES SECTION ===== */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.1),transparent_70%)] pointer-events-none"></div>

        <div className="relative max-w-7xl mx-auto px-6">
          <h2 className="text-4xl sm:text-5xl font-bold text-center mb-16">
            Why Choose <span className="text-purple-300">Us?</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            <FeatureCard
              icon={<FaChartLine />}
              title="Steady Growth"
              description="Experience compounding returns on every investment. Your Pi coins grow while you rest."
            />
            <FeatureCard
              icon={<FaLock />}
              title="Bank-Grade Security"
              description="We use decentralized smart contract protocols ensuring unmatched data protection."
            />
            <FeatureCard
              icon={<FaUsers />}
              title="Referral Rewards"
              description="Invite friends, grow your team, and earn exclusive bonus percentages daily."
            />
            <FeatureCard
              icon={<FaWallet />}
              title="Flexible Withdrawals"
              description="Withdraw anytime using Pi wallet, USDT (TRC20), or your local fiat bank details."
            />
            <FeatureCard
              icon={<FaRocket />}
              title="Instant Activation"
              description="No delays. Once you deposit, your plan begins compounding immediately."
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
