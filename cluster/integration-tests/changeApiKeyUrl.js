// Check if both command line arguments are provided
if (process.argv.length !== 4) {
  console.log('Usage: node changeApiKeyUrl.js <apiKey> <apiUrl>');
  process.exit(1);
}

// Get the strings from command line arguments
const apiKey = process.argv[2];
const apiUrl = process.argv[3];

console.log(`${apiKey.split(':')[0]}:${btoa(apiUrl)}`);
