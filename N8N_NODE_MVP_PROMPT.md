# Custom n8n Node MVP Development Prompt

## Project Overview
Create a custom n8n node that wraps our existing `/api/n8n/calculate` endpoint to provide a better user experience than raw HTTP Request nodes. This will significantly enhance the value proposition of our calculation platform by integrating with 400+ business tools through n8n's ecosystem.

## Current Working API
**Endpoint**: `/api/n8n/calculate` (POST)
**Status**: ✅ Fully functional and Cloudflare Workers compatible

### API Request Format:
```json
{
  "articleId": "3LYPD4C96-34U",
  "apiKey": "your-api-key",
  "inputs": {
    "x": { "value": 150, "unit": "km" },
    "y": { "value": 2, "unit": "h" }
  },
  "outputs": {    "s": { "unit": "km/h" }  }
}
```

### API Response Format:
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

## MVP Node Requirements

### 1. Basic Node Structure
**Package Name**: `n8n-nodes-calcslive`
**Node Name**: `CalcsLive Calculator`
**Node Type**: Regular node (not trigger)

### 2. Essential Features for MVP
- **Simple Interface**: Input fields for article ID, inputs JSON, outputs JSON
- **Credential Management**: Secure API key storage
- **Error Handling**: Friendly error messages for common issues
- **Basic Validation**: Check required fields before API call

### 3. Node Interface Design

#### **Input Fields**:
1. **Article ID** (string, required)
   - Description: "The calculation article identifier"
   - Placeholder: "3LYPD4C96-34U"

2. **Inputs** (JSON, required)
   - Description: "Physical quantities to input for calculation"
   - Example: `{"x": {"value": 150, "unit": "km"}, "y": {"value": 2, "unit": "h"}}`

3. **Outputs** (JSON, optional)
   - Description: "Desired output units (optional)"
   - Example: `{"s": {"unit": "km/h"}}`

#### **Output Format**:
- Return both `inputs` and `outputs` from API response
- Include calculation metadata (timestamp, etc.)

### 4. Credential Definition
**Name**: `CalcsLive API`
**Fields**:
- `apiKey` (string, password): "Your CalcsLive API key"
- `baseUrl` (string, optional): "API base URL (defaults to production)"

## Development Setup

### 0. Project Structure ⚠️ IMPORTANT
**Create this as a SEPARATE project** from your main CalcsLive application:

```
/your-projects/
├── calcslive-app/                    # Your existing Nuxt application
│   ├── server/api/n8n/calculate.ts   # API endpoint (stays here)
│   └── ...
└── n8n-nodes-calcslive/              # NEW separate project for n8n node
    ├── package.json
    ├── nodes/CalcsLive/
    ├── credentials/
    └── ...
```

**Benefits of separation:**
- Independent versioning and deployment
- Clean dependency management
- Different CI/CD pipelines
- Easier NPM publishing
- Clear separation of concerns (API vs integration)

### 1. Initialize Node Package
```bash
# In a NEW directory, separate from your main app
npx @n8n/create-node@latest n8n-nodes-calcslive
cd n8n-nodes-calcslive
npm install
```

### 2. Key Files to Create/Modify

#### **`nodes/CalcsLive/CalcsLive.node.ts`** (Main Logic)
- Implement node execution logic
- Handle API calls to our endpoint
- Process inputs/outputs
- Error handling and validation

#### **`nodes/CalcsLive/CalcsLive.node.json`** (Node Definition)
- Node metadata and UI definitions
- Input/output field specifications
- Display configuration

#### **`credentials/CalcsLiveApi.credentials.ts`** (Credentials)
- API key field definition
- Optional base URL configuration

#### **`package.json`** (Package Config)
- Node registration in n8n
- Dependencies and metadata

### 3. Implementation Guidelines

#### **API Integration**:
- Use n8n's `httpRequest` helper for API calls
- Implement proper error handling for common API errors:
  - Invalid API key (401)
  - Article not found (404)
  - Invalid units (400)
  - Rate limiting (429)

#### **User Experience**:
- Provide clear error messages
- Show helpful examples in field descriptions
- Include validation for required fields
- Return structured data that's easy to use in downstream nodes

#### **MVP Scope (Keep Simple)**:
- Don't implement article browsing/selection (use simple text input)
- Don't implement unit dropdowns (use JSON input)
- Don't implement real-time validation
- Focus on core functionality and reliability

## Testing Strategy

### 1. Local Development
- Use n8n's development environment
- Test with our staging/development API
- Verify credential storage and retrieval

### 2. Core Test Cases
- **Happy Path**: Valid article ID, inputs, and outputs
- **Error Cases**: Invalid API key, missing article, invalid units
- **Edge Cases**: Empty outputs, malformed JSON input
- **Integration**: Chain with other n8n nodes (webhooks, databases)

### 3. Example Test Workflows
1. **Speed Calculator**: Manual trigger → CalcsLive → Set node
2. **Batch Processing**: Google Sheets → CalcsLive → Email results
3. **API Integration**: Webhook → CalcsLive → Database storage

## Business Value

### 1. User Benefits
- **Simplified Setup**: No HTTP request configuration needed
- **Better Error Handling**: Friendly error messages vs raw HTTP errors
- **Credential Security**: Secure API key management
- **Visual Clarity**: Clear node representation in workflows

### 2. Platform Benefits
- **Market Expansion**: Access to n8n's user base and ecosystem
- **Professional Image**: Official integration builds trust
- **Viral Growth**: Shared workflows become marketing channels
- **Lead Generation**: n8n users discover our platform organically

### 3. Technical Benefits
- **Lower Support Burden**: Fewer configuration issues
- **Usage Analytics**: Track popular calculations and use cases
- **Integration Lock-in**: Higher switching costs for customers
- **Platform Strategy**: Position as calculation infrastructure layer

## Success Metrics

### 1. Technical Metrics
- **Installation Rate**: Downloads/installs per week
- **Usage Rate**: Active workflows using the node
- **Error Rate**: Failed executions vs successful ones
- **Performance**: Average response time and reliability

### 2. Business Metrics
- **User Acquisition**: New signups from n8n referrals
- **API Usage Growth**: Increase in `/api/n8n/calculate` calls
- **Conversion Rate**: n8n users becoming platform users
- **Customer Feedback**: User reviews and feature requests

## Next Steps After MVP

### 1. Enhanced Features (Future Versions)
- **Article Browser**: Dropdown to select from available articles
- **Unit Picker**: Dropdown for common units
- **Real-time Validation**: Validate inputs before execution
- **Batch Mode**: Process multiple calculations in one node

### 2. Additional Nodes
- **Article Validator**: Check if articles exist and are accessible
- **Unit Converter**: Standalone unit conversion node
- **Account Info**: Check API limits and usage

### 3. Platform Integration
- **n8n Community**: Submit to official community nodes
- **Documentation**: Create comprehensive guides and examples
- **Marketing**: Case studies and workflow templates

## Current Platform Status
- ✅ **API Fully Functional**: `/api/n8n/calculate` endpoint working
- ✅ **Cloudflare Workers Compatible**: No deployment blockers
- ✅ **Authentication Working**: API key validation implemented
- ✅ **Rate Limiting**: 60 requests/minute for n8n endpoints
- ✅ **Error Handling**: Comprehensive error responses
- ✅ **Documentation**: Complete API documentation available

## File Structure Target
```
n8n-nodes-calcslive/
├── package.json
├── tsconfig.json
├── nodes/
│   └── CalcsLive/
│       ├── CalcsLive.node.ts
│       ├── CalcsLive.node.json
│       └── calcslive.svg (icon)
├── credentials/
│   └── CalcsLiveApi.credentials.ts
├── README.md
└── examples/
    └── basic-workflow.json
```

**Goal**: Create a production-ready n8n node that makes our calculation API accessible to thousands of automation workflows, significantly expanding our platform's reach and value proposition.