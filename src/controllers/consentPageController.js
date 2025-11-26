const path = require('path');

/**
 * Handle GET request to display the consent page
 * Endpoint: GET /consent
 * Serves a static HTML file that handles everything client-side
 */
const showConsentPage = (req, res, next) => {
  try {
    // Serve the static HTML file
    res.sendFile(path.join(__dirname, '../views/consent.html'));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  showConsentPage
};

// Made with Bob