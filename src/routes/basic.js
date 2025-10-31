const express = require('express');
const router = express.Router();
const basicController = require('../controllers/basicController');
const { validatePrivacyRequest, validateConsentsRequest } = require('../middleware/validation');

/**
 * @route POST /v1.0/basic/assessment
 * @desc Assess privacy requirements for a subject
 */
router.post('/assessment', validatePrivacyRequest, basicController.handleAssessment);

/**
 * @route POST /v1.0/basic/page_metadata
 * @desc Get consent presentation metadata
 */
router.post('/page_metadata', validatePrivacyRequest, basicController.handlePageMetadata);

/**
 * @route POST /v1.0/basic/consents
 * @desc Store user consent records
 */
router.post('/consents', validateConsentsRequest, basicController.handleConsents);

module.exports = router;

// Made with Bob
