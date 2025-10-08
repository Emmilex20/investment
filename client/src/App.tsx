// client/src/App.tsx
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

// Layout Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Deposit from './pages/Deposit';
import Invest from './pages/Invest';
import Transfer from './pages/Transfer';
import Withdraw from './components/WithdrawalForm';
import AdminDashboard from './pages/AdminDashboard';

// 404 Page
const NotFound = () => (
  <div className="flex flex-col items-center justify-center text-center py-32 px-4 min-h-[70vh] bg-gradient-to-br from-[#2B115C] via-[#3C0D6E] to-[#1E053A]">
    <h2 className="text-[6rem] font-extrabold text-purple-400 mb-6 drop-shadow-lg">404</h2>
    <p className="text-2xl text-gray-200 mb-4">Oops! Page Not Found.</p>
    <Link
      to="/"
      className="mt-4 inline-block px-8 py-3 rounded-full bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 text-white font-bold shadow-lg hover:shadow-purple-400/30 transition transform hover:scale-105"
    >
      Go Home
    </Link>
  </div>
);

function App() {
  return (
    <Router>
      {/* Root container with full-page gradient and flex layout */}
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#2B115C] via-[#3C0D6E] to-[#1E053A] text-white">
        <Navbar />

        {/* Main content area */}
        <main className="flex-grow w-full py-10 px-4 sm:px-6 lg:px-8 flex justify-center items-start relative z-10">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* User Protected Routes */}
            <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
            <Route path="/deposit" element={<ProtectedRoute element={<Deposit />} />} />
            <Route path="/invest" element={<ProtectedRoute element={<Invest />} />} />
            <Route path="/transfer" element={<ProtectedRoute element={<Transfer />} />} />
            <Route path="/withdraw" element={<ProtectedRoute element={<Withdraw />} />} />

            {/* Admin Protected Route */}
            <Route
              path="/admin"
              element={<ProtectedRoute element={<AdminDashboard />} adminOnly={true} />}
            />

            {/* 404 Fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  );
}

export default App;
