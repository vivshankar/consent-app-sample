/**
 * Response logging middleware for debugging
 */

/**
 * Middleware to log response headers and body
 */
const logResponse = (req, res, next) => {
  // Store the original send function
  const originalSend = res.send;
  const originalJson = res.json;
  
  // Override res.send
  res.send = function(data) {
    console.log('\n=== Response Details ===');
    console.log('Status Code:', res.statusCode);
    console.log('Headers:', JSON.stringify(res.getHeaders(), null, 2));
    console.log('Body:', typeof data === 'string' ? data : JSON.stringify(data, null, 2));
    console.log('========================\n');
    
    // Call the original send function
    originalSend.call(this, data);
  };
  
  // Override res.json
  res.json = function(data) {
    console.log('\n=== Response Details ===');
    console.log('Status Code:', res.statusCode);
    console.log('Headers:', JSON.stringify(res.getHeaders(), null, 2));
    console.log('Body:', JSON.stringify(data, null, 2));
    console.log('========================\n');
    
    // Call the original json function
    originalJson.call(this, data);
  };
  
  next();
};

module.exports = {
  logResponse
};

// Made with Bob
