/**
 * Middleware for validating requests
 */

/**
 * Validates assessment and metadata requests
 */
const validatePrivacyRequest = (req, res, next) => {
  const { subjectId, items } = req.body;
  
  // Check required fields
  if (!subjectId) {
    return res.status(400).json({
      messageId: 'MISSING_SUBJECT_ID',
      messageDescription: 'Subject ID is required',
      extraInfo: null
    });
  }
  
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      messageId: 'MISSING_ITEMS',
      messageDescription: 'Items array is required and cannot be empty',
      extraInfo: null
    });
  }
  
  // Validate each item
  for (const item of items) {
    // If profileId is provided, other fields are optional
    if (item.profileId) {
      continue;
    }
    
    // Otherwise, purposeId is required
    if (!item.purposeId) {
      return res.status(400).json({
        messageId: 'MISSING_PURPOSE_ID',
        messageDescription: 'Purpose ID is required for each item when profile ID is not provided',
        extraInfo: null
      });
    }
  }
  
  next();
};

/**
 * Validates consent storage requests
 */
const validateConsentsRequest = (req, res, next) => {
  const consents = req.body;
  
  if (!Array.isArray(consents) || consents.length === 0) {
    console.log(`Missing consents:\n${JSON.stringify(req.body, null, 2)}`);
    return res.status(400).json({
      messageId: 'INVALID_CONSENTS',
      messageDescription: 'Request body must be a non-empty array of consent objects',
      extraInfo: null
    });
  }
  
  // Validate each consent
  for (let i = 0; i < consents.length; i++) {
    const consent = consents[i];
    
    if (!consent.subjectId) {
      return res.status(400).json({
        messageId: 'MISSING_SUBJECT_ID',
        messageDescription: `Subject ID is required for consent at index ${i}`,
        extraInfo: null
      });
    }
    
    if (!consent.purposeId) {
      return res.status(400).json({
        messageId: 'MISSING_PURPOSE_ID',
        messageDescription: `Purpose ID is required for consent at index ${i}`,
        extraInfo: null
      });
    }
  }
  
  next();
};

module.exports = {
  validatePrivacyRequest,
  validateConsentsRequest
};

// Made with Bob
