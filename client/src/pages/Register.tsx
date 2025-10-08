// client/src/pages/Register.tsx

import React, { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthCard from '../components/AuthCard';
import axios from 'axios';
import type { User } from '../types/userTypes'; // Import the type
import { useAuth } from '../context/AuthContext'; // NEW IMPORT

const API_URL = 'http://localhost:5000/api/users/register'; // Ensure this matches your backend PORT

const Register: React.FC = () => {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [referralCode, setReferralCode] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const { login } = useAuth(); 

  const submitHandler = async (e: FormEvent) => {
    e.preventDefault();
    setMessage('');

    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
        },
      };

      // Send the request to the backend
      const { data } = await axios.post<User>(
        API_URL,
        { 
          name, 
          email, 
          password, 
          referralCode: referralCode || undefined // Only send if it exists
        },
        config
      );

      // --- CRUCIAL CHANGE HERE ---
      login(data); // Use the context login function
      setMessage('Registration successful! Redirecting to dashboard...');
      navigate('/dashboard');

    } catch (error) {
        let errorMessage = 'An unexpected error occurred.';
        if (axios.isAxiosError(error) && error.response) {
            errorMessage = error.response.data.message || error.response.data.error || 'Server Error';
        }
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full p-3 rounded-md bg-white/20 border border-pi-accent/40 text-white placeholder-gray-400 focus:outline-none focus:border-pi-accent/80 transition duration-150";
  const labelClass = "block text-sm font-medium text-gray-300 mb-1";

  return (
    <div className="flex justify-center">
      <AuthCard title="Create Account">
        {message && (
          <div className={`p-3 mb-4 rounded ${message.includes('successful') ? 'bg-pi-green-alt/20 text-pi-green-alt' : 'bg-red-900/40 text-red-400'}`}>
            {message}
          </div>
        )}
        <form onSubmit={submitHandler}>
          {/* Name */}
          <div className="mb-4">
            <label className={labelClass} htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              required
            />
          </div>

          {/* Email */}
          <div className="mb-4">
            <label className={labelClass} htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              required
            />
          </div>

          {/* Password */}
          <div className="mb-4">
            <label className={labelClass} htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              required
            />
          </div>

          {/* Confirm Password */}
          <div className="mb-4">
            <label className={labelClass} htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputClass}
              required
            />
          </div>

          {/* Referral Code (Optional) */}
          <div className="mb-6">
            <label className={labelClass} htmlFor="referralCode">Referral Code (Optional)</label>
            <input
              type="text"
              id="referralCode"
              placeholder="Enter referral code"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
              className={inputClass}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-md font-bold text-white bg-pi-accent hover:bg-pi-accent/80 transition duration-300 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Register'}
          </button>
        </form>

        <div className="mt-6 text-center text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="text-pi-accent font-semibold hover:underline">
            Login
          </Link>
        </div>
      </AuthCard>
    </div>
  );
};

export default Register;