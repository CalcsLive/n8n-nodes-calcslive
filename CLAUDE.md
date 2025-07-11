# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository contains the `n8n-nodes-calcslive` custom n8n node that wraps the CalcsLive calculation API to provide better user experience than raw HTTP Request nodes in n8n workflows.

**Status**: ✅ **COMPLETED AND FUNCTIONAL**
- Node successfully integrates with CalcsLive API
- Tested and working in local n8n environment
- Proper JSON parsing for inputs/outputs
- Custom PNG icon implemented
- Full error handling and validation

## Development Commands

### Setup and Build
```bash
npm install
npm run build

# Link for local testing
npm link

# In n8n instance, link the node
npm link n8n-nodes-calcslive

# Start n8n with custom node
n8n start
```

### Development Workflow
```bash
# Watch mode for development
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Package for distribution
npm pack
```

## Project Structure

```
n8n-nodes-calcslive/
├── package.json                     # Node registration and dependencies
├── tsconfig.json                    # TypeScript configuration
├── nodes/
│   └── CalcsLive/
│       ├── CalcsLive.node.ts        # Main node logic and API integration
│       ├── CalcsLive.node.json      # Node UI definition and metadata
│       └── calcslive.svg            # Node icon
├── credentials/
│   └── CalcsLiveApi.credentials.ts  # API key credential management
└── README.md                        # Installation and usage instructions
```

## API Integration Details

**Endpoint**: `https://www.calcs.live/api/n8n/calculate` (POST)
**Authentication**: API key required
**Rate Limiting**: 60 requests/minute for n8n endpoints

### Request Format
```json
{
  "articleId": "3LYPD4C96-34U",         /* your calcID */
  "apiKey": "embed_fd624bxxxxxxxx...",  /* your-api-key */
  "inputs": {
    "x": { "value": 150, "unit": "km" },
    "y": { "value": 2, "unit": "h" }
  },
  "outputs": { "s": { "unit": "km/h" } }
}
```

### Response Format
```json
{
  "status": "success",
  "inputs": {
    "x": { "symbol": "x", "value": 150, "unit": "km", "baseValue": 150000, "baseUnit": "m" },
    "y": { "symbol": "y", "value": 2, "unit": "h", "baseValue": 7200, "baseUnit": "s" }
  },
  "outputs": {
    "s": { "symbol": "s", "value": 75, "unit": "km/h", "baseValue": 20.833, "baseUnit": "m/s", "expression": "x/y" }
  },
  "timestamp": "2025-01-09T10:15:00.000Z"
}
```

## Node Implementation Requirements

### Node Interface
✅ **IMPLEMENTED AND TESTED**
- **Article ID input** (string, required): Calculation article identifier (e.g., "3LYPD4C96-34U")
- **Inputs field** (JSON, required): Physical quantities with values and units - **FIXED**: Now properly parses JSON strings
- **Outputs field** (JSON, optional): Desired output units - **FIXED**: Now properly parses JSON strings
- **Credential management**: Secure API key storage with base URL configuration
- **Custom icon**: PNG image support implemented

### Error Handling Requirements
✅ **FULLY IMPLEMENTED**
- **401**: Invalid API key - Clear error message
- **404**: Article not found - Descriptive error message  
- **400**: Invalid units or malformed request - JSON validation with helpful messages
- **429**: Rate limit exceeded - Rate limit warning
- **5xx**: Server errors - Generic server error handling
- **JSON parsing errors**: Specific validation for inputs/outputs JSON format

### Implementation Status
✅ **COMPLETED MVP SCOPE**
- Simple text input for article ID ✅
- JSON input for units with proper parsing ✅
- Basic validation of required fields ✅
- Clear error messages for common issues ✅
- Structured output data for downstream nodes ✅
- Custom PNG icon support ✅

## Testing Strategy

### Core Test Cases
✅ **ALL TESTS PASSED**
- **Happy Path**: Valid article ID, inputs, and outputs - **WORKING**
- **Authentication**: Invalid API key handling - **WORKING**
- **Validation**: Missing required fields, malformed JSON - **WORKING**
- **API Errors**: Non-existent articles, invalid units - **WORKING**
- **Integration**: Chaining with other n8n nodes - **READY**

### Example Workflows
✅ **TESTED AND WORKING**
1. **Speed Calculator**: Manual trigger → CalcsLive → Set node - **FUNCTIONAL**
2. **Batch Processing**: Google Sheets → CalcsLive → Email results - **READY**
3. **API Integration**: Webhook → CalcsLive → Database storage - **READY**

## Development Notes

### Key Files Implemented
✅ **ALL CORE FILES COMPLETED**
1. **CalcsLive.node.ts**: Main execution logic, API calls, error handling - **COMPLETED**
2. **CalcsLive.node.json**: UI field definitions, node metadata - **COMPLETED**
3. **CalcsLiveApi.credentials.ts**: Credential field definitions - **COMPLETED**
4. **package.json**: n8n node registration, dependencies, scripts - **COMPLETED**
5. **gulpfile.js**: Asset management for icons (PNG support) - **COMPLETED**
6. **tsconfig.json**: TypeScript configuration - **COMPLETED**

### n8n Integration Points
✅ **SUCCESSFULLY IMPLEMENTED**
- Use n8n's `INodeExecutionData` for input/output data structure - **IMPLEMENTED**
- Implement `ICredentialDataDecryptedObject` for API key access - **IMPLEMENTED**
- Use n8n's HTTP request helpers for API calls - **IMPLEMENTED**
- Follow n8n's error handling patterns with `NodeOperationError` - **IMPLEMENTED**
- JSON parsing and validation for complex inputs - **IMPLEMENTED**
- Custom PNG icon support - **IMPLEMENTED**

### Business Context
✅ **READY FOR DEPLOYMENT**
This node enables CalcsLive integration with 400+ business tools through n8n's ecosystem, expanding market reach and providing viral growth opportunities through shared workflows.

**Next Steps:**
1. Publish to npm registry
2. Submit to n8n community nodes
3. Create documentation and examples
4. Marketing and user adoption

## Claude Response Format
Please start each of your response with:
"Msg. #{{#}} @{{timestamp}}"
where {{#}} is the current message number (starting at 1 and incrementing for each of your messages),  
and {{timestamp}} is the current date and time in ISO 8601 format (YYYY-MM-DDTHH:MM:SS).