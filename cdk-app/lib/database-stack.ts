import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

/**
 * DatabaseStack creates a DynamoDB table with best practices for security, reliability, and cost optimization.
 * 
 * DynamoDB Configuration Analysis:
 * 
 * 1. Billing Mode: PAY_PER_REQUEST (On-Demand)
 *    - Cost Implications: With PAY_PER_REQUEST, you pay per request rather than for provisioned capacity.
 *    - Benefits: 
 *      * No need to predict workload in advance
 *      * Automatically scales up/down with traffic
 *      * Cost-effective for unpredictable or variable workloads
 *      * No minimum capacity charges
 *    - Considerations:
 *      * May be more expensive than provisioned capacity for predictable, steady workloads
 *      * No reserved capacity options for cost savings
 *      * Best for development, new applications, or highly variable workloads
 * 
 * 2. Security Configuration:
 *    - AWS Managed Encryption at rest (SSE)
 *      * Data is automatically encrypted using AWS owned and managed keys
 *      * No additional cost for this encryption
 *      * Meets many compliance requirements (HIPAA, PCI DSS, etc.)
 *    - Access control through IAM policies (implemented in API stack)
 * 
 * 3. Reliability Features:
 *    - Point-in-Time Recovery enabled
 *      * Allows restoration of table data to any point in the last 35 days
 *      * Additional cost of approximately 20% of the base table cost
 *      * Critical for data protection against accidental writes/deletes
 * 
 * 4. Performance Optimization:
 *    - Global Secondary Index for category-based queries
 *      * Enables efficient queries by category and creation date
 *      * With PAY_PER_REQUEST, GSI costs are based on actual usage
 *      * No need to manage separate capacity for the index
 */
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

    // Output the billing mode
    new cdk.CfnOutput(this, 'ItemsTableBillingMode', {
      value: 'PAY_PER_REQUEST (On-Demand)',
      description: 'The billing mode of the DynamoDB table',
      exportName: 'ItemsTableBillingMode',
    });

    // Output the encryption type
    new cdk.CfnOutput(this, 'ItemsTableEncryption', {
      value: 'AWS_MANAGED (SSE)',
      description: 'The encryption type of the DynamoDB table',
      exportName: 'ItemsTableEncryption',
    });

    // Output the point-in-time recovery status
    new cdk.CfnOutput(this, 'ItemsTablePointInTimeRecovery', {
      value: 'Enabled',
      description: 'The point-in-time recovery status of the DynamoDB table',
      exportName: 'ItemsTablePointInTimeRecovery',
    });

    // Output the GSI details
    new cdk.CfnOutput(this, 'ItemsTableGSI', {
      value: 'category-index (partition key: category, sort key: createdAt)',
      description: 'The Global Secondary Index of the DynamoDB table',
      exportName: 'ItemsTableGSI',
    });
  }
}