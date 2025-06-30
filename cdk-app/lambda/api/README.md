# q Pro License Verification

This Lambda function includes functionality to verify if a q Pro license is active on the system.

## API Endpoint

The API exposes a new endpoint for license verification:

- `GET /license/verify` - Verify if a q Pro license is active

## Response Format

The license verification endpoint returns a JSON response with the following structure:

```json
{
  "isInstalled": true,
  "isProLicenseActive": true,
  "licenseInfo": "p4.0",
  "message": "q Pro license is active"
}
```

### Response Fields

- `isInstalled` (boolean): Indicates if q is installed and accessible on the system
- `isProLicenseActive` (boolean): Indicates if a Pro license is active
- `licenseInfo` (string): The license information string (if available)
- `message` (string): A human-readable message about the license status
- `error` (string, optional): Error message if something went wrong

## Testing the License Verification

### Automated Tests

Run the automated tests with:

```bash
cd lambda/api
npm install
npm test
```

The tests use mocks to simulate different license scenarios.

### Manual Testing

You can manually test the license verification with:

```bash
cd lambda/api
node test/manual-license-check.js
```

This script will directly call the license verification function and display the results.

### Testing After Deployment

After deploying the application, you can test the API endpoint with:

```bash
# Get the API URL from the CloudFormation outputs
API_URL=$(aws cloudformation describe-stacks --stack-name ApiStack --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" --output text)

# Verify the q Pro license
curl -X GET ${API_URL}license/verify
```

## How It Works

The license verification works by:

1. Checking if q is installed using the `which q` command
2. If q is installed, running a q command to get the license information
3. Checking if the license string contains a 'p' character, which indicates a Pro license

## Requirements

- The system where the Lambda function runs must have q installed and accessible in the PATH
- For AWS Lambda, you may need to include the q binary in the deployment package or use a Lambda layer