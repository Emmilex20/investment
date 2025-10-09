// server/routes/investmentRoutes.js (UPDATED WITH ADMIN ROUTES)
import express from 'express';
const router = express.Router();
// Import both protect and admin middleware
import { protect, admin } from '../middleware/authMiddleware.js'; 
import { 
    getInvestmentPackages, 
    purchaseInvestment, 
    getMyInvestments,
    withdrawInvestment,
    getAllInvestmentPackagesAdmin, // <-- NEW IMPORT
    createInvestmentPackage,       // <-- NEW IMPORT
    updateInvestmentPackage,       // <-- NEW IMPORT
} from '../controllers/investmentController.js';

// --------------------------------------------------------------------------
// PUBLIC/USER ROUTES (Existing)
// --------------------------------------------------------------------------
router.route('/packages').get(protect, getInvestmentPackages);
router.route('/purchase').post(protect, purchaseInvestment);
router.route('/my-investments').get(protect, getMyInvestments);
router.route('/withdraw/:investmentId').post(protect, withdrawInvestment);


// --------------------------------------------------------------------------
// ADMIN ROUTES (NEW)
// --------------------------------------------------------------------------
// GET all packages (including inactive) and POST a new package
router.route('/admin/packages')
    .get(protect, admin, getAllInvestmentPackagesAdmin)
    .post(protect, admin, createInvestmentPackage);

// PUT to update an existing package by ID
router.route('/admin/packages/:id')
    .put(protect, admin, updateInvestmentPackage);


export default router;