/**
 * Authentication middleware for protecting routes
 */
const axios = require('axios');

// Tenant configuration
const tenantUrl = process.env.VERIFY_TENANT_URL || 'https://example.verify.ibm.com';
const clientId = process.env.VERIFY_CLIENT_ID || 'your-client-id';
const clientSecret = process.env.VERIFY_CLIENT_SECRET || 'your-client-secret';

/**
 * Introspect OAuth token
 * @param {string} token - The bearer token to introspect
 * @returns {Promise<Object>} - The introspection response
 */
async function introspectToken(token) {
  try {
    // Prepare the request data
    const data = new URLSearchParams();
    data.append('token', token);
    
    // Make the request to the introspection endpoint
    const response = await axios({
      method: 'post',
      url: `${tenantUrl}/oauth2/introspect`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
      },
      data
    });
    
    return response.data;
  } catch (error) {
    console.error('Error introspecting token:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw new Error(`Failed to introspect token: ${error.message}`);
  }
}

/**
 * Middleware to verify bearer token
 */
const verifyToken = async (req, res, next) => {
  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || (!authHeader.startsWith('Bearer ') && !authHeader.startsWith('bearer '))) {
      const error = new Error('Authorization header with Bearer token is required');
      error.statusCode = 401;
      error.messageId = 'UNAUTHORIZED';

      console.log(`ERROR: Request headers=\n${JSON.stringify(req.headers)}`)
      throw error;
    }
    
    // Extract the token
    const token = authHeader.split(' ')[1];
    
    // Introspect the token
    const introspection = await introspectToken(token);
    
    // Check if the token is active
    if (!introspection.active) {
      const error = new Error('Invalid or expired token');
      error.statusCode = 401;
      error.messageId = 'INVALID_TOKEN';
      throw error;
    }
    
    // Add the token information to the request
    req.tokenInfo = introspection;
    
    // Continue to the next middleware or route handler
    next();
  } catch (err) {
    // If there's an error in the try block, it will be caught here
    if (!err.statusCode) {
      err.statusCode = 500;
      err.messageId = 'AUTH_ERROR';
    }
    next(err);
  }
};

module.exports = {
  verifyToken
};

// Made with Bob
