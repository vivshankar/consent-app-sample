/**
 * Simple test script for the Privacy and Consent API Server
 * 
 * This script tests the three main endpoints:
 * - /v1.0/example/assessment
 * - /v1.0/example/page_metadata
 * - /v1.0/example/consents
 * 
 * Run this script after starting the server with: node index.js
 */

const http = require('http');

// Configuration
const HOST = 'localhost';
const PORT = 3000;
const SUBJECT_ID = 'test-user-' + Date.now();

// Helper function to make HTTP requests
function makeRequest(path, method, data) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: HOST,
      port: PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData
          });
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e.message}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Test functions
async function testPageMetadata() {
  console.log('\n=== Testing /v1.0/example/page_metadata ===');
  
  const requestData = {
    subjectId: SUBJECT_ID,
    isExternalSubject: false,
    items: [
      { purposeId: 'terms-of-service' },
      { purposeId: 'privacy-policy' },
      { purposeId: 'marketing', accessTypeId: 'email', attributeId: 'email_address' }
    ]
  };
  
  try {
    const response = await makeRequest('/v1.0/example/page_metadata', 'POST', requestData);
    console.log(`Status Code: ${response.statusCode}`);
    console.log('Response Data:');
    console.log(JSON.stringify(response.data, null, 2));
    return response;
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
}

async function testConsents() {
  console.log('\n=== Testing /v1.0/example/consents ===');
  
  const requestData = [
    {
      subjectId: SUBJECT_ID,
      purposeId: 'terms-of-service',
      state: 'allow',
      isExternalSubject: false
    },
    {
      subjectId: SUBJECT_ID,
      purposeId: 'marketing',
      accessTypeId: 'email',
      attributeId: 'email_address',
      state: 'opt_in',
      isExternalSubject: false
    }
  ];
  
  try {
    const response = await makeRequest('/v1.0/example/consents', 'POST', requestData);
    console.log(`Status Code: ${response.statusCode}`);
    console.log('Response Data:');
    console.log(JSON.stringify(response.data, null, 2));
    return response;
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
}

async function testAssessment() {
  console.log('\n=== Testing /v1.0/example/assessment ===');
  
  const requestData = {
    subjectId: SUBJECT_ID,
    isExternalSubject: false,
    items: [
      { purposeId: 'terms-of-service' },
      { purposeId: 'marketing', accessTypeId: 'email', attributeId: 'email_address' }
    ]
  };
  
  try {
    const response = await makeRequest('/v1.0/example/assessment', 'POST', requestData);
    console.log(`Status Code: ${response.statusCode}`);
    console.log('Response Data:');
    console.log(JSON.stringify(response.data, null, 2));
    return response;
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
}

// Run all tests
async function runTests() {
  console.log('Starting tests for Privacy and Consent API Server...');
  
  try {
    // First, get metadata
    await testPageMetadata();
    
    // Then, store consents
    await testConsents();
    
    // Finally, check assessment (should be approved now)
    await testAssessment();
    
    console.log('\n=== All tests completed successfully ===');
  } catch (error) {
    console.error('\n=== Test failed ===');
    console.error(error);
  }
}

// Run the tests
runTests();

// Made with Bob
