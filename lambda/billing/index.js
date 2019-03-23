'use strict'
const AWS = require('aws-sdk')
let doc = new AWS.DynamoDB.DocumentClient()
let doc2 = new AWS.DynamoDB.DocumentClient()
let coffeesTable = process.env.COFFEES_TABLE
let cardsTable = process.env.CARDS_TABLE
let selectStatus = process.env.SELECT_STATUS


console.log('Loading function')

exports.handler = function (event, context, callback) {
  console.log('request: ' + JSON.stringify(event))
  let coffees = [];
  let cards = [];
  let coffeeparams = {
    TableName: coffeesTable,
    FilterExpression: "attribute_not_exists(billstatus)"
//    KeyConditionExpression: 'cardId = :key',
//    ExpressionAttributeValues: { ':key': event.requestContext.identity.cognitoIdentityId }
  }
  let cardparams = {
    TableName: cardsTable,
//    KeyConditionExpression: 'cardId = :key',
//    ExpressionAttributeValues: { ':key': event.requestContext.identity.cognitoIdentityId }
  }

  console.log('query: ', JSON.stringify(cardparams)); 
  doc.scan(cardparams, (err, carddata) => {
    if (err) { console.log("Error: " + err); }
    console.log("Found carddata, item count: " + carddata.Items.length);
    carddata.Items.forEach(card => {
      let newCard = {
              "cardId": card.cardId,
              "email": card.email,
              "surname": card.surname,
              "givenname": card.givenname,
              "sum": 0,
              coffees: []
          };
      cards.push(newCard);
    });
    
    
////coffeedata
  console.log('query: ', JSON.stringify(coffeeparams))
  doc2.scan(coffeeparams, (err, coffeedata) => {
      if (err) { console.log("Error: " + err); }
    
      console.log("Found coffeedata, item count: " + coffeedata.Items.length);
      console.log("Date range: " + event.startdate + "-" + event.enddate);
      coffeedata.Items.forEach(coffee => {
        if(new Date(coffee.timestamp).toISOString() > event.startdate && 
           new Date(coffee.timestamp).toISOString() < event.enddate) {
               //console.log(JSON.stringify(coffee));
               coffees.push(coffee);
               if(!event.preview) {
                 markAsSelected(doc2, coffee);
               }
        }
      });
      
      console.log(coffees.length + "coffee items matched time range")
      
      cards.forEach(card => {
          coffees.forEach(coffee => {
              //console.log("Coffee: " + JSON.stringify(coffee));
              if(coffee.cardId === card.cardId) {
                  card.sum += coffee.payload.price;
                  //card.coffees.push(coffee);
              }
          });
      }); 
    //console.log("Result:" + JSON.stringify(cards));
    callback(null, Object.assign(
      {
        "startdate": event.startdate,
        "enddate": event.enddate,
        "preview": event.preview,
        "balances": event.balances,
        "cards": cards
        
      }, event));
 });
////coffeedata    
  });
}

function markAsSelected(docClient, coffee) {
  var params = {
    TableName:coffeesTable,
    Key:{
        "cardId": coffee.cardId,
        "timestamp": coffee.timestamp
    },
    UpdateExpression: "set billstatus = :status",
    ExpressionAttributeValues:{
        ":status": selectStatus
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