exports.handler = async (event) => {
  const AWS = require("aws-sdk");
  const dynamoDB = new AWS.DynamoDB.DocumentClient();
  const TABLE_NAME = process.env.TABLE_NAME;

  try {
    const updateParams = {
      TableName: TABLE_NAME,
      Key: { id: "visitors" },
      UpdateExpression: "ADD #count :incr",
      ExpressionAttributeNames: { "#count": "count" },
      ExpressionAttributeValues: { ":incr": 1 },
      ReturnValues: "UPDATED_NEW",
    };

    const result = await dynamoDB.update(updateParams).promise();
    const count = result.Attributes.count;

    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
      "Content-Type": "application/json",
    };

    return {
      statusCode: 200,
      headers: headers,
      body: JSON.stringify({
        visitors: count,
        message: "Visitor count updated successfully!",
      }),
    };
  } catch (error) {
    console.error("Error updating visitor count:", error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Error updating visitor count",
        error: error.message,
      }),
    };
  }
};
