// server/routes/investmentRoutes.js
import express from 'express';
const router = express.Router();
import { protect } from '../middleware/authMiddleware.js';
import { 
    getInvestmentPackages, 
    purchaseInvestment, 
    getMyInvestments,
    withdrawInvestment,
} from '../controllers/investmentController.js';

// Public route to view packages (optional, kept private for security/simplicity)
router.route('/packages').get(protect, getInvestmentPackages);

// Private routes for user actions
router.route('/purchase').post(protect, purchaseInvestment);
router.route('/my-investments').get(protect, getMyInvestments);
router.route('/withdraw/:investmentId').post(protect, withdrawInvestment);

export default router;