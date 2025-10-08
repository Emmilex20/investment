// server/server.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';

import { notFound, errorHandler } from './middleware/errorMiddleware.js'; 
import userRoutes from './routes/userRoutes.js'; 
import depositRoutes from './routes/depositRoutes.js';
import investmentRoutes from './routes/investmentRoutes.js';
import startCronJob from './cron/dailyProcessor.js';
import transactionRoutes from './routes/transactionRoutes.js'; 



// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

startCronJob();

const app = express();

// Middleware
app.use(express.json()); // Allows parsing of JSON request body
// Configure CORS to only allow the client's URL
const clientUrl = process.env.NODE_ENV === 'production' 
    ? process.env.CLIENT_URL 
    : 'http://localhost:5173';

app.use(cors({ origin: clientUrl }));

// Simple test route
app.get('/', (req, res) => {
  res.json({ message: 'API is running for the Investment Project.' });
});

// ROUTE IMPORTS - CONNECT THE USER ROUTES
app.use('/api/users', userRoutes); // NEW
app.use('/api/deposits', depositRoutes);
app.use('/api/investments', investmentRoutes);
app.use('/api/transactions', transactionRoutes); 

// Custom Error Handler Middleware (MUST be added after routes)
app.use(notFound);
app.use(errorHandler); // NEW

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`));