// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');

// Import routes
const basicRoutes = require('./routes/basic');
const verifyRoutes = require('./routes/verify');
const consentPageRoutes = require('./routes/consentPage');

// Initialize express app
const app = express();

// Middleware
app.use(morgan('dev')); // Logging
app.use(bodyParser.json()); // Parse JSON request bodies
app.use(cors()); // Enable CORS

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Routes
app.use('/v1.0/basic', basicRoutes);
app.use('/v1.0/verify', verifyRoutes);
app.use('/consent', consentPageRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  const errorResponse = {
    messageId: err.messageId || 'INTERNAL_ERROR',
    messageDescription: err.message || 'An unexpected error occurred',
    extraInfo: err.extraInfo || null
  };
  
  res.status(err.statusCode || 500).json(errorResponse);
});

// Export the app
module.exports = app;

// Made with Bob
