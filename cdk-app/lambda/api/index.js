const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.TABLE_NAME;
const PRIMARY_KEY = process.env.PRIMARY_KEY;

/**
 * Lambda handler for CRUD operations on items
 */
exports.handler = async function(event, context) {
// Import DOMPurify for sanitizing user input
// DOMPurify is a DOM-only, super-fast, uber-tolerant XSS sanitizer for HTML, MathML and SVG
const DOMPurify = require('dompurify');

exports.handler = async function(event, context) {
  console.log('Request event:', JSON.stringify(DOMPurify.sanitize(event)));
  
  let body;
  let statusCode = 200;
  
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
// Import Ajv for JSON schema validation
    // const Ajv = require("ajv");
    // const ajv = new Ajv();

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
        // Define a schema for the expected input
        const schema = {
          type: "object",
          properties: {
            // Define your expected properties here
          },
          required: ["name"] // Add required fields
        };
        const validate = ajv.compile(schema);
        if (validate(JSON.parse(event.body))) {
          body = await createItem(JSON.parse(event.body));
        } else {
          throw new Error('Invalid input');
        }
        break;
      case 'PUT':
        // Update an existing item
        if (event.pathParameters && event.pathParameters.id) {
          body = await updateItem(event.pathParameters.id, JSON.parse(event.body));
        } else {
          throw new Error('Missing item ID');
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
}
  } catch (err) {
    console.error('Error:', err);
    if (err instanceof Error && err.message.startsWith('Unsupported method')) {
      statusCode = 405; // Method Not Allowed
    } else if (err instanceof Error && err.message === 'Item not found') {
      statusCode = 404; // Not Found
    } else if (err instanceof Error && err.message === 'Missing item ID') {
      statusCode = 400; // Bad Request
    } else {
      statusCode = 500; // Internal Server Error
    }
    body = { error: err.message };
  }
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
const response = await dynamodb.get(params).promise();
  
  if (!response.Item) {
    const error = new Error('Item not found');
    error.statusCode = 404;
    throw error;
  }
  
  return response.Item;
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
  
TableName: TABLE_NAME
  };
  
  try {
    const response = await dynamodb.scan(params).promise();
    return response.Items;
  } catch (error) {
    console.error('Error scanning DynamoDB:', error);
    throw new Error('Failed to list items');
  }
}

/**
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
  
// Import the DynamoDB DocumentClient for safer query operations
// import { DynamoDB } from 'aws-sdk';
// const dynamodb = new DynamoDB.DocumentClient();

async function createItem(item) {
  // Generate a unique ID if not provided
  if (!item[PRIMARY_KEY]) {
    item[PRIMARY_KEY] = uuidv4();
  }
  
  // Add timestamp
  item.createdAt = new Date().toISOString();
  
  const params = {
    TableName: TABLE_NAME,
    Item: dynamodb.marshall(item), // Sanitize input using marshall
    // Ensure the item doesn't already exist
    ConditionExpression: `attribute_not_exists(${PRIMARY_KEY})`
  };
  
  await dynamodb.putItem(params).promise();
  return item;
}
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
  
ReturnValues: 'ALL_OLD'
  };
  
  try {
    const response = await dynamodb.delete(params).promise();
    return response.Attributes;
  } catch (error) {
    if (error.name === 'ConditionalCheckFailedException') {
      throw new Error('Item not found');
    }
    throw error;
  }
}
  return response.Attributes;
}