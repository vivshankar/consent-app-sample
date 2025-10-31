const {
  ConsentTypes,
  ConsentStatusTypes,
  AssessmentResponseStatus,
  StoreConsentResultStatus
} = require('../models/privacy');

// Import the IBM Verify Privacy SDK and auth utility
const Privacy = require('@ibm-verify/privacy');
const { getOAuthToken } = require('../utils/auth');

// Tenant configuration
const tenantUrl = process.env.VERIFY_TENANT_URL || 'https://example.verify.ibm.com';
const clientId = process.env.VERIFY_CLIENT_ID || 'your-client-id';
const clientSecret = process.env.VERIFY_CLIENT_SECRET || 'your-client-secret';

const InternalConsentTypes = {
  "allow": 1,
  "deny": 2,
  "opt_in": 3,
  "opt_out": 4,
  "transparent": 5
};

const ExternalConsentTypes = {
  1: "allow",
  2: "deny",
  3: "opt_in",
  4: "opt_out",
  5: "transparent"
};

const ExternalConsentDisplayTypes = {
  1: "do_not_show",
  2: "transparent",
  3: "opt_in_or_out",
  4: "allow_or_deny"
}

const ExternalConsentStatusTypes = {
  1: "active",
  2: "expired",
  3: "future",
  8: "none"
}

// re-use the access token for as long as possible
let accessToken = null;

/**
 * Initialize the Privacy client with a fresh OAuth token
 * @param {string} clientIp - Client IP address for context
 * @returns {Promise<void>}
 */
async function initPrivacyClient(clientIp, subjectId, isExternalSubject, forceTokenRefresh) {
  try {
    // Get OAuth token
    if (accessToken == null || forceTokenRefresh) {
      accessToken = await getOAuthToken(tenantUrl, clientId, clientSecret);
    }
    
    // Initialize the Privacy client with config, auth, and context objects
    let privacy = new Privacy(
      // Config object
      {
        tenantUrl
      },
      // Auth object with access token
      {
        accessToken
      },
      // Context object with client IP
      clientIp ? {
        ipAddress: clientIp,
        subjectId: subjectId,
        isExternalSubject: isExternalSubject,
      } : undefined
    );
    
    console.log('Privacy client initialized successfully');
    return privacy;
  } catch (error) {
    console.error('Failed to initialize Privacy client:', error);
    throw error;
  }
}

/**
 * Validate common request parameters
 * @param {Object} body - Request body
 * @returns {Object} - Error object if validation fails, null otherwise
 */
const validateRequest = (body) => {
  const { subjectId, items } = body;
  
  if (!subjectId || !items || !Array.isArray(items) || items.length === 0) {
    return {
      message: 'Invalid request: subjectId and items are required',
      statusCode: 400,
      messageId: 'INVALID_REQUEST'
    };
  }
  
  return null;
};

/**
 * Handle API errors with token refresh capability
 * @param {Function} apiCall - The API function to call
 * @param {Object} params - Parameters for the API call
 * @param {string} clientIp - Client IP address
 * @param {string} subjectId - Subject ID
 * @param {boolean} isExternalSubject - Whether the subject is external
 * @returns {Promise<Object>} - The API response
 * @throws {Error} - If the API call fails
 */
const executeWithTokenRefresh = async (apiCall, params, clientIp, subjectId, isExternalSubject) => {
  try {
    // Initialize privacy client
    let privacy = await initPrivacyClient(clientIp, subjectId, isExternalSubject, false);
    
    // Execute the API call
    const response = await apiCall(privacy, params);
    return response;
  } catch (apiError) {
    // If token expired, try to refresh and retry once
    if (apiError.statusCode === 401) {
      try {
        console.log('Access token expired, refreshing...');
        let privacy = await initPrivacyClient(clientIp, subjectId, isExternalSubject, true);
        
        // Retry the API call with new token
        const response = await apiCall(privacy, params);
        return response;
      } catch (retryError) {
        console.error('Retry failed after token refresh:', retryError);
        throw retryError;
      }
    }
    
    // Rethrow the original error
    console.error('Privacy API error:', apiError);
    const error = new Error(apiError.message || 'Error communicating with Privacy service');
    error.statusCode = apiError.statusCode || 500;
    error.messageId = apiError.messageId || 'PRIVACY_API_ERROR';
    error.extraInfo = apiError.extraInfo;
    throw error;
  }
};

/**
 * Handle assessment requests
 * Endpoint: POST /v1.0/verify/assessment
 */
const handleAssessment = async (req, res, next) => {
  try {
    const { subjectId, items, isExternalSubject, geoIP, sys } = req.body;
    const clientIp = geoIP || req.ip;
    
    // Validate request
    const validationError = validateRequest(req.body);
    if (validationError) {
      const error = new Error(validationError.message);
      error.statusCode = validationError.statusCode;
      error.messageId = validationError.messageId;
      throw error;
    }
    
    // Define the API call function
    const assessCall = async (privacy, params) => {
      let response = await privacy.assess(params.items);
      if (response.assessment) {
        response.assessment.forEach(item => {
          if (item.result && item.result.length > 0) {
            item.result = item.result[0]
          }
        });
      }
      
      console.log(`DEBUG: assessmentResponse=\n${JSON.stringify(response, null, 2)}`);
      return response;
    };
    
    // Execute the API call with token refresh capability
    const assessmentResponse = await executeWithTokenRefresh(
      assessCall,
      { items },
      clientIp,
      subjectId,
      isExternalSubject
    );
    
    res.json(assessmentResponse);
  } catch (err) {
    next(err);
  }
};

/**
 * Handle page metadata requests
 * Endpoint: POST /v1.0/verify/page_metadata
 */
const handlePageMetadata = async (req, res, next) => {
  try {
    const { subjectId, items, isExternalSubject, geoIP, sys } = req.body;
    const clientIp = geoIP || req.ip;
    const acceptLanguage = req.headers['accept-language'];
    
    // Validate request
    const validationError = validateRequest(req.body);
    if (validationError) {
      const error = new Error(validationError.message);
      error.statusCode = validationError.statusCode;
      error.messageId = validationError.messageId;
      throw error;
    }
    
    // Define the API call function
    const metadataCall = async (privacy, params) => {
      let response = await privacy.getConsentMetadata(params.items, {
        "accept-language": params.acceptLanguage,
      });
      
      // replace eula with document
      if (response.metadata && response.metadata.eula) {
        response.metadata.document = response.metadata.eula;
        delete response.metadata.eula;
      }

      // replace the consent type with the correct consent display type value
      if (response.metadata && response.metadata.default) {
        response.metadata.default.forEach(item => {
          item.consentType = ExternalConsentDisplayTypes[item.consentType];
          if (item.consent) {
            item.consent.state = ExternalConsentTypes[item.consent.state];
            item.consent.status = ExternalConsentStatusTypes[item.consent.status];
          }
        });
      }
      
      return response;
    };
    
    // Execute the API call with token refresh capability
    const metadataResponse = await executeWithTokenRefresh(
      metadataCall,
      { items, acceptLanguage },
      clientIp,
      subjectId,
      isExternalSubject
    );
    
    res.json(metadataResponse);
  } catch (err) {
    next(err);
  }
};

/**
 * Process consent store response to transform it to the expected format
 * @param {Object} storeResponse - The response from the privacy.storeConsents call
 * @returns {Object} - The processed response
 */
const processConsentStoreResponse = (storeResponse) => {
  if (storeResponse.results) {
    console.log(`DEBUG: going to map`);
    storeResponse.results.forEach(result => {
      if (result.value) {
        result.value.state = ExternalConsentTypes[result.value.state];
        result.consent = result.value;
        delete result.value;
      }
      
      delete result.op;

      if (result.error && result.error != "") {
        let messageId = "unknown";
        let description = result.error;
        if (result.error.startsWith("CS")) {
          const delimiterIndex = result.error.indexOf(" ");
          messageId = result.error.substring(0, delimiterIndex);
          description = result.error.substring(delimiterIndex + 1);
        }

        result.error = {
          "messageId": messageId,
          "messageDescription": description,
        };
      }
    });
  }
  
  console.log(`DEBUG: storeResponse=\n${JSON.stringify(storeResponse, null, 2)}`);
  return storeResponse;
};

/**
 * Validate consent request
 * @param {Array} consents - Array of consent objects
 * @returns {Object} - Error object if validation fails, null otherwise
 */
const validateConsentsRequest = (consents) => {
  if (!Array.isArray(consents) || consents.length === 0) {
    return {
      message: 'Invalid request: array of consents is required',
      statusCode: 400,
      messageId: 'INVALID_REQUEST'
    };
  }
  
  return null;
};

/**
 * Process consents to prepare them for storage
 * @param {Array} consents - Array of consent objects
 * @param {string} initialClientIp - Initial client IP
 * @returns {Object} - Processed consents and client IP
 */
const processConsents = (consents, initialClientIp) => {
  let clientIp = initialClientIp;
  
  const processedConsents = consents.map(consent => {
    // Ensure required fields are present
    if (!consent.subjectId || !consent.purposeId) {
      throw new Error('subjectId and purposeId are required for each consent');
    }
    
    // Return the consent object with default values if needed
    consent.state = InternalConsentTypes[consent.state];
    if (consent.geoIP && consent.geoIP != "") {
      clientIp = consent.geoIP;
    }

    // set these as global consents
    consent.isGlobal = true;
    
    return {
      ...consent,
      isExternalSubject: consent.isExternalSubject !== undefined ? consent.isExternalSubject : false
    };
  });
  
  return { processedConsents, clientIp };
};

/**
 * Handle consent storage requests
 * Endpoint: POST /v1.0/verify/consents
 */
const handleConsents = async (req, res, next) => {
  try {
    // The request body is an array of consent objects
    let consents = req.body;
    let clientIp = req.ip;
    
    // Validate request
    const validationError = validateConsentsRequest(consents);
    if (validationError) {
      console.log(`Invalid request with body:\n${JSON.stringify(req.body)}`);
      const error = new Error(validationError.message);
      error.statusCode = validationError.statusCode;
      error.messageId = validationError.messageId;
      throw error;
    }

    // Process consents to ensure required fields
    const { processedConsents, clientIp: updatedClientIp } = processConsents(consents, clientIp);
    clientIp = updatedClientIp;
    
    // Define the API call function
    const storeConsentsCall = async (privacy, params) => {
      const response = await privacy.storeConsents(params.processedConsents);
      return processConsentStoreResponse(response);
    };
    
    // Execute the API call with token refresh capability
    const storeResponse = await executeWithTokenRefresh(
      storeConsentsCall,
      { processedConsents },
      clientIp,
      null,
      null
    );
    
    // Return appropriate status code based on results
    const hasFailures = storeResponse.status == "error" ||
                        storeResponse.results.some(result => result.result === StoreConsentResultStatus.FAILURE);
    
    res.status(hasFailures ? 207 : 200).json(storeResponse);
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
