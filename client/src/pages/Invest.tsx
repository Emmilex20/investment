// client/src/pages/Invest.tsx (OPTIMIZED & LINT FIXES)
import React, { useState, type FormEvent, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { ArrowLeft, Zap, TrendingUp, DollarSign, Loader2, Clock } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Define types
interface InvestmentPackage {
  _id: string;
  name: string;
  dailyReturnRate: number; // e.g., 0.05 for 5%
  durationDays: number;
  rewardPiCoins: number; 
  requiredReferrals: number;
  iconName: 'basic' | 'standard' | 'premium'; 
}

interface UserInvestment {
  _id: string;
  investedAmount: number;
  endDate: string; // ISO date string
  status: 'active' | 'completed' | 'withdrawn';
  package: {
    _id: string;
    name: string;
    dailyReturnRate: number;
    durationDays: number;
    requiredReferrals: number;
  }
}

// Simple map for package names to icons and colors (can be extended)
const iconMap = {
  'basic': { icon: Zap, color: 'text-yellow-400' },
  'standard': { icon: TrendingUp, color: 'text-pi-green-alt' },
  'premium': { icon: DollarSign, color: 'text-pi-accent' },
};

const Invest: React.FC = () => {
  const { userInfo, dispatch } = useAuth();
  const navigate = useNavigate();

  // State for fetched packages
  const [packages, setPackages] = useState<InvestmentPackage[]>([]);
  const [packagesLoading, setPackagesLoading] = useState<boolean>(true);
  
  // State for user's investments
  const [userInvestments, setUserInvestments] = useState<UserInvestment[]>([]);
  const [investmentsLoading, setInvestmentsLoading] = useState<boolean>(true);
  
  // Removed amount state, as it's redundant (always equals selectedPlan.rewardPiCoins)
  const [planId, setPlanId] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // --- HOOKS MUST BE CALLED UNCONDITIONALLY AT THE TOP LEVEL ---

  // 1. Authentication Redirect Effect
  useEffect(() => {
    if (!userInfo) {
        navigate('/login');
    }
  }, [userInfo, navigate]);

  
  // 3. Memoized calculation (Moved up to be with other hooks)
  const selectedPlan = useMemo(
    () => packages.find(p => p._id === planId),
    [packages, planId]
  );
  
  // 4. User Investments Fetching Function (Wrapped in useCallback)
  const fetchMyInvestments = useCallback(async () => {
    if (!userInfo) return;
    setInvestmentsLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await axios.get<UserInvestment[]>(
        `${API_BASE_URL}/api/investments/my-investments`, config
      );
      setUserInvestments(data);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        // Error handling is intentionally minimal here
    } finally {
      setInvestmentsLoading(false);
    }
  }, [userInfo]); // Dependency on userInfo

  // 5. Trigger fetchMyInvestments on load/userInfo change
  useEffect(() => {
    fetchMyInvestments();
  }, [userInfo, fetchMyInvestments]); // Added fetchMyInvestments to dependencies

  
  // 2. Package Fetching Effect
  useEffect(() => {
    if (!userInfo) return;

    const fetchPackages = async () => {
      setPackagesLoading(true);
      try {
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        const { data } = await axios.get<InvestmentPackage[]>(
          `${API_BASE_URL}/api/investments/packages`, config
        );
        
        const formattedPackages = data.map(p => ({
            ...p,
            iconName: p.name.toLowerCase().includes('premium') ? 'premium' : 
                      p.name.toLowerCase().includes('standard') ? 'standard' : 'basic',
        })) as InvestmentPackage[];

        setPackages(formattedPackages);
        
        if (formattedPackages.length > 0) {
            setPlanId(formattedPackages[0]._id);
            // Removed setAmount(formattedPackages[0].rewardPiCoins); 
        }

      } catch (_error) { // Used _error to silence lint warning
        let errorMessage = 'Failed to load investment packages.';
        if (axios.isAxiosError(_error) && _error.response) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            errorMessage = (_error.response.data as any).message || errorMessage;
        }
        setMessage(`Error: ${errorMessage}`);
      } finally {
        setPackagesLoading(false);
      }
    };

    fetchPackages();
  }, [userInfo]);


  
  // --- CONDITIONAL RETURNS ---
  if (!userInfo) return null;
  
  if (packagesLoading) {
      return (
          <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-[#1a0844] to-[#2b115c] px-4">
              <Loader2 className="w-10 h-10 animate-spin text-pi-accent" />
              <p className="ml-3 text-lg text-white">Loading investment data...</p>
          </div>
      );
  }
  
  // --- Investment Calculations ---
  // Use optional chaining for safety if selectedPlan is null/undefined
  const dailyRate = selectedPlan?.dailyReturnRate || 0;
  const durationDays = selectedPlan?.durationDays || 0;
  const requiredInvestment = selectedPlan?.rewardPiCoins || 0; 
  
  const dailyReturn = requiredInvestment * dailyRate;
  const totalReturn = dailyReturn * durationDays;
  const totalPayout = requiredInvestment + totalReturn;
  const balanceAfterInvestment = userInfo.piCoinsBalance - requiredInvestment;
  
  const isBalanceSufficient = userInfo.piCoinsBalance >= requiredInvestment;


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage('');

    if (!selectedPlan) {
        setMessage('Error: No plan selected.');
        return;
    }
    if (!isBalanceSufficient) {
        setMessage(`Insufficient balance. This package requires ${requiredInvestment.toFixed(2)} P$.`);
        return;
    }
    
    setLoading(true);

    try {
      const config = { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userInfo.token}` } };

      const { data } = await axios.post(
        `${API_BASE_URL}/api/investments/purchase`,
        { packageId: selectedPlan._id }, 
        config
      );

      setMessage(`✅ Success! ${data.message || 'Investment created successfully.'}`);
      dispatch({
        type: 'UPDATE_PROFILE',
        payload: { piCoinsBalance: data.newBalance },
      });
      
      // Update investments list after successful purchase
      await fetchMyInvestments(); 
      // Reset plan to default for the next purchase selection
      if (packages.length > 0) {
        setPlanId(packages[0]._id);
      }
      
    } catch (error) {
      let errorMessage = 'An error occurred while processing your investment.';
      if (axios.isAxiosError(error) && error.response) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        errorMessage = (error.response.data as any).message || errorMessage;
      }
      setMessage(`❌ Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full p-4 text-xl md:text-2xl font-mono text-center rounded-lg bg-white/10 border border-pi-accent/40 text-white placeholder-gray-400 transition duration-300 cursor-not-allowed';
  const buttonClass =
    'w-full py-4 rounded-lg font-extrabold text-white bg-gradient-to-r from-pi-accent to-purple-600 hover:from-purple-600 hover:to-pi-accent transition-all duration-500 shadow-xl shadow-pi-accent/20 disabled:opacity-50 flex items-center justify-center space-x-2';

  // Render the "No active packages" view if the array is empty after loading
  if (packages.length === 0 && !packagesLoading) {
    return (
        <div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-b from-[#1a0844] to-[#2b115c] px-4">
            <p className="text-xl text-red-400 mb-4">No active investment packages found.</p>
            <motion.button
              onClick={() => navigate('/dashboard')}
              className="py-2 px-4 rounded-lg font-bold text-white bg-pi-accent hover:bg-pi-accent/80 transition duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Go to Dashboard
            </motion.button>
        </div>
    );
  }

  // --- Main Render ---
  return (
    <div className="flex justify-center items-start pt-6 pb-20 min-h-screen bg-gradient-to-b from-[#1a0844] to-[#2b115c] px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-4xl p-4 md:p-8 bg-white/10 rounded-3xl shadow-[0_0_50px_-15px_rgba(124,58,237,0.8)] backdrop-blur-lg border border-pi-accent/40 space-y-8"
      >
        {/* Header and Balance */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 md:mb-8 text-center md:text-left">
          <h2 className="text-2xl md:text-4xl font-extrabold text-white mb-2 md:mb-0">
            Invest in Pi Packages 🚀
          </h2>
          
          <div className="text-right">
            <p className="text-sm text-gray-300">
              Your Balance:
            </p>
            <span className="text-xl text-pi-green-alt font-bold">
              {userInfo.piCoinsBalance.toFixed(2)} P$
            </span>
          </div>
        </div>

        {/* Message Alert */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl text-center font-medium ${
              message.toLowerCase().includes('success')
                ? 'bg-pi-green-alt/20 text-pi-green-alt border border-pi-green-alt/50'
                : 'bg-red-900/40 text-red-400 border border-red-800/50'
            }`}
          >
            {message}
          </motion.div>
        )}

        {/* --- INVESTMENT FORM --- */}
        {selectedPlan && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Plan Selection Cards */}
          <div>
            <h3 className="text-lg font-semibold text-gray-200 mb-3">
              1. Choose Investment Plan
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {packages.map((plan) => {
                const PlanIcon = iconMap[plan.iconName].icon;
                const planColor = iconMap[plan.iconName].color;
                
                return (
                  <motion.div
                    key={plan._id}
                    className={`p-4 md:p-6 rounded-xl cursor-pointer transition-all duration-300 border-2 ${
                      plan._id === planId
                        ? 'bg-pi-accent/20 border-pi-accent shadow-lg shadow-pi-accent/30 scale-[1.02]'
                        : 'bg-white/5 border-transparent hover:border-pi-accent/50'
                    }`}
                    onClick={() => {
                      setPlanId(plan._id);
                    }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <PlanIcon className={`w-6 h-6 md:w-8 md:h-8 mb-2 ${planColor}`} />
                    <h4 className="text-lg md:text-xl font-bold text-white mb-1">
                      {plan.name}
                    </h4>
                    <p className="text-xl md:text-2xl font-extrabold text-pi-green-alt">
                      {(plan.dailyReturnRate * 100).toFixed(0)}% Daily
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      Duration: {plan.durationDays} Days
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Required: {plan.rewardPiCoins} P$
                    </p>
                    {plan.requiredReferrals > 0 && (
                        <p className="text-xs text-yellow-500 mt-1 font-semibold">
                            Requires {plan.requiredReferrals} Referrals
                        </p>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* 2. Amount Input (Readonly) */}
          <div className="pt-2">
            <h3 className="text-lg font-semibold text-gray-200 mb-3">
              2. Investment Amount (P$)
            </h3>
            <div className="relative">
              <input
                type="number"
                id="amount"
                value={requiredInvestment.toFixed(2)}
                disabled 
                className={inputClass}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-pi-accent font-extrabold text-sm opacity-80">
                P$
              </span>
            </div>
            {!isBalanceSufficient && (
                <p className="text-sm text-red-400 mt-2">
                    Balance too low. You need **{requiredInvestment.toFixed(2)} P$** for the {selectedPlan.name} package.
                </p>
            )}
          </div>

          {/* 3. Investment Summary */}
          <div className="pt-2">
            <h3 className="text-lg font-semibold text-gray-200 mb-3">
              3. Investment Summary
            </h3>
            <motion.div 
                className="p-4 md:p-6 bg-white/5 rounded-xl border border-white/20 grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                key={planId}
            >
                <SummaryItem label="Daily Return Rate" value={`${(dailyRate * 100).toFixed(0)}%`} color="text-pi-accent" />
                <SummaryItem label="Investment Duration" value={`${durationDays} Days`} color="text-yellow-400" />
                <SummaryItem label="Estimated Daily Return" value={`${dailyReturn.toFixed(2)} P$`} color="text-white" />
                <SummaryItem label="Projected Total Return" value={`${totalReturn.toFixed(2)} P$`} color="text-white" />
                <SummaryItem label="Total Payout (Principal + Profit)" value={`${totalPayout.toFixed(2)} P$`} color="text-pi-green-alt" isFinal />
                <SummaryItem label="Balance After Investment" value={`${balanceAfterInvestment.toFixed(2)} P$`} color="text-gray-300" />
            </motion.div>
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={loading || !isBalanceSufficient}
            className={buttonClass}
            whileHover={{ scale: 1.01, boxShadow: "0 15px 30px rgba(124,58,237,0.5)" }}
            whileTap={{ scale: 0.98 }}
          >
            {loading
              ? 'Executing Transaction...'
              : `Purchase ${selectedPlan.name} for ${requiredInvestment.toFixed(2)} P$`}
          </motion.button>
          
          {/* Back to Dashboard Button (Moved below submit) */}
          <motion.button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="w-full py-3 rounded-lg font-bold text-gray-300 bg-white/5 hover:bg-white/10 transition duration-300 flex items-center justify-center space-x-2 mt-4"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </motion.button>
        </form>
        )}
        
        {/* --- MY ACTIVE INVESTMENTS SECTION --- */}
        <div className="pt-8 border-t border-white/10 mt-8">
            <h3 className="text-2xl font-bold text-white mb-4 flex items-center space-x-2">
                <TrendingUp className="w-6 h-6 text-pi-green-alt" />
                <span>My Active Investments ({userInvestments.filter(i => i.status === 'active').length})</span>
            </h3>
            
            {investmentsLoading ? (
                <div className="flex justify-center p-6">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
            ) : userInvestments.length === 0 ? (
                <p className="text-gray-400 p-4 bg-white/5 rounded-lg text-center">
                    You currently have no investments. Start one above!
                </p>
            ) : (
                <div className="space-y-4">
                    {userInvestments.map((investment) => {
                        const { package: pkg } = investment;
                        // Calculate daily return based on invested amount and package rate
                        const dailyProfit = investment.investedAmount * pkg.dailyReturnRate;
                        const endDate = new Date(investment.endDate).toLocaleDateString();

                        return (
                            <motion.div
                                key={investment._id}
                                className={`p-4 rounded-xl border-l-4 ${
                                    investment.status === 'active' ? 'bg-purple-900/30 border-pi-accent' : 
                                    investment.status === 'completed' ? 'bg-yellow-900/30 border-yellow-400' : 
                                    'bg-green-900/30 border-pi-green-alt'
                                }`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="text-lg font-bold text-white">
                                        {pkg.name}
                                    </h4>
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                        investment.status === 'active' ? 'bg-pi-accent/50 text-white' :
                                        investment.status === 'completed' ? 'bg-yellow-500/50 text-white' :
                                        'bg-pi-green-alt/50 text-white'
                                    }`}>
                                        {investment.status.toUpperCase()}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-y-2 text-sm text-gray-300">
                                    <p><strong>Invested:</strong> <span className="text-white font-semibold">{investment.investedAmount.toFixed(2)} P$</span></p>
                                    <p><strong>Daily Profit:</strong> <span className="text-pi-green-alt font-semibold">{dailyProfit.toFixed(2)} P$</span></p>
                                    <p><strong>Rate:</strong> <span className="text-pi-accent font-semibold">{(pkg.dailyReturnRate * 100).toFixed(0)}%</span></p>
                                    <p><strong>Expires:</strong> <span className="text-white font-semibold flex items-center"><Clock className="w-4 h-4 mr-1" /> {endDate}</span></p>
                                </div>
                                
                                {investment.status === 'completed' && (
                                    <p className="text-sm text-yellow-400 mt-2 font-medium">
                                        Ready for withdrawal! Check if you meet the **{pkg.requiredReferrals} referrals** requirement.
                                    </p>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
      </motion.div>
    </div>
  );
};

// --- Helper Component for Summary Items ---
interface SummaryItemProps {
    label: string;
    value: string;
    color: string;
    isFinal?: boolean;
}
const SummaryItem: React.FC<SummaryItemProps> = ({ label, value, color, isFinal = false }) => (
    <div className={`p-3 rounded-md ${isFinal ? 'bg-pi-green-alt/10' : 'bg-white/5'} transition duration-200`}>
        <p className="text-xs font-medium text-gray-400 mb-1">{label}</p>
        <p className={`text-sm md:text-lg font-bold ${color}`}>{value}</p>
    </div>
);

export default Invest;