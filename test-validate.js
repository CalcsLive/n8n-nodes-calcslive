const https = require('https');

const apiKey = 'embed_fd624b8181e08798ddefc230d6ebdba282830a4f4dc38ec1fb04ef6b71daa09d';
const articleId = '3LYPD4C96-34U';

const options = {
  hostname: 'www.calcs.live',
  port: 443,
  path: `/api/n8n/validate?articleId=${articleId}&apiKey=${apiKey}`,
  method: 'GET'
};

console.log('Testing validate endpoint...');
console.log('URL:', `https://${options.hostname}${options.path}`);

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
      
      if (parsed.success && parsed.metadata) {
        console.log('\n=== VALIDATION SUCCESSFUL ===');
        console.log('Article Title:', parsed.articleTitle);
        console.log('Total PQs:', parsed.metadata.totalPQs);
        console.log('Input PQs:', parsed.metadata.inputPQs.length);
        console.log('Output PQs:', parsed.metadata.outputPQs.length);
        console.log('Available Units Categories:', Object.keys(parsed.metadata.availableUnits));
      }
    } catch (e) {
      console.log('Could not parse response as JSON');
    }
  });
});

req.on('error', (e) => {
  console.error(`Request error: ${e.message}`);
});

req.end();