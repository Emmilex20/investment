/* eslint-disable no-irregular-whitespace */
// client/src/components/Navbar.tsx
import React, { useEffect, useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import type { User } from '../types/userTypes';
import { RefreshCw, Menu, X } from 'lucide-react';

const API_URL = '/api/users';

const Navbar: React.FC = () => {
  const { userInfo, dispatch } = useAuth();
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const userToken = userInfo?.token;

  const fetchBalance = useCallback(
    async (isManualRefresh: boolean = false) => {
      if (!userToken) return;

      if (isManualRefresh) setIsRefreshing(true);

      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
      };

      try {
        const { data } = await axios.get<User>(`${API_URL}/profile`, config);
        dispatch({ type: 'UPDATE_PROFILE', payload: data });
      } catch (error) {
        console.error('Failed to fetch latest user balance:', error);
      } finally {
        if (isManualRefresh) setIsRefreshing(false);
      }
    },
    [userToken, dispatch]
  );

  useEffect(() => {
    if (userToken) fetchBalance(false);
  }, [fetchBalance, userToken]);

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 bg-gray-900/90 backdrop-blur-xl shadow-lg border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link
            to="/"
            className="text-3xl font-extrabold text-pi-green-alt tracking-wider hover:opacity-90 transition"
          >
            P<span className="text-white">$</span> Invest
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-8 items-center">
            <Link
              to="/"
              className="text-gray-300 hover:text-pi-green-alt transition duration-200 font-medium"
            >
              Home
            </Link>

            {userInfo && (
              <>
                <Link
                  to="/invest"
                  className="text-gray-300 hover:text-pi-green-alt transition duration-200 font-medium"
                >
                  Invest
                </Link>
                <Link
                  to="/dashboard"
                  className="text-gray-300 hover:text-pi-green-alt transition duration-200 font-medium"
                >
                  Dashboard
                </Link>

                {userInfo.isAdmin && (
                  <>
                    {/* Existing Admin Dashboard Link */}
                    <Link
                      to="/admin"
                      className="text-yellow-400 hover:text-yellow-300 transition duration-200 font-bold"
                    >
                      Admin Dashboard
                    </Link>
                    
                    {/* --- NEW PACKAGE LINK (Desktop) --- */}
                    <Link 
                      to="/admin/packages"
                      className="px-3 py-1 rounded-full text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition duration-300 shadow-lg"
                    >
                      Manage Packages
                    </Link>
                  </>
                )}

                <Link
                  to="/transfer"
                  className="px-4 py-2 rounded-full text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition duration-300 shadow-lg"
                >
                  Transfer P$
                </Link>
              </>
            )}
          </div>

          {/* Right-side Auth Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {userInfo ? (
              <>
                <span className="text-md text-gray-300 font-semibold flex items-center space-x-2">
                  <span>
                    Balance:
                    <span className="text-pi-green-alt ml-1">
                      {userInfo.piCoinsBalance.toFixed(2)} P$
                    </span>
                  </span>

                  <button
                    onClick={() => fetchBalance(true)}
                    disabled={isRefreshing}
                    title="Refresh Balance"
                    className="p-1 rounded-full text-gray-400 hover:text-pi-green-alt disabled:text-gray-600 transition duration-150"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
                    />
                  </button>
                </span>

                <button
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-full text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition duration-300 shadow-lg"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-full text-sm font-bold text-white bg-pi-accent hover:bg-pi-accent/80 transition duration-300 shadow-lg"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-full text-sm font-bold text-pi-green-alt border-2 border-pi-green-alt hover:bg-pi-green-alt/10 transition duration-300"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-gray-300 hover:text-pi-green-alt transition duration-300 focus:outline-none"
          >
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="md:hidden bg-gray-900/95 backdrop-blur-lg border-t border-gray-800 shadow-xl">
          <div className="flex flex-col items-start px-6 py-4 space-y-4 animate-slideDown">
            <Link
              to="/"
              onClick={() => setIsMenuOpen(false)}
              className="w-full text-gray-300 hover:text-pi-green-alt transition font-medium"
            >
              Home
            </Link>

            {userInfo && (
              <>
                <Link
                  to="/invest"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full text-gray-300 hover:text-pi-green-alt transition font-medium"
                >
                  Invest
                </Link>
                <Link
                  to="/dashboard"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full text-gray-300 hover:text-pi-green-alt transition font-medium"
                >
                  Dashboard
                </Link>

                {userInfo.isAdmin && (
                  <>
                    {/* Existing Admin Dashboard Link */}
                    <Link
                      to="/admin"
                      onClick={() => setIsMenuOpen(false)}
                      className="w-full text-yellow-400 hover:text-yellow-300 transition font-bold"
                    >
                      Admin Dashboard
                    </Link>
                    
                    {/* --- NEW PACKAGE LINK (Mobile) --- */}
                    <Link
                      to="/admin/packages"
                      onClick={() => setIsMenuOpen(false)}
                      className="w-full text-white font-bold bg-red-600 hover:bg-red-700 px-4 py-2 rounded-full text-center transition"
                    >
                      Manage Packages
                    </Link>
                  </>
                )}

                <Link
                  to="/transfer"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full text-white font-bold bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-full text-center transition"
                >
                  Transfer P$
                </Link>

                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-white font-bold bg-red-600 hover:bg-red-700 px-4 py-2 rounded-full text-center transition"
                >
                  Logout
                </button>

                <div className="text-gray-400 text-sm pt-2">
                  Balance:{' '}
                  <span className="text-pi-green-alt">
                    {userInfo.piCoinsBalance.toFixed(2)} P$
                  </span>
                  <button
                    onClick={() => fetchBalance(true)}
                    disabled={isRefreshing}
                    title="Refresh Balance"
                    className="ml-2 p-1 rounded-full text-gray-400 hover:text-pi-green-alt disabled:text-gray-600 transition"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
                    />
                  </button>
                </div>
              </>
            )}

            {!userInfo && (
              <>
                <Link
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full text-white font-bold bg-pi-accent hover:bg-pi-accent/80 px-4 py-2 rounded-full text-center transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full text-pi-green-alt border-2 border-pi-green-alt hover:bg-pi-green-alt/10 px-4 py-2 rounded-full text-center font-bold transition"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;