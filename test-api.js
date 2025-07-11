const https = require('https');

const data = JSON.stringify({
  articleId: '3LYPD4C96-34U',
  apiKey: 'embed_fd624b8181e08798ddefc230d6ebdba282830a4f4dc38ec1fb04ef6b71daa09d',  
  inputs: {
    x: { value: 150, unit: 'km' },
    y: { value: 2, unit: 'h' }
  },
  outputs: {
    s: { unit: 'km/h' }
  }
});

const options = {
  hostname: 'www.calcs.live',
  port: 443,
  path: '/api/n8n/calculate',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('Testing API endpoint...');
console.log('URL:', `https://${options.hostname}${options.path}`);
console.log('Data:', data);

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);
  
  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', responseData);
    try {
      const parsed = JSON.parse(responseData);
      console.log('Parsed response:', JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log('Could not parse response as JSON');
    }
  });
});

req.on('error', (e) => {
  console.error(`Request error: ${e.message}`);
});

req.write(data);
req.end();