# ISO20022 to MT103 Converter

A robust and efficient converter that transforms ISO 20022 financial messages into MT103 (SWIFT MT103) payment instruction format. This tool facilitates seamless integration between modern ISO 20022-based payment systems and legacy SWIFT MT103 infrastructure.

## Project Description

The ISO20022 to MT103 Converter is designed to bridge the gap between contemporary financial messaging standards (ISO 20022) and the widely-used SWIFT MT103 format. As financial institutions transition from legacy systems to ISO 20022, this converter ensures backward compatibility and smooth interoperability between different payment ecosystems.

The converter handles the structural and semantic mapping between ISO 20022 payment messages (pacs.008 and camt.050) and the SWIFT MT103 format, maintaining data integrity and compliance with banking standards throughout the conversion process.

## Features

- **Accurate Format Conversion**: Seamlessly converts ISO 20022 messages to valid MT103 format
- **Data Integrity**: Preserves critical payment information during conversion
- **Error Handling**: Comprehensive validation and error reporting for invalid inputs
- **High Performance**: Optimized processing for large-scale message conversion
- **Flexible Configuration**: Customizable mapping rules and conversion parameters
- **Logging & Monitoring**: Detailed logs for debugging and audit trails
- **REST API**: Easy-to-use HTTP endpoints for integration
- **Batch Processing**: Support for processing multiple messages in a single request
- **Standards Compliance**: Adheres to SWIFT and ISO 20022 specifications

## Installation Instructions

### Prerequisites

- Node.js (v14.0 or higher)
- npm (v6.0 or higher)
- Git

### Setup Steps

1. **Clone the Repository**
   ```bash
   git clone https://github.com/MSbillion/iso2mt.git
   cd iso2mt
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit the `.env` file with your configuration:
   ```env
   NODE_ENV=development
   PORT=3000
   LOG_LEVEL=info
   MAX_MESSAGE_SIZE=10485760
   CONVERSION_TIMEOUT=30000
   ```

4. **Verify Installation**
   ```bash
   npm test
   ```

## How to Run the Server

### Development Mode

```bash
npm start
```

The server will start on the default port (3000) and display:
```
ISO20022 to MT103 Converter Server
Server is running on port 3000
```

### Production Mode

```bash
NODE_ENV=production npm start
```

### With Custom Configuration

```bash
PORT=8080 LOG_LEVEL=debug npm start
```

### Docker Deployment

```bash
docker build -t iso2mt-converter .
docker run -p 3000:3000 iso2mt-converter
```

### Health Check

Verify the server is running:
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "healthy",
  "uptime": 1234,
  "timestamp": "2026-01-05T23:22:09Z"
}
```

## Usage Guide

### API Endpoints

#### 1. Convert Single Message

**Endpoint**: `POST /api/v1/convert`

**Request**:
```bash
curl -X POST http://localhost:3000/api/v1/convert \
  -H "Content-Type: application/json" \
  -d @iso20022-message.json
```

**Request Body** (ISO 20022 XML or JSON):
```json
{
  "message": {
    "type": "pacs.008",
    "content": "<xml>...</xml>"
  }
}
```

**Response**:
```json
{
  "success": true,
  "mt103": ":20:REFERENCE\n:23B:CRED\n:32A:200105USD100,00\n...",
  "conversionTime": 145,
  "warnings": []
}
```

#### 2. Convert Batch Messages

**Endpoint**: `POST /api/v1/convert/batch`

**Request**:
```bash
curl -X POST http://localhost:3000/api/v1/convert/batch \
  -H "Content-Type: application/json" \
  -d @batch-messages.json
```

**Request Body**:
```json
{
  "messages": [
    { "type": "pacs.008", "content": "..." },
    { "type": "pacs.008", "content": "..." }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "results": [
    { "id": 1, "status": "success", "mt103": "..." },
    { "id": 2, "status": "success", "mt103": "..." }
  ],
  "summary": {
    "total": 2,
    "successful": 2,
    "failed": 0
  }
}
```

#### 3. Validate Message

**Endpoint**: `POST /api/v1/validate`

**Request**:
```bash
curl -X POST http://localhost:3000/api/v1/validate \
  -H "Content-Type: application/json" \
  -d '{"message": "..."}'
```

**Response**:
```json
{
  "valid": true,
  "errors": [],
  "warnings": ["Field X is deprecated in ISO 20022"]
}
```

#### 4. Get Conversion Statistics

**Endpoint**: `GET /api/v1/stats`

**Response**:
```json
{
  "totalConversions": 15234,
  "successfulConversions": 15200,
  "failedConversions": 34,
  "averageConversionTime": 125,
  "uptime": 3600000
}
```

### Command-Line Usage

#### Convert a single file

```bash
node cli.js convert input.iso output.mt103
```

#### Batch conversion

```bash
node cli.js batch-convert ./iso-messages/ ./mt-output/
```

#### Validate message

```bash
node cli.js validate input.iso
```

### Integration Example

**JavaScript/Node.js**:
```javascript
const { ISOtoMT103Converter } = require('iso2mt');

const converter = new ISOtoMT103Converter();

const iso20022Message = {
  type: 'pacs.008',
  content: '...'
};

converter.convert(iso20022Message)
  .then(result => {
    console.log('MT103:', result.mt103);
  })
  .catch(error => {
    console.error('Conversion failed:', error);
  });
```

**Python**:
```python
import requests
import json

url = 'http://localhost:3000/api/v1/convert'
payload = {
    'message': {
        'type': 'pacs.008',
        'content': '...'
    }
}

response = requests.post(url, json=payload)
result = response.json()
print(result['mt103'])
```

### Supported Message Types

- **pacs.008**: Financial Credit Transfer Initiation (SCT)
- **pacs.009**: Financial Institution Credit Transfer (STEP1)
- **camt.050**: Liquidity Credit Transfer
- **camt.053**: Bank-to-Customer Statement

### Field Mappings

Key ISO 20022 to MT103 field mappings:

| ISO 20022 Field | MT103 Field | Notes |
|---|---|---|
| GrpHdr/MsgId | :20: | Reference number |
| GrpHdr/CreDtTm | Date | Timestamp |
| CdtTrfTxInf/Amt/InstdAmt | :32A: | Instructed amount |
| CdtTrfTxInf/Dbtr | :50K: | Debtor information |
| CdtTrfTxInf/Cdtr | :59A: | Creditor information |
| CdtTrfTxInf/RmtInf/Ustrd | :70: | Remittance information |

### Error Handling

The converter returns detailed error messages for troubleshooting:

```json
{
  "success": false,
  "error": "Invalid ISO 20022 message structure",
  "details": {
    "field": "CdtTrfTxInf/Amt",
    "issue": "Missing required amount"
  },
  "errorCode": "ISO_001"
}
```

### Common Error Codes

- `ISO_001`: Invalid message structure
- `ISO_002`: Missing required field
- `ISO_003`: Invalid currency code
- `MT103_001`: Conversion logic error
- `MT103_002`: Field overflow (exceeds MT103 limits)
- `VALIDATION_001`: Message validation failed

## Configuration Options

Create a `config.json` file in the project root:

```json
{
  "conversion": {
    "strictMode": true,
    "validateBeforeConversion": true,
    "truncateOnOverflow": false,
    "timeout": 30000
  },
  "logging": {
    "level": "info",
    "format": "json",
    "outputFile": "./logs/converter.log"
  },
  "api": {
    "port": 3000,
    "maxRequestSize": "10mb",
    "rateLimit": {
      "enabled": true,
      "requests": 1000,
      "windowMs": 3600000
    }
  }
}
```

## Performance Optimization

- **Caching**: Frequently used conversion rules are cached
- **Parallel Processing**: Batch operations are processed in parallel
- **Memory Management**: Efficient memory usage for large messages
- **Connection Pooling**: Optimized for high-concurrency environments

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues, questions, or suggestions:

- 📧 Email: support@msbillion.com
- 📝 Issues: [GitHub Issues](https://github.com/MSbillion/iso2mt/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/MSbillion/iso2mt/discussions)

## Changelog

### Version 1.0.0 (2026-01-05)
- Initial release
- Support for pacs.008 and pacs.009 conversion
- REST API with batch processing
- Comprehensive validation and error handling

---

**Last Updated**: 2026-01-05
