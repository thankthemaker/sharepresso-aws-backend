'use strict'
const AWS = require('aws-sdk')
let doc = new AWS.DynamoDB.DocumentClient()
let coffeesTable = process.env.COFFEES_TABLE

console.log('Loading function')

exports.handler = function (event, context, callback) {
  console.log('request: ' + JSON.stringify(event))
  let coffees = [];
  let cards = [];
  let coffeeparams = {
    TableName: coffeesTable,
    FilterExpression: "billstatus = :billingstatus",
    ExpressionAttributeValues: {
        ':billingstatus': 'selected'
    }
  }

////coffeedata
  console.log('query: ', JSON.stringify(coffeeparams))
  doc.scan(coffeeparams, (err, coffeedata) => {
      if (err) { console.log("Error: " + err); }
    
      console.log("Found coffeedata, item count: " + coffeedata.Items.length);
      coffeedata.Items.forEach(coffee => {
        if(!event.preview) {
          markAsCompleted(doc, coffee);
        }
      });
      
 callback(null, {
        "message": "BillingCompletion succeeded"
    });
 });
}

function markAsCompleted(docClient, coffee) {
  var params = {
    TableName:coffeesTable,
    Key:{
        "cardId": coffee.cardId,
        "timestamp": coffee.timestamp
    },
    UpdateExpression: "set billstatus = :billstatus",
    ExpressionAttributeValues:{
        ":billstatus": "completed"
    },
    ReturnValues:"UPDATED_NEW"
};

  console.log("Updating the item...");
  docClient.update(params, function(err, data) {
    if (err) {
        console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
    } 
  });
}