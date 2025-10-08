// server/routes/userRoutes.js (FIXED - Including Withdraw Route)
import express from 'express';
const router = express.Router();
// FIX: Import the 'admin' middleware here
import { protect, admin } from '../middleware/authMiddleware.js'; 
import {
    authUser,
    registerUser,
    getUserProfile,
    transferPiCoins,
    withdrawPiCoins, // <--- NEW IMPORT
    adminAddPiCoins,
    getUsers, // FIX: Import getUsers controller function
} from '../controllers/userController.js';

// Public routes
router.post('/register', registerUser);
router.post('/login', authUser);

// Private (Protected) routes
router.route('/profile').get(protect, getUserProfile);
router.route('/transfer').post(protect, transferPiCoins);
router.route('/withdraw').post(protect, withdrawPiCoins); // <--- NEW ROUTE

// Admin Routes (MUST use 'protect' and 'admin' middleware)
// 'admin' is now correctly imported and available
router.route('/admin/add-coins').post(protect, admin, adminAddPiCoins);
router.route('/admin/all-users').get(protect, admin, getUsers);

export default router; 