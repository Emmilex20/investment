import React, { useEffect, useCallback, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import type { User } from "../types/userTypes";
import { RefreshCw, Menu, X } from "lucide-react";

const API_URL = "/api/users";

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
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
      };

      try {
        const { data } = await axios.get<User>(`${API_URL}/profile`, config);
        dispatch({ type: "UPDATE_PROFILE", payload: data });
      } catch (error) {
        console.error("Failed to fetch latest user balance:", error);
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
    dispatch({ type: "LOGOUT" });
    navigate("/login");
  };

  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-r from-[#12002F] via-[#1B033B] to-[#12002F] border-b border-purple-800/40 shadow-[0_0_15px_rgba(128,0,255,0.15)] backdrop-blur-xl transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link
            to="/"
            className="text-3xl font-extrabold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent tracking-wide hover:scale-105 transform transition duration-300"
          >
            P<span className="text-white">$</span> Invest
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-10">
            <Link
              to="/"
              className="relative text-gray-300 hover:text-purple-300 font-medium transition duration-300 after:content-[''] after:block after:w-0 after:h-[2px] after:bg-purple-400 after:transition-all after:duration-300 hover:after:w-full"
            >
              Home
            </Link>

            {userInfo && (
              <>
                <Link
                  to="/invest"
                  className="relative text-gray-300 hover:text-purple-300 font-medium transition duration-300 after:content-[''] after:block after:w-0 after:h-[2px] after:bg-purple-400 after:transition-all after:duration-300 hover:after:w-full"
                >
                  Invest
                </Link>
                <Link
                  to="/dashboard"
                  className="relative text-gray-300 hover:text-purple-300 font-medium transition duration-300 after:content-[''] after:block after:w-0 after:h-[2px] after:bg-purple-400 after:transition-all after:duration-300 hover:after:w-full"
                >
                  Dashboard
                </Link>

                {userInfo.isAdmin && (
                  <>
                    <Link
                      to="/admin"
                      className="text-yellow-400 hover:text-yellow-300 transition duration-200 font-bold"
                    >
                      Admin Dashboard
                    </Link>
                    <Link
                      to="/admin/packages"
                      className="px-3 py-1 rounded-full text-sm font-bold text-white bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 transition duration-300 shadow-md"
                    >
                      Manage Packages
                    </Link>
                  </>
                )}

                <Link
                  to="/transfer"
                  className="px-5 py-2 rounded-full font-semibold text-sm text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-md hover:shadow-purple-500/40 transition duration-300"
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
                <span className="text-md text-gray-300 font-semibold flex items-center gap-2 bg-[#2B115C]/40 px-3 py-1 rounded-full border border-purple-400/20 shadow-inner">
                  Balance:
                  <span className="text-purple-300">
                    {userInfo.piCoinsBalance.toFixed(2)} P$
                  </span>
                  <button
                    onClick={() => fetchBalance(true)}
                    disabled={isRefreshing}
                    title="Refresh Balance"
                    className="p-1 rounded-full text-purple-300 hover:text-white transition duration-200"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${
                        isRefreshing ? "animate-spin" : ""
                      }`}
                    />
                  </button>
                </span>

                <button
                  onClick={handleLogout}
                  className="px-5 py-2 rounded-full font-semibold text-sm text-white bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 shadow-md hover:shadow-pink-500/40 transition duration-300"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-5 py-2 rounded-full font-semibold text-sm text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-md hover:shadow-pink-500/40 transition duration-300"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2 rounded-full font-semibold text-sm text-pi-green-alt border-2 border-pi-green-alt hover:bg-pi-green-alt/10 transition duration-300"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-gray-300 hover:text-purple-300 transition duration-300 focus:outline-none"
          >
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="md:hidden bg-[#12002F]/95 backdrop-blur-2xl border-t border-purple-800/30 shadow-[0_0_20px_rgba(128,0,255,0.15)] animate-slideDown transition-all duration-500">
          <div className="flex flex-col items-start px-6 py-4 space-y-4">
            <Link
              to="/"
              onClick={() => setIsMenuOpen(false)}
              className="w-full text-gray-300 hover:text-purple-300 px-2 py-2 font-medium transition"
            >
              Home
            </Link>

            {userInfo && (
              <>
                <Link
                  to="/invest"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full text-gray-300 hover:text-purple-300 px-2 py-2 font-medium transition"
                >
                  Invest
                </Link>
                <Link
                  to="/dashboard"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full text-gray-300 hover:text-purple-300 px-2 py-2 font-medium transition"
                >
                  Dashboard
                </Link>

                {userInfo.isAdmin && (
                  <>
                    <Link
                      to="/admin"
                      onClick={() => setIsMenuOpen(false)}
                      className="w-full text-yellow-400 hover:text-yellow-300 transition font-bold"
                    >
                      Admin Dashboard
                    </Link>
                    <Link
                      to="/admin/packages"
                      onClick={() => setIsMenuOpen(false)}
                      className="w-full text-white font-bold bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 px-4 py-2 rounded-full text-center transition"
                    >
                      Manage Packages
                    </Link>
                  </>
                )}

                <Link
                  to="/transfer"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full text-white font-bold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 px-4 py-2 rounded-full text-center transition"
                >
                  Transfer P$
                </Link>

                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-white font-bold bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 px-4 py-2 rounded-full text-center transition"
                >
                  Logout
                </button>

                <div className="text-gray-400 text-sm pt-2 flex items-center gap-2">
                  Balance:
                  <span className="text-purple-300">
                    {userInfo.piCoinsBalance.toFixed(2)} P$
                  </span>
                  <button
                    onClick={() => fetchBalance(true)}
                    disabled={isRefreshing}
                    title="Refresh Balance"
                    className="p-1 rounded-full text-purple-300 hover:text-white transition"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${
                        isRefreshing ? "animate-spin" : ""
                      }`}
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
                  className="w-full text-white font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-4 py-2 rounded-full text-center transition"
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
