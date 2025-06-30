# Basic Web App with AWS CDK

This project implements a serverless web application using AWS CDK with the following components:

- **AWS Lambda** - For serverless compute
- **Amazon API Gateway** - For REST API endpoints
- **Amazon DynamoDB** - For data storage

The application follows AWS Well-Architected Framework principles.

## AWS Well-Architected Framework Implementation

This project follows AWS Well-Architected Framework best practices:

1. **Operational Excellence**
   - Comprehensive logging with CloudWatch
   - X-Ray tracing for Lambda functions
   - Infrastructure as Code with AWS CDK

2. **Security**
   - Least privilege IAM permissions
   - DynamoDB encryption at rest
   - API Gateway request validation

3. **Reliability**
   - DynamoDB point-in-time recovery
   - Lambda function error handling
   - API Gateway throttling

4. **Performance Efficiency**
   - DynamoDB on-demand capacity
   - Lambda function memory optimization
   - API Gateway caching capabilities

5. **Cost Optimization**
   - Serverless pay-per-use model
   - Right-sized Lambda functions
   - DynamoDB on-demand pricing

## Prerequisites

- Node.js 14.x or later
- AWS CLI configured with appropriate credentials
- AWS CDK v2 installed (`npm install -g aws-cdk`)

## Project Structure

```
/workspace
├── README.md
├── cdk-app/                 # CDK application code
│   ├── bin/                 # CDK app entry point
│   │   └── basic-web-app.ts # Main CDK application
│   ├── lib/                 # CDK stacks
│   │   ├── database-stack.ts # DynamoDB stack
│   │   └── api-stack.ts     # API Gateway and Lambda stack
│   ├── lambda/              # Lambda function code
│   │   └── api/             # API handlers
│   │       ├── index.js     # Lambda function implementation
│   │       └── package.json # Lambda dependencies
│   └── test/                # Unit tests
│       ├── database-stack.test.ts
│       └── api-stack.test.ts
```

## Getting Started

1. Navigate to the CDK app directory:
   ```
   cd cdk-app
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Install Lambda function dependencies:
   ```
   cd lambda/api
   npm install
   cd ../..
   ```

4. Run the tests:
   ```
   npm test
   ```

5. Bootstrap your AWS environment (if not already done):
   ```
   cdk bootstrap
   ```

6. Deploy the application:
   ```
   cdk deploy --all
   ```

## API Endpoints

The application provides a simple CRUD API for managing items:

- `GET /items` - List all items
- `GET /items/{id}` - Get a specific item
- `POST /items` - Create a new item
- `PUT /items/{id}` - Update an item
- `DELETE /items/{id}` - Delete an item

## Item Schema

Items have the following structure:

```json
{
  "id": "unique-identifier",
  "name": "Item name",
  "description": "Item description",
  "category": "Item category",
  "price": 19.99,
  "createdAt": "2023-05-20T12:00:00Z",
  "updatedAt": "2023-05-20T12:30:00Z"
}
```

## Testing the API

After deployment, you can test the API using curl or any API client:

```bash
# Get the API URL from the CloudFormation outputs
API_URL=$(aws cloudformation describe-stacks --stack-name ApiStack --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" --output text)

# Create a new item
curl -X POST ${API_URL}items -H "Content-Type: application/json" -d '{"name": "Test Item", "description": "A test item", "category": "test", "price": 9.99}'

# List all items
curl -X GET ${API_URL}items

# Get a specific item
curl -X GET ${API_URL}items/{id}

# Update an item
curl -X PUT ${API_URL}items/{id} -H "Content-Type: application/json" -d '{"name": "Updated Item", "description": "An updated item", "category": "test", "price": 19.99}'

# Delete an item
curl -X DELETE ${API_URL}items/{id}
```

## Cleanup

To avoid incurring charges, delete the deployed resources when no longer needed:

```
cdk destroy --all
```