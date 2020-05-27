var AWS = require('aws-sdk');

const dbClient = new AWS.DynamoDB.DocumentClient({
  region: 'localhost',
  endpoint: 'http://localhost:8000',
  accessKeyId: 'DEFAULT_ACCESS_KEY',  // needed if you don't have aws credentials at all in env
  secretAccessKey: 'DEFAULT_SECRET' // needed if you don't have aws credentials at all in env
});


const get = async (table, keys) => {
  var params = {
    TableName: table,
    Key: keys
  };
  const record = await dbClient.get(params).promise();
  return record;
}

const put = async (table, item) => {
  var params = {
    TableName: table,
    Item: item
  };
  const record = await dbClient.put(params).promise();
}

const update = async (table, { keys, UpdateExpression, ExpressionAttributeValues, FilterExpression, ExpressionAttributeNames }) => {
  var params = {
    TableName:table,
    Key: keys,
    UpdateExpression: UpdateExpression, //"set published_status = :r",
    ExpressionAttributeValues:ExpressionAttributeValues,
    ExpressionAttributeNames: ExpressionAttributeNames,
    ReturnValues:"UPDATED_NEW"
  };
  const record = await dbClient.update(params).promise();
}

const query = async (table, options) => {
  var params = {
    TableName: table,
    ExpressionAttributeValues: options.ExpressionAttributeValues,
    FilterExpression: options.FilterExpression,
    ExpressionAttributeNames: options.ExpressionAttributeNames
  };
  const records = await dbClient.scan(params).promise();
  return records;
}


module.exports = {
  get,
  put,
  update,
  query
}
