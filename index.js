/**
 * Privacy and Consent API Server
 *
 * This server implements the basic and verify endpoints from the privacy_api.yml specification.
 */

// Import the server
const app = require('./src/server');

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Privacy and Consent API Server running on port ${PORT}`);
  console.log(`Available endpoints:`);
  console.log(`- POST /v1.0/basic/assessment`);
  console.log(`- POST /v1.0/basic/page_metadata`);
  console.log(`- POST /v1.0/basic/consents`);
  console.log(`- POST /v1.0/verify/assessment`);
  console.log(`- POST /v1.0/verify/page_metadata`);
  console.log(`- POST /v1.0/verify/consents`);
});

// Made with Bob
