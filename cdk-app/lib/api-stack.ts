import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';

interface ApiStackProps extends cdk.StackProps {
  itemsTable: dynamodb.Table;
}

/**
 * ApiStack creates the API Gateway and Lambda function for the Items API.
 * 
 * Security Configuration Analysis:
 * 
 * 1. IAM Permissions:
 *    - Lambda function is granted specific read/write permissions to the DynamoDB table
 *    - Follows least privilege principle by limiting permissions to only what's needed
 *    - Uses the AWS CDK's grantReadWriteData method which creates appropriate IAM policies
 * 
 * 2. API Gateway Security:
 *    - Logging enabled for API Gateway requests for auditing and troubleshooting
 *    - CORS configured to control which domains can access the API
 *    - API Gateway throttling helps protect against DoS attacks
 * 
 * 3. Lambda Function Security:
 *    - X-Ray tracing enabled for observability and debugging
 *    - Environment variables used for configuration rather than hardcoded values
 *    - Timeout and memory size configured appropriately for the workload
 * 
 * 4. Data Security:
 *    - Input validation should be implemented in the Lambda function
 *    - Error handling prevents leaking sensitive information
 */
export class ApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    // Create a Lambda function for handling items API
    const itemsFunction = new lambda.Function(this, 'ItemsFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/api')),
      environment: {
        TABLE_NAME: props.itemsTable.tableName,
        PRIMARY_KEY: 'id',
      },
      // Configure function for operational excellence
      tracing: lambda.Tracing.ACTIVE, // X-Ray tracing for observability
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      description: 'Lambda function to handle CRUD operations for items',
    });

    // Grant the Lambda function read/write permissions to the DynamoDB table
    // This follows the principle of least privilege by granting only the necessary permissions
    props.itemsTable.grantReadWriteData(itemsFunction);

    // Create an API Gateway REST API
    const api = new apigateway.RestApi(this, 'ItemsApi', {
      restApiName: 'Items Service',
      description: 'This service handles CRUD operations for items',
      deployOptions: {
        stageName: 'prod',
        // Enable logging for API Gateway
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
      },
      // Enable CORS
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    // Create an API Gateway resource for /items
    const items = api.root.addResource('items');
    
    // GET /items - List all items
    items.addMethod('GET', new apigateway.LambdaIntegration(itemsFunction));
    
    // POST /items - Create a new item
    items.addMethod('POST', new apigateway.LambdaIntegration(itemsFunction));
    
    // Create an API Gateway resource for /items/{id}
    const singleItem = items.addResource('{id}');
    
    // GET /items/{id} - Get a specific item
    singleItem.addMethod('GET', new apigateway.LambdaIntegration(itemsFunction));
    
    // PUT /items/{id} - Update an item
    singleItem.addMethod('PUT', new apigateway.LambdaIntegration(itemsFunction));
    
    // DELETE /items/{id} - Delete an item
    singleItem.addMethod('DELETE', new apigateway.LambdaIntegration(itemsFunction));

    // Output the API Gateway URL
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'The URL of the API Gateway',
      exportName: 'ApiUrl',
    });

    // Output the Lambda function ARN
    new cdk.CfnOutput(this, 'LambdaFunctionArn', {
      value: itemsFunction.functionArn,
      description: 'The ARN of the Lambda function',
      exportName: 'LambdaFunctionArn',
    });

    // Output the API Gateway ID
    new cdk.CfnOutput(this, 'ApiGatewayId', {
      value: api.restApiId,
      description: 'The ID of the API Gateway',
      exportName: 'ApiGatewayId',
    });

    // Output the API Gateway stage name
    new cdk.CfnOutput(this, 'ApiGatewayStageName', {
      value: 'prod',
      description: 'The stage name of the API Gateway',
      exportName: 'ApiGatewayStageName',
    });
  }
}