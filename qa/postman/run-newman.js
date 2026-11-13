/**
 * ReturnFlow – Newman CLI Automated Test Runner
 * -----------------------------------------------
 * Runs the complete Postman collection against the active backend server
 * and outputs structured test results.
 *
 * Usage:
 *   npx newman run qa/postman/ReturnFlow.postman_collection.json -e qa/postman/ReturnFlow.postman_environment.json
 */

const { execSync } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '../../');
const collectionPath = path.join(__dirname, 'ReturnFlow.postman_collection.json');
const environmentPath = path.join(__dirname, 'ReturnFlow.postman_environment.json');

console.log('🚀 Running ReturnFlow Postman Collection via Newman CLI...\n');

try {
  execSync(
    `npx newman run "${collectionPath}" -e "${environmentPath}" --reporters cli`,
    { stdio: 'inherit', cwd: root }
  );
  console.log('\n✅ Newman API test suite executed successfully!');
} catch (err) {
  console.error('\n❌ Newman test suite failed.');
  process.exit(1);
}

