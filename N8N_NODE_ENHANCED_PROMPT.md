# Enhanced n8n Node Development Prompt

## 🎯 **Project Status: Ready for Enhanced Implementation**

Your CalcsLive API is now **fully ready** for enhanced n8n node development with:
- ✅ **Calculate endpoint**: `/api/n8n/calculate` (POST) - Production ready
- ✅ **Validate endpoint**: `/api/n8n/validate` (GET) - Enhanced with full units data
- ✅ **Cloudflare Workers compatible** - No deployment blockers
- ✅ **Authentication system** - API key validation working
- ✅ **Rate limiting** - 60 requests/minute implemented

## 📡 **Available API Endpoints**

### **1. Validate Endpoint (NEW Enhanced)**
**GET** `https://your-app.com/api/n8n/validate?articleId=3LYPD4C96-34U&apiKey=your-key`

**Response:**
```json
{
  "success": true,
  "message": "Article validation successful",
  "articleId": "3LYPD4C96-34U",
  "articleTitle": "Speed Distance Time Calculator",
  "metadata": {
    "totalPQs": 3,
    "inputPQs": [
      {
        "symbol": "x",
        "description": "Distance",
        "unit": "km",
        "baseUnit": "m", 
        "categoryId": "901",
        "type": "input"
      },
      {
        "symbol": "y",
        "description": "Time",
        "unit": "h",
        "baseUnit": "s",
        "categoryId": "903", 
        "type": "input"
      }
    ],
    "outputPQs": [
      {
        "symbol": "s",
        "description": "Speed",
        "unit": "km/h",
        "baseUnit": "m/s",
        "categoryId": "905",
        "type": "output",
        "expression": "x/y"
      }
    ],
    "availableUnits": {
      "901": ["m", "cm", "mm", "km", "in", "ft", "yd", "mi", "nmi"],
      "903": ["s", "min", "h", "day", "week", "month", "year"],
      "905": ["m/s", "km/h", "mph", "ft/s", "knot"]
    }
  }
}
```

### **2. Calculate Endpoint (Existing)**
**POST** `https://your-app.com/api/n8n/calculate`

**Request:**
```json
{
  "articleId": "3LYPD4C96-34U",
  "apiKey": "your-api-key",
  "inputs": {
    "x": { "value": 150, "unit": "km" },
    "y": { "value": 2, "unit": "h" }
  },
  "outputs": {
    "s": { "unit": "km/h" }
  }
}
```

**Response:**
```json
{
  "success": true,
  "inputs": {
    "x": { "symbol": "x", "value": 150, "unit": "km", "baseValue": 150000, "baseUnit": "m" },
    "y": { "symbol": "y", "value": 2, "unit": "h", "baseValue": 7200, "baseUnit": "s" }
  },
  "outputs": {
    "s": { "symbol": "s", "value": 75, "unit": "km/h", "baseValue": 20.833, "baseUnit": "m/s", "expression": "x/y" }
  },
  "timestamp": "2025-01-09T10:25:00.000Z"
}
```

## 🎨 **Enhanced n8n Node Design**

### **Target User Experience**
1. **Enter Article ID** → User inputs calculation ID
2. **Click "Load PQs"** → Node fetches available inputs/outputs using validate endpoint
3. **Select PQs** → User picks which inputs/outputs to use from dropdowns
4. **Configure Values** → Dynamic form fields appear for selected inputs
5. **Execute** → Calculation runs with selected data

### **Node Interface Architecture**

#### **Step 1: Basic Configuration**
```typescript
{
  displayName: 'Article ID',
  name: 'articleId',
  type: 'string',
  required: true,
  default: '',
  placeholder: '3LYPD4C96-34U',
  description: 'The calculation article identifier'
},
{
  displayName: 'Load Available PQs',
  name: 'loadPQs',
  type: 'button',
  typeOptions: {
    action: {
      type: 'loadPQs',
      displayName: 'Load PQs'
    }
  },
  description: 'Click to fetch available inputs and outputs for this article'
}
```

#### **Step 2: Dynamic PQ Selection** (Populated after loading)
```typescript
{
  displayName: 'Input PQs',
  name: 'selectedInputs',
  type: 'multiOptions',
  options: [], // Populated dynamically from validate endpoint
  default: [],
  description: 'Select which input quantities to provide values for'
},
{
  displayName: 'Output PQs',
  name: 'selectedOutputs',
  type: 'multiOptions', 
  options: [], // Populated dynamically from validate endpoint
  default: [],
  description: 'Select which output quantities to calculate'
}
```

#### **Step 3: Dynamic Input Fields** (Generated based on selections)
```typescript
// Example: If user selects input "x" (Distance)
{
  displayName: 'Distance (x) - Value',
  name: 'input_x_value',
  type: 'string', // Allow expressions like {{ $json.distance }}
  displayOptions: {
    show: {
      selectedInputs: ['x']
    }
  },
  default: '',
  placeholder: '150 or {{ $json.distance }}',
  description: 'Distance value - supports expressions from upstream nodes'
},
{
  displayName: 'Distance (x) - Unit',
  name: 'input_x_unit',
  type: 'options',
  displayOptions: {
    show: {
      selectedInputs: ['x']
    }
  },
  options: [], // Populated from availableUnits["901"] 
  default: 'km',
  description: 'Unit for distance input'
}
```

## 🔧 **Implementation Strategy**

### **Phase 1: Enhanced MVP (Recommended Start)**
Build on your existing node with these improvements:

#### **A. Add Validate Integration**
```typescript
// Method to load PQs dynamically
async loadPQs(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
  const articleId = this.getCurrentNodeParameter('articleId') as string;
  const credentials = await this.getCredentials('calcsLiveApi');
  
  if (!articleId) {
    return [];
  }
  
  try {
    const response = await this.httpRequest({
      method: 'GET',
      url: `${credentials.baseUrl}/api/n8n/validate`,
      qs: {
        articleId,
        apiKey: credentials.apiKey
      }
    });
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to load PQs');
    }
    
    // Return input PQs for selection
    return response.metadata.inputPQs.map(pq => ({
      name: `${pq.description || pq.symbol} (${pq.symbol}) - ${pq.unit}`,
      value: pq.symbol
    }));
    
  } catch (error) {
    console.error('Failed to load PQs:', error);
    return [];
  }
}
```

#### **B. Dynamic Unit Options**
```typescript
// Method to get units for a specific PQ category
async getUnitsForCategory(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
  const articleId = this.getCurrentNodeParameter('articleId') as string;
  const selectedInput = this.getCurrentNodeParameter('currentPQSymbol') as string;
  
  // Get PQ metadata to find category
  const validateResponse = await this.loadArticleMetadata(articleId);
  const pq = validateResponse.metadata.inputPQs.find(p => p.symbol === selectedInput);
  
  if (!pq) return [];
  
  const availableUnits = validateResponse.metadata.availableUnits[pq.categoryId] || [];
  
  return availableUnits.map(unit => ({
    name: unit,
    value: unit
  }));
}
```

### **Phase 2: Advanced Features**

#### **A. Smart Field Mapping**
- Auto-detect upstream data structure
- Suggest field mappings based on PQ descriptions
- Support both manual entry and upstream data

#### **B. Batch Processing**
- Process multiple items from upstream nodes
- Handle arrays of calculations efficiently

#### **C. Validation & Preview**
- Real-time validation of input values
- Preview calculated results before execution
- Better error handling with specific suggestions

## 🚀 **Development Workflow**

### **Step 1: Set Up Enhanced Node Project**
```bash
# Create separate project (as discussed)
npx @n8n/create-node@latest n8n-nodes-calcslive-enhanced
cd n8n-nodes-calcslive-enhanced
npm install
```

### **Step 2: Implement Validate Integration**
1. Add validate endpoint call functionality
2. Implement dynamic PQ loading
3. Create dynamic field generation based on loaded PQs

### **Step 3: Enhanced UX**
1. Add unit dropdowns populated from real data
2. Implement smart field mapping for upstream data
3. Add validation and error handling

### **Step 4: Testing & Polish**
1. Test with various calculation articles
2. Test upstream data integration
3. Add comprehensive error handling
4. Create documentation and examples

## 📋 **API Integration Patterns**

### **Pattern 1: Validation First**
```typescript
// Always validate before calculating
const validateResponse = await validateArticle(articleId, apiKey);
if (!validateResponse.success) {
  throw new Error(`Cannot access article: ${validateResponse.message}`);
}

// Use validation data to build calculation request
const calculationRequest = buildRequestFromValidation(validateResponse, userInputs);
const result = await calculate(calculationRequest);
```

### **Pattern 2: Error Recovery**
```typescript
// Provide helpful error messages using validation data
try {
  const result = await calculate(request);
  return result;
} catch (error) {
  if (error.statusCode === 400) {
    const available = await getAvailablePQs(articleId);
    throw new Error(`Invalid PQ symbols. Available inputs: ${available.inputs.map(p => p.symbol).join(', ')}`);
  }
  throw error;
}
```

## 🎯 **Success Metrics**

### **User Experience Metrics**
- **Setup Time**: How long to configure a calculation (target: <2 minutes)
- **Error Rate**: Percentage of failed configurations (target: <5%)
- **User Adoption**: Active workflows using the node (track growth)

### **Technical Metrics**
- **API Success Rate**: Validate + Calculate calls (target: >99%)
- **Response Time**: End-to-end calculation time (target: <2 seconds)
- **Error Types**: Track common configuration errors to improve UX

## 🔗 **Integration Examples**

### **Example 1: Google Sheets to Calculations**
```
Google Sheets → CalcsLive Enhanced → Email Results
```
- Load article "Distance-Speed-Time"
- Map sheet columns to PQ inputs automatically
- Calculate results for each row
- Email summary with all calculations

### **Example 2: Webhook to Database**
```
Webhook → CalcsLive Enhanced → PostgreSQL
```
- Receive sensor data via webhook
- Convert units using CalcsLive calculations  
- Store processed results in database

### **Example 3: Scheduled Reports**
```
Schedule → Multiple CalcsLive nodes → Generate PDF Report
```
- Run engineering calculations on schedule
- Process multiple calculation types
- Generate comprehensive engineering reports

## 💡 **Pro Tips for Implementation**

1. **Start Simple**: Begin with the validate integration and basic dynamic fields
2. **Use Real Data**: Leverage your units data for accurate dropdowns
3. **Test Early**: Test with various calculation articles from the start
4. **Error Handling**: Provide clear, actionable error messages
5. **Documentation**: Include examples in the node description

## 🎉 **Expected Impact**

This enhanced n8n node will:
- **10x improve user experience** vs manual JSON editing
- **Unlock new use cases** through better automation integration
- **Reduce support burden** with guided configuration
- **Increase platform adoption** through n8n marketplace visibility
- **Generate valuable usage analytics** for business insights

Your API foundation is rock-solid - now it's time to build an amazing user experience on top of it! 🚀