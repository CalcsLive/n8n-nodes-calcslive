# n8n-nodes-calcslive

A custom n8n node for integrating with the CalcsLive calculation API. This node allows you to perform physics calculations with unit conversions directly within your n8n workflows.

## Installation

### Community Node Installation (Recommended)
1. Open your n8n instance
2. Go to **Settings** > **Community Nodes**
3. Enter `n8n-nodes-calcslive` in the npm package name field
4. Click **Install**

### Manual Installation (Development)
```bash
# Clone or download this repository
git clone https://github.com/calcslive/n8n-nodes-calcslive.git
cd n8n-nodes-calcslive

# Install dependencies
npm install

# Build the node
npm run build

# Link for local development
npm link

# In your n8n installation directory
npm link n8n-nodes-calcslive

# Restart n8n
n8n start
```

## Configuration

### API Credentials
Before using the CalcsLive Calculator node, you need to set up your API credentials:

1. In n8n, go to **Credentials** and create a new **CalcsLive API** credential
2. Enter your CalcsLive API key (obtain from your CalcsLive account)
3. Optionally, modify the base URL if using a custom instance

## Usage

### Basic Example
The CalcsLive Calculator node requires three main inputs:

1. **Article ID**: The identifier of the calculation formula (e.g., `3LYPD4C96-34U`)
2. **Inputs**: JSON object with input values and units
3. **Outputs**: JSON object specifying desired output units (optional)

#### Example: Speed Calculation
```json
{
  "articleId": "3LYPD4C96-34U",
  "inputs": {
    "x": { "value": 150, "unit": "km" },
    "y": { "value": 2, "unit": "h" }
  },
  "outputs": {
    "s": { "unit": "km/h" }
  }
}
```

### Workflow Examples

#### 1. Simple Calculation
```
Manual Trigger → CalcsLive Calculator → Set Node
```

#### 2. Batch Processing from Spreadsheet
```
Google Sheets Trigger → CalcsLive Calculator → Google Sheets Update
```

#### 3. API Integration
```
Webhook → CalcsLive Calculator → HTTP Request → Database
```

## Node Configuration

### Input Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Article ID | String | Yes | The calculation article identifier from CalcsLive |
| Inputs | JSON | Yes | Physical quantities with values and units |
| Outputs | JSON | No | Desired output units (uses defaults if omitted) |

### Output Data

The node returns a structured JSON object containing:

```json
{
  "articleId": "3LYPD4C96-34U",
  "status": "success",
  "inputs": {
    "x": {
      "symbol": "x",
      "value": 150,
      "unit": "km",
      "baseValue": 150000,
      "baseUnit": "m"
    },
    "y": {
      "symbol": "y", 
      "value": 2,
      "unit": "h",
      "baseValue": 7200,
      "baseUnit": "s"
    }
  },
  "outputs": {
    "s": {
      "symbol": "s",
      "value": 75,
      "unit": "km/h",
      "baseValue": 20.833,
      "baseUnit": "m/s",
      "expression": "x/y"
    }
  },
  "timestamp": "2025-01-09T10:15:00.000Z"
}
```

## Error Handling

The node provides clear error messages for common issues:

- **Invalid API Key (401)**: Check your CalcsLive API credentials
- **Article Not Found (404)**: Verify the article ID exists and is accessible
- **Bad Request (400)**: Check input format and units
- **Rate Limit (429)**: Wait before making more requests
- **Server Errors (5xx)**: CalcsLive service issues

## Development

### Scripts
```bash
# Development mode (watch for changes)
npm run dev

# Build the project
npm run build

# Run linting
npm run lint

# Format code
npm run format
```

### Testing
To test the node locally:

1. Build the project: `npm run build`
2. Link the node: `npm link`

Setup or use n8n local installation:
Ref: [Perplexity Guide](https://www.perplexity.ai/search/on-a-windows-pc-where-is-local-0AB16oB3RHKjwGg2._fsdA)
```text
md C:\Users\<USERNAME>\.n8n\custom
cd C:\Users\<USERNAME>\.n8n\custom
npm init
npm link n8n-nodes-calcslive
n8n start
```

## Support

- **CalcsLive Documentation**: https://www.calcs.live/docs
- **CalcsLive API Documentation**: https://www.calcs.live/docs/api
- **Issues**: Report bugs and feature requests in the repository issues

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Version History

### 1.0.0
- Initial release
- Basic calculation functionality
- API key authentication
- Error handling for common scenarios
- Support for custom output units