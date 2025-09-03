# AI Agent CalcsLive Integration Workflow

This workflow demonstrates how an AI agent can intelligently utilize the CalcsLive n8n node for engineering calculations.

## Workflow Overview

**Input**: Natural language engineering query via webhook
**Output**: Structured calculation results with AI-powered explanations

### Example Queries

```
"I need to calculate the speed if I travel 150 kilometers in 2 hours"
"What's the hydraulic power if flow rate is 50 L/s, head is 10 m, density is 1000 kg/m³, and efficiency is 85%?"
"Calculate pipe pressure drop for 100 ft of 2-inch pipe with 20 GPM flow"
```

## Workflow Architecture

### 1. **Engineering Query Webhook** 
- **Type**: Webhook Trigger
- **Purpose**: Receives natural language engineering queries
- **Input Format**: `{ "query": "your engineering question here" }`

### 2. **AI Problem Analyzer**
- **Type**: OpenAI GPT-4
- **Purpose**: Analyzes query and determines calculation requirements
- **Output**: Structured JSON with article_id, input_parameters, and confidence

### 3. **Parameter Processor**
- **Type**: Code Node
- **Purpose**: Transforms AI output into CalcsLive node format
- **Key Functions**:
  - Validates confidence threshold (80%+)
  - Maps parameters to CalcsLive input/output format
  - Handles error cases for low-confidence interpretations

### 4. **Confidence Check**
- **Type**: IF Node
- **Purpose**: Routes workflow based on AI confidence level
- **Branches**: 
  - High confidence → CalcsLive calculation
  - Low confidence → Error response with clarification request

### 5. **CalcsLive Calculation**
- **Type**: Custom CalcsLive Node
- **Purpose**: Performs unit-aware engineering calculation
- **Features**:
  - Dynamic article selection based on AI analysis
  - Automatic unit handling and validation
  - Comprehensive calculation results

### 6. **Result Formatter**
- **Type**: Code Node  
- **Purpose**: Formats raw calculation results for human consumption
- **Output**: Human-readable summary with inputs, outputs, and context

### 7. **AI Result Explainer**
- **Type**: OpenAI GPT-4
- **Purpose**: Provides conversational explanation of results
- **Features**:
  - Engineering validity assessment
  - Plain English explanations
  - Follow-up calculation suggestions

### 8. **Analytics Logger**
- **Type**: Code Node
- **Purpose**: Logs interactions for learning and improvement
- **Captures**: Query patterns, success rates, calculation types

## Usage Instructions

### 1. Setup Requirements

**OpenAI API Key**: Configure in n8n credentials manager
**CalcsLive API Key**: Configure CalcsLive node credentials (Premium tier required)

### 2. Import Workflow

```bash
# Import the workflow JSON file
curl -X POST "http://localhost:5678/api/v1/workflows/import" \
  -H "Content-Type: application/json" \
  -d @ai-agent-calcslive-integration.json
```

### 3. Activate Webhook

1. Activate the workflow in n8n
2. Note the webhook URL from the "Engineering Query Webhook" node
3. Test endpoint: `POST https://your-n8n-instance/webhook/engineering-query`

### 4. Test the Integration

```bash
# Example API call
curl -X POST "https://your-n8n-instance/webhook/engineering-query" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Calculate speed for 150 km traveled in 2 hours"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "summary": "Calculation completed successfully...",
  "formatted_results": {
    "s": {"value": 75, "unit": "km/h"}
  },
  "ai_explanation": "Based on your query, I calculated the speed using the distance-time relationship..."
}
```

## Supported Calculations

The AI agent currently recognizes these calculation types:

### Speed/Distance/Time
- **Article ID**: `3M5NVUCGW-3TA`
- **Parameters**: D (distance), t (time), s (speed)
- **Example**: "How fast am I going if I travel 100 miles in 2 hours?"

### Hydraulic Power  
- **Article ID**: `HYDRO-POWER-CALC`
- **Parameters**: ρ (density), g (gravity), H (head), Q (flow), η (efficiency)
- **Example**: "Calculate pump power for 50 L/s at 10 m head with 85% efficiency"

### Pipe Pressure Drop
- **Article ID**: `PIPE-PRESSURE`
- **Parameters**: L (length), D (diameter), Q (flow), μ (viscosity)
- **Example**: "Pressure drop in 100 ft of 2-inch pipe with 20 GPM"

### Heat Transfer
- **Article ID**: `HEAT-TRANSFER`
- **Parameters**: k (conductivity), A (area), ΔT (temperature difference), L (thickness)
- **Example**: "Heat transfer through 6-inch wall with 50°F temperature difference"

## AI Agent Capabilities

### Natural Language Processing
- Understands engineering terminology and units
- Maps colloquial descriptions to technical parameters
- Handles various unit systems (metric, imperial, mixed)

### Intelligent Parameter Mapping
- Automatically identifies calculation type from context
- Maps user inputs to correct CalcsLive symbols
- Provides confidence scoring for interpretation accuracy

### Engineering Validation
- Assesses whether results make engineering sense
- Provides context and explanations for calculations
- Suggests follow-up calculations when relevant

### Error Handling
- Graceful handling of ambiguous queries
- Requests clarification for low-confidence interpretations
- Provides helpful guidance for better query formulation

## Extension Points

### Adding New Calculations

1. **Create CalcsLive Article**: Design calculation in CalcsLive platform
2. **Update AI Prompt**: Add new calculation to system message in AI Problem Analyzer
3. **Test Integration**: Verify AI can map queries to new calculation type

### Enhanced AI Capabilities

- **Multi-step Workflows**: Chain multiple CalcsLive calculations
- **Unit Preference Learning**: Remember user's preferred unit systems  
- **Domain-Specific Prompts**: Specialized prompts for mechanical, electrical, civil engineering
- **Visual Results**: Generate charts and diagrams from calculation results

### Business Intelligence

- **Usage Analytics**: Track popular calculation types and patterns
- **Performance Monitoring**: Monitor AI confidence and user satisfaction
- **A/B Testing**: Test different AI prompt strategies
- **Custom Training**: Fine-tune AI models on engineering domain data

## Technical Notes

### Performance Considerations
- **API Rate Limits**: Consider OpenAI API limits for high-volume usage
- **Caching**: Implement result caching for repeated similar queries
- **Timeout Handling**: Set appropriate timeouts for CalcsLive API calls

### Security Best Practices  
- **API Key Management**: Use n8n credentials manager, never hardcode keys
- **Input Validation**: Sanitize natural language inputs
- **Access Control**: Implement webhook authentication for production
- **Audit Logging**: Track all calculation requests for compliance

### Scalability Options
- **Parallel Processing**: Handle multiple queries concurrently
- **Result Streaming**: Stream responses for complex multi-step calculations
- **Load Balancing**: Distribute across multiple n8n instances
- **Database Integration**: Store calculation history and user preferences

## Business Applications

### Engineering Consulting
- **Client Interaction**: Natural language interface for non-technical clients
- **Rapid Prototyping**: Quick feasibility studies and concept validation
- **Documentation**: Auto-generate calculation reports with explanations

### Education & Training
- **Interactive Learning**: Students can ask calculation questions naturally
- **Automated Tutoring**: AI provides step-by-step explanations
- **Assessment Tools**: Validate student understanding through conversation

### Product Development
- **Design Validation**: Quick checks during product development cycles
- **Requirements Analysis**: Convert specification text to calculations
- **Cost Estimation**: Automated engineering cost calculations

### Manufacturing & Operations
- **Process Optimization**: Real-time calculation adjustments
- **Quality Control**: Automated validation of manufacturing parameters
- **Predictive Maintenance**: Calculate failure predictions and intervals

## Competitive Advantages

### Unique Value Proposition
1. **Unit Intelligence**: Only solution combining AI with comprehensive unit awareness
2. **Engineering Domain**: Specialized for engineering vs generic calculations  
3. **Explanation Capability**: Not just results, but engineering insights
4. **Platform Integration**: Native n8n ecosystem with workflow capabilities

### Market Differentiation
- **vs Wolfram Alpha**: More conversational, workflow-integrated
- **vs Generic AI**: Domain-specific knowledge, unit-aware calculations  
- **vs Traditional Tools**: Natural language interface, AI explanations
- **vs Spreadsheets**: Automated validation, professional explanations

### Viral Growth Potential
- **Demo Effect**: Impressive capabilities in live demonstrations
- **Network Effect**: Each user potentially creates multiple workflows
- **Platform Lock-in**: Deep integration with n8n ecosystem
- **Content Marketing**: Showcase via engineering calculation examples

This workflow demonstrates the transformative potential of combining AI intelligence with CalcsLive's engineering calculation capabilities, creating a new category of "conversational engineering tools."