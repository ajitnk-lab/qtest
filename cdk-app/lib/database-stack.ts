import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export class DatabaseStack extends cdk.Stack {
  // Expose the DynamoDB table as a public property
  public readonly itemsTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create a DynamoDB table with best practices
    this.itemsTable = new dynamodb.Table(this, 'ItemsTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // On-demand capacity for cost optimization
      encryption: dynamodb.TableEncryption.AWS_MANAGED, // Encryption at rest for security
      pointInTimeRecovery: true, // Enable point-in-time recovery for reliability
      removalPolicy: this.node.tryGetContext('environment') === 'production' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY, // Use RETAIN for production, DESTROY for other environments
    });

    // Add GSI for efficient queries by category (example secondary access pattern)
    this.itemsTable.addGlobalSecondaryIndex({
      indexName: 'category-index',
      partitionKey: { name: 'category', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    });

    // Output the table name
    new cdk.CfnOutput(this, 'ItemsTableName', {
      value: this.itemsTable.tableName,
      description: 'The name of the DynamoDB table',
      exportName: 'ItemsTableName',
    });

    // Output the table ARN
    new cdk.CfnOutput(this, 'ItemsTableArn', {
      value: this.itemsTable.tableArn,
      description: 'The ARN of the DynamoDB table',
      exportName: 'ItemsTableArn',
    });
  }
}