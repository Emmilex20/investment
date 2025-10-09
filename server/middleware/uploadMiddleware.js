// server/middleware/uploadMiddleware.js
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import path from 'path';

// >>> IMPORT THE CONFIGURED CLOUDINARY INSTANCE <<<
import configuredCloudinary from '../config/cloudinary.js'; 


// Setup Cloudinary storage
const storage = new CloudinaryStorage({
    // Use the correctly configured Cloudinary object imported from the config file
    cloudinary: configuredCloudinary, 
    params: (req, file) => {
        // Defines where the file will be stored in Cloudinary and the filename
        return {
            folder: 'deposit_receipts', // A folder in your Cloudinary account
            // Fallback to 'png' if mimetype is missing the extension part (e.g., application/octet-stream)
            format: file.mimetype.split('/')[1] || 'png', 
            // Unique filename: user-id-timestamp
            public_id: `${req.user._id}-${Date.now()}`, 
        };
    },
});

// File filter to only allow images and PDFs
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        // Use a standard Error for Multer to catch
        cb(new Error('Only images (jpg, png) or PDF files are allowed.'), false);
    }
};

// Middleware function
const uploadReceipt = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
}).single('receipt'); // 'receipt' is the field name from the frontend

export default uploadReceipt;