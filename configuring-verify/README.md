# Configuring IBM Verify for External Consent Providers

This guide walks you through configuring IBM Verify to use this Node.js application as an external consent provider. Use the accompanying Postman collection (`external-consent-providers.postman_collection.json`) for API requests.

## Overview

Three configuration steps are required:

1. Create a webhook pointing to this Node.js application
2. Create a consent provider referencing the webhook
3. Update your OIDC application with the consent provider

The outcome of this configuration will allow an OIDC application to use the Node.js application as an external consent provider. While the Node.js application also supports a IBM Verify consent store, note that this does not necessarily have to be the same tenant that your OIDC application uses as the identity provider.

The diagram below illustrates this.

![External consent provider architecture](images/architecture.png)

## Prerequisites

- IBM Verify tenant with administrative access
- Valid access token issued by the IBM Verify tenant that is configured in the `.env` file of the Node.js application
- This Node.js application running and accessible
  - If you are running this application locally, you can use ngrok and other such tools to make the application accessible through the Internet. This is for development purposes ONLY.
- API client credentials for webhook authentication: This just needs to be a valid token, so any API client on the IBM Verify tenant can be used
- API client credentials for the Postman collection: This requires the following entitlements -
  - Manage privacy consent providers (managePrivacyConsentProvider): This is for the Configuration section
  - Manage webhooks (manageWebhooks): This is for the Configuration section
  - Create privacy consent records (createPrivacyConsent): This is to test the runtime APIs
  - Retrieve privacy purposes and associated user's consent (performDSP): This is to test the runtime APIs
  - Check for data usage approval (performDUA): This is to test the runtime APIs

## Configuration Steps

### Step 1: Create a Webhook

**Postman Request:** `Configuration > Consent provider webhook > Create webhook`

Configure the webhook to point to this Node.js application:
- Set `urls` to your application's base URL
- Configure OAuth authentication with your client credentials
- Verify the `resources` endpoints match the `/v1.0/verify/*` routes in this application

**Save the webhook `id`** from the response for Step 2.

### Step 2: Create a Consent Provider

**Postman Request:** `Configuration > Consent provider > Create consent provider`

Create the consent provider configuration:
- Set `webhookId` to the ID from Step 1
- Set `enabled` to `true`

**Save the consent provider `id`** from the response for Step 3.

### Step 3: Update OIDC Application

**Postman Request:** `Configuration > Application > Update application`

Update your OIDC application:
- Add the `consentProvider` property with the ID from Step 2

## Testing the Configuration

Test each webhook endpoint individually using the runtime requests in the Postman collection.

**Postman Requests:** `Runtime > [endpoint test requests]`

For each test request:
1. Set the `:id` path variable to your **consent provider ID** from Step 2
2. Execute the request to invoke the corresponding webhook endpoint

The runtime APIs will trigger calls to your configured webhook endpoints, allowing you to verify:
- Webhook authentication is working
- Endpoints are reachable and responding correctly
- Data transformation is functioning as expected

## Application Endpoints

This Node.js application implements the required `/v1.0/verify` endpoints:

- `/v1.0/verify/consents` - Record consent decisions
- `/v1.0/verify/page_metadata` - Provide consent page metadata
- `/v1.0/verify/assessment` - Handle data use assessments
- `/health` - Health check endpoint

**Note:** These endpoints serve as a reference implementation. For production use, integrate these endpoints with your actual consent management system.

## Next Steps

To integrate with a real consent management system:

1. Modify the `/v1.0/verify/*` endpoint handlers in this application
2. Connect to your consent management system's APIs
3. Transform data between IBM Verify's format and your system's format
4. Update the webhook configuration if endpoint paths change

## Resources

- Postman Collection: `External consent providers.postman_collection.json`
- Application Routes: `src/routes/verify.js`
- IBM Verify Documentation: [https://docs.verify.ibm.com](https://docs.verify.ibm.com)