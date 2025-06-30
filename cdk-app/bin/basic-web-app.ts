#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DatabaseStack } from '../lib/database-stack';
import { ApiStack } from '../lib/api-stack';

/**
 * Main CDK application entry point.
 * 
 * AWS Account Context:
 * 
 * This application is designed to be deployed to AWS account 637423202175 in the us-west-2 region.
 * The DatabaseStack is deployed with the stack name 'DatabaseStack' and has the ARN:
 * arn:aws:cloudformation:us-west-2:637423202175:stack/DatabaseStack/d755f3d0-55a3-11f0-8bd9-0adf45225d1d
 * 
 * The DynamoDB table created by the DatabaseStack has the name:
 * DatabaseStack-ItemsTable5AAC2C46-1DQY093GIC24B
 * 
 * Security Considerations:
 * - The application follows the principle of least privilege for IAM permissions
 * - DynamoDB tables are encrypted at rest using AWS managed keys
 * - API Gateway has logging enabled for auditing and troubleshooting
 * - Lambda functions have X-Ray tracing enabled for observability
 * 
 * Cost Implications:
 * - DynamoDB is configured with PAY_PER_REQUEST billing mode, which means:
 *   * You pay only for what you use (read/write requests and storage)
 *   * No need to provision capacity in advance
 *   * Costs scale automatically with usage
 *   * May be more expensive than provisioned capacity for predictable workloads
 * - Point-in-time recovery adds approximately 20% to the base DynamoDB cost
 * - Lambda functions are billed based on invocation count and duration
 * - API Gateway is billed based on request count and data transfer
 */
const app = new cdk.App();

// Create the database stack
const databaseStack = new DatabaseStack(app, 'DatabaseStack', {
  description: 'DynamoDB table for the basic web app',
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

// Create the API stack that depends on the database stack
new ApiStack(app, 'ApiStack', {
  description: 'API Gateway and Lambda functions for the basic web app',
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  // Pass the table from the database stack to the API stack
  itemsTable: databaseStack.itemsTable,
});

app.synth();