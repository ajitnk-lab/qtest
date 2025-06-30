#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DatabaseStack } from '../lib/database-stack';
import { ApiStack } from '../lib/api-stack';

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