const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);
const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.TABLE_NAME;
const PRIMARY_KEY = process.env.PRIMARY_KEY;

/**
 * Lambda handler for CRUD operations on items
 */
exports.handler = async function(event, context) {
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
    // Special handling for license verification endpoint
    if (event.resource === '/license/verify' && event.httpMethod === 'GET') {
      body = await verifyQProLicense();
    } else {
      // Regular CRUD operations
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
    }
  } catch (err) {
    if (err.message.startsWith('Unsupported method')) {
      statusCode = 405; // Method Not Allowed
    } else if (err.message === 'Item not found') {
      statusCode = 404; // Not Found
    } else if (err.message === 'Missing item ID') {
      statusCode = 400; // Bad Request
    } else {
      statusCode = 500; // Internal Server Error
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
  
  await dynamodb.put(params).promise();
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

/**
 * Verify if q Pro license is active
 */
async function verifyQProLicense() {
  try {
    // Check if q is installed and accessible
    const { stdout, stderr } = await execPromise('which q');
    
    if (stderr) {
      return {
        isInstalled: false,
        isProLicenseActive: false,
        message: 'q is not installed or not in PATH',
        error: stderr
      };
    }
    
    // Run q command to check license status
    // The command runs q with the -c flag to execute a command and exit
    // The command checks for the presence of a Pro license by examining .z.K (license expiration date)
    const qPath = stdout.trim();
    const { stdout: licenseInfo, stderr: licenseError } = await execPromise(`${qPath} -c "0N!string[.z.l];exit 0"`);
    
    if (licenseError) {
      return {
        isInstalled: true,
        isProLicenseActive: false,
        message: 'Failed to check q license status',
        error: licenseError
      };
    }
    
    // Parse the license information
    // Pro licenses typically have a 'p' character in the license string
    const licenseString = licenseInfo.trim();
    const isProLicense = licenseString.includes('p');
    
    return {
      isInstalled: true,
      isProLicenseActive: isProLicense,
      licenseInfo: licenseString,
      message: isProLicense ? 'q Pro license is active' : 'q Pro license is not active'
    };
  } catch (error) {
    return {
      isInstalled: false,
      isProLicenseActive: false,
      message: 'Error checking q Pro license',
      error: error.message
    };
  }
}