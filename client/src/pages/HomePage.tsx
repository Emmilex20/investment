// client/src/pages/HomePage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const FeatureCard: React.FC<{ title: string; description: string }> = ({
  title,
  description,
}) => (
  <div className="bg-[#2B115C]/50 p-6 rounded-2xl border border-purple-400/30 shadow-lg hover:shadow-purple-700/30 hover:border-purple-400 transition duration-300 backdrop-blur-md">
    <h3 className="text-2xl font-semibold text-white mb-2">{title}</h3>
    <p className="text-gray-300">{description}</p>
  </div>
);

const HomePage: React.FC = () => {
  const { userInfo } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2B115C] via-[#3C0D6E] to-[#1E053A]">
      {/* Hero Section */}
      <header className="py-24 border-b border-purple-500/20 relative overflow-hidden">
        {/* Subtle Glow Circle */}
        <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 w-[600px] h-[600px] bg-purple-600/20 blur-[180px] rounded-full"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
          <h1 className="text-5xl sm:text-7xl font-extrabold text-white leading-tight mb-6 drop-shadow-lg">
            Grow Your <span className="text-purple-300">Pi Coins</span>. Effortlessly.
          </h1>
          <p className="text-xl text-gray-200 mb-10 max-w-3xl mx-auto leading-relaxed">
            Join the future of decentralized finance. Invest your Pi Coins into smart plans
            and earn daily, predictable returns with total transparency.
          </p>

          {userInfo ? (
            <Link
              to="/invest"
              className="inline-block px-10 py-4 text-lg font-bold rounded-full text-white bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 transition duration-300 shadow-2xl transform hover:scale-105 hover:shadow-purple-500/40"
            >
              Start Investing Now
            </Link>
          ) : (
            <Link
              to="/register"
              className="inline-block px-10 py-4 text-lg font-bold rounded-full text-white bg-gradient-to-r from-purple-400 to-purple-600 hover:from-purple-500 hover:to-purple-700 transition duration-300 shadow-2xl transform hover:scale-105 hover:shadow-purple-500/40"
            >
              Get Started Today
            </Link>
          )}
        </div>
      </header>

      {/* Features Section */}
      <section className="py-20 relative">
        {/* Soft radial glow in background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(128,0,255,0.15),transparent_70%)] pointer-events-none"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl sm:text-5xl font-bold text-center text-white mb-14">
            Why Choose <span className="text-purple-300">Us?</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <FeatureCard
              title="Daily Returns"
              description="Watch your investment grow every 24 hours with compounding interest — automatically credited to your balance."
            />
            <FeatureCard
              title="Secure Platform"
              description="Enterprise-grade encryption and decentralized architecture ensure your assets remain safe and private."
            />
            <FeatureCard
              title="Referral Rewards"
              description="Invite friends to earn extra bonuses and unlock higher-tier investment plans — a win for both of you."
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
