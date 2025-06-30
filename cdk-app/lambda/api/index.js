const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.TABLE_NAME;
const PRIMARY_KEY = process.env.PRIMARY_KEY;

/**
 * Lambda handler for CRUD operations on items
 */
exports.handler = async function(event, context) {
  console.log('Request event:', JSON.stringify(event));
  
  let body;
  let statusCode = 200;
  const headers = {
    'Content-Type': 'application/json',
    // Enable CORS
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'OPTIONS,GET,POST,PUT,DELETE'
  };

  try {
    switch(event.httpMethod) {
      case 'GET':
        if (event.pathParameters && event.pathParameters.id) {
          // Get a specific item by ID
          body = await getItem(event.pathParameters.id);
        } else {
          // List all items
          body = await listItems();
        }
        break;
      case 'POST':
        // Create a new item
        body = await createItem(JSON.parse(event.body));
        break;
      case 'PUT':
        // Update an existing item
        if (event.pathParameters && event.pathParameters.id) {
          body = await updateItem(event.pathParameters.id, JSON.parse(event.body));
        } else {
          throw new Error('Missing item ID');
        }
        break;
      case 'DELETE':
        // Delete an item
        if (event.pathParameters && event.pathParameters.id) {
          body = await deleteItem(event.pathParameters.id);
        } else {
          throw new Error('Missing item ID');
        }
        break;
      default:
        throw new Error(`Unsupported method: "${event.httpMethod}"`);
    }
  } catch (err) {
    console.error('Error:', err);
    statusCode = 400;
    body = { error: err.message };
  }

  return {
    statusCode,
    body: JSON.stringify(body),
    headers
  };
};

/**
 * Get a specific item by ID
 */
async function getItem(id) {
  const params = {
    TableName: TABLE_NAME,
    Key: {
      [PRIMARY_KEY]: id
    }
  };
  
  const response = await dynamodb.get(params).promise();
  
  if (!response.Item) {
    throw new Error('Item not found');
  }
  
  return response.Item;
}

/**
 * List all items
 */
async function listItems() {
  const params = {
    TableName: TABLE_NAME
  };
  
  const response = await dynamodb.scan(params).promise();
  return response.Items;
}

/**
 * Create a new item
 */
async function createItem(item) {
  // Generate a unique ID if not provided
  if (!item[PRIMARY_KEY]) {
    item[PRIMARY_KEY] = uuidv4();
  }
  
  // Add timestamp
  item.createdAt = new Date().toISOString();
  
  const params = {
    TableName: TABLE_NAME,
    Item: item,
    // Ensure the item doesn't already exist
    ConditionExpression: `attribute_not_exists(${PRIMARY_KEY})`
  };
  
  await dynamodb.put(params).promise();
  return item;
}

/**
 * Update an existing item
 */
async function updateItem(id, item) {
  // Ensure the ID in the path matches the item
  item[PRIMARY_KEY] = id;
  
  // Add updated timestamp
  item.updatedAt = new Date().toISOString();
  
  const params = {
    TableName: TABLE_NAME,
    Item: item,
    // Ensure the item exists
    ConditionExpression: `attribute_exists(${PRIMARY_KEY})`
  };
  
// Import the AWS SDK for DynamoDB DocumentClient
// This allows for safer parameter handling and query execution
const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();

async function updateItem(id, item) {
  // Ensure the ID in the path matches the item
  item[PRIMARY_KEY] = id;
  
  // Add updated timestamp
  item.updatedAt = new Date().toISOString();
  
  const params = {
    TableName: TABLE_NAME,
    Item: AWS.DynamoDB.Converter.marshall(item),
    // Ensure the item exists
    ConditionExpression: `attribute_exists(${PRIMARY_KEY})`
  };
  
  await docClient.put(params).promise();
  return item;
}
  return item;
}

/**
 * Delete an item
 */
async function deleteItem(id) {
  const params = {
    TableName: TABLE_NAME,
    Key: {
      [PRIMARY_KEY]: id
    },
    // Ensure the item exists
    ConditionExpression: `attribute_exists(${PRIMARY_KEY})`,
    // Return the deleted item
    ReturnValues: 'ALL_OLD'
  };
  
  const response = await dynamodb.delete(params).promise();
  return response.Attributes;
}