/**
 * Test script for the consent page functionality
 * 
 * This script demonstrates how to:
 * 1. Create a JWT with scope array
 * 2. Generate a URL to the consent page
 * 3. Create a test endpoint to receive the user_response
 */

const jwt = require('jsonwebtoken');
const express = require('express');
const bodyParser = require('body-parser');

// Create a simple test server to receive the consent response
const testApp = express();
testApp.use(bodyParser.urlencoded({ extended: true }));
testApp.use(bodyParser.json());

// Endpoint to receive the consent response
testApp.post('/receive-consent', (req, res) => {
  console.log('\n=== Consent Response Received ===');
  console.log('user_response:', req.body.user_response);
  
  try {
    const userResponse = JSON.parse(req.body.user_response);
    console.log('\nParsed user choices:');
    Object.entries(userResponse).forEach(([scope, approved]) => {
      console.log(`  ${scope}: ${approved ? '✓ APPROVED' : '✗ DENIED'}`);
    });
  } catch (e) {
    console.error('Error parsing user_response:', e.message);
  }
  
  res.send(`
    <html>
      <head>
        <title>Consent Received</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
            background: #f5f5f5;
          }
          .success {
            background: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
            padding: 20px;
            border-radius: 8px;
          }
          pre {
            background: white;
            padding: 15px;
            border-radius: 4px;
            overflow-x: auto;
          }
        </style>
      </head>
      <body>
        <div class="success">
          <h2>✓ Consent Response Received Successfully!</h2>
          <p>The user's consent choices have been processed.</p>
          <h3>User Response:</h3>
          <pre>${JSON.stringify(JSON.parse(req.body.user_response), null, 2)}</pre>
        </div>
      </body>
    </html>
  `);
});

// Start the test server
const TEST_PORT = 3001;
testApp.listen(TEST_PORT, () => {
  console.log(`\n=== Test Server Started ===`);
  console.log(`Listening on http://localhost:${TEST_PORT}`);
  console.log(`Ready to receive consent responses at http://localhost:${TEST_PORT}/receive-consent\n`);
});

// Generate example JWT and URL
function generateExampleURL() {
  // Create a sample JWT with scope array
  const payload = {
    scope: [
      'read:profile',
      'write:profile',
      'read:email',
      'access:location',
      'send:notifications'
    ],
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour expiry
  };
  
  // Sign the JWT (using a simple secret for demo purposes)
  const secret = 'demo-secret-key';
  const token = jwt.sign(payload, secret);
  
  // Build the consent page URL
  const consentPageURL = new URL('http://localhost:3000/consent');
  consentPageURL.searchParams.set('consent_jwt', token);
  consentPageURL.searchParams.set('target', `http://localhost:${TEST_PORT}/receive-consent`);
  
  return {
    jwt: token,
    decodedPayload: payload,
    consentPageURL: consentPageURL.toString()
  };
}

// Display example usage
console.log('\n=== Consent Page Test Example ===\n');

const example = generateExampleURL();

console.log('1. JWT Token Generated:');
console.log(`   ${example.jwt}\n`);

console.log('2. Decoded JWT Payload:');
console.log(`   ${JSON.stringify(example.decodedPayload, null, 2)}\n`);

console.log('3. Consent Page URL:');
console.log(`   ${example.consentPageURL}\n`);

console.log('4. Instructions:');
console.log('   a. Make sure the main app is running on port 3000');
console.log('      Run: npm start');
console.log('   b. Open the consent page URL in your browser');
console.log('   c. Select/deselect the scopes you want to approve');
console.log('   d. Click "Submit" or "Deny All"');
console.log('   e. The response will be posted to this test server\n');

console.log('5. Quick Test:');
console.log(`   Open this URL in your browser:\n   ${example.consentPageURL}\n`);

// Made with Bob