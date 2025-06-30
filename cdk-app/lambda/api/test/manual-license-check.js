/**
 * This script manually tests the q Pro license verification functionality.
 * It simulates an API Gateway event and calls the Lambda handler directly.
 */

const { handler } = require('../index');

async function testLicenseVerification() {
  console.log('Testing q Pro license verification...');
  
  // Simulate an API Gateway event for the license verification endpoint
  const event = {
    resource: '/license/verify',
    httpMethod: 'GET'
  };
  
  try {
    // Call the Lambda handler directly
    const result = await handler(event, {});
    
    console.log('Status Code:', result.statusCode);
    console.log('Response Body:', JSON.parse(result.body));
    
    // Extract the license information
    const body = JSON.parse(result.body);
    
    if (body.isInstalled) {
      console.log('\nq is installed on this system.');
      
      if (body.isProLicenseActive) {
        console.log('✅ q Pro license is active!');
        console.log('License Info:', body.licenseInfo);
      } else {
        console.log('❌ q Pro license is not active.');
        if (body.licenseInfo) {
          console.log('License Info:', body.licenseInfo);
        }
      }
    } else {
      console.log('\n❌ q is not installed on this system or not in PATH.');
      if (body.error) {
        console.log('Error:', body.error);
      }
    }
  } catch (error) {
    console.error('Error testing license verification:', error);
  }
}

// Run the test
testLicenseVerification();