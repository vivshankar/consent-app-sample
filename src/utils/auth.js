/**
 * Utility functions for authentication with IBM Verify
 */
const axios = require('axios');
const qs = require('querystring');

/**
 * Get an OAuth access token using client credentials grant flow
 * @param {string} tenantUrl - The IBM Verify tenant URL
 * @param {string} clientId - The client ID
 * @param {string} clientSecret - The client secret
 * @returns {Promise<string>} - The access token
 */
async function getOAuthToken(tenantUrl, clientId, clientSecret) {
  try {
    // Ensure the tenant URL doesn't end with a slash
    const baseUrl = tenantUrl.endsWith('/') ? tenantUrl.slice(0, -1) : tenantUrl;
    
    // Prepare the request data
    const data = qs.stringify({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret
    });
    
    // Make the request to the OAuth token endpoint
    const response = await axios({
      method: 'post',
      url: `${baseUrl}/oauth2/token`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data
    });
    
    // Return the access token
    return response.data.access_token;
  } catch (error) {
    console.error('Error getting OAuth token:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw new Error(`Failed to get OAuth token: ${error.message}`);
  }
}

module.exports = {
  getOAuthToken
};

// Made with Bob
