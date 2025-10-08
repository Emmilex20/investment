// server/middleware/errorMiddleware.js (FIXED)

const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

// Resilient Express Error Handler
const errorHandler = (err, req, res, next) => {
    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    let message = err.message;

    // --- CRITICAL FIX: Handle Mongoose CastError ---
    if (err.name === 'CastError' && err.kind === 'ObjectId') {
        // A CastError for an ObjectId usually means the ID format is wrong (e.g., non-hex characters)
        // Set status to 400 Bad Request
        statusCode = 400; 
        message = `Invalid ID format for resource: ${err.value}`;
    } 
    // Handle Mongoose Validation Errors (e.g. required field missing)
    else if (err.name === 'ValidationError') {
        statusCode = 400;
        // Construct a message from all validation errors
        message = Object.values(err.errors).map(val => val.message).join('. ');
    }
    // Note: Other Mongoose errors like Duplicate Key (code: 11000) can be handled here too

    // Set the status and send the JSON response
    res.status(statusCode);
    res.json({
        message: message,
        // Only show stack trace in development mode
        // NOTE: The condition was inverted in your original: 'production' ? null : err.stack
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

export { notFound, errorHandler };