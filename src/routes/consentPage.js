const express = require('express');
const router = express.Router();
const consentPageController = require('../controllers/consentPageController');

/**
 * @route GET /consent
 * @desc Display the consent page with scopes from consent_jwt query parameter
 * @query consent_jwt - JWT containing scope array
 * @query target - URL to POST user_response to after submission
 */
router.get('/', consentPageController.showConsentPage);

module.exports = router;

// Made with Bob