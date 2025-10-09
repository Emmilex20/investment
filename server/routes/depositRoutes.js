// server/routes/depositRoutes.js (FINAL FIX)
import express from 'express';
const router = express.Router();
import { protect, admin } from '../middleware/authMiddleware.js'; 
import uploadReceipt from '../middleware/uploadMiddleware.js'; 
import { 
    createDeposit, 
    // Replaced 'approveDeposit' with the new, generic function
    getPendingDeposits, 
    updateDepositStatus 
} from '../controllers/depositController.js';

// Route for creating a new deposit request (handles file upload)
router.route('/').post(protect, uploadReceipt, createDeposit);

// =======================================================
// ADMIN ROUTES
// =======================================================

// 1. Route for fetching all pending deposits (Matches frontend fetchDeposits)
router.route('/admin/pending').get(protect, admin, getPendingDeposits);

// 2. Route for updating deposit status (Approve/Reject) (Matches frontend updateDepositStatus)
router.route('/admin/update-status/:id').put(protect, admin, updateDepositStatus);


export default router;