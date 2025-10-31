/**
 * Models for the Privacy API based on the OpenAPI specification
 */

// Enum definitions
const ConsentDisplayTypes = {
  DO_NOT_SHOW: 'do_not_show',
  TRANSPARENT: 'transparent',
  OPT_IN_OR_OUT: 'opt_in_or_out',
  ALLOW_OR_DENY: 'allow_or_deny'
};

const ConsentTypes = {
  ALLOW: 'allow',
  DENY: 'deny',
  OPT_IN: 'opt_in',
  OPT_OUT: 'opt_out',
  TRANSPARENT: 'transparent'
};

const ConsentStatusTypes = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  FUTURE: 'future',
  NONE: 'none'
};

const AssessmentResponseStatus = {
  APPROVED: 'approved',
  NEEDS_CONSENT: 'needs_consent',
  MULTISTATUS: 'multistatus',
  DENIED: 'denied',
  UNKNOWN: 'unknown'
};

const StoreConsentResultStatus = {
  SUCCESS: 'success',
  FAILURE: 'failure'
};

// Sample data for demonstration purposes
const sampleData = {
  // Sample documents
  documents: [
    {
      purposeId: 'terms-of-service',
      purposeName: 'Terms of Service',
      purposeDescription: 'Our terms of service agreement',
      defaultConsentDuration: 31536000, // 1 year in seconds
      assentUIDefault: true,
      consentType: ConsentDisplayTypes.ALLOW_OR_DENY,
      documentURL: 'https://example.com/terms',
      status: ConsentStatusTypes.ACTIVE
    },
    {
      purposeId: 'privacy-policy',
      purposeName: 'Privacy Policy',
      purposeDescription: 'Our privacy policy',
      defaultConsentDuration: 31536000, // 1 year in seconds
      assentUIDefault: true,
      consentType: ConsentDisplayTypes.TRANSPARENT,
      documentURL: 'https://example.com/privacy',
      status: ConsentStatusTypes.ACTIVE
    }
  ],
  
  // Sample purposes
  purposes: [
    {
      purposeId: 'marketing',
      purposeName: 'Marketing Communications',
      purposeDescription: 'Allow us to send you marketing communications',
      accessTypeId: 'email',
      accessType: 'Email',
      attributeId: 'email_address',
      attributeName: 'Email Address',
      defaultConsentDuration: 31536000, // 1 year in seconds
      assentUIDefault: false,
      consentType: ConsentDisplayTypes.OPT_IN_OR_OUT,
      status: ConsentStatusTypes.NONE
    },
    {
      purposeId: 'analytics',
      purposeName: 'Analytics',
      purposeDescription: 'Allow us to collect usage data for analytics',
      accessTypeId: 'collect',
      accessType: 'Collect',
      attributeId: 'usage_data',
      attributeName: 'Usage Data',
      defaultConsentDuration: 31536000, // 1 year in seconds
      assentUIDefault: true,
      consentType: ConsentDisplayTypes.OPT_IN_OR_OUT,
      status: ConsentStatusTypes.NONE
    }
  ],
  
  // Sample consents (stored user consents)
  consents: {}
};

module.exports = {
  ConsentDisplayTypes,
  ConsentTypes,
  ConsentStatusTypes,
  AssessmentResponseStatus,
  StoreConsentResultStatus,
  sampleData
};

// Made with Bob
