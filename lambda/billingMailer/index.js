var AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});

exports.handler = (event, context, callback) => {
    
    console.log("Billing-Data: " + JSON.stringify(event));

    var SES = new AWS.SES({apiVersion: '2010-12-01'});
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
        var amount = parseFloat(card.sum).toFixed(2);
        console.log(card.email + ": " + amount);   
        if(card.sum > 0.01) {

          let customer = event.balances.find(customer => customer.name === card.givenname + " " + card.surname);
          let balance = customer ? parseFloat(customer.balance.replace(',', '.')).toFixed(2)  : null;
          
          details += card.givenname + " " + card.surname + ": " + amount + " EUR" + (balance != null ? ", Balance " + balance + "\n" : "\n");
          
          if(!event.preview) {
              var mail = createMail(card, startstr, endstr, amount, balance);     
              var sendPromise = SES.sendEmail(mail).promise();
              sendPromise.then(function(data) {
                    console.log("send mail with data: " + JSON.stringify(data));
                    mailResults.push({
                         "messageId": data.MessageId,
                          "email": card.email,
                          "status": "ok"
                    });
                  }).catch(function(err) {
                   console.log("send mail failed, " +  card.email + ", error=" + err);
                   mailResults.push({
                       "email": card.email,
                       "status": err
                    });
                });
          }
        }
    });
    // send summary
    var sendPromise = SES.sendEmail(createSummaryMail(startstr, endstr, sum, details, event.preview)).promise();

    callback(null, Object.assign(
      {
        "message": "Billing succeeded",
        "startdate": event.startdate,
        "enddate": event.enddate,
        "preview": event.preview,
        "results": mailResults
      }, event));    
};


function createMail( card, startstr, endstr, amount, balance) {
    var mailFrom = process.env.MAIL_FROM;
    var mailReplyTo = process.env.MAIL_REPLY_TO;
    
    var params = {
                Destination: { 
                ToAddresses: [
                    //'david@tonysoft.de', 
                    card.email,
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
                            startstr + " bis zum " + endstr + ".<br/><br/>" + 
                            "Betrag (aktueller Abrechnungszeitraum): " +  amount.replace('.', ',') + " Euro<br/>" + 
                            ( balance != null ? (balance > 0.01 ? "Guthaben (vorherige Abrechnungen): " : "Betrag  (vorherige Abrechnungen): ") +  Math.abs(balance).toFixed(2).replace('.', ',') + " Euro<br/>": "") + 
                            "<br/>Du hast folgende Möglichkeiten, den Betrag zu begleichen:<br/>" +
                            "<ul><li>Bar im Büro 5703</li>" +
                            "<li>per Überweisung: IBAN: DE03100100100861201127, Verwendungszweck: " + card.cardId + ", Betrag: " + amount.replace('.', ',') + " EUR</li>" + 
                            "<li>per Paypal: https://www.paypal.me/pbscoffeemaker/" + amount.replace('.', ',') + "</li>" + 
                            "<li>per IOTA: <i>comming soon...</i>" + "</ul><br/></br>" +
                            "Vielen Dank,<br/>Das Coffeemaker-Team<br/><br/>"
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
                    mailReplyTo,
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