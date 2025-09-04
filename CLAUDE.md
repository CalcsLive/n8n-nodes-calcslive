# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository contains the `n8n-nodes-calcslive` custom n8n node that wraps the CalcsLive calculation API to provide better user experience than raw HTTP Request nodes in n8n workflows.

**Status**: 🟢 **PUBLISHED TO NPM - Production Ready**
- Package: `@calcslive/n8n-nodes-calcslive` v0.1.1
- NPM: ✅ Published and available for installation
- GitHub: ✅ Repository available at https://github.com/calcslive/n8n-nodes-calcslive
- Legacy mode: ✅ Fully functional with manual JSON input/output
- Enhanced mode: 🟡 FixedCollection UI implemented, needs completion
- Dynamic PQ loading: ✅ Responds to articleId changes
- API integration: ✅ Full error handling and validation
- Custom PNG icon: ✅ Implemented

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

### Configuration Modes

#### Legacy Mode ✅ **FULLY FUNCTIONAL**
- **Manual JSON input/output**: Direct JSON configuration for all PQs
- **Works with any calc**: No hardcoded assumptions about PQ structure
- **Full API compatibility**: Supports all inputs/outputs patterns
- **Example**: `{"D": {"value": 360, "unit": "km"}, "t": {"value": 10, "unit": "h"}}`

#### Enhanced Mode 🟡 **IN PROGRESS**
- **Dynamic PQ loading**: Symbol lists update when articleId changes (✅ implemented)
- **FixedCollection UI**: Table-like interface with Symbol/Value/Unit columns (✅ implemented)
- **Auto-population**: Need to implement default value/unit population (🔄 pending)
- **Field clearing**: Need to clear old data on articleId change (🔄 pending)
- **Dynamic units**: Unit dropdowns based on selected PQ category (✅ implemented)

### Node Interface ✅ **CORE FEATURES COMPLETE**
- **Article ID input** (string, required): Calculation article identifier
- **Configuration Mode** (options): Legacy (JSON) vs Enhanced (FixedCollection)
- **Credential management**: Secure API key storage with base URL configuration
- **Custom icon**: PNG image support implemented

### Error Handling ✅ **FULLY IMPLEMENTED**
- **401**: Invalid API key - Clear error message
- **404**: Article not found - Descriptive error message  
- **400**: Invalid units or malformed request - JSON validation with helpful messages
- **429**: Rate limit exceeded - Rate limit warning
- **5xx**: Server errors - Generic server error handling
- **Dynamic loading errors**: Graceful fallbacks for loadOptions failures

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
1. ✅ Publish to npm registry - **COMPLETED**
2. Setup CI/CD pipeline for automated testing and deployment
3. Submit to n8n community nodes
4. Create documentation and examples
5. Marketing and user adoption

## Claude Response Format
Please start each of your response with:
"Msg. #{{#}} @{{timestamp}}"
where {{#}} is the current message number (starting at 1 and incrementing for each of your messages),  
and {{timestamp}} is the current date and time in ISO 8601 format (YYYY-MM-DDTHH:MM:SS).