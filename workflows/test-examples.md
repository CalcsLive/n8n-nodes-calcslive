# AI Agent CalcsLive Integration - Test Examples

This document provides comprehensive test examples for validating the AI agent workflow integration.

## Quick Start Tests

### 1. Speed Calculation (Basic)
```bash
curl -X POST "https://your-n8n-instance/webhook/engineering-query" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How fast am I going if I travel 150 kilometers in 2 hours?"
  }'
```

**Expected AI Analysis**:
```json
{
  "calculation_type": "speed_distance_time",
  "article_id": "3M5NVUCGW-3TA", 
  "confidence": 0.95,
  "input_parameters": {
    "D": {"value": 150, "unit": "km", "description": "Distance traveled"},
    "t": {"value": 2, "unit": "h", "description": "Time taken"}
  },
  "expected_outputs": ["s"],
  "reasoning": "User wants to calculate speed given distance and time"
}
```

**Expected CalcsLive Result**:
```json
{
  "success": true,
  "inputs": {
    "D": {"value": 150, "unit": "km"},
    "t": {"value": 2, "unit": "h"}
  },
  "outputs": {
    "s": {"value": 75, "unit": "km/h"}
  }
}
```

### 2. Unit Conversion Context
```bash
curl -X POST "https://your-n8n-instance/webhook/engineering-query" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "I drove 100 miles in 90 minutes, what was my speed in kilometers per hour?"
  }'
```

**Expected Behavior**: 
- AI should recognize mixed units (miles + minutes + km/h output request)
- CalcsLive should handle automatic unit conversions
- Result should be approximately 107 km/h

### 3. Hydraulic Power Calculation
```bash
curl -X POST "https://your-n8n-instance/webhook/engineering-query" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Calculate the hydraulic power for a pump with 50 liters per second flow rate, 10 meter head, water density 1000 kg/m³, and 85% efficiency"
  }'
```

**Expected AI Analysis**:
```json
{
  "calculation_type": "hydraulic_power",
  "article_id": "HYDRO-POWER-CALC",
  "confidence": 0.90,
  "input_parameters": {
    "Q": {"value": 50, "unit": "L/s", "description": "Flow rate"},
    "H": {"value": 10, "unit": "m", "description": "Head"},
    "ρ": {"value": 1000, "unit": "kg/m³", "description": "Density"},
    "η": {"value": 0.85, "unit": "", "description": "Efficiency"}
  },
  "expected_outputs": ["P"],
  "reasoning": "User wants to calculate hydraulic power with complete parameters"
}
```

## Edge Case Tests

### 4. Ambiguous Query (Low Confidence)
```bash
curl -X POST "https://your-n8n-instance/webhook/engineering-query" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Calculate something with pressure"
  }'
```

**Expected Behavior**:
- AI confidence < 0.8
- Workflow routes to error branch
- Response includes suggestion for clarification

**Expected Response**:
```json
{
  "success": false,
  "error": "Unable to interpret calculation request",
  "confidence": 0.2,
  "suggestion": "Please provide more specific details about your calculation needs",
  "original_query": "Calculate something with pressure"
}
```

### 5. Multiple Possible Calculations
```bash
curl -X POST "https://your-n8n-instance/webhook/engineering-query" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "I have a pipe that is 100 feet long and 2 inches diameter with 20 GPM flow. What should I calculate?"
  }'
```

**Expected Behavior**:
- AI should recognize pipe flow scenario
- Could route to pressure drop calculation
- May request clarification about desired output (pressure drop vs velocity vs Reynolds number)

### 6. Incomplete Parameters
```bash
curl -X POST "https://your-n8n-instance/webhook/engineering-query" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Calculate speed if distance is 200 km"
  }'
```

**Expected Behavior**:
- AI should recognize missing time parameter
- May provide estimated value or request clarification
- CalcsLive should use defaults if available

## Unit System Validation Tests

### 7. Imperial Units
```bash
curl -X POST "https://your-n8n-instance/webhook/engineering-query" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Speed calculation: traveled 100 miles in 1.5 hours"
  }'
```

### 8. Mixed Unit Systems
```bash
curl -X POST "https://your-n8n-instance/webhook/engineering-query" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Flow is 50 L/min through 2 inch diameter pipe over 100 feet length"
  }'
```

### 9. Unusual Unit Combinations
```bash
curl -X POST "https://your-n8n-instance/webhook/engineering-query" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Distance 0.5 miles, time 3 minutes, need speed in meters per second"
  }'
```

## Engineering Domain Tests

### 10. Mechanical Engineering
```bash
curl -X POST "https://your-n8n-instance/webhook/engineering-query" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Calculate stress in a steel beam with 1000 pound force over 2 square inch area"
  }'
```

### 11. Electrical Engineering  
```bash
curl -X POST "https://your-n8n-instance/webhook/engineering-query" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Power calculation for 120V at 15 amps"
  }'
```

### 12. Thermal Engineering
```bash
curl -X POST "https://your-n8n-instance/webhook/engineering-query" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Heat transfer through 6 inch concrete wall with 20°F temperature difference"
  }'
```

## Conversational Style Tests

### 13. Casual Language
```bash
curl -X POST "https://your-n8n-instance/webhook/engineering-query" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Hey, I need to figure out how fast I was going on my road trip. I went 300 miles and it took me 5 hours"
  }'
```

### 14. Technical Precision
```bash
curl -X POST "https://your-n8n-instance/webhook/engineering-query" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Determine velocity magnitude given displacement vector of 150.0 km and temporal duration of 2.00 hours"
  }'
```

### 15. Question Format
```bash
curl -X POST "https://your-n8n-instance/webhook/engineering-query" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is the speed if distance equals 150 kilometers and time equals 2 hours?"
  }'
```

## Complex Scenario Tests

### 16. Multi-Step Implication
```bash
curl -X POST "https://your-n8n-instance/webhook/engineering-query" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "I have a car that gets 25 MPG and I drove for 4 hours at 60 mph. How much distance did I cover and how much fuel did I use?"
  }'
```

**Expected Behavior**:
- AI should recognize this needs distance calculation first
- May suggest breaking into steps
- Current version should focus on distance calculation

### 17. Real-World Context
```bash
curl -X POST "https://your-n8n-instance/webhook/engineering-query" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Planning a hiking trip. Trail is 15 miles, we hike at 2.5 mph average. How long will it take?"
  }'
```

### 18. Professional Context
```bash
curl -X POST "https://your-n8n-instance/webhook/engineering-query" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "For our pump specification, we need 75 GPM at 50 feet of head. Assuming 80% efficiency and water, what power motor do we need?"
  }'
```

## Error Handling Tests

### 19. Invalid Units
```bash
curl -X POST "https://your-n8n-instance/webhook/engineering-query" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Speed calculation: 100 bananas in 2 purple"
  }'
```

### 20. Conflicting Information
```bash
curl -X POST "https://your-n8n-instance/webhook/engineering-query" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "I traveled 100 miles in 2 hours but my speedometer showed 100 mph the whole time"
  }'
```

### 21. Missing Query
```bash
curl -X POST "https://your-n8n-instance/webhook/engineering-query" \
  -H "Content-Type: application/json" \
  -d '{
    "query": ""
  }'
```

## Performance Tests

### 22. Concurrent Requests
```bash
# Run multiple requests simultaneously
for i in {1..5}; do
  curl -X POST "https://your-n8n-instance/webhook/engineering-query" \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"Speed test $i: 100 km in 1 hour\"}" &
done
wait
```

### 23. Large Numbers
```bash
curl -X POST "https://your-n8n-instance/webhook/engineering-query" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Calculate speed for 1,000,000 meters in 3,600 seconds"
  }'
```

### 24. Very Small Numbers
```bash
curl -X POST "https://your-n8n-instance/webhook/engineering-query" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Microfluidics: 0.001 mm diameter pipe, 0.0001 L/min flow rate"
  }'
```

## Validation Checklist

When testing the workflow, verify:

### AI Analysis Quality
- [ ] Correct calculation type identification
- [ ] Appropriate confidence levels
- [ ] Accurate parameter extraction
- [ ] Proper unit recognition
- [ ] Sensible reasoning explanations

### CalcsLive Integration
- [ ] Successful API calls
- [ ] Correct parameter mapping
- [ ] Unit conversion handling
- [ ] Error propagation
- [ ] Result formatting

### Response Quality  
- [ ] Human-readable summaries
- [ ] Engineering validity assessment
- [ ] Conversational explanations
- [ ] Follow-up suggestions
- [ ] Error messages clarity

### Performance Metrics
- [ ] Response time < 10 seconds
- [ ] High availability during concurrent requests
- [ ] Proper error handling
- [ ] Analytics logging functionality
- [ ] Memory usage optimization

### Business Validation
- [ ] Professional presentation quality
- [ ] Technical accuracy
- [ ] User experience smoothness
- [ ] Viral demo potential
- [ ] Competitive differentiation

## Expected Success Rates

Based on current AI capabilities and CalcsLive coverage:

- **Basic Speed/Distance/Time**: 95% success rate
- **Hydraulic Calculations**: 85% success rate (if article exists)
- **Mixed Unit Systems**: 90% success rate
- **Ambiguous Queries**: 70% appropriate error handling
- **Edge Cases**: 60% graceful degradation

## Continuous Improvement

Track these metrics for workflow optimization:

1. **Query Classification Accuracy**: AI correct calculation type detection
2. **Parameter Extraction Precision**: Accurate value and unit identification  
3. **Confidence Calibration**: Confidence scores vs actual success rates
4. **User Satisfaction**: Feedback on result quality and explanations
5. **Coverage Expansion**: New calculation types added based on usage patterns

Use the analytics logging to identify improvement opportunities and expand the AI's engineering domain knowledge.