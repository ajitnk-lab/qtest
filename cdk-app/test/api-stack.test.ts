import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { ApiStack } from '../lib/api-stack';
import { DatabaseStack } from '../lib/database-stack';

describe('ApiStack', () => {
  const app = new cdk.App();
  // Create the database stack first
  const dbStack = new DatabaseStack(app, 'TestDatabaseStack');
  // Create the API stack with a reference to the DynamoDB table
  const apiStack = new ApiStack(app, 'TestApiStack', {
    itemsTable: dbStack.itemsTable
  });
  const template = Template.fromStack(apiStack);

  test('Lambda Function Created', () => {
    // Verify the Lambda function is created with the correct properties
    template.hasResourceProperties('AWS::Lambda::Function', {
      Handler: 'index.handler',
      Runtime: 'nodejs18.x',
      Timeout: 30,
      MemorySize: 256,
      TracingConfig: {
        Mode: 'PassThrough'
      },
      Environment: {
        Variables: {
          TABLE_NAME: {
            'Fn::ImportValue': {
              'Fn::Join': [
                '',
                [
                  {
                    Ref: 'TestDatabaseStack'
                  },
                  ':ItemsTableName'
                ]
              ]
            }
          },
          PRIMARY_KEY: 'id'
        }
      }
    });
  });

  test('API Gateway REST API Created', () => {
    // Verify the API Gateway REST API is created
    template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
    
    // Verify the API Gateway has deployment options with logging disabled
    template.hasResourceProperties('AWS::ApiGateway::Stage', {
      StageName: 'prod'
    });
    
    // Verify that logging settings are not present
    template.hasResource('AWS::ApiGateway::Stage', {
      Properties: {
        MethodSettings: Match.absent()
      }
    });
  });

  test('API Gateway Methods Created', () => {
    // Verify the API Gateway methods are created
    template.resourceCountIs('AWS::ApiGateway::Method', 5);
  });
});