var AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});

exports.handler = (event, context, callback) => {
    
    console.log("Billing-Data: " + JSON.stringify(event));

    var startdate = new Date(event.startdate);
    var enddate = new Date(event.enddate);
    var startstr = startdate.getDate() + "." + (startdate.getMonth()+1) + "." + startdate.getFullYear();
    var endstr = enddate.getDate() + "." + (enddate.getMonth()+1) + "." + enddate.getFullYear();
    var sum = 0;
    var mailResults = [];
    var details = "";
    
    // send individual mails 
    event.cards.forEach(card => {
        sum += card.sum;
        var amount = parseFloat(card.sum).toFixed(2).replace('.', ',');
        console.log(card.email + ": " + amount);      
        details += card.givenname + " " + card.surname + ": " + amount + "\n"
        if(!event.preview) {
            var mail = createMail(card, startstr, endstr, amount);     
            var sendPromise = new AWS.SES({apiVersion: '2010-12-01'}).sendEmail(mail).promise();
            sendPromise.then(
              function(data) {
                  console.log("send mail with id: " + data.MessageId);
                  mailResults.push({
                       "messageId": data.MessageId,
                        "email": card.email,
                     "status": "ok"
                  });
                }).catch(
                function(err) {
                 console.error(err, err.stack);
                 mailResults.push({
                     "messageId": "",
                     "email": card.email,
                     "status": err
                  });
              });
        }
    })
    // send summary
    var sendPromise = new AWS.SES({apiVersion: '2010-12-01'}).sendEmail(createSummaryMail(startstr, endstr, sum, details, event.preview)).promise();

    callback(null, Object.assign(
      {
        "message": "Billing succeeded",
        "startdate": event.startdate,
        "enddate": event.enddate,
        "preview": event.preview,
        "results": mailResults
      }, event));    
};


function createMail( card, startstr, endstr, amount) {
    var mailFrom = process.env.MAIL_FROM;
    var mailReplyTo = process.env.MAIL_REPLY_TO;
    
    var params = {
                Destination: { 
                ToAddresses: [
                    '<YOUR_MAILADDRESS>',
                ],
//                CcAddresses: [
//                    'EMAIL_ADDRESS',
//                ]
            },
            Message: { 
                Body: { 
                    Html: {
                        Charset: "UTF-8",
                        Data: "<html><body>Hallo " + card.givenname + 
                            ",<br/><br/>anbei erhälst Du Deine Kaffee-Abrechnung für den Zeitraum vom " +
                            startstr + " bis zum " + endstr + ".<br/><br/>Betrag: " + 
                            amount + " Euro<br/><br/>Bitte begleiche den Betrag im Büro 5703<br/><br/>" +
                            "oder verwende Paypal<br/><br/>" +
                            "https://www.paypal.me/pbscoffeemaker/" + amount + "<br/><br/>" +
                            "Vielen Dank,<br/>Das Coffeemaker-Team</body></html>"
                    },
                Text: {
                    Charset: "UTF-8",
                    Data: "Hallo " + card.givenname + 
                        ",\n\nanbei erhälst Du Deine Kaffee-Abrechnung für den Zeitraum vom " +
                        startstr + " bis zum " + endstr + ".\n\nBetrag: " + 
                        amount + " Euro\n\nBitte begleiche den Betrag im Büro 5703\n\n" + 
                        "oder verwende Paypal\n\n" +
                        "https://www.paypal.me/pbscoffeemaker/" + amount +  "\n\n" +                     
                        "Vielen Dank,\nDas Coffeemaker-Team"
                }
            },
            Subject: {
                Charset: 'UTF-8',
                Data: 'Kaffee-Abrechnung: Zeitraum ' + startstr + " - " + endstr
            }
        },
        Source: mailFrom, 
        ReplyToAddresses: [
            mailReplyTo,
        ],
        }; 
        return params;
}

function createSummaryMail(startstr, endstr, sum, details, preview) {
    var mailFrom = process.env.MAIL_FROM;
    var mailReplyTo = process.env.MAIL_REPLY_TO;
    
    var prefix = preview ? 'Vorschau:' : '';
    
    var params = {
                Destination: { 
                ToAddresses: [
                    '<YOUR_MAILADDRESS>',
                ]
            },
            Message: { 
                Body: { 
                Text: {
                    Charset: "UTF-8",
                    Data: "Hallo,\n\nder Gesamtbetrag der Kaffee-Abrechnung für den Zeitraum vom " +
                        startstr + " bis zum " + endstr + " beträgt:\n\nBetrag: " + 
                        parseFloat(sum).toFixed(2).replace('.', ',') + " Euro\n\n" + 
                        "Einzelaufstellung:\n\n" + details +
                        "\nVielen Dank,\nDas Coffeemaker-Team"
                }
            },
            Subject: {
                Charset: 'UTF-8',
                Data: prefix + 'Kaffee-Gesamtabrechnung: Zeitraum ' + startstr + " - " + endstr
            }
        },
        Source: mailFrom, 
        ReplyToAddresses: [
            mailReplyTo,
        ],
        }; 
        return params;
}