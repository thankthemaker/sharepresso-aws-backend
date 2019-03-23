const { google } = require('googleapis');
const sheets = google.sheets('v4')
const path = require('path');
const fs = require('fs');

const keyfile = path.join(__dirname, process.env.CREDENTIALS_FILE);
const KEY = JSON.parse(fs.readFileSync(keyfile));

let jwtClient = new google.auth.JWT(
  KEY.client_email,
  null,
  KEY.private_key,
  [
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/spreadsheets.readonly'
  ],
  null
)

exports.handler = (event, context, callback) => {

  console.log("Event: " + JSON.stringify(event));
  //console.log("Context: " + JSON.stringify(context));


  jwtClient.authorize((err, tokens) => {
    if (err) {
      console.log(err)
      return callback(err)
    }

    let jokes =  [];

    sheets.spreadsheets.values.get({
          auth: jwtClient,
          spreadsheetId: process.env.SPREADSHEET_ID,
          range: process.env.RANGE
        }, (err, result) => {
      if(err) {
        console.log(err)
        callback(null, Object.assign(
          {
            "value": null,
            "err": err            
          }, event));
      } else {
        jokes = result.data.values.map(customer => {
          return {
              "id": customer[0],
              "joke": customer[1]    
          }        
        });
        callback(null, Object.assign(
          {
            "value": jokes            
          }, event));
      }
    });
  });
};
