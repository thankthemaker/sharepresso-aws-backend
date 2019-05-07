'use strict'
const AWS = require('aws-sdk')
let doc = new AWS.DynamoDB.DocumentClient()
let coffeesTable = process.env.COFFEES_TABLE

console.log('Loading function')

exports.handler = function (event, context, callback) {
  console.log('request: ' + JSON.stringify(event))
  handleHttpMethod(event, context)
}

function handleHttpMethod (event, context) {
  let httpMethod = event.httpMethod
  if (event.path.match(/^\/coffees/)) {
    if (httpMethod === 'GET') {
      return handleGET(event, context)
    } 
  } 
  return errorResponse(context, 'Unhandled http method:', httpMethod)
}

function handleGET (event, context) {
  let params = {
    TableName: coffeesTable,
      FilterExpression: "attribute_not_exists(billstatus)"
//    KeyConditionExpression: 'cardId = :key',
//    ExpressionAttributeValues: { ':key': event.requestContext.identity.cognitoIdentityId }
  }


  console.log('GET query: ', JSON.stringify(params))
  var coffeeScan = new Promise(function(resolve, reject) {
      var coffees = []
      var onScan = (err, coffeedata) => {
        if (err) { return errorResponse(context, 'Error: ', err) }
        
        coffees = coffees.concat(coffeedata.Items)

        if (typeof coffeedata.LastEvaluatedKey != "undefined") {
        console.log("Scanning for more...");
        console.log("coffeedata LastEvaluatedKey: " + JSON.stringify(coffeedata.LastEvaluatedKey));
        params.ExclusiveStartKey = coffeedata.LastEvaluatedKey;
        console.log('query: ', JSON.stringify(params))
        doc.scan(params, onScan);
      } else {
        return resolve(coffeedata.Items);
      }
    }
    console.log('query: ', JSON.stringify(params))
    doc.scan(params, onScan);
  });
  
  coffeeScan.then((coffees) => {
        return successResponse(context, {coffees: coffees})
  });
}


function errorResponse (context, logline) {
  let response = { statusCode: 404, body: JSON.stringify({ 'Error': 'Could not execute request' }) }
  let args = Array.from(arguments).slice(1)
  console.log.apply(null, args)
  context.succeed(response)
}

function successResponse (context, body) {
  let response = { statusCode: 200, body: JSON.stringify(body), headers: { 'Access-Control-Allow-Origin': '*' } }
  console.log('response: ' + JSON.stringify(response))
  context.succeed(response)
}
