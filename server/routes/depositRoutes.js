// server/routes/depositRoutes.js
import express from 'express';
const router = express.Router();
import { protect } from '../middleware/authMiddleware.js';
import { createDeposit } from '../controllers/depositController.js';

// Route for simulating a new deposit
router.route('/').post(protect, createDeposit);

export default router;