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
  jwtClient.authorize((err, tokens) => {
    if (err) {
      console.log(err)
      return callback(err)
    }

    const body = {
      values: event
    }

    let balances =  [];

    sheets.spreadsheets.values.get({
          auth: jwtClient,
          spreadsheetId: process.env.SPREADSHEET_ID,
          range: process.env.RANGE
        }, (err, result) => {
      if(err) {
        console.log(err)
        callback(null, Object.assign(
          {
            "startdate": event.startdate,
            "enddate": event.enddate,
            "preview": event.preview,
            "balances": null,
            "err": err            
          }, event));
      } else {
        balances = result.data.values.map(customer => {
          return {
              "name": customer[0],
              "balance": customer[1]    
          }        
        });
 //       console.log(JSON.stringify(balances));
//        callback(null, {"statusCode": result.statuscode, "balances": result.data.values})
        callback(null, Object.assign(
          {
            "startdate": event.startdate,
            "enddate": event.enddate,
            "preview": event.preview,
            "balances": balances            
          }, event));
      }
    });
  });
};
