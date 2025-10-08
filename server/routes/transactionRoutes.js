// server/routes/transactionRoutes.js (Example route file)

import express from 'express';
const router = express.Router();
import { protect, admin } from '../middleware/authMiddleware.js'; // Assuming you have protect and admin middleware
import { 
    getPendingWithdrawals,
    processWithdrawal,
    rejectWithdrawal,
} from '../controllers/withdrawalController.js';


// Admin routes for managing withdrawals
// The 'protect' middleware ensures a user is logged in.
// The 'admin' middleware ensures the logged-in user is an admin.
router.route('/admin/withdrawals').get(protect, admin, getPendingWithdrawals);
router.route('/admin/withdrawals/:id/processed').put(protect, admin, processWithdrawal);
router.route('/admin/withdrawals/:id/failed').put(protect, admin, rejectWithdrawal);

// ... other transaction routes (e.g., user's withdrawal request route)

export default router;