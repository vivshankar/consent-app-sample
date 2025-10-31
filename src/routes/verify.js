const express = require('express');
const router = express.Router();
const verifyController = require('../controllers/verifyController');
const { validatePrivacyRequest, validateConsentsRequest } = require('../middleware/validation');
const { verifyToken } = require('../middleware/auth');
const { logResponse } = require('../middleware/responseLogger');

/**
 * Apply authentication middleware to all routes in this router
 * This ensures all /v1.0/verify endpoints require OAuth authentication
 */
router.use(verifyToken);

/**
 * Apply response logging middleware to all routes in this router
 * This logs response headers and body for debugging
 */
router.use(logResponse);

/**
 * @route POST /v1.0/verify/assessment
 * @desc Assess privacy requirements for a subject using Verify
 * @security BearerAuth
 */
router.post('/assessment', validatePrivacyRequest, verifyController.handleAssessment);

/**
 * @route POST /v1.0/verify/page_metadata
 * @desc Get consent presentation metadata using Verify
 * @security BearerAuth
 */
router.post('/page_metadata', validatePrivacyRequest, verifyController.handlePageMetadata);

/**
 * @route POST /v1.0/verify/consents
 * @desc Store user consent records using Verify
 * @security BearerAuth
 */
router.post('/consents', validateConsentsRequest, verifyController.handleConsents);

module.exports = router;

// Made with Bob
