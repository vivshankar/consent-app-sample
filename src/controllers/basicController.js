const { 
  ConsentTypes, 
  ConsentStatusTypes, 
  AssessmentResponseStatus, 
  StoreConsentResultStatus,
  sampleData 
} = require('../models/privacy');

// In-memory storage for consents
const consentStore = sampleData.consents;

/**
 * Handle assessment requests
 * Endpoint: POST /v1.0/basic/assessment
 */
const handleAssessment = (req, res, next) => {
  try {
    const { subjectId, items } = req.body;
    
    if (!subjectId || !items || !Array.isArray(items) || items.length === 0) {
      const error = new Error('Invalid request: subjectId and items are required');
      error.statusCode = 400;
      error.messageId = 'INVALID_REQUEST';
      throw error;
    }
    
    // Process each item in the request
    const assessments = items.map(item => {
      const { purposeId, accessTypeId, attributeId, attributeValue } = item;
      
      // Check if there's an existing consent for this item
      const consentKey = `${subjectId}:${purposeId}:${accessTypeId || ''}:${attributeId || ''}:${attributeValue || ''}`;
      const existingConsent = consentStore[consentKey];
      
      // Default decision if no consent exists
      const decision = {
        approved: false,
        approvalRequired: true,
        promptForConsent: true,
        reason: null
      };
      
      // If consent exists, check its status and state
      if (existingConsent) {
        const now = Math.floor(Date.now() / 1000);
        
        // determine the status of the consent
        if (now >= existingConsent.startTime && now <= existingConsent.endTime) {
            existingConsent.status = ConsentStatusTypes.ACTIVE;
        } else if (now < existingConsent.startTime) {
            existingConsent.status = ConsentStatusTypes.FUTURE;
        } else {
            existingConsent.status = ConsentStatusTypes.EXPIRED;
        }
        
        if (existingConsent.status === ConsentStatusTypes.ACTIVE) {
          
          // Check consent state
          if ([ConsentTypes.ALLOW, ConsentTypes.OPT_IN, ConsentTypes.TRANSPARENT].includes(existingConsent.state)) {
            decision.approved = true;
            decision.approvalRequired = false;
            decision.promptForConsent = false;
          } else {
            decision.approved = false;
            decision.approvalRequired = false;
            decision.promptForConsent = true;
            decision.reason = {
              messageId: 'CONSENT_DENIED',
              messageDescription: 'User has explicitly denied consent',
              extraInfo: null
            };
          }
        } else if (existingConsent.status === ConsentStatusTypes.FUTURE) {
          decision.approved = false;
          decision.approvalRequired = false;
          decision.promptForConsent = false;
          decision.reason = {
            messageId: 'CONSENT_FUTURE',
            messageDescription: 'Consent will be active in the future',
            extraInfo: null
          };
        } else if (existingConsent.status === ConsentStatusTypes.EXPIRED) {
          decision.approved = false;
          decision.approvalRequired = false;
          decision.promptForConsent = true;
          decision.reason = {
            messageId: 'CONSENT_EXPIRED',
            messageDescription: 'Consent has expired',
            extraInfo: null
          };
        }
      }
      
      return {
        purposeId,
        accessTypeId,
        attributeId,
        attributeValue,
        result: decision
      };
    });
    
    // Determine overall status
    let status = AssessmentResponseStatus.UNKNOWN;
    
    const allApproved = assessments.every(a => a.result.approved);
    const allDenied = assessments.every(a => !a.result.approved && !a.result.promptForConsent);
    const someNeedConsent = assessments.some(a => a.result.promptForConsent);
    const someApprovedSomeDenied = assessments.some(a => a.result.approved) && 
                                  assessments.some(a => !a.result.approved && !a.result.promptForConsent);
    
    if (allApproved) {
      status = AssessmentResponseStatus.APPROVED;
    } else if (someNeedConsent) {
      status = AssessmentResponseStatus.NEEDS_CONSENT;
    } else if (someApprovedSomeDenied) {
      status = AssessmentResponseStatus.MULTISTATUS;
    } else if (allDenied) {
      status = AssessmentResponseStatus.DENIED;
    }
    
    res.json({
      status,
      assessment: assessments
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Handle page metadata requests
 * Endpoint: POST /v1.0/basic/page_metadata
 */
const handlePageMetadata = (req, res, next) => {
  try {
    const { subjectId, items } = req.body;
    
    if (!subjectId || !items || !Array.isArray(items) || items.length === 0) {
      const error = new Error('Invalid request: subjectId and items are required');
      error.statusCode = 400;
      error.messageId = 'INVALID_REQUEST';
      throw error;
    }
    
    const documentMetadata = [];
    const defaultMetadata = [];
    const unhandled = [];
    
    // Process each item in the request
    items.forEach(item => {
      const { profileId, purposeId } = item;
      
      // Handle document consents (e.g., terms of service, privacy policy)
      const documentMatch = sampleData.documents.find(doc => doc.purposeId === purposeId);
      if (documentMatch) {
        // Check if there's an existing consent for this document
        const consentKey = `${subjectId}:${purposeId}:::`;
        const existingConsent = consentStore[consentKey];
        
        const docMetadata = {
          ...documentMatch,
          consent: existingConsent ? {
            startTime: existingConsent.startTime,
            endTime: existingConsent.endTime,
            isGlobal: existingConsent.isGlobal,
            state: existingConsent.state,
            geoIP: existingConsent.geoIP,
            customAttributes: existingConsent.customAttributes,
            subjectId: existingConsent.subjectId,
            isExternalSubject: existingConsent.isExternalSubject
          } : null
        };
        
        documentMetadata.push(docMetadata);
        return;
      }
      
      // Handle purpose-based consents (e.g., marketing, analytics)
      const consentKey = `${subjectId}:${item.purposeId}:${item.accessTypeId || ''}:${item.attributeId || ''}:${item.attributeValue || ''}`;
      const existingConsent = consentStore[consentKey];
        
      const purposeMetadata = {
          ...item,
          consent: existingConsent ? {
            startTime: existingConsent.startTime,
            endTime: existingConsent.endTime,
            isGlobal: existingConsent.isGlobal,
            state: existingConsent.state,
            geoIP: existingConsent.geoIP,
            customAttributes: existingConsent.customAttributes,
            subjectId: existingConsent.subjectId,
            isExternalSubject: existingConsent.isExternalSubject
          } : null
      };
        
      defaultMetadata.push(purposeMetadata);
      return;
    });
    
    res.json({
      metadata: {
        document: documentMetadata,
        default: defaultMetadata
      },
      unhandled
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Handle consent storage requests
 * Endpoint: POST /v1.0/basic/consents
 */
const handleConsents = (req, res, next) => {
  try {
    // The request body is an array of consent objects
    const consents = req.body;
    
    if (!Array.isArray(consents) || consents.length === 0) {
      const error = new Error('Invalid request: array of consents is required');
      error.statusCode = 400;
      error.messageId = 'INVALID_REQUEST';
      throw error;
    }
    
    const results = [];
    let hasFailures = false;
    
    // Process each consent in the request
    consents.forEach(consent => {
      try {
        const { 
          id, purposeId, accessTypeId, attributeId, attributeValue, 
          startTime, endTime, isGlobal, status, state, 
          geoIP, customAttributes, subjectId, isExternalSubject 
        } = consent;
        
        if (!subjectId || !purposeId) {
          throw new Error('subjectId and purposeId are required');
        }
        
        // Create a unique key for this consent
        const consentKey = `${subjectId}:${purposeId}:${accessTypeId || ''}:${attributeId || ''}:${attributeValue || ''}`;
        
        // Store the consent
        const now = Math.floor(Date.now() / 1000);
        const storedConsent = {
          id: id || `consent-${Date.now()}`,
          purposeId,
          accessTypeId: accessTypeId || null,
          attributeId: attributeId || null,
          attributeValue: attributeValue || null,
          startTime: startTime || now,
          endTime: endTime || (now + 31536000), // Default to 1 year if not specified
          isGlobal: isGlobal !== undefined ? isGlobal : false,
          status: status || ConsentStatusTypes.ACTIVE,
          state: state || ConsentTypes.ALLOW,
          geoIP: geoIP || req.ip,
          customAttributes: customAttributes || {},
          subjectId,
          isExternalSubject: isExternalSubject !== undefined ? isExternalSubject : false
        };
        
        // Save to our in-memory store
        consentStore[consentKey] = storedConsent;
        
        results.push({
          result: StoreConsentResultStatus.SUCCESS,
          path: `/v1.0/basic/consents/${storedConsent.id}`,
          consent: storedConsent
        });
      } catch (err) {
        hasFailures = true;
        results.push({
          result: StoreConsentResultStatus.FAILURE,
          error: {
            messageId: 'CONSENT_STORE_ERROR',
            messageDescription: err.message,
            extraInfo: null
          }
        });
      }
    });
    
    // Return appropriate status code based on results
    if (hasFailures) {
      res.status(207).json({ results });
    } else {
      res.status(200).json({ results });
    }
  } catch (err) {
    next(err);
  }
};

module.exports = {
  handleAssessment,
  handlePageMetadata,
  handleConsents
};

// Made with Bob
