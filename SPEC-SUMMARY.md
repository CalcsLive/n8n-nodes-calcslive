# n8n-node-calcslive Specification Summary

## Project Status: 🟡 IN PROGRESS - Enhanced Mode Implementation

### Completed Features ✅

#### Legacy Mode (Fully Functional)
- **Manual JSON input/output** configuration
- **Works with any calc** - no hardcoded assumptions
- **All PQs with defaults** - returns all available outputs
- **Example usage:**
  ```json
  Inputs: {"D": {"value": 360, "unit": "km"}, "t": {"value": 10, "unit": "h"}}
  Outputs: {} // Leave empty for all outputs
  ```

#### Enhanced Mode (Partially Functional)
- **Dynamic PQ loading** - responds to articleId changes with `loadOptionsDependsOn`
- **FixedCollection UI** - table-like interface for PQ configuration
- **Clean symbol lists** - shows just symbols (D, t, v) without embedded values
- **Dynamic unit dropdowns** - units load based on selected PQ's category

### Current Implementation State

#### What Works
1. **Legacy mode** - fully functional for any calc
2. **Symbol loading** - dynamic symbol lists update when articleId changes
3. **FixedCollection structure** - proper table-like UI with Symbol/Value/Unit columns
4. **Unit loading by symbol** - `getUnitsForSymbol` method works

#### Current Issues to Fix
1. **Field clearing** - old values persist when articleId changes
2. **Default value population** - need to auto-populate Value field with faceValue
3. **Default unit selection** - need to auto-select default unit from calc
4. **User experience** - make it more intuitive and seamless

### Technical Architecture

#### API Integration
- **Validate endpoint**: `/api/n8n/validate` provides PQ metadata including:
  - `inputPQs[]` with `symbol`, `faceValue`, `unit`, `categoryId`
  - `outputPQs[]` with `symbol`, `unit`, `categoryId`  
  - `availableUnits{}` mapping `categoryId` to unit arrays

#### LoadOptions Methods
- `getInputPQs()` - loads input symbols, depends on articleId
- `getOutputPQs()` - loads output symbols, depends on articleId
- `getUnitsForSymbol()` - loads units for selected symbol, depends on articleId + symbol

#### Field Structure (Enhanced Mode)
```typescript
inputPQs: {
  pq: [
    { symbol: "D", value: 360, unit: "km" },
    { symbol: "t", value: 10, unit: "h" }
  ]
}
outputPQs: {
  pq: [
    { symbol: "v", unit: "km/h" }
  ]
}
```

### Key Files
- `CalcsLive.node.ts` - main node implementation
- `CalcsLiveApi.credentials.ts` - API credentials
- `validate.get.ts` - validate API endpoint (needs faceValue enhancement)

### Next Steps Priority
1. **Auto-populate defaults** in fixedCollection when symbol selected
2. **Clear old data** when articleId changes  
3. **Default value/unit selection** from calc metadata
4. **Enhanced mode completion** and testing
5. **Polish user experience**

### Development Context
- Uses embedded JSON in loadOptions values to carry metadata
- FixedCollection provides table-like UI without native table component
- loadOptionsDependsOn ensures dynamic refresh on field changes
- Execution logic handles both legacy JSON and enhanced fixedCollection structures