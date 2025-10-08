// server/server.js (FIXED CORS CONFIGURATION)
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

// 🚨 CORE FIX: Define all allowed origins
let allowedOrigins = [];

if (process.env.NODE_ENV === 'production') {
    // In production, allow the live client URL AND the local development URL
    // We add localhost:5173 so you can test the production API locally.
    allowedOrigins = [
        process.env.CLIENT_URL, // e.g., https://investment-one-ruby.vercel.app
        'http://localhost:5173', // Your local dev environment
        // NOTE: You may also need to add your Render URL itself 
        // if your frontend is deployed there:
        // 'https://investment-kta5.onrender.com' 
    ];
} else {
    // In development mode, only allow the local client
    allowedOrigins = ['http://localhost:5173']; 
}

// Configure CORS using the array of allowed origins
const corsOptions = {
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
};

app.use(cors(corsOptions));

// Simple test route
app.get('/', (req, res) => {
  res.json({ message: 'API is running for the Investment Project.' });
});

// ROUTE IMPORTS - CONNECT THE USER ROUTES
app.use('/api/users', userRoutes); 
app.use('/api/deposits', depositRoutes);
app.use('/api/investments', investmentRoutes);
app.use('/api/transactions', transactionRoutes); 

// Custom Error Handler Middleware (MUST be added after routes)
app.use(notFound);
app.use(errorHandler); 

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`));