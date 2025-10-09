/* eslint-disable no-irregular-whitespace */
// client/src/types/userTypes.ts (UPDATED)

// Interface for Investment Packages (Master Data)
export interface InvestmentPackage {
  _id: string;
  name: string;
  costUSD: number;
  rewardPiCoins: number; // Amount of P$ invested
  durationDays: number;
  dailyReturnRate: number; // e.g., 0.05
  requiredReferrals: number;
  isActive: boolean;
  createdAt: string; 
  updatedAt: string;
}

// Interface for a User's Investment Transaction
// This is the populated version returned by /my-investments
export interface UserInvestment {
  _id: string;
  user: string; // User ID
  package: { // Populated package details
      _id: string;
      name: string;
      dailyReturnRate: number;
      durationDays: number;
      // FIX 2: Add missing property to populated package details
      requiredReferrals: number; 
  }; 
  investedAmount: number;
  totalReturns: number;
  currentDay: number;
  // FIX 1: Add 'withdrawn' to the status union type
  status: 'active' | 'completed' | 'pending' | 'withdrawn'; 
  lastReturnDate: string; // ISO Date String
  endDate: string; // ISO Date String
  createdAt: string;
}

// Define the shape of a referred user object (when populated by the API)
export interface ReferralUser {
  _id: string;
  name: string;
  email: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  piCoinsBalance: number;
  referralCode: string;
  isAdmin: boolean;
  token: string;

  // FIX 1: The backend populates this field with an object or returns null
  referredBy: ReferralUser | null; 
  
  // FIX 2: The backend populates this field with an array of user objects
  referrals: ReferralUser[]; 
}

// Interface for the state of the authentication context (to be built later)
export interface AuthState {
  userInfo: User | null;
  loading: boolean;
  error: string | null;
}